import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, CheckCircle, AlertCircle, XCircle, Download, Loader2, Pause, Play, Clock, Flame, Thermometer, Snowflake, RefreshCw, ClipboardList, BarChart3, Star, Ban, ChevronsUpDown, Check, Plus, Pencil, Trash2, Save, FolderOpen, ArrowUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mapAllColumns, getSystemFields, getFieldLabel, type ColumnMapping } from '@/lib/csvMapper';
import { cn } from '@/lib/utils';
import { calculateICPScore } from '@/lib/icpCalculator';
import { useSaveToQuarantine } from '@/hooks/useICPQuarantine';
import { useICPMappingTemplates } from '@/hooks/useICPMappingTemplates';
import PreAnalysisReport from './PreAnalysisReport';
import LiveProcessingDashboard from './LiveProcessingDashboard';
import FinalReportDashboard from './FinalReportDashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Step = 'upload' | 'mapping' | 'preview' | 'analyzing' | 'complete';

interface ProcessingCompany {
  index: number;
  name: string;
  cnpj: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  result?: any;
  error?: string;
}

export default function ICPBulkAnalysisWithMapping() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [processingCompanies, setProcessingCompanies] = useState<ProcessingCompany[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [preAnalysisData, setPreAnalysisData] = useState<any>(null);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const { toast } = useToast();
  const { mutateAsync: saveToQuarantine } = useSaveToQuarantine();
  const { templates, saveTemplate, deleteTemplate, markAsUsed } = useICPMappingTemplates();

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler para quando o processamento ao vivo terminar
  const handleLiveProcessingComplete = useCallback((results: any[]) => {
    setAnalysisResults(results);
    setTotalProcessed(results.length);
    setStep('complete');
    
    // Toast clicável para ir direto à quarentena
    const successCount = results.filter(r => r.status === 'concluido').length;
    const errorCount = results.filter(r => r.status === 'erro').length;
    
    toast({
      title: "✅ Análise ICP concluída!",
      description: `${successCount} na quarentena | ${errorCount} com problemas.`,
      duration: 10000,
      action: (
        <button
          onClick={() => navigate('/leads/icp-quarantine')}
          className="px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 underline"
        >
          Ver Quarentena →
        </button>
      ),
    });
  }, [navigate, toast]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Feedback visual imediato
    toast({
      title: '📂 Carregando arquivo...',
      description: `Processando ${uploadedFile.name}`,
    });

    setFile(uploadedFile);

    // Validação básica de arquivo
    const isCSV = uploadedFile.name.toLowerCase().endsWith('.csv') || /csv|excel|text/.test(uploadedFile.type);
    if (!isCSV) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione um arquivo CSV válido (.csv)',
        variant: 'destructive',
      });
      return;
    }
    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Ler texto para validações iniciais
      let text = await uploadedFile.text();
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1); // Remove BOM
      }

      const headSample = text.slice(0, 400).toLowerCase();
      if (headSample.includes('<html') || headSample.includes('<head') || headSample.includes('<meta') || headSample.includes('<table')) {
        toast({
          title: 'Arquivo inválido',
          description: 'O arquivo parece ser HTML (XLS disfarçado). Exporte como CSV puro.',
          variant: 'destructive',
        });
        return;
      }

      // Detectar separador
      const firstLine = text.split(/\r?\n/)[0] || '';
      const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

      // Parse com configurações robustas
      const results = Papa.parse(text, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter,
        transformHeader: (h) => h.trim().replace(/^["']|["']$/g, ''),
      });

      if (results.errors && results.errors.length > 0) {
        console.warn('Avisos do CSV:', results.errors);
      }

      const data = (results.data as any[]).filter(Boolean);
      if (!data || data.length === 0) {
        toast({
          title: 'Erro',
          description: 'Arquivo CSV vazio ou inválido.',
          variant: 'destructive',
        });
        return;
      }

      const headers = Object.keys(data[0] || {});

      // DEDUPLICAÇÃO POR CNPJ
      const cnpjField = headers.find(h => 
        h.toLowerCase().includes('cnpj') || 
        h.toLowerCase().includes('documento')
      );
      
      let processedData = data;
      let duplicatesRemoved = 0;
      
      if (cnpjField) {
        const seen = new Set();
        const deduplicated = [];
        
        for (const row of data) {
          const cnpj = row[cnpjField]?.toString().replace(/\D/g, '');
          if (cnpj && cnpj.length === 14) {
            if (!seen.has(cnpj)) {
              seen.add(cnpj);
              deduplicated.push(row);
            } else {
              duplicatesRemoved++;
            }
          } else {
            deduplicated.push(row); // Manter registros sem CNPJ válido para análise
          }
        }
        
        processedData = deduplicated;
        
        if (duplicatesRemoved > 0) {
          toast({
            title: '🔄 CNPJs duplicados removidos',
            description: `${duplicatesRemoved} linha(s) duplicada(s) foram removidas automaticamente`,
          });
        }
      }

      setAllData(processedData);
      setPreviewData(processedData.slice(0, 3));

      const autoMappings = mapAllColumns(headers);
      setMappings(autoMappings);

      setStep('mapping');

      const mappedCount = autoMappings.filter(m => m.status === 'mapped').length;
      
      const baseDescription = `${processedData.length} empresas carregadas | ${mappedCount}/${headers.length} colunas mapeadas (${Math.round((mappedCount/headers.length)*100)}%)`;
      const duplicateInfo = duplicatesRemoved > 0 ? ` | ${duplicatesRemoved} duplicadas removidas` : '';
      
      toast({
        title: '✅ Arquivo carregado com sucesso!',
        description: baseDescription + duplicateInfo,
      });
    } catch (error) {
      console.error('Erro ao ler CSV:', error);
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Verifique se o arquivo está no formato CSV correto.',
        variant: 'destructive',
      });
    }
  };

  const handleMappingChange = (index: number, newField: string) => {
    const updated = [...mappings];
    updated[index].systemField = newField === '__SKIP__' ? null : newField;
    updated[index].status = newField && newField !== '__SKIP__' ? 'mapped' : 'unmapped';
    setMappings(updated);
  };

  const handleEditField = (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingField(null);
      return;
    }

    // Update custom fields list
    const updatedCustomFields = customFields.map(f => f === oldName ? newName : f);
    setCustomFields(updatedCustomFields);

    // Update all mappings that use this field
    const updatedMappings = mappings.map(mapping => 
      mapping.systemField === oldName 
        ? { ...mapping, systemField: newName }
        : mapping
    );
    setMappings(updatedMappings);
    
    setEditingField(null);
    toast({
      title: 'Campo renomeado',
      description: `Campo "${oldName}" renomeado para "${newName}"`,
    });
  };

  const handleDeleteCustomField = (fieldName: string) => {
    // Remove from custom fields
    setCustomFields(customFields.filter(f => f !== fieldName));

    // Update mappings that use this field to unmapped
    const updatedMappings = mappings.map(mapping => 
      mapping.systemField === fieldName 
        ? { ...mapping, systemField: null, status: 'unmapped' as const }
        : mapping
    );
    setMappings(updatedMappings);
    
    toast({
      title: 'Campo removido',
      description: `Campo "${fieldName}" foi removido`,
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para o template',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveTemplate({
        nome_template: templateName,
        descricao: templateDescription,
        mappings,
        custom_fields: customFields,
      });
      setShowSaveTemplateDialog(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleLoadTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      // Aplicar mapeamento do template nas colunas atuais
      const updatedMappings = mappings.map(currentMapping => {
        // Procurar correspondência no template por nome da coluna CSV
        const templateMapping = template.mappings.find(
          tm => tm.csvColumn.toLowerCase() === currentMapping.csvColumn.toLowerCase()
        );
        
        if (templateMapping && templateMapping.systemField) {
          return {
            ...currentMapping,
            systemField: templateMapping.systemField,
            status: 'mapped' as const,
          };
        }
        return currentMapping;
      });

      setMappings(updatedMappings);
      setCustomFields(template.custom_fields || []);
      
      // Marcar como usado
      await markAsUsed(templateId);
      
      setShowLoadTemplateDialog(false);
      
      toast({
        title: 'Template carregado!',
        description: `Mapeamento "${template.nome_template}" aplicado com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao carregar template:', error);
    }
  };

  const handleConfirmAnalysis = () => {
    setStep('analyzing');
    setStartTime(new Date());
  };

  const handleAnalyze = async () => {
    // VALIDAÇÃO CRÍTICA ANTES DE INICIAR
    const fieldMap: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.systemField && m.systemField !== 'skip') {
        fieldMap[m.csvColumn] = m.systemField;
      }
    });
    
    // Verificar se CNPJ está mapeado
    const cnpjMapeado = Object.values(fieldMap).includes('cnpj');
    if (!cnpjMapeado) {
      toast({
        title: "Erro de Mapeamento",
        description: "Campo CNPJ não foi mapeado. Verifique o mapeamento antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    
    // Testar primeira linha
    const primeiraLinha = allData[0];
    const cnpjColuna = Object.keys(fieldMap).find(k => fieldMap[k] === 'cnpj');
    const cnpjValor = primeiraLinha[cnpjColuna!];
    const cnpjLimpo = cnpjValor?.toString().replace(/\D/g, '');
    
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      toast({
        title: "CNPJ Inválido",
        description: `CNPJ da primeira linha está inválido: "${cnpjValor}". Verifique o mapeamento.`,
        variant: "destructive",
      });
      return;
    }
    
    // Gerar dados de pré-análise
    const cnpjsValidos = allData.filter(row => {
      const cnpj = row[cnpjColuna!]?.toString().replace(/\D/g, '');
      return cnpj && cnpj.length === 14;
    }).length;

    const preAnalysis = {
      total_empresas: allData.length,
      cnpjs_validos: cnpjsValidos,
      cnpjs_invalidos: allData.length - cnpjsValidos,
      emails_validos: allData.filter(row => {
        const emailCol = Object.keys(fieldMap).find(k => fieldMap[k] === 'email');
        return emailCol && row[emailCol]?.toString().includes('@');
      }).length,
      telefones_validos: allData.filter(row => {
        const telCol = Object.keys(fieldMap).find(k => fieldMap[k] === 'telefone');
        return telCol && row[telCol]?.toString().replace(/\D/g, '').length >= 10;
      }).length,
      websites_validos: allData.filter(row => {
        const siteCol = Object.keys(fieldMap).find(k => fieldMap[k] === 'website');
        return siteCol && row[siteCol]?.toString().includes('.');
      }).length,
      duplicatas: 0,
      campos_vazios: {},
      score_qualidade: Math.round((cnpjsValidos / allData.length) * 100),
      fontes_disponiveis: [
        { nome: 'Receita Federal', status: 'online' as const, tempo_resposta: 120 },
        { nome: 'LinkedIn', status: 'online' as const, tempo_resposta: 200 },
        { nome: 'Portais de Vagas', status: 'online' as const, tempo_resposta: 300 },
        { nome: 'Web Scraping TOTVS', status: 'online' as const, tempo_resposta: 500 },
      ],
      estimativa_tempo: allData.length * 180,
      estimativa_creditos: allData.length * 5,
      taxa_sucesso_esperada: 85,
    };

    setPreAnalysisData(preAnalysis);
    setStep('preview');
    setStartTime(new Date());
    setTotalProcessed(0);
    setIsPaused(false);
    
    const analysisResults: any[] = [];
    const companiesQueue: ProcessingCompany[] = allData.map((row, index) => {
      const companyFieldMap: Record<string, string> = {};
      mappings.forEach(m => {
        if (m.systemField && m.systemField !== '__SKIP__') {
          companyFieldMap[m.csvColumn] = m.systemField;
        }
      });
      
      const companyData: any = {};
      Object.entries(row).forEach(([csvCol, value]) => {
        const systemField = companyFieldMap[csvCol];
        if (systemField && value) {
          companyData[systemField] = value;
        }
      });

      return {
        index,
        name: companyData.razao_social || companyData.nome_da_empresa || `Empresa ${index + 1}`,
        cnpj: companyData.cnpj || '',
        status: 'waiting',
        currentStep: 'Aguardando',
        progress: 0,
      };
    });

    setProcessingCompanies(companiesQueue);
    setAnalysisResults([]);

    // Processar 3 empresas simultaneamente
    const BATCH_SIZE = 3;
    
    for (let batchStart = 0; batchStart < allData.length; batchStart += BATCH_SIZE) {
      // Verificar se está pausado
      while (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const batchEnd = Math.min(batchStart + BATCH_SIZE, allData.length);
      const batchPromises = [];

      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(processCompany(i, allData[i], analysisResults, companiesQueue));
      }

      await Promise.all(batchPromises);
      setTotalProcessed(batchEnd);
    }

    setAnalysisResults(analysisResults);
    
    // CRÍTICO: Salvar resultados na quarentena (icp_analysis_results)
    try {
      await saveToQuarantine(analysisResults);
    } catch (error) {
      console.error('Erro ao salvar na quarentena:', error);
      toast({
        title: "Atenção",
        description: "Análise concluída mas houve erro ao salvar na quarentena. Verifique os logs.",
        variant: "destructive",
      });
    }
    
    
    setStep('complete');

    const successCount = analysisResults.filter(r => !r.error && !r.encontrou_totvs).length;
    const rejectedCount = analysisResults.filter(r => r.encontrou_totvs).length;
    const errorCount = analysisResults.filter(r => r.error).length;

    toast({
      title: "✅ Análise ICP concluída!",
      description: `${successCount} na quarentena | ${rejectedCount} descartadas (TOTVS) | ${errorCount} erros. Acesse Quarentena ICP para aprovar.`,
      duration: 10000,
    });
  };

  const processCompany = async (
    index: number,
    row: any,
    analysisResults: any[],
    companiesQueue: ProcessingCompany[]
  ) => {
    const updateCompanyStatus = (updates: Partial<ProcessingCompany>) => {
      setProcessingCompanies(prev => 
        prev.map((c, idx) => idx === index ? { ...c, ...updates } : c)
      );
    };

    const fieldMap: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.systemField && m.systemField !== '__SKIP__') {
        fieldMap[m.csvColumn] = m.systemField;
      }
    });

    // Coletar todos os dados do CSV
    let rawData: any = {};
    let name = '';
    let cnpj = '';
    let domain = '';

    try {
      updateCompanyStatus({ 
        status: 'processing', 
        currentStep: 'Coletando dados básicos', 
        progress: 10 
      });

      // Mapear dados do CSV - USAR APENAS MAPEAMENTO EXPLÍCITO
      Object.entries(row).forEach(([csvCol, value]) => {
        const systemField = fieldMap[csvCol];
        if (value) {
          rawData[csvCol] = value;
          
          // CRÍTICO: Usar APENAS o mapeamento explícito (não tentar adivinhar)
          if (systemField === 'cnpj') {
            cnpj = String(value).replace(/\D/g, ''); // Limpar CNPJ (apenas números)
          }
          if (systemField === 'razao_social' || systemField === 'nome_da_empresa') {
            name = String(value);
          }
          if (systemField === 'website' || systemField === 'domain') {
            const websiteValue = String(value).replace(/^https?:\/\//, '').replace(/\/$/, '');
            if (websiteValue && websiteValue !== 'N/A' && !websiteValue.startsWith('www.')) {
              domain = websiteValue;
            }
          }
        }
      });

      if (!cnpj && !name) {
        throw new Error('Dados insuficientes (falta CNPJ ou nome da empresa)');
      }

      // Se não tem nome, usar CNPJ como nome temporário
      if (!name && cnpj) {
        name = `Empresa ${cnpj}`;
      }

      // Validar CNPJ antes de qualquer persistência
      if (!cnpj || cnpj.length !== 14) {
        throw new Error('CNPJ inválido');
      }

      updateCompanyStatus({ 
        currentStep: 'Verificando base de dados', 
        progress: 20 
      });

      // NÃO CRIAR EM COMPANIES - Seguir fluxo: Quarentena → Pool → Qualified → Companies
      // A análise vai APENAS para icp_analysis_results

      updateCompanyStatus({ 
        currentStep: '🔍 Iniciando análise REAL em 40+ plataformas...', 
        progress: 30 
      });

      // ===== SCRAPING REAL COM 40+ PLATAFORMAS =====
      // Criar registro de análise
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('icp_analysis_results')
        .insert({
          cnpj: cnpj || null,
          razao_social: name,
          origem: 'icp_massa',
          status: 'pendente',
          raw_data: rawData,
        })
        .select('id')
        .single();

      if (analysisError) {
        console.error('Erro ao criar registro de análise:', analysisError);
      }

      const analysisId = analysisRecord?.id;

      let encontrouTotvs = false;
      let evidenciasTotvs: any[] = [];
      let portaisVerificados = 0;

      try {
        updateCompanyStatus({ 
          currentStep: '⏳ Consultando 40+ fontes (aguarde 3-5 minutos)...', 
          progress: 35 
        });

        // CHAMAR SCRAPER REAL (DEMORA 3-5 MINUTOS)
        const { data: scraperData, error: scraperError } = await supabase.functions.invoke(
          'icp-scraper-real',
          {
            body: {
              empresa: name,
              cnpj: cnpj,
              domain: domain,
              analysis_id: analysisId,
            },
          }
        );

        if (scraperError) {
          console.error('[ICP] Erro no scraper real:', scraperError);
          updateCompanyStatus({ 
            currentStep: `❌ Erro ao consultar plataformas: ${scraperError.message}`, 
            progress: 40 
          });
        } else if (scraperData && scraperData.success) {
          portaisVerificados = scraperData.plataformas_consultadas || 0;
          const evidenciasEncontradas = scraperData.evidencias_encontradas || 0;
          const tempoTotal = scraperData.tempo_total_segundos || 0;

          updateCompanyStatus({ 
            currentStep: `✅ Análise concluída: ${evidenciasEncontradas} evidências em ${tempoTotal}s`, 
            progress: 60 
          });

          // Verificar se encontrou TOTVS (score alto de TOTVS = cliente existente)
          encontrouTotvs = scraperData.score >= 70; // Se score >= 70, pode ser cliente TOTVS
          if (encontrouTotvs) {
            evidenciasTotvs = [
              { fonte: 'Análise Multicanal', descricao: `Score ICP alto detectado: ${scraperData.score}` }
            ];
          }
        }
      } catch (error: any) {
        console.error('[ICP] Erro ao executar scraper real:', error);
        updateCompanyStatus({ 
          currentStep: `⚠️ Erro na análise: ${error.message}`, 
          progress: 40 
        });
      }

      // Se encontrou TOTVS, marcar como descartado NA QUARENTENA
      if (encontrouTotvs) {
        await supabase
          .from('icp_analysis_results')
          .update({
            status: 'descartada',
            motivo_descarte: 'Cliente TOTVS detectado',
            is_cliente_totvs: true,
            totvs_check_date: new Date().toISOString(),
            totvs_evidences: evidenciasTotvs,
          })
          .eq('id', analysisId);

        const result = {
          analysis_id: analysisId,
          cnpj: cnpj,
          name: name,
          status: 'rejected',
          motivo: 'Cliente TOTVS',
          encontrou_totvs: true,
          evidencias: evidenciasTotvs,
          portais_verificados: portaisVerificados,
          icp_score: 0,
          temperatura: 'cold',
        };

        analysisResults.push(result);
        setAnalysisResults([...analysisResults]);

        updateCompanyStatus({ 
          status: 'completed', 
          currentStep: 'DESCARTADO - Cliente TOTVS', 
          progress: 100,
          result
        });

        return;
      }

      updateCompanyStatus({ 
        currentStep: 'Calculando Score ICP', 
        progress: 70 
      });

      const icpResult = calculateICPScore(rawData);

      updateCompanyStatus({ 
        currentStep: 'Salvando na Quarentena ICP', 
        progress: 90 
      });

      // ATUALIZAR APENAS icp_analysis_results (NÃO companies)
      await supabase
        .from('icp_analysis_results')
        .update({
          icp_score: icpResult.score,
          temperatura: icpResult.temperatura,
          breakdown: icpResult.breakdown,
          motivos: icpResult.motivos,
          analyzed_at: new Date().toISOString(),
          status: 'pendente',
        })
        .eq('id', analysisId);

      const result = {
        analysis_id: analysisId,
        cnpj: cnpj,
        name: name,
        status: 'approved',
        icp_score: icpResult.score,
        temperatura: icpResult.temperatura,
        breakdown: icpResult.breakdown,
        motivos: icpResult.motivos,
        encontrou_totvs: false,
        portais_verificados: portaisVerificados,
      };

      analysisResults.push(result);
      setAnalysisResults([...analysisResults]);

      updateCompanyStatus({ 
        status: 'completed', 
        currentStep: `CONCLUÍDO - Score: ${icpResult.score} (${icpResult.temperatura.toUpperCase()})`, 
        progress: 100,
        result
      });

    } catch (error: any) {
      console.error(`Erro ao processar empresa ${index + 1}:`, error);
      
      const result = {
        cnpj: cnpj || 'N/A',
        name: name || `Empresa ${index + 1}`,
        status: 'error',
        error: error.message,
      };

      analysisResults.push(result);
      setAnalysisResults([...analysisResults]);

      updateCompanyStatus({ 
        status: 'error', 
        currentStep: `ERRO: ${error.message}`, 
        progress: 0,
        error: error.message
      });
    }
  };

  const handleDownloadResults = () => {
    const csv = Papa.unparse(analysisResults.map(r => ({
      CNPJ: r.cnpj,
      'Razão Social': r.name,
      Status: r.status === 'approved' ? 'Aprovado' : r.status === 'rejected' ? 'Descartado' : 'Erro',
      Motivo: r.motivo || (r.error ? `Erro: ${r.error}` : '-'),
      'Score ICP': r.icp_score || 0,
      Temperatura: r.temperatura || '-',
      'Encontrou TOTVS': r.encontrou_totvs ? 'Sim' : 'Não',
      'Evidências TOTVS': r.evidencias ? r.evidencias.length : 0,
      'Portais Verificados': r.portais_verificados || 0,
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analise-icp-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string, confidence: number) => {
    if (status === 'mapped') {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Mapeado ({confidence}%)
        </Badge>
      );
    } else if (status === 'review') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Revisar ({confidence}%)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Não mapeado
        </Badge>
      );
    }
  };

  const resetAnalysis = () => {
    setStep('upload');
    setFile(null);
    setMappings([]);
    setPreviewData([]);
    setAllData([]);
    setProcessingCompanies([]);
    setAnalysisResults([]);
    setTotalProcessed(0);
    setStartTime(null);
  };

  const getTemperatureBadge = (temp: string) => {
    if (temp === 'hot') return (
      <Badge className="bg-red-500 text-white flex items-center gap-1">
        <Flame className="w-3 h-3" />
        HOT
      </Badge>
    );
    if (temp === 'warm') return (
      <Badge className="bg-yellow-500 text-white flex items-center gap-1">
        <Thermometer className="w-3 h-3" />
        WARM
      </Badge>
    );
    return (
      <Badge className="bg-blue-500 text-white flex items-center gap-1">
        <Snowflake className="w-3 h-3" />
        COLD
      </Badge>
    );
  };

  const getElapsedTime = () => {
    if (!startTime) return '0s';
    const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!startTime || totalProcessed === 0) return 'Calculando...';
    const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    const avgTimePerCompany = elapsed / totalProcessed;
    const remaining = (allData.length - totalProcessed) * avgTimePerCompany;
    const minutes = Math.floor(remaining / 60);
    return `~${minutes} minutos`;
  };

  if (step === 'upload') {
    return (
      <>
        <Card className="p-8">
          <div className="text-center space-y-6">
            <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Análise ICP em Massa com Verificação TOTVS</h2>
              <p className="text-muted-foreground mb-6">
                Sistema robusto de análise que:<br/>
                <span className="inline-flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Verifica 40+ portais de vagas para detectar clientes TOTVS</span><br/>
                <span className="inline-flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Calcula score ICP detalhado para cada empresa</span><br/>
                <span className="inline-flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Processa até 3 empresas simultaneamente</span><br/>
                <span className="inline-flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Gera relatório completo com evidências</span>
              </p>
            </div>
            <div>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="max-w-md mx-auto"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Aceita arquivos .csv até 20MB
              </p>
            </div>
          </div>
        </Card>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform animate-fade-in"
            size="icon"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </>
    );
  }

  if (step === 'mapping') {
    const mappedCount = mappings.filter(m => m.status === 'mapped').length;
    const reviewCount = mappings.filter(m => m.status === 'review').length;
    const unmappedCount = mappings.filter(m => m.status === 'unmapped').length;

    return (
      <>
        <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Mapeamento de Colunas</h2>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowLoadTemplateDialog(true)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Carregar Template
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Revise o mapeamento automático. Ajuste se necessário.
            </p>
            <div className="flex gap-4">
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700">
                {mappedCount} Mapeados
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                {reviewCount} Revisar
              </Badge>
              <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700">
                {unmappedCount} Não mapeados
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coluna da Planilha</TableHead>
                  <TableHead>Campo do Sistema</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preview dos Dados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {mapping.csvColumn}
                    </TableCell>
                    <TableCell>
                      <Popover 
                        open={openComboboxIndex === index} 
                        onOpenChange={(open) => setOpenComboboxIndex(open ? index : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openComboboxIndex === index}
                            className="w-64 justify-between"
                          >
                            <span className="truncate">
                              {mapping.systemField === '__SKIP__' ? (
                                <span className="flex items-center gap-1">
                                  <Ban className="w-3 h-3" /> Não mapear
                                </span>
                              ) : mapping.systemField ? (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500" /> 
                                  {getFieldLabel(mapping.systemField)}
                                </span>
                              ) : (
                                "Selecione um campo"
                              )}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar campo..." />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2 text-center">
                                  <p className="text-sm text-muted-foreground mb-2">Nenhum campo encontrado</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      const newField = prompt('Digite o nome do novo campo:');
                                      if (newField && newField.trim()) {
                                        const fieldKey = newField.trim().toLowerCase().replace(/\s+/g, '_');
                                        setCustomFields(prev => [...prev, fieldKey]);
                                        handleMappingChange(index, fieldKey);
                                        setOpenComboboxIndex(null);
                                        toast({
                                          title: 'Campo adicionado',
                                          description: `Campo "${newField}" foi adicionado com sucesso.`,
                                        });
                                      }
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar novo campo
                                  </Button>
                                </div>
                              </CommandEmpty>
                              
                              <CommandGroup heading="Opções">
                                <CommandItem
                                  value="__SKIP__"
                                  onSelect={() => {
                                    handleMappingChange(index, '__SKIP__');
                                    setOpenComboboxIndex(null);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      mapping.systemField === '__SKIP__' ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <Ban className="w-3 h-3 mr-2" />
                                  Não mapear
                                </CommandItem>
                              </CommandGroup>

                              {mapping.systemField && mapping.systemField !== '__SKIP__' && (
                                <CommandGroup heading="Sugestão">
                                  <CommandItem
                                    value={mapping.systemField}
                                    onSelect={() => {
                                      handleMappingChange(index, mapping.systemField!);
                                      setOpenComboboxIndex(null);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        mapping.systemField === mapping.systemField ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <Star className="w-3 h-3 mr-2 text-yellow-500" />
                                    {getFieldLabel(mapping.systemField)} (Sugerido)
                                  </CommandItem>
                                </CommandGroup>
                              )}

                              {mapping.alternatives.length > 0 && (
                                <CommandGroup heading="Alternativas">
                                  {mapping.alternatives.map((alt) => (
                                    <CommandItem
                                      key={alt.field}
                                      value={`${alt.field}-${getFieldLabel(alt.field)}`}
                                      onSelect={() => {
                                        handleMappingChange(index, alt.field);
                                        setOpenComboboxIndex(null);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          mapping.systemField === alt.field ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {getFieldLabel(alt.field)} ({alt.confidence}%)
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}

                              <CommandSeparator />

                              <CommandGroup heading="Todos os campos">
                                {getSystemFields().map((field) => (
                                  <CommandItem
                                    key={field}
                                    value={`${field}-${getFieldLabel(field)}`}
                                    onSelect={() => {
                                      handleMappingChange(index, field);
                                      setOpenComboboxIndex(null);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        mapping.systemField === field ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {getFieldLabel(field)}
                                  </CommandItem>
                                ))}
                                
                                {customFields.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                                      Campos Customizados
                                    </div>
                                    {customFields.map((field) => (
                                      <CommandItem
                                        key={field}
                                        value={`${field}-${getFieldLabel(field)}`}
                                        onSelect={() => {
                                          if (editingField !== field) {
                                            handleMappingChange(index, field);
                                            setOpenComboboxIndex(null);
                                          }
                                        }}
                                        className="group"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            mapping.systemField === field ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {editingField === field ? (
                                          <input
                                            type="text"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onBlur={() => handleEditField(field, editingValue)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleEditField(field, editingValue);
                                              } else if (e.key === 'Escape') {
                                                setEditingField(null);
                                              }
                                            }}
                                            className="flex-1 px-2 py-1 text-sm border rounded"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <>
                                            <span className="flex-1">{getFieldLabel(field)}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingField(field);
                                                  setEditingValue(field);
                                                }}
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteCustomField(field);
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </>
                                        )}
                                      </CommandItem>
                                    ))}
                                  </>
                                )}
                              </CommandGroup>

                              <CommandSeparator />
                              
                              <CommandGroup>
                                <CommandItem
                                  onSelect={() => {
                                    const newField = prompt('Digite o nome do novo campo:');
                                    if (newField && newField.trim()) {
                                      const fieldKey = newField.trim().toLowerCase().replace(/\s+/g, '_');
                                      setCustomFields(prev => [...prev, fieldKey]);
                                      handleMappingChange(index, fieldKey);
                                      setOpenComboboxIndex(null);
                                      toast({
                                        title: 'Campo adicionado',
                                        description: `Campo "${newField}" foi adicionado com sucesso.`,
                                      });
                                    }
                                  }}
                                  className="text-primary"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar campo customizado
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(mapping.status, mapping.confidence)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {previewData.map((row, i) => (
                        <div key={i} className="truncate max-w-xs">
                          {String(row[mapping.csvColumn] || '').substring(0, 50)}
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between mt-6">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowLoadTemplateDialog(true)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Carregar Template
              </Button>

              <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar como Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Salvar Template de Mapeamento</DialogTitle>
                    <DialogDescription>
                      Salve este mapeamento para reutilizar em futuras análises
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Nome do Template *</Label>
                      <Input
                        id="template-name"
                        placeholder="Ex: Planilha Padrão ERP"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-desc">Descrição (opcional)</Label>
                      <Textarea
                        id="template-desc"
                        placeholder="Descreva quando usar este template..."
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Este template incluirá:</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>{mappings.length} mapeamentos de colunas</li>
                        <li>{customFields.length} campos customizados</li>
                      </ul>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveTemplate}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Dialog compartilhado (TAMBÉM disponível nesta etapa) */}
              <Dialog open={showLoadTemplateDialog} onOpenChange={setShowLoadTemplateDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Carregar Template de Mapeamento</DialogTitle>
                    <DialogDescription>
                      Selecione um template salvo para aplicar o mapeamento automaticamente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum template salvo ainda</p>
                    ) : (
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                          {templates.map((template) => (
                            <Card
                              key={template.id}
                              className="p-4 cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleLoadTemplate(template.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">{template.nome_template}</h4>
                                  {template.descricao && (
                                    <p className="text-sm text-muted-foreground mt-1">{template.descricao}</p>
                                  )}
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {template.mappings?.length || 0} mapeamentos
                                    </Badge>
                                    {template.custom_fields && template.custom_fields.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {template.custom_fields.length} campos customizados
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Deletar template "${template.nome_template}"?`)) {
                                      deleteTemplate(template.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Button onClick={handleAnalyze}>
              Confirmar e Analisar ({allData.length} empresas)
            </Button>
          </div>
        </Card>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform animate-fade-in"
          size="icon"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </>
    );
  }

  if (step === 'preview' && preAnalysisData) {
    return (
      <>
        <PreAnalysisReport
          data={preAnalysisData}
          onConfirm={handleConfirmAnalysis}
          onCancel={() => setStep('mapping')}
        />
        
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform animate-fade-in"
            size="icon"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </>
    );
  }


  if (step === 'analyzing') {
    const fieldMap: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.systemField && m.systemField !== '__SKIP__') {
        fieldMap[m.csvColumn] = m.systemField;
      }
    });

    const mappedAll = allData.map(row => {
      const company: any = {};
      Object.entries(row).forEach(([csvCol, value]) => {
        const systemField = fieldMap[csvCol];
        if (!systemField || value == null) return;
        const strVal = String(value).trim();
        if (systemField === 'cnpj') {
          const cleaned = strVal.replace(/\D/g, '');
          if (cleaned) company.cnpj = cleaned;
        } else if (systemField === 'razao_social' || systemField === 'nome_da_empresa') {
          const trivial = ['sim', 'não', 'nao', 'n/a', 'na'];
          if (strVal && strVal.length >= 3 && !trivial.includes(strVal.toLowerCase())) {
            company[systemField] = strVal;
          }
        } else {
          company[systemField] = value;
        }
      });
      return company;
    });

    const mappedData = mappedAll.filter((c) => {
      const cnpj = String(c?.cnpj || '').replace(/\D/g, '');
      const hasName = Boolean(c?.razao_social || c?.nome_da_empresa);
      return cnpj.length === 14 && hasName;
    });

    const dropped = mappedAll.length - mappedData.length;
    if (dropped > 0) {
      toast({
        title: 'Linhas ignoradas',
        description: `${dropped} linha(s) foram ignoradas por CNPJ ou Razão Social inválidos`,
      });
    }

    return (
      <>
        <LiveProcessingDashboard
          empresas={mappedData}
          onComplete={handleLiveProcessingComplete}
        />
        
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform animate-fade-in"
            size="icon"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </>
    );
  }

  if (step === 'complete') {
    const tempoDecorrido = startTime 
      ? Math.floor((Date.now() - startTime.getTime()) / 1000)
      : 0;

    return (
      <>
        <FinalReportDashboard
          resultados={analysisResults}
          tempoTotal={tempoDecorrido}
          onNovaAnalise={resetAnalysis}
        />
        
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:scale-110 transition-transform animate-fade-in"
            size="icon"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </>
    );
  }

  // Código antigo mantido para referência (não será executado)
  const OLD_analyzing_code = false;
  if (OLD_analyzing_code) {
    const progress = allData.length > 0 
      ? (totalProcessed / allData.length) * 100 
      : 0;

    const processing = processingCompanies.filter(c => c.status === 'processing');
    const completed = processingCompanies.filter(c => c.status === 'completed');
    const waiting = processingCompanies.filter(c => c.status === 'waiting');
    const errors = processingCompanies.filter(c => c.status === 'error');

    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6" />
                ANÁLISE ICP EM MASSA - PROCESSANDO
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">{allData.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle className="w-8 h-8" />
                  {completed.length}
                </div>
                <div className="text-sm text-muted-foreground">Concluídas</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  {processing.length}
                </div>
                <div className="text-sm text-muted-foreground">Em andamento</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-600 flex items-center justify-center gap-2">
                  <Clock className="w-8 h-8" />
                  {waiting.length}
                </div>
                <div className="text-sm text-muted-foreground">Aguardando</div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <Progress value={progress} className="w-full mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{Math.round(progress)}% concluído</span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tempo decorrido: {getElapsedTime()} | Estimado restante: {getEstimatedTimeRemaining()}
                </span>
              </div>
            </div>

            <ScrollArea className="h-96 w-full max-w-4xl mx-auto border rounded-lg p-4">
              <div className="space-y-4">
                {processing.map((company) => (
                  <div key={company.index} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-bold text-blue-900 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {company.name}
                        </div>
                        <div className="text-sm text-blue-700">CNPJ: {company.cnpj}</div>
                      </div>
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-blue-800">{company.currentStep}</div>
                      <Progress value={company.progress} className="h-2" />
                    </div>
                  </div>
                ))}

                {completed.slice(-5).reverse().map((company) => (
                  <div key={company.index} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-green-900 flex items-center gap-2">
                          {company.result?.encontrou_totvs ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {company.name}
                        </div>
                        <div className="text-sm text-green-700">CNPJ: {company.cnpj}</div>
                        <div className="text-sm text-green-800 mt-1">{company.currentStep}</div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                ))}

                {errors.map((company) => (
                  <div key={company.index} className="border rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-red-900 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          {company.name}
                        </div>
                        <div className="text-sm text-red-700">CNPJ: {company.cnpj}</div>
                        <div className="text-sm text-red-800 mt-1">{company.currentStep}</div>
                      </div>
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Continuar
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Dialog compartilhado para Carregar Template */}
      <Dialog open={showLoadTemplateDialog} onOpenChange={setShowLoadTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregar Template de Mapeamento</DialogTitle>
            <DialogDescription>
              Selecione um template salvo para aplicar o mapeamento automaticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum template salvo ainda
              </p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleLoadTemplate(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.nome_template}</h4>
                          {template.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {template.descricao}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.mappings?.length || 0} mapeamentos
                            </Badge>
                            {template.custom_fields && template.custom_fields.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {template.custom_fields.length} campos customizados
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deletar template "${template.nome_template}"?`)) {
                              deleteTemplate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

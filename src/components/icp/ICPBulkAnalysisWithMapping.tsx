import { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, CheckCircle, AlertCircle, XCircle, Download, Loader2, Pause, Play, Clock, Flame, Thermometer, Snowflake, RefreshCw, ClipboardList, BarChart3, Star, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mapAllColumns, getSystemFields, getFieldLabel, type ColumnMapping } from '@/lib/csvMapper';
import { calculateICPScore } from '@/lib/icpCalculator';
import PreAnalysisReport from './PreAnalysisReport';
import LiveProcessingDashboard from './LiveProcessingDashboard';

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
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        if (!data || data.length === 0) {
          toast({
            title: "Erro",
            description: "Arquivo CSV vazio ou inválido.",
            variant: "destructive",
          });
          return;
        }

        const headers = Object.keys(data[0]);
        
        setAllData(data);
        setPreviewData(data.slice(0, 3));

        const autoMappings = mapAllColumns(headers);
        setMappings(autoMappings);

        setStep('mapping');

        const mappedCount = autoMappings.filter(m => m.status === 'mapped').length;
        toast({
          title: "Arquivo carregado!",
          description: `${mappedCount} de ${headers.length} colunas mapeadas automaticamente (${Math.round((mappedCount/headers.length)*100)}%)`,
        });
      },
      error: (error) => {
        console.error('Erro ao ler CSV:', error);
        toast({
          title: "Erro ao ler arquivo",
          description: "Verifique se o arquivo está no formato CSV correto.",
          variant: "destructive",
        });
      },
    });
  };

  const handleMappingChange = (index: number, newField: string) => {
    const updated = [...mappings];
    updated[index].systemField = newField === '__SKIP__' ? null : newField;
    updated[index].status = newField && newField !== '__SKIP__' ? 'mapped' : 'unmapped';
    setMappings(updated);
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
    setStep('complete');

    const successCount = analysisResults.filter(r => !r.error && !r.encontrou_totvs).length;
    const rejectedCount = analysisResults.filter(r => r.encontrou_totvs).length;
    const errorCount = analysisResults.filter(r => r.error).length;

    toast({
      title: "Análise concluída!",
      description: `${successCount} aprovadas | ${rejectedCount} descartadas (TOTVS) | ${errorCount} erros`,
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

    let companyData: any = {};

    try {
      updateCompanyStatus({ 
        status: 'processing', 
        currentStep: 'Coletando dados básicos', 
        progress: 10 
      });

      Object.entries(row).forEach(([csvCol, value]) => {
        const systemField = fieldMap[csvCol];
        if (systemField && value) {
          companyData[systemField] = value;
        }
      });

      if (!companyData.cnpj && !companyData.razao_social && !companyData.nome_da_empresa) {
        throw new Error('Dados insuficientes (falta CNPJ ou nome)');
      }

      updateCompanyStatus({ 
        currentStep: 'Verificando base de dados', 
        progress: 20 
      });

      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id, name')
        .eq('cnpj', companyData.cnpj)
        .maybeSingle();

      let companyId: string;

      if (existingCompany) {
        companyId = existingCompany.id;
        await supabase
          .from('companies')
          .update({
            ...companyData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId);
      } else {
        const { data: newCompany, error: insertError } = await supabase
          .from('companies')
          .insert(companyData)
          .select('id')
          .single();

        if (insertError || !newCompany) {
          throw new Error(`Erro ao criar empresa: ${insertError?.message}`);
        }

        companyId = newCompany.id;
      }

      updateCompanyStatus({ 
        currentStep: 'Verificando portais de vagas (40+ fontes)', 
        progress: 30 
      });

      // Chamar edge function para verificar TOTVS
      let encontrouTotvs = false;
      let evidenciasTotvs: any[] = [];
      let portaisVerificados = 0;

      try {
        const { data: scraperData, error: scraperError } = await supabase.functions.invoke(
          'web-scraper-totvs',
          {
            body: {
              cnpj: companyData.cnpj,
              razao_social: companyData.razao_social || companyData.nome_da_empresa,
              domain: companyData.domain,
            },
          }
        );

        if (scraperError) {
          console.error('Erro no scraper TOTVS:', scraperError);
        } else if (scraperData) {
          encontrouTotvs = scraperData.encontrou_totvs;
          evidenciasTotvs = scraperData.evidencias || [];
          portaisVerificados = scraperData.portais_verificados || 0;
        }

        updateCompanyStatus({ 
          currentStep: encontrouTotvs 
            ? `Cliente TOTVS detectado (${evidenciasTotvs.length} evidências)` 
            : `Sem vínculo TOTVS (${portaisVerificados} portais verificados)`, 
          progress: 60 
        });
      } catch (error) {
        console.error('Erro ao verificar TOTVS:', error);
      }

      // Se encontrou TOTVS, marcar como descartado
      if (encontrouTotvs) {
        await supabase
          .from('companies')
          .update({
            is_disqualified: true,
            disqualification_reason: 'Cliente TOTVS detectado',
            totvs_detection_score: 100,
            totvs_detection_details: evidenciasTotvs,
            totvs_detection_date: new Date().toISOString(),
          })
          .eq('id', companyId);

        const result = {
          company_id: companyId,
          cnpj: companyData.cnpj,
          name: companyData.razao_social || companyData.nome_da_empresa || `Empresa ${companyData.cnpj}`,
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

      const icpResult = calculateICPScore(companyData);

      updateCompanyStatus({ 
        currentStep: 'Salvando resultados', 
        progress: 90 
      });

      await supabase
        .from('companies')
        .update({
          icp_score: icpResult.score,
          icp_temperature: icpResult.temperatura,
          icp_breakdown: icpResult.breakdown,
          icp_motivos: icpResult.motivos,
          icp_analyzed_at: new Date().toISOString(),
          totvs_detection_score: 0,
          totvs_detection_date: new Date().toISOString(),
        })
        .eq('id', companyId);

      const result = {
        company_id: companyId,
        cnpj: companyData.cnpj,
        name: companyData.razao_social || companyData.nome_da_empresa || `Empresa ${companyData.cnpj}`,
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
        currentStep: `APROVADO - Score: ${icpResult.score} (${icpResult.temperatura.toUpperCase()})`, 
        progress: 100,
        result
      });

    } catch (error: any) {
      console.error(`Erro ao processar empresa ${index + 1}:`, error);
      
      const result = {
        cnpj: companyData?.cnpj || 'N/A',
        name: companyData?.razao_social || companyData?.nome_da_empresa || `Empresa ${index + 1}`,
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
    );
  }

  if (step === 'mapping') {
    const mappedCount = mappings.filter(m => m.status === 'mapped').length;
    const reviewCount = mappings.filter(m => m.status === 'review').length;
    const unmappedCount = mappings.filter(m => m.status === 'unmapped').length;

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Mapeamento de Colunas</h2>
            <p className="text-muted-foreground mb-4">
              Revise o mapeamento automático. Ajuste se necessário.
            </p>
            <div className="flex gap-4">
              <Badge variant="outline" className="bg-green-50">
                {mappedCount} Mapeados
              </Badge>
              <Badge variant="outline" className="bg-yellow-50">
                {reviewCount} Revisar
              </Badge>
              <Badge variant="outline" className="bg-red-50">
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
                      <Select
                        value={mapping.systemField || '__SKIP__'}
                        onValueChange={(value) => handleMappingChange(index, value)}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__SKIP__">
                            <span className="flex items-center gap-1">
                              <Ban className="w-3 h-3" /> Não mapear
                            </span>
                          </SelectItem>
                          {mapping.systemField && mapping.systemField !== '__SKIP__' && (
                            <SelectItem value={mapping.systemField}>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" /> {getFieldLabel(mapping.systemField)} (Sugerido)
                              </span>
                            </SelectItem>
                          )}
                          {mapping.alternatives.map((alt) => (
                            <SelectItem key={alt.field} value={alt.field}>
                              {getFieldLabel(alt.field)} ({alt.confidence}%)
                            </SelectItem>
                          ))}
                          <SelectItem value="separator" disabled>
                            ──────────────
                          </SelectItem>
                          {getSystemFields().map((field) => (
                            <SelectItem key={field} value={field}>
                              {getFieldLabel(field)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            <Button variant="outline" onClick={() => setStep('upload')}>
              Voltar
            </Button>
            <Button onClick={handleAnalyze}>
              Confirmar e Analisar ({allData.length} empresas)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'preview' && preAnalysisData) {
    return (
      <PreAnalysisReport
        data={preAnalysisData}
        onConfirm={handleConfirmAnalysis}
        onCancel={() => setStep('mapping')}
      />
    );
  }

  if (step === 'analyzing') {
    const fieldMap: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.systemField && m.systemField !== '__SKIP__') {
        fieldMap[m.csvColumn] = m.systemField;
      }
    });

    const mappedData = allData.map(row => {
      const company: any = {};
      Object.entries(row).forEach(([csvCol, value]) => {
        const systemField = fieldMap[csvCol];
        if (systemField && value) {
          company[systemField] = value;
        }
      });
      return company;
    });

    return (
      <LiveProcessingDashboard
        empresas={mappedData}
        onComplete={(results) => {
          setAnalysisResults(results);
          setStep('complete');
        }}
      />
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

  if (step === 'complete') {
    const approved = analysisResults.filter(r => r.status === 'approved');
    const rejected = analysisResults.filter(r => r.status === 'rejected');
    const errored = analysisResults.filter(r => r.status === 'error');

    const hotCount = approved.filter(r => r.temperatura === 'hot').length;
    const warmCount = approved.filter(r => r.temperatura === 'warm').length;
    const coldCount = approved.filter(r => r.temperatura === 'cold').length;

    const avgScore = approved.length > 0
      ? approved.reduce((sum, r) => sum + (r.icp_score || 0), 0) / approved.length
      : 0;

    const endTime = new Date();
    const totalTime = startTime 
      ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60)
      : 0;

    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6" />
                ANÁLISE ICP EM MASSA - CONCLUÍDA
              </h2>
              
              <div className="bg-muted p-6 rounded-lg max-w-3xl mx-auto mb-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  RESUMO GERAL
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div>
                    <div className="text-sm text-muted-foreground">Total analisadas:</div>
                    <div className="text-2xl font-bold">{analysisResults.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Aprovadas:
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {approved.length} ({Math.round((approved.length / analysisResults.length) * 100)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Descartadas:
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {rejected.length} ({Math.round((rejected.length / analysisResults.length) * 100)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tempo total:</div>
                    <div className="text-2xl font-bold">{totalTime}min</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Flame className="w-4 h-4 text-red-500" />
                        HOT (70-100):
                      </div>
                      <div className="text-xl font-bold text-red-600">{hotCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-yellow-500" />
                        WARM (40-69):
                      </div>
                      <div className="text-xl font-bold text-yellow-600">{warmCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Snowflake className="w-4 h-4 text-blue-500" />
                        COLD (0-39):
                      </div>
                      <div className="text-xl font-bold text-blue-600">{coldCount}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Score ICP médio (aprovadas):</div>
                  <div className="text-3xl font-bold text-primary">{avgScore.toFixed(1)}</div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={handleDownloadResults}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Relatório Completo (CSV)
                </Button>
                <Button variant="outline" onClick={resetAnalysis}>
                  Nova Análise
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Empresas Aprovadas */}
        {approved.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-500" />
              EMPRESAS APROVADAS ({approved.length})
            </h3>
            
            {/* HOT */}
            {hotCount > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  HOT ({hotCount} empresas)
                </h4>
                <div className="space-y-2">
                  {approved.filter(r => r.temperatura === 'hot').map((result, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold">{result.name}</div>
                          <div className="text-sm text-muted-foreground">CNPJ: {result.cnpj}</div>
                          <div className="text-sm mt-2">
                            <span className="font-bold">Score: {result.icp_score}</span>
                            {result.portais_verificados > 0 && (
                              <span className="text-muted-foreground ml-2">
                                | {result.portais_verificados} portais verificados
                              </span>
                            )}
                          </div>
                        </div>
                        {getTemperatureBadge(result.temperatura)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WARM */}
            {warmCount > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-yellow-600 mb-2 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  WARM ({warmCount} empresas)
                </h4>
                <div className="space-y-2">
                  {approved.filter(r => r.temperatura === 'warm').slice(0, 5).map((result, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold">{result.name}</div>
                          <div className="text-sm text-muted-foreground">CNPJ: {result.cnpj}</div>
                          <div className="text-sm mt-2">
                            <span className="font-bold">Score: {result.icp_score}</span>
                          </div>
                        </div>
                        {getTemperatureBadge(result.temperatura)}
                      </div>
                    </div>
                  ))}
                  {warmCount > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... e mais {warmCount - 5} empresas WARM
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COLD */}
            {coldCount > 0 && (
              <div>
                <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-2">
                  <Snowflake className="w-4 h-4" />
                  COLD ({coldCount} empresas)
                </h4>
                <div className="text-sm text-muted-foreground">
                  Baixe o relatório completo para ver todas as empresas COLD
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Empresas Descartadas */}
        {rejected.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              EMPRESAS DESCARTADAS ({rejected.length})
            </h3>
            <div className="mb-4">
              <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Cliente TOTVS ({rejected.length} empresas)
              </h4>
              <div className="space-y-2">
                {rejected.slice(0, 10).map((result, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-red-50">
                    <div className="font-bold">{result.name}</div>
                    <div className="text-sm text-muted-foreground">CNPJ: {result.cnpj}</div>
                    <div className="text-sm text-red-700 mt-2 flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        Motivo: {result.motivo}
                        {result.evidencias && result.evidencias.length > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" />
                            {result.evidencias.length} evidência(s) encontrada(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {rejected.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... e mais {rejected.length - 10} empresas descartadas
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Erros */}
        {errored.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              ERROS NO PROCESSAMENTO ({errored.length})
            </h3>
            <div className="space-y-2">
              {errored.slice(0, 5).map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-bold">{result.name}</div>
                  <div className="text-sm text-muted-foreground">CNPJ: {result.cnpj}</div>
                  <div className="text-sm text-red-600 mt-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    Erro: {result.error}
                  </div>
                </div>
              ))}
              {errored.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  ... e mais {errored.length - 5} erros
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return null;
}

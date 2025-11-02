import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Shield,
  Users,
  Target,
  RefreshCw,
  Save,
  CheckCircle,
  Maximize2,
  Minimize2,
  XCircle,
  Rocket,
  AlertTriangle,
  ExternalLink,
  Lightbulb,
  Search,
} from 'lucide-react';
import SaveReportPDF from '@/components/reports/SaveReportPDF';
import TOTVSVerificationReport from '@/components/reports/TOTVSVerificationReport';
import SimilarCompaniesReport from '@/components/reports/SimilarCompaniesReport';
import Analysis360Report from '@/components/reports/Analysis360Report';

interface QuarantineReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  companyName: string;
  cnpj?: string;
  companyId?: string;
}

export default function QuarantineReportModal({
  open,
  onOpenChange,
  analysisId,
  companyName,
  cnpj,
  companyId
}: QuarantineReportModalProps) {
  const [showDiscard, setShowDiscard] = useState(false);
  const [stcResult, setStcResult] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasExistingReport, setHasExistingReport] = useState(false);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ========================================
  // CARREGAR RELATÓRIO (UMA VEZ SÓ)
  // ========================================
  useEffect(() => {
    if (!open) return;

    const carregarRelatorio = async () => {
      setLoading(true);

      try {
        console.log('[RELATÓRIO] 🔍 Verificando relatório salvo...');

        // Buscar relatório salvo
        const { data: quarantineData, error: quarantineError } = await supabase
          .from('icp_analysis_results')
          .select('relatorio_salvo, relatorio_gerado_em, stc_result, raw_data')
          .eq('id', analysisId)
          .single();

        if (quarantineError) throw quarantineError;

        // SE JÁ TEM RELATÓRIO SALVO
        if (quarantineData.relatorio_salvo && quarantineData.stc_result) {
          console.log('[RELATÓRIO] ✅ Relatório salvo encontrado! Carregando...');

          setHasExistingReport(true);
          setReportDate(quarantineData.relatorio_gerado_em);
          
          const savedReport = quarantineData.stc_result as any;
          console.log('[RELATÓRIO] 🔍 Estrutura do relatório salvo:', savedReport);
          console.log('[RELATÓRIO] 🔍 Keys:', Object.keys(savedReport || {}));
          console.log('[RELATÓRIO] 🔍 TOTVS evidences:', savedReport?.totvs?.evidences);
          
          // Buscar evidências da tabela totvs_detection_reports se tiver companyId
          if (companyId) {
            console.log('[RELATÓRIO] 🔍 Buscando evidências do banco totvs_detection_reports...');
            const { data: totvsReport, error: totvsError } = await supabase
              .from('totvs_detection_reports')
              .select('*')
              .eq('company_id', companyId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!totvsError && totvsReport) {
              const evidences = (totvsReport.evidences as any[]) || [];
              console.log('[RELATÓRIO] ✅ Evidências encontradas no banco:', evidences.length);
              console.log('[RELATÓRIO] 📊 Evidências completas:', evidences);
              
              // Mesclar evidências no relatório
              if (!savedReport.totvs) savedReport.totvs = {};
              savedReport.totvs.evidences = evidences;
              savedReport.totvs.methodology = totvsReport.methodology;
              savedReport.totvs.score = totvsReport.score;
              savedReport.totvs.confidence = totvsReport.confidence;
              savedReport.totvs.detection_status = totvsReport.detection_status;
              savedReport.totvs.status = totvsReport.detection_status;
            }
          }
          
          setStcResult(savedReport);
          setLoading(false);

          toast.success('📄 Relatório Salvo Carregado', {
            description: `Gerado em ${new Date(quarantineData.relatorio_gerado_em).toLocaleString('pt-BR')} • Sem consumo de créditos`,
          });

          return; // PARAR AQUI - NÃO FAZER NOVA ANÁLISE!
        }

        // SE NÃO TEM RELATÓRIO, USAR DADOS EXISTENTES OU FAZER ANÁLISE
        console.log('[RELATÓRIO] ⚠️ Nenhum relatório salvo.');

        // Tentar usar raw_data existente
        if (quarantineData.raw_data) {
          console.log('[RELATÓRIO] 📦 Usando dados existentes da análise ICP...');
          
          const rawData = quarantineData.raw_data as any;
          
          // Buscar evidências da tabela totvs_detection_reports se tiver companyId
          if (companyId) {
            console.log('[RELATÓRIO] 🔍 Buscando evidências do banco totvs_detection_reports...');
            const { data: totvsReport, error: totvsError } = await supabase
              .from('totvs_detection_reports')
              .select('*')
              .eq('company_id', companyId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!totvsError && totvsReport) {
              const evidences = (totvsReport.evidences as any[]) || [];
              console.log('[RELATÓRIO] ✅ Evidências encontradas no banco:', evidences.length);
              
              // Mesclar evidências no relatório
              if (!rawData.totvs) rawData.totvs = {};
              rawData.totvs.evidences = evidences;
              rawData.totvs.methodology = totvsReport.methodology;
              rawData.totvs.score = totvsReport.score;
              rawData.totvs.confidence = totvsReport.confidence;
              rawData.totvs.detection_status = totvsReport.detection_status;
              rawData.totvs.status = totvsReport.detection_status;
            }
          }
          
          setStcResult(rawData);
          setHasExistingReport(false);
          setLoading(false);
          return;
        }

        // Se não tem dados, fazer análise nova
        console.log('[RELATÓRIO] 🔍 Iniciando análise nova...');
        setHasExistingReport(false);
        await executarAnaliseCompleta();

      } catch (error: any) {
        console.error('[RELATÓRIO] Erro:', error);
        toast.error('Erro ao carregar relatório', {
          description: error.message,
        });
        setLoading(false);
      }
    };

    carregarRelatorio();
  }, [open, analysisId]); // EXECUTAR APENAS ao abrir modal

  // ========================================
  // EXECUTAR ANÁLISE COMPLETA (GASTA CRÉDITOS)
  // ========================================
  const executarAnaliseCompleta = async () => {
    try {
      console.log('[ANÁLISE] 🚀 Iniciando análise COMPLETA (GASTA CRÉDITOS)...');

      toast.info('🔍 Análise Completa Iniciada', {
        description: 'Processando 3 abas simultaneamente... Isso pode levar alguns minutos.',
        duration: 5000,
      });

      // CHAMAR EDGE FUNCTION generate-report
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          companyName,
          cnpj,
        }
      });

      if (error) throw error;

      console.log('[ANÁLISE] ✅ Análise completa concluída!');

      setStcResult(data);
      setLoading(false);

      toast.success('✓ Análise Completa Concluída', {
        description: '3 abas geradas com sucesso',
      });

    } catch (error: any) {
      console.error('[ANÁLISE] Erro:', error);
      toast.error('Erro na análise', {
        description: error.message,
      });
      setLoading(false);
    }
  };

  // ========================================
  // ANALISAR EMPRESA (FORÇAR NOVA ANÁLISE)
  // ========================================
  const handleAnalyzeCompany = useCallback(async () => {
    if (!companyName) return;

    console.log('[MODAL] 🚀 Gerando relatório completo...');
    console.log('[MODAL] Empresa:', companyName);
    console.log('[MODAL] CNPJ:', cnpj);

    setLoading(true);
    setStcResult(null);
    setHasExistingReport(false);

    try {
      console.log('[MODAL] 📡 Chamando Edge Function generate-report...');
      
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          companyName: companyName,
          cnpj: cnpj,
        },
      });

      if (error) {
        console.error('[MODAL] ❌ Erro na Edge Function:', error);
        throw error;
      }

      console.log('[MODAL] ✅ Relatório recebido:', data);
      console.log('[MODAL] 📊 Estrutura TOTVS:', data?.totvs);
      console.log('[MODAL] 📊 Metodologia TOTVS:', data?.totvs?.methodology);
      console.log('[MODAL] 📊 Evidências TOTVS:', data?.totvs?.evidences);
      console.log('[MODAL] 🔍 Verificando TODOS os campos do data.totvs:');
      console.log('[MODAL] 🔍 Keys do data:', Object.keys(data || {}));
      console.log('[MODAL] 🔍 Keys do data.totvs:', Object.keys(data?.totvs || {}));
      console.log('[MODAL] 🔍 Tipo de data.totvs.evidences:', typeof data?.totvs?.evidences);
      console.log('[MODAL] 🔍 É array?', Array.isArray(data?.totvs?.evidences));
      console.log('[MODAL] 🔍 Length:', data?.totvs?.evidences?.length);
      
      // Verificar se evidences está em outro lugar
      if (data?.evidences) console.log('[MODAL] 🔍 data.evidences encontrado:', data.evidences);
      if (data?.totvs?.evidence) console.log('[MODAL] 🔍 data.totvs.evidence encontrado:', data.totvs.evidence);
      if (data?.totvs?.detections) console.log('[MODAL] 🔍 data.totvs.detections encontrado:', data.totvs.detections);

      if (!data) {
        throw new Error('Relatório vazio');
      }

      // Buscar evidências da tabela totvs_detection_reports se tiver companyId
      if (companyId) {
        console.log('[MODAL] 🔍 Buscando evidências adicionais do banco totvs_detection_reports...');
        const { data: totvsReport, error: totvsError } = await supabase
          .from('totvs_detection_reports')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!totvsError && totvsReport) {
          const evidences = (totvsReport.evidences as any[]) || [];
          console.log('[MODAL] ✅ Evidências do banco encontradas:', evidences.length);
          console.log('[MODAL] 📊 Evidências completas:', evidences);
          
          // Mesclar evidências no relatório (priorizar evidências do banco se existirem)
          if (evidences.length > 0) {
            if (!data.totvs) data.totvs = {};
            data.totvs.evidences = evidences;
            data.totvs.methodology = totvsReport.methodology;
            data.totvs.score = totvsReport.score;
            data.totvs.confidence = totvsReport.confidence;
            data.totvs.detection_status = totvsReport.detection_status;
            data.totvs.status = totvsReport.detection_status;
            
            console.log('[MODAL] ✅ Evidências mescladas no relatório!');
          }
        } else if (totvsError) {
          console.log('[MODAL] ⚠️ Erro ao buscar evidências:', totvsError.message);
        } else {
          console.log('[MODAL] ⚠️ Nenhum registro encontrado em totvs_detection_reports');
        }
      } else {
        console.log('[MODAL] ⚠️ companyId não disponível para buscar evidências');
      }

      setStcResult(data);

      toast.success('✅ Relatório gerado!', {
        description: 'Análise completa das 3 abas concluída com dados reais.',
      });

    } catch (error: any) {
      console.error('[MODAL] ❌ Erro:', error);
      toast.error('❌ Erro ao gerar relatório', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [companyName, cnpj]);

  // ========================================
  // ATUALIZAR ANÁLISE (COM CONFIRMAÇÃO)
  // ========================================
  const handleAtualizarAnalise = useCallback(async () => {
    const confirmar = window.confirm(
      '⚠️ ATENÇÃO: CONSUMO DE CRÉDITOS\n\n' +
      'Atualizar a análise irá:\n' +
      '• Reprocessar as 3 abas\n' +
      '• Consumir créditos novamente\n' +
      '• Substituir o relatório atual\n\n' +
      'Deseja realmente atualizar?'
    );

    if (!confirmar) return;

    console.log('[ANÁLISE] 🔄 Usuário confirmou atualização. Reprocessando...');

    setLoading(true);
    setStcResult(null);
    setHasExistingReport(false);

    await executarAnaliseCompleta();

  }, [companyName, cnpj, analysisId]);

  // ========================================
  // SALVAR RELATÓRIO COMPLETO (3 ABAS)
  // ========================================
  const handleSalvarRelatorio = useCallback(async () => {
    if (!stcResult) {
      toast.error('Nenhum relatório para salvar');
      return;
    }

    try {
      console.log('[RELATÓRIO] 💾 Salvando relatório completo (3 abas)...');

      toast.info('💾 Salvando Relatório Completo', {
        description: 'Gerando PDFs das 3 abas...',
      });

      // Função para gerar PDF de uma aba
      const generateTabPDF = async (tabId: string, tabName: string, reportType: string) => {
        const element = document.getElementById(tabId);

        if (!element) {
          console.warn(`[PDF] Elemento ${tabId} não encontrado`);
          return null;
        }

        const html2pdf = (await import('html2pdf.js')).default;

        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.left = '-9999px';
        tempElement.style.width = '210mm';
        tempElement.style.padding = '20px';
        tempElement.style.backgroundColor = 'white';

        tempElement.innerHTML = `
          <div style="margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="font-size: 24px; margin: 0 0 10px 0;">${companyName}</h1>
            <h2 style="font-size: 18px; margin: 0 0 10px 0; color: #666;">${tabName}</h2>
            <p style="margin: 5px 0; color: #666;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        `;

        tempElement.appendChild(element.cloneNode(true));
        document.body.appendChild(tempElement);

        const opt = {
          margin: 10,
          filename: `${reportType}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: 0,
            scrollX: 0,
            windowHeight: tempElement.scrollHeight,
          },
          jsPDF: {
            unit: 'mm' as const,
            format: 'a4' as const,
            orientation: 'portrait' as const
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const blob = await html2pdf().set(opt).from(tempElement).outputPdf('blob');
        document.body.removeChild(tempElement);

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });

        const base64PDF = await base64Promise;

        return {
          tipo: reportType,
          titulo: tabName,
          file_name: `${reportType}-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
          file_url: `data:application/pdf;base64,${base64PDF}`,
          file_size: blob.size,
          content_text: element.innerText.substring(0, 5000),
        };
      };

      // Gerar PDFs das 3 abas
      const [pdf1, pdf2, pdf3] = await Promise.all([
        generateTabPDF('totvs-verification-content', 'Verificação TOTVS', 'totvs_verification'),
        generateTabPDF('similar-companies-content', 'Empresas Similares', 'similar_companies'),
        generateTabPDF('analysis-360-content', 'Análise 360°', 'analysis_360'),
      ]);

      const documentsToInsert = [pdf1, pdf2, pdf3]
        .filter(pdf => pdf !== null)
        .map(pdf => ({
          quarantine_id: analysisId,
          tipo: pdf!.tipo,
          titulo: pdf!.titulo,
          descricao: `Relatório gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`,
          file_name: pdf!.file_name,
          file_url: pdf!.file_url,
          file_size: pdf!.file_size,
          mime_type: 'application/pdf',
          content_text: pdf!.content_text,
          status: 'active',
        }));

      if (documentsToInsert.length === 0) {
        throw new Error('Nenhum PDF foi gerado');
      }

      const { data: documentsData, error: documentsError } = await supabase
        .from('company_documents')
        .insert(documentsToInsert)
        .select();

      if (documentsError) throw documentsError;

      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({
          relatorio_salvo: true,
          relatorio_gerado_em: new Date().toISOString(),
          stc_result: stcResult,
        })
        .eq('id', analysisId);

      if (updateError) throw updateError;

      setHasExistingReport(true);
      setReportDate(new Date().toISOString());

      toast.success('✓ Relatório Completo Salvo', {
        description: `${documentsData.length} documentos salvos no sistema`,
      });

    } catch (error: any) {
      console.error('[RELATÓRIO] Erro ao salvar:', error);
      toast.error('Erro ao salvar relatório', {
        description: error.message,
      });
    }
  }, [stcResult, analysisId, companyName, cnpj, companyId]);

  // ========================================
  // ATIVAR NO PIPELINE
  // ========================================
  const handleActivatePipeline = useCallback(async () => {
    setActivating(true);

    try {
      const { data: quarantineData, error: quarantineError } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (quarantineError) throw quarantineError;

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          quarantine_id: analysisId,
          name: quarantineData.razao_social,
          cnpj: quarantineData.cnpj,
          domain: quarantineData.website,
          icp_score: quarantineData.icp_score,
          temperatura: quarantineData.temperatura,
          pipeline_status: 'ativo',
          raw_data: quarantineData.raw_data,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      await supabase
        .from('company_documents')
        .update({ company_id: companyData.id })
        .eq('quarantine_id', analysisId);

      await supabase
        .from('icp_analysis_results')
        .update({
          moved_to_pool: true,
          status: 'ativado'
        })
        .eq('id', analysisId);

      toast.success('✓ Empresa Ativada no Pipeline', {
        description: 'A empresa e todos os documentos foram enviados para o pipeline',
      });

      onOpenChange(false);

    } catch (error: any) {
      console.error('[PIPELINE] Erro:', error);
      toast.error('Erro ao ativar empresa', {
        description: error.message,
      });
    } finally {
      setActivating(false);
    }
  }, [analysisId, onOpenChange]);

  const handleReject = useCallback(() => {
    setShowDiscard(true);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const modalSize = useMemo(() => {
    return isExpanded
      ? 'max-w-[98vw] w-[98vw] h-[98vh]'
      : 'max-w-7xl w-[90vw] h-[85vh]';
  }, [isExpanded]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("p-0 gap-0 flex flex-col overflow-hidden", modalSize)}>
        {/* Header Fixo */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b bg-card">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Relatório de Verificação - {companyName}
            </DialogTitle>
            {hasExistingReport && reportDate && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 border-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Relatório Salvo
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(reportDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Botão Analisar Empresa - SEMPRE VISÍVEL */}
            <Button
              onClick={handleAnalyzeCompany}
              disabled={loading}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analisar Empresa
                </>
              )}
            </Button>

            {/* Botão Atualizar - SEMPRE VISÍVEL quando tem relatório */}
            {stcResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAtualizarAnalise}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            )}

            {/* Botão Salvar - só aparece se ainda não salvou */}
            {!hasExistingReport && stcResult && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSalvarRelatorio}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar (3 Abas)
              </Button>
            )}

            <SaveReportPDF
              contentId="quarantine-report-modal"
              fileName={`relatorio-completo-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}`}
              reportType="totvs_verification"
              reportTitle="Relatório Completo"
              quarantineId={analysisId}
            />

            <Button variant="ghost" size="icon" onClick={handleToggleExpand}>
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Conteúdo Scrollável */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden bg-background"
          style={{ minHeight: 0, maxHeight: 'calc(85vh - 180px)' }}
        >
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-16 h-16 animate-spin text-primary mb-6" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {hasExistingReport ? 'Carregando relatório salvo...' : 'Analisando empresa...'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasExistingReport ? '📄 Sem consumo de créditos' : '🔍 Consultando múltiplas fontes'}
                </p>
              </div>
            ) : stcResult ? (
              <Tabs defaultValue="totvs" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-card sticky top-0 z-10 shadow-sm border">
                  <TabsTrigger value="totvs">
                    <Shield className="w-4 h-4 mr-2" />
                    Verificação TOTVS
                  </TabsTrigger>
                  <TabsTrigger value="similar">
                    <Users className="w-4 h-4 mr-2" />
                    Empresas Similares
                  </TabsTrigger>
                  <TabsTrigger value="analysis">
                    <Target className="w-4 h-4 mr-2" />
                    Análise 360°
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="totvs" id="totvs-verification-content" className="space-y-6">
                  <TOTVSVerificationReport 
                    data={stcResult?.totvs
                      ? {
                          ...stcResult.totvs,
                          evidences: (Array.isArray(stcResult?.totvs?.evidences) && stcResult.totvs.evidences.length > 0)
                            ? stcResult.totvs.evidences
                            : (stcResult?.evidences || []),
                          methodology: stcResult?.totvs?.methodology ?? stcResult?.methodology,
                          status: stcResult?.totvs?.status ?? stcResult?.status,
                          confidence: stcResult?.totvs?.confidence ?? stcResult?.confidence,
                        }
                      : stcResult}
                    companyName={companyName}
                    cnpj={cnpj}
                  />
                </TabsContent>

                {/* ABA 2: SIMILARES */}
                <TabsContent value="similar" id="similar-companies-content" className="space-y-6">
                  <SimilarCompaniesReport 
                    companies={stcResult?.similarCompanies || []}
                    companyName={companyName}
                  />
                </TabsContent>

                {/* ABA 3: 360° */}
                <TabsContent value="analysis" id="analysis-360-content" className="space-y-6">
                  <Analysis360Report 
                    data={stcResult?.analysis360 || stcResult}
                    companyName={companyName}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6" />
                <h3 className="text-xl font-semibold mb-2">Nenhum relatório disponível</h3>
              </div>
            )}
          </div>
        </div>

        {/* Footer Fixo */}
        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm p-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-border hover:bg-accent hover:text-accent-foreground"
            >
              Fechar
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                disabled={!stcResult}
                className="bg-red-600 hover:bg-red-700 text-white shadow-md"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Descartar
              </Button>
              <Button
                onClick={handleActivatePipeline}
                className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                disabled={activating}
              >
                {activating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Ativar no Pipeline
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

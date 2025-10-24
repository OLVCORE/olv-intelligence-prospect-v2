import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosticUploadProps {
  companyId: string;
  companyName: string;
}

export function DiagnosticUpload({ companyId, companyName }: DiagnosticUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máx 10MB)');
        return;
      }
      setFile(selectedFile);
      setAnalysis(null);
      toast.success(`${selectedFile.name} selecionado`);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Para simplicidade, vamos assumir que é texto puro
    // Em produção, você usaria uma biblioteca como pdf.js
    return await file.text();
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload do arquivo para storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${Date.now()}-diagnostic.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('competitive-docs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      console.log('[Diagnostic Upload] Arquivo enviado:', fileName);
      toast.success('Arquivo enviado! Analisando...');

      setUploading(false);
      setAnalyzing(true);

      // 2. Extrair texto do arquivo
      const diagnosticText = await extractTextFromPDF(file);

      // 3. Analisar com IA
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-sdr-diagnostic',
        {
          body: {
            companyId,
            diagnosticText,
            fileName: file.name
          }
        }
      );

      if (analysisError) throw analysisError;

      if (analysisData.success) {
        setAnalysis(analysisData.analysis);

        // 4. Salvar diagnóstico no banco
        const { error: insertError } = await supabase
          .from('sdr_diagnostics')
          .insert({
            company_id: companyId,
            diagnostic_file_path: uploadData.path,
            diagnostic_summary: {},
            technologies_found: analysisData.analysis.technologies_found || [],
            gaps_identified: analysisData.analysis.gaps_identified || [],
            recommended_products: analysisData.analysis.recommended_products || [],
            competitive_analysis: analysisData.analysis.competitive_analysis || {},
            ai_insights: analysisData.analysis.ai_insights || ''
          });

        if (insertError) throw insertError;

        toast.success('Diagnóstico analisado com sucesso!');
      }

    } catch (error: any) {
      console.error('[Diagnostic Upload] Erro:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload de Diagnóstico Técnico
        </CardTitle>
        <CardDescription>
          Envie o diagnóstico da empresa {companyName} para análise inteligente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Arquivo do Diagnóstico (PDF, DOCX - máx 10MB)</Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="diagnostic-file"
            />
            <Label
              htmlFor="diagnostic-file"
              className="flex-1 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Upload className="h-5 w-5" />
                {file ? file.name : 'Clique para selecionar arquivo'}
              </div>
            </Label>
          </div>
        </div>

        <Button
          onClick={handleUploadAndAnalyze}
          disabled={!file || uploading || analyzing}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando arquivo...
            </>
          ) : analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Enviar e Analisar
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Análise Concluída</span>
            </div>

            {/* Tecnologias Encontradas */}
            {analysis.technologies_found?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Tecnologias Identificadas:</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.technologies_found.map((tech: any, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {tech.name} {tech.version ? `(${tech.version})` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps Identificados */}
            {analysis.gaps_identified?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Lacunas Identificadas:</h4>
                <div className="space-y-2">
                  {analysis.gaps_identified.map((gap: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{gap.area}:</span> {gap.problem}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {gap.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Produtos Recomendados */}
            {analysis.recommended_products?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-primary">Produtos TOTVS Recomendados:</h4>
                <div className="space-y-2">
                  {analysis.recommended_products.map((prod: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{prod.product_sku}</p>
                            <p className="text-sm text-muted-foreground">{prod.reason}</p>
                          </div>
                          <Badge>{prod.priority}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Insights da IA */}
            {analysis.ai_insights && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Resumo da Análise:</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.ai_insights}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, XCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { mapAllColumns, getSystemFields, getFieldLabel, type ColumnMapping } from '@/lib/csvMapper';

type Step = 'upload' | 'mapping' | 'analyzing' | 'complete';

export default function ICPBulkAnalysisWithMapping() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [analysisStats, setAnalysisStats] = useState({ success: 0, errors: 0, total: 0 });
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
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
          title: "✅ Arquivo carregado!",
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
    updated[index].systemField = newField || null;
    updated[index].status = newField ? 'mapped' : 'unmapped';
    setMappings(updated);
  };

  const handleAnalyze = async () => {
    setStep('analyzing');
    
    let successCount = 0;
    let errorCount = 0;
    const total = allData.length;
    const results: any[] = [];

    try {
      const fieldMap: Record<string, string> = {};
      mappings.forEach(m => {
        if (m.systemField) {
          fieldMap[m.csvColumn] = m.systemField;
        }
      });

      for (let i = 0; i < allData.length; i++) {
        const row = allData[i];
        
        try {
          const companyData: any = {};
          
          Object.entries(row).forEach(([csvCol, value]) => {
            const systemField = fieldMap[csvCol];
            if (systemField && value) {
              companyData[systemField] = value;
            }
          });

          if (!companyData.cnpj) {
            throw new Error('CNPJ não encontrado');
          }

          const { data: icpScore, error } = await supabase.functions.invoke('calculate-icp-score-advanced', {
            body: { company: companyData }
          });

          if (error) throw error;

          results.push({
            ...companyData,
            icp_score: icpScore?.score || 0,
            temperature: icpScore?.temperature || 'cold',
            pain_points: icpScore?.pain_points || [],
            recommended_products: icpScore?.recommended_products || [],
            status: 'success',
          });

          successCount++;

        } catch (err) {
          console.error('Erro ao analisar linha:', err);
          
          results.push({
            ...row,
            icp_score: 0,
            status: 'error',
            error: err instanceof Error ? err.message : 'Erro desconhecido',
          });
          
          errorCount++;
        }

        setAnalysisStats({ success: successCount, errors: errorCount, total });
      }

      setAnalysisResults(results);
      setStep('complete');
      
      toast({
        title: "🎉 Análise concluída!",
        description: `${successCount} empresas analisadas com sucesso. ${errorCount > 0 ? `${errorCount} erros.` : ''}`,
      });

    } catch (err) {
      console.error('Erro na análise:', err);
      toast({
        title: "Erro na análise",
        description: "Ocorreu um erro ao analisar os dados.",
        variant: "destructive",
      });
      setStep('mapping');
    }
  };

  const handleDownloadResults = () => {
    const csv = Papa.unparse(analysisResults);
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
    setAnalysisStats({ success: 0, errors: 0, total: 0 });
    setAnalysisResults([]);
  };

  if (step === 'upload') {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Análise ICP em Massa</h2>
            <p className="text-muted-foreground mb-6">
              Faça upload de qualquer planilha CSV. O sistema vai reconhecer os campos automaticamente 
              e calcular o score ICP para cada empresa.
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
                        value={mapping.systemField || ''}
                        onValueChange={(value) => handleMappingChange(index, value)}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">❌ Não mapear</SelectItem>
                          {mapping.systemField && (
                            <SelectItem value={mapping.systemField}>
                              ⭐ {getFieldLabel(mapping.systemField)} (Sugerido)
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

  if (step === 'analyzing') {
    const progress = analysisStats.total > 0 
      ? ((analysisStats.success + analysisStats.errors) / analysisStats.total) * 100 
      : 0;

    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Analisando empresas...</h2>
            <Progress value={progress} className="w-full max-w-md mx-auto mb-4" />
            <p className="text-muted-foreground">
              {analysisStats.success + analysisStats.errors} de {analysisStats.total} empresas processadas
            </p>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <span className="text-green-600">✓ {analysisStats.success} sucesso</span>
              {analysisStats.errors > 0 && (
                <span className="text-red-600">✗ {analysisStats.errors} erros</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (step === 'complete') {
    const avgScore = analysisResults.reduce((sum, r) => sum + (r.icp_score || 0), 0) / analysisResults.length;

    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <div>
              <h2 className="text-2xl font-bold mb-4">🎉 Análise Concluída!</h2>
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-3xl font-bold">{analysisStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{analysisStats.success}</div>
                  <div className="text-sm text-muted-foreground">Sucesso</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{analysisStats.errors}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Score ICP médio: <span className="font-bold text-primary">{avgScore.toFixed(1)}</span>
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={resetAnalysis}>
                Analisar outra planilha
              </Button>
              <Button onClick={handleDownloadResults}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Resultados (CSV)
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Resultados da Análise</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Score ICP</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisResults.slice(0, 10).map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {result.cnpj}
                    </TableCell>
                    <TableCell>
                      {result.razao_social || result.nome_da_empresa || result.nome_fantasia}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          result.icp_score >= 80 ? 'bg-green-100 text-green-800' :
                          result.icp_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {result.icp_score?.toFixed(1) || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          result.temperature === 'hot' ? 'bg-red-100 text-red-800' :
                          result.temperature === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {result.temperature || 'cold'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.status === 'success' ? (
                        <Badge className="bg-green-100 text-green-800">✓ Sucesso</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">✗ Erro</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {analysisResults.length > 10 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Mostrando 10 de {analysisResults.length} resultados. Baixe o CSV para ver todos.
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, AlertCircle, XCircle, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import { mapAllColumns, getSystemFields, getFieldLabel, type ColumnMapping } from '@/lib/csvMapper';

type Step = 'upload' | 'mapping' | 'importing' | 'complete';

export default function CSVUploadWithMapping() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [importStats, setImportStats] = useState({ success: 0, errors: 0, total: 0 });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

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
    updated[index].systemField = newField === '__SKIP__' ? null : newField;
    updated[index].status = newField && newField !== '__SKIP__' ? 'mapped' : 'unmapped';
    setMappings(updated);
  };

  const handleImport = async () => {
    setStep('importing');
    
    let successCount = 0;
    let errorCount = 0;
    const total = allData.length;

    try {
      const fieldMap: Record<string, string> = {};
      mappings.forEach(m => {
        if (m.systemField) {
          fieldMap[m.csvColumn] = m.systemField;
        }
      });

      for (const row of allData) {
        try {
          const companyData: any = {};
          
          Object.entries(row).forEach(([csvCol, value]) => {
            const systemField = fieldMap[csvCol];
            if (systemField && systemField !== '__SKIP__' && value) {
              companyData[systemField] = value;
            }
          });

          const { error } = await supabase
            .from('companies')
            .insert([companyData]);

          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error('Erro ao importar linha:', err);
          errorCount++;
        }

        setImportStats({ success: successCount, errors: errorCount, total });
      }

      setStep('complete');
      
      toast({
        title: "🎉 Importação concluída!",
        description: `${successCount} empresas importadas com sucesso. ${errorCount > 0 ? `${errorCount} erros.` : ''}`,
      });

    } catch (err) {
      console.error('Erro na importação:', err);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar os dados.",
        variant: "destructive",
      });
      setStep('mapping');
    }
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

  const resetImport = () => {
    setStep('upload');
    setMappings([]);
    setPreviewData([]);
    setAllData([]);
    setImportStats({ success: 0, errors: 0, total: 0 });
  };

  if (step === 'upload') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8">
          <div className="text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Upload de Planilha CSV</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Faça upload de qualquer planilha CSV. O sistema vai reconhecer os campos automaticamente 
              usando inteligência artificial e mapeamento por similaridade.
            </p>
            <div className="max-w-md mx-auto">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Aceita arquivos .csv até 20MB
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'mapping') {
    const mappedCount = mappings.filter(m => m.status === 'mapped').length;
    const reviewCount = mappings.filter(m => m.status === 'review').length;
    const unmappedCount = mappings.filter(m => m.status === 'unmapped').length;

    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Mapeamento de Colunas</h2>
              <p className="text-muted-foreground">
                Revise o mapeamento automático. Ajuste se necessário.
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <Badge className="bg-green-100 text-green-800">{mappedCount} Mapeados</Badge>
              <Badge className="bg-yellow-100 text-yellow-800">{reviewCount} Revisar</Badge>
              <Badge className="bg-red-100 text-red-800">{unmappedCount} Não mapeados</Badge>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Coluna da Planilha</TableHead>
                  <TableHead className="w-[300px]">Campo do Sistema</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
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
                        value={mapping.systemField || "__SKIP__"}
                        onValueChange={(value) => handleMappingChange(index, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__SKIP__">❌ Não mapear</SelectItem>
                          {mapping.systemField && mapping.systemField !== '__SKIP__' && (
                            <SelectItem value={mapping.systemField}>
                              ⭐ {getFieldLabel(mapping.systemField)} (Sugerido)
                            </SelectItem>
                          )}
                          {mapping.alternatives.map((alt) => (
                            <SelectItem key={alt.field} value={alt.field}>
                              {getFieldLabel(alt.field)} ({alt.confidence}%)
                            </SelectItem>
                          ))}
                          <SelectItem value="---" disabled>
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
                        <div key={i} className="truncate max-w-[200px]">
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
            <Button variant="outline" onClick={resetImport}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={mappedCount === 0}
            >
              <Upload className="w-4 h-4 mr-2" />
              Confirmar e Importar ({allData.length} linhas)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'importing') {
    const progress = importStats.total > 0 ? (importStats.success + importStats.errors) / importStats.total * 100 : 0;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-4">Importando dados...</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-muted-foreground">
              {importStats.success + importStats.errors} de {importStats.total} linhas processadas
            </p>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <span className="text-green-600">✓ {importStats.success} sucesso</span>
              {importStats.errors > 0 && (
                <span className="text-red-600">✗ {importStats.errors} erros</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">🎉 Importação Concluída!</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">{importStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{importStats.success}</div>
                <div className="text-sm text-muted-foreground">Sucesso</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{importStats.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mb-6">
            Taxa de sucesso: {Math.round((importStats.success / importStats.total) * 100)}%
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={resetImport} variant="outline">
              Importar outra planilha
            </Button>
            <Button onClick={() => navigate('/search')}>
              Ver empresas importadas
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_COMPANIES = 500;

export function BulkUploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const csvContent = `CNPJ,Razao Social,Nome Fantasia,Prioridade (1-5),Instagram,LinkedIn,Facebook,YouTube,X/Twitter,Website,Observacoes
00000000000191,,Nome Fantasia Exemplo,3,exemploempresa,exemploempresa,exemploempresa,exemploempresa,exemploempresa,https://www.exemplo.com.br,Observações opcionais sobre a empresa`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-empresas.csv';
    link.click();
    toast.success("Template baixado com sucesso!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error("Por favor, selecione um arquivo CSV válido");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const row: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/^"|"$/g, '').trim() || '';
        row[header] = value;
      });
      
      return row;
    }).filter(row => row.CNPJ || row['Razao Social'] || row['Nome Fantasia']);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const text = await file.text();
      const companies = parseCSV(text);

      if (companies.length === 0) {
        toast.error("Nenhuma empresa encontrada no arquivo");
        setIsUploading(false);
        return;
      }

      if (companies.length > MAX_COMPANIES) {
        toast.error(`Limite de ${MAX_COMPANIES} empresas por upload. Seu arquivo contém ${companies.length}.`);
        setIsUploading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('bulk-upload-companies', {
        body: { companies }
      });

      if (error) throw error;

      setResult(data);
      setProgress(100);
      
      if (data.success > 0) {
        toast.success(`${data.success} empresas importadas com sucesso!`);
      }
      
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} empresas com erros`);
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error("Erro ao processar arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upload em Massa de Leads
          </DialogTitle>
          <DialogDescription>
            Importe até {MAX_COMPANIES} empresas de uma vez usando nosso template CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Template CSV
            </Button>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Clique para selecionar outro arquivo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Clique para selecionar arquivo CSV</p>
                    <p className="text-xs text-muted-foreground">
                      ou arraste e solte aqui
                    </p>
                  </div>
                )}
              </label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processando...</span>
                  <span className="text-primary font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {result && (
              <div className="space-y-3">
                {result.success > 0 && (
                  <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                      {result.success} empresas importadas com sucesso
                    </AlertDescription>
                  </Alert>
                )}
                
                {result.errors.length > 0 && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      <p className="font-medium mb-2">{result.errors.length} erros encontrados:</p>
                      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>• ... e mais {result.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar Empresas
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

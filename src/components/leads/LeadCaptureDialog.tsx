import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LeadCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadCaptureDialog({ open, onOpenChange }: LeadCaptureDialogProps) {
  const { uploadCSV } = useLeadCapture();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Arquivo CSV vazio');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const leads = lines.slice(1)
      .filter(line => line.trim())
      .map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const lead: any = {};
        
        headers.forEach((header, idx) => {
          if (values[idx]) {
            lead[header] = values[idx];
          }
        });
        
        return lead;
      })
      .filter(lead => Object.keys(lead).length > 0);

    return leads;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Ler arquivo CSV
      const text = await file.text();
      const leads = parseCSV(text);

      if (leads.length === 0) {
        throw new Error('Nenhum lead válido encontrado no arquivo');
      }

      console.log(`[Upload] Processando ${leads.length} leads`);

      // Upload
      await uploadCSV.mutateAsync({ leads });
      
      onOpenChange(false);
      setFile(null);
    } catch (err: any) {
      console.error('Erro ao processar CSV:', err);
      setError(err.message || 'Erro ao processar arquivo CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Leads (CSV)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> nome, cnpj, setor, estado, cidade, funcionarios, website, email, telefone
              <br />
              <span className="text-xs text-muted-foreground">
                Colunas alternativas aceitas: empresa, razao_social, uf, site, telefone
              </span>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="mt-2"
            />
          </div>

          {file && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tamanho: {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setFile(null);
                setError(null);
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

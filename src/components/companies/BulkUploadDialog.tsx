import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const MAX_COMPANIES = 1000;

export function BulkUploadDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const BOM = '\uFEFF';
    
    const csvContent = `CNPJ,Nome da Empresa,Website,Instagram,LinkedIn,Produto/Categoria,Marca,Link Produto/Marketplace,CEP,Estado,Pais,Municipio,Bairro,Logradouro,Numero
00.000.000/0000-00,Empresa Exemplo LTDA,https://exemplo.com.br,@exemploempresa,linkedin.com/company/exemplo,ERP,Marca Exemplo,mercadolivre.com.br/produto,01310-100,SP,Brasil,São Paulo,Centro,Avenida Paulista,1578
53.113.791/0001-22,TOTVS SA,https://www.totvs.com,@totvs,linkedin.com/company/totvs,Software ERP,TOTVS,,04711-904,SP,Brasil,São Paulo,Brooklin,Avenida Braz Leme,1000`;
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-importacao-empresas.csv';
    link.click();
    toast.success("Template baixado com sucesso!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target?.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.tsv', '.xlsx', '.xls'];
      const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension) {
        toast.error("Formato não suportado", {
          description: "Use: CSV, TSV, XLSX ou XLS"
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const normalizeValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    // Trata valores inválidos
    const invalidValues = ['não encontrado', 'nao encontrado', '---', '###', 'n/a', 'na', '', 'null', 'undefined'];
    return invalidValues.includes(str.toLowerCase()) ? '' : str;
  };

  const detectSeparator = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0];
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    
    if (tabs > 0) return '\t';
    return semicolons > commas ? ';' : ',';
  };

  const normalizeHeader = (header: string): string => {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const mapHeaders = (headers: string[]): Map<string, string> => {
    const mapping = new Map<string, string>();
    const normalized = headers.map(h => normalizeHeader(h));
    
    const headerMap: { [key: string]: string[] } = {
      'CNPJ': ['cnpj', 'cnpj da empresa', 'cnpj empresa'],
      'Nome da Empresa': ['nome', 'nome da empresa', 'razao social', 'empresa'],
      'Website': ['website', 'site', 'url', 'website da empresa'],
      'Instagram': ['instagram', 'insta', '@instagram'],
      'LinkedIn': ['linkedin', 'link linkedin', 'linkedin url'],
      'Produto/Categoria': ['produto', 'categoria', 'produto/categoria', 'tipo'],
      'Marca': ['marca', 'brand'],
      'Link Produto/Marketplace': ['link produto', 'marketplace', 'link'],
      'CEP': ['cep', 'codigo postal'],
      'Estado': ['estado', 'uf', 'state'],
      'Pais': ['pais', 'país', 'country'],
      'Municipio': ['municipio', 'município', 'cidade', 'city'],
      'Bairro': ['bairro', 'neighborhood'],
      'Logradouro': ['logradouro', 'endereco', 'endereço', 'rua', 'address'],
      'Numero': ['numero', 'número', 'num', 'number']
    };

    normalized.forEach((norm, idx) => {
      for (const [standard, variations] of Object.entries(headerMap)) {
        if (variations.includes(norm)) {
          mapping.set(standard, headers[idx]);
          break;
        }
      }
    });

    console.log('🔄 Mapeamento de headers:', Object.fromEntries(mapping));
    return mapping;
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            throw new Error('Planilha vazia ou sem dados');
          }
          
          const headers = (jsonData[0] as any[]).map(h => String(h).trim());
          const headerMapping = mapHeaders(headers);
          
          const rows: any[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as any[];
            const row: any = {};
            
            headers.forEach((rawHeader, index) => {
              const value = normalizeValue(rowData[index]);
              
              for (const [standard, mapped] of headerMapping.entries()) {
                if (mapped === rawHeader) {
                  row[standard] = value;
                  break;
                }
              }
            });
            
            const hasIdentifier = row.CNPJ || row['Nome da Empresa'] || row.Website || 
                                  row.Instagram || row.LinkedIn;
            
            if (hasIdentifier) {
              rows.push(row);
            }
          }
          
          console.log(`✅ ${rows.length} empresas válidas de ${jsonData.length - 1} linhas (Excel)`);
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVLine = (line: string, separator: string = ','): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(v => v.replace(/^"|"$/g, '').trim());
  };

  const parseCSV = (text: string): any[] => {
    text = text.replace(/^\uFEFF/, '');
    
    const separator = detectSeparator(text);
    console.log(`📊 Separador detectado: "${separator === '\t' ? 'TAB' : separator}"`);
    
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('Arquivo vazio ou sem dados');
    }
    
    const headerLine = lines[0];
    const rawHeaders = parseCSVLine(headerLine, separator);
    const headerMapping = mapHeaders(rawHeaders);
    
    console.log('📋 Cabeçalhos detectados:', rawHeaders);
    
    const rows: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      try {
        const values = parseCSVLine(line, separator);
        const row: any = {};
        
        rawHeaders.forEach((rawHeader, index) => {
          const value = normalizeValue(values[index]);
          
          for (const [standard, mapped] of headerMapping.entries()) {
            if (mapped === rawHeader) {
              row[standard] = value;
              break;
            }
          }
        });
        
        const hasIdentifier = row.CNPJ || row['Nome da Empresa'] || row.Website || 
                              row.Instagram || row.LinkedIn;
        
        if (hasIdentifier) {
          rows.push(row);
          console.log(`✓ Linha ${i + 1}:`, row['Nome da Empresa'] || row.CNPJ || 'Sem nome');
        } else {
          console.warn(`✗ Linha ${i + 1}: Sem identificadores válidos`);
        }
      } catch (error) {
        console.warn(`Erro ao processar linha ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ ${rows.length} empresas válidas de ${lines.length - 1} linhas`);
    return rows;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setResult(null);

    try {
      let companies: any[] = [];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        toast.info("Processando planilha Excel...");
        companies = await parseExcel(file);
      } else {
        const text = await file.text();
        companies = parseCSV(text);
      }

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
      toast.error("Erro ao processar arquivo", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) {
      toast.error("Insira a URL do Google Sheets");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setResult(null);

    try {
      let csvUrl = googleSheetUrl;
      
      if (googleSheetUrl.includes('/edit')) {
        csvUrl = googleSheetUrl.replace('/edit', '/export?format=csv');
      } else if (!googleSheetUrl.includes('/export')) {
        csvUrl = googleSheetUrl + '/export?format=csv';
      }

      toast.info("Baixando dados do Google Sheets...");
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Não foi possível acessar a planilha. Verifique se está pública.');
      }

      const text = await response.text();
      const companies = parseCSV(text);

      if (companies.length === 0) {
        toast.error("Nenhuma empresa encontrada na planilha");
        setIsUploading(false);
        return;
      }

      if (companies.length > MAX_COMPANIES) {
        toast.error(`Limite de ${MAX_COMPANIES} empresas. A planilha contém ${companies.length}.`);
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
        toast.success(`${data.success} empresas importadas do Google Sheets!`);
      }
      
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} empresas com erros`);
      }

    } catch (error) {
      console.error('Erro ao importar do Google Sheets:', error);
      toast.error("Erro ao importar planilha", {
        description: error instanceof Error ? error.message : "Verifique se a planilha está pública"
      });
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upload em Massa de Leads
          </DialogTitle>
          <DialogDescription>
            Importe até {MAX_COMPANIES} empresas via arquivo ou Google Sheets
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Arquivo</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-6 py-4">
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

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Formatos aceitos:</strong> CSV, TSV, XLSX, XLS
                <br />
                <strong>Separadores:</strong> vírgula (,), ponto e vírgula (;) ou TAB
                <br />
                <strong>Valores vazios:</strong> "não encontrado", "---", "###" são ignorados
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls"
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
                      <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                      <p className="text-xs text-muted-foreground">
                        CSV, TSV, XLSX ou XLS
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
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6 py-4">
            <Alert>
              <LinkIcon className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-2">
                <p><strong>Como usar:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Abra sua planilha no Google Sheets</li>
                  <li>Clique em "Compartilhar" → "Qualquer pessoa com o link"</li>
                  <li>Cole o link abaixo</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheets-url">URL do Google Sheets</Label>
                <Input
                  id="sheets-url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  disabled={isUploading}
                />
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
                onClick={handleGoogleSheetImport}
                disabled={!googleSheetUrl.trim() || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Importar do Sheets
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
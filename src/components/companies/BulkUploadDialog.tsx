import { useState, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon, Folder, Sheet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MAX_COMPANIES = 1000;

export function BulkUploadDialog({ children }: { children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
const navigate = useNavigate();
const [importMode, setImportMode] = useState<'analyze' | 'direct'>('analyze');

  // Fecha automaticamente após sucesso
  useEffect(() => {
    if (result && result.success > 0 && !isUploading) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        // Reseta o estado após fechar
        setTimeout(() => {
          setFile(null);
          setGoogleSheetUrl("");
          setResult(null);
          setProgress(0);
        }, 300);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [result, isUploading]);

  const downloadTemplate = () => {
    const BOM = '\uFEFF';
    
    const headers = [
      'CNPJ', 'Nome da Empresa', 'Nome Fantasia', 'Razão Social', 'Website', 'Domínio',
      'Instagram', 'LinkedIn', 'Facebook', 'Twitter', 'YouTube',
      'Setor', 'Porte', 'Natureza Jurídica', 'Funcionários', 'Faturamento Estimado',
      'Capital Social', 'Data de Abertura', 'Situação Cadastral', 'Data Situação',
      'Motivo Situação', 'Situação Especial', 'Data Situação Especial',
      'CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 
      'Município', 'UF', 'País', 'Latitude', 'Longitude',
      'Telefone', 'Email', 'Email Verificado',
      'CNAE Principal Código', 'CNAE Principal Descrição',
      'CNAEs Secundários Quantidade', 'CNAEs Secundários',
      'Quadro Societário Quantidade', 'Sócios',
      'Score Maturidade Digital', 'Score Fit TOTVS', 'Score Análise',
      'Tech Stack', 'ERP Atual', 'CRM Atual',
      'Produto Principal', 'Marca', 'Link Produto/Marketplace', 'Categoria',
      'Decisores Quantidade', 'Decisor 1 Nome', 'Decisor 1 Cargo', 'Decisor 1 Email', 
      'Decisor 1 Telefone', 'Decisor 1 LinkedIn',
      'Decisor 2 Nome', 'Decisor 2 Cargo', 'Decisor 2 Email', 
      'Decisor 2 Telefone', 'Decisor 2 LinkedIn',
      'Decisor 3 Nome', 'Decisor 3 Cargo', 'Decisor 3 Email', 
      'Decisor 3 Telefone', 'Decisor 3 LinkedIn',
      'Enriquecido Receita', 'Enriquecido 360', 'Enriquecido Apollo', 'Enriquecido Phantom',
      'Data Criação', 'Data Última Atualização', 'Data Último Enriquecimento',
      'Status Enriquecimento', 'Fonte Enriquecimento',
      'Observações', 'Tags', 'Prioridade',
      'Último Contato', 'Próximo Contato', 'Status Pipeline',
      'Valor Oportunidade', 'Probabilidade Fechamento', 'Data Fechamento Esperada'
    ];
    
    const exampleRow = [
      '00.000.000/0000-00', 'Empresa Exemplo LTDA', 'Nome Fantasia Exemplo', 'Empresa Exemplo LTDA', 
      'https://exemplo.com.br', 'exemplo.com.br',
      '@exemploempresa', 'linkedin.com/company/exemplo', 'facebook.com/exemplo', 'twitter.com/exemplo', 'youtube.com/exemplo',
      'Tecnologia', 'MÉDIA', 'Sociedade Limitada', '50', 'R$ 5M - R$ 10M',
      '100000.00', '01/01/2010', 'ATIVA', '01/01/2010',
      '', '', '',
      '01310-100', 'Avenida Paulista', '1578', 'Sala 10', 'Bela Vista',
      'São Paulo', 'SP', 'Brasil', '-23.561684', '-46.655981',
      '(11) 3000-0000', 'contato@exemplo.com.br', 'Sim',
      '6201-5/00', 'Desenvolvimento de programas de computador sob encomenda',
      '3', '6202-3/00 - Desenvolvimento web; 6209-1/00 - Suporte técnico',
      '2', 'João Silva (Administrador); Maria Santos (Sócia)',
      '75.5', '85', '90',
      'ERP Proprietário, CRM Salesforce', 'SAP', 'Salesforce',
      'Software ERP', 'Marca Exemplo', 'mercadolivre.com.br/produto', 'Software',
      '2', 'João Silva', 'CEO', 'joao.silva@exemplo.com.br', 
      '(11) 99999-0000', 'linkedin.com/in/joaosilva',
      'Maria Santos', 'CTO', 'maria.santos@exemplo.com.br',
      '(11) 99999-0001', 'linkedin.com/in/mariasantos',
      '', '', '', '', '',
      'Sim', 'Sim', 'Não', 'Não',
      '01/01/2024', '15/10/2024', '15/10/2024',
      'Completo', 'Receita Federal + Enriquecimento 360',
      'Cliente potencial de alto valor', 'ERP, Cloud, Enterprise', 'Alta',
      '10/10/2024', '20/10/2024', 'Qualificação',
      'R$ 500.000', '75%', '31/12/2024'
    ];
    
    const csvContent = headers.join(',') + '\n' + 
                      exampleRow.map(cell => `"${cell}"`).join(',') + '\n' +
                      '53.113.791/0001-22,TOTVS SA,TOTVS,TOTVS S.A.,https://www.totvs.com,totvs.com,@totvs,linkedin.com/company/totvs,,,,Software ERP,GRANDE,Sociedade Anônima,10000,R$ 1B+,,,ATIVA,,,,,04711-904,Avenida Braz Leme,1000,,Brooklin,São Paulo,SP,Brasil,,,,,,,,,0,,,,,80,,,,,,,,,0,,,,,,,,,,,,Sim,Sim,,,,,,,,,,,,,,,';
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-importacao-empresas-completo-87-colunas.csv';
    link.click();
    toast.success("Template completo baixado com 87 colunas!");
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
    
    // Mapeamento COMPLETO e EXATO dos 87 campos Econodata
    const headerMap: { [key: string]: string[] } = {
      // === IDENTIFICAÇÃO BÁSICA ===
      'cnpj': ['cnpj', 'cnpj da empresa', 'cnpj empresa'],
      'nome_empresa': ['nome', 'nome da empresa', 'empresa', 'razao social', 'razão social'],
      'nome_fantasia': ['nome fantasia', 'fantasia'],
      'marca': ['marca', 'brand'],
      'tipo_unidade': ['tipo unidade', 'tipo da unidade', 'tipo', 'natureza unidade'],
      
      // === NATUREZA JURÍDICA E REGIME ===
      'natureza_juridica': ['natureza juridica', 'natureza', 'tipo juridico'],
      'situacao_cadastral': ['situacao cadastral', 'situacao', 'status cadastral'],
      'data_abertura': ['data de abertura', 'abertura', 'data abertura'],
      'regime_tributario': ['regime tributario', 'regime tributário', 'regime'],
      
      // === LOCALIZAÇÃO ===
      'endereco': ['endereco', 'endereço', 'logradouro', 'rua', 'address'],
      'numero': ['numero', 'número', 'num', 'number'],
      'complemento': ['complemento', 'compl'],
      'bairro': ['bairro', 'neighborhood'],
      'cep': ['cep', 'codigo postal', 'zipcode'],
      'municipio': ['municipio', 'município', 'cidade', 'city'],
      'uf': ['uf', 'estado', 'state'],
      'pais': ['pais', 'país', 'country'],
      'microrregiao': ['microrregiao', 'microrregião', '(mi)', 'microrregião geográfica'],
      'mesorregiao': ['mesorregiao', 'mesorregião', '(me)', 'mesorregião geográfica'],
      
      // === CONTATOS - ASSERTIVIDADE ===
      'assertividade': ['assertividade'],
      'melhor_telefone': ['melhor telefone'],
      'segundo_melhor_telefone': ['segundo melhor telefone'],
      'telefones_alta_assertividade': ['telefones de alta assertividade', 'telefones alta assertividade'],
      'telefones_media_assertividade': ['telefones de media assertividade', 'telefones média assertividade', 'telefones media assertividade', 'telefones de média assertividade'],
      'telefones_baixa_assertividade': ['telefones de baixa assertividade', 'telefones baixa assertividade'],
      'telefones_matriz': ['telefones - matriz', 'telefones matriz'],
      'telefones_filiais': ['telefones- filiais', 'telefones - filiais', 'telefones filiais'],
      'celulares': ['celulares'],
      'melhor_celular': ['melhor celular'],
      'fixos': ['fixos'],
      'pat_telefone': ['pat - telefone', 'pat telefone'],
      'whatsapp': ['whatsapp', 'wa'],
      
      // === ATIVIDADE ECONÔMICA ===
      'setor_amigavel': ['setor amigavel', 'setor amigável'],
      'atividade_economica': ['atividade economica', 'atividade econômica'],
      'cod_atividade_economica': ['cod atividade economica', 'cod atividade econômica', 'cnae codigo primario', 'cnae codigo principal'],
      'atividades_secundarias': ['atividades secundarias', 'atividades secundárias'],
      'cod_atividades_secundarias': ['cod atividades secundarias', 'cod atividades secundárias'],
      
      // === NCMs ===
      'cod_ncms_primarios': ['cod ncms primarios', 'codigos ncms primarios', 'cód ncms primários', 'cod. ncms primários'],
      'ncms_primarios': ['ncms primarios', 'ncms primários'],
      
      // === FINANCEIRO ===
      'capital_social': ['capital social', 'capital'],
      'recebimentos_governo_federal': ['recebimentos do governo federal', 'recebimentos governo'],
      'enquadramento_porte': ['enquadramento de porte', 'enquadramento porte'],
      'funcionarios_presumido_matriz_cnpj': ['funcionarios presumido para matriz + cnpj', 'funcionários presumido para matriz + cnpj', 'func matriz cnpj'],
      'funcionarios_presumido_este_cnpj': ['funcionarios presumido para este cnpj', 'funcionários presumido para este cnpj', 'func este cnpj'],
      'faturamento_presumido_matriz_cnpj': ['faturamento presumido para matriz + cnpjs', 'faturamento presumido matriz cnpj', 'fat matriz cnpj'],
      'faturamento_presumido_este_cnpj': ['faturamento presumido para este cnpj', 'fat este cnpj'],
      'crescimento_empresa': ['crescimento da empresa', 'crescimento'],
      'qtd_filiais': ['qtd. filiais', 'qtd filiais', 'quantidade de filiais'],
      
      // === ESTRUTURA ===
      'socios_administradores': ['sócios e administradores', 'socios e administradores', 'socios administradores'],
      'decisores_cargos': ['decisores - cargos', 'decisores cargos'],
      'decisores_linkedin': ['decisores - linkedin', 'decisores linkedin'],
      'colaboradores_cargos': ['colaboradores - cargos', 'colaboradores cargos'],
      'colaboradores_linkedin': ['colaboradores - linkedin', 'colaboradores linkedin'],
      
      // === EMAILS ===
      'emails_validados_departamentos': ['e-mails validados de departamentos', 'emails validados de departamentos', 'emails departamentos'],
      'emails_validados_socios': ['e-mails validados de socios', 'emails validados de sócios', 'e-mails validados de sócios', 'emails socios'],
      'emails_validados_decisores': ['e-mails validados de decisores', 'emails validados de decisores', 'emails decisores'],
      'emails_validados_colaboradores': ['e-mails validados de colaboradores', 'emails validados de colaboradores', 'emails colaboradores'],
      'email_pat': ['email pat'],
      'email_receita_federal': ['email receita federal'],
      'emails_publicos': ['emails publicos', 'e-mails publicos', 'e-mails públicos', 'emails públicos'],
      
      // === PORTE E COMÉRCIO EXTERIOR ===
      'porte_estimado': ['porte estimado', 'medio', 'médio', 'grande', 'pequeno'],
      'importacao': ['importacao', 'importação'],
      'exportacao': ['exportacao', 'exportação'],
      'pat_funcionarios': ['pat - funcionarios', 'pat - funcionários', 'pat funcionarios'],
      
      // === DIGITAL PRESENCE ===
      'sites': ['sites', 'websites', 'site'],
      'melhor_site': ['melhor site'],
      'segundo_melhor_site': ['segundo melhor site'],
      'instagram': ['instagram', 'insta', '@instagram'],
      'facebook': ['facebook', 'fb'],
      'linkedin': ['linkedin', 'link linkedin', 'linkedin url'],
      'twitter': ['twitter', 'x', 'twitter/x'],
      'youtube': ['youtube', 'yt'],
      'outras': ['outras', 'outras redes'],
      
      // === TECNOLOGIA ===
      'tecnologias': ['tecnologias', 'tech stack', 'stack tecnológico'],
      'ferramentas': ['ferramentas', 'tools'],
      
      // === METADATA ===
      'tags': ['tags', 'etiquetas'],
      'notas': ['notas', 'notes', 'observações', 'observacoes'],
      'nivel_atividade': ['nível de atividade', 'nivel de atividade'],
      
      // === DÍVIDAS ===
      'perc_dividas_cnpj_sobre_faturamento': ['% dívidas cnpj sobre faturamento anual', '% dividas cnpj sobre faturamento'],
      'perc_dividas_cnpj_socios_sobre_faturamento': ['% dívidas cnpj e sócios sobre faturamento anual', '% dividas cnpj e socios sobre faturamento'],
      'total_dividas_cnpj_uniao': ['total dívidas cnpj com a união', 'total dividas cnpj uniao'],
      'total_dividas_cnpj_socios_uniao': ['total dívidas cnpj e sócios com a união', 'total dividas cnpj socios uniao'],
      'dividas_gerais_cnpj_uniao': ['dívidas gerais cnpj com a união', 'dividas gerais cnpj uniao'],
      'dividas_gerais_cnpj_socios_uniao': ['dívidas gerais cnpj e sócios com a união', 'dividas gerais cnpj socios uniao'],
      'dividas_cnpj_fgts': ['dívidas cnpj com o fgts', 'dividas cnpj fgts'],
      'dividas_cnpj_socios_fgts': ['dívidas cnpj e sócios com o fgts', 'dividas cnpj socios fgts'],
      'dividas_cnpj_previdencia': ['dívidas cnpj com a previdência', 'dividas cnpj previdencia'],
      'dividas_cnpj_socios_previdencia': ['dívidas cnpj e sócios com a previdência', 'dividas cnpj socios previdencia']
    };

    // Primeiro, tenta mapeamento direto (case insensitive + normalizado)
    normalized.forEach((norm, idx) => {
      for (const [standard, variations] of Object.entries(headerMap)) {
        if (variations.includes(norm) || norm === normalizeHeader(standard)) {
          mapping.set(standard, headers[idx]);
          break;
        }
      }
    });

    console.log(`🔄 Mapeamento de ${mapping.size}/87 campos Econodata:`, Object.fromEntries(mapping));
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
        
        // Primeiro, mapeia com o mapeamento padrão
        headers.forEach((rawHeader, index) => {
          const value = normalizeValue(rowData[index]);
          
          for (const [standard, mapped] of headerMapping.entries()) {
            if (mapped === rawHeader) {
              row[standard] = value;
              break;
            }
          }
        });
        
        // Se não achou no mapeamento, tenta mapeamento direto (chave original)
        headers.forEach((rawHeader, index) => {
          const value = normalizeValue(rowData[index]);
          if (value && !row[rawHeader]) {
            row[rawHeader] = value;
          }
        });
        
        const hasIdentifier = row.cnpj || row['nome_empresa'] || row.nome_empresa || 
                              row.sites || row.instagram || row.linkedin;
        
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
    console.log(`Separador detectado: "${separator === '\t' ? 'TAB' : separator}"`);
    
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
        
        // Primeiro, mapeia com o mapeamento padrão
        rawHeaders.forEach((rawHeader, index) => {
          const value = normalizeValue(values[index]);
          
          for (const [standard, mapped] of headerMapping.entries()) {
            if (mapped === rawHeader) {
              row[standard] = value;
              break;
            }
          }
        });
        
        // Se não achou no mapeamento, tenta mapeamento direto (chave original)
        rawHeaders.forEach((rawHeader, index) => {
          const value = normalizeValue(values[index]);
          if (value && !row[rawHeader]) {
            row[rawHeader] = value;
          }
        });
        
        const hasIdentifier = row.cnpj || row.nome_empresa || row.sites || 
                              row.instagram || row.linkedin;
        
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

// Se o modo for importação direta, enviar ao backend
if (importMode === 'direct') {
  try {
    toast.info(`Importando ${companies.length} empresas para a base...`);
    const { data, error } = await supabase.functions.invoke('bulk-upload-companies', {
      body: { companies }
    });
    if (error) throw error;

    const imported = (data?.success as number) ?? (Array.isArray(data?.inserted) ? data.inserted.length : 0);
    toast.success('Importação concluída', {
      description: `${imported} empresas importadas com sucesso`,
      action: {
        label: 'Ver empresas',
        onClick: () => navigate('/companies')
      }
    });

    setIsUploading(false);
    setIsOpen(false);
    navigate('/companies');
    return;
  } catch (e: any) {
    console.error('Erro ao importar direto:', e);
    toast.error('Falha ao importar', { description: e?.message || 'Erro desconhecido' });
    setIsUploading(false);
    return;
  }
}

// Fluxo atual: Redirecionar para análise ICP antes de cadastrar
toast.success(`📊 ${companies.length} empresas prontas para análise ICP`, {
  description: 'Redirecionando para análise automática...',
});

setIsUploading(false);

// Fechar o dialog
setIsOpen(false);

// Redirecionar para página de análise em massa com os dados
setTimeout(() => {
  navigate('/central-icp/batch', {
    state: {
      empresas: companies,
      origem: 'upload_massa'
    }
  });
}, 500);

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
  // Evitar CORS: delega para função de backend que baixa e importa
  toast.info("Processando planilha no servidor...");

  const { data, error } = await supabase.functions.invoke('import-google-sheet', {
    body: { url: googleSheetUrl }
  });

  if (error) throw error;

  setResult(data);
  setProgress(100);

  if (data.success > 0) {
    toast.success(`${data.success} empresas importadas do Google Sheets!`, {
      action: {
        label: 'Ver base de empresas',
        onClick: () => navigate('/companies')
      }
    });
  }

  if (data.errors?.length > 0) {
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
        {children ? (
          children
        ) : (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload em Massa
          </Button>
        )}
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
            <TabsTrigger value="file" className="gap-2">
              <Folder className="h-4 w-4 text-yellow-500" />
              Arquivo
            </TabsTrigger>
            <TabsTrigger value="sheets" className="gap-2">
              <GoogleIcon />
              <Sheet className="h-4 w-4 text-green-600" />
              Google Sheets
            </TabsTrigger>
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
                <strong>Formato expandido:</strong> 87 colunas completas de dados
                <br />
                <strong>Campos incluídos:</strong> CNPJ, identificação, endereço, CNAEs, sócios, decisores (até 3), redes sociais, tech stack, scores, enriquecimentos, pipeline CRM
                <br />
                <strong>Formatos aceitos:</strong> CSV, TSV, XLSX, XLS
                <br />
                <strong>Separadores:</strong> vírgula (,), ponto e vírgula (;) ou TAB
                <br />
                <strong>Valores vazios:</strong> "não encontrado", "---", "###" são ignorados
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Destino do upload</p>
                <p className="text-xs text-muted-foreground">Analisar ICP ou importar direto para a base</p>
              </div>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as 'analyze' | 'direct')}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyze">Analisar ICP (recomendado)</SelectItem>
                  <SelectItem value="direct">Importar direto para Empresas</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
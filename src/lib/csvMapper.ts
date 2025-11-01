// ⚠️⚠️⚠️ DO NOT CHANGE THIS LOGIC ⚠️⚠️⚠️
// Validated on: 2025-11-01
// This implements intelligent CSV mapping with fuzzy matching + synonyms
// Any changes here must be additive only (behind flags/conditionals)

// Mapeamento direto com prioridade ABSOLUTA
const DIRECT_MAPPING: Record<string, string> = {
  // CNPJ (PRIORIDADE MÁXIMA)
  'cnpj': 'cnpj',
  'cpf cnpj': 'cnpj',
  'cpf/cnpj': 'cnpj',
  'documento': 'cnpj',
  
  // Razão Social (PRIORIDADE MÁXIMA)
  'razao social': 'razao_social',
  'razao': 'razao_social',
  'nome da empresa': 'razao_social',
  
  // SKIP - Campos que NÃO devem ser mapeados
  'regime tributario': '__SKIP__',
  'identificador': '__SKIP__',
  'simples nacional': '__SKIP__',
};

// Dicionário completo de sinônimos para os 87 campos do sistema
const fieldSynonyms: Record<string, string[]> = {
  // Dados Básicos
  cnpj: ["CNPJ", "CPF/CNPJ", "Documento", "Doc", "Registro", "CNPJ/CPF"],
  nome_da_empresa: ["Nome da Empresa", "Nome Empresa", "Nome", "Empresa", "Company Name", "Business Name", "Corporate Name"],
  nome_fantasia: ["Nome Fantasia", "Fantasia", "Nome Comercial", "Nome de Fantasia", "Trade Name", "Trading Name"],
  razao_social: [
    "Razão Social", "Razão", "Razao Social", "Razao",
    "Nome da Empresa", "Nome Empresa", "Nome", "Empresa",
    "Razão Social da Empresa", "Nome Fantasia",
    "Denominação Social", "Denominacao Social",
    "Corporate Name", "Company Name", "Business Name",
    "Legal Name", "Firma", "Denominação", "Denominacao"
  ],
  email: ["E-mail", "Email", "Correio Eletrônico", "Mail", "Contato Email", "E mail"],
  telefone: ["Telefone", "Telefone 1", "Fone", "Tel", "Celular", "Contato", "Phone"],
  website: ["Website", "Site", "URL", "Homepage", "Web", "Página"],
  
  // Endereço
  cep: ["CEP", "Código Postal", "Postal Code", "Cep"],
  logradouro: ["Logradouro", "Endereço", "Rua", "Avenida", "Address", "End"],
  numero: ["Número", "Numero", "Nº", "N°", "Number", "Num"],
  complemento: ["Complemento", "Compl", "Comp", "Complement"],
  bairro: ["Bairro", "Distrito", "Neighborhood", "Bairro/Distrito"],
  municipio: ["Município", "Cidade", "City", "Localidade", "Munic"],
  uf: ["UF", "Estado", "State", "Unidade Federativa"],
  pais: ["País", "Pais", "Country"],
  latitude: ["Latitude", "Lat", "Coordenada Lat"],
  longitude: ["Longitude", "Long", "Lng", "Coordenada Long"],
  
  // Classificação
  setor: ["Setor", "Segmento", "Ramo", "Área de Atuação", "Industry"],
  porte: ["Porte", "Porte Empresa", "Tamanho", "Size"],
  natureza_juridica: ["Natureza Jurídica", "Tipo Jurídico", "Forma Jurídica"],
  funcionarios: ["Funcionários", "Quadro de Funcionários", "Colaboradores", "Employees", "Número de Funcionários"],
  faturamento_estimado: ["Faturamento Estimado", "Faturamento", "Receita", "Revenue", "Fat Estimado"],
  capital_social: ["Capital Social", "Capital Social da Empresa", "Capital"],
  
  // Cadastrais
  data_de_abertura: ["Data de Abertura", "Data Início Atv", "Data Fundação", "Fundação", "Data Início"],
  situacao_cadastral: ["Situação Cadastral", "Situação Cad", "Status Cadastral", "Situação"],
  cnae_principal_codigo: ["CNAE Principal", "CNAE", "Código CNAE", "Atividade", "CNAE Prim"],
  cnae_principal_descricao: ["Descrição CNAE", "Atividade Econômica", "Desc CNAE"],
  cnaes_secundarios: ["CNAE Secundário", "CNAEs Secundários", "Atividades Secundárias"],
  socios: ["Sócios", "Nome do Sócio", "Quadro Societário", "Partners"],
  
  // Redes Sociais
  instagram: ["Instagram", "Insta", "IG", "@"],
  linkedin: ["LinkedIn", "Linkedin", "LI"],
  facebook: ["Facebook", "FB", "Face"],
  twitter: ["Twitter", "X", "Tweet"],
  youtube: ["YouTube", "Youtube", "YT"],
  
  // Decisor 1
  decisor_1_nome: ["Decisor 1 Nome", "Decisor Nome", "Contato Principal", "Nome Decisor"],
  decisor_1_cargo: ["Decisor 1 Cargo", "Decisor Cargo", "Cargo Decisor", "Cargo"],
  decisor_1_email: ["Decisor 1 Email", "Decisor Email", "Email Decisor"],
  decisor_1_telefone: ["Decisor 1 Telefone", "Decisor Telefone", "Tel Decisor"],
  decisor_1_linkedin: ["Decisor 1 LinkedIn", "Decisor LinkedIn"],
  
  // Decisor 2
  decisor_2_nome: ["Decisor 2 Nome", "Segundo Decisor Nome"],
  decisor_2_cargo: ["Decisor 2 Cargo", "Segundo Decisor Cargo"],
  decisor_2_email: ["Decisor 2 Email", "Segundo Decisor Email"],
  decisor_2_telefone: ["Decisor 2 Telefone", "Segundo Decisor Tel"],
  decisor_2_linkedin: ["Decisor 2 LinkedIn"],
  
  // Decisor 3
  decisor_3_nome: ["Decisor 3 Nome", "Terceiro Decisor Nome"],
  decisor_3_cargo: ["Decisor 3 Cargo", "Terceiro Decisor Cargo"],
  decisor_3_email: ["Decisor 3 Email", "Terceiro Decisor Email"],
  decisor_3_telefone: ["Decisor 3 Telefone", "Terceiro Decisor Tel"],
  decisor_3_linkedin: ["Decisor 3 LinkedIn"],
  
  // Análise/Scores
  score_maturidade_digital: ["Score Maturidade Digital", "Maturidade Digital", "Score Digital"],
  score_fit_totvs: ["Score Fit TOTVS", "Fit TOTVS", "Score TOTVS"],
  score_analise: ["Score Análise", "Score", "Pontuação"],
  tech_stack: ["Tech Stack", "Tecnologias", "Stack Tecnológico"],
  erp_atual: ["ERP Atual", "Sistema ERP", "ERP"],
  crm_atual: ["CRM Atual", "Sistema CRM", "CRM"],
  
  // Pipeline/CRM
  tags: ["Tags", "Etiquetas", "Marcadores"],
  prioridade: ["Prioridade", "Priorização", "Priority"],
  ultimo_contato: ["Último Contato", "Data Último Contato", "Last Contact"],
  proximo_contato: ["Próximo Contato", "Data Próximo Contato", "Next Contact"],
  status_pipeline: ["Status Pipeline", "Status", "Etapa Pipeline"],
  valor_oportunidade: ["Valor Oportunidade", "Valor Deal", "Valor"],
  probabilidade_fechamento: ["Probabilidade Fechamento", "Prob Fechamento", "Probabilidade"],
  data_fechamento_esperada: ["Data Fechamento Esperada", "Data Esperada", "Expected Close"],
  
  // Controle
  data_criacao: ["Data Criação", "Criado Em", "Created At"],
  data_ultima_atualizacao: ["Data Última Atualização", "Atualizado Em", "Updated At"],
  status_enriquecimento: ["Status Enriquecimento", "Status Enr"],
  fonte_enriquecimento: ["Fonte Enriquecimento", "Fonte"],
  observacoes: ["Observações", "Obs", "Notas", "Comments"],
};

// Campos do sistema
const systemFields = Object.keys(fieldSynonyms);

// Normalizar string para comparação (remove acentos e caracteres especiais)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' '); // Normaliza espaços
}

// Função de similaridade usando Levenshtein Distance
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  // Correspondência exata
  if (s1 === s2) return 100;
  
  // Se uma string contém a outra
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = Math.min(s1.length, s2.length);
    const longer = Math.max(s1.length, s2.length);
    return Math.round((shorter / longer) * 90);
  }
  
  // Levenshtein Distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(similarity);
}

export type MappingStatus = 'mapped' | 'review' | 'unmapped';

export interface ColumnMapping {
  csvColumn: string;
  systemField: string | null;
  confidence: number;
  status: MappingStatus;
  alternatives: Array<{ field: string; confidence: number }>;
}

// Mapear coluna da planilha para campo do sistema
export function mapColumnToField(columnName: string): {
  field: string | null;
  confidence: number;
  alternatives: Array<{ field: string; confidence: number }>;
} {
  const normalizedColumn = normalizeString(columnName);
  
  // VERIFICAR MAPEAMENTO DIRETO PRIMEIRO (100% confiança)
  if (DIRECT_MAPPING[normalizedColumn]) {
    const field = DIRECT_MAPPING[normalizedColumn];
    
    if (field === '__SKIP__') {
      return { field: null, confidence: 0, alternatives: [] };
    }
    
    return {
      field,
      confidence: 100,
      alternatives: [],
    };
  }
  
  let bestMatch: { field: string | null; confidence: number } = {
    field: null,
    confidence: 0,
  };
  
  const alternatives: Array<{ field: string; confidence: number }> = [];
  
  // Para cada campo do sistema
  for (const field of systemFields) {
    const synonyms = fieldSynonyms[field];
    
    // Comparar com cada sinônimo
    for (const synonym of synonyms) {
      const confidence = calculateSimilarity(columnName, synonym);
      
      if (confidence > bestMatch.confidence) {
        if (bestMatch.field && bestMatch.confidence > 40) {
          alternatives.push(bestMatch);
        }
        bestMatch = { field, confidence };
      } else if (confidence > 40 && confidence < bestMatch.confidence) {
        alternatives.push({ field, confidence });
      }
    }
  }
  
  // Ordenar alternativas por confiança
  alternatives.sort((a, b) => b.confidence - a.confidence);
  
  return {
    field: bestMatch.field,
    confidence: bestMatch.confidence,
    alternatives: alternatives.slice(0, 3), // Top 3 alternativas
  };
}

// Mapear todas as colunas da planilha
export function mapAllColumns(columns: string[]): ColumnMapping[] {
  return columns.map((column) => {
    const mapping = mapColumnToField(column);
    
    let status: MappingStatus;
    if (mapping.confidence >= 70) {
      status = 'mapped';
    } else if (mapping.confidence >= 40) {
      status = 'review';
    } else {
      status = 'unmapped';
    }
    
    return {
      csvColumn: column,
      systemField: mapping.field,
      confidence: mapping.confidence,
      status,
      alternatives: mapping.alternatives,
    };
  });
}

// Obter todos os campos do sistema para o dropdown
export function getSystemFields(): string[] {
  return systemFields;
}

// Obter label amigável para um campo do sistema
export function getFieldLabel(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

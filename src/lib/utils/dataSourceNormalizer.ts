// ✅ Sistema de Normalização Multi-Fonte
// Unifica dados de EmpresaQui, Apollo, Econodata e entrada manual

interface SourceData {
  source: 'empresaqui' | 'apollo' | 'econodata' | 'manual';
  data: any;
  priority: number;
  timestamp: string;
}

interface NormalizedCompany {
  // Campos básicos
  cnpj?: string;
  name: string;
  trade_name?: string;
  domain?: string;
  website?: string;
  
  // Contatos
  phone?: string;
  email?: string;
  mobile_phone?: string;
  additional_phones?: string[];
  
  // Localização
  location?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
  
  // Dados econômicos
  industry?: string;
  employees_count?: number;
  estimated_revenue?: number;
  share_capital?: number;
  size?: string;
  
  // Classificação
  main_activity?: string;
  cnae_code?: string;
  secondary_activities?: string[];
  
  // Status
  status?: string;
  legal_nature?: string;
  foundation_date?: string;
  
  // Digital
  linkedin_url?: string;
  technologies?: string[];
  
  // Metadados
  enrichment_source?: string;
  enriched_at?: string;
  data_quality_score?: number;
  raw_data?: any;
}

/**
 * Prioridades de campos por fonte
 * Quanto maior o número, maior a prioridade
 */
const FIELD_PRIORITY = {
  // Dados cadastrais
  cnpj: { empresaqui: 100, econodata: 100, apollo: 0, manual: 100 },
  name: { empresaqui: 100, econodata: 95, apollo: 90, manual: 100 },
  trade_name: { empresaqui: 90, econodata: 85, apollo: 0, manual: 95 },
  
  // Contatos
  phone: { empresaqui: 85, econodata: 95, apollo: 80, manual: 100 },
  email: { empresaqui: 85, econodata: 95, apollo: 90, manual: 100 },
  mobile_phone: { empresaqui: 80, econodata: 95, apollo: 85, manual: 100 },
  website: { empresaqui: 80, econodata: 95, apollo: 90, manual: 100 },
  domain: { empresaqui: 75, econodata: 90, apollo: 95, manual: 100 },
  
  // Dados econômicos
  employees_count: { empresaqui: 80, econodata: 95, apollo: 85, manual: 100 },
  estimated_revenue: { empresaqui: 80, econodata: 95, apollo: 75, manual: 100 },
  share_capital: { empresaqui: 85, econodata: 90, apollo: 0, manual: 100 },
  
  // Digital
  technologies: { empresaqui: 70, econodata: 90, apollo: 85, manual: 100 },
  linkedin_url: { empresaqui: 80, econodata: 85, apollo: 95, manual: 100 },
  
  // Classificação
  industry: { empresaqui: 85, econodata: 90, apollo: 90, manual: 100 },
  main_activity: { empresaqui: 95, econodata: 90, apollo: 0, manual: 100 },
};

/**
 * Normaliza dados do EmpresaQui
 */
export function normalizeEmpresaQuiData(data: any): Partial<NormalizedCompany> {
  return {
    cnpj: data.cnpj?.replace(/\D/g, ''),
    name: data.razao_social || data['Razão'] || data['Razão Social'],
    trade_name: data.nome_fantasia || data['Fantasia'] || data['Nome Fantasia'],
    website: data.website || data['Site'],
    phone: data.telefones?.[0] || data['Telefone 1'],
    email: data.emails?.[0] || data['E-mail'],
    
    location: {
      street: data.logradouro || data['Endereço'],
      number: data.numero || data['Número'],
      complement: data.complemento || data['Complemento'],
      neighborhood: data.bairro || data['Bairro'],
      city: data.municipio || data['Cidade'],
      state: data.uf || data['UF'],
      zip_code: data.cep || data['CEP'],
      country: 'Brasil'
    },
    
    main_activity: data.cnae_principal?.descricao || data['Texto CNAE Principal'],
    cnae_code: data.cnae_principal?.codigo || data['CNAE Principal'],
    secondary_activities: data.cnaes_secundarios?.map((c: any) => c.descricao) || 
                          data['CNAE Secundário']?.split(','),
    
    size: data.porte || data['Porte Empresa'],
    legal_nature: data.natureza_juridica || data['Natureza Jurídica'],
    foundation_date: data.data_abertura || data['Data Início Atv.'],
    status: data.situacao_cadastral || data['Situação Cad.'],
    
    share_capital: parseFloat(data.capital_social || data['Capital Social da Empresa'] || '0'),
    employees_count: data.funcionarios_presumido || parseInt(data['Quadro de Funcionários'] || '0'),
    estimated_revenue: data.faturamento_presumido || parseFloat(data['Faturamento Estimado'] || '0'),
    
    enrichment_source: 'empresaqui',
    enriched_at: new Date().toISOString()
  };
}

/**
 * Normaliza dados do Apollo
 */
export function normalizeApolloData(data: any): Partial<NormalizedCompany> {
  return {
    name: data.name,
    domain: data.primary_domain,
    website: data.website_url,
    industry: data.industry,
    employees_count: data.estimated_num_employees,
    
    location: {
      city: data.city,
      state: data.state,
      country: data.country,
      street: data.raw_address
    },
    
    linkedin_url: data.linkedin_url,
    technologies: data.technologies || [],
    
    enrichment_source: 'apollo',
    enriched_at: new Date().toISOString()
  };
}

/**
 * Normaliza dados do Econodata
 */
export function normalizeEconodataData(data: any): Partial<NormalizedCompany> {
  return {
    cnpj: data.cnpj?.replace(/\D/g, '') || data.CNPJ?.replace(/\D/g, ''),
    name: data.razao_social || data['RAZÃO SOCIAL'],
    trade_name: data.nome_fantasia || data['NOME FANTASIA'],
    website: data.melhor_site || data['MELHOR SITE'],
    domain: data.melhor_site?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    
    phone: data.melhor_telefone || data['MELHOR TELEFONE'],
    mobile_phone: data.melhor_celular || data['MELHOR CELULAR'],
    email: data.email_validados?.[0] || data['E-MAILS VALIDADOS']?.split(',')[0],
    additional_phones: data.telefones_alta_assertividade || 
                      data['TELEFONES DE ALTA ASSERTIVIDADE']?.split(','),
    
    location: {
      street: data.logradouro || data['LOGRADOURO'],
      number: data.numero || data['NÚMERO'],
      complement: data.complemento || data['COMPLEMENTO'],
      neighborhood: data.bairro || data['BAIRRO'],
      city: data.cidade || data['CIDADE'],
      state: data.uf || data['UF'],
      zip_code: data.cep || data['CEP']
    },
    
    main_activity: data.atividade_economica || data['ATIVIDADE ECONÔMICA'],
    cnae_code: data.cod_atividade_economica || data['COD ATIVIDADE ECONÔMICA'],
    secondary_activities: data.atividades_secundarias || 
                         data['ATIVIDADES SECUNDÁRIAS']?.split(','),
    
    employees_count: data.funcionarios_presumido || 
                    parseInt(data['FUNCIONÁRIOS PRESUMIDO PARA ESTE CNPJ'] || '0'),
    estimated_revenue: data.faturamento_presumido || 
                      parseFloat(data['FATURAMENTO PRESUMIDO PARA ESTE CNPJ'] || '0'),
    share_capital: parseFloat(data.capital_social || data['CAPITAL SOCIAL'] || '0'),
    
    technologies: data.tecnologias || data['TECNOLOGIAS']?.split(','),
    linkedin_url: data.linkedin || data['LINKEDIN'],
    
    size: data.porte_estimado || data['PORTE ESTIMADO'],
    status: data.situacao_cadastral || data['SITUAÇÃO CADASTRAL'],
    
    enrichment_source: 'econodata',
    enriched_at: new Date().toISOString()
  };
}

/**
 * Faz o merge inteligente de múltiplas fontes
 * Usa prioridade de campos para decidir qual valor manter
 */
export function mergeMultipleSourcesData(sources: SourceData[]): NormalizedCompany {
  const result: any = {};
  
  // Ordenar por prioridade (maior primeiro)
  const sortedSources = [...sources].sort((a, b) => b.priority - a.priority);
  
  // Normalizar cada fonte
  const normalizedSources = sortedSources.map(({ source, data }) => {
    let normalized: Partial<NormalizedCompany>;
    
    switch (source) {
      case 'empresaqui':
        normalized = normalizeEmpresaQuiData(data);
        break;
      case 'apollo':
        normalized = normalizeApolloData(data);
        break;
      case 'econodata':
        normalized = normalizeEconodataData(data);
        break;
      case 'manual':
        normalized = data; // Dados manuais já normalizados
        break;
      default:
        normalized = {};
    }
    
    return { source, normalized };
  });
  
  // Fazer merge campo por campo usando prioridades
  for (const { source, normalized } of normalizedSources) {
    for (const [field, value] of Object.entries(normalized)) {
      if (value === null || value === undefined || value === '') continue;
      
      // Se campo ainda não existe, adicionar
      if (!result[field]) {
        result[field] = value;
        continue;
      }
      
      // Se campo existe, verificar prioridade
      const currentPriority = FIELD_PRIORITY[field as keyof typeof FIELD_PRIORITY]?.[source] || 0;
      const existingSource = result._sources?.[field];
      const existingPriority = FIELD_PRIORITY[field as keyof typeof FIELD_PRIORITY]?.[existingSource] || 0;
      
      // Substituir se prioridade for maior
      if (currentPriority > existingPriority) {
        result[field] = value;
        if (!result._sources) result._sources = {};
        result._sources[field] = source;
      }
    }
  }
  
  // Calcular score de qualidade dos dados
  result.data_quality_score = calculateDataQualityScore(result);
  
  // Manter raw_data de todas as fontes
  result.raw_data = {
    sources: sortedSources.map(s => s.source),
    data: normalizedSources.reduce((acc, { source, normalized }) => {
      acc[source] = normalized;
      return acc;
    }, {} as any)
  };
  
  return result as NormalizedCompany;
}

/**
 * Calcula score de qualidade dos dados (0-100)
 */
function calculateDataQualityScore(data: Partial<NormalizedCompany>): number {
  let score = 0;
  let maxScore = 0;
  
  const weights = {
    cnpj: 15,
    name: 15,
    phone: 10,
    email: 10,
    website: 8,
    location: 7,
    employees_count: 7,
    estimated_revenue: 7,
    industry: 6,
    main_activity: 5,
    technologies: 5,
    linkedin_url: 5
  };
  
  for (const [field, weight] of Object.entries(weights)) {
    maxScore += weight;
    
    if (field === 'location') {
      const loc = data.location;
      if (loc && (loc.city || loc.state || loc.street)) {
        score += weight;
      }
    } else if (data[field as keyof NormalizedCompany]) {
      score += weight;
    }
  }
  
  return Math.round((score / maxScore) * 100);
}

/**
 * Helper para criar SourceData
 */
export function createSourceData(
  source: SourceData['source'],
  data: any,
  priority: number
): SourceData {
  return {
    source,
    data,
    priority,
    timestamp: new Date().toISOString()
  };
}

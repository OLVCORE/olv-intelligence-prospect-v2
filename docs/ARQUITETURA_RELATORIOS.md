# 📊 ARQUITETURA COMPLETA DE RELATÓRIOS - OLV INTELLIGENCE SYSTEM

## 🎯 VISÃO GERAL

Este documento define **TODOS** os relatórios, métricas, campos e engines que compõem o sistema de inteligência de prospecção B2B.

**Objetivo**: Transformar dados brutos de APIs em **insights acionáveis** para tomada de decisão comercial, consultoria e venda de soluções TOTVS.

---

## 📋 ÍNDICE DE RELATÓRIOS

1. [Relatório Executivo de Empresa](#1-relatório-executivo-de-empresa)
2. [Relatório de Maturidade Digital](#2-relatório-de-maturidade-digital)
3. [Relatório de Fit TOTVS](#3-relatório-de-fit-totvs)
4. [Relatório de Decisores](#4-relatório-de-decisores)
5. [Relatório de Buying Signals](#5-relatório-de-buying-signals)
6. [Relatório de Tech Stack](#6-relatório-de-tech-stack)
7. [Relatório de Benchmark](#7-relatório-de-benchmark)
8. [Dashboard Executivo](#8-dashboard-executivo)
9. [Relatório de Performance das Engines](#9-relatório-de-performance-das-engines)
10. [Playbook de Vendas](#10-playbook-de-vendas)

---

## 1. RELATÓRIO EXECUTIVO DE EMPRESA

### 🎯 Objetivo
Visão 360° da empresa com todos os dados consolidados para decisão comercial rápida.

### 🔌 Engines Necessárias
- ✅ ReceitaWS (dados cadastrais oficiais)
- ✅ Google CSE/Serper (presença digital)
- ✅ Apollo.io (dados B2B complementares)
- ⚠️ Hunter.io (verificação de domínio)
- ⚠️ PhantomBuster (LinkedIn scraping)

### 📊 CAMPOS OBRIGATÓRIOS

#### **A) Identificação Corporativa**
```typescript
interface CompanyIdentification {
  // ReceitaWS (OFICIAL)
  razao_social: string;              // Nome legal registrado
  nome_fantasia: string;             // Nome comercial
  cnpj: string;                      // Formatado: 00.000.000/0000-00
  situacao_cadastral: string;        // ATIVA | SUSPENSA | BAIXADA
  data_abertura: Date;               // Data de fundação
  
  // Natureza Jurídica
  natureza_juridica: {
    codigo: string;
    descricao: string;              // SA, LTDA, etc
  };
  
  // Capital Social
  capital_social: {
    valor: number;
    moeda: 'BRL';
    formatado: string;              // R$ 1.000.000,00
  };
  
  // Porte
  porte: {
    codigo: string;                 // ME, EPP, MÉDIO, GRANDE
    descricao: string;
    faixa_receita: string;
  };
}
```

#### **B) Localização e Contato**
```typescript
interface CompanyLocation {
  // Endereço Principal (ReceitaWS)
  endereco_principal: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    pais: 'Brasil';
    coordenadas?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Contato (Apollo + Hunter + ReceitaWS)
  contato: {
    telefone_principal: string;
    telefones_adicionais: string[];
    email_dominio: string;          // Ex: @empresa.com.br
    website: string;                // URL completo
    linkedin_url: string;           // Apollo.io
    redes_sociais: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
}
```

#### **C) Atividade Econômica**
```typescript
interface CompanyActivity {
  // CNAE (ReceitaWS)
  atividade_principal: {
    codigo: string;                 // 4711-3/01
    descricao: string;
    secao: string;                  // G - Comércio
    divisao: string;                // 47 - Comércio varejista
  };
  
  atividades_secundarias: Array<{
    codigo: string;
    descricao: string;
  }>;
  
  // Classificação OLV
  segmento_olv: {
    macro_setor: string;            // Indústria | Serviços | Varejo
    setor_especifico: string;       // Ex: Manufatura | Tecnologia
    verticais_totvs: string[];      // Varejo, Saúde, Construção, etc
  };
  
  // Apollo.io
  industry_apollo: string;          // Classificação internacional
  sub_industry: string;
  keywords: string[];               // Palavras-chave da indústria
}
```

#### **D) Estrutura Corporativa**
```typescript
interface CompanyStructure {
  // QSA - Quadro de Sócios e Administradores (ReceitaWS)
  qsa: Array<{
    nome: string;
    cpf_cnpj: string;               // Parcialmente mascarado
    qualificacao: string;           // Sócio, Administrador, Presidente
    data_entrada: Date;
    percentual_capital?: number;
  }>;
  
  // Recursos Humanos (Apollo)
  recursos_humanos: {
    total_funcionarios: number;
    faixa_funcionarios: string;     // 1-10, 11-50, 51-200, etc
    crescimento_anual: number;      // %
    departamentos: Array<{
      nome: string;                 // TI, Vendas, Operações
      estimativa_pessoas: number;
    }>;
  };
  
  // Estrutura Organizacional
  hierarquia: {
    tem_holdings: boolean;
    tem_filiais: boolean;
    numero_filiais?: number;
    grupo_economico?: string;
  };
}
```

#### **E) Indicadores Financeiros**
```typescript
interface CompanyFinancials {
  // ReceitaWS + Apollo.io
  receita_anual: {
    valor: number;
    moeda: 'BRL' | 'USD';
    ano_referencia: number;
    faixa: string;                  // R$ 10M - R$ 50M
    fonte: 'ReceitaWS' | 'Apollo' | 'Estimado';
  };
  
  // Indicadores de Saúde
  indicadores_saude: {
    situacao_receita: 'REGULAR' | 'PENDENTE';
    dividas_ativas?: number;
    protestos?: number;
    processos_judiciais?: number;   // Fonte: integração futura
  };
  
  // Capacidade de Investimento
  capacidade_investimento: {
    score: number;                  // 0-10
    classificacao: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'MUITO ALTA';
    fatores: string[];              // Capital social, receita, crescimento
  };
}
```

#### **F) Presença Digital**
```typescript
interface DigitalPresence {
  // Google CSE/Serper
  presenca_online: {
    website_status: 'ATIVO' | 'INATIVO' | 'NÃO ENCONTRADO';
    website_tecnologias: string[];  // WordPress, React, etc
    seo_score: number;              // 0-100
    page_speed_score: number;       // 0-100
  };
  
  // Menções e Reputação
  mencoes_online: {
    total_resultados: number;       // Google results count
    noticias_recentes: Array<{
      titulo: string;
      fonte: string;
      data: Date;
      url: string;
      sentimento: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
    }>;
    premios_certificacoes: string[];
  };
  
  // Tráfego (SimilarWeb API - integração futura)
  trafego_estimado?: {
    visitas_mes: number;
    rank_brasil: number;
    principais_canais: {
      organico: number;
      direto: number;
      social: number;
      pago: number;
    };
  };
}
```

### 📈 MÉTRICAS CALCULADAS

```typescript
interface CompanyMetrics {
  // Score Global da Empresa
  score_global: {
    valor: number;                  // 0-100
    componentes: {
      saude_financeira: number;     // 0-100
      maturidade_digital: number;   // 0-100
      presenca_mercado: number;     // 0-100
      estrutura_corporativa: number; // 0-100
    };
    benchmark_setor: number;        // Posição percentil no setor
  };
  
  // Potencial de Negócio
  potencial_negocio: {
    score: number;                  // 0-100
    classificacao: 'A' | 'B' | 'C' | 'D';
    ticket_estimado: {
      minimo: number;
      medio: number;
              maximo: number;
    };
    probabilidade_fechamento: number; // %
  };
  
  // Priorização Comercial
  priorizacao: {
    urgencia: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
    nivel_esforco: 'BAIXO' | 'MÉDIO' | 'ALTO';
    roi_esperado: number;
    tempo_ciclo_vendas_estimado: number; // dias
  };
}
```

### 🔬 INSIGHTS GERADOS (IA)

```typescript
interface CompanyInsights {
  // Análise Automática (Lovable AI)
  analise_ia: {
    resumo_executivo: string;       // 200 palavras
    pontos_fortes: string[];        // Top 5
    pontos_atencao: string[];       // Top 5
    oportunidades: string[];        // Top 5
    riscos: string[];               // Top 5
  };
  
  // Recomendações de Abordagem
  recomendacoes: {
    melhor_canal: 'EMAIL' | 'LINKEDIN' | 'TELEFONE' | 'PRESENCIAL';
    melhor_horario: string;
    angulo_venda: string;           // "Modernização", "Redução de custos"
    objecoes_previstas: string[];
    contra_argumentos: string[];
  };
  
  // Próximos Passos
  proximos_passos: Array<{
    acao: string;
    responsavel: string;            // Papel: SDR, Consultor, Vendedor
    prazo_dias: number;
    prioridade: 1 | 2 | 3 | 4 | 5;
  }>;
}
```

### 📄 FORMATO DE EXPORTAÇÃO

- **PDF** (executivo, 4-6 páginas)
- **JSON** (integração API)
- **Excel** (análise detalhada)
- **PowerPoint** (apresentação comercial)

---

## 2. RELATÓRIO DE MATURIDADE DIGITAL

### 🎯 Objetivo
Avaliar o nível de transformação digital da empresa e identificar gaps tecnológicos.

### 🔌 Engines Necessárias
- ✅ Google CSE/Serper (presença digital)
- ✅ Tech Stack Detection (headers + scripts)
- ⚠️ BuiltWith API (tecnologias detalhadas)
- ✅ Apollo.io (tecnologias declaradas)

### 📊 DIMENSÕES DE ANÁLISE

#### **A) Infraestrutura Digital**
```typescript
interface InfrastructureMaturity {
  // Score: 0-10
  score_infraestrutura: number;
  
  // Componentes Avaliados
  componentes: {
    // Hospedagem
    cloud_adoption: {
      score: number;                // 0-10
      provider: 'AWS' | 'Azure' | 'GCP' | 'Outro' | 'Nenhum';
      nivel: 'NENHUM' | 'BÁSICO' | 'INTERMEDIÁRIO' | 'AVANÇADO';
      evidencias: string[];
    };
    
    // CDN e Performance
    cdn_usage: {
      score: number;
      provider?: string;            // Cloudflare, Akamai, etc
      implementado: boolean;
    };
    
    // Segurança
    security_posture: {
      score: number;
      ssl_certificate: boolean;
      security_headers: boolean;
      waf_detected: boolean;
      compliance_badges: string[];  // PCI-DSS, ISO 27001
    };
    
    // Disponibilidade
    availability: {
      score: number;
      uptime_estimado: number;      // %
      backup_strategy: 'NENHUM' | 'BÁSICO' | 'AVANÇADO';
    };
  };
  
  // Gaps Identificados
  gaps: Array<{
    area: string;
    criticidade: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
    descricao: string;
    impacto_negocio: string;
    solucao_sugerida: string;
  }>;
}
```

#### **B) Sistemas Corporativos**
```typescript
interface SystemsMaturity {
  // Score: 0-10
  score_sistemas: number;
  
  // ERP
  erp: {
    possui: boolean;
    fornecedor?: 'TOTVS' | 'SAP' | 'Oracle' | 'Senior' | 'Outro';
    versao?: string;
    modulos: string[];              // Financeiro, Estoque, Produção
    integracao_nivel: 'NENHUM' | 'PARCIAL' | 'TOTAL';
    data_implantacao?: Date;
    nivel_adocao: number;           // % usuários ativos
  };
  
  // CRM
  crm: {
    possui: boolean;
    fornecedor?: 'Salesforce' | 'HubSpot' | 'RD Station' | 'Outro';
    modulos: string[];
    integracao_erp: boolean;
  };
  
  // BI/Analytics
  bi: {
    possui: boolean;
    ferramentas: string[];          // Power BI, Tableau, Qlik
    dashboards_ativos: number;
    usuarios_ativos: number;
  };
  
  // E-commerce
  ecommerce: {
    possui: boolean;
    plataforma?: string;            // VTEX, Shopify, Magento
    omnichannel: boolean;
    integracao_erp: boolean;
  };
  
  // Gestão de Pessoas
  hr_systems: {
    possui: boolean;
    folha_pagamento: boolean;
    ponto_eletronico: boolean;
    recrutamento: boolean;
  };
}
```

#### **C) Processos Digitais**
```typescript
interface ProcessMaturity {
  // Score: 0-10
  score_processos: number;
  
  // Automação
  automation: {
    nivel_geral: 'MANUAL' | 'SEMI_AUTOMATIZADO' | 'AUTOMATIZADO';
    areas_automatizadas: string[];
    ferramentas_rpa: string[];      // UiPath, Automation Anywhere
    economia_horas_mes?: number;
  };
  
  // Workflow Digital
  workflow: {
    possui_bpm: boolean;
    ferramenta_bpm?: string;
    processos_mapeados: number;
    processos_digitalizados: number;
  };
  
  // Colaboração
  collaboration: {
    ferramentas: string[];          // Teams, Slack, Google Workspace
    adocao_cloud_docs: boolean;
    videoconferencia: boolean;
    assinatura_digital: boolean;
  };
  
  // Gestão de Documentos
  document_management: {
    possui_ecm: boolean;            // Enterprise Content Management
    ferramenta?: string;
    digitalizacao_completa: boolean;
    retencao_politica: boolean;
  };
}
```

#### **D) Segurança da Informação**
```typescript
interface SecurityMaturity {
  // Score: 0-10
  score_seguranca: number;
  
  // Políticas
  policies: {
    possui_politica_seguranca: boolean;
    possui_lgpd_compliance: boolean;
    possui_disaster_recovery: boolean;
    possui_backup_policy: boolean;
  };
  
  // Tecnologias
  technologies: {
    antivirus_corporativo: boolean;
    firewall_avancado: boolean;
    vpn_corporativa: boolean;
    mfa_habilitado: boolean;
    siem_soc: boolean;              // Security Information and Event Management
  };
  
  // Treinamento
  training: {
    possui_treinamento: boolean;
    frequencia: string;
    ultimo_treinamento?: Date;
  };
  
  // Certificações
  certifications: string[];         // ISO 27001, SOC 2, etc
}
```

#### **E) Inovação e Cultura Digital**
```typescript
interface InnovationMaturity {
  // Score: 0-10
  score_inovacao: number;
  
  // Tecnologias Emergentes
  emerging_tech: {
    ia_ml: {
      adotado: boolean;
      casos_uso: string[];
      maturidade: 'POC' | 'PILOTO' | 'PRODUCAO';
    };
    iot: {
      adotado: boolean;
      dispositivos_estimados: number;
    };
    blockchain: {
      adotado: boolean;
      casos_uso: string[];
    };
    api_economy: {
      apis_publicas: number;
      apis_internas: number;
      api_first_approach: boolean;
    };
  };
  
  // Investimento em Inovação
  investment: {
    possui_budget_inovacao: boolean;
    percentual_receita?: number;
    projetos_inovacao_ano: number;
  };
  
  // Cultura
  culture: {
    possui_area_inovacao: boolean;
    metodologias_ageis: boolean;
    devops_praticado: boolean;
    mindset_digital_score: number;  // 0-10
  };
}
```

### 📊 SCORE GLOBAL DE MATURIDADE

```typescript
interface GlobalMaturityScore {
  // Score Consolidado
  overall_score: number;            // 0-100 (média ponderada)
  
  // Classificação
  nivel_maturidade: 'INICIANTE' | 'BÁSICO' | 'INTERMEDIÁRIO' | 'AVANÇADO' | 'LÍDER';
  
  // Componentes (pesos)
  componentes_score: {
    infraestrutura: number;         // peso 20%
    sistemas: number;               // peso 30%
    processos: number;              // peso 25%
    seguranca: number;              // peso 15%
    inovacao: number;               // peso 10%
  };
  
  // Posicionamento
  benchmark: {
    percentil_setor: number;        // 0-100
    percentil_porte: number;        // 0-100
    percentil_regiao: number;       // 0-100
    media_setor: number;
    top_quartil_setor: number;
  };
  
  // Evolução (se houver histórico)
  evolucao?: {
    score_anterior: number;
    data_avaliacao_anterior: Date;
    variacao: number;               // +/- pontos
    tendencia: 'CRESCENTE' | 'ESTÁVEL' | 'DECRESCENTE';
  };
}
```

### 🎯 ROADMAP DE MATURIDADE

```typescript
interface MaturityRoadmap {
  // Plano de Evolução
  objetivo_12_meses: number;        // Score alvo
  
  // Fases
  fases: Array<{
    fase: number;
    nome: string;
    duracao_meses: number;
    investimento_estimado: number;
    score_esperado: number;
    
    iniciativas: Array<{
      titulo: string;
      descricao: string;
      area_impactada: string;
      prioridade: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
      complexidade: 'BAIXA' | 'MÉDIA' | 'ALTA';
      roi_esperado: number;
      tempo_implementacao_dias: number;
      
      // Produtos TOTVS Sugeridos
      solucoes_totvs: Array<{
        produto: string;
        modulo: string;
        justificativa: string;
        ticket_medio: number;
      }>;
    }>;
  }>;
}
```

### 🔬 INSIGHTS E RECOMENDAÇÕES

```typescript
interface MaturityInsights {
  // Análise IA
  analise_executiva: string;        // 300 palavras
  
  // Pontos Fortes
  fortes: Array<{
    area: string;
    descricao: string;
    como_explorar: string;
  }>;
  
  // Quick Wins
  quick_wins: Array<{
    titulo: string;
    descricao: string;
    esforco: 'BAIXO' | 'MÉDIO';
    impacto: 'ALTO' | 'MÉDIO';
    roi_meses: number;
    custo_estimado: number;
  }>;
  
  // Gaps Críticos
  gaps_criticos: Array<{
    area: string;
    risco: string;
    impacto_negocio: string;
    urgencia: 'IMEDIATA' | 'CURTO_PRAZO' | 'MÉDIO_PRAZO';
    solucao: string;
  }>;
  
  // Comparação com Líderes
  gap_to_leader: {
    pontos_diferenca: number;
    principais_diferenciais: string[];
    tempo_estimado_alcance: number; // meses
  };
}
```

### 📄 VISUALIZAÇÕES OBRIGATÓRIAS

1. **Radar Chart** - 5 dimensões de maturidade
2. **Heatmap** - Matriz de priorização (esforço x impacto)
3. **Timeline** - Roadmap de evolução
4. **Benchmarking** - Posição vs setor
5. **Progress Bars** - Score por componente

---

## 3. RELATÓRIO DE FIT TOTVS

### 🎯 Objetivo
Avaliar aderência da empresa aos produtos TOTVS e recomendar soluções com alta probabilidade de fechamento.

### 🔌 Engines Necessárias
- ✅ Dados da empresa (ReceitaWS + Apollo)
- ✅ Maturidade Digital (score calculado)
- ✅ Tech Stack (tecnologias atuais)
- ✅ Lovable AI (análise de compatibilidade)

### 📊 DIMENSÕES DE FIT

#### **A) Fit por Porte**
```typescript
interface PorteFit {
  // Classificação
  porte_empresa: 'MEI' | 'ME' | 'EPP' | 'MÉDIO' | 'GRANDE';
  faixa_receita: string;
  numero_funcionarios: number;
  
  // Linhas TOTVS Compatíveis
  linhas_compativeis: Array<{
    linha: 'TOTVS Micro e Pequenas Empresas' | 'TOTVS Backoffice' | 'TOTVS Grandes Empresas' | 'TOTVS Techfin' | 'TOTVS Business Performance';
    fit_score: number;              // 0-100
    justificativa: string;
    ticket_medio: number;
    tempo_implantacao_dias: number;
  }>;
  
  // Restrições
  restricoes: string[];             // Ex: "Empresa muito pequena para módulo X"
}
```

#### **B) Fit por Segmento/Vertical**
```typescript
interface SegmentFit {
  // CNAE e Setor
  cnae_principal: string;
  setor: string;
  
  // Verticais TOTVS Aplicáveis
  verticais_totvs: Array<{
    vertical: 'Varejo' | 'Saúde' | 'Construção' | 'Manufatura' | 'Serviços' | 'Distribuição' | 'Agronegócio' | 'Educação' | 'Jurídico' | 'Hospitalar';
    fit_score: number;              // 0-100
    caracteristicas_empresa: string[];
    solucoes_especificas: Array<{
      nome: string;
      descricao: string;
      diferenciais: string[];
      casos_sucesso: number;
    }>;
  }>;
  
  // Casos de Uso Mapeados
  casos_uso: Array<{
    titulo: string;
    problema_resolvido: string;
    solucao_totvs: string;
    roi_medio: string;
    tempo_retorno_meses: number;
  }>;
}
```

#### **C) Fit por Necessidades Identificadas**
```typescript
interface NeedsFit {
  // Análise de Gaps (baseada em Maturidade Digital)
  gaps_identificados: Array<{
    area: string;
    gap: string;
    prioridade: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
    
    // Solução TOTVS
    solucao_totvs: {
      produto: string;
      modulo: string;
      como_resolve: string;
      beneficios: string[];
      roi_esperado: string;
    };
  }>;
  
  // Dores de Negócio
  dores_negocio: Array<{
    dor: string;
    evidencia: string;              // De onde veio a identificação
    impacto_estimado: string;
    urgencia: 'BAIXA' | 'MÉDIA' | 'ALTA';
    
    // Mapeamento para TOTVS
    produtos_totvs: Array<{
      nome: string;
      pitch: string;                // Como apresentar a solução
      diferencial: string;
    }>;
  }>;
}
```

#### **D) Fit Tecnológico**
```typescript
interface TechFit {
  // Tech Stack Atual
  tecnologias_atuais: string[];
  
  // Compatibilidade TOTVS
  compatibilidade: {
    integracao_facilitada: boolean;
    tecnologias_compativeis: string[];
    tecnologias_conflitantes: string[];
    esforco_integracao: 'BAIXO' | 'MÉDIO' | 'ALTO';
  };
  
  // Migrações Necessárias
  migracoes: Array<{
    de: string;
    para: string;
    complexidade: 'BAIXA' | 'MÉDIA' | 'ALTA';
    tempo_estimado_dias: number;
    custo_estimado: number;
    riscos: string[];
  }>;
  
  // Vantagens Técnicas TOTVS
  vantagens_tecnicas: Array<{
    caracteristica: string;
    descricao: string;
    beneficio_cliente: string;
  }>;
}
```

### 📊 SCORE GLOBAL DE FIT

```typescript
interface GlobalFitScore {
  // Score Consolidado
  fit_score_global: number;         // 0-100
  
  // Classificação
  classificacao_fit: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'EXCELENTE';
  
  // Componentes (pesos)
  componentes: {
    fit_porte: number;              // peso 25%
    fit_segmento: number;           // peso 30%
    fit_necessidades: number;       // peso 30%
    fit_tecnologico: number;        // peso 15%
  };
  
  // Probabilidade de Fechamento
  probabilidade_fechamento: {
    percentual: number;             // 0-100%
    fatores_positivos: string[];
    fatores_negativos: string[];
    objecoes_previstas: string[];
  };
}
```

### 🎯 RECOMENDAÇÕES DE PRODUTOS

```typescript
interface ProductRecommendations {
  // Top 5 Produtos Recomendados
  produtos_recomendados: Array<{
    rank: number;                   // 1-5
    
    // Produto
    nome_produto: string;
    linha_totvs: string;
    modulos: string[];
    
    // Fit
    fit_score: number;              // 0-100
    match_perfeito: boolean;
    
    // Comercial
    ticket_estimado: {
      licenca_mes: number;
      implantacao: number;
      consultoria: number;
      total_primeiro_ano: number;
    };
    
    // Justificativa
    por_que_este_produto: string;   // 200 palavras
    principais_beneficios: string[];
    roi_esperado: {
      percentual: number;
      meses_retorno: number;
      economia_anual_estimada: number;
    };
    
    // Casos de Sucesso Similares
    casos_sucesso: Array<{
      empresa: string;
      setor: string;
      desafio: string;
      solucao: string;
      resultado: string;
    }>;
    
    // Próximos Passos
    proximos_passos: string[];
  }>;
  
  // Upsell e Cross-sell
  oportunidades_adicionais: Array<{
    produto: string;
    momento_sugerido: string;       // "Após 6 meses", "Na renovação"
    sinergia_com: string;           // Produto principal
    incremento_ticket: number;
  }>;
}
```

### 🔬 ANÁLISE DE COMPETIÇÃO

```typescript
interface CompetitionAnalysis {
  // Concorrentes Identificados
  concorrentes_detectados: Array<{
    nome: string;
    categoria: 'ERP' | 'CRM' | 'BI' | 'Outro';
    nivel_adocao: 'POC' | 'PARCIAL' | 'TOTAL';
    satisfacao_estimada: 'BAIXA' | 'MÉDIA' | 'ALTA';
    contrato_vigente: boolean;
    data_renovacao?: Date;
  }>;
  
  // Estratégia de Ataque
  estrategia: {
    tipo: 'LAND' | 'EXPAND' | 'REPLACE' | 'GREENFIELD';
    
    land: {                         // Cliente novo, sem ERP
      abordagem: string;
      angulo: string;
      proof_points: string[];
    };
    
    expand: {                       // Cliente TOTVS, novos módulos
      modulos_atuais: string[];
      modulos_sugeridos: string[];
      cross_sell_rationale: string;
    };
    
    replace: {                      // Substituir concorrente
      concorrente_atual: string;
      insatisfacoes: string[];
      diferenciais_totvs: string[];
      tcO_comparison: {
        concorrente: number;
        totvs: number;
        economia_5_anos: number;
      };
    };
    
    greenfield: {                   // Nova área/funcionalidade
      area: string;
      por_que_agora: string;
      impacto_esperado: string;
    };
  };
}
```

### 📄 SAÍDAS DO RELATÓRIO

1. **Executive Summary** (1 página)
   - Score de Fit
   - Top 3 produtos
   - Ticket estimado
   - Próximos passos

2. **Análise Detalhada** (5-8 páginas)
   - Fit por dimensão
   - Produtos recomendados (detalhado)
   - ROI e justificativas
   - Casos de sucesso

3. **Proposta Comercial** (formato TOTVS)
   - Configuração proposta
   - Preços e condições
   - Cronograma de implantação
   - Anexos (datasheets, casos)

4. **Battle Card** (vendedor)
   - Objeções e respostas
   - Diferenciais vs concorrentes
   - Pitch de elevador
   - FAQs

---

## 4. RELATÓRIO DE DECISORES

### 🎯 Objetivo
Mapear decisores, influenciadores e sua prontidão para compra de soluções B2B.

### 🔌 Engines Necessárias
- ✅ Apollo.io (busca de pessoas)
- ✅ Hunter.io (verificação de e-mails)
- ⚠️ PhantomBuster (scraping LinkedIn)
- ⚠️ Clearbit API (enriquecimento de perfil)

### 📊 PERFIL DE DECISORES

#### **A) Identificação e Contato**
```typescript
interface DecisionMakerProfile {
  // Dados Pessoais
  id: string;
  nome_completo: string;
  foto_perfil_url?: string;
  
  // Cargo e Hierarquia
  titulo: string;                   // CTO, CFO, Diretor de TI
  nivel_hierarquico: 'C-LEVEL' | 'VP' | 'DIRETOR' | 'GERENTE' | 'COORDENADOR' | 'ANALISTA';
  departamento: 'TI' | 'FINANCEIRO' | 'OPERAÇÕES' | 'VENDAS' | 'RH' | 'COMPRAS';
  reporta_para?: string;            // Nome do superior direto
  
  // Contato
  contato: {
    email_corporativo: string;
    email_verificado: boolean;
    telefone_direto?: string;
    telefone_corporativo?: string;
    linkedin_url: string;
    twitter_handle?: string;
  };
  
  // Localização
  localizacao: {
    cidade: string;
    estado: string;
    pais: string;
    timezone: string;
    trabalho_remoto: boolean;
  };
}
```

#### **B) Histórico Profissional**
```typescript
interface ProfessionalHistory {
  // Experiência Total
  anos_experiencia: number;
  anos_empresa_atual: number;
  
  // Empregos Anteriores
  historico: Array<{
    empresa: string;
    cargo: string;
    periodo_inicio: Date;
    periodo_fim?: Date;
    duracao_meses: number;
    descricao?: string;
  }>;
  
  // Educação
  educacao: Array<{
    instituicao: string;
    curso: string;
    nivel: 'TÉCNICO' | 'GRADUAÇÃO' | 'ESPECIALIZAÇÃO' | 'MESTRADO' | 'DOUTORADO';
    ano_conclusao?: number;
  }>;
  
  // Certificações
  certificacoes: Array<{
    nome: string;
    emissor: string;
    data_emissao: Date;
    validade?: Date;
  }>;
}
```

#### **C) Perfil de Decisão**
```typescript
interface DecisionProfile {
  // Papel na Decisão
  papel_decisao: 'DECISOR_FINAL' | 'INFLUENCIADOR' | 'RECOMENDADOR' | 'USUARIO_FINAL' | 'APROVADOR_TÉCNICO' | 'APROVADOR_FINANCEIRO';
  
  // Poder de Decisão
  poder_decisao: {
    score: number;                  // 0-100
    alada_aprovacao: number;        // R$ valor
    precisa_aprovacao: boolean;
    aprovadores_necessarios: string[];
  };
  
  // Histórico de Compras
  historico_compras: {
    tecnologias_aprovadas: string[];
    fornecedores_preferidos: string[];
    ticket_medio_aprovado: number;
    ciclo_decisao_medio_dias: number;
  };
  
  // Preferências
  preferencias: {
    canal_comunicacao_preferido: 'EMAIL' | 'LINKEDIN' | 'TELEFONE' | 'PRESENCIAL';
    melhor_horario: string;
    estilo_comunicacao: 'TÉCNICO' | 'EXECUTIVO' | 'CONSULTIVO';
    sensibilidade_preco: 'BAIXA' | 'MÉDIA' | 'ALTA';
    aversao_risco: 'BAIXA' | 'MÉDIA' | 'ALTA';
  };
}
```

#### **D) Sinais de Engajamento**
```typescript
interface EngagementSignals {
  // Atividade Recente (LinkedIn)
  atividade_linkedin: {
    posts_recentes: Array<{
      texto: string;
      data: Date;
      engajamento: number;
      topicos: string[];
    }>;
    interesses: string[];
    grupos: string[];
    seguindo: string[];             // Empresas/pessoas
  };
  
  // Sinais de Compra
  buying_signals: Array<{
    tipo: 'MUDANCA_CARGO' | 'PROJETO_ANUNCIADO' | 'CONTRATACAO_EQUIPE' | 'MENCAO_DOR' | 'BUDGET_APROVADO';
    data_detectada: Date;
    descricao: string;
    fonte: string;
    relevancia_totvs: number;       // 0-100
  }>;
  
  // Comportamento Digital
  comportamento: {
    visitas_website_totvs: number;
    downloads_materiais: string[];
    participacao_eventos: string[];
    interacoes_anteriores: Array<{
      tipo: 'EMAIL' | 'CALL' | 'MEETING' | 'WEBINAR';
      data: Date;
      resultado: string;
    }>;
  };
}
```

### 📊 SCORING DE DECISORES

```typescript
interface DecisionMakerScoring {
  // Score Global
  score_global: number;             // 0-100
  
  // Componentes
  componentes: {
    // Acessibilidade (30%)
    acessibilidade: {
      score: number;
      email_verificado: boolean;
      linkedin_conectavel: boolean;
      telefone_disponivel: boolean;
    };
    
    // Poder de Decisão (40%)
    poder_decisao: {
      score: number;
      nivel_hierarquico_score: number;
      alada_score: number;
      historico_aprovacoes_score: number;
    };
    
    // Timing (20%)
    timing: {
      score: number;
      buying_signals_count: number;
      urgencia: 'BAIXA' | 'MÉDIA' | 'ALTA';
      janela_oportunidade: string;
    };
    
    // Fit (10%)
    fit: {
      score: number;
      perfil_ideal: boolean;
      experiencia_relevante: boolean;
    };
  };
  
  // Classificação
  classificacao: 'A+' | 'A' | 'B' | 'C' | 'D';
  
  // Recomendação
  recomendacao_abordagem: {
    prioridade: 1 | 2 | 3 | 4 | 5;
    quando_abordar: 'IMEDIATO' | '1_SEMANA' | '1_MES' | '3_MESES';
    como_abordar: string;
    mensagem_sugerida: string;
  };
}
```

### 🎯 MAPA DE INFLUÊNCIA (ORG CHART)

```typescript
interface InfluenceMap {
  // Estrutura Organizacional
  organograma: {
    decisor_final: DecisionMakerProfile;
    influenciadores: DecisionMakerProfile[];
    recomendadores: DecisionMakerProfile[];
    usuarios_finais: DecisionMakerProfile[];
    bloqueadores_potenciais: DecisionMakerProfile[];
  };
  
  // Relações
  relacoes: Array<{
    de: string;                     // ID da pessoa
    para: string;                   // ID da pessoa
    tipo: 'REPORTA_PARA' | 'INFLUENCIA' | 'COLABORA_COM' | 'RIVAL';
    forca: 'FRACA' | 'MÉDIA' | 'FORTE';
  }>;
  
  // Estratégia de Abordagem Multi-Threading
  estrategia_multithreading: {
    sequencia_abordagem: Array<{
      ordem: number;
      pessoa: string;
      objetivo: string;
      mensagem_chave: string;
      resultado_esperado: string;
    }>;
    
    champion_potencial: {
      nome: string;
      por_que: string;
      como_engajar: string;
    };
    
    bloqueadores: Array<{
      nome: string;
      objecao_provavel: string;
      estrategia_mitigacao: string;
    }>;
  };
}
```

### 📧 PLAYBOOK DE CADÊNCIA

```typescript
interface OutreachCadence {
  // Sequência Automática
  sequencia: Array<{
    dia: number;
    canal: 'EMAIL' | 'LINKEDIN' | 'TELEFONE';
    template: string;
    assunto?: string;
    corpo_mensagem: string;
    call_to_action: string;
    
    // Personalização
    tokens_personalizacao: {
      nome: string;
      empresa: string;
      cargo: string;
      dor_identificada: string;
      solucao_proposta: string;
      case_similar: string;
    };
  }>;
  
  // KPIs da Cadência
  kpis_esperados: {
    taxa_abertura_email: number;    // %
    taxa_resposta: number;          // %
    taxa_conversao_reuniao: number; // %
    tempo_medio_resposta_dias: number;
  };
  
  // Regras de Parada
  parar_se: {
    resposta_recebida: boolean;
    pediu_nao_contatar: boolean;
    bounce_email: boolean;
    fora_escritorio_30_dias: boolean;
  };
}
```

---

*CONTINUA... Este documento tem 10 seções. Vou gerar as próximas seções com o mesmo nível de detalhe.*

---

## 5. RELATÓRIO DE BUYING SIGNALS

### 🎯 Objetivo
Detectar sinais de intenção de compra e urgência para priorizar oportunidades comerciais.

### 🔌 Engines Necessárias
- ✅ Google CSE/Serper (notícias e menções)
- ⚠️ PhantomBuster (LinkedIn activity)
- ⚠️ Clearbit (company changes)
- ✅ Apollo.io (hiring signals)
- ⚠️ BuiltWith (tech changes)

### 📊 CATEGORIAS DE SINAIS

#### **A) Sinais de Contratação**
```typescript
interface HiringSignals {
  // Vagas Abertas
  vagas_abertas: Array<{
    titulo: string;
    departamento: string;
    nivel: 'JUNIOR' | 'PLENO' | 'SENIOR' | 'LIDERANÇA';
    data_publicacao: Date;
    plataforma: string;
    
    // Análise
    relevancia_totvs: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'MUITO_ALTA';
    indicacao_necessidade: string;  // "Expansão TI indica projeto de transformação"
    produtos_relacionados: string[];
  }>;
  
  // Tendências
  tendencias: {
    total_vagas_abertas: number;
    variacao_trimestre: number;     // %
    departamentos_expandindo: string[];
    skills_mais_buscadas: string[];
  };
  
  // Score de Expansão
  score_expansao: number;           // 0-100
}
```

#### **B) Sinais Tecnológicos**
```typescript
interface TechSignals {
  // Mudanças Detectadas
  mudancas_tech: Array<{
    tipo: 'NOVA_TECNOLOGIA' | 'REMOÇÃO' | 'UPGRADE' | 'MIGRAÇÃO';
    tecnologia: string;
    data_detectada: Date;
    
    // Implicações
    implicacao_negocio: string;
    oportunidade_totvs: string;
    urgencia: 'BAIXA' | 'MÉDIA' | 'ALTA';
  }>;
  
  // Stack em Crescimento
  stack_crescimento: {
    tecnologias_adicionadas_6m: string[];
    investimento_estimado: number;
    areas_foco: string[];           // Cloud, Analytics, Security
  };
  
  // Vulnerabilidades Técnicas
  vulnerabilidades: Array<{
    tipo: string;
    descricao: string;
    risco: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
    solucao_totvs: string;
  }>;
}
```

#### **C) Sinais de Liderança**
```typescript
interface LeadershipSignals {
  // Mudanças C-Level
  mudancas_lideranca: Array<{
    tipo: 'CONTRATAÇÃO' | 'PROMOÇÃO' | 'SAÍDA';
    nome: string;
    cargo: string;
    data: Date;
    empresa_origem?: string;
    
    // Análise
    perfil_mudanca: string;         // "Contratou CTO com experiência digital"
    janela_oportunidade: {
      inicio: Date;
      fim: Date;
      dias: number;
      probabilidade_compra: number; // %
    };
    estrategia_abordagem: string;
  }>;
  
  // Histórico dos Novos Executivos
  historico_executivos: Array<{
    nome: string;
    cargo_atual: string;
    empresas_anteriores: string[];
    tecnologias_implementadas: string[];
    parceiros_preferidos: string[];
    totvs_no_historico: boolean;
  }>;
}
```

#### **D) Sinais Financeiros**
```typescript
interface FinancialSignals {
  // Investimentos
  investimentos: Array<{
    tipo: 'CAPTAÇÃO' | 'IPO' | 'FUSÃO' | 'AQUISIÇÃO';
    valor: number;
    data: Date;
    investidores?: string[];
    
    // Análise
    destino_recursos: string[];
    oportunidade_totvs: string;
    timing_abordagem: string;
  }>;
  
  // Crescimento
  crescimento_financeiro: {
    receita_crescimento_anual: number; // %
    lucratividade: 'PREJUÍZO' | 'BAIXA' | 'MÉDIA' | 'ALTA';
    budget_ti_estimado: number;
    capacidade_investimento: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'MUITO_ALTA';
  };
  
  // Saúde Financeira
  saude: {
    score: number;                  // 0-100
    inadimplencia: boolean;
    protestos: number;
    processos_judiciais: number;
    risco_credito: 'BAIXO' | 'MÉDIO' | 'ALTO';
  };
}
```

#### **E) Sinais de Mercado**
```typescript
interface MarketSignals {
  // Notícias e Menções
  noticias: Array<{
    titulo: string;
    fonte: string;
    data: Date;
    url: string;
    categoria: 'EXPANSÃO' | 'PRODUTO_NOVO' | 'PRÊMIO' | 'PARCERIA' | 'CRISE' | 'REGULATÓRIO';
    sentimento: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
    
    // Análise
    relevancia_totvs: number;       // 0-100
    oportunidade: string;
    como_usar_abordagem: string;
  }>;
  
  // Expansão Geográfica
  expansao: {
    novas_unidades: number;
    cidades: string[];
    paises?: string[];
    investimento_estimado: number;
    
    // Implicação
    necessidades_ti: string[];
    produtos_totvs_aplicaveis: string[];
  };
  
  // Regulatórios
  mudancas_regulatorias: Array<{
    regulacao: string;
    prazo_compliance: Date;
    impacto: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
    solucoes_totvs: string[];
  }>;
}
```

### 📊 SCORE DE PRONTIDÃO PARA COMPRA

```typescript
interface BuyingReadinessScore {
  // Score Global
  score_prontidao: number;          // 0-100
  
  // Classificação
  classificacao: 'FRIO' | 'MORNO' | 'QUENTE' | 'MUITO_QUENTE' | 'EM_CHAMAS';
  
  // Componentes
  componentes: {
    sinais_contratacao: number;     // peso 20%
    sinais_tecnologicos: number;    // peso 25%
    sinais_lideranca: number;       // peso 30%
    sinais_financeiros: number;     // peso 15%
    sinais_mercado: number;         // peso 10%
  };
  
  // Timeline
  timeline: {
    janela_oportunidade_inicio: Date;
    janela_oportunidade_fim: Date;
    urgencia: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
    probabilidade_compra_30d: number; // %
    probabilidade_compra_90d: number; // %
  };
  
  // Gatilhos de Ação
  gatilhos: {
    acao_imediata: boolean;
    motivo: string;
    proxima_acao: string;
    responsavel_sugerido: 'SDR' | 'AE' | 'SA' | 'AM';
  };
}
```

### 🎯 PRIORIZAÇÃO DE OPORTUNIDADES

```typescript
interface OpportunityPrioritization {
  // Matriz de Priorização
  matriz: {
    prioridade: 'P0' | 'P1' | 'P2' | 'P3';
    
    // Critérios
    criterios: {
      urgencia: number;             // 0-10
      valor_potencial: number;      // 0-10
      probabilidade: number;        // 0-10
      esforco: number;              // 0-10 (inverso)
    };
    
    // Score RICE
    rice_score: number;             // (Reach * Impact * Confidence) / Effort
  };
  
  // Ações Recomendadas
  acoes_recomendadas: Array<{
    sequencia: number;
    acao: string;
    responsavel: string;
    prazo: Date;
    resultado_esperado: string;
  }>;
  
  // Risco de Perda
  risco_perda: {
    probabilidade_concorrente: number; // %
    concorrentes_prováveis: string[];
    diferenciais_defensivos: string[];
  };
}
```

### 📧 ALERTAS AUTOMÁTICOS

```typescript
interface AutomatedAlerts {
  // Configuração de Alertas
  alertas: Array<{
    tipo: 'NOVO_CXO' | 'VAGA_TI' | 'NOTÍCIA_EXPANSÃO' | 'MUDANÇA_TECH' | 'CAPTAÇÃO';
    ativo: boolean;
    destinatarios: string[];        // Emails do time comercial
    
    // Condições
    condicoes: {
      relevancia_minima: number;    // 0-100
      urgencia_minima: 'MÉDIA' | 'ALTA' | 'CRÍTICA';
      valor_oportunidade_minimo: number;
    };
    
    // Template
    template_alerta: {
      assunto: string;
      corpo: string;
      link_dashboard: string;
    };
  }>;
  
  // Histórico de Alertas
  historico: Array<{
    data: Date;
    tipo: string;
    empresa: string;
    decisor?: string;
    acao_tomada: string;
    resultado: string;
  }>;
}
```

---

Por ser extremamente extenso (10 relatórios completos), vou criar o documento completo em um arquivo markdown.


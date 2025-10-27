// Catálogo completo de Produtos e Módulos TOTVS
export interface TOTVSModule {
  id: string;
  name: string;
  description: string;
}

export interface TOTVSProductCategory {
  id: string;
  name: string;
  modules: TOTVSModule[];
}

export const TOTVS_PRODUCTS_MODULES: TOTVSProductCategory[] = [
  {
    id: 'ia',
    name: 'Inteligência Artificial',
    modules: [
      { id: 'auditoria-folha', name: 'Auditoria de Folha Protheus', description: 'Agente em RH para verificação de folha de pagamento, identificação de possíveis inconsistências ou desvios' },
      { id: 'supervisao-compras', name: 'Supervisão de Compras', description: 'Radar de compras inteligente que identifica rapidamente os pedidos que exigem ação' },
      { id: 'supervisao-financeira', name: 'Supervisão Financeira', description: 'Agente que apoia a visibilidade financeira, te ajudando a encontrar os títulos que realmente precisam da sua atenção' },
      { id: 'dilligence-check', name: 'Dilligence Check', description: 'Responde formulários de clientes com base em requisitos de proteção e privacidade de dados' },
      { id: 'contract-chat', name: 'Contract Chat', description: 'Responde dúvidas sobre contratos de determinado cliente' },
      { id: 'consultor-dados-financeiros', name: 'Consultor de Dados Financeiros', description: 'Analisa relatórios financeiros, balancetes e indicadores contábeis para responder dúvidas recorrentes, gerar insights e apoiar decisões estratégicas' },
      { id: 'target-talk', name: 'Target Talk', description: 'Cria comunicação personalizadas com base nas personas da empresa a partir de uma comunicação matriz' },
      { id: 'analise-leads', name: 'Análise de Leads', description: 'Analisa CRM, histórico de e-mails, interações em plataformas e comportamento do cliente para prever quais leads estão mais quentes' },
      { id: 'ropa-legal', name: 'RoPA Legal', description: 'Define a base legal para os processos no Registro das Operações de Processamento de Dados (RoPA)' },
      { id: 'conselheiro-feedbacks', name: 'Conselheiro de Feedbacks', description: 'Sugere planos de ações com base nos feedbacks do colaborador' },
      { id: 'carol-ai', name: 'Carol AI', description: 'Plataforma de IA empresarial da TOTVS' },
    ],
  },
  {
    id: 'erp',
    name: 'ERP',
    modules: [
      { id: 'protheus', name: 'TOTVS Protheus', description: 'ERP completo e robusto para médias e grandes empresas' },
      { id: 'datasul', name: 'TOTVS Datasul', description: 'ERP focado em indústrias de manufatura' },
      { id: 'rm', name: 'TOTVS RM', description: 'ERP para gestão educacional e corporativa' },
      { id: 'logix', name: 'TOTVS Logix', description: 'ERP para grandes indústrias' },
      { id: 'winthor', name: 'TOTVS Winthor', description: 'Sistema de gestão para distribuidores' },
      { id: 'backoffice', name: 'TOTVS Backoffice', description: 'Sistema de gestão simplificado para PMEs' },
      { id: 'gestao-industrial', name: 'Gestão Industrial', description: 'Módulo de manufatura e produção' },
      { id: 'financeiro', name: 'Financeiro', description: 'Gestão financeira e contábil' },
      { id: 'compras', name: 'Compras e Suprimentos', description: 'Procurement e gestão de fornecedores' },
      { id: 'vendas', name: 'Vendas', description: 'Gestão comercial e força de vendas' },
      { id: 'estoque', name: 'Estoque e Logística', description: 'Gestão de armazéns e inventário' },
      { id: 'fiscal', name: 'Fiscal', description: 'Gestão tributária e compliance fiscal' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    modules: [
      { id: 'totvs-bi', name: 'TOTVS BI', description: 'Business Intelligence e Analytics' },
      { id: 'advanced-analytics', name: 'TOTVS Advanced Analytics', description: 'Analytics preditiva e prescritiva' },
      { id: 'data-platform', name: 'TOTVS Data Platform', description: 'Plataforma de dados unificada' },
      { id: 'dashboards', name: 'Dashboards Executivos', description: 'Painéis gerenciais customizados' },
      { id: 'kpis', name: 'KPIs e Indicadores', description: 'Acompanhamento de métricas estratégicas' },
      { id: 'relatorios-gerenciais', name: 'Relatórios Gerenciais', description: 'Reports customizáveis' },
    ],
  },
  {
    id: 'assinatura-eletronica',
    name: 'Assinatura Eletrônica',
    modules: [
      { id: 'totvs-assinatura', name: 'TOTVS Assinatura Eletrônica', description: 'Solução de assinatura digital com validade jurídica' },
      { id: 'documentos-digitais', name: 'Gestão de Documentos Digitais', description: 'Armazenamento e rastreabilidade' },
      { id: 'compliance-lgpd', name: 'Compliance LGPD', description: 'Adequação à Lei Geral de Proteção de Dados' },
    ],
  },
  {
    id: 'atendimento-chatbot',
    name: 'Atendimento e Chatbot',
    modules: [
      { id: 'totvs-atende', name: 'TOTVS Atende', description: 'Plataforma omnichannel de atendimento' },
      { id: 'chatbot-ia', name: 'Chatbot com IA', description: 'Atendimento automatizado inteligente' },
      { id: 'whatsapp-business', name: 'WhatsApp Business', description: 'Integração com WhatsApp' },
      { id: 'service-desk', name: 'Service Desk', description: 'Gestão de chamados e suporte' },
    ],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    modules: [
      { id: 'totvs-cloud', name: 'TOTVS Cloud', description: 'Infraestrutura em nuvem da TOTVS' },
      { id: 'backup-cloud', name: 'Backup em Nuvem', description: 'Backup automático e seguro' },
      { id: 'disaster-recovery', name: 'Disaster Recovery', description: 'Continuidade de negócios' },
      { id: 'iaas', name: 'IaaS', description: 'Infrastructure as a Service' },
    ],
  },
  {
    id: 'credito',
    name: 'Crédito',
    modules: [
      { id: 'totvs-techfin', name: 'TOTVS Techfin', description: 'Soluções de crédito para empresas' },
      { id: 'antecipacao-recebiveis', name: 'Antecipação de Recebíveis', description: 'Capital de giro rápido' },
      { id: 'credito-empresarial', name: 'Crédito Empresarial', description: 'Linhas de crédito para PMEs' },
      { id: 'analise-credito', name: 'Análise de Crédito', description: 'Scoring e análise de risco' },
    ],
  },
  {
    id: 'crm-vendas',
    name: 'CRM de Vendas',
    modules: [
      { id: 'totvs-crm', name: 'TOTVS CRM', description: 'Customer Relationship Management' },
      { id: 'funil-vendas', name: 'Funil de Vendas', description: 'Gestão de pipeline comercial' },
      { id: 'lead-scoring', name: 'Lead Scoring', description: 'Qualificação inteligente de leads' },
      { id: 'automacao-vendas', name: 'Automação de Vendas', description: 'Sales automation' },
      { id: 'sfa', name: 'SFA - Sales Force Automation', description: 'Força de vendas em campo' },
    ],
  },
  {
    id: 'fluig',
    name: 'Fluig',
    modules: [
      { id: 'fluig-platform', name: 'Fluig Platform', description: 'Plataforma de colaboração e processos' },
      { id: 'bpm', name: 'BPM - Business Process Management', description: 'Gestão de processos de negócio' },
      { id: 'ecm', name: 'ECM - Enterprise Content Management', description: 'Gestão de conteúdo empresarial' },
      { id: 'workflow', name: 'Workflow', description: 'Automação de fluxos de trabalho' },
      { id: 'portal-corporativo', name: 'Portal Corporativo', description: 'Intranet e colaboração' },
    ],
  },
  {
    id: 'ipaas',
    name: 'iPaaS',
    modules: [
      { id: 'totvs-ipaas', name: 'TOTVS iPaaS', description: 'Integration Platform as a Service' },
      { id: 'api-management', name: 'API Management', description: 'Gestão de APIs' },
      { id: 'integracoes', name: 'Integrações', description: 'Conectores pré-construídos' },
      { id: 'etl', name: 'ETL - Extract Transform Load', description: 'Transformação de dados' },
    ],
  },
  {
    id: 'marketing-digital',
    name: 'Marketing Digital',
    modules: [
      { id: 'rd-station', name: 'RD Station', description: 'Automação de marketing (parceiro TOTVS)' },
      { id: 'email-marketing', name: 'E-mail Marketing', description: 'Campanhas por e-mail' },
      { id: 'landing-pages', name: 'Landing Pages', description: 'Páginas de conversão' },
      { id: 'marketing-automation', name: 'Automação de Marketing', description: 'Fluxos automatizados' },
    ],
  },
  {
    id: 'pagamentos',
    name: 'Pagamentos',
    modules: [
      { id: 'totvs-pay', name: 'TOTVS Pay', description: 'Gateway de pagamentos' },
      { id: 'pix', name: 'PIX', description: 'Integração PIX' },
      { id: 'cartao-credito', name: 'Cartão de Crédito', description: 'Processamento de cartões' },
      { id: 'boleto', name: 'Boleto Bancário', description: 'Emissão e gestão de boletos' },
      { id: 'conciliacao', name: 'Conciliação Bancária', description: 'Conciliação automática' },
    ],
  },
  {
    id: 'rh',
    name: 'RH',
    modules: [
      { id: 'totvs-rh', name: 'TOTVS RH', description: 'Gestão completa de recursos humanos' },
      { id: 'folha-pagamento', name: 'Folha de Pagamento', description: 'Processamento de folha' },
      { id: 'ponto-eletronico', name: 'Ponto Eletrônico', description: 'Controle de jornada' },
      { id: 'recrutamento', name: 'Recrutamento e Seleção', description: 'Talent acquisition' },
      { id: 'treinamento', name: 'Treinamento e Desenvolvimento', description: 'LMS e capacitação' },
      { id: 'beneficios', name: 'Gestão de Benefícios', description: 'Administração de benefícios' },
      { id: 'desempenho', name: 'Avaliação de Desempenho', description: 'Performance management' },
    ],
  },
  {
    id: 'sfa',
    name: 'SFA',
    modules: [
      { id: 'totvs-sfa', name: 'TOTVS SFA', description: 'Sales Force Automation' },
      { id: 'app-mobile', name: 'App Mobile', description: 'Aplicativo para força de vendas' },
      { id: 'roteirizacao', name: 'Roteirização', description: 'Planejamento de rotas' },
      { id: 'pedidos-mobile', name: 'Pedidos Mobile', description: 'Captura de pedidos em campo' },
      { id: 'catalogo-produtos', name: 'Catálogo de Produtos', description: 'Apresentação digital' },
    ],
  },
];

export function getAllProducts(): string[] {
  return TOTVS_PRODUCTS_MODULES.map(p => p.name);
}

export function getModulesByProduct(productId: string): TOTVSModule[] {
  const product = TOTVS_PRODUCTS_MODULES.find(p => p.id === productId);
  return product?.modules || [];
}

export function getProductById(productId: string): TOTVSProductCategory | undefined {
  return TOTVS_PRODUCTS_MODULES.find(p => p.id === productId);
}

export function searchProducts(query: string): TOTVSProductCategory[] {
  const lowerQuery = query.toLowerCase();
  return TOTVS_PRODUCTS_MODULES.filter(
    p => p.name.toLowerCase().includes(lowerQuery) ||
         p.modules.some(m => m.name.toLowerCase().includes(lowerQuery))
  );
}

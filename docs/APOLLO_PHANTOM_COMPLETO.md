# 📊 Informações Completas: Apollo.io + PhantomBuster

## ✅ Apollo.io - Dados B2B e Decisores

### 🏢 **ApolloOrganization** (Dados da Empresa)

```typescript
{
  id: string;                          // ID único no Apollo
  name: string;                        // Nome oficial da empresa
  website_url?: string;                // Website principal
  primary_domain?: string;             // Domínio principal (ex: totvs.com)
  industry?: string;                   // Setor/indústria
  estimated_num_employees?: number;    // Número estimado de funcionários
  annual_revenue?: string;             // Receita anual estimada (ex: "$10M-$50M")
  city?: string;                       // Cidade da sede
  state?: string;                      // Estado
  country?: string;                    // País
  linkedin_url?: string;               // URL do LinkedIn da empresa
  technologies?: string[];             // Tecnologias usadas (ex: ["Salesforce", "AWS"])
  raw_address?: string;                // Endereço completo
  
  // Campos adicionais disponíveis:
  phone?: string;                      // Telefone principal
  founded_year?: number;               // Ano de fundação
  total_funding?: string;              // Financiamento total
  latest_funding_round_date?: string;  // Data do último financiamento
  seo_description?: string;            // Descrição SEO do site
  keywords?: string[];                 // Palavras-chave associadas
  retail_location_count?: number;      // Número de lojas (varejo)
  publicly_traded?: boolean;           // Empresa de capital aberto
  stock_symbol?: string;               // Símbolo na bolsa
  crunchbase_url?: string;             // URL no Crunchbase
  facebook_url?: string;               // Facebook
  twitter_url?: string;                // Twitter
  owned_by_organization_id?: string;   // ID da empresa controladora
  suborganizations?: string[];         // Subsidiárias
  num_suborganizations?: number;       // Número de subsidiárias
  account_stage?: string;              // Estágio da conta (prospect, customer, etc)
  typed_custom_fields?: object;        // Campos customizados
}
```

### 👤 **ApolloPerson** (Decisores)

```typescript
{
  id: string;                          // ID único no Apollo
  name: string;                        // Nome completo
  title?: string;                      // Cargo atual
  email?: string;                      // Email (se disponível)
  email_status?: 'verified' | 'guessed' | 'unavailable'; // Status do email
  linkedin_url?: string;               // LinkedIn pessoal
  functions?: string[];                // Funções (ex: ["Finance", "Sales"])
  seniority?: string;                  // Senioridade (ex: "c_suite", "vp", "director")
  organization_id?: string;            // ID da empresa no Apollo
  phone_numbers?: Array<{              // Telefones
    raw_number: string;
    type: string;                      // mobile, work, etc
  }>;
  
  // Campos adicionais disponíveis:
  first_name?: string;                 // Primeiro nome
  last_name?: string;                  // Sobrenome
  headline?: string;                   // Headline do LinkedIn
  photo_url?: string;                  // Foto de perfil
  twitter_url?: string;                // Twitter pessoal
  facebook_url?: string;               // Facebook pessoal
  city?: string;                       // Cidade
  state?: string;                      // Estado
  country?: string;                    // País
  employment_history?: Array<{         // Histórico profissional
    title: string;
    organization_name: string;
    start_date: string;
    end_date?: string;
    current: boolean;
  }>;
  education?: Array<{                  // Formação acadêmica
    school_name: string;
    degree: string;
    field_of_study: string;
    start_date?: string;
    end_date?: string;
  }>;
  departments?: string[];              // Departamentos
  subdepartments?: string[];           // Subdepartamentos
  seniority_level?: string;            // Nível de senioridade detalhado
  intent_strength?: string;            // Força de intenção de compra
  show_intent?: boolean;               // Mostra sinais de intenção
  revealed_for_current_team?: boolean; // Revelado para o time atual
  email_confidence?: number;           // Confiança no email (0-1)
  typed_custom_fields?: object;        // Campos customizados
  organization?: {                     // Dados da organização
    name: string;
    website_url: string;
    linkedin_url: string;
  };
}
```

---

## 🔮 PhantomBuster - LinkedIn Scraping Avançado

### 👨‍💼 **PhantomScrapedProfile** (Perfil Completo do LinkedIn)

```typescript
{
  profileUrl: string;                  // URL do perfil LinkedIn
  fullName: string;                    // Nome completo
  headline?: string;                   // Headline profissional
  location?: string;                   // Localização
  summary?: string;                    // Resumo/sobre (até 2000 caracteres)
  
  experience?: Array<{                 // Experiência profissional detalhada
    title: string;                     // Cargo
    company: string;                   // Nome da empresa
    duration: string;                  // Duração (ex: "2 anos 3 meses")
    startDate?: string;                // Data de início
    endDate?: string;                  // Data de término (ou "Present")
    location?: string;                 // Local do trabalho
    description?: string;              // Descrição das responsabilidades
    companyLinkedinUrl?: string;       // LinkedIn da empresa
  }>;
  
  education?: Array<{                  // Formação acadêmica
    school: string;                    // Nome da instituição
    degree: string;                    // Grau (Bacharel, Mestrado, etc)
    field: string;                     // Área de estudo
    startDate?: string;                // Data de início
    endDate?: string;                  // Data de conclusão
    description?: string;              // Descrição adicional
    activities?: string;               // Atividades e sociedades
  }>;
  
  skills?: string[];                   // Lista de habilidades (até 50)
  connections?: number;                // Número de conexões (500+ se >500)
  
  // Campos adicionais do Phantom:
  firstName?: string;                  // Primeiro nome
  lastName?: string;                   // Sobrenome
  occupation?: string;                 // Ocupação atual
  companyName?: string;                // Empresa atual
  companyWebsite?: string;             // Website da empresa atual
  school?: string;                     // Última escola/universidade
  vmid?: string;                       // ID interno do LinkedIn
  imgUrl?: string;                     // URL da foto de perfil
  backgroundImgUrl?: string;           // URL da foto de capa
  languages?: Array<{                  // Idiomas
    name: string;
    proficiency?: string;              // Nível (Native, Professional, etc)
  }>;
  certifications?: Array<{             // Certificações
    name: string;
    authority: string;
    licenseNumber?: string;
    startDate?: string;
    endDate?: string;
    url?: string;
  }>;
  volunteering?: Array<{               // Trabalho voluntário
    role: string;
    organization: string;
    cause?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  recommendations?: Array<{            // Recomendações
    recommenderName: string;
    recommenderTitle: string;
    text: string;
  }>;
  publications?: Array<{               // Publicações
    title: string;
    publisher?: string;
    date?: string;
    description?: string;
    url?: string;
  }>;
  projects?: Array<{                   // Projetos
    title: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    url?: string;
  }>;
  honors?: Array<{                     // Honras e prêmios
    title: string;
    issuer?: string;
    date?: string;
    description?: string;
  }>;
  courses?: string[];                  // Cursos realizados
  organizations?: Array<{              // Organizações
    name: string;
    position?: string;
    startDate?: string;
    endDate?: string;
  }>;
  interests?: string[];                // Interesses
  followers?: number;                  // Número de seguidores
  mutual_connections?: number;         // Conexões mútuas
  top_card_badges?: string[];          // Badges do perfil (ex: "Open to work")
}
```

### 🏢 **PhantomScrapedCompany** (Página da Empresa no LinkedIn)

```typescript
{
  companyUrl: string;                  // URL da página da empresa
  name: string;                        // Nome da empresa
  description?: string;                // Descrição completa
  website?: string;                    // Website oficial
  industry?: string;                   // Setor
  companySize?: string;                // Tamanho (ex: "1001-5000 employees")
  headquarters?: string;               // Sede
  founded?: string;                    // Ano de fundação
  specialties?: string[];              // Especialidades
  
  // Dados avançados:
  followers?: number;                  // Seguidores no LinkedIn
  employees?: number;                  // Funcionários estimados
  locations?: Array<{                  // Escritórios/filiais
    name: string;
    address: string;
    isPrimary: boolean;
  }>;
  updates?: Array<{                    // Posts recentes
    text: string;
    date: string;
    likes?: number;
    comments?: number;
    shares?: number;
    url: string;
  }>;
  affiliated_companies?: string[];     // Empresas afiliadas
  recent_hires?: Array<{               // Contratações recentes
    name: string;
    title: string;
    date: string;
  }>;
  job_openings?: Array<{               // Vagas abertas
    title: string;
    location: string;
    posted_date: string;
    url: string;
  }>;
  company_updates_stats?: {            // Estatísticas de engajamento
    total_posts: number;
    avg_likes: number;
    avg_comments: number;
    avg_shares: number;
  };
}
```

---

## 🎯 Status Atual de Implementação

### ✅ **Apollo.io**
- **Status**: IMPLEMENTADO e FUNCIONAL
- **Localização**: `src/lib/adapters/people/apollo.ts`
- **Edge Function**: `supabase/functions/enrich-apollo/index.ts`
- **API Key**: Configurada (`APOLLO_API_KEY`)
- **Uso**: Busca de empresas e decisores em tempo real

### ⚠️ **PhantomBuster**
- **Status**: PARCIALMENTE IMPLEMENTADO
- **Localização**: `src/lib/adapters/people/phantom.ts`
- **Edge Function**: `supabase/functions/linkedin-scrape/index.ts`
- **Pendências**:
  - Configurar `Agent ID` específico
  - Configurar `Session Cookie` do LinkedIn
  - Testar scraping completo

---

## 💡 Combinação Apollo + Phantom: Poder Total

Quando combinados, Apollo + Phantom fornecem:

1. **Apollo**: Dados estruturados e verificados (contatos, emails verificados, empresas)
2. **Phantom**: Dados profundos do LinkedIn (histórico completo, posts, atividades)

### Exemplo de uso ideal:
1. Apollo encontra os decisores e emails
2. Phantom extrai perfis completos do LinkedIn
3. Cruzamento de dados = visão 360° de cada decisor

---

## 📈 Dados Adicionais Que Podemos Extrair

### Via Apollo:
- ✅ Emails verificados
- ✅ Telefones diretos
- ✅ Histórico de cargos
- ✅ Tecnologias usadas pela empresa
- ✅ Sinais de intenção de compra

### Via Phantom:
- ✅ Posts e atividades recentes
- ✅ Recomendações recebidas
- ✅ Certificações e cursos
- ✅ Projetos desenvolvidos
- ✅ Publicações e artigos
- ✅ Vagas abertas na empresa
- ✅ Contratações recentes

---

## 🔥 Próximos Passos Sugeridos

1. **Configurar Phantom completamente** para scraping automático
2. **Criar engine de cross-matching** Apollo + Phantom
3. **Adicionar análise de sentimento** nos posts do LinkedIn
4. **Detectar sinais de compra** via atividades recentes
5. **Score de engajamento** baseado em atividade social

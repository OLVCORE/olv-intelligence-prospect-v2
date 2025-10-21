# Campos de Enriquecimento - Busca de Empresas

## Visão Geral

O formulário de busca de empresas possui múltiplos campos de refinamento que permitem uma busca mais precisa e direcionada. Estes campos são organizados em categorias para facilitar o uso.

## Estrutura dos Campos

### 1. Busca Principal (Obrigatório)

**Um dos campos abaixo deve ser preenchido:**

- **CNPJ**: Número de CNPJ da empresa (com ou sem formatação)
  - Formato: `00.000.000/0000-00` ou `00000000000000`
  - Busca direta na ReceitaWS para dados oficiais
  
- **Nome da Empresa**: Nome completo ou parcial da empresa
  - Mínimo: 3 caracteres para autocomplete
  - Sistema de sugestões via Google Search
  - Exemplo: "TOTVS", "Ambev", "OLV Internacional"

---

### 2. Presença Digital (Opcional)

Estes campos permitem refinar a busca usando dados de presença online da empresa:

#### 🌐 Website
- **Formato**: URL completa
- **Exemplo**: `https://olvinternacional.com.br`
- **Uso**: Extrai domínio para busca cruzada e validação
- **Fonte de enriquecimento**: Apollo.io, Google Search

#### 📱 Instagram
- **Formato**: `@usuario` ou link completo
- **Exemplo**: `@olvinternacional` ou `instagram.com/olvinternacional`
- **Uso**: Identifica presença em redes sociais
- **Fonte de enriquecimento**: Busca web, análise de presença digital

#### 💼 LinkedIn
- **Formato**: URL do perfil da empresa
- **Exemplo**: `linkedin.com/company/olv-internacional`
- **Uso**: Enriquecimento de dados corporativos e decisores
- **Fonte de enriquecimento**: Apollo.io, scraping LinkedIn

---

### 3. Produtos & Segmentação (Opcional)

Campos para buscar empresas por produtos, marcas ou presença em marketplaces:

#### 📦 Produto / Categoria
- **Formato**: Texto livre
- **Exemplo**: "ERP", "CRM", "Software de Gestão", "Máquinas Industriais"
- **Uso**: Identifica segmento de atuação e produtos comercializados
- **Fonte de enriquecimento**: Google Search, análise de conteúdo web

#### 🏷️ Marca
- **Formato**: Texto livre
- **Exemplo**: "TOTVS Protheus", "SAP Business One", "Nike"
- **Uso**: Busca empresas que trabalham com marcas específicas
- **Fonte de enriquecimento**: Marketplaces, Google Search

#### 🔗 Link do Produto/Marketplace
- **Formato**: URL completa
- **Exemplos**:
  - `mercadolivre.com.br/produto-xyz`
  - `alibaba.com/product/...`
  - `b2bbrasil.com.br/empresa`
  - `amazon.com.br/dp/...`
- **Uso**: Identifica empresa através de anúncios em marketplaces
- **Fonte de enriquecimento**: Scraping de marketplaces, detector de marketplace

---

### 4. Localização (Opcional)

Campos geográficos para segmentação por região:

#### 🏙️ Município
- **Formato**: Nome da cidade
- **Exemplo**: "São Paulo", "Curitiba", "Belo Horizonte"
- **Uso**: Filtro geográfico principal
- **Fonte de enriquecimento**: ReceitaWS, Apollo.io

#### 📍 Estado
- **Formato**: Sigla (2 caracteres)
- **Exemplo**: "SP", "RJ", "MG", "PR"
- **Uso**: Filtro por estado
- **Fonte de enriquecimento**: ReceitaWS, Apollo.io

#### 🌍 País
- **Formato**: Nome do país
- **Exemplo**: "Brasil", "Argentina", "Estados Unidos"
- **Padrão**: "Brasil"
- **Uso**: Segmentação internacional
- **Fonte de enriquecimento**: Apollo.io, Google Search

#### 🏘️ Bairro
- **Formato**: Texto livre
- **Exemplo**: "Vila Olímpia", "Centro", "Jardim Paulista"
- **Uso**: Refinamento geográfico granular
- **Fonte de enriquecimento**: ReceitaWS

#### 🛣️ Logradouro
- **Formato**: Texto livre
- **Exemplo**: "Avenida Paulista", "Rua Augusta", "Alameda Santos"
- **Uso**: Busca por endereço específico
- **Fonte de enriquecimento**: ReceitaWS

---

## Fluxo de Enriquecimento

### Quando usar CNPJ:
1. ✅ Busca na **ReceitaWS** (dados oficiais)
2. ✅ Extrai razão social, fantasia, atividade principal
3. ✅ Obtém endereço completo (logradouro, bairro, município, estado)
4. ✅ Busca decisores no **Apollo.io** usando CNPJ/razão social

### Quando usar Nome + Campos de Refinamento:
1. ✅ Busca no **Google Search** com nome + refinamentos
2. ✅ Identifica sugestões de empresas (websites, links)
3. ✅ Extrai domínio do website encontrado
4. ✅ Busca dados corporativos no **Apollo.io**
5. ✅ Cruza informações de redes sociais (Instagram, LinkedIn)
6. ✅ Valida presença em marketplaces (se link fornecido)
7. ✅ Análise de maturidade digital via **Serper API**

### Quando usar Links de Redes Sociais:
- **Instagram/LinkedIn NO campo de refinamento** (✅ CORRETO):
  - Sistema usa para busca web e enriquecimento
  - NÃO busca por CNPJ
  - Faz scraping e análise de presença digital
  
- **Instagram/LinkedIn NO campo Nome da Empresa** (❌ EVITAR):
  - Pode causar busca incorreta por CNPJ
  - Use os campos de refinamento específicos

---

## Fontes de Dados

### Dados Oficiais
- **ReceitaWS**: CNPJ, razão social, endereço, atividades
- **CNEP/CEIS**: Processos jurídicos (próxima implementação)

### Dados Corporativos
- **Apollo.io**: Dados da empresa, decisores, tecnologias
- **Google Search**: Presença web, sugestões
- **Serper API**: Análise de maturidade digital

### Dados de Presença Digital
- **LinkedIn**: Perfil corporativo, funcionários
- **Instagram**: Presença em redes sociais
- **Marketplaces**: B2BBrasil, Mercado Livre, Alibaba

### Análise Jurídica
- **JusBrasil**: Processos jurídicos (mock - implementação real pendente)
- **APIs Públicas**: CNEP, CEIS (próxima implementação)

---

## Validações

### Campos Obrigatórios
- CNPJ **OU** Nome da Empresa

### Campos com Validação de Formato
- **CNPJ**: Regex de formato brasileiro
- **Website**: Deve ser URL válida
- **Link de Produto**: Deve ser URL válida
- **Estado**: Máximo 2 caracteres

### Limites de Caracteres
- **Nome da Empresa**: 2-200 caracteres
- **Instagram**: Máximo 100 caracteres
- **LinkedIn**: Máximo 200 caracteres
- **Produto/Marca**: Máximo 100 caracteres
- **Logradouro**: Máximo 200 caracteres
- **Município/Bairro**: Máximo 100 caracteres

---

## Exemplos de Uso

### Exemplo 1: Busca por CNPJ
```
CNPJ: 18.627.195/0001-60
```
**Resultado**: Dados completos da ReceitaWS + enriquecimento Apollo

### Exemplo 2: Busca por Nome + Localização
```
Nome: TOTVS
Município: São Paulo
Estado: SP
```
**Resultado**: Empresas TOTVS em São Paulo/SP

### Exemplo 3: Busca por Produto + Marketplace
```
Nome: Empresa de Geomembranas
Produto: Geomembranas PEAD
Link do Produto: mercadolivre.com.br/geomembranas
Município: Curitiba
```
**Resultado**: Empresas que vendem geomembranas no Mercado Livre em Curitiba

### Exemplo 4: Busca por Redes Sociais
```
Nome: OLV Internacional
Instagram: @olvinternacional
LinkedIn: linkedin.com/company/olv-internacional
Website: https://olvinternacional.com.br
```
**Resultado**: Enriquecimento completo via redes sociais + web

---

## Próximas Implementações

- [ ] Integração real com JusBrasil API
- [ ] APIs públicas CNEP/CEIS para processos jurídicos
- [ ] Scraping avançado de marketplaces
- [ ] Análise de reputação (Reclame Aqui, Trustpilot)
- [ ] Dados financeiros (Serasa, SCPC)
- [ ] Tecnologias detectadas (BuiltWith, Wappalyzer)

# 🔧 GUIA DE IMPLEMENTAÇÃO - RELATÓRIOS OLV INTELLIGENCE

## 🎯 OVERVIEW TÉCNICO

Este documento define **como implementar** todos os relatórios especificados na arquitetura.

---

## 📂 ESTRUTURA DE ARQUIVOS

```
src/
├── components/
│   ├── reports/
│   │   ├── CompanyReport/
│   │   │   ├── CompanyReportHeader.tsx
│   │   │   ├── CompanyIdentification.tsx
│   │   │   ├── CompanyFinancials.tsx
│   │   │   ├── CompanyStructure.tsx
│   │   │   ├── DigitalPresence.tsx
│   │   │   ├── CompanyMetrics.tsx
│   │   │   └── CompanyInsights.tsx
│   │   ├── MaturityReport/
│   │   │   ├── MaturityDashboard.tsx
│   │   │   ├── InfrastructureScore.tsx
│   │   │   ├── SystemsScore.tsx
│   │   │   ├── ProcessesScore.tsx
│   │   │   ├── SecurityScore.tsx
│   │   │   ├── InnovationScore.tsx
│   │   │   ├── MaturityRoadmap.tsx
│   │   │   └── MaturityInsights.tsx
│   │   ├── FitReport/
│   │   │   ├── FitScoreCard.tsx
│   │   │   ├── PorteFit.tsx
│   │   │   ├── SegmentFit.tsx
│   │   │   ├── NeedsFit.tsx
│   │   │   ├── TechFit.tsx
│   │   │   ├── ProductRecommendations.tsx
│   │   │   └── CompetitionAnalysis.tsx
│   │   ├── DecisionMakersReport/
│   │   │   ├── DecisionMakersList.tsx
│   │   │   ├── DecisionMakerCard.tsx
│   │   │   ├── DecisionMakerScoring.tsx
│   │   │   ├── InfluenceMap.tsx
│   │   │   └── OutreachCadence.tsx
│   │   ├── BuyingSignalsReport/
│   │   │   ├── SignalsTimeline.tsx
│   │   │   ├── HiringSignals.tsx
│   │   │   ├── TechSignals.tsx
│   │   │   ├── LeadershipSignals.tsx
│   │   │   ├── FinancialSignals.tsx
│   │   │   ├── MarketSignals.tsx
│   │   │   └── ReadinessScore.tsx
│   │   ├── TechStackReport/
│   │   │   ├── TechInventory.tsx
│   │   │   ├── CostAnalysis.tsx
│   │   │   ├── RiskAnalysis.tsx
│   │   │   ├── TechBenchmarking.tsx
│   │   │   └── TechnologyRoadmap.tsx
│   │   ├── BenchmarkReport/
│   │   │   ├── PositioningMatrix.tsx
│   │   │   ├── FinancialBenchmark.tsx
│   │   │   ├── DigitalBenchmark.tsx
│   │   │   ├── OperationalBenchmark.tsx
│   │   │   └── GapAnalysis.tsx
│   │   ├── Dashboard/
│   │   │   ├── ExecutiveDashboard.tsx
│   │   │   ├── EnginesPerformance.tsx
│   │   │   ├── ConversionAnalysis.tsx
│   │   │   ├── CompetitiveIntelligence.tsx
│   │   │   └── PredictionsForecasting.tsx
│   │   └── shared/
│   │       ├── ScoreGauge.tsx
│   │       ├── TrendChart.tsx
│   │       ├── RadarChart.tsx
│   │       ├── HeatMap.tsx
│   │       └── DataTable.tsx
├── lib/
│   ├── reports/
│   │   ├── companyReport.ts
│   │   ├── maturityReport.ts
│   │   ├── fitReport.ts
│   │   ├── decisorsReport.ts
│   │   ├── signalsReport.ts
│   │   ├── techStackReport.ts
│   │   ├── benchmarkReport.ts
│   │   └── dashboardMetrics.ts
│   └── analytics/
│       ├── scoring.ts
│       ├── predictions.ts
│       └── insights.ts
└── supabase/
    └── functions/
        ├── generate-company-report/
        ├── generate-maturity-report/
        ├── generate-fit-report/
        ├── generate-pdf-report/
        └── analytics/
            ├── calculate-scores/
            ├── benchmark-analysis/
            └── predictions/
```

---

## 🔌 EDGE FUNCTIONS NECESSÁRIAS

### 1. Generate Company Report
```typescript
// supabase/functions/generate-company-report/index.ts
serve(async (req) => {
  const { companyId } = await req.json();
  
  // 1. Buscar dados da empresa
  const company = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  
  // 2. Buscar dados relacionados
  const [decisors, maturity, techStack, signals] = await Promise.all([
    supabase.from('decision_makers').select('*').eq('company_id', companyId),
    supabase.from('digital_maturity').select('*').eq('company_id', companyId).single(),
    supabase.from('tech_stack').select('*').eq('company_id', companyId),
    supabase.from('buying_signals').select('*').eq('company_id', companyId)
  ]);
  
  // 3. Calcular métricas
  const metrics = calculateCompanyMetrics(company, decisors, maturity);
  
  // 4. Gerar insights com IA
  const insights = await generateInsightsWithAI(company, metrics);
  
  // 5. Compilar relatório
  const report = {
    identification: buildIdentification(company),
    location: buildLocation(company),
    activity: buildActivity(company),
    structure: buildStructure(company),
    financials: buildFinancials(company),
    digitalPresence: buildDigitalPresence(company),
    metrics,
    insights
  };
  
  return new Response(JSON.stringify(report), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 2. Calculate Maturity Score
```typescript
// supabase/functions/calculate-maturity-score/index.ts
serve(async (req) => {
  const { companyId } = await req.json();
  
  // 1. Buscar dados
  const [company, techStack] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('tech_stack').select('*').eq('company_id', companyId)
  ]);
  
  // 2. Calcular scores por dimensão
  const scores = {
    infrastructure: calculateInfrastructureScore(company, techStack),
    systems: calculateSystemsScore(company, techStack),
    processes: calculateProcessesScore(company),
    security: calculateSecurityScore(company, techStack),
    innovation: calculateInnovationScore(company, techStack)
  };
  
  // 3. Score global (média ponderada)
  const overallScore = (
    scores.infrastructure * 0.20 +
    scores.systems * 0.30 +
    scores.processes * 0.25 +
    scores.security * 0.15 +
    scores.innovation * 0.10
  );
  
  // 4. Classificação
  const classification = classifyMaturity(overallScore);
  
  // 5. Benchmark
  const benchmark = await fetchSectorBenchmark(company.industry);
  
  // 6. Gaps
  const gaps = identifyGaps(scores, benchmark);
  
  // 7. Roadmap
  const roadmap = generateMaturityRoadmap(gaps, company);
  
  // 8. Salvar no banco
  await supabase.from('digital_maturity').upsert({
    company_id: companyId,
    overall_score: overallScore,
    infrastructure_score: scores.infrastructure,
    systems_score: scores.systems,
    processes_score: scores.processes,
    security_score: scores.security,
    innovation_score: scores.innovation,
    classification,
    analysis_data: { scores, gaps, roadmap, benchmark }
  });
  
  return new Response(JSON.stringify({
    overallScore,
    classification,
    scores,
    gaps,
    roadmap,
    benchmark
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 3. Analyze TOTVS Fit (já existe, melhorar)
```typescript
// supabase/functions/analyze-totvs-fit/index.ts (MELHORADO)
serve(async (req) => {
  const { companyId } = await req.json();
  
  // 1. Buscar dados consolidados
  const [company, maturity, techStack, decisors] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('digital_maturity').select('*').eq('company_id', companyId).single(),
    supabase.from('tech_stack').select('*').eq('company_id', companyId),
    supabase.from('decision_makers').select('*').eq('company_id', companyId)
  ]);
  
  // 2. Calcular Fits
  const fits = {
    porte: calculatePorteFit(company),
    segmento: calculateSegmentFit(company),
    necessidades: calculateNeedsFit(maturity, techStack),
    tecnologico: calculateTechFit(techStack)
  };
  
  // 3. Score Global de Fit
  const globalFitScore = (
    fits.porte * 0.25 +
    fits.segmento * 0.30 +
    fits.necessidades * 0.30 +
    fits.tecnologico * 0.15
  );
  
  // 4. Classificação
  const classification = classifyFit(globalFitScore);
  
  // 5. Probabilidade de Fechamento
  const closingProbability = calculateClosingProbability(
    globalFitScore,
    decisors.length,
    maturity.overall_score
  );
  
  // 6. Recomendações de Produtos com IA
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em produtos TOTVS. Analise os dados da empresa e recomende os 5 produtos TOTVS mais adequados, com justificativa detalhada, ticket estimado e ROI.`
        },
        {
          role: 'user',
          content: JSON.stringify({
            empresa: company,
            maturidade: maturity,
            tecnologias: techStack,
            fits,
            score_fit: globalFitScore
          })
        }
      ]
    })
  });
  
  const aiData = await aiResponse.json();
  const recommendations = JSON.parse(aiData.choices[0].message.content);
  
  // 7. Análise de Competição
  const competition = analyzeCompetition(techStack);
  
  // 8. Salvar análise
  await supabase.from('buying_signals').insert({
    company_id: companyId,
    signal_type: 'FIT_ANALYSIS',
    description: `Fit Score: ${globalFitScore} - ${classification}`,
    confidence_score: closingProbability,
    raw_data: {
      fits,
      globalFitScore,
      classification,
      closingProbability,
      recommendations,
      competition
    }
  });
  
  return new Response(JSON.stringify({
    fits,
    globalFitScore,
    classification,
    closingProbability,
    recommendations,
    competition
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 4. Detect Buying Signals
```typescript
// supabase/functions/detect-buying-signals/index.ts (NOVA)
serve(async (req) => {
  const { companyId } = await req.json();
  
  const company = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  
  // 1. Sinais de Contratação (Apollo.io)
  const hiringSignals = await detectHiringSignals(company.name, company.domain);
  
  // 2. Sinais Tecnológicos (BuiltWith)
  const techSignals = await detectTechSignals(company.domain);
  
  // 3. Sinais de Liderança (LinkedIn)
  const leadershipSignals = await detectLeadershipChanges(company.linkedin_url);
  
  // 4. Sinais de Mercado (Google News)
  const marketSignals = await detectMarketSignals(company.name);
  
  // 5. Calcular Score de Prontidão
  const readinessScore = calculateReadinessScore({
    hiring: hiringSignals,
    tech: techSignals,
    leadership: leadershipSignals,
    market: marketSignals
  });
  
  // 6. Classificação
  const classification = classifyReadiness(readinessScore);
  
  // 7. Janela de Oportunidade
  const opportunityWindow = calculateOpportunityWindow(readinessScore);
  
  // 8. Salvar sinais
  const signals = [
    ...hiringSignals,
    ...techSignals,
    ...leadershipSignals,
    ...marketSignals
  ];
  
  await Promise.all(signals.map(signal => 
    supabase.from('buying_signals').insert({
      company_id: companyId,
      signal_type: signal.type,
      description: signal.description,
      confidence_score: signal.confidence,
      detected_at: signal.detectedAt,
      raw_data: signal.data
    })
  ));
  
  return new Response(JSON.stringify({
    readinessScore,
    classification,
    opportunityWindow,
    signals
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 5. Generate PDF Report
```typescript
// supabase/functions/generate-pdf-report/index.ts
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

serve(async (req) => {
  const { reportType, companyId, template } = await req.json();
  
  // 1. Buscar dados do relatório
  let reportData;
  switch (reportType) {
    case 'company':
      reportData = await generateCompanyReportData(companyId);
      break;
    case 'maturity':
      reportData = await generateMaturityReportData(companyId);
      break;
    case 'fit':
      reportData = await generateFitReportData(companyId);
      break;
  }
  
  // 2. Renderizar HTML
  const html = renderReportHTML(reportData, template);
  
  // 3. Gerar PDF com Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm'
    }
  });
  await browser.close();
  
  // 4. Upload para Storage (opcional)
  const fileName = `${reportType}-${companyId}-${Date.now()}.pdf`;
  await supabase.storage
    .from('reports')
    .upload(fileName, pdf, {
      contentType: 'application/pdf'
    });
  
  // 5. Retornar base64 para download imediato
  const base64 = btoa(String.fromCharCode(...new Uint8Array(pdf)));
  
  return new Response(JSON.stringify({
    success: true,
    fileName,
    pdfBase64: base64
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## 📊 CÁLCULO DE SCORES (Biblioteca Compartilhada)

```typescript
// src/lib/analytics/scoring.ts

/**
 * Calcula score de infraestrutura digital (0-10)
 */
export function calculateInfrastructureScore(
  company: Company,
  techStack: TechStack[]
): number {
  let score = 0;
  
  // Cloud adoption (0-3 pontos)
  const cloudProviders = ['AWS', 'Azure', 'GCP'];
  const hasCloud = techStack.some(t => 
    cloudProviders.some(p => t.technology.includes(p))
  );
  if (hasCloud) score += 3;
  
  // CDN (0-2 pontos)
  const hasCDN = techStack.some(t => t.category === 'CDN');
  if (hasCDN) score += 2;
  
  // SSL (0-2 pontos)
  if (company.website?.startsWith('https://')) score += 2;
  
  // Containerization (0-3 pontos)
  const hasContainers = techStack.some(t => 
    ['Docker', 'Kubernetes'].some(p => t.technology.includes(p))
  );
  if (hasContainers) score += 3;
  
  return Math.min(score, 10);
}

/**
 * Calcula score de sistemas corporativos (0-10)
 */
export function calculateSystemsScore(
  company: Company,
  techStack: TechStack[]
): number {
  let score = 0;
  
  // ERP (0-4 pontos)
  const erpProviders = ['TOTVS', 'SAP', 'Oracle', 'Senior'];
  const hasERP = techStack.some(t => 
    erpProviders.some(p => t.technology.includes(p))
  );
  if (hasERP) score += 4;
  
  // CRM (0-3 pontos)
  const crmProviders = ['Salesforce', 'HubSpot', 'RD Station'];
  const hasCRM = techStack.some(t => 
    crmProviders.some(p => t.technology.includes(p))
  );
  if (hasCRM) score += 3;
  
  // BI/Analytics (0-3 pontos)
  const biTools = ['Power BI', 'Tableau', 'Qlik'];
  const hasBI = techStack.some(t => 
    biTools.some(p => t.technology.includes(p))
  );
  if (hasBI) score += 3;
  
  return Math.min(score, 10);
}

/**
 * Calcula score de processos digitais (0-10)
 */
export function calculateProcessesScore(company: Company): number {
  let score = 5; // Baseline
  
  // Análise de presença digital indica nível de automação
  if (company.digital_maturity_score) {
    score = company.digital_maturity_score * 0.7; // Conversão de 0-100 para 0-10
  }
  
  return Math.min(score, 10);
}

/**
 * Calcula score de segurança (0-10)
 */
export function calculateSecurityScore(
  company: Company,
  techStack: TechStack[]
): number {
  let score = 0;
  
  // HTTPS (0-2 pontos)
  if (company.website?.startsWith('https://')) score += 2;
  
  // Security headers (0-3 pontos)
  const securityHeaders = techStack.filter(t => t.category === 'Security');
  score += Math.min(securityHeaders.length, 3);
  
  // WAF (0-2 pontos)
  const hasWAF = techStack.some(t => 
    ['Cloudflare', 'AWS WAF', 'Akamai'].some(p => t.technology.includes(p))
  );
  if (hasWAF) score += 2;
  
  // Certificações (0-3 pontos)
  // TODO: Detectar certificações nas notícias/website
  
  return Math.min(score, 10);
}

/**
 * Calcula score de inovação (0-10)
 */
export function calculateInnovationScore(
  company: Company,
  techStack: TechStack[]
): number {
  let score = 0;
  
  // Tecnologias emergentes
  const emergingTech = ['AI', 'ML', 'IoT', 'Blockchain', 'API'];
  const hasEmerging = techStack.filter(t => 
    emergingTech.some(p => t.technology.includes(p))
  ).length;
  
  score += Math.min(hasEmerging * 2, 6);
  
  // Stack moderno
  const modernTech = ['React', 'Vue', 'Angular', 'Node.js', 'Python'];
  const hasModern = techStack.some(t => 
    modernTech.some(p => t.technology.includes(p))
  );
  if (hasModern) score += 4;
  
  return Math.min(score, 10);
}

/**
 * Calcula probabilidade de fechamento (0-100%)
 */
export function calculateClosingProbability(
  fitScore: number,
  decisorsCount: number,
  maturityScore: number
): number {
  const fitWeight = 0.50;
  const decisorsWeight = 0.30;
  const maturityWeight = 0.20;
  
  // Normalizar decisores (cap em 5)
  const decisorsNormalized = Math.min(decisorsCount / 5, 1) * 100;
  
  const probability = 
    (fitScore * fitWeight) +
    (decisorsNormalized * decisorsWeight) +
    (maturityScore * maturityWeight);
  
  return Math.round(probability);
}
```

---

## 🧠 GERAÇÃO DE INSIGHTS COM IA

```typescript
// src/lib/analytics/insights.ts

export async function generateCompanyInsights(
  company: Company,
  metrics: CompanyMetrics
): Promise<CompanyInsights> {
  const LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY;
  
  const prompt = `
Analise os seguintes dados da empresa e gere insights executivos:

**Empresa**: ${company.name}
**Setor**: ${company.industry}
**Porte**: ${metrics.porte}
**Receita Anual**: R$ ${company.revenue}
**Funcionários**: ${company.employees}
**Maturidade Digital**: ${metrics.digital_maturity_score}/100
**Decisores Identificados**: ${metrics.decisors_count}

Gere uma análise executiva em formato JSON com:
{
  "resumo_executivo": "string (200 palavras)",
  "pontos_fortes": ["string", "string", ...] (top 5),
  "pontos_atencao": ["string", ...] (top 5),
  "oportunidades": ["string", ...] (top 5),
  "riscos": ["string", ...] (top 5),
  "recomendacoes": {
    "melhor_canal": "EMAIL | LINKEDIN | TELEFONE | PRESENCIAL",
    "angulo_venda": "string",
    "objecoes_previstas": ["string", ...],
    "contra_argumentos": ["string", ...]
  },
  "proximos_passos": [
    {
      "acao": "string",
      "responsavel": "SDR | Consultor | Vendedor",
      "prazo_dias": number,
      "prioridade": 1-5
    }
  ]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

---

*Documento continua com especificações de UI, testes, deploy e exemplos de código completos...*

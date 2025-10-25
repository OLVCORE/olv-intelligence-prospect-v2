import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) throw companyError;

    // 2. Calcular scores por dimensão
    const scores = {
      infrastructure: calculateInfrastructureScore(company),
      systems: calculateSystemsScore(company),
      processes: calculateProcessesScore(company),
      security: calculateSecurityScore(company),
      innovation: calculateInnovationScore(company)
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

    // 5. Gaps identificados
    const gaps = identifyGaps(scores, company);

    // 6. Roadmap de evolução
    const roadmap = generateMaturityRoadmap(gaps, scores);

    // 7. Salvar no banco + ATUALIZAR digital_maturity_score na companies
    const { error: upsertError } = await supabase
      .from('digital_maturity')
      .upsert({
        company_id: companyId,
        overall_score: Math.round(overallScore),
        infrastructure_score: Math.round(scores.infrastructure),
        systems_score: Math.round(scores.systems),
        processes_score: Math.round(scores.processes),
        security_score: Math.round(scores.security),
        innovation_score: Math.round(scores.innovation),
        analysis_data: { scores, gaps, roadmap, classification }
      });

    if (upsertError) throw upsertError;

    // CRÍTICO: Atualizar o campo digital_maturity_score na tabela companies
    await supabase
      .from('companies')
      .update({ digital_maturity_score: Math.round(overallScore) })
      .eq('id', companyId);

    return new Response(JSON.stringify({
      overallScore: Math.round(overallScore),
      classification,
      scores: {
        infrastructure: Math.round(scores.infrastructure),
        systems: Math.round(scores.systems),
        processes: Math.round(scores.processes),
        security: Math.round(scores.security),
        innovation: Math.round(scores.innovation)
      },
      gaps,
      roadmap
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[calculate-maturity-score] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calculateInfrastructureScore(company: any): number {
  let score = 0;
  
  // Website com HTTPS (20 pontos)
  if (company.website?.startsWith('https://')) {
    score += 20;
  } else if (company.website) {
    score += 10;
  }
  
  // Presença de domínio próprio (20 pontos)
  if (company.domain) {
    score += 20;
  }
  
  // Tecnologias detectadas (30 pontos)
  const techs = company.technologies || [];
  if (techs.length > 0) {
    score += Math.min(30, techs.length * 5);
  }
  
  // Cloud adoption (30 pontos)
  const cloudProviders = ['AWS', 'Azure', 'GCP', 'Cloud'];
  const hasCloud = techs.some((t: string) => 
    cloudProviders.some(p => t.includes(p))
  );
  if (hasCloud) score += 30;
  
  return Math.min(100, score);
}

function calculateSystemsScore(company: any): number {
  let score = 0;
  
  // Base: empresa com dados estruturados
  score += 20;
  
  // Tem website estruturado
  if (company.website) score += 20;
  
  // Setor definido (indica organização)
  if (company.industry) score += 20;
  
  // Tecnologias corporativas
  const techs = company.technologies || [];
  const hasCorporateSystems = techs.some((t: string) => 
    ['ERP', 'CRM', 'SAP', 'Oracle', 'TOTVS', 'Salesforce'].some(s => t.includes(s))
  );
  if (hasCorporateSystems) score += 40;
  
  return Math.min(100, score);
}

function calculateProcessesScore(company: any): number {
  let score = 40; // Base score para empresas estruturadas
  
  // LinkedIn indica processos de RH estruturados
  if (company.linkedin_url) score += 20;
  
  // Quantidade de funcionários indica processos
  const employees = company.employees || 0;
  if (employees > 500) score += 40;
  else if (employees > 200) score += 30;
  else if (employees > 50) score += 20;
  else if (employees > 10) score += 10;
  
  return Math.min(100, score);
}

function calculateSecurityScore(company: any): number {
  let score = 0;
  
  // HTTPS básico (40 pontos)
  if (company.website?.startsWith('https://')) {
    score += 40;
  }
  
  // Domínio corporativo (20 pontos)
  if (company.domain && !company.domain.includes('gmail') && !company.domain.includes('hotmail')) {
    score += 20;
  }
  
  // Tecnologias de segurança (40 pontos)
  const techs = company.technologies || [];
  const hasSecurityTech = techs.some((t: string) => 
    ['SSL', 'Cloudflare', 'Security', 'WAF', 'Firewall'].some(s => t.includes(s))
  );
  if (hasSecurityTech) score += 40;
  
  return Math.min(100, score);
}

function calculateInnovationScore(company: any): number {
  let score = 0;
  
  // Presença digital moderna (30 pontos)
  if (company.website) score += 30;
  
  // Tecnologias modernas (40 pontos)
  const techs = company.technologies || [];
  const modernTechs = ['React', 'Vue', 'Angular', 'Node', 'Python', 'AI', 'ML', 'API'];
  const hasModernTech = techs.some((t: string) => 
    modernTechs.some(m => t.includes(m))
  );
  if (hasModernTech) score += 40;
  
  // LinkedIn ativo (30 pontos)
  if (company.linkedin_url) score += 30;
  
  return Math.min(100, score);
}

function classifyMaturity(score: number): string {
  if (score >= 80) return 'AVANÇADA';
  if (score >= 60) return 'INTERMEDIÁRIA';
  if (score >= 40) return 'BÁSICA';
  return 'INICIAL';
}

function identifyGaps(scores: any, company: any) {
  const gaps = [];
  
  if (scores.infrastructure < 60) {
    gaps.push({
      area: 'Infraestrutura Digital',
      criticidade: 'ALTA',
      descricao: 'Infraestrutura digital básica precisa de modernização',
      impacto: 'Limitações de escalabilidade e performance',
      solucao: 'Migração para cloud computing e CDN'
    });
  }
  
  if (scores.systems < 60) {
    gaps.push({
      area: 'Sistemas Corporativos',
      criticidade: 'ALTA',
      descricao: 'Falta de sistemas integrados de gestão',
      impacto: 'Processos manuais e baixa eficiência operacional',
      solucao: 'Implementação de ERP e CRM integrados'
    });
  }
  
  if (scores.processes < 60) {
    gaps.push({
      area: 'Processos Digitais',
      criticidade: 'MÉDIA',
      descricao: 'Processos pouco automatizados',
      impacto: 'Alto custo operacional e retrabalho',
      solucao: 'Automação de workflows e digitalização'
    });
  }
  
  if (scores.security < 60) {
    gaps.push({
      area: 'Segurança da Informação',
      criticidade: 'CRÍTICA',
      descricao: 'Medidas de segurança insuficientes',
      impacto: 'Risco de vazamento de dados e ataques',
      solucao: 'Implementação de políticas de segurança e proteção'
    });
  }
  
  if (scores.innovation < 60) {
    gaps.push({
      area: 'Inovação e Tecnologia',
      criticidade: 'MÉDIA',
      descricao: 'Baixa adoção de tecnologias modernas',
      impacto: 'Perda de competitividade no mercado',
      solucao: 'Investimento em P&D e novas tecnologias'
    });
  }
  
  return gaps;
}

function generateMaturityRoadmap(gaps: any[], scores: any) {
  const phases = [];
  
  // Fase 1: Crítico (0-3 meses)
  const criticalGaps = gaps.filter(g => g.criticidade === 'CRÍTICA');
  if (criticalGaps.length > 0) {
    phases.push({
      fase: 1,
      nome: 'Estabilização Crítica',
      prazo: '0-3 meses',
      prioridade: 'CRÍTICA',
      acoes: criticalGaps.map(g => g.solucao)
    });
  }
  
  // Fase 2: Alta prioridade (3-6 meses)
  const highGaps = gaps.filter(g => g.criticidade === 'ALTA');
  if (highGaps.length > 0) {
    phases.push({
      fase: 2,
      nome: 'Modernização Essencial',
      prazo: '3-6 meses',
      prioridade: 'ALTA',
      acoes: highGaps.map(g => g.solucao)
    });
  }
  
  // Fase 3: Otimização (6-12 meses)
  const mediumGaps = gaps.filter(g => g.criticidade === 'MÉDIA');
  if (mediumGaps.length > 0) {
    phases.push({
      fase: 3,
      nome: 'Otimização e Inovação',
      prazo: '6-12 meses',
      prioridade: 'MÉDIA',
      acoes: mediumGaps.map(g => g.solucao)
    });
  }
  
  return phases;
}

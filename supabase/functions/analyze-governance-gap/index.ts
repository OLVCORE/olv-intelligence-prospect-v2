import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';
import { totvsAnalysisSchema } from '../_shared/validation.ts';
import { createErrorResponse } from '../_shared/errors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validated = totvsAnalysisSchema.parse(body);
    const { companyId } = validated;
    console.log('[Governance Gap] Analisando empresa:', companyId);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar dados da empresa
    const { data: company } = await supabase
      .from('companies')
      .select(`
        *,
        digital_maturity (*)
      `)
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Empresa não encontrada');
    }

    const maturity = company.digital_maturity?.[0];
    const technologies = company.technologies || [];
    const industry = company.industry || 'Não especificado';
    const employees = company.employees || 0;

    // 🔥 NOVO PROMPT: Foco em GAPS de Governança, não FIT de produtos
    const systemPrompt = `Você é um consultor especialista em transformação organizacional e governança para PMEs brasileiras.

**SUA MISSÃO:** Identificar GAPS CRÍTICOS de governança, processos e estrutura organizacional que impedem o crescimento da empresa.

**CATEGORIAS DE GAPS:**

**1. PROCESSOS (Falta de padronização)**
- Processos manuais e não documentados
- Retrabalho constante por falta de procedimentos
- Ausência de workflows estruturados
- Dependência de pessoas-chave

**2. TECNOLOGIA (Infraestrutura deficiente)**
- Sistemas legados desconectados
- Planilhas Excel como sistema principal
- Ausência de integração entre áreas
- Dados dispersos sem centralização

**3. GOVERNANÇA (Falta de controle)**
- Decisões sem dados (feeling)
- Ausência de KPIs e métricas
- Não há visibilidade do negócio
- Gestão 100% reativa

**4. COMPLIANCE (Riscos regulatórios)**
- Ausência de controles internos
- Não conformidade com LGPD
- Riscos trabalhistas e fiscais
- Documentação inadequada

**5. SEGURANÇA (Exposição a riscos)**
- Dados sem backup
- Acessos não controlados
- Ausência de políticas de segurança
- Vulnerabilidade a ataques

**6. PESSOAS (Capital humano desorganizado)**
- RH manual e burocrático
- Turnover alto por falta de estrutura
- Treinamentos inexistentes
- Clima organizacional ruim

**IMPORTANTE:** 
- Empresas PME de capital fechado SÃO SUAS! Elas PRECISAM de transformação.
- Quanto MENORES os scores, MAIOR o potencial de consultoria.
- O objetivo NÃO é vender produtos, mas TRANSFORMAR a empresa.
- Produtos TOTVS são SOLUÇÕES para os gaps, não o foco principal.`;

    const userPrompt = `Analise esta PME e identifique os GAPS CRÍTICOS de governança:

**EMPRESA:** ${company.name}
**INDÚSTRIA:** ${industry}
**FUNCIONÁRIOS:** ${employees}
**TECNOLOGIAS DETECTADAS:** ${technologies.length > 0 ? technologies.join(', ') : 'NENHUMA (❗ GAP CRÍTICO)'}

**SCORES DE MATURIDADE DIGITAL:**
- Score Geral: ${maturity?.overall_score || 0}/10
- Infraestrutura: ${maturity?.infrastructure_score || 0}/10
- Sistemas: ${maturity?.systems_score || 0}/10
- Processos: ${maturity?.processes_score || 0}/10
- Segurança: ${maturity?.security_score || 0}/10
- Inovação: ${maturity?.innovation_score || 0}/10

**INSTRUÇÕES:**
1. Analise os scores e identifique os 5-7 GAPS mais críticos
2. Para cada GAP, explique:
   - Qual o problema real (sintoma)
   - Qual o impacto no negócio (dor)
   - Qual a solução de transformação (remédio)
3. Calcule um GOVERNANCE GAP SCORE (0-100):
   - 0-30: Empresa estruturada, baixo potencial de consultoria
   - 31-60: Gaps moderados, médio potencial
   - 61-100: GAPS CRÍTICOS, alto potencial de transformação
4. Defina PRIORIDADE de intervenção: CRITICO, ALTO, MEDIO, BAIXO
5. Defina NÍVEL DE MATURIDADE: INICIAL, ESTRUTURANDO, GERENCIADO, OTIMIZADO, INOVADOR
6. Recomende 2-3 soluções TOTVS como ferramentas para resolver os gaps

Retorne APENAS um JSON válido com esta estrutura:
{
  "governanceGapScore": 85,
  "transformationPriority": "CRITICO",
  "organizationalMaturityLevel": "INICIAL",
  "requiresConsulting": true,
  "gaps": [
    {
      "category": "PROCESSOS",
      "title": "Processos Manuais Críticos",
      "problem": "Toda gestão feita em planilhas Excel desconectadas",
      "impact": "Retrabalho de 60% + erros frequentes + decisões lentas",
      "solution": "Implementar ERP para integrar e automatizar processos"
    }
  ],
  "totvsRecommendations": [
    {
      "product": "TOTVS Protheus",
      "category": "BÁSICO",
      "priority": "ALTA",
      "reason": "Ferramenta para estruturar processos básicos de gestão",
      "implementation": "Curto prazo (3-6 meses)"
    }
  ],
  "transformationStrategy": {
    "immediate": ["Diagnóstico completo de processos", "Mapeamento de sistemas atuais"],
    "shortTerm": ["Implementar ERP básico", "Estruturar governança"],
    "mediumTerm": ["Adicionar BI e analytics", "Automatizar processos-chave"],
    "longTerm": ["Transformação digital completa", "Cultura data-driven"]
  },
  "consultingPitch": "Empresa opera de forma manual e reativa. Transformação organizacional pode aumentar eficiência em 40% e reduzir custos operacionais em 30%. ROI estimado em 12-18 meses.",
  "summary": "PME com GAPS CRÍTICOS de governança. Alto potencial para consultoria de transformação organizacional."
}`;

    console.log('[Governance Gap] Chamando IA...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Governance Gap] Erro AI:', errorText);
      throw new Error(`Erro ao chamar IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    console.log('[Governance Gap] Resposta IA recebida');

    // Extrair JSON da resposta
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (e) {
      console.error('[Governance Gap] Erro ao parsear JSON:', e);
      console.log('[Governance Gap] Resposta completa:', analysisText);
      throw new Error('Erro ao processar análise da IA');
    }

    // Preparar dados para inserção (sanitiza categorias para passar no CHECK constraint)
    const rawCategory = (analysis.gaps?.[0]?.category || '').toString();

    function normalize(str: string) {
      return str
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '') // remove acentos
        .toUpperCase()
        .trim();
    }

    const allowedCategories = new Set([
      'PROCESSOS',
      'TECNOLOGIA',
      'PESSOAS',
      'GOVERNANCA',
      'COMPLIANCE',
      'SEGURANCA'
    ]);

    function mapGapCategory(input: string): string | null {
      const n = normalize(input);
      // alguns aliases comuns
      const aliasMap: Record<string, string> = {
        'GOVERNANCA': 'GOVERNANCA',
        'GOVERNANCA CORPORATIVA': 'GOVERNANCA',
        'GOVERNANCA E CONTROLE': 'GOVERNANCA',
        'SEGURANCA DA INFORMACAO': 'SEGURANCA',
        'SEGURANCA': 'SEGURANCA',
        'PROCESSO': 'PROCESSOS',
        'PROCESSOS': 'PROCESSOS',
        'TECNOLOGIA': 'TECNOLOGIA',
        'PESSOAS': 'PESSOAS',
        'COMPLIANCE': 'COMPLIANCE',
      };
      const mapped = aliasMap[n] || n;
      return allowedCategories.has(mapped) ? mapped : 'PROCESSOS';
    }

    const sanitizedCategory = mapGapCategory(rawCategory);

    const insertData = {
      company_id: companyId,
      signal_type: 'governance_gap_analysis',
      description: analysis.summary || 'Análise de gaps de governança',
      confidence_score: analysis.governanceGapScore || 0,
      source: 'ai_analysis',
      raw_data: analysis,
      governance_gap_score: analysis.governanceGapScore || 0,
      transformation_priority: (analysis.transformationPriority || 'MEDIO').toString().toUpperCase(),
      organizational_maturity_level: (analysis.organizationalMaturityLevel || 'ESTRUTURANDO').toString().toUpperCase(),
      requires_consulting: analysis.requiresConsulting !== false,
      gap_category: sanitizedCategory
    };

    console.log('[Governance Gap] Inserindo dados:', JSON.stringify(insertData, null, 2));

    // Salvar análise no banco
    const { data: savedAnalysis, error: insertError } = await supabase
      .from('governance_signals')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[Governance Gap] ❌ Erro ao inserir no banco:', insertError);
      throw new Error(`Falha ao salvar análise: ${insertError.message}`);
    }

    if (!savedAnalysis) {
      console.error('[Governance Gap] ❌ Nenhum dado retornado após inserção');
      throw new Error('Falha ao salvar análise no banco de dados');
    }

    console.log('[Governance Gap] ✅ Análise salva com sucesso. ID:', savedAnalysis.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        savedId: savedAnalysis?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('[Governance Gap] Validation error:', error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Dados inválidos',
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return createErrorResponse(error, corsHeaders, 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CNPJMatch {
  cnpj: string;
  confidence: number;
  source: string;
  validation: {
    name_match: number;
    domain_match: number;
    location_match: number;
  };
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, domain, location } = await req.json();
    
    if (!companyName) {
      return new Response(
        JSON.stringify({ error: 'companyName é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[CNPJ Discovery] 🔍 Buscando CNPJ para:', companyName);

    // Timeout global de 15 segundos
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: operação excedeu 15 segundos')), 15000)
    );

    const searchPromise = (async () => {
      const candidates: CNPJMatch[] = [];

    // ============================================
    // MÉTODO 1: Busca via EmpresaQui (melhor match)
    // ============================================
    try {
      const EMPRESAQUI_API_KEY = Deno.env.get('EMPRESAQUI_API_KEY');
      
      if (EMPRESAQUI_API_KEY) {
        console.log('[CNPJ Discovery] 📊 Tentando EmpresaQui...');
        
        const params = new URLSearchParams({
          razao_social: companyName,
          limit: '5'
        });

        if (location?.city) {
          params.append('cidade', location.city);
        }

        const response = await fetch(`https://api.empresaqui.com.br/v1/empresas/busca?${params}`, {
          headers: {
            'Authorization': `Bearer ${EMPRESAQUI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const empresas = data.empresas || [];
          
          for (const empresa of empresas) {
            const match = calculateMatch(companyName, domain, location, empresa);
            
            if (match.confidence >= 60) {
              candidates.push({
                cnpj: empresa.cnpj,
                confidence: match.confidence,
                source: 'empresaqui',
                validation: match.scores,
                data: empresa
              });
              console.log('[CNPJ Discovery] ✅ EmpresaQui encontrou:', empresa.cnpj, `(${match.confidence}%)`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[CNPJ Discovery] ⚠️ Erro EmpresaQui:', error);
    }

    // Saída antecipada se já houver candidato forte (>=85)
    {
      const uniqueCandidatesEarly = Array.from(new Map(candidates.map(c => [c.cnpj, c])).values()).sort((a, b) => b.confidence - a.confidence);
      const bestEarly = uniqueCandidatesEarly[0];
      if (bestEarly && bestEarly.confidence >= 85) {
        if (companyId && bestEarly.confidence >= 80) {
          const { error } = await supabase
            .from('companies')
            .update({ cnpj: bestEarly.cnpj, cnpj_status: 'validado', updated_at: new Date().toISOString() })
            .eq('id', companyId);
          if (error) console.error('[CNPJ Discovery] ❌ Erro ao salvar CNPJ (early):', error);
        }
        return {
          success: true,
          auto_applied: !!companyId && bestEarly.confidence >= 80,
          cnpj: bestEarly.cnpj,
          confidence: bestEarly.confidence,
          source: bestEarly.source,
          candidates: uniqueCandidatesEarly,
          company_id: companyId
        };
      }
    }
    try {
      console.log('[CNPJ Discovery] 📋 Tentando ReceitaWS...');
      
      const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
      
      if (SERPER_API_KEY) {
        const searchQuery = `${companyName} CNPJ site:gov.br OR site:receita.fazenda.gov.br`;
        
        const searchResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: searchQuery,
            num: 3,
            gl: 'br',
            hl: 'pt-br'
          })
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const results = searchData.organic || [];
          
          const cnpjPattern = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
          const foundCNPJs = new Set<string>();
          
          // Extrair CNPJs únicos dos resultados (máximo 3)
          for (const result of results) {
            const text = `${result.title} ${result.snippet}`;
            const matches = text.match(cnpjPattern);
            
            if (matches) {
              for (const cnpjRaw of matches) {
                const cnpj = cnpjRaw.replace(/\D/g, '');
                foundCNPJs.add(cnpj);
                if (foundCNPJs.size >= 3) break;
              }
            }
            if (foundCNPJs.size >= 3) break;
          }
          
          // Validar todos os CNPJs em paralelo
          if (foundCNPJs.size > 0) {
            console.log(`[CNPJ Discovery] 🔎 Validando ${foundCNPJs.size} CNPJs em paralelo...`);
            
            const validationPromises = Array.from(foundCNPJs).map(async (cnpj, index) => {
              try {
                // Delay escalonado para evitar rate limit (0ms, 250ms, 500ms...)
                await new Promise(resolve => setTimeout(resolve, index * 250));
                const validated = await validateCNPJ(cnpj, companyName, domain, location);
                if (validated) {
                  console.log('[CNPJ Discovery] ✅ Validado:', cnpj, `(${validated.confidence}%) via ${validated.source}`);
                }
                return validated;
              } catch (error) {
                console.error('[CNPJ Discovery] ⚠️ Erro ao validar CNPJ:', error);
                return null;
              }
            });
            
            const validationResults = await Promise.all(validationPromises);
            candidates.push(...validationResults.filter((r): r is CNPJMatch => r !== null));
          }
        }
      }
    } catch (error) {
      console.error('[CNPJ Discovery] ⚠️ Erro ReceitaWS:', error);
    }

    // ============================================
    // MÉTODO 3: Busca no website da empresa
    // ============================================
    if (domain) {
      try {
        console.log('[CNPJ Discovery] 🌐 Tentando extrair CNPJ do website...');
        
        const websiteResponse = await fetch(`https://${domain}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (websiteResponse.ok) {
          const html = await websiteResponse.text();
          const cnpjPattern = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
          const matches = html.match(cnpjPattern);
          
          if (matches && matches.length > 0) {
            const cnpj = matches[0].replace(/\D/g, '');
            
            // Validar
            const validated = await validateCNPJ(cnpj, companyName, domain, location);
            if (validated && validated.confidence >= 70) {
              candidates.push(validated);
              console.log('[CNPJ Discovery] ✅ Website revelou:', cnpj, `(${validated.confidence}%) via ${validated.source}`);
            }
          }
        }
      } catch (error) {
        console.error('[CNPJ Discovery] ⚠️ Erro ao buscar no website:', error);
      }
    }

      // ============================================
      // PROCESSAR RESULTADOS
      // ============================================
      
      // Remover duplicatas (mesmo CNPJ de fontes diferentes)
      const uniqueCandidates = Array.from(
        new Map(candidates.map(c => [c.cnpj, c])).values()
      ).sort((a, b) => b.confidence - a.confidence);

      if (uniqueCandidates.length === 0) {
        console.log('[CNPJ Discovery] ❌ Nenhum CNPJ encontrado');
        
        return {
          success: false,
          message: 'Nenhum CNPJ encontrado para esta empresa',
          company_id: companyId
        };
      }

      // Pegar o melhor match
      const bestMatch = uniqueCandidates[0];

      // Se confiança >= 80% E tem companyId, aplicar automaticamente
      if (bestMatch.confidence >= 80 && companyId) {
        const { error } = await supabase
          .from('companies')
          .update({ 
            cnpj: bestMatch.cnpj,
            cnpj_status: 'validado',
            updated_at: new Date().toISOString()
          })
          .eq('id', companyId);

        if (error) {
          console.error('[CNPJ Discovery] ❌ Erro ao salvar CNPJ:', error);
        } else {
          console.log('[CNPJ Discovery] ✅ CNPJ aplicado automaticamente:', bestMatch.cnpj);
        }
        
        return {
          success: true,
          auto_applied: true,
          cnpj: bestMatch.cnpj,
          confidence: bestMatch.confidence,
          source: bestMatch.source,
          candidates: uniqueCandidates
        };
      }

      // Se confiança < 80%, retornar candidatos para revisão manual
      console.log('[CNPJ Discovery] 🤔 Match médio. Requer revisão:', bestMatch.cnpj, `(${bestMatch.confidence}%)`);
      
      return {
        success: true,
        auto_applied: false,
        requires_review: true,
        best_match: bestMatch,
        candidates: uniqueCandidates,
        company_id: companyId
      };
    })();

    // Executar com timeout
    const result = await Promise.race([searchPromise, timeoutPromise]);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CNPJ Discovery] ❌ Erro:', error);
    
    // Se foi timeout, retornar mensagem específica
    if (error.message?.includes('Timeout')) {
      return new Response(
        JSON.stringify({ 
          error: 'A busca está demorando muito. Tente novamente ou refine os dados da empresa.',
          timeout: true
        }),
        { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Utilitário: fetch com timeout via AbortController
 */
async function fetchWithTimeout(input: string, init: RequestInit = {}, ms = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Valida um CNPJ usando múltiplas fontes em corrida (ReceitaWS e BrasilAPI)
 */
async function validateCNPJ(
  cnpj: string,
  companyName: string,
  domain?: string,
  location?: any
): Promise<CNPJMatch | null> {
  try {
    // ReceitaWS
    const receitaPromise = (async () => {
      const r = await fetchWithTimeout(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {}, 5000);
      if (!r.ok) throw new Error('receitaws not ok');
      const receitaData = await r.json();
      if (receitaData.status === 'ERROR') throw new Error('receitaws error status');
      const match = calculateMatch(companyName, domain, location, {
        razao_social: receitaData.nome,
        nome_fantasia: receitaData.fantasia,
        website: domain,
        municipio: receitaData.municipio,
        uf: receitaData.uf
      });
      return { source: 'receitaws', data: receitaData, match } as const;
    })();

    // BrasilAPI
    const brasilPromise = (async () => {
      const r = await fetchWithTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {}, 5000);
      if (!r.ok) throw new Error('brasilapi not ok');
      const b = await r.json();
      // Mapear campos aproximados
      const razao = b.razao_social || b.nome_fantasia || b.nome || '';
      const municipio = b.municipio || b.municipio_fiscal || b.descricao_municipio || '';
      const uf = b.uf || b.uf_fiscal || b.estado || '';
      const match = calculateMatch(companyName, domain, location, {
        razao_social: razao,
        nome_fantasia: b.nome_fantasia,
        website: domain,
        municipio,
        uf
      });
      return { source: 'brasilapi', data: b, match } as const;
    })();

    // Pega o que responder primeiro com bom match
    const results = await Promise.any([receitaPromise, brasilPromise]);
    if (results.match.confidence >= 50) {
      return {
        cnpj,
        confidence: results.match.confidence,
        source: results.source,
        validation: results.match.scores,
        data: results.data
      };
    }
  } catch (_e) {
    // Ignorar erros individuais
  }
  return null;
}

/**
 * Calcula score de match entre dados da empresa e candidato
 */
function calculateMatch(
  companyName: string,
  domain: string | undefined,
  location: any,
  candidate: any
): { confidence: number; scores: any } {
  let totalScore = 0;
  let maxScore = 0;

  // 1. Match de nome (40 pontos)
  maxScore += 40;
  const nameScore = calculateNameSimilarity(
    companyName.toLowerCase(),
    (candidate.razao_social || candidate.nome_fantasia || '').toLowerCase()
  );
  totalScore += nameScore * 40;

  // 2. Match de domínio (30 pontos)
  if (domain && candidate.website) {
    maxScore += 30;
    const domainMatch = domain.toLowerCase().includes(candidate.website.toLowerCase()) ||
                       candidate.website.toLowerCase().includes(domain.toLowerCase());
    if (domainMatch) totalScore += 30;
  }

  // 3. Match de localização (30 pontos)
  if (location?.city && candidate.municipio) {
    maxScore += 30;
    const cityMatch = location.city.toLowerCase() === candidate.municipio.toLowerCase();
    if (cityMatch) totalScore += 30;
  }

  const confidence = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    confidence,
    scores: {
      name_match: Math.round(nameScore * 100),
      domain_match: domain && candidate.website ? 
        (domain.toLowerCase().includes(candidate.website.toLowerCase()) ? 100 : 0) : 0,
      location_match: location?.city && candidate.municipio ?
        (location.city.toLowerCase() === candidate.municipio.toLowerCase() ? 100 : 0) : 0
    }
  };
}

/**
 * Calcula similaridade entre strings (Levenshtein simplificado)
 */
function calculateNameSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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

  return matrix[str2.length][str1.length];
}

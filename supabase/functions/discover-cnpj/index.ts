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
      // BUSCA PARALELA EM TODAS AS FONTES
      // ============================================
      console.log('[CNPJ Discovery] 🚀 Iniciando busca paralela em todas as fontes...');

      const [empresaQuiResults, receitaResults, websiteResults] = await Promise.allSettled([
        // FONTE 1: EmpresaQui (com retry)
        (async () => {
          try {
            const EMPRESAQUI_API_KEY = Deno.env.get('EMPRESAQUI_API_KEY');
            if (!EMPRESAQUI_API_KEY) {
              console.log('[CNPJ Discovery] ⚠️ EmpresaQui: API key não configurada');
              return [];
            }
            
            console.log('[CNPJ Discovery] 📊 Tentando EmpresaQui...');
            const empresas = await searchEmpresaQui(EMPRESAQUI_API_KEY, companyName, location);
            
            const results: CNPJMatch[] = [];
            for (const empresa of empresas) {
              const match = calculateMatch(companyName, domain, location, empresa, 'empresaqui');
              
              if (match.confidence >= 40) {
                results.push({
                  cnpj: empresa.cnpj,
                  confidence: match.confidence,
                  source: 'empresaqui',
                  validation: match.scores,
                  data: empresa
                });
                console.log('[CNPJ Discovery] ✅ EmpresaQui encontrou:', empresa.cnpj, `(${match.confidence}%)`);
              }
            }
            return results;
          } catch (error) {
            console.error('[CNPJ Discovery] ⚠️ Erro EmpresaQui:', error);
            return [];
          }
        })(),
        
        // FONTE 2: ReceitaWS/Google (sempre em paralelo)
        (async () => {
          try {
            const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
            if (!SERPER_API_KEY) {
              console.log('[CNPJ Discovery] ⚠️ ReceitaWS: Serper API key não configurada');
              return [];
            }
            
            console.log('[CNPJ Discovery] 📋 Tentando ReceitaWS...');
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

            if (!searchResponse.ok) {
              console.error('[CNPJ Discovery] ⚠️ ReceitaWS: Erro na busca Google');
              return [];
            }
            
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
            
            if (foundCNPJs.size === 0) {
              console.log('[CNPJ Discovery] ⚠️ ReceitaWS: Nenhum CNPJ encontrado no Google');

              // Tentativa extra: buscar CNPJ no domínio oficial quando informado
              if (domain) {
                try {
                  const cleanDom = String(domain)
                    .toLowerCase()
                    .replace(/^https?:\/\/(www\.)?/, '')
                    .replace(/\/.*$/, '');

                  const domainQuery = `site:${cleanDom} (CNPJ OR "cadastro nacional da pessoa juridica" OR "cnpj:")`;
                  const resp2 = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                      'X-API-KEY': SERPER_API_KEY,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ q: domainQuery, num: 5, gl: 'br', hl: 'pt-br' })
                  });

                  if (resp2.ok) {
                    const data2 = await resp2.json();
                    const results2 = data2.organic || [];
                    for (const r2 of results2) {
                      const text2 = `${r2.title} ${r2.snippet}`;
                      const m2 = text2.match(cnpjPattern);
                      if (m2) {
                        for (const raw of m2) {
                          foundCNPJs.add(raw.replace(/\D/g, ''));
                          if (foundCNPJs.size >= 3) break;
                        }
                      }
                      if (foundCNPJs.size >= 3) break;
                    }
                  }
                } catch (e) {
                  console.error('[CNPJ Discovery] ⚠️ Erro busca por domínio:', e);
                }
              }

              if (foundCNPJs.size === 0) {
                return [];
              }
            }
            
            console.log(`[CNPJ Discovery] 🔎 Validando ${foundCNPJs.size} CNPJs em paralelo...`);
            
            const validationPromises = Array.from(foundCNPJs).map(async (cnpj, index) => {
              try {
                await new Promise(resolve => setTimeout(resolve, index * 250));
                return await validateCNPJ(cnpj, companyName, domain, location);
              } catch (error) {
                console.error('[CNPJ Discovery] ⚠️ Erro ao validar CNPJ:', error);
                return null;
              }
            });
            
            const validationResults = await Promise.all(validationPromises);
            return validationResults.filter((r): r is CNPJMatch => r !== null);
          } catch (error) {
            console.error('[CNPJ Discovery] ⚠️ Erro ReceitaWS:', error);
            return [];
          }
        })(),
        
        // FONTE 3: Website scraping
        (async () => {
          if (!domain) {
            console.log('[CNPJ Discovery] ⚠️ Website: Domínio não fornecido');
            return [];
          }
          
          try {
            console.log('[CNPJ Discovery] 🌐 Tentando extrair CNPJ do website...');
            
            const websiteResponse = await fetch(`https://${domain}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (!websiteResponse.ok) {
              console.error('[CNPJ Discovery] ⚠️ Website não acessível');
              return [];
            }
            
            const html = await websiteResponse.text();
            const cnpjPattern = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
            const matches = html.match(cnpjPattern);
            
            if (!matches || matches.length === 0) {
              console.log('[CNPJ Discovery] ⚠️ Website: Nenhum CNPJ encontrado no HTML');
              return [];
            }
            
            const cnpj = matches[0].replace(/\D/g, '');
            const validated = await validateCNPJ(cnpj, companyName, domain, location);
            
            if (validated && validated.confidence >= 40) {
              console.log('[CNPJ Discovery] ✅ Website revelou:', cnpj, `(${validated.confidence}%) via ${validated.source}`);
              return [validated];
            }
            
            return [];
          } catch (error) {
            console.error('[CNPJ Discovery] ⚠️ Erro ao buscar no website:', error);
            return [];
          }
        })()
      ]);

      // Consolidar resultados de TODAS as fontes
      const allResults = [
        ...(empresaQuiResults.status === 'fulfilled' ? empresaQuiResults.value : []),
        ...(receitaResults.status === 'fulfilled' ? receitaResults.value : []),
        ...(websiteResults.status === 'fulfilled' ? websiteResults.value : [])
      ];

      candidates.push(...allResults);
      console.log(`[CNPJ Discovery] 📊 Total de candidatos encontrados: ${candidates.length}`);

      // ============================================
      // PROCESSAR RESULTADOS
      // ============================================
      
      // Remover duplicatas (mesmo CNPJ de fontes diferentes)
      const uniqueCandidates = Array.from(
        new Map(candidates.map(c => [c.cnpj, c])).values()
      ).sort((a, b) => b.confidence - a.confidence);

      // Removido tiebreaker por "brand" para evitar inversões indevidas
      // A ordenação passa a ser exclusivamente por confidence (desc)

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

      // Critérios mais rígidos de autoaplicação: exigir sinal forte (domínio/local) ou nome muito alto
      const v = (bestMatch as any).validation || { name_match: 0, domain_match: 0, location_match: 0 };
      const hasStrongSignal = (v.domain_match > 0) || (v.location_match > 0) || (v.name_match >= 92);

      // Se confiança >= 90% + forte sinal E tem companyId, aplicar automaticamente
      if (bestMatch.confidence >= 90 && hasStrongSignal && companyId) {
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

      // Caso contrário, retornar candidatos para revisão manual (evita falsos positivos como "Participações")
      console.log('[CNPJ Discovery] 🤔 Match requer revisão:', bestMatch.cnpj, `(${bestMatch.confidence}%)`, v);
      
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
 * Fetch com retry inteligente e exponential backoff
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3,
  timeoutMs = 5000
): Promise<Response | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(id);
      
      // Sucesso ou erro permanente (4xx)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Erro temporário (5xx, rate limit), tentar novamente
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[Retry] Tentativa ${attempt}/${maxRetries} após ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error: any) {
      // DNS/Network/Timeout - só retry se não for última tentativa
      if (attempt === maxRetries) {
        console.error(`[Retry] Falha após ${maxRetries} tentativas:`, error.message);
        return null;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`[Retry] Erro de rede, retry ${attempt}/${maxRetries} após ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

/**
 * Four-phase search: razao+city, razao, fantasia+city, fantasia
 */
async function searchEmpresaQui(
  apiKey: string,
  companyName: string,
  location?: any
): Promise<any[]> {
  const traceId = crypto.randomUUID().substring(0, 8);
  console.log(`[EmpresaQui:${traceId}] Iniciando busca para: ${companyName}`);
  
  const variants: Array<{ label: string; params: URLSearchParams }> = [
    {
      label: 'razao+city',
      params: new URLSearchParams({
        razao_social: companyName,
        ...(location?.city && { cidade: location.city }),
        limit: '5'
      })
    },
    {
      label: 'razao',
      params: new URLSearchParams({
        razao_social: companyName,
        limit: '5'
      })
    },
    {
      label: 'fantasia+city',
      params: new URLSearchParams({
        nome_fantasia: companyName,
        ...(location?.city && { cidade: location.city }),
        limit: '5'
      })
    },
    {
      label: 'fantasia',
      params: new URLSearchParams({
        nome_fantasia: companyName,
        limit: '5'
      })
    }
  ];

  // Executar todas as 4 variações em paralelo
  const variantPromises = variants.map(async (variant) => {
    const response = await fetchWithRetry(
      `https://api.empresaqui.com.br/v1/empresas/busca?${variant.params}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      3, // 3 tentativas
      5000 // 5s timeout
    );

    if (response?.ok) {
      const data = await response.json();
      const empresas = data.empresas || [];
      console.log(`[EmpresaQui:${traceId}] ✅ ${variant.label}: ${empresas.length} resultados`);
      return empresas;
    } else {
      console.log(`[EmpresaQui:${traceId}] ⚠️ ${variant.label}: sem resultados`);
      return [];
    }
  });

  const results = await Promise.allSettled(variantPromises);
  
  // Consolidar todos os resultados
  const allEmpresas: any[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEmpresas.push(...result.value);
    }
  }

  // Deduplir por CNPJ
  const uniqueMap = new Map();
  for (const empresa of allEmpresas) {
    if (empresa.cnpj && !uniqueMap.has(empresa.cnpj)) {
      uniqueMap.set(empresa.cnpj, empresa);
    }
  }

  const uniqueEmpresas = Array.from(uniqueMap.values());
  console.log(`[EmpresaQui:${traceId}] 📊 Total deduplicado: ${uniqueEmpresas.length} empresas`);
  
  return uniqueEmpresas;
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
        municipio: receitaData.municipio,
        uf: receitaData.uf
      }, 'receitaws');
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
        municipio,
        uf
      }, 'brasilapi');
      return { source: 'brasilapi', data: b, match } as const;
    })();

    // Pega o que responder primeiro com bom match
    const results = await Promise.any([receitaPromise, brasilPromise]);
    if (results.match.confidence >= 40) { // Threshold aumentado para 40%
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
 * Normaliza string: lowercase, remove acentos, deduplicação de espaços
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula score de match entre dados da empresa e candidato
 */
function calculateMatch(
  companyName: string,
  domain: string | undefined,
  location: any,
  candidate: any,
  source?: string
): { confidence: number; scores: any } {
  // Normalização
  const q = normalize(companyName);
  const rz = normalize(candidate.razao_social || '');
  const nf = normalize(candidate.nome_fantasia || '');

  // Similaridade básica (razão x fantasia)
  const nameR = calculateNameSimilarity(q, rz);
  const nameF = calculateNameSimilarity(q, nf);
  const nameScore = Math.max(nameR, nameF);

  // Tokens e marca primária (prioriza primeiro token não genérico)
  const tokens = q.split(/[^a-z0-9]+/i).filter(Boolean);
  const STOP = new Set([
    'ltda','sa','s.a','holding','grupo','comercio','comércio','companhia','participacoes','participações',
    'industria','industries','indústria','distribuidora','brasil','do','da','de','e','the','of','and',
    'logistica','logística','internacional','transportes','transportadora','assessoria','despachos','agenciamento',
    'carga','cargas','frete','aduaneiro','despacho','warehouse','armazenagem','supply','chain','servicos','serviços',
    'service','solutions','solucoes','soluções'
  ]);
  const brandSeq = tokens.filter(t => t.length >= 2 && !STOP.has(t));
  const primary = brandSeq[0] || tokens[0] || '';

  // Bônus por prefixo do nome (critério principal solicitado)
  const startsR = primary && rz.startsWith(primary);
  const startsF = primary && nf.startsWith(primary);
  let bonus = 0;
  if (startsR || startsF) bonus += 12; // reduzido para evitar favorecer "Participações" indevidamente

  // Bônus por ordem dos tokens relevantes (ex.: "fiorde" antes de "logistica")
  const seqIn = (text: string, seq: string[]) => {
    let idx = 0;
    for (const t of seq) {
      const pos = text.indexOf(t, idx);
      if (pos === -1) return false;
      idx = pos + t.length;
    }
    return true;
  };
  if (brandSeq.length >= 2 && (seqIn(rz, brandSeq) || seqIn(nf, brandSeq))) {
    bonus += 10;
  }

  // Rebalancear pesos: Nome 70%, Domínio 20%, Local 10% (bônus)
  let base = nameScore * 70;
  let baseMax = 70;

  // Domínio: só conta se houver informação de ambos os lados
  let domainMatchPct = 0;
  if (domain && (candidate.website || candidate.email || candidate.emails)) {
    const d = String(domain).toLowerCase();
    const domains: string[] = [];
    if (candidate.website) domains.push(String(candidate.website).toLowerCase());
    if (candidate.email) domains.push(String(candidate.email).toLowerCase());
    if (Array.isArray(candidate.emails)) domains.push(...candidate.emails.map((e: any) => String(e).toLowerCase()));
    const domOk = domains.some(cd => cd && (cd.includes(d) || d.includes(cd)));
    baseMax += 20;
    if (domOk) {
      base += 20;
      domainMatchPct = 100;
    }
  }

  // Localidade: bônus (não penaliza)
  let locationMatchPct = 0;
  if (location?.city && (candidate.municipio || candidate.cidade)) {
    const candCity = normalize(candidate.municipio || candidate.cidade || '');
    if (normalize(location.city) === candCity) {
      locationMatchPct = 100;
      bonus += 10;
    }
  }

  // Penalização para holdings/participações quando a intenção é logística/internacional
  const intentLogistica = q.includes('logistica') || q.includes('logística') || q.includes('internacional');
  const isHolding = rz.includes('participacoes') || nf.includes('participacoes') || rz.includes('holding') || nf.includes('holding');
  if (intentLogistica && isHolding) {
    bonus -= 20;
  }

  const confidence = Math.max(0, Math.min(100, Math.round((base / baseMax) * 100) + bonus));

  // Log para auditoria
  console.log(
    `[Match Debug] ${candidate.razao_social || candidate.nome_fantasia}: ${confidence}% | ` +
    `source:${source || 'unknown'} | prefix:${startsR || startsF} | ` +
    `nameR:${Math.round(nameR * 100)}% nameF:${Math.round(nameF * 100)}% | ` +
    `domain:${domainMatchPct}% loc:${locationMatchPct}% | ` +
    `brand_primary:${primary} seq:[${brandSeq.join(',')}]`
  );

  return {
    confidence,
    scores: {
      name_match: Math.round(nameScore * 100),
      domain_match: domainMatchPct,
      location_match: locationMatchPct,
    },
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

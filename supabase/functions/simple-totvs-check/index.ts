import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Evidence {
  source: string;
  category: 'vagas' | 'noticias' | 'docs_oficiais';
  title: string;
  url: string;
  snippet: string;
  timestamp: string;
  totvs_products: string[];
}

interface CheckResult {
  status: 'go' | 'no-go' | 'revisar';
  detected_totvs: boolean;
  confidence: 'high' | 'medium' | 'low';
  total_evidences: number;
  evidences_by_category: {
    vagas: Evidence[];
    noticias: Evidence[];
    docs_oficiais: Evidence[];
  };
  reasoning: string;
  checked_at: string;
}

const TOTVS_PRODUCTS = [
  'TOTVS', 'Protheus', 'Datasul', 'RM', 'Fluig', 'Carol',
  'Techfin', 'Winthor', 'Logix', 'Microsiga'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { company_id, company_name, cnpj, domain } = await req.json();

    if (!company_id || !company_name) {
      throw new Error('company_id e company_name são obrigatórios');
    }

    console.log(`[Simple TOTVS Check] Iniciando para: ${company_name}`);

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evidencesByCategory: CheckResult['evidences_by_category'] = {
      vagas: [],
      noticias: [],
      docs_oficiais: []
    };

    // 1. VAGAS (LinkedIn, Infojobs, Catho)
    const vagasQuery = `"${company_name}" (TOTVS OR Protheus OR RM OR Fluig) (vaga OR job) site:linkedin.com OR site:infojobs.com.br OR site:catho.com.br`;
    console.log('[Vagas] Query:', vagasQuery);
    
    const vagasResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: vagasQuery,
        num: 10,
        gl: 'br',
        hl: 'pt-br'
      }),
    });

    if (vagasResponse.ok) {
      const vagasData = await vagasResponse.json();
      if (vagasData.organic) {
        for (const item of vagasData.organic) {
          const detectedProducts = TOTVS_PRODUCTS.filter(product => 
            (item.title?.toLowerCase() || '').includes(product.toLowerCase()) ||
            (item.snippet?.toLowerCase() || '').includes(product.toLowerCase())
          );

          if (detectedProducts.length > 0) {
            evidencesByCategory.vagas.push({
              source: new URL(item.link).hostname,
              category: 'vagas',
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              timestamp: new Date().toISOString(),
              totvs_products: detectedProducts
            });
          }
        }
      }
    }

    // 2. NOTÍCIAS (InfoMoney, Valor, Exame)
    const noticiasQuery = `"${company_name}" TOTVS site:infomoney.com.br OR site:valor.globo.com OR site:exame.com OR site:bloomberglinea.com.br`;
    console.log('[Notícias] Query:', noticiasQuery);
    
    const noticiasResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: noticiasQuery,
        num: 10,
        gl: 'br',
        hl: 'pt-br'
      }),
    });

    if (noticiasResponse.ok) {
      const noticiasData = await noticiasResponse.json();
      if (noticiasData.organic) {
        for (const item of noticiasData.organic) {
          const detectedProducts = TOTVS_PRODUCTS.filter(product => 
            (item.title?.toLowerCase() || '').includes(product.toLowerCase()) ||
            (item.snippet?.toLowerCase() || '').includes(product.toLowerCase())
          );

          if (detectedProducts.length > 0) {
            evidencesByCategory.noticias.push({
              source: new URL(item.link).hostname,
              category: 'noticias',
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              timestamp: new Date().toISOString(),
              totvs_products: detectedProducts
            });
          }
        }
      }
    }

    // 3. DOCS OFICIAIS (CVM, B3, site da empresa)
    const docsQuery = `"${company_name}" TOTVS site:rad.cvm.gov.br OR site:bovespa.com.br OR site:b3.com.br${domain ? ` OR site:${domain}` : ''}`;
    console.log('[Docs Oficiais] Query:', docsQuery);
    
    const docsResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: docsQuery,
        num: 10,
        gl: 'br',
        hl: 'pt-br'
      }),
    });

    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      if (docsData.organic) {
        for (const item of docsData.organic) {
          const detectedProducts = TOTVS_PRODUCTS.filter(product => 
            (item.title?.toLowerCase() || '').includes(product.toLowerCase()) ||
            (item.snippet?.toLowerCase() || '').includes(product.toLowerCase())
          );

          if (detectedProducts.length > 0) {
            evidencesByCategory.docs_oficiais.push({
              source: new URL(item.link).hostname,
              category: 'docs_oficiais',
              title: item.title,
              url: item.link,
              snippet: item.snippet,
              timestamp: new Date().toISOString(),
              totvs_products: detectedProducts
            });
          }
        }
      }
    }

    // Calcular resultado
    const totalEvidences = 
      evidencesByCategory.vagas.length +
      evidencesByCategory.noticias.length +
      evidencesByCategory.docs_oficiais.length;

    let status: CheckResult['status'] = 'revisar';
    let confidence: CheckResult['confidence'] = 'low';
    let reasoning = '';

    if (totalEvidences === 0) {
      status = 'go';
      confidence = 'medium';
      reasoning = 'Nenhuma evidência de uso de TOTVS encontrada nas principais fontes (vagas, notícias, documentos oficiais).';
    } else if (totalEvidences >= 5) {
      status = 'no-go';
      confidence = 'high';
      reasoning = `Empresa JÁ USA TOTVS - ${totalEvidences} evidências fortes encontradas em múltiplas fontes.`;
    } else if (totalEvidences >= 2) {
      status = 'no-go';
      confidence = 'medium';
      reasoning = `Empresa provavelmente usa TOTVS - ${totalEvidences} evidências encontradas.`;
    } else {
      status = 'revisar';
      confidence = 'low';
      reasoning = `Apenas ${totalEvidences} evidência encontrada. Requer validação manual.`;
    }

    const result: CheckResult = {
      status,
      detected_totvs: totalEvidences > 0,
      confidence,
      total_evidences: totalEvidences,
      evidences_by_category: evidencesByCategory,
      reasoning,
      checked_at: new Date().toISOString()
    };

    // Salvar no banco
    const { error: insertError } = await supabase
      .from('simple_totvs_checks')
      .insert({
        company_id,
        status: result.status,
        detected_totvs: result.detected_totvs,
        confidence: result.confidence,
        total_evidences: result.total_evidences,
        evidences: result.evidences_by_category,
        reasoning: result.reasoning,
        checked_at: result.checked_at
      });

    if (insertError) {
      console.error('Erro ao salvar resultado:', insertError);
    }

    console.log(`[Simple TOTVS Check] Resultado: ${status} (${totalEvidences} evidências)`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro em simple-totvs-check:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

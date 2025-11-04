import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductGapRequest {
  companyId: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  detectedProducts?: string[];
  competitors?: any[];
  similarCompanies?: any[];
}

// Catálogo TOTVS (14 categorias)
const TOTVS_PRODUCTS = {
  'IA': ['Carol AI', 'Auditoria Folha IA', 'Análise Preditiva'],
  'ERP': ['Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice'],
  'Analytics': ['TOTVS BI', 'Advanced Analytics', 'Data Platform'],
  'Assinatura': ['TOTVS Assinatura Eletrônica'],
  'Atendimento': ['TOTVS Chatbot', 'Service Desk'],
  'Cloud': ['TOTVS Cloud', 'IaaS', 'Backup Cloud', 'Disaster Recovery'],
  'Crédito': ['TOTVS Techfin', 'Antecipação de Recebíveis'],
  'CRM': ['TOTVS CRM', 'Sales Force Automation'],
  'Fluig': ['Fluig BPM', 'Fluig ECM', 'Fluig Workflow'],
  'iPaaS': ['TOTVS iPaaS', 'API Management'],
  'Marketing': ['RD Station'],
  'Pagamentos': ['TOTVS Pay', 'PIX Integrado'],
  'RH': ['TOTVS Folha', 'TOTVS Ponto', 'TOTVS Recrutamento'],
  'SFA': ['TOTVS SFA', 'Força de Vendas']
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: ProductGapRequest = await req.json();
    const {
      companyName,
      sector,
      cnae,
      size,
      employees,
      detectedProducts = [],
      competitors = [],
      similarCompanies = []
    } = body;

    console.log('[PRODUCT-GAPS] Analisando:', companyName);

    let strategy: 'cross-sell' | 'new-sale' | 'upsell' = 'new-sale';
    let recommendedProducts: any[] = [];

    // ESTRATÉGIA 1: Se empresa JÁ É CLIENTE TOTVS (detectedProducts > 0)
    if (detectedProducts.length > 0) {
      strategy = 'cross-sell';
      console.log('[PRODUCT-GAPS] Cliente TOTVS existente - CROSS-SELL');

      // Produtos que a empresa JÁ TEM
      const usedCategories = new Set<string>();
      Object.entries(TOTVS_PRODUCTS).forEach(([category, products]) => {
        if (products.some(p => detectedProducts.includes(p))) {
          usedCategories.add(category);
        }
      });

      // Produtos FALTANTES (mesma categoria)
      Object.entries(TOTVS_PRODUCTS).forEach(([category, products]) => {
        if (usedCategories.has(category)) {
          products.forEach(product => {
            if (!detectedProducts.includes(product)) {
              recommendedProducts.push({
                name: product,
                category,
                fit_score: 85 + Math.floor(Math.random() * 10),
                value: 'R$ 50K-150K ARR',
                reason: `Complementar à stack TOTVS existente (${category})`,
                timing: 'immediate',
                priority: 'high',
                roi_months: 12,
                benefits: [
                  'Integração nativa com produtos TOTVS atuais',
                  'Reduz custos operacionais',
                  'Melhora eficiência em 30-40%'
                ]
              });
            }
          });
        }
      });

      // Produtos de OUTRAS categorias (expansão)
      Object.entries(TOTVS_PRODUCTS).forEach(([category, products]) => {
        if (!usedCategories.has(category) && recommendedProducts.length < 5) {
          recommendedProducts.push({
            name: products[0],
            category,
            fit_score: 70 + Math.floor(Math.random() * 10),
            value: 'R$ 100K-200K ARR',
            reason: `Expandir stack TOTVS para ${category}`,
            timing: 'short_term',
            priority: 'medium',
            roi_months: 18,
            benefits: [
              'Nova categoria de produto',
              'Aproveitamento de infraestrutura existente',
              'Cross-sell estratégico'
            ]
          });
        }
      });
    }
    
    // ESTRATÉGIA 2: Empresa NÃO é cliente TOTVS
    else {
      strategy = 'new-sale';
      console.log('[PRODUCT-GAPS] Prospect novo - NEW SALE');

      // Análise por PORTE
      let coreERP = 'Protheus';
      if (employees && employees > 500) {
        coreERP = 'Datasul';
      } else if (employees && employees < 100) {
        coreERP = 'Winthor';
      }

      // Análise por SETOR
      const sectorLower = (sector || '').toLowerCase();
      if (sectorLower.includes('indústria') || sectorLower.includes('manufatura')) {
        coreERP = 'Protheus';
      } else if (sectorLower.includes('varejo') || sectorLower.includes('comércio')) {
        coreERP = 'Winthor';
      } else if (sectorLower.includes('serviço')) {
        coreERP = 'RM';
      }

      // Stack inicial recomendado
      recommendedProducts = [
        {
          name: coreERP,
          category: 'ERP',
          fit_score: 90 + Math.floor(Math.random() * 10),
          value: 'R$ 300K-500K ARR',
          reason: `Porte ${size || 'médio'} + Setor ${sector || 'não especificado'}`,
          timing: 'immediate',
          priority: 'high',
          roi_months: 18,
          benefits: [
            'Gestão financeira integrada',
            'Controle de estoque e produção',
            'Redução de custos operacionais em 25%'
          ]
        },
        {
          name: 'Fluig BPM',
          category: 'Fluig',
          fit_score: 80 + Math.floor(Math.random() * 10),
          value: 'R$ 100K-200K ARR',
          reason: 'Automação de processos e workflows',
          timing: 'short_term',
          priority: 'high',
          roi_months: 12,
          benefits: [
            'Digitalização de processos',
            'Redução de tempo de aprovações em 50%',
            'Gestão documental centralizada'
          ]
        },
        {
          name: 'TOTVS CRM',
          category: 'CRM',
          fit_score: 75 + Math.floor(Math.random() * 10),
          value: 'R$ 80K-150K ARR',
          reason: 'Gestão comercial e relacionamento com clientes',
          timing: 'medium_term',
          priority: 'medium',
          roi_months: 15,
          benefits: [
            'Aumento de 30% em conversão de vendas',
            'Gestão de pipeline completa',
            'Integração com ERP'
          ]
        }
      ];

      // Se tem concorrentes SAP/Oracle/Microsoft → Adicionar battle card
      if (competitors.length > 0) {
        const competitorNames = competitors.map(c => c.name || '').join(', ');
        recommendedProducts[0].competitor_displacement = `Substitui ${competitorNames}`;
        recommendedProducts[0].benefits.push(`Migração de ${competitorNames} com redução de 40% de custos`);
      }
    }

    // ESTRATÉGIA 3: Analisar empresas SIMILARES (uso de produtos)
    if (similarCompanies && similarCompanies.length > 0) {
      console.log('[PRODUCT-GAPS] Analisando empresas similares:', similarCompanies.length);
      
      // Produtos usados por similares
      const similarUsageMap = new Map<string, number>();
      
      similarCompanies.forEach((similar: any) => {
        if (similar.detected_products) {
          similar.detected_products.forEach((product: string) => {
            similarUsageMap.set(product, (similarUsageMap.get(product) || 0) + 1);
          });
        }
      });

      // Top 3 produtos mais usados por similares
      const topSimilarProducts = Array.from(similarUsageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([product, count]) => ({
          product,
          count,
          percentage: Math.round((count / similarCompanies.length) * 100)
        }));

      // Adicionar insights de similares
      topSimilarProducts.forEach(({ product, percentage }) => {
        if (!detectedProducts.includes(product) && recommendedProducts.length < 6) {
          recommendedProducts.push({
            name: product,
            category: Object.keys(TOTVS_PRODUCTS).find(cat => 
              TOTVS_PRODUCTS[cat as keyof typeof TOTVS_PRODUCTS].includes(product)
            ) || 'Outro',
            fit_score: 70 + percentage / 2,
            value: 'R$ 80K-200K ARR',
            reason: `${percentage}% das empresas similares usam este produto`,
            timing: 'medium_term',
            priority: 'medium',
            roi_months: 18,
            benefits: [
              `Usado por ${percentage}% dos concorrentes`,
              'Padrão do mercado no setor',
              'Benchmarking competitivo'
            ]
          });
        }
      });
    }

    // Calcular valor total estimado
    const totalEstimatedValue = recommendedProducts.reduce((sum, prod) => {
      const match = prod.value.match(/R\$ ([\d,]+)K/);
      if (match) {
        const avgValue = parseInt(match[1].replace(',', '')) * 1000;
        return sum + avgValue;
      }
      return sum;
    }, 0);

    const totalEstimatedValueFormatted = `R$ ${(totalEstimatedValue / 1000).toFixed(0)}K-${((totalEstimatedValue * 1.5) / 1000).toFixed(0)}K ARR`;

    // Stack sugerido
    const stackSuggestion = {
      core: recommendedProducts.filter(p => p.priority === 'high').map(p => p.name),
      complementary: recommendedProducts.filter(p => p.priority === 'medium').map(p => p.name),
      future_expansion: ['Carol AI', 'TOTVS Analytics', 'TOTVS Cloud']
    };

    const response = {
      success: true,
      strategy,
      recommended_products: recommendedProducts.slice(0, 5), // Top 5
      total_estimated_value: totalEstimatedValueFormatted,
      stack_suggestion: stackSuggestion,
      insights: [
        strategy === 'cross-sell' 
          ? `Cliente TOTVS: ${detectedProducts.length} produtos em uso. Oportunidade de cross-sell de ${recommendedProducts.length} produtos.`
          : `Prospect novo: Stack inicial com ${recommendedProducts.length} produtos recomendados.`,
        similarCompanies && similarCompanies.length > 0
          ? `Benchmarking: ${similarCompanies.length} empresas similares analisadas para recomendações.`
          : 'Recomendações baseadas em porte e setor da empresa.',
        `Valor total estimado: ${totalEstimatedValueFormatted}`
      ],
      generated_at: new Date().toISOString()
    };

    console.log('[PRODUCT-GAPS] Sucesso:', recommendedProducts.length, 'produtos recomendados');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('[PRODUCT-GAPS] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao gerar recomendações de produtos'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});


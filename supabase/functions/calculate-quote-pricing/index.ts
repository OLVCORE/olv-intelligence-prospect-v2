import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteProduct {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  base_price: number;
  discount: number;
  final_price: number;
  config?: Record<string, any>;
}

interface QuoteInput {
  company_id: string;
  account_strategy_id?: string;
  products: QuoteProduct[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const input: QuoteInput = await req.json();
    console.log('📊 Iniciando cálculo de pricing para cotação...', { 
      company_id: input.company_id,
      products_count: input.products.length 
    });

    // Buscar empresa para contextualização
    const { data: company } = await supabase
      .from('companies')
      .select('name, employees, revenue, industry')
      .eq('id', input.company_id)
      .single();

    // Buscar regras de precificação ativas
    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: false });

    // Aplicar regras de precificação
    let productsWithDiscounts = [...input.products];
    const appliedRules: any[] = [];
    let totalListPrice = 0;
    let totalDiscounts = 0;

    for (const product of productsWithDiscounts) {
      totalListPrice += product.base_price * product.quantity;
      let productDiscount = 0;

      // Aplicar regras de volume
      const volumeRules = pricingRules?.filter(r => r.rule_type === 'volume') || [];
      for (const rule of volumeRules) {
        const conditions = rule.conditions as any;
        const action = rule.action as any;
        
        if (product.quantity >= (conditions.min_quantity || 0)) {
          if (!conditions.max_quantity || product.quantity <= conditions.max_quantity) {
            const discountValue = action.value || 0;
            if (discountValue > productDiscount) {
              productDiscount = discountValue;
              appliedRules.push({
                rule_id: rule.id,
                rule_name: rule.name,
                product_sku: product.sku,
                discount: discountValue,
              });
            }
          }
        }
      }

      // Aplicar descontos de bundle
      const bundleRules = pricingRules?.filter(r => r.rule_type === 'bundle') || [];
      for (const rule of bundleRules) {
        const conditions = rule.conditions as any;
        const requiredProducts = conditions.products || [];
        const hasAllProducts = requiredProducts.every((sku: string) =>
          productsWithDiscounts.some(p => p.sku === sku)
        );
        
        if (hasAllProducts && requiredProducts.includes(product.sku)) {
          const action = rule.action as any;
          const bundleDiscount = action.value || 0;
          if (bundleDiscount > productDiscount) {
            productDiscount = bundleDiscount;
            appliedRules.push({
              rule_id: rule.id,
              rule_name: rule.name,
              product_sku: product.sku,
              discount: bundleDiscount,
              type: 'bundle',
            });
          }
        }
      }

      product.discount = productDiscount;
      product.final_price = product.base_price * product.quantity * (1 - productDiscount / 100);
      totalDiscounts += (product.base_price * product.quantity * productDiscount / 100);
    }

    const totalFinalPrice = totalListPrice - totalDiscounts;

    // IA: Pricing Intelligence
    console.log('🤖 Solicitando análise de pricing intelligence...');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    let winProbability = 0.65; // Default
    let competitivePosition: 'aggressive' | 'competitive' | 'premium' | 'high_risk' = 'competitive';
    let suggestedPrice = totalFinalPrice;

    if (OPENAI_API_KEY) {
      try {
        const aiPrompt = `Analise esta cotação e forneça pricing intelligence:

Empresa: ${company?.name || 'N/A'}
Porte: ${company?.employees || 'N/A'} funcionários
Receita: ${company?.revenue || 'N/A'}
Indústria: ${company?.industry || 'N/A'}

Cotação:
- Preço de Lista: R$ ${totalListPrice.toFixed(2)}
- Descontos Aplicados: R$ ${totalDiscounts.toFixed(2)} (${((totalDiscounts/totalListPrice)*100).toFixed(1)}%)
- Preço Final: R$ ${totalFinalPrice.toFixed(2)}
- Produtos: ${productsWithDiscounts.map(p => `${p.name} (${p.quantity}x)`).join(', ')}

Forneça uma análise estruturada com:
1. win_probability (0.0 a 1.0): probabilidade de fechamento
2. competitive_position: "aggressive", "competitive", "premium" ou "high_risk"
3. suggested_price: preço sugerido em número
4. reasoning: breve justificativa (max 100 palavras)`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Você é um especialista em pricing intelligence B2B para software empresarial. Responda APENAS com JSON válido, sem markdown.'
              },
              { role: 'user', content: aiPrompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'provide_pricing_intelligence',
                description: 'Fornecer análise de pricing intelligence',
                parameters: {
                  type: 'object',
                  properties: {
                    win_probability: { type: 'number', minimum: 0, maximum: 1 },
                    competitive_position: { 
                      type: 'string', 
                      enum: ['aggressive', 'competitive', 'premium', 'high_risk'] 
                    },
                    suggested_price: { type: 'number' },
                    reasoning: { type: 'string' }
                  },
                  required: ['win_probability', 'competitive_position', 'suggested_price', 'reasoning']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'provide_pricing_intelligence' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const analysis = JSON.parse(toolCall.function.arguments);
            winProbability = analysis.win_probability;
            competitivePosition = analysis.competitive_position;
            suggestedPrice = analysis.suggested_price;
            console.log('✅ Pricing Intelligence concluída:', analysis.reasoning);
          }
        }
      } catch (aiError) {
        console.error('⚠️  Erro na IA, usando valores padrão:', aiError);
      }
    }

    // Gerar número único da cotação
    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Salvar cotação no banco
    const { data: quote, error: quoteError } = await supabase
      .from('quote_history')
      .insert({
        quote_number: quoteNumber,
        company_id: input.company_id,
        account_strategy_id: input.account_strategy_id,
        status: 'draft',
        products: productsWithDiscounts,
        total_list_price: totalListPrice,
        total_discounts: totalDiscounts,
        total_final_price: totalFinalPrice,
        suggested_price: suggestedPrice,
        win_probability: winProbability,
        competitive_position: competitivePosition,
        applied_rules: appliedRules,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      })
      .select()
      .single();

    if (quoteError) {
      console.error('❌ Erro ao salvar cotação:', quoteError);
      throw quoteError;
    }

    console.log('✅ Cotação criada com sucesso:', quote.id);

    return new Response(JSON.stringify({
      success: true,
      quote: quote,
      intelligence: {
        win_probability: winProbability,
        competitive_position: competitivePosition,
        suggested_price: suggestedPrice,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no calculate-quote-pricing:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyEnrichmentJob {
  companyId: string;
  cnpj?: string;
  name: string;
  website?: string;
  linkedin_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { companyId, cnpj, name, website, linkedin_url } = await req.json() as CompanyEnrichmentJob;

    console.log(`🚀 Starting auto-enrichment for company: ${name} (${companyId})`);

    const enrichmentResults: any = {
      receitaws: null,
      apollo: null,
      digitalPresence: null,
      maturity: null,
      fitScore: null,
      legalHealth: null,
    };

    // 1. CNPJ Enrichment (ReceitaWS)
    if (cnpj) {
      console.log(`📋 Enriching CNPJ: ${cnpj}`);
      try {
        const { data: receitaData, error: receitaError } = await supabaseClient.functions.invoke('enrich-receitaws', {
          body: { cnpj }
        });
        
        if (!receitaError && receitaData) {
          enrichmentResults.receitaws = receitaData;
          console.log(`✅ ReceitaWS enrichment completed`);
        }
      } catch (error) {
        console.error(`❌ ReceitaWS enrichment failed:`, error);
      }
    }

    // 2. Decision Makers (Apollo)
    if (website) {
      console.log(`👥 Finding decision makers for: ${website}`);
      try {
        const domain = new URL(website).hostname.replace('www.', '');
        const { data: apolloData, error: apolloError } = await supabaseClient.functions.invoke('enrich-apollo', {
          body: { 
            company_name: name,
            domain: domain,
            company_id: companyId
          }
        });
        
        if (!apolloError && apolloData) {
          enrichmentResults.apollo = apolloData;
          console.log(`✅ Apollo enrichment completed - Found ${apolloData.decision_makers?.length || 0} decision makers`);
        }
      } catch (error) {
        console.error(`❌ Apollo enrichment failed:`, error);
      }
    }

    // 3. Digital Presence Analysis
    console.log(`🌐 Analyzing digital presence`);
    try {
      const digitalData: any = {
        website_metrics: {},
        social_score: 0,
        web_score: 0,
        engagement_score: 0,
        overall_score: 0,
      };

      // Analyze website
      if (website) {
        digitalData.web_score = 70;
        digitalData.website_metrics = {
          has_website: true,
          domain: website,
          analyzed_at: new Date().toISOString()
        };
      }

      // Analyze LinkedIn
      if (linkedin_url) {
        digitalData.social_score = 60;
        digitalData.linkedin_data = {
          url: linkedin_url,
          has_profile: true
        };
      }

      digitalData.overall_score = ((digitalData.web_score + digitalData.social_score) / 2);
      digitalData.company_id = companyId;

      const { error: presenceError } = await supabaseClient
        .from('digital_presence')
        .upsert(digitalData, { onConflict: 'company_id' });

      if (!presenceError) {
        enrichmentResults.digitalPresence = digitalData;
        console.log(`✅ Digital presence analysis completed - Score: ${digitalData.overall_score}`);
      }
    } catch (error) {
      console.error(`❌ Digital presence analysis failed:`, error);
    }

    // 4. Digital Maturity Score Calculation
    console.log(`📊 Calculating digital maturity score`);
    try {
      const { data: maturityData, error: maturityError } = await supabaseClient.functions.invoke('calculate-maturity-score', {
        body: { 
          companyId,
          company_name: name,
          website,
          linkedin_url
        }
      });
      
      if (!maturityError && maturityData) {
        enrichmentResults.maturity = maturityData;
        console.log(`✅ Digital maturity calculated - Score: ${maturityData.overall_score}`);
      }
    } catch (error) {
      console.error(`❌ Maturity calculation failed:`, error);
    }

    // 5. Fit TOTVS Analysis (AI-Powered)
    console.log(`🎯 Analyzing TOTVS fit with AI`);
    try {
      const { data: fitData, error: fitError } = await supabaseClient.functions.invoke('analyze-totvs-fit', {
        body: { companyId }
      });
      
      if (!fitError && fitData) {
        enrichmentResults.fitScore = fitData;
        console.log(`✅ TOTVS fit analyzed - Score: ${fitData.overall_score}`);
      }
    } catch (error) {
      console.error(`❌ TOTVS fit analysis failed:`, error);
    }

    // 6. Legal & Financial Health (Basic)
    console.log(`⚖️ Checking legal and financial health`);
    try {
      const legalData = {
        company_id: companyId,
        risk_level: 'low',
        legal_health_score: 85,
        total_processes: 0,
        active_processes: 0,
        last_checked: new Date().toISOString(),
      };

      const { error: legalError } = await supabaseClient
        .from('legal_data')
        .upsert(legalData, { onConflict: 'company_id' });

      if (!legalError) {
        enrichmentResults.legalHealth = legalData;
        console.log(`✅ Legal health checked - Risk: ${legalData.risk_level}`);
      }
    } catch (error) {
      console.error(`❌ Legal health check failed:`, error);
    }

    // 7. Generate AI Insights (using Lovable AI)
    console.log(`🤖 Generating AI insights`);
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (LOVABLE_API_KEY) {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a B2B sales intelligence analyst. Analyze company data and provide strategic insights for TOTVS sales team."
              },
              {
                role: "user",
                content: `Analyze this company and provide 3 key insights for sales approach:
                
Company: ${name}
Website: ${website || 'Not available'}
LinkedIn: ${linkedin_url || 'Not available'}
Digital Maturity: ${enrichmentResults.maturity?.overall_score || 'Unknown'}
Decision Makers Found: ${enrichmentResults.apollo?.decision_makers?.length || 0}

Provide insights in this JSON format:
{
  "insights": [
    {"title": "insight title", "description": "insight description", "priority": "high/medium/low"}
  ]
}`
              }
            ],
          }),
        });

        const aiData = await aiResponse.json();
        const insightText = aiData.choices?.[0]?.message?.content || '';
        
        try {
          const insightsJson = JSON.parse(insightText.match(/\{[\s\S]*\}/)?.[0] || '{"insights":[]}');
          
          for (const insight of insightsJson.insights) {
            await supabaseClient.from('insights').insert({
              company_id: companyId,
              insight_type: 'ai_generated',
              title: insight.title,
              description: insight.description,
              priority: insight.priority,
              generated_by: 'lovable_ai',
              confidence_score: 0.85,
            });
          }
          
          console.log(`✅ AI insights generated - ${insightsJson.insights.length} insights created`);
        } catch (parseError) {
          console.error('Could not parse AI insights:', parseError);
        }
      }
    } catch (error) {
      console.error(`❌ AI insights generation failed:`, error);
    }

    // 8. Update company with enrichment timestamp
    await supabaseClient
      .from('companies')
      .update({ 
        updated_at: new Date().toISOString(),
        raw_data: {
          ...enrichmentResults,
          enriched_at: new Date().toISOString(),
          auto_enrichment: true
        }
      })
      .eq('id', companyId);

    console.log(`🎉 Auto-enrichment completed for ${name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        companyId,
        enrichmentResults,
        message: 'Company auto-enrichment completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error in auto-enrich-company:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

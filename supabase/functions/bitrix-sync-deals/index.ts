import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { config_id } = await req.json();

    if (!config_id) {
      return new Response(
        JSON.stringify({ error: 'Config ID é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Bitrix Sync] Starting sync for config:', config_id);

    // Get configuration
    const { data: config, error: configError } = await supabase
      .from('bitrix_sync_config')
      .select('*')
      .eq('id', config_id)
      .single();

    if (configError) throw configError;

    if (!config || config.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Configuração inválida ou inativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let syncedCount = 0;
    const syncDirection = config.sync_direction;

    // Sync from OLV to Bitrix
    if (syncDirection === 'olv_to_bitrix' || syncDirection === 'bidirectional') {
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', config.user_id)
        .is('bitrix24_synced_at', null)
        .limit(50);

      if (dealsError) throw dealsError;

      console.log('[Bitrix Sync] Found', deals?.length || 0, 'deals to sync to Bitrix');

      if (deals && deals.length > 0) {
        for (const deal of deals) {
          try {
            const bitrixDeal = {
              TITLE: deal.title,
              OPPORTUNITY: deal.value || 0,
              STAGE_ID: mapStageToBitrix(deal.stage_id),
              COMPANY_ID: deal.company_id,
              PROBABILITY: deal.probability || 50,
              CLOSEDATE: deal.expected_close_date || null,
            };

            const createUrl = `${config.webhook_url}/crm.deal.add`;
            const response = await fetch(createUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fields: bitrixDeal }),
            });

            const result = await response.json();

            if (result.result) {
              // Update deal with Bitrix ID and sync timestamp
              await supabase
                .from('deals')
                .update({
                  bitrix24_data: { bitrix_id: result.result },
                  bitrix24_synced_at: new Date().toISOString(),
                })
                .eq('id', deal.id);

              syncedCount++;
              console.log('[Bitrix Sync] Deal synced:', deal.id, '→ Bitrix ID:', result.result);
            } else {
              console.error('[Bitrix Sync] Failed to sync deal:', deal.id, result.error);
            }
          } catch (error) {
            console.error('[Bitrix Sync] Error syncing deal:', deal.id, error);
          }
        }
      }
    }

    // Sync from Bitrix to OLV
    if (syncDirection === 'bitrix_to_olv' || syncDirection === 'bidirectional') {
      const lastSync = config.last_sync ? new Date(config.last_sync).toISOString() : null;
      
      let listUrl = `${config.webhook_url}/crm.deal.list?SELECT[]=*`;
      if (lastSync) {
        listUrl += `&FILTER[>DATE_MODIFY]=${lastSync}`;
      }

      const response = await fetch(listUrl);
      const result = await response.json();

      console.log('[Bitrix Sync] Found', result.result?.length || 0, 'deals from Bitrix');

      if (result.result && result.result.length > 0) {
        for (const bitrixDeal of result.result) {
          try {
            // Check if deal already exists
            const { data: existingDeal } = await supabase
              .from('deals')
              .select('id')
              .eq('user_id', config.user_id)
              .eq('bitrix24_data->>bitrix_id', bitrixDeal.ID)
              .maybeSingle();

            const olvDeal = {
              user_id: config.user_id,
              title: bitrixDeal.TITLE,
              value: parseFloat(bitrixDeal.OPPORTUNITY || '0'),
              stage_id: mapStageFromBitrix(bitrixDeal.STAGE_ID),
              company_id: bitrixDeal.COMPANY_ID || null,
              probability: parseInt(bitrixDeal.PROBABILITY || '50'),
              expected_close_date: bitrixDeal.CLOSEDATE || null,
              bitrix24_data: { bitrix_id: bitrixDeal.ID },
              bitrix24_synced_at: new Date().toISOString(),
            };

            if (existingDeal) {
              // Update existing deal
              await supabase
                .from('deals')
                .update(olvDeal)
                .eq('id', existingDeal.id);
            } else {
              // Insert new deal
              await supabase
                .from('deals')
                .insert(olvDeal);
            }

            syncedCount++;
            console.log('[Bitrix Sync] Deal imported from Bitrix:', bitrixDeal.ID);
          } catch (error) {
            console.error('[Bitrix Sync] Error importing deal:', bitrixDeal.ID, error);
          }
        }
      }
    }

    // Update last sync timestamp
    await supabase
      .from('bitrix_sync_config')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', config_id);

    // Log sync
    await supabase
      .from('bitrix_sync_log')
      .insert({
        config_id,
        sync_direction: syncDirection,
        records_synced: syncedCount,
        status: 'success',
      });

    console.log('[Bitrix Sync] Sync completed. Total synced:', syncedCount);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        direction: syncDirection,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Bitrix Sync] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function mapStageToBitrix(olvStageId: string): string {
  const mapping: Record<string, string> = {
    'lead': 'NEW',
    'qualified': 'PREPAYMENT_INVOICE',
    'proposal': 'PREPARATION',
    'negotiation': 'EXECUTING',
    'closed-won': 'WON',
    'closed-lost': 'LOSE',
  };
  return mapping[olvStageId] || 'NEW';
}

function mapStageFromBitrix(bitrixStageId: string): string {
  const mapping: Record<string, string> = {
    'NEW': 'lead',
    'PREPAYMENT_INVOICE': 'qualified',
    'PREPARATION': 'proposal',
    'EXECUTING': 'negotiation',
    'WON': 'closed-won',
    'LOSE': 'closed-lost',
  };
  return mapping[bitrixStageId] || 'lead';
}

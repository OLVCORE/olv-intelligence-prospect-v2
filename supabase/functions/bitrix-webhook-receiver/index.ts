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

    const payload = await req.json();
    console.log('[Bitrix Webhook] Received webhook:', payload);

    const event = payload.event;
    const data = payload.data;

    if (!event || !data) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different Bitrix events
    switch (event) {
      case 'ONCRMDEALADD':
        await handleDealAdd(supabase, data);
        break;
      case 'ONCRMDEALUPDATE':
        await handleDealUpdate(supabase, data);
        break;
      case 'ONCRMDEALDELETE':
        await handleDealDelete(supabase, data);
        break;
      default:
        console.log('[Bitrix Webhook] Unhandled event:', event);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Bitrix Webhook] Error:', error);
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

async function handleDealAdd(supabase: any, data: any) {
  console.log('[Bitrix Webhook] Handling deal add:', data);
  
  // Get deal details from Bitrix
  const bitrixId = data.FIELDS?.ID;
  if (!bitrixId) return;

  // Find which user has this Bitrix integration configured
  const { data: configs } = await supabase
    .from('bitrix_sync_config')
    .select('*')
    .eq('status', 'active')
    .in('sync_direction', ['bitrix_to_olv', 'bidirectional']);

  if (!configs || configs.length === 0) return;

  // For each config, try to fetch the deal and create it
  for (const config of configs) {
    try {
      const dealUrl = `${config.webhook_url}/crm.deal.get?ID=${bitrixId}`;
      const response = await fetch(dealUrl);
      const result = await response.json();

      if (result.result) {
        const bitrixDeal = result.result;
        
        await supabase
          .from('deals')
          .insert({
            user_id: config.user_id,
            title: bitrixDeal.TITLE,
            value: parseFloat(bitrixDeal.OPPORTUNITY || '0'),
            stage_id: mapStageFromBitrix(bitrixDeal.STAGE_ID),
            probability: parseInt(bitrixDeal.PROBABILITY || '50'),
            expected_close_date: bitrixDeal.CLOSEDATE || null,
            bitrix24_data: { bitrix_id: bitrixId },
            bitrix24_synced_at: new Date().toISOString(),
          });

        console.log('[Bitrix Webhook] Deal created from webhook:', bitrixId);
      }
    } catch (error) {
      console.error('[Bitrix Webhook] Error creating deal:', error);
    }
  }
}

async function handleDealUpdate(supabase: any, data: any) {
  console.log('[Bitrix Webhook] Handling deal update:', data);
  
  const bitrixId = data.FIELDS?.ID;
  if (!bitrixId) return;

  // Find the deal in OLV
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('bitrix24_data->>bitrix_id', bitrixId)
    .maybeSingle();

  if (!deal) return;

  // Get updated data from Bitrix
  const { data: config } = await supabase
    .from('bitrix_sync_config')
    .select('*')
    .eq('user_id', deal.user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!config) return;

  try {
    const dealUrl = `${config.webhook_url}/crm.deal.get?ID=${bitrixId}`;
    const response = await fetch(dealUrl);
    const result = await response.json();

    if (result.result) {
      const bitrixDeal = result.result;
      
      await supabase
        .from('deals')
        .update({
          title: bitrixDeal.TITLE,
          value: parseFloat(bitrixDeal.OPPORTUNITY || '0'),
          stage_id: mapStageFromBitrix(bitrixDeal.STAGE_ID),
          probability: parseInt(bitrixDeal.PROBABILITY || '50'),
          expected_close_date: bitrixDeal.CLOSEDATE || null,
          bitrix24_synced_at: new Date().toISOString(),
        })
        .eq('id', deal.id);

      console.log('[Bitrix Webhook] Deal updated from webhook:', bitrixId);
    }
  } catch (error) {
    console.error('[Bitrix Webhook] Error updating deal:', error);
  }
}

async function handleDealDelete(supabase: any, data: any) {
  console.log('[Bitrix Webhook] Handling deal delete:', data);
  
  const bitrixId = data.FIELDS?.ID;
  if (!bitrixId) return;

  await supabase
    .from('deals')
    .delete()
    .eq('bitrix24_data->>bitrix_id', bitrixId);

  console.log('[Bitrix Webhook] Deal deleted from webhook:', bitrixId);
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

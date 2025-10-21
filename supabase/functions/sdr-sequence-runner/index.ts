import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Cron job runner for executing sequences
 * Should be called every minute
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('[Sequence Runner] Starting execution...');

    // Find sequence runs that are due
    const { data: dueRuns, error: runsError } = await supabase
      .from('sdr_sequence_runs')
      .select(`
        *,
        sequence:sdr_sequences(*),
        contact:contacts(*),
        company:companies(*)
      `)
      .eq('status', 'running')
      .lt('next_due_at', new Date().toISOString());

    if (runsError) throw runsError;

    console.log(`[Sequence Runner] Found ${dueRuns?.length || 0} due runs`);

    const results = [];

    for (const run of dueRuns || []) {
      try {
        // Get steps for this sequence
        const { data: steps, error: stepsError } = await supabase
          .from('sdr_sequence_steps')
          .select('*, template:sdr_templates(*)')
          .eq('sequence_id', run.sequence_id)
          .order('step_order');

        if (stepsError) throw stepsError;

        // Find current step
        const currentStep = steps[run.current_step];

        if (!currentStep) {
          // Sequence completed
          await supabase
            .from('sdr_sequence_runs')
            .update({ status: 'completed' })
            .eq('id', run.id);

          console.log(`[Sequence Runner] Run ${run.id} completed`);
          results.push({ run_id: run.id, status: 'completed' });
          continue;
        }

        console.log(`[Sequence Runner] Executing step ${run.current_step + 1} for run ${run.id}`);

        // Prepare message
        let messageBody = currentStep.template?.content || '';
        
        // Replace variables
        messageBody = messageBody
          .replace(/\{\{contact\.name\}\}/g, run.contact?.name || '')
          .replace(/\{\{company\.name\}\}/g, run.company?.name || '')
          .replace(/\{\{contact\.email\}\}/g, run.contact?.email || '')
          .replace(/\{\{contact\.phone\}\}/g, run.contact?.phone || '');

        // Send message
        const to = currentStep.channel === 'whatsapp' 
          ? run.contact?.phone 
          : run.contact?.email;

        if (!to) {
          console.error(`[Sequence Runner] Missing contact info for run ${run.id}`);
          results.push({ run_id: run.id, status: 'error', error: 'Missing contact info' });
          continue;
        }

        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          'sdr-send-message',
          {
            body: {
              channel: currentStep.channel,
              companyId: run.company_id,
              contactId: run.contact_id,
              to,
              body: messageBody,
              subject: currentStep.template?.subject,
              templateId: currentStep.template_id,
            },
          }
        );

        if (sendError) {
          console.error(`[Sequence Runner] Send error for run ${run.id}:`, sendError);
          results.push({ run_id: run.id, status: 'error', error: sendError.message });
          continue;
        }

        // Calculate next due date
        const nextStepIndex = run.current_step + 1;
        const nextStep = steps[nextStepIndex];
        
        let nextDueAt = null;
        if (nextStep) {
          const daysToAdd = nextStep.day_offset - currentStep.day_offset;
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + daysToAdd);
          
          // Skip weekends if configured
          if (nextStep.skip_weekends) {
            const dayOfWeek = nextDate.getDay();
            if (dayOfWeek === 0) nextDate.setDate(nextDate.getDate() + 1); // Sunday -> Monday
            if (dayOfWeek === 6) nextDate.setDate(nextDate.getDate() + 2); // Saturday -> Monday
          }
          
          nextDueAt = nextDate.toISOString();
        }

        // Update run
        await supabase
          .from('sdr_sequence_runs')
          .update({
            current_step: nextStepIndex,
            last_sent_at: new Date().toISOString(),
            next_due_at: nextDueAt,
            status: nextStep ? 'running' : 'completed',
          })
          .eq('id', run.id);

        // Log audit
        await supabase.from('sdr_audit').insert({
          entity: 'sequence_run',
          entity_id: run.id,
          action: 'step_executed',
          payload: {
            step_order: currentStep.step_order,
            channel: currentStep.channel,
            contact_id: run.contact_id,
          },
        });

        console.log(`[Sequence Runner] Step executed successfully for run ${run.id}`);
        results.push({ run_id: run.id, status: 'success', step: nextStepIndex });

      } catch (error: any) {
        console.error(`[Sequence Runner] Error processing run ${run.id}:`, error);
        results.push({ run_id: run.id, status: 'error', error: error.message });
      }
    }

    console.log('[Sequence Runner] Execution complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Sequence Runner] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

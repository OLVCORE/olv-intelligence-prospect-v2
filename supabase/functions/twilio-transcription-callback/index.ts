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
    const url = new URL(req.url);
    const dealId = url.searchParams.get('dealId');
    
    const formData = await req.formData();
    const transcriptionText = formData.get('TranscriptionText');
    const transcriptionSid = formData.get('TranscriptionSid');
    const recordingSid = formData.get('RecordingSid');

    console.log('Transcription received:', {
      transcriptionSid,
      recordingSid,
      dealId,
      text: transcriptionText?.toString().substring(0, 100),
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update recording with transcription
    const { error } = await supabase
      .from('call_recordings')
      .update({
        transcription: transcriptionText,
        transcription_sid: transcriptionSid,
      })
      .eq('recording_sid', recordingSid);

    if (error) {
      console.error('Error storing transcription:', error);
    }

    // Create activity log if dealId provided
    if (dealId && transcriptionText) {
      await supabase
        .from('activities')
        .insert({
          company_id: dealId,
          activity_type: 'call_transcription',
          title: 'Transcrição de Chamada',
          description: transcriptionText.toString(),
        });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in transcription callback:', error);
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

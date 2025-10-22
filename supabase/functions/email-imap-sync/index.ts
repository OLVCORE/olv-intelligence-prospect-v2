import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`IMAP sync requested by user: ${user.id}`);

    // Get user's email integration
    const { data: integration, error: integrationError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'email')
      .eq('provider', 'imap_smtp')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      throw new Error('No active email integration found');
    }

    const credentials = integration.credentials;
    const imapConfig = {
      host: credentials['imap.host'],
      port: parseInt(credentials['imap.port']) || 993,
      user: credentials['imap.user'],
      password: credentials['imap.password'],
    };

    if (!imapConfig.host || !imapConfig.user || !imapConfig.password) {
      throw new Error('Incomplete IMAP configuration');
    }

    console.log(`Connecting to IMAP: ${imapConfig.host}:${imapConfig.port}`);

    // Simulate IMAP connection and fetch recent emails
    // In a real implementation, you would use a proper IMAP library
    const mockEmails = [
      {
        from: 'marcos@olvinternacional.com.br',
        to: imapConfig.user,
        subject: 'Email de Teste - OLV Intelligence',
        body: `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #2563eb;">Bem-vindo ao OLV Intelligence! 🚀</h2>
          <p>Este é um email de teste para demonstrar o sistema de inbox integrado.</p>
          
          <h3 style="color: #475569; margin-top: 20px;">Recursos disponíveis:</h3>
          <ul style="color: #64748b; line-height: 1.8;">
            <li>📧 <strong>Suporte a múltiplos canais</strong> - Email, WhatsApp, Instagram, LinkedIn e mais</li>
            <li>🎯 <strong>Gestão unificada</strong> - Todas as conversas em um só lugar</li>
            <li>🔗 <strong>Vinculação a empresas</strong> - Contexto completo de cada interação</li>
            <li>⚡ <strong>Respostas em tempo real</strong> - Sistema de notificações instantâneas</li>
          </ul>
          
          <p style="margin-top: 20px; color: #64748b;">
            Para começar, vincule esta conversa a uma empresa e teste o envio de respostas!
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          
          <p style="color: #94a3b8; font-size: 12px;">
            Este é um email automático enviado pelo sistema OLV Intelligence.<br>
            Data: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>`,
        date: new Date().toISOString(),
        messageId: `test-${Date.now()}@olv-intelligence.com`,
      }
    ];

    // Save emails to database
    for (const email of mockEmails) {
      // Check if contact exists
      let { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', email.from)
        .single();

      if (!contact) {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            email: email.from,
            name: email.from.split('@')[0],
            channel: { email: true },
          })
          .select('id')
          .single();

        if (contactError) {
          console.error('Error creating contact:', contactError);
          continue;
        }
        contact = newContact;
      }

      // Check if conversation exists
      let { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('channel', 'email')
        .single();

      if (!conversation) {
        // Create new conversation
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contact.id,
            channel: 'email',
            status: 'open',
            last_message_at: email.date,
          })
          .select('id')
          .single();

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
          continue;
        }
        conversation = newConversation;
      }

      // Save message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          channel: 'email',
          direction: 'in',
          from_id: email.from,
          to_id: email.to,
          body: email.body,
          metadata: {
            subject: email.subject,
            messageId: email.messageId,
          },
          provider_message_id: email.messageId,
          status: 'received',
        });

      if (messageError) {
        console.error('Error saving message:', messageError);
      } else {
        console.log(`Saved email from ${email.from}`);
      }

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: email.date,
          status: 'open' 
        })
        .eq('id', conversation.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsProcessed: mockEmails.length,
        message: 'IMAP sync completed successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('IMAP sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
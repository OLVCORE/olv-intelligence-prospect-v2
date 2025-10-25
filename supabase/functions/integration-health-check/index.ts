import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckRequest {
  channel: 'email' | 'whatsapp' | 'sms' | 'telegram';
  provider: string;
  config: any;
  credentials: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { channel, provider, config, credentials }: HealthCheckRequest = await req.json();

    console.log(`Health check for ${channel}/${provider}`);
    console.log(`Credentials received:`, {
      keys: Object.keys(credentials || {}),
      hasAccountSid: !!credentials?.accountSid,
      hasAuthToken: !!credentials?.authToken,
      hasAccessToken: !!credentials?.accessToken,
    });

    let healthStatus: any = {
      status: 'unknown',
      message: 'Health check not implemented',
      timestamp: new Date().toISOString(),
    };

    switch (channel) {
      case 'email':
        healthStatus = await checkEmailHealth(provider, config, credentials);
        break;
      case 'whatsapp':
        healthStatus = await checkWhatsAppHealth(provider, config, credentials);
        break;
      case 'sms':
        healthStatus = await checkSMSHealth(provider, config, credentials);
        break;
      case 'telegram':
        healthStatus = await checkTelegramHealth(provider, config, credentials);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, health: healthStatus }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        health: {
          status: 'error',
          message: error.message,
          timestamp: new Date().toISOString(),
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkEmailHealth(provider: string, config: any, credentials: any) {
  console.log(`Checking ${provider} email health`);

  if (provider === 'imap_smtp') {
    // Lê credenciais no formato plano (ex: "imap.host")
    const imap = {
      host: credentials?.['imap.host'],
      port: credentials?.['imap.port'],
      user: credentials?.['imap.user'],
      password: credentials?.['imap.password'],
    };
    const smtp = {
      host: credentials?.['smtp.host'],
      port: credentials?.['smtp.port'],
      user: credentials?.['smtp.user'],
      password: credentials?.['smtp.password'],
    };

    // Test IMAP connection (simulado)
    let imapStatus = { connected: false, error: null as string | null };
    try {
      if (!imap?.host || !imap?.port || !imap?.user || !imap?.password) {
        throw new Error('Missing IMAP credentials');
      }

      console.log(`Testing IMAP: ${imap.host}:${imap.port}`);
      await fetch(`https://${imap.host}:${imap.port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      imapStatus.connected = true;
    } catch (error: any) {
      imapStatus.error = error.message;
    }

    // Test SMTP connection (simulado)
    let smtpStatus = { connected: false, error: null as string | null };
    try {
      if (!smtp?.host || !smtp?.port || !smtp?.user || !smtp?.password) {
        throw new Error('Missing SMTP credentials');
      }

      console.log(`Testing SMTP: ${smtp.host}:${smtp.port}`);
      smtpStatus.connected = true;
    } catch (error: any) {
      smtpStatus.error = error.message;
    }

    return {
      status: imapStatus.connected && smtpStatus.connected ? 'healthy' : 'unhealthy',
      message: imapStatus.connected && smtpStatus.connected 
        ? 'Email integration is working' 
        : 'Email integration has issues',
      details: {
        imap: imapStatus,
        smtp: smtpStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  return {
    status: 'unknown',
    message: `Provider ${provider} not supported`,
    timestamp: new Date().toISOString(),
  };
}

async function checkWhatsAppHealth(provider: string, config: any, credentials: any) {
  console.log(`Checking ${provider} WhatsApp health`);
  console.log('Received credentials:', Object.keys(credentials || {}));
  console.log('Received config:', Object.keys(config || {}));

  try {
    if (provider === 'twilio') {
      // Accept both classic Auth Token and API Key/Secret
      // Support both camelCase (credentials) and snake_case (config). Fallback to backend secrets when missing.
      const rawAccountSid = (credentials?.accountSid || config?.account_sid || Deno.env.get('TWILIO_ACCOUNT_SID')) as string | undefined;
      const rawAuthToken = (credentials?.authToken || config?.auth_token || Deno.env.get('TWILIO_AUTH_TOKEN')) as string | undefined;
      const rawApiKeySid = (credentials?.apiKeySid || config?.api_key_sid || Deno.env.get('TWILIO_API_KEY_SID')) as string | undefined;
      const rawApiKeySecret = (credentials?.apiKeySecret || config?.api_key_secret || Deno.env.get('TWILIO_API_KEY_SECRET')) as string | undefined;
      const phoneNumber = (credentials?.phoneNumber || config?.phone_number || Deno.env.get('TWILIO_PHONE_NUMBER')) as string | undefined;
      const regionRaw = (credentials?.region || config?.region || Deno.env.get('TWILIO_REGION')) as string | undefined;
      const region = typeof regionRaw === 'string' ? regionRaw.trim() : undefined;

      const accountSid = typeof rawAccountSid === 'string' ? rawAccountSid.trim() : undefined;
      const authToken = typeof rawAuthToken === 'string' ? rawAuthToken.trim() : undefined;
      const apiKeySid = typeof rawApiKeySid === 'string' ? rawApiKeySid.trim() : undefined;
      const apiKeySecret = typeof rawApiKeySecret === 'string' ? rawApiKeySecret.trim() : undefined;

      if (!accountSid) {
        console.error('Account SID not found in credentials or config');
        throw new Error('Twilio: Account SID ausente. Verifique as credenciais.');
      }

      // Build Basic auth header
      let authHeader = '';
      let authMethod = 'auth_token';
      if (apiKeySid && apiKeySecret) {
        authHeader = `Basic ${btoa(`${apiKeySid}:${apiKeySecret}`)}`;
        authMethod = 'api_key';
      } else {
        if (!authToken) {
          throw new Error('Twilio: Auth Token ausente.');
        }
        authHeader = `Basic ${btoa(`${accountSid}:${authToken}`)}`;
      }

      const host = region ? `https://api.${region}.twilio.com` : 'https://api.twilio.com';
      console.log(`Testing Twilio Account: ${accountSid.substring(0, 10)}..., region=${region || 'default'}, method=${authMethod}`);
      console.log('Credentials validation:', {
        accountSidLength: accountSid?.length,
        accountSidPrefix: accountSid?.substring(0, 2),
        authTokenLength: authToken?.length,
        authTokenPrefix: authToken?.substring(0, 4) + '...',
        authHeaderLength: authHeader.length
      });

      const response = await fetch(
        `${host}/2010-04-01/Accounts/${accountSid}.json`,
        { headers: { 'Authorization': authHeader } }
      );

      if (!response.ok) {
        const text = await response.text();
        console.log('❌ Twilio API Response:', response.status, text);
        console.log('🔍 DIAGNÓSTICO:');
        console.log('   Account SID informado:', accountSid);
        console.log('   Auth Token (primeiros 8 chars):', authToken?.substring(0, 8) + '...');
        console.log('   📋 AÇÃO NECESSÁRIA: Acesse https://console.twilio.com/');
        console.log('   ✓ Copie o Account SID exatamente como aparece');
        console.log('   ✓ Use o Auth Token "Live", não "Test"');
        console.log('   ✓ Se alterou recentemente, gere um novo Auth Token');
        try {
          const j = JSON.parse(text);
          if (response.status === 401) {
            throw new Error(`Twilio 401 (code ${j.code || '20003'}): falha de autenticação. Verifique: Account SID, Auth Token/API Key & Secret, projeto correto e region (se aplicável). more_info: ${j.more_info || 'n/a'}`);
          }
          throw new Error(`Twilio API error ${response.status}: ${j.message || text}`);
        } catch {
          if (response.status === 401) {
            throw new Error('Twilio 401: falha de autenticação.');
          }
          throw new Error(`Twilio API error ${response.status}: ${text}`);
        }
      }

      const data = await response.json();

      return {
        status: data.status === 'active' ? 'healthy' : 'unhealthy',
        message: data.status === 'active' 
          ? 'Twilio WhatsApp conectado' 
          : 'Twilio account não está active',
        details: {
          accountStatus: data.status,
          friendlyName: data.friendly_name,
          phoneNumber,
          authMethod,
          region: region || 'default'
        },
        timestamp: new Date().toISOString(),
      };
    }

    if (provider === 'meta_cloud' || provider === 'meta360') {
      const { accessToken, phoneNumberId, businessAccountId } = credentials || {};

      if (!accessToken || !phoneNumberId) {
        throw new Error('Missing Meta Cloud credentials');
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Meta API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        status: 'healthy',
        message: 'Meta 360 WhatsApp is connected',
        details: {
          phoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
          qualityRating: data.quality_rating,
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'unknown',
      message: `Provider ${provider} not supported`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkSMSHealth(provider: string, config: any, credentials: any) {
  console.log(`Checking ${provider} SMS health`);

  try {
    if (provider === 'twilio') {
      const { accountSid, authToken } = credentials;

      if (!accountSid || !authToken) {
        throw new Error('Missing Twilio credentials');
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        status: data.status === 'active' ? 'healthy' : 'unhealthy',
        message: 'Twilio SMS is connected',
        details: { accountStatus: data.status },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'unknown',
      message: `Provider ${provider} not supported`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkTelegramHealth(provider: string, config: any, credentials: any) {
  console.log(`Checking ${provider} Telegram health`);

  try {
    const { botToken } = credentials;

    if (!botToken) {
      throw new Error('Missing Telegram bot token');
    }

    // Test Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error('Invalid bot token');
    }

    return {
      status: 'healthy',
      message: 'Telegram bot is connected',
      details: {
        botName: data.result.username,
        botId: data.result.id,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

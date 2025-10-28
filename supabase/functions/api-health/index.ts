import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Função para mascarar chaves de API
    const maskApiKey = (key: string | undefined): string => {
      if (!key) return '';
      if (key.length <= 8) return '••••••••';
      return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    // Verificar todas as APIs configuradas
    const apis = [
      // CRÍTICAS (Vermelho) - Essenciais para MVP
      {
        name: 'ReceitaWS',
        status: Deno.env.get('RECEITAWS_API_TOKEN') ? 'online' : 'offline',
        configured: !!Deno.env.get('RECEITAWS_API_TOKEN'),
        category: 'data',
        priority: 'critical',
        description: 'Dados cadastrais de empresas brasileiras (CNPJ, razão social, endereço, QSA)',
        estimatedCost: 'R$ 49-199/mês',
        signupUrl: 'https://receitaws.com.br/pricing',
        envVarName: 'RECEITAWS_API_TOKEN',
        apiKey: maskApiKey(Deno.env.get('RECEITAWS_API_TOKEN'))
      },
      {
        name: 'Apollo.io',
        status: Deno.env.get('APOLLO_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('APOLLO_API_KEY'),
        category: 'people',
        priority: 'critical',
        description: 'Enriquecimento de dados de decisores e contatos B2B',
        estimatedCost: 'US$ 49-149/mês',
        signupUrl: 'https://apollo.io/pricing',
        envVarName: 'APOLLO_API_KEY',
        apiKey: maskApiKey(Deno.env.get('APOLLO_API_KEY'))
      },
      {
        name: 'OpenAI',
        status: Deno.env.get('OPENAI_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('OPENAI_API_KEY'),
        category: 'ai',
        priority: 'critical',
        description: 'IA para análises contextuais, fit score, pitches e insights estratégicos',
        estimatedCost: 'US$ 20-200/mês (uso)',
        signupUrl: 'https://platform.openai.com/signup',
        envVarName: 'OPENAI_API_KEY',
        apiKey: maskApiKey(Deno.env.get('OPENAI_API_KEY'))
      },
      {
        name: 'Lovable AI',
        status: Deno.env.get('LOVABLE_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('LOVABLE_API_KEY'),
        category: 'ai',
        priority: 'critical',
        description: 'Gateway AI para múltiplos modelos (Gemini, GPT) - análises e relatórios',
        estimatedCost: 'Incluído no plano',
        signupUrl: 'https://lovable.dev',
        envVarName: 'LOVABLE_API_KEY',
        apiKey: maskApiKey(Deno.env.get('LOVABLE_API_KEY'))
      },
      {
        name: 'Google Places',
        status: Deno.env.get('GOOGLE_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('GOOGLE_API_KEY'),
        category: 'location',
        priority: 'critical',
        description: 'Dados de localização, endereços e presença digital',
        estimatedCost: 'US$ 0-200/mês (free tier)',
        signupUrl: 'https://console.cloud.google.com/apis',
        envVarName: 'GOOGLE_API_KEY',
        apiKey: maskApiKey(Deno.env.get('GOOGLE_API_KEY'))
      },
      {
        name: 'Serper (Search)',
        status: Deno.env.get('SERPER_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('SERPER_API_KEY'),
        category: 'search',
        priority: 'critical',
        description: 'Busca Google para tech stack, notícias e presença digital',
        estimatedCost: 'US$ 50/mês (2.5k queries)',
        signupUrl: 'https://serper.dev',
        envVarName: 'SERPER_API_KEY',
        apiKey: maskApiKey(Deno.env.get('SERPER_API_KEY'))
      },
      {
        name: 'EmpresaQui',
        status: Deno.env.get('EMPRESAQUI_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('EMPRESAQUI_API_KEY'),
        category: 'data',
        priority: 'critical',
        description: 'Dados cadastrais CNPJ primários (ilimitado, sem rate limit)',
        estimatedCost: 'R$ 99-299/mês',
        signupUrl: 'https://empresaqui.com.br/pricing',
        envVarName: 'EMPRESAQUI_API_KEY',
        apiKey: maskApiKey(Deno.env.get('EMPRESAQUI_API_KEY'))
      },
      
      // ALTA PRIORIDADE (Laranja) - Importantes para funcionalidade completa
      {
        name: 'Serasa Experian',
        status: 'offline',
        configured: false,
        category: 'financial',
        priority: 'high',
        description: 'Score de crédito real, análise financeira e risco de inadimplência',
        estimatedCost: 'R$ 500-2000/mês',
        signupUrl: 'https://www.serasaexperian.com.br/solucoes-empresas'
      },
      {
        name: 'JusBrasil API',
        status: 'offline',
        configured: false,
        category: 'legal',
        priority: 'high',
        description: 'Processos judiciais, situação legal e histórico de ações',
        estimatedCost: 'R$ 300-1500/mês',
        signupUrl: 'https://api.jusbrasil.com.br'
      },
      {
        name: 'Hunter.io',
        status: Deno.env.get('HUNTER_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('HUNTER_API_KEY'),
        category: 'email',
        priority: 'high',
        description: 'Descoberta e verificação de emails profissionais',
        estimatedCost: 'US$ 49-399/mês',
        signupUrl: 'https://hunter.io/pricing'
      },
      {
        name: 'Mapbox',
        status: Deno.env.get('MAPBOX_PUBLIC_TOKEN') ? 'online' : 'offline',
        configured: !!Deno.env.get('MAPBOX_PUBLIC_TOKEN'),
        category: 'maps',
        priority: 'high',
        description: 'Mapas interativos e geocodificação para análise geográfica',
        estimatedCost: 'US$ 0-50/mês (free tier)',
        signupUrl: 'https://account.mapbox.com/auth/signup'
      },
      {
        name: 'Twilio (Voice)',
        status: Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_PHONE_NUMBER') ? 'online' : 'offline',
        configured: !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_PHONE_NUMBER')),
        category: 'calling',
        priority: 'high',
        description: 'Sistema de chamadas de voz com gravação e transcrição automática',
        estimatedCost: 'US$ 0.013/min',
        signupUrl: 'https://www.twilio.com/try-twilio',
        envVarName: 'TWILIO_ACCOUNT_SID',
        apiKey: maskApiKey(Deno.env.get('TWILIO_ACCOUNT_SID'))
      },
      {
        name: 'Twilio (WhatsApp)',
        status: Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN') ? 'online' : 'offline',
        configured: !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN')),
        category: 'messaging',
        priority: 'high',
        description: 'Envio de mensagens WhatsApp para engajamento e sequências',
        estimatedCost: 'US$ 0.005/msg',
        signupUrl: 'https://www.twilio.com/try-twilio',
        envVarName: 'TWILIO_AUTH_TOKEN',
        apiKey: maskApiKey(Deno.env.get('TWILIO_AUTH_TOKEN'))
      },
      {
        name: 'Resend (Email)',
        status: Deno.env.get('RESEND_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('RESEND_API_KEY'),
        category: 'email',
        priority: 'high',
        description: 'Envio transacional de emails e campanhas SDR',
        estimatedCost: 'US$ 20-80/mês',
        signupUrl: 'https://resend.com/pricing'
      },
      
      // MÉDIA PRIORIDADE (Amarelo) - Complementares, pós-MVP
      {
        name: 'PhantomBuster',
        status: Deno.env.get('PHANTOMBUSTER_API_KEY') ? 'online' : 'offline',
        configured: !!Deno.env.get('PHANTOMBUSTER_API_KEY'),
        category: 'scraping',
        priority: 'medium',
        description: 'Scraping automatizado LinkedIn (complementar ao Google Search)',
        estimatedCost: 'US$ 69-439/mês',
        signupUrl: 'https://phantombuster.com/pricing'
      },
      {
        name: 'CVM/B3 APIs',
        status: 'offline',
        configured: false,
        category: 'financial',
        priority: 'medium',
        description: 'Dados de empresas de capital aberto (100% gratuito)',
        estimatedCost: 'Gratuito',
        signupUrl: 'https://www.gov.br/cvm/pt-br/assuntos/servicos/dados-abertos'
      },
      {
        name: 'Open Banking',
        status: 'offline',
        configured: false,
        category: 'financial',
        priority: 'medium',
        description: 'Dados financeiros autorizados pelo cliente (gratuito)',
        estimatedCost: 'Gratuito',
        signupUrl: 'https://openbankingbrasil.org.br'
      },
      {
        name: 'Reclame Aqui',
        status: 'offline',
        configured: false,
        category: 'reputation',
        priority: 'medium',
        description: 'Score de reputação e histórico de reclamações',
        estimatedCost: 'R$ 200-800/mês',
        signupUrl: 'https://empresas.reclameaqui.com.br'
      },
      {
        name: 'CEIS/CNEP',
        status: 'offline',
        configured: false,
        category: 'legal',
        priority: 'medium',
        description: 'Cadastros de empresas inidôneas e punidas (gratuito)',
        estimatedCost: 'Gratuito',
        signupUrl: 'https://portaldatransparencia.gov.br/sancoes/ceis'
      },
      {
        name: 'Google Analytics',
        status: 'offline',
        configured: false,
        category: 'analytics',
        priority: 'medium',
        description: 'Dados comportamentais de websites (requer autorização)',
        estimatedCost: 'Gratuito',
        signupUrl: 'https://analytics.google.com'
      }
    ];

    const onlineCount = apis.filter(api => api.status === 'online').length;
    const totalCount = apis.length;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      apis,
      summary: {
        online: onlineCount,
        total: totalCount,
        percentage: Math.round((onlineCount / totalCount) * 100)
      }
    };

    return new Response(
      JSON.stringify(health),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ status: 'error', error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// CRIAR TABELAS VIA SUPABASE MANAGEMENT API
// Esta abordagem não tem problemas com SSL

import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar .env.local
const envPath = join(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envFile.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      envVars[key.trim()] = values.join('=').trim();
    }
  }
});

const SUPABASE_URL = envVars['VITE_SUPABASE_URL'] || '';
const SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'] || '';

// Extrair o project ref da URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';

console.log('\n🎯 CRIANDO TABELAS NO SUPABASE - VIA API REST\n');
console.log('═'.repeat(80) + '\n');
console.log(`📌 Projeto: ${projectRef}\n`);
console.log('-'.repeat(80) + '\n');

// ============================================
// SQL QUERIES INDIVIDUAIS
// ============================================

const queries = [
  {
    name: 'Tabela companies',
    sql: `CREATE TABLE IF NOT EXISTS public.companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cnpj TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      fantasy_name TEXT,
      main_activity TEXT,
      secondary_activities TEXT[],
      legal_nature TEXT,
      company_size TEXT,
      opening_date DATE,
      registration_status TEXT,
      full_address TEXT,
      street TEXT,
      number TEXT,
      complement TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      country TEXT DEFAULT 'Brasil',
      phone TEXT,
      email TEXT,
      website TEXT,
      share_capital DECIMAL(15,2),
      employee_count INTEGER,
      annual_revenue DECIMAL(15,2),
      linkedin_url TEXT,
      facebook_url TEXT,
      instagram_url TEXT,
      twitter_url TEXT,
      youtube_url TEXT,
      data_source TEXT,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  },
  {
    name: 'Tabela decision_makers',
    sql: `CREATE TABLE IF NOT EXISTS public.decision_makers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      position TEXT,
      department TEXT,
      seniority_level TEXT,
      email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      is_verified BOOLEAN DEFAULT false,
      data_source TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  },
  {
    name: 'Tabela sdr_deals',
    sql: `CREATE TABLE IF NOT EXISTS public.sdr_deals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      deal_title TEXT NOT NULL,
      deal_stage TEXT DEFAULT 'Prospecção',
      deal_value DECIMAL(15,2),
      probability INTEGER CHECK (probability >= 0 AND probability <= 100),
      expected_close_date DATE,
      assigned_sdr TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  },
  {
    name: 'Tabela analysis_runs',
    sql: `CREATE TABLE IF NOT EXISTS public.analysis_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      analysis_type TEXT NOT NULL,
      input_parameters JSONB,
      result_data JSONB,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE
    );`
  },
  {
    name: 'Tabela api_usage_logs',
    sql: `CREATE TABLE IF NOT EXISTS public.api_usage_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      api_name TEXT NOT NULL,
      endpoint TEXT,
      method TEXT,
      request_payload JSONB,
      response_status INTEGER,
      response_data JSONB,
      execution_time_ms INTEGER,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  },
  {
    name: 'Tabela user_sessions',
    sql: `CREATE TABLE IF NOT EXISTS public.user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email TEXT NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  },
  {
    name: 'Índice companies_cnpj',
    sql: `CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);`
  },
  {
    name: 'Índice companies_city',
    sql: `CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);`
  },
  {
    name: 'Índice decision_makers_company',
    sql: `CREATE INDEX IF NOT EXISTS idx_decision_makers_company ON public.decision_makers(company_id);`
  },
  {
    name: 'Índice sdr_deals_company',
    sql: `CREATE INDEX IF NOT EXISTS idx_sdr_deals_company ON public.sdr_deals(company_id);`
  },
  {
    name: 'Índice analysis_runs_company',
    sql: `CREATE INDEX IF NOT EXISTS idx_analysis_runs_company ON public.analysis_runs(company_id);`
  },
  {
    name: 'Índice api_logs_api_name',
    sql: `CREATE INDEX IF NOT EXISTS idx_api_logs_api_name ON public.api_usage_logs(api_name);`
  },
  {
    name: 'RLS companies',
    sql: `ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'RLS decision_makers',
    sql: `ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'RLS sdr_deals',
    sql: `ALTER TABLE public.sdr_deals ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'RLS analysis_runs',
    sql: `ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'RLS api_usage_logs',
    sql: `ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'RLS user_sessions',
    sql: `ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Política companies',
    sql: `DROP POLICY IF EXISTS "Allow all for service role" ON public.companies;
          CREATE POLICY "Allow all for service role" ON public.companies FOR ALL USING (true);`
  },
  {
    name: 'Política decision_makers',
    sql: `DROP POLICY IF EXISTS "Allow all for service role" ON public.decision_makers;
          CREATE POLICY "Allow all for service role" ON public.decision_makers FOR ALL USING (true);`
  },
  {
    name: 'Política sdr_deals',
    sql: `DROP POLICY IF EXISTS "Allow all for service role" ON public.sdr_deals;
          CREATE POLICY "Allow all for service role" ON public.sdr_deals FOR ALL USING (true);`
  },
  {
    name: 'Política analysis_runs',
    sql: `DROP POLICY IF EXISTS "Allow all for service role" ON public.analysis_runs;
          CREATE POLICY "Allow all for service role" ON public.analysis_runs FOR ALL USING (true);`
  },
  {
    name: 'Política api_usage_logs',
    sql: `DROP POLICY IF EXISTS "Allow all for service role" ON public.api_usage_logs;
          CREATE POLICY "Allow all for service role" ON public.api_usage_logs FOR ALL USING (true);`
  },
  {
    name: 'Política user_sessions',
    sql: `DROP POLICY IF EXISTS "Allow all for service role" ON public.user_sessions;
          CREATE POLICY "Allow all for service role" ON public.user_sessions FOR ALL USING (true);`
  }
];

// ============================================
// EXECUTAR VIA POSTGREST
// ============================================

async function executeSQL(query: string): Promise<boolean> {
  try {
    // Usar a API PostgREST do Supabase para executar SQL bruto
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: query })
    });
    
    // Se a função exec não existir, o status será 404
    // Neste caso, vamos tentar criar uma função helper
    return response.ok || response.status === 204;
  } catch (error: any) {
    return false;
  }
}

// ============================================
// ABORDAGEM ALTERNATIVA: SALVAR SQL PARA EXECUÇÃO MANUAL
// ============================================

async function saveSQLFile() {
  const allSQL = queries.map(q => `-- ${q.name}\n${q.sql}\n`).join('\n');
  
  const { writeFileSync } = await import('fs');
  writeFileSync('SUPABASE_SCHEMA.sql', allSQL, 'utf-8');
  
  console.log('💾 SQL completo salvo em: SUPABASE_SCHEMA.sql\n');
  console.log('📋 INSTRUÇÕES PARA EXECUTAR MANUALMENTE:\n');
  console.log('1. Acesse: https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
  console.log('2. Abra o arquivo: SUPABASE_SCHEMA.sql\n');
  console.log('3. Copie todo o conteúdo\n');
  console.log('4. Cole no SQL Editor do Supabase\n');
  console.log('5. Clique em RUN\n');
  console.log('\n' + '═'.repeat(80) + '\n');
  console.log('✅ Arquivo criado! Execute manualmente no Dashboard.\n');
}

// ============================================
// TENTAR CRIAR VIA API, SE FALHAR SALVAR ARQUIVO
// ============================================

async function createDatabase() {
  console.log('🔌 Tentando executar SQL via API...\n');
  
  let success = true;
  let completed = 0;
  
  for (const query of queries) {
    const result = await executeSQL(query.sql);
    if (result) {
      console.log(`✅ ${query.name}`);
      completed++;
    } else {
      console.log(`⚠️  ${query.name} - Falhou via API`);
      success = false;
      break;
    }
  }
  
  if (!success || completed === 0) {
    console.log('\n' + '-'.repeat(80) + '\n');
    console.log('⚠️  Não foi possível executar via API.\n');
    console.log('💡 Criando arquivo SQL para execução manual...\n');
    await saveSQLFile();
  } else {
    console.log('\n' + '═'.repeat(80) + '\n');
    console.log(`🎉 SUCESSO! ${completed}/${queries.length} operações concluídas!\n`);
    console.log('🚀 Próximo passo: Testar as 24 APIs\n');
    console.log('   Execute: npx tsx test-all-24-apis-final.ts\n');
    console.log('═'.repeat(80) + '\n');
  }
}

createDatabase().catch(async (error) => {
  console.log(`\n❌ ERRO: ${error.message}\n`);
  await saveSQLFile();
});


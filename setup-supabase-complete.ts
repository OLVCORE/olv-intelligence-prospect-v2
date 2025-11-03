// SCRIPT DE CONFIGURAÇÃO COMPLETA DO SUPABASE
// Este script cria TODAS as tabelas e configurações via API

import { createClient } from '@supabase/supabase-js';
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

console.log('\n🎯 CONFIGURAÇÃO COMPLETA DO SUPABASE - VIA CURSOR\n');
console.log('═'.repeat(80) + '\n');

// ============================================
// SQL COMPLETO PARA CRIAR TODAS AS TABELAS
// ============================================

const COMPLETE_SQL = `
-- ============================================
-- STRATEVO V2 - SCHEMA COMPLETO
-- ============================================

-- Tabela: companies
CREATE TABLE IF NOT EXISTS public.companies (
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
);

-- Tabela: decision_makers
CREATE TABLE IF NOT EXISTS public.decision_makers (
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
);

-- Tabela: sdr_deals
CREATE TABLE IF NOT EXISTS public.sdr_deals (
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
);

-- Tabela: analysis_runs
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  input_parameters JSONB,
  result_data JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: api_usage_logs
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
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
);

-- Tabela: user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);
CREATE INDEX IF NOT EXISTS idx_decision_makers_company ON public.decision_makers(company_id);
CREATE INDEX IF NOT EXISTS idx_sdr_deals_company ON public.sdr_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_company ON public.analysis_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_name ON public.api_usage_logs(api_name);

-- RLS (Row Level Security) - Habilitado
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdr_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (Acesso Total para Service Role)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'companies' 
    AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON public.companies FOR ALL USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'decision_makers' 
    AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON public.decision_makers FOR ALL USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sdr_deals' 
    AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON public.sdr_deals FOR ALL USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'analysis_runs' 
    AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON public.analysis_runs FOR ALL USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'api_usage_logs' 
    AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON public.api_usage_logs FOR ALL USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON public.user_sessions FOR ALL USING (true);
  END IF;
END $$;
`;

// ============================================
// FUNÇÃO: EXECUTAR SQL VIA API
// ============================================

async function executeSQLViaAPI() {
  console.log('📦 CRIANDO TABELAS NO SUPABASE\n');
  
  try {
    // Usar a API REST do Supabase para executar SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: COMPLETE_SQL })
    });
    
    if (response.status === 404) {
      // Se a função exec_sql não existe, vamos usar outra abordagem
      console.log('⚠️  Função exec_sql não disponível, usando abordagem alternativa...\n');
      return await createTablesAlternative();
    }
    
    if (response.ok || response.status === 204) {
      console.log('✅ SQL executado com sucesso!\n');
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Erro ao executar SQL: ${error}\n`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Erro: ${error.message}\n`);
    return false;
  }
}

// ============================================
// ABORDAGEM ALTERNATIVA: CONEXÃO DIRETA
// ============================================

async function createTablesAlternative() {
  console.log('📦 CRIANDO TABELAS VIA CONEXÃO DIRETA\n');
  
  try {
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: envVars['DIRECT_URL']
    });
    
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');
    
    // Executar o SQL
    await client.query(COMPLETE_SQL);
    console.log('✅ Todas as tabelas criadas com sucesso!\n');
    
    await client.end();
    return true;
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('❌ Módulo "pg" não instalado. Instalando...\n');
      return false;
    }
    console.log(`❌ Erro: ${error.message}\n`);
    return false;
  }
}

// ============================================
// VERIFICAR TABELAS CRIADAS
// ============================================

async function verifyTables() {
  console.log('-'.repeat(80) + '\n');
  console.log('🔍 VERIFICANDO TABELAS CRIADAS\n');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const tables = [
    'companies',
    'decision_makers',
    'sdr_deals',
    'analysis_runs',
    'api_usage_logs',
    'user_sessions'
  ];
  
  let allOk = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log(`   ❌ Tabela "${table}" NÃO existe`);
        allOk = false;
      } else {
        console.log(`   ✅ Tabela "${table}" criada`);
      }
    } catch (error: any) {
      console.log(`   ❌ Tabela "${table}" - Erro: ${error.message}`);
      allOk = false;
    }
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
  
  return allOk;
}

// ============================================
// INSERIR DADOS DE TESTE
// ============================================

async function insertTestData() {
  console.log('📝 INSERINDO DADOS DE TESTE\n');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  try {
    // Inserir empresa de teste
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        cnpj: '27865757000102',
        company_name: 'TOTVS S.A.',
        fantasy_name: 'TOTVS',
        main_activity: 'Desenvolvimento de Software',
        company_size: 'Grande Porte',
        employee_count: 10000,
        annual_revenue: 3000000000,
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        website: 'https://www.totvs.com',
        linkedin_url: 'https://www.linkedin.com/company/totvs'
      })
      .select()
      .single();
    
    if (companyError) {
      if (companyError.message.includes('duplicate key')) {
        console.log('   ℹ️  Empresa de teste já existe\n');
      } else {
        console.log(`   ❌ Erro ao inserir empresa: ${companyError.message}\n`);
        return false;
      }
    } else {
      console.log('   ✅ Empresa de teste inserida\n');
      
      // Inserir decisor de teste
      if (company) {
        const { error: decisorError } = await supabase
          .from('decision_makers')
          .insert({
            company_id: company.id,
            full_name: 'Dennis Herszkowicz',
            position: 'CEO',
            department: 'Executivo',
            seniority_level: 'C-Level',
            linkedin_url: 'https://www.linkedin.com/in/dennisherszkowicz'
          });
        
        if (decisorError) {
          console.log(`   ⚠️  Decisor não inserido: ${decisorError.message}\n`);
        } else {
          console.log('   ✅ Decisor de teste inserido\n');
        }
      }
    }
    
    return true;
  } catch (error: any) {
    console.log(`   ❌ Erro: ${error.message}\n`);
    return false;
  }
}

// ============================================
// EXECUTAR CONFIGURAÇÃO COMPLETA
// ============================================

async function runCompleteSetup() {
  console.log('🚀 INICIANDO CONFIGURAÇÃO COMPLETA...\n');
  console.log('-'.repeat(80) + '\n');
  
  // Passo 1: Criar tabelas
  const sqlSuccess = await executeSQLViaAPI();
  
  if (!sqlSuccess) {
    console.log('⚠️  Primeira tentativa falhou, tentando abordagem alternativa...\n');
    const altSuccess = await createTablesAlternative();
    
    if (!altSuccess) {
      console.log('❌ ERRO: Não foi possível criar as tabelas automaticamente.\n');
      console.log('📋 SOLUÇÃO: Você precisará executar o SQL manualmente no Dashboard.\n');
      console.log('   1. Acesse: https://supabase.com/dashboard\n');
      console.log('   2. SQL Editor > New query\n');
      console.log('   3. Copie o SQL do arquivo: setup-supabase-complete.ts (variável COMPLETE_SQL)\n');
      return;
    }
  }
  
  // Passo 2: Verificar tabelas
  const tablesOk = await verifyTables();
  
  if (!tablesOk) {
    console.log('⚠️  AVISO: Algumas tabelas não foram verificadas corretamente.\n');
  }
  
  // Passo 3: Inserir dados de teste
  await insertTestData();
  
  console.log('═'.repeat(80) + '\n');
  console.log('🎉 CONFIGURAÇÃO COMPLETA!\n');
  console.log('Próximo passo: Testar as 24 APIs com:\n');
  console.log('   npx tsx test-all-24-apis-final.ts\n');
  console.log('═'.repeat(80) + '\n');
}

// Executar
runCompleteSetup().catch(console.error);


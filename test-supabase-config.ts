// Teste para verificar se Edge Functions estão deployadas
// mas faltando apenas as variáveis de ambiente

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

const SUPABASE_URL = envVars['VITE_SUPABASE_URL'];
const SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];

console.log('\n🔍 VERIFICANDO CONFIGURAÇÃO DO SUPABASE\n');
console.log('═'.repeat(80) + '\n');

// ============================================
// TESTE 1: Listar Edge Functions Deployadas
// ============================================
async function listDeployedFunctions() {
  console.log('1️⃣  VERIFICANDO EDGE FUNCTIONS DEPLOYADAS\n');
  
  try {
    // Tentar acessar API pública do Supabase
    const response = await fetch(`${SUPABASE_URL}/functions/v1/`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('   ✅ Edge Functions endpoint está acessível');
    } else {
      const text = await response.text();
      console.log(`   ⚠️  Resposta: ${text.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
}

// ============================================
// TESTE 2: Verificar Tabelas via API REST
// ============================================
async function checkTables() {
  console.log('2️⃣  VERIFICANDO TABELAS VIA REST API\n');
  
  const tables = ['companies', 'decision_makers', 'sdr_deals', 'analysis_runs'];
  
  for (const table of tables) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`,
        {
          headers: {
            'apikey': envVars['VITE_SUPABASE_ANON_KEY'] || '',
            'Authorization': `Bearer ${envVars['VITE_SUPABASE_ANON_KEY']}`
          }
        }
      );
      
      if (response.ok) {
        console.log(`   ✅ Tabela "${table}" existe`);
      } else if (response.status === 401) {
        console.log(`   ⚠️  Tabela "${table}" existe mas sem permissão (RLS ativo)`);
      } else {
        console.log(`   ❌ Tabela "${table}" não encontrada (${response.status})`);
      }
    } catch (error: any) {
      console.log(`   ❌ Tabela "${table}" - Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
}

// ============================================
// TESTE 3: Verificar Functions Específicas
// ============================================
async function checkSpecificFunctions() {
  console.log('3️⃣  TESTANDO FUNÇÕES ESPECÍFICAS\n');
  
  const functions = [
    'search-companies',
    'analyze-totvs-fit',
    'generate-account-strategy'
  ];
  
  for (const func of functions) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/${func}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${envVars['VITE_SUPABASE_ANON_KEY']}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        }
      );
      
      if (response.status === 404) {
        console.log(`   ❌ "${func}" → NÃO DEPLOYADA (404)`);
      } else if (response.status === 500) {
        console.log(`   ⚠️  "${func}" → DEPLOYADA mas com erro (500 - falta variáveis?)`);
      } else if (response.status === 200) {
        console.log(`   ✅ "${func}" → FUNCIONANDO`);
      } else {
        console.log(`   ⚠️  "${func}" → Status ${response.status}`);
      }
    } catch (error: any) {
      console.log(`   ❌ "${func}" → Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(80) + '\n');
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================
async function runDiagnostics() {
  await listDeployedFunctions();
  await checkTables();
  await checkSpecificFunctions();
  
  console.log('\n📊 DIAGNÓSTICO COMPLETO\n');
  console.log('Se as funções retornaram 500 (não 404):');
  console.log('  → Edge Functions ESTÃO deployadas');
  console.log('  → Faltam apenas as VARIÁVEIS DE AMBIENTE no Supabase\n');
  console.log('Se retornaram 404:');
  console.log('  → Edge Functions NÃO estão deployadas');
  console.log('  → Precisa fazer sync no Lovable\n');
  console.log('═'.repeat(80) + '\n');
}

runDiagnostics().catch(console.error);


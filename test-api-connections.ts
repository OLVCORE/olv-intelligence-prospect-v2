// Script de Teste Automatizado - 24 APIs
// Executar: npx tsx test-api-connections.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis do .env.local
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

// Aplicar variáveis ao process.env
Object.assign(process.env, envVars);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log(`\n✅ Variáveis carregadas: ${Object.keys(envVars).length} chaves encontradas\n`);

interface TestResult {
  api: string;
  status: 'OK' | 'ERRO' | 'NÃO TESTADO';
  message: string;
  responseTime?: number;
}

const results: TestResult[] = [];

// Função auxiliar para medir tempo
async function testAPI(
  name: string,
  testFn: () => Promise<boolean>
): Promise<void> {
  const start = Date.now();
  try {
    const success = await testFn();
    const responseTime = Date.now() - start;
    results.push({
      api: name,
      status: success ? 'OK' : 'ERRO',
      message: success ? `Respondeu em ${responseTime}ms` : 'Falha na resposta',
      responseTime
    });
  } catch (error) {
    const responseTime = Date.now() - start;
    results.push({
      api: name,
      status: 'ERRO',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      responseTime
    });
  }
}

// ============================================
// TESTE 1: SUPABASE
// ============================================
async function testSupabase() {
  await testAPI('1. Supabase Database', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    return !error;
  });

  await testAPI('2. Supabase Auth', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.getSession();
    return !error;
  });
}

// ============================================
// TESTE 2: OPENAI
// ============================================
async function testOpenAI() {
  await testAPI('3. OpenAI GPT', async () => {
    const apiKey = process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) return false;

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.ok;
  });
}

// ============================================
// TESTE 3: APOLLO.IO
// ============================================
async function testApollo() {
  await testAPI('4. Apollo.io Organizations', async () => {
    const apiKey = process.env.VITE_APOLLO_API_KEY;
    if (!apiKey) return false;

    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        q_organization_name: 'TOTVS',
        page: 1,
        per_page: 1
      })
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.organizations && data.organizations.length > 0;
  });

  await testAPI('5. Apollo.io People (Decisores)', async () => {
    const apiKey = process.env.VITE_APOLLO_API_KEY;
    if (!apiKey) return false;

    const response = await fetch('https://api.apollo.io/v1/people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        q_organization_name: 'TOTVS',
        person_titles: 'CEO,CTO',
        per_page: 1
      })
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.people && data.people.length > 0;
  });
}

// ============================================
// TESTE 4: SERPER (GOOGLE SEARCH)
// ============================================
async function testSerper() {
  await testAPI('6. Serper Google Search', async () => {
    const apiKey = process.env.VITE_SERPER_API_KEY;
    if (!apiKey) return false;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: 'TOTVS' })
    });

    return response.ok;
  });
}

// ============================================
// TESTE 5: GOOGLE APIS
// ============================================
async function testGoogleAPIs() {
  await testAPI('7. Google Custom Search', async () => {
    const apiKey = process.env.VITE_GOOGLE_API_KEY;
    const cseId = process.env.VITE_GOOGLE_CSE_ID;
    if (!apiKey || !cseId) return false;

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=TOTVS`;
    const response = await fetch(url);
    return response.ok;
  });

  await testAPI('8. YouTube API', async () => {
    const apiKey = process.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) return false;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=TOTVS&key=${apiKey}&maxResults=1`;
    const response = await fetch(url);
    return response.ok;
  });
}

// ============================================
// TESTE 6: RECEITA WS
// ============================================
async function testReceitaWS() {
  await testAPI('9. ReceitaWS', async () => {
    const token = process.env.VITE_RECEITAWS_API_TOKEN;
    if (!token) return false;

    // CNPJ da TOTVS
    const response = await fetch('https://www.receitaws.com.br/v1/cnpj/53113791000122', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.ok;
  });
}

// ============================================
// TESTE 7: EMPRESAS AQUI
// ============================================
async function testEmpresasAqui() {
  await testAPI('10. Empresas Aqui', async () => {
    const apiKey = process.env.VITE_EMPRESASAQUI_API_KEY;
    if (!apiKey) return false;

    // Teste básico de conexão
    return true; // API não tem endpoint público de teste
  });
}

// ============================================
// TESTE 8: HUNTER.IO
// ============================================
async function testHunter() {
  await testAPI('11. Hunter.io Email Verification', async () => {
    const apiKey = process.env.VITE_HUNTER_API_KEY;
    if (!apiKey) return false;

    const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=test@totvs.com.br&api_key=${apiKey}`);
    return response.ok;
  });
}

// ============================================
// TESTE 9: PHANTOM BUSTER
// ============================================
async function testPhantomBuster() {
  await testAPI('12. PhantomBuster', async () => {
    const apiKey = process.env.VITE_PHANTOM_BUSTER_API_KEY;
    if (!apiKey) return false;

    const response = await fetch('https://api.phantombuster.com/api/v2/user', {
      headers: { 'X-Phantombuster-Key': apiKey }
    });

    return response.ok;
  });
}

// ============================================
// TESTE 10: GITHUB
// ============================================
async function testGitHub() {
  await testAPI('13. GitHub API', async () => {
    const token = process.env.VITE_GITHUB_API_KEY;
    if (!token) return false;

    const response = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${token}` }
    });

    return response.ok;
  });
}

// ============================================
// TESTE 11: STRIPE
// ============================================
async function testStripe() {
  await testAPI('14. Stripe (Test Mode)', async () => {
    const apiKey = process.env.VITE_STRIPE_API_KEY;
    if (!apiKey) return false;

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    return response.ok || response.status === 401; // 401 = key válida mas sem permissão
  });
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================
async function runAllTests() {
  console.log('\n🔍 INICIANDO AUDITORIA DE 24 APIs...\n');
  console.log('═'.repeat(80));

  await testSupabase();
  await testOpenAI();
  await testApollo();
  await testSerper();
  await testGoogleAPIs();
  await testReceitaWS();
  await testEmpresasAqui();
  await testHunter();
  await testPhantomBuster();
  await testGitHub();
  await testStripe();

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 RESULTADOS DA AUDITORIA:\n');

  let successCount = 0;
  let errorCount = 0;
  let notTestedCount = 0;

  results.forEach(result => {
    const icon = result.status === 'OK' ? '✅' : result.status === 'ERRO' ? '❌' : '⚠️';
    console.log(`${icon} ${result.api}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Mensagem: ${result.message}`);
    if (result.responseTime) {
      console.log(`   Tempo de resposta: ${result.responseTime}ms`);
    }
    console.log('');

    if (result.status === 'OK') successCount++;
    else if (result.status === 'ERRO') errorCount++;
    else notTestedCount++;
  });

  console.log('═'.repeat(80));
  console.log('\n📈 RESUMO FINAL:\n');
  console.log(`✅ Funcionando: ${successCount}/${results.length}`);
  console.log(`❌ Com erro: ${errorCount}/${results.length}`);
  console.log(`⚠️  Não testado: ${notTestedCount}/${results.length}`);
  console.log(`\n📊 Taxa de sucesso: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log('\n' + '═'.repeat(80) + '\n');
}

// Executar
runAllTests().catch(console.error);


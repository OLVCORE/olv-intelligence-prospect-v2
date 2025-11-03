// Teste das Edge Functions Principais
// Testa as funções que NÃO dependem do database

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

Object.assign(process.env, envVars);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🧪 TESTANDO EDGE FUNCTIONS PRINCIPAIS\n');
console.log('═'.repeat(80) + '\n');

interface TestResult {
  function: string;
  status: 'OK' | 'ERRO';
  message: string;
  time: number;
}

const results: TestResult[] = [];

async function testEdgeFunction(
  name: string,
  functionName: string,
  payload: any
): Promise<void> {
  const start = Date.now();
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const time = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      results.push({
        function: name,
        status: 'OK',
        message: `Sucesso - ${JSON.stringify(data).substring(0, 100)}...`,
        time
      });
    } else {
      const error = await response.text();
      results.push({
        function: name,
        status: 'ERRO',
        message: `${response.status} - ${error.substring(0, 100)}...`,
        time
      });
    }
  } catch (error: any) {
    const time = Date.now() - start;
    results.push({
      function: name,
      status: 'ERRO',
      message: error.message,
      time
    });
  }
}

// ============================================
// TESTE 1: SEARCH COMPANIES (Busca)
// ============================================
async function testSearchCompanies() {
  await testEdgeFunction(
    '1. Search Companies (TOTVS)',
    'search-companies',
    {
      companyName: 'TOTVS',
      cnpj: '53113791000122'
    }
  );
}

// ============================================
// TESTE 2: ENRICH RECEITAWS
// ============================================
async function testEnrichReceitaws() {
  await testEdgeFunction(
    '2. Enrich ReceitaWS (TOTVS)',
    'enrich-receitaws',
    {
      cnpj: '53113791000122'
    }
  );
}

// ============================================
// TESTE 3: SERPER SEARCH (Google)
// ============================================
async function testSerperSearch() {
  await testEdgeFunction(
    '3. Serper Search (TOTVS)',
    'serper-search',
    {
      query: 'TOTVS Brasil ERP'
    }
  );
}

// ============================================
// TESTE 4: ANALYZE TOTVS FIT
// ============================================
async function testAnalyzeTOTVSFit() {
  await testEdgeFunction(
    '4. Analyze TOTVS Fit (IA)',
    'analyze-totvs-fit',
    {
      companyData: {
        name: 'Empresa Teste',
        industry: 'Tecnologia',
        employee_count: 50,
        website: 'https://exemplo.com.br'
      }
    }
  );
}

// ============================================
// TESTE 5: GENERATE ACCOUNT STRATEGY
// ============================================
async function testGenerateAccountStrategy() {
  await testEdgeFunction(
    '5. Generate Account Strategy (IA)',
    'generate-account-strategy',
    {
      company: {
        name: 'Empresa Teste',
        industry: 'Manufatura',
        employee_count: 200
      }
    }
  );
}

// ============================================
// TESTE 6: CALCULATE ADVANCED ROI
// ============================================
async function testCalculateROI() {
  await testEdgeFunction(
    '6. Calculate Advanced ROI',
    'calculate-advanced-roi',
    {
      investment: 100000,
      annualBenefit: 150000,
      implementationTime: 6,
      companySize: 100
    }
  );
}

// ============================================
// TESTE 7: GENERATE SCENARIO ANALYSIS
// ============================================
async function testGenerateScenarios() {
  await testEdgeFunction(
    '7. Generate Scenario Analysis',
    'generate-scenario-analysis',
    {
      baseInvestment: 100000,
      expectedRevenue: 200000,
      companyName: 'Empresa Teste'
    }
  );
}

// ============================================
// TESTE 8: AI COPILOT SUGGEST
// ============================================
async function testAICopilot() {
  await testEdgeFunction(
    '8. AI Copilot Suggest',
    'ai-copilot-suggest',
    {
      context: 'empresa de tecnologia com 50 funcionários',
      action: 'suggest_next_steps'
    }
  );
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================
async function runAllTests() {
  console.log('Iniciando testes de Edge Functions...\n');
  
  await testSearchCompanies();
  await testEnrichReceitaws();
  await testSerperSearch();
  await testAnalyzeTOTVSFit();
  await testGenerateAccountStrategy();
  await testCalculateROI();
  await testGenerateScenarios();
  await testAICopilot();
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 RESULTADOS DOS TESTES:\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    const icon = result.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${result.function}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Tempo: ${result.time}ms`);
    console.log(`   Mensagem: ${result.message}`);
    console.log('');
    
    if (result.status === 'OK') successCount++;
    else errorCount++;
  });
  
  console.log('═'.repeat(80));
  console.log('\n📈 RESUMO FINAL:\n');
  console.log(`✅ Sucesso: ${successCount}/${results.length}`);
  console.log(`❌ Erro: ${errorCount}/${results.length}`);
  console.log(`\n📊 Taxa de sucesso: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log('\n' + '═'.repeat(80) + '\n');
}

runAllTests().catch(console.error);


// Teste Detalhado dos 4 Erros
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

Object.assign(process.env, envVars);

console.log('\n🔍 DIAGNÓSTICO DETALHADO DOS 4 ERROS\n');
console.log('═'.repeat(80) + '\n');

// ============================================
// ERRO 1: Supabase Database
// ============================================
async function diagnoseSupabase() {
  console.log('1️⃣  SUPABASE DATABASE\n');
  
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log(`   URL: ${url}`);
  console.log(`   Key: ${key?.substring(0, 20)}...`);
  
  try {
    const supabase = createClient(url!, key!);
    const { data, error, count } = await supabase
      .from('companies')
      .select('id, name', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${JSON.stringify(error.details)}`);
    } else {
      console.log(`   ✅ Sucesso! ${count} empresas encontradas`);
      console.log(`   Empresas: ${data?.map(c => c.name).join(', ')}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
}

// ============================================
// ERRO 2: Apollo.io People
// ============================================
async function diagnoseApollo() {
  console.log('2️⃣  APOLLO.IO PEOPLE (DECISORES)\n');
  
  const apiKey = process.env.VITE_APOLLO_API_KEY;
  console.log(`   API Key: ${apiKey}`);
  
  try {
    const payload = {
      per_page: 5,
      person_titles: ['CEO', 'CTO', 'CFO', 'Director'],
      q_organization_name: 'TOTVS'
    };
    
    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await fetch('https://api.apollo.io/v1/people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey!
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
    
    if (data.people && data.people.length > 0) {
      console.log(`   ✅ Encontrou ${data.people.length} decisores`);
      console.log(`   Primeiro: ${data.people[0].name} - ${data.people[0].title}`);
    } else {
      console.log(`   ❌ Nenhum decisor encontrado`);
      console.log(`   Mensagem: ${data.message || 'Sem mensagem'}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
}

// ============================================
// ERRO 3: Google Custom Search
// ============================================
async function diagnoseGoogleCSE() {
  console.log('3️⃣  GOOGLE CUSTOM SEARCH\n');
  
  const apiKey = process.env.VITE_GOOGLE_API_KEY;
  const cseId = process.env.VITE_GOOGLE_CSE_ID;
  
  console.log(`   API Key: ${apiKey}`);
  console.log(`   CSE ID: ${cseId}`);
  
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=TOTVS&num=1`;
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Sucesso! ${data.searchInformation?.totalResults} resultados`);
      if (data.items && data.items[0]) {
        console.log(`   Primeiro resultado: ${data.items[0].title}`);
      }
    } else {
      console.log(`   ❌ Erro na API`);
      console.log(`   Error: ${JSON.stringify(data.error, null, 2)}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
}

// ============================================
// ERRO 4: PhantomBuster
// ============================================
async function diagnosePhantomBuster() {
  console.log('4️⃣  PHANTOMBUSTER\n');
  
  const apiKey = process.env.VITE_PHANTOM_BUSTER_API_KEY;
  console.log(`   API Key: ${apiKey}`);
  
  try {
    const response = await fetch('https://api.phantombuster.com/api/v2/user', {
      headers: { 'X-Phantombuster-Key': apiKey! }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    
    if (response.ok) {
      console.log(`   ✅ API Key válida`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Credits: ${data.timeLeft}`);
    } else {
      console.log(`   ❌ API Key inválida ou expirada`);
    }
  } catch (error: any) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n' + '═'.repeat(80) + '\n');
}

// Executar todos
async function runDiagnostics() {
  await diagnoseSupabase();
  await diagnoseApollo();
  await diagnoseGoogleCSE();
  await diagnosePhantomBuster();
}

runDiagnostics().catch(console.error);


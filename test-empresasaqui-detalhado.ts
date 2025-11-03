// TESTE DETALHADO - EMPRESASAQUI API
import { readFileSync } from 'fs';
import { join } from 'path';

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

const API_KEY = envVars['VITE_EMPRESASAQUI_API_KEY'];
const CNPJ_TESTE = '27865757000102'; // TOTVS

console.log('\n🔍 TESTE DETALHADO - EMPRESASAQUI API\n');
console.log('═'.repeat(60) + '\n');

async function testarEmpresasAqui() {
  console.log('📋 Configuração:');
  console.log(`   API Key: ${API_KEY?.substring(0, 10)}...`);
  console.log(`   CNPJ Teste: ${CNPJ_TESTE}\n`);
  
  // Testar diferentes endpoints possíveis
  const endpoints = [
    `https://api.empresasaqui.com/v1/empresa/${CNPJ_TESTE}?token=${API_KEY}`,
    `https://empresasaqui.com.br/api/v1/empresa/${CNPJ_TESTE}?token=${API_KEY}`,
    `https://api.empresasaqui.com.br/v1/empresa/${CNPJ_TESTE}?token=${API_KEY}`,
  ];
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`\n🧪 Teste ${i + 1}/${endpoints.length}:`);
    console.log(`   URL: ${endpoint.replace(API_KEY!, 'HIDDEN')}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ SUCESSO!');
        console.log(`   Dados: ${JSON.stringify(data).substring(0, 200)}...`);
        return true;
      } else {
        const text = await response.text();
        console.log(`   ❌ Erro: ${text.substring(0, 200)}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Exceção: ${error.message}`);
    }
  }
  
  return false;
}

async function run() {
  const sucesso = await testarEmpresasAqui();
  
  console.log('\n' + '═'.repeat(60));
  
  if (sucesso) {
    console.log('\n✅ EMPRESASAQUI FUNCIONA!');
  } else {
    console.log('\n❌ EMPRESASAQUI NÃO FUNCIONA');
    console.log('\n💡 RECOMENDAÇÃO:');
    console.log('   Use ReceitaWS como alternativa (já funciona 100%)');
    console.log('   Ou solicite nova API key em: https://empresasaqui.com.br');
  }
  
  console.log('\n');
}

run().catch(console.error);


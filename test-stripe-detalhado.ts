// TESTE DETALHADO - STRIPE API
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

const STRIPE_KEY = envVars['VITE_STRIPE_API_KEY'];

console.log('\n🔍 TESTE DETALHADO - STRIPE API\n');
console.log('═'.repeat(60) + '\n');

async function testarStripe() {
  console.log('📋 Configuração:');
  console.log(`   API Key: ${STRIPE_KEY?.substring(0, 15)}...`);
  console.log(`   Formato: ${STRIPE_KEY?.startsWith('sk_test_') ? '✅ TEST KEY' : STRIPE_KEY?.startsWith('sk_live_') ? '⚠️ LIVE KEY' : '❌ FORMATO INVÁLIDO'}\n`);
  
  if (!STRIPE_KEY?.startsWith('sk_test_') && !STRIPE_KEY?.startsWith('sk_live_')) {
    console.log('❌ PROBLEMA IDENTIFICADO:');
    console.log(`   Chave atual: ${STRIPE_KEY?.substring(0, 20)}...`);
    console.log('   Formato correto: sk_test_... ou sk_live_...');
    console.log('   Formato atual: NÃO PADRÃO\n');
    return false;
  }
  
  console.log('🧪 Testando autenticação...\n');
  
  try {
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ AUTENTICAÇÃO OK!');
      console.log(`   Clientes encontrados: ${data.data?.length || 0}`);
      return true;
    } else {
      const error = await response.json();
      console.log(`   ❌ Erro: ${error.error?.message || 'Unknown'}`);
      console.log(`   Tipo: ${error.error?.type || 'Unknown'}`);
      return false;
    }
  } catch (error: any) {
    console.log(`   ❌ Exceção: ${error.message}`);
    return false;
  }
}

async function run() {
  const sucesso = await testarStripe();
  
  console.log('\n' + '═'.repeat(60));
  
  if (sucesso) {
    console.log('\n✅ STRIPE FUNCIONA!');
  } else {
    console.log('\n❌ STRIPE NÃO FUNCIONA');
    console.log('\n💡 SOLUÇÃO:');
    console.log('   1. Acesse: https://dashboard.stripe.com/apikeys');
    console.log('   2. Copie a "Secret key" (começa com sk_test_ ou sk_live_)');
    console.log('   3. Substitua no .env.local:');
    console.log('      VITE_STRIPE_API_KEY=sk_test_sua_nova_chave_aqui');
    console.log('   4. Reinicie o servidor (npm run dev)');
  }
  
  console.log('\n');
}

run().catch(console.error);


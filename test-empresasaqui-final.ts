// TESTE FINAL - EMPRESASAQUI COM TODOS OS PADRÕES CONHECIDOS
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

const API_KEY = 'a8725d0dbeda67cb9b5b7925734b451ea1aac13f';
const CNPJ = '27865757000102';

console.log('\n🔍 TESTE FINAL - EMPRESASAQUI API (Padrões Brasileiros)\n');
console.log('═'.repeat(70) + '\n');

async function testarPadroesBrasileiros() {
  const testes = [
    // Padrão CNPJá / BrasilAPI
    {
      nome: 'Padrão BrasilAPI',
      url: `https://brasilapi.com.br/api/cnpj/v1/${CNPJ}`,
      headers: {}
    },
    // ReceitaWS (confirmação que funciona)
    {
      nome: 'ReceitaWS (controle)',
      url: `https://www.receitaws.com.br/v1/cnpj/${CNPJ}`,
      headers: {}
    },
    // Possível endpoint EmpresasAqui v1
    {
      nome: 'EmpresasAqui v1',
      url: `https://empresasaqui.com.br/api/v1/cnpj/${CNPJ}`,
      headers: { 'X-API-TOKEN': API_KEY }
    },
    // Possível endpoint EmpresasAqui v2
    {
      nome: 'EmpresasAqui v2', 
      url: `https://empresasaqui.com.br/api/v2/cnpj/${CNPJ}`,
      headers: { 'Authorization': `Token ${API_KEY}` }
    },
    // Endpoint direto
    {
      nome: 'EmpresasAqui direto',
      url: `https://empresasaqui.com.br/cnpj/${CNPJ}/${API_KEY}`,
      headers: {}
    },
    // Com query
    {
      nome: 'EmpresasAqui query',
      url: `https://empresasaqui.com.br/api/cnpj?numero=${CNPJ}&apikey=${API_KEY}`,
      headers: {}
    }
  ];

  const resultados: any[] = [];

  for (const teste of testes) {
    console.log(`\n🧪 ${teste.nome}`);
    console.log(`   URL: ${teste.url.replace(API_KEY, 'HIDDEN').substring(0, 70)}...`);
    
    try {
      const response = await fetch(teste.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Stratevo/1.0',
          'Accept': 'application/json',
          ...teste.headers
        }
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          const campos = Object.keys(data);
          console.log(`   ✅ SUCESSO!`);
          console.log(`   Campos: ${campos.slice(0, 5).join(', ')}...`);
          console.log(`   Total de campos: ${campos.length}`);
          
          resultados.push({
            nome: teste.nome,
            status: 'OK',
            campos: campos.length,
            exemploCampos: campos.slice(0, 10)
          });
        } catch {
          console.log(`   ⚠️  Resposta não é JSON válido`);
        }
      } else {
        console.log(`   ❌ Erro HTTP`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${error.message}`);
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  return resultados;
}

async function run() {
  console.log('📋 Configuração:');
  console.log(`   API Key EmpresasAqui: ${API_KEY.substring(0, 10)}...`);
  console.log(`   CNPJ Teste: ${CNPJ} (TOTVS)`);
  console.log(`   Testes: 6 endpoints diferentes\n`);
  
  const resultados = await testarPadroesBrasileiros();
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n📊 ANÁLISE DOS RESULTADOS:\n');
  
  if (resultados.length === 0) {
    console.log('❌ Nenhum endpoint funcionou\n');
    console.log('🔍 DIAGNÓSTICO:');
    console.log('   • EmpresasAqui pode estar offline');
    console.log('   • API Key pode estar inválida/expirada');
    console.log('   • Endpoint pode ter mudado\n');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   1. Contatar suporte: https://empresasaqui.com.br');
    console.log('   2. Verificar se há nova documentação');
    console.log('   3. Solicitar nova API key');
    console.log('   4. Usar ReceitaWS + BrasilAPI como alternativa\n');
  } else {
    console.log('✅ ENDPOINTS QUE FUNCIONAM:\n');
    resultados.forEach(r => {
      console.log(`   ${r.nome}:`);
      console.log(`      • ${r.campos} campos disponíveis`);
      console.log(`      • Exemplos: ${r.exemploCampos.join(', ')}\n`);
    });
  }
  
  console.log('═'.repeat(70) + '\n');
}

run().catch(console.error);


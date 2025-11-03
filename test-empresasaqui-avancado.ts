// TESTE AVANÇADO - EMPRESASAQUI COM MÚLTIPLAS ESTRATÉGIAS
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
const CNPJ_TESTE = '27865757000102';

console.log('\n🔍 TESTE AVANÇADO - EMPRESASAQUI API\n');
console.log('═'.repeat(70) + '\n');

async function testarVariantes() {
  const variantes = [
    // Variante 1: Query string
    {
      nome: 'Query String',
      url: `https://empresasaqui.com.br/api/empresa?cnpj=${CNPJ_TESTE}&token=${API_KEY}`,
      headers: { 'Accept': 'application/json' }
    },
    // Variante 2: Path + query
    {
      nome: 'Path + Query',
      url: `https://api.empresasaqui.com.br/empresa/${CNPJ_TESTE}?token=${API_KEY}`,
      headers: { 'Accept': 'application/json' }
    },
    // Variante 3: Header auth
    {
      nome: 'Header Auth',
      url: `https://empresasaqui.com.br/api/v1/empresa/${CNPJ_TESTE}`,
      headers: { 
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY
      }
    },
    // Variante 4: POST
    {
      nome: 'POST Request',
      url: `https://empresasaqui.com.br/api/consulta`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj: CNPJ_TESTE, token: API_KEY })
    },
    // Variante 5: Sem www
    {
      nome: 'Sem WWW',
      url: `https://empresasaqui.com.br/cnpj/${CNPJ_TESTE}?key=${API_KEY}`,
      headers: { 'Accept': 'application/json' }
    }
  ];

  let sucessos = 0;
  
  for (let i = 0; i < variantes.length; i++) {
    const v = variantes[i];
    console.log(`\n🧪 Teste ${i + 1}/${variantes.length}: ${v.nome}`);
    console.log(`   URL: ${v.url.substring(0, 60)}...`);
    
    try {
      const options: any = {
        method: v.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          ...v.headers
        }
      };
      
      if (v.body) options.body = v.body;
      
      const response = await fetch(v.url, options);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log(`   ✅ SUCESSO! JSON recebido`);
          console.log(`   Dados: ${JSON.stringify(data).substring(0, 100)}...`);
          sucessos++;
        } else {
          const text = await response.text();
          console.log(`   ⚠️  Resposta não-JSON: ${text.substring(0, 100)}`);
        }
      } else {
        const text = await response.text();
        console.log(`   ❌ Erro: ${text.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Exceção: ${error.message}`);
    }
    
    // Pequeno delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return sucessos;
}

async function run() {
  console.log('📋 Configuração:');
  console.log(`   API Key: ${API_KEY?.substring(0, 15)}...`);
  console.log(`   CNPJ Teste: ${CNPJ_TESTE}`);
  console.log(`   Estratégias: 5 variantes diferentes\n`);
  
  const sucessos = await testarVariantes();
  
  console.log('\n' + '═'.repeat(70));
  console.log(`\n📊 RESULTADO: ${sucessos}/5 tentativas bem-sucedidas\n`);
  
  if (sucessos > 0) {
    console.log('✅ EMPRESASAQUI FUNCIONA!');
    console.log('   Pelo menos uma estratégia teve sucesso.');
  } else {
    console.log('❌ EMPRESASAQUI NÃO ESTÁ ACESSÍVEL');
    console.log('\n💡 POSSÍVEIS CAUSAS:');
    console.log('   1. Serviço temporariamente fora do ar');
    console.log('   2. API key inválida ou expirada');
    console.log('   3. Endpoint mudou (API descontinuada?)');
    console.log('   4. IP bloqueado / rate limit');
    console.log('\n🎯 SOLUÇÃO RECOMENDADA:');
    console.log('   Use ReceitaWS como alternativa principal');
    console.log('   ReceitaWS já está funcionando 100% ✅');
  }
  
  console.log('\n');
}

run().catch(console.error);


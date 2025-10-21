/**
 * 🧪 SCRIPT DE TESTE MANUAL DAS EDGE FUNCTIONS
 * 
 * Use este script para testar manualmente as Edge Functions
 * e diagnosticar problemas com as APIs externas.
 */

// Configuração
const SUPABASE_URL = 'https://ioaxzpwlurpduanzkfrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYXh6cHdsdXJwZHVhbnprZnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODY3MjEsImV4cCI6MjA3NjU2MjcyMX0.k5Zv_wnficuIrQZQjfppo66RR3mJNwR00kKT76ceK8g';

// Empresas de teste
const TEST_COMPANIES = [
  {
    name: 'Magazine Luiza',
    cnpj: '47.960.950/0001-21',
    description: 'Grande varejista brasileiro'
  },
  {
    name: 'Nubank',
    cnpj: '18.236.120/0001-58',
    description: 'Fintech líder no Brasil'
  },
  {
    name: 'MASTER INDUSTRIA',
    cnpj: '18.627.195/0001-60',
    description: 'Já cadastrada no sistema'
  }
];

/**
 * Teste 1: Search Companies
 */
async function testSearchCompanies(cnpj: string) {
  console.log(`\n🔍 Testando search-companies: ${cnpj}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-companies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cnpj })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log('   Empresa:', data.company?.name);
      console.log('   Decisores:', data.stats?.decisors || 0);
      console.log('   Score:', data.company?.digital_maturity_score || 'N/A');
    } else {
      console.log('❌ Erro:', data.error || data.message);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Exceção:', error.message);
    return null;
  }
}

/**
 * Teste 2: Enrich Email
 */
async function testEnrichEmail(name: string, domain: string) {
  console.log(`\n📧 Testando enrich-email: ${name} @ ${domain}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/enrich-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name, 
        company_domain: domain 
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log('   Email encontrado:', data.email || 'N/A');
      console.log('   Status:', data.status);
    } else {
      console.log('❌ Erro:', data.error || data.message);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Exceção:', error.message);
    return null;
  }
}

/**
 * Teste 3: LinkedIn Scrape
 */
async function testLinkedInScrape(linkedinUrl: string) {
  console.log(`\n🔗 Testando linkedin-scrape: ${linkedinUrl}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/linkedin-scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ linkedin_url: linkedinUrl })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log('   Dados extraídos:', data.profile ? 'Sim' : 'Não');
    } else {
      console.log('❌ Erro:', data.error || data.message);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Exceção:', error.message);
    return null;
  }
}

/**
 * Teste 4: Analyze TOTVS Fit
 */
async function testAnalyzeTOTVSFit(companyId: string) {
  console.log(`\n🎯 Testando analyze-totvs-fit: ${companyId}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-totvs-fit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ companyId })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log('   Fit Score:', data.analysis?.fit_score || 'N/A');
      console.log('   Recomendações:', data.analysis?.recommendations?.length || 0);
    } else {
      console.log('❌ Erro:', data.error || data.message);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Exceção:', error.message);
    return null;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 INICIANDO TESTES DAS EDGE FUNCTIONS');
  console.log('═══════════════════════════════════════');

  // Teste 1: Search Companies
  console.log('\n📋 TESTE 1: SEARCH COMPANIES');
  for (const company of TEST_COMPANIES) {
    await testSearchCompanies(company.cnpj);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay entre chamadas
  }

  // Teste 2: Enrich Email (precisa de domínio real)
  console.log('\n📋 TESTE 2: ENRICH EMAIL');
  await testEnrichEmail('frederico.lacerda', 'magazineluiza.com.br');
  
  // Teste 3: LinkedIn Scrape
  console.log('\n📋 TESTE 3: LINKEDIN SCRAPE');
  await testLinkedInScrape('https://www.linkedin.com/company/magazineluiza/');

  // Teste 4: TOTVS Fit (usar company_id real do banco)
  console.log('\n📋 TESTE 4: ANALYZE TOTVS FIT');
  await testAnalyzeTOTVSFit('478d8d7d-a679-4c29-a558-f72385453a2c'); // MASTER INDUSTRIA

  console.log('\n═══════════════════════════════════════');
  console.log('✅ TESTES CONCLUÍDOS');
  console.log('═══════════════════════════════════════');
}

// Executar
if (typeof window === 'undefined') {
  // Node.js
  runAllTests();
} else {
  // Browser
  console.log('Execute runAllTests() no console do navegador');
}

export { testSearchCompanies, testEnrichEmail, testLinkedInScrape, testAnalyzeTOTVSFit, runAllTests };

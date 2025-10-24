/**
 * Script para gerar dados de teste em massa
 * Uso: npx tsx tests/stress/generate-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const INDUSTRIES = [
  'Tecnologia', 'Varejo', 'Serviços', 'Indústria', 'Agronegócio',
  'Saúde', 'Educação', 'Financeiro', 'Construção', 'Transporte'
];

const STATES = [
  'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO'
];

const CITIES: Record<string, string[]> = {
  'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'Volta Redonda'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
  'PR': ['Curitiba', 'Londrina', 'Maringá'],
};

function generateCNPJ(): string {
  const num = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
  const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${num}0001${suffix}`;
}

function generateCompany(index: number) {
  const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
  const state = STATES[Math.floor(Math.random() * STATES.length)];
  const cities = CITIES[state] || ['Capital'];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const revenue = Math.floor(Math.random() * 100000000) + 1000000;
  const employees = Math.floor(Math.random() * 5000) + 10;

  return {
    name: `Empresa Teste ${index}`,
    cnpj: generateCNPJ(),
    industry,
    domain: `empresa-teste-${index}.com.br`,
    website: `https://empresa-teste-${index}.com.br`,
    description: `Empresa de teste ${index} do setor ${industry}`,
    location: {
      city,
      state,
      country: 'Brasil',
    },
    revenue,
    employees,
    enrichment_status: Math.random() > 0.3 ? 'completed' : 'pending',
    data_sources: ['test_data'],
  };
}

async function generateBatch(startIndex: number, batchSize: number) {
  const companies = Array.from({ length: batchSize }, (_, i) => 
    generateCompany(startIndex + i)
  );

  const { error } = await supabase
    .from('companies')
    .insert(companies);

  if (error) {
    console.error(`Erro no batch ${startIndex}-${startIndex + batchSize}:`, error);
    throw error;
  }

  console.log(`✓ Batch ${startIndex}-${startIndex + batchSize} criado`);
}

async function cleanTestData() {
  console.log('🧹 Limpando dados de teste antigos...');
  
  const { error } = await supabase
    .from('companies')
    .delete()
    .like('name', 'Empresa Teste%');

  if (error) {
    console.error('Erro ao limpar:', error);
  } else {
    console.log('✓ Dados antigos removidos');
  }
}

async function main() {
  const TOTAL_COMPANIES = 1000;
  const BATCH_SIZE = 50;
  const NUM_BATCHES = Math.ceil(TOTAL_COMPANIES / BATCH_SIZE);

  console.log('🚀 Iniciando geração de dados de teste...');
  console.log(`📊 Total: ${TOTAL_COMPANIES} empresas`);
  console.log(`📦 Batches: ${NUM_BATCHES} (${BATCH_SIZE} por batch)`);
  console.log('');

  // Limpar dados antigos
  await cleanTestData();
  console.log('');

  // Gerar novos dados
  const startTime = Date.now();

  for (let i = 0; i < NUM_BATCHES; i++) {
    const startIndex = i * BATCH_SIZE;
    await generateBatch(startIndex, BATCH_SIZE);
    
    // Pausa entre batches para não sobrecarregar
    if (i < NUM_BATCHES - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log('✅ Geração concluída!');
  console.log(`⏱️  Tempo total: ${duration}s`);
  console.log(`📈 Taxa: ${(TOTAL_COMPANIES / parseFloat(duration)).toFixed(0)} empresas/s`);
  console.log('');
  console.log('💡 Próximos passos:');
  console.log('   1. Teste a paginação em /companies');
  console.log('   2. Teste a busca com vários termos');
  console.log('   3. Teste sorting por diferentes colunas');
  console.log('   4. Monitore o tempo de resposta');
}

main().catch(console.error);

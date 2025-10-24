/**
 * Benchmark de performance para operações críticas
 * Uso: npx tsx tests/stress/performance-benchmark.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface BenchmarkResult {
  operation: string;
  duration: number;
  recordsReturned?: number;
  success: boolean;
  error?: string;
}

const results: BenchmarkResult[] = [];

async function benchmark(name: string, fn: () => Promise<any>) {
  console.log(`⏳ ${name}...`);
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    const recordsReturned = result?.data?.length || result?.count || 0;
    
    results.push({
      operation: name,
      duration,
      recordsReturned,
      success: true,
    });
    
    console.log(`✓ ${name}: ${duration}ms ${recordsReturned ? `(${recordsReturned} records)` : ''}`);
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      operation: name,
      duration,
      success: false,
      error: error.message,
    });
    
    console.log(`✗ ${name}: FALHOU (${duration}ms) - ${error.message}`);
    throw error;
  }
}

async function testPagination() {
  console.log('\n📄 Testando Paginação...\n');
  
  // Página 1
  await benchmark('Página 1 (50 registros)', async () => {
    return await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .range(0, 49);
  });

  // Página 10 (meio)
  await benchmark('Página 10 (registros 450-499)', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .range(450, 499);
  });

  // Última página
  await benchmark('Última página (registros 950-999)', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .range(950, 999);
  });
}

async function testSearch() {
  console.log('\n🔍 Testando Busca...\n');

  // Busca por nome
  await benchmark('Busca por nome parcial', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .ilike('name', '%Empresa%')
      .limit(50);
  });

  // Busca por CNPJ
  await benchmark('Busca por CNPJ', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .ilike('cnpj', '%12345%')
      .limit(50);
  });

  // Busca combinada
  await benchmark('Busca combinada (OR)', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .or('name.ilike.%Test%,cnpj.ilike.%123%')
      .limit(50);
  });
}

async function testSorting() {
  console.log('\n🔢 Testando Ordenação...\n');

  await benchmark('Ordenar por nome (ASC)', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })
      .limit(50);
  });

  await benchmark('Ordenar por created_at (DESC)', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
  });

  await benchmark('Ordenar por revenue (DESC)', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .order('revenue', { ascending: false })
      .limit(50);
  });
}

async function testFilters() {
  console.log('\n🎯 Testando Filtros...\n');

  await benchmark('Filtro por indústria', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .eq('industry', 'Tecnologia')
      .limit(50);
  });

  await benchmark('Filtro por estado', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .eq('location->>state', 'SP')
      .limit(50);
  });

  await benchmark('Múltiplos filtros', async () => {
    return await supabase
      .from('companies')
      .select('*')
      .eq('industry', 'Tecnologia')
      .eq('location->>state', 'SP')
      .gte('employees', 100)
      .limit(50);
  });
}

async function testAggregations() {
  console.log('\n📊 Testando Agregações...\n');

  await benchmark('Count total de empresas', async () => {
    return await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });
  });

  await benchmark('Count por status', async () => {
    return await supabase
      .from('companies')
      .select('enrichment_status', { count: 'exact' })
      .eq('enrichment_status', 'completed');
  });
}

function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE PERFORMANCE');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Operações bem-sucedidas: ${successful.length}`);
  console.log(`❌ Operações com falha: ${failed.length}`);
  console.log('');

  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const maxDuration = Math.max(...successful.map(r => r.duration));
    const minDuration = Math.min(...successful.map(r => r.duration));

    console.log('⏱️  Tempos de Resposta:');
    console.log(`   Média: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Mínimo: ${minDuration}ms`);
    console.log(`   Máximo: ${maxDuration}ms`);
    console.log('');

    // Operações mais lentas
    const slowest = [...successful]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    console.log('🐌 Top 5 Operações Mais Lentas:');
    slowest.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.operation}: ${r.duration}ms`);
    });
    console.log('');

    // Benchmarks de referência
    console.log('📏 Análise de Performance:');
    const fastOps = successful.filter(r => r.duration < 200).length;
    const mediumOps = successful.filter(r => r.duration >= 200 && r.duration < 500).length;
    const slowOps = successful.filter(r => r.duration >= 500).length;

    console.log(`   🟢 Rápidas (<200ms): ${fastOps}`);
    console.log(`   🟡 Médias (200-500ms): ${mediumOps}`);
    console.log(`   🔴 Lentas (>500ms): ${slowOps}`);
    console.log('');

    if (slowOps > 0) {
      console.log('⚠️  Atenção: Algumas operações estão lentas. Considere:');
      console.log('   - Adicionar índices nas colunas mais buscadas');
      console.log('   - Otimizar queries com muitos JOINs');
      console.log('   - Implementar cache para dados estáticos');
      console.log('');
    }
  }

  if (failed.length > 0) {
    console.log('❌ Operações com Falha:');
    failed.forEach(r => {
      console.log(`   - ${r.operation}: ${r.error}`);
    });
    console.log('');
  }

  console.log('✅ Recomendações:');
  if (successful.every(r => r.duration < 300)) {
    console.log('   🎉 Performance excelente! Sistema está otimizado.');
  } else if (successful.every(r => r.duration < 1000)) {
    console.log('   👍 Performance boa. Pequenas otimizações podem melhorar ainda mais.');
  } else {
    console.log('   ⚠️  Performance precisa de atenção. Priorize otimizações.');
  }
  console.log('');
}

async function main() {
  console.log('🚀 Iniciando Benchmark de Performance');
  console.log('📍 Testando operações críticas do sistema\n');

  try {
    await testPagination();
    await testSearch();
    await testSorting();
    await testFilters();
    await testAggregations();

    generateReport();
  } catch (error) {
    console.error('\n❌ Erro durante benchmark:', error);
    generateReport();
    process.exit(1);
  }
}

main();

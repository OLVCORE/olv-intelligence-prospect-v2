// TESTE COMPLETO - 15 APIS BRASILAPI + NOMINATIM (OSM)
import { getBrasilAPI } from './src/services/brasilapi-completo';
import { getNominatim } from './src/services/nominatim';
import { getGeocoding } from './src/services/geocoding-service';

console.log('\n🎯 TESTE COMPLETO - BRASILAPI (15 APIs) + NOMINATIM\n');
console.log('═'.repeat(80) + '\n');

interface TestResult {
  api: string;
  status: 'OK' | 'ERRO' | 'PARCIAL';
  mensagem: string;
  detalhes?: string;
}

const results: TestResult[] = [];

// ============================================================================
// BRASILAPI - 15 APIS
// ============================================================================

const api = getBrasilAPI();

async function testarBrasilAPI() {
  console.log('📊 TESTANDO BRASILAPI (15 APIs)\n');
  console.log('-'.repeat(80) + '\n');
  
  // 1. BANKS
  try {
    const bancos = await api.bancos();
    const banco = await api.banco(237); // Bradesco
    results.push({
      api: '1. BANKS - Bancos',
      status: banco.name ? 'OK' : 'ERRO',
      mensagem: `${bancos.length} bancos encontrados`,
      detalhes: `Teste: ${banco.name} (${banco.code})`,
    });
    console.log(`✅ BANKS: ${bancos.length} bancos - Teste: ${banco.name}`);
  } catch (error: any) {
    results.push({
      api: '1. BANKS - Bancos',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ BANKS: ${error.message}`);
  }
  
  // 2. CÂMBIO
  try {
    const usd = await api.cotacao('USD');
    results.push({
      api: '2. CÂMBIO - Cotações',
      status: 'OK',
      mensagem: `USD: R$ ${usd.bid}`,
      detalhes: `Alta: ${usd.high} / Baixa: ${usd.low}`,
    });
    console.log(`✅ CÂMBIO: USD = R$ ${usd.bid}`);
  } catch (error: any) {
    results.push({
      api: '2. CÂMBIO - Cotações',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ CÂMBIO: ${error.message}`);
  }
  
  // 3. CEP
  try {
    const cep = await api.cep('01310-100'); // Av. Paulista
    results.push({
      api: '3. CEP - Endereços',
      status: 'OK',
      mensagem: `${cep.street}, ${cep.neighborhood} - ${cep.city}/${cep.state}`,
      detalhes: cep.location ? `Coords: ${cep.location.coordinates.latitude}, ${cep.location.coordinates.longitude}` : undefined,
    });
    console.log(`✅ CEP: ${cep.street}, ${cep.city}/${cep.state}`);
  } catch (error: any) {
    results.push({
      api: '3. CEP - Endereços',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ CEP: ${error.message}`);
  }
  
  // 4. CNPJ
  try {
    const cnpj = await api.cnpj('00000000000191'); // Banco do Brasil
    results.push({
      api: '4. CNPJ - Empresas',
      status: 'OK',
      mensagem: cnpj.razao_social,
      detalhes: `${cnpj.municipio}/${cnpj.uf} - ${cnpj.porte}`,
    });
    console.log(`✅ CNPJ: ${cnpj.razao_social}`);
  } catch (error: any) {
    results.push({
      api: '4. CNPJ - Empresas',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ CNPJ: ${error.message}`);
  }
  
  // 5. CORRETORAS
  try {
    const corretoras = await api.corretoras();
    results.push({
      api: '5. CORRETORAS - CVM',
      status: 'OK',
      mensagem: `${corretoras.length} corretoras encontradas`,
      detalhes: corretoras[0] ? `Exemplo: ${corretoras[0].nome_comercial}` : undefined,
    });
    console.log(`✅ CORRETORAS: ${corretoras.length} encontradas`);
  } catch (error: any) {
    results.push({
      api: '5. CORRETORAS - CVM',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ CORRETORAS: ${error.message}`);
  }
  
  // 6. CPTEC (Clima)
  try {
    const cidades = await api.cidades('São Paulo');
    if (cidades.length > 0) {
      const clima = await api.clima(cidades[0].id);
      results.push({
        api: '6. CPTEC - Clima',
        status: 'OK',
        mensagem: `${clima.cidade}/${clima.estado}`,
        detalhes: `${clima.clima.length} dias de previsão`,
      });
      console.log(`✅ CPTEC: ${clima.cidade} - ${clima.clima.length} dias`);
    } else {
      throw new Error('Nenhuma cidade encontrada');
    }
  } catch (error: any) {
    results.push({
      api: '6. CPTEC - Clima',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ CPTEC: ${error.message}`);
  }
  
  // 7. DDD
  try {
    const ddd = await api.ddd(11);
    results.push({
      api: '7. DDD - Códigos',
      status: 'OK',
      mensagem: `Estado: ${ddd.state}`,
      detalhes: `${ddd.cities.length} cidades`,
    });
    console.log(`✅ DDD: 11 = ${ddd.state} (${ddd.cities.length} cidades)`);
  } catch (error: any) {
    results.push({
      api: '7. DDD - Códigos',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ DDD: ${error.message}`);
  }
  
  // 8. FERIADOS
  try {
    const feriados = await api.feriados(2025);
    results.push({
      api: '8. FERIADOS - Nacionais',
      status: 'OK',
      mensagem: `${feriados.length} feriados em 2025`,
      detalhes: feriados[0] ? `Próximo: ${feriados[0].name} (${feriados[0].date})` : undefined,
    });
    console.log(`✅ FERIADOS: ${feriados.length} em 2025`);
  } catch (error: any) {
    results.push({
      api: '8. FERIADOS - Nacionais',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ FERIADOS: ${error.message}`);
  }
  
  // 9. FIPE
  try {
    const marcas = await api.fipeMarcas('carros');
    results.push({
      api: '9. FIPE - Veículos',
      status: 'OK',
      mensagem: `${marcas.length} marcas de carros`,
      detalhes: marcas[0] ? `Exemplo: ${marcas[0].nome}` : undefined,
    });
    console.log(`✅ FIPE: ${marcas.length} marcas`);
  } catch (error: any) {
    results.push({
      api: '9. FIPE - Veículos',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ FIPE: ${error.message}`);
  }
  
  // 10. IBGE
  try {
    const estados = await api.estados();
    const sp = await api.estado('SP');
    const municipios = await api.municipios('SP');
    results.push({
      api: '10. IBGE - Geografia',
      status: 'OK',
      mensagem: `${estados.length} estados, ${municipios.length} municípios em SP`,
      detalhes: `${sp.nome} - Região ${sp.regiao.nome}`,
    });
    console.log(`✅ IBGE: ${estados.length} estados, ${municipios.length} municípios (SP)`);
  } catch (error: any) {
    results.push({
      api: '10. IBGE - Geografia',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ IBGE: ${error.message}`);
  }
  
  // 11. ISBN
  try {
    const livro = await api.isbn('9788535902778'); // "O Cortiço"
    results.push({
      api: '11. ISBN - Livros',
      status: 'OK',
      mensagem: livro.title,
      detalhes: `${livro.authors.join(', ')} - ${livro.publisher}`,
    });
    console.log(`✅ ISBN: ${livro.title}`);
  } catch (error: any) {
    results.push({
      api: '11. ISBN - Livros',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ ISBN: ${error.message}`);
  }
  
  // 12. NCM
  try {
    const ncm = await api.ncm('01012100');
    results.push({
      api: '12. NCM - Mercosul',
      status: 'OK',
      mensagem: ncm.descricao,
      detalhes: `Código: ${ncm.codigo}`,
    });
    console.log(`✅ NCM: ${ncm.descricao}`);
  } catch (error: any) {
    results.push({
      api: '12. NCM - Mercosul',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ NCM: ${error.message}`);
  }
  
  // 13. PIX
  try {
    const participantes = await api.pix();
    results.push({
      api: '13. PIX - Participantes',
      status: 'OK',
      mensagem: `${participantes.length} instituições participantes`,
      detalhes: participantes[0] ? `Exemplo: ${participantes[0].nome}` : undefined,
    });
    console.log(`✅ PIX: ${participantes.length} participantes`);
  } catch (error: any) {
    results.push({
      api: '13. PIX - Participantes',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ PIX: ${error.message}`);
  }
  
  // 14. REGISTRO BR
  try {
    const dominio = await api.dominio('google.com.br');
    results.push({
      api: '14. REGISTRO BR - Domínios',
      status: 'OK',
      mensagem: dominio.fqdn,
      detalhes: `Status: ${dominio.status} - Expira: ${dominio.expires_at}`,
    });
    console.log(`✅ REGISTRO BR: ${dominio.fqdn}`);
  } catch (error: any) {
    results.push({
      api: '14. REGISTRO BR - Domínios',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ REGISTRO BR: ${error.message}`);
  }
  
  // 15. TAXAS
  try {
    const selic = await api.selic();
    const cdi = await api.cdi();
    const taxas = await api.taxas();
    results.push({
      api: '15. TAXAS - Juros',
      status: 'OK',
      mensagem: `Selic: ${selic.valor}% | CDI: ${cdi.valor}%`,
      detalhes: `${taxas.length} indicadores disponíveis`,
    });
    console.log(`✅ TAXAS: Selic ${selic.valor}% | CDI ${cdi.valor}%`);
  } catch (error: any) {
    results.push({
      api: '15. TAXAS - Juros',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ TAXAS: ${error.message}`);
  }
}

// ============================================================================
// NOMINATIM (OpenStreetMap)
// ============================================================================

async function testarNominatim() {
  console.log('\n' + '-'.repeat(80) + '\n');
  console.log('🗺️  TESTANDO NOMINATIM (OpenStreetMap - 100% GRATUITO)\n');
  console.log('-'.repeat(80) + '\n');
  
  const nominatim = getNominatim();
  
  // 1. Geocoding simples
  try {
    const result = await nominatim.geocode('Avenida Paulista, 1578, São Paulo');
    if (result) {
      results.push({
        api: '16. NOMINATIM - Geocoding',
        status: 'OK',
        mensagem: `${result.latitude}, ${result.longitude}`,
        detalhes: result.display_name,
      });
      console.log(`✅ GEOCODING: ${result.latitude}, ${result.longitude}`);
      console.log(`   Endereço: ${result.display_name}`);
    } else {
      throw new Error('Nenhum resultado');
    }
  } catch (error: any) {
    results.push({
      api: '16. NOMINATIM - Geocoding',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ GEOCODING: ${error.message}`);
  }
  
  // 2. Reverse Geocoding
  try {
    const result = await nominatim.reverseGeocode(-23.5505, -46.6333);
    if (result) {
      results.push({
        api: '17. NOMINATIM - Reverse',
        status: 'OK',
        mensagem: result.display_name,
      });
      console.log(`✅ REVERSE: ${result.display_name}`);
    } else {
      throw new Error('Nenhum resultado');
    }
  } catch (error: any) {
    results.push({
      api: '17. NOMINATIM - Reverse',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ REVERSE: ${error.message}`);
  }
  
  // 3. Geocode estruturado
  try {
    const result = await nominatim.geocodeStructured({
      street: 'Avenida Paulista, 1578',
      city: 'São Paulo',
      state: 'São Paulo',
      country: 'Brasil',
    });
    if (result) {
      results.push({
        api: '18. NOMINATIM - Estruturado',
        status: 'OK',
        mensagem: `${result.latitude}, ${result.longitude}`,
      });
      console.log(`✅ ESTRUTURADO: ${result.latitude}, ${result.longitude}`);
    } else {
      throw new Error('Nenhum resultado');
    }
  } catch (error: any) {
    results.push({
      api: '18. NOMINATIM - Estruturado',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ ESTRUTURADO: ${error.message}`);
  }
  
  // 4. Geocode empresa
  try {
    const result = await nominatim.geocodeCompany({
      logradouro: 'Avenida Braz Leme',
      numero: '1000',
      bairro: 'Santana',
      cidade: 'São Paulo',
      estado: 'São Paulo',
    });
    if (result) {
      results.push({
        api: '19. NOMINATIM - Empresa',
        status: 'OK',
        mensagem: `${result.lat}, ${result.lng}`,
        detalhes: result.endereco_completo,
      });
      console.log(`✅ EMPRESA: ${result.lat}, ${result.lng}`);
    } else {
      throw new Error('Nenhum resultado');
    }
  } catch (error: any) {
    results.push({
      api: '19. NOMINATIM - Empresa',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ EMPRESA: ${error.message}`);
  }
  
  // 5. Cálculo de distância
  try {
    const dist = nominatim.calculateDistance(-23.5505, -46.6333, -23.5620, -46.6556);
    results.push({
      api: '20. NOMINATIM - Distância',
      status: 'OK',
      mensagem: `${dist.km} km (${dist.meters} m)`,
    });
    console.log(`✅ DISTÂNCIA: ${dist.km} km`);
  } catch (error: any) {
    results.push({
      api: '20. NOMINATIM - Distância',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ DISTÂNCIA: ${error.message}`);
  }
}

// ============================================================================
// GEOCODING SERVICE (Unificado com Fallback)
// ============================================================================

async function testarGeocodingService() {
  console.log('\n' + '-'.repeat(80) + '\n');
  console.log('🔄 TESTANDO GEOCODING SERVICE (Nominatim + Mapbox Fallback)\n');
  console.log('-'.repeat(80) + '\n');
  
  const geocoding = getGeocoding();
  
  try {
    const result = await geocoding.geocode('Avenida Paulista, 1578, São Paulo');
    if (result) {
      results.push({
        api: '21. GEOCODING SERVICE - Unificado',
        status: 'OK',
        mensagem: `${result.latitude}, ${result.longitude}`,
        detalhes: `Fonte: ${result.fonte}`,
      });
      console.log(`✅ UNIFICADO: ${result.latitude}, ${result.longitude} (${result.fonte})`);
    } else {
      throw new Error('Nenhum resultado');
    }
  } catch (error: any) {
    results.push({
      api: '21. GEOCODING SERVICE - Unificado',
      status: 'ERRO',
      mensagem: error.message,
    });
    console.log(`❌ UNIFICADO: ${error.message}`);
  }
}

// ============================================================================
// RELATÓRIO FINAL
// ============================================================================

async function gerarRelatorio() {
  console.log('\n' + '═'.repeat(80) + '\n');
  console.log('📊 RELATÓRIO FINAL\n');
  console.log('═'.repeat(80) + '\n');
  
  const ok = results.filter(r => r.status === 'OK').length;
  const erro = results.filter(r => r.status === 'ERRO').length;
  const parcial = results.filter(r => r.status === 'PARCIAL').length;
  const total = results.length;
  
  console.log(`✅ OK: ${ok}/${total} (${((ok / total) * 100).toFixed(1)}%)`);
  console.log(`❌ ERRO: ${erro}/${total}`);
  console.log(`⚠️  PARCIAL: ${parcial}/${total}\n`);
  
  console.log('-'.repeat(80) + '\n');
  
  results.forEach((r, i) => {
    const icon = r.status === 'OK' ? '✅' : r.status === 'PARCIAL' ? '⚠️' : '❌';
    console.log(`${icon} ${r.api}`);
    console.log(`   ${r.mensagem}`);
    if (r.detalhes) {
      console.log(`   ℹ️  ${r.detalhes}`);
    }
    console.log('');
  });
  
  console.log('═'.repeat(80) + '\n');
  console.log('🎯 DESTAQUES:\n');
  console.log('✅ BrasilAPI: 15 APIs GRATUITAS sem API key');
  console.log('✅ Nominatim: Geocoding 100% GRATUITO');
  console.log('✅ Fallback automático: Nominatim → Mapbox');
  console.log('✅ Cache inteligente: Evita requisições duplicadas');
  console.log('✅ Rate limiting: 1 req/s (uso justo)\n');
  console.log('═'.repeat(80) + '\n');
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

async function run() {
  await testarBrasilAPI();
  await testarNominatim();
  await testarGeocodingService();
  await gerarRelatorio();
}

run().catch(console.error);


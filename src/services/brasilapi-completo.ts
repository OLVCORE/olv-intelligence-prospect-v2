// BrasilAPI - Integração COMPLETA (15 APIs)
// Documentação: https://brasilapi.com.br/docs

const BASE_URL = 'https://brasilapi.com.br/api';

// ============================================================================
// 1. BANKS - Bancos Brasileiros
// ============================================================================

export interface Banco {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export async function listarBancos(): Promise<Banco[]> {
  const response = await fetch(`${BASE_URL}/banks/v1`);
  if (!response.ok) throw new Error(`Erro ao buscar bancos: ${response.status}`);
  return await response.json();
}

export async function buscarBancoPorCodigo(codigo: number): Promise<Banco> {
  const response = await fetch(`${BASE_URL}/banks/v1/${codigo}`);
  if (!response.ok) throw new Error(`Banco não encontrado: ${codigo}`);
  return await response.json();
}

// ============================================================================
// 2. CÂMBIO - Cotações de Moedas
// ============================================================================

export interface Cotacao {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

export async function cotacaoMoeda(moeda: 'USD' | 'EUR' | 'GBP' | 'BTC'): Promise<Cotacao> {
  const response = await fetch(`${BASE_URL}/cptec/v1/moeda/${moeda}`);
  if (!response.ok) throw new Error(`Erro ao buscar cotação: ${moeda}`);
  return await response.json();
}

// ============================================================================
// 3. CEP - Busca de Endereços
// ============================================================================

export interface EnderecoCEP {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

export async function buscarCEP(cep: string): Promise<EnderecoCEP> {
  const cepLimpo = cep.replace(/\D/g, '');
  const response = await fetch(`${BASE_URL}/cep/v1/${cepLimpo}`);
  if (!response.ok) throw new Error(`CEP não encontrado: ${cep}`);
  return await response.json();
}

export async function buscarCEPv2(cep: string): Promise<EnderecoCEP> {
  const cepLimpo = cep.replace(/\D/g, '');
  const response = await fetch(`${BASE_URL}/cep/v2/${cepLimpo}`);
  if (!response.ok) throw new Error(`CEP não encontrado: ${cep}`);
  return await response.json();
}

// ============================================================================
// 4. CNPJ - Dados Completos de Empresas (JÁ IMPLEMENTADO)
// ============================================================================

export interface EmpresaCNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  // ... 48 campos (já implementado em src/services/brasilapi.ts)
}

export async function buscarCNPJ(cnpj: string): Promise<EmpresaCNPJ> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  const response = await fetch(`${BASE_URL}/cnpj/v1/${cnpjLimpo}`);
  if (!response.ok) throw new Error(`CNPJ não encontrado: ${cnpj}`);
  return await response.json();
}

// ============================================================================
// 5. CORRETORAS - Corretoras de Valores
// ============================================================================

export interface Corretora {
  cnpj: string;
  type: string;
  nome_social: string;
  nome_comercial: string;
  status: string;
  email: string;
  telefone: string;
  cep: string;
  pais: string;
  uf: string;
  municipio: string;
  bairro: string;
  complemento: string;
  logradouro: string;
  data_patrimonio_liquido: string;
  valor_patrimonio_liquido: string;
  codigo_cvm: string;
  data_inicio_situacao: string;
  data_registro: string;
}

export async function listarCorretoras(): Promise<Corretora[]> {
  const response = await fetch(`${BASE_URL}/cvm/corretoras/v1`);
  if (!response.ok) throw new Error(`Erro ao buscar corretoras: ${response.status}`);
  return await response.json();
}

export async function buscarCorretoraPorCNPJ(cnpj: string): Promise<Corretora> {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  const response = await fetch(`${BASE_URL}/cvm/corretoras/v1/${cnpjLimpo}`);
  if (!response.ok) throw new Error(`Corretora não encontrada: ${cnpj}`);
  return await response.json();
}

// ============================================================================
// 6. CPTEC - Previsão do Tempo
// ============================================================================

export interface PrevisaoTempo {
  cidade: string;
  estado: string;
  atualizado_em: string;
  clima: Array<{
    data: string;
    condicao: string;
    condicao_desc: string;
    min: number;
    max: number;
    indice_uv: number;
  }>;
}

export interface Cidade {
  nome: string;
  estado: string;
  id: number;
}

export async function buscarCidadesPorNome(nome: string): Promise<Cidade[]> {
  const response = await fetch(`${BASE_URL}/cptec/v1/cidade/${encodeURIComponent(nome)}`);
  if (!response.ok) throw new Error(`Erro ao buscar cidades: ${nome}`);
  return await response.json();
}

export async function previsaoClima(codigoCidade: number, dias: 1 | 6 = 6): Promise<PrevisaoTempo> {
  const response = await fetch(`${BASE_URL}/cptec/v1/clima/previsao/${codigoCidade}/${dias}`);
  if (!response.ok) throw new Error(`Erro ao buscar previsão: ${codigoCidade}`);
  return await response.json();
}

// ============================================================================
// 7. DDD - Códigos de Área
// ============================================================================

export interface DDD {
  state: string;
  cities: string[];
}

export async function buscarDDD(ddd: number): Promise<DDD> {
  const response = await fetch(`${BASE_URL}/ddd/v1/${ddd}`);
  if (!response.ok) throw new Error(`DDD não encontrado: ${ddd}`);
  return await response.json();
}

// ============================================================================
// 8. FERIADOS NACIONAIS
// ============================================================================

export interface Feriado {
  date: string;
  name: string;
  type: 'national' | 'optional';
}

export async function feriadosNacionais(ano: number): Promise<Feriado[]> {
  const response = await fetch(`${BASE_URL}/feriados/v1/${ano}`);
  if (!response.ok) throw new Error(`Erro ao buscar feriados: ${ano}`);
  return await response.json();
}

// ============================================================================
// 9. FIPE - Preço de Veículos
// ============================================================================

export interface MarcaFipe {
  nome: string;
  valor: string;
}

export interface VeiculoFipe {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

export async function marcasFipe(tipo: 'carros' | 'motos' | 'caminhoes'): Promise<MarcaFipe[]> {
  const response = await fetch(`${BASE_URL}/fipe/marcas/v1/${tipo}`);
  if (!response.ok) throw new Error(`Erro ao buscar marcas FIPE: ${tipo}`);
  return await response.json();
}

export async function tabelaFipe(): Promise<{ codigo: number; mes: string }[]> {
  const response = await fetch(`${BASE_URL}/fipe/tabelas/v1`);
  if (!response.ok) throw new Error(`Erro ao buscar tabela FIPE`);
  return await response.json();
}

export async function precoFipe(codigoFipe: string, tabela?: number): Promise<VeiculoFipe> {
  const url = tabela 
    ? `${BASE_URL}/fipe/preco/v1/${codigoFipe}?tabela_referencia=${tabela}`
    : `${BASE_URL}/fipe/preco/v1/${codigoFipe}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro ao buscar preço FIPE: ${codigoFipe}`);
  return await response.json();
}

// ============================================================================
// 10. IBGE - Dados Geográficos
// ============================================================================

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}

export interface Municipio {
  nome: string;
  codigo_ibge: string;
}

export async function listarEstados(): Promise<Estado[]> {
  const response = await fetch(`${BASE_URL}/ibge/uf/v1`);
  if (!response.ok) throw new Error(`Erro ao buscar estados`);
  return await response.json();
}

export async function buscarEstado(siglaOuCodigo: string): Promise<Estado> {
  const response = await fetch(`${BASE_URL}/ibge/uf/v1/${siglaOuCodigo}`);
  if (!response.ok) throw new Error(`Estado não encontrado: ${siglaOuCodigo}`);
  return await response.json();
}

export async function municipiosPorEstado(siglaUF: string): Promise<Municipio[]> {
  const response = await fetch(`${BASE_URL}/ibge/municipios/v1/${siglaUF}?providers=dados-abertos-br,gov,wikipedia`);
  if (!response.ok) throw new Error(`Erro ao buscar municípios: ${siglaUF}`);
  return await response.json();
}

// ============================================================================
// 11. ISBN - Informações de Livros
// ============================================================================

export interface Livro {
  isbn: string;
  title: string;
  subtitle: string;
  authors: string[];
  publisher: string;
  synopsis: string;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  year: number;
  format: string;
  page_count: number;
  subjects: string[];
  location: string;
  retail_price: string;
  cover_url: string;
  provider: string;
}

export async function buscarISBN(isbn: string): Promise<Livro> {
  const isbnLimpo = isbn.replace(/\D/g, '');
  const response = await fetch(`${BASE_URL}/isbn/v1/${isbnLimpo}`);
  if (!response.ok) throw new Error(`ISBN não encontrado: ${isbn}`);
  return await response.json();
}

// ============================================================================
// 12. NCM - Nomenclatura Comum do Mercosul
// ============================================================================

export interface NCM {
  codigo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo_ato: string;
  numero_ato: string;
  ano_ato: string;
}

export async function buscarNCM(codigo: string): Promise<NCM> {
  const response = await fetch(`${BASE_URL}/ncm/v1/${codigo}`);
  if (!response.ok) throw new Error(`NCM não encontrado: ${codigo}`);
  return await response.json();
}

export async function pesquisarNCM(termo: string): Promise<NCM[]> {
  const response = await fetch(`${BASE_URL}/ncm/v1?search=${encodeURIComponent(termo)}`);
  if (!response.ok) throw new Error(`Erro ao pesquisar NCM: ${termo}`);
  return await response.json();
}

// ============================================================================
// 13. PIX - Participantes do Sistema PIX
// ============================================================================

export interface ParticipantePIX {
  ispb: string;
  nome: string;
  nome_reduzido: string;
  modalidade_participacao: string;
  tipo_participacao: string;
  inicio_operacao: string;
}

export async function listarParticipantesPIX(): Promise<ParticipantePIX[]> {
  const response = await fetch(`${BASE_URL}/pix/v1/participants`);
  if (!response.ok) throw new Error(`Erro ao buscar participantes PIX`);
  return await response.json();
}

// ============================================================================
// 14. REGISTRO BR - Domínios Registrados
// ============================================================================

export interface DominioBR {
  status_code: number;
  status: string;
  fqdn: string;
  hosts: string[];
  publication_status: string;
  expires_at: string;
  suggestions: string[];
}

export async function consultarDominio(dominio: string): Promise<DominioBR> {
  const response = await fetch(`${BASE_URL}/registrobr/v1/${dominio}`);
  if (!response.ok) throw new Error(`Erro ao consultar domínio: ${dominio}`);
  return await response.json();
}

// ============================================================================
// 15. TAXAS - Taxas de Juros e Indicadores
// ============================================================================

export interface Taxa {
  nome: string;
  valor: number;
}

export async function taxaSelic(): Promise<{ valor: number }> {
  const response = await fetch(`${BASE_URL}/taxas/v1/selic`);
  if (!response.ok) throw new Error(`Erro ao buscar taxa Selic`);
  return await response.json();
}

export async function taxaCDI(): Promise<{ valor: number }> {
  const response = await fetch(`${BASE_URL}/taxas/v1/cdi`);
  if (!response.ok) throw new Error(`Erro ao buscar taxa CDI`);
  return await response.json();
}

export async function todasTaxas(): Promise<Taxa[]> {
  const response = await fetch(`${BASE_URL}/taxas/v1`);
  if (!response.ok) throw new Error(`Erro ao buscar taxas`);
  return await response.json();
}

// ============================================================================
// SERVIÇO UNIFICADO - USO SIMPLIFICADO
// ============================================================================

export class BrasilAPICompleto {
  // Bancos
  async bancos() {
    return await listarBancos();
  }
  
  async banco(codigo: number) {
    return await buscarBancoPorCodigo(codigo);
  }
  
  // Câmbio
  async cotacao(moeda: 'USD' | 'EUR' | 'GBP' | 'BTC') {
    return await cotacaoMoeda(moeda);
  }
  
  // CEP
  async cep(cep: string) {
    return await buscarCEP(cep);
  }
  
  async cepv2(cep: string) {
    return await buscarCEPv2(cep);
  }
  
  // CNPJ
  async cnpj(cnpj: string) {
    return await buscarCNPJ(cnpj);
  }
  
  // Corretoras
  async corretoras() {
    return await listarCorretoras();
  }
  
  async corretora(cnpj: string) {
    return await buscarCorretoraPorCNPJ(cnpj);
  }
  
  // Clima
  async clima(codigoCidade: number) {
    return await previsaoClima(codigoCidade, 6);
  }
  
  async cidades(nome: string) {
    return await buscarCidadesPorNome(nome);
  }
  
  // DDD
  async ddd(ddd: number) {
    return await buscarDDD(ddd);
  }
  
  // Feriados
  async feriados(ano: number = new Date().getFullYear()) {
    return await feriadosNacionais(ano);
  }
  
  // FIPE
  async fipeMarcas(tipo: 'carros' | 'motos' | 'caminhoes') {
    return await marcasFipe(tipo);
  }
  
  async fipePreco(codigoFipe: string) {
    return await precoFipe(codigoFipe);
  }
  
  // IBGE
  async estados() {
    return await listarEstados();
  }
  
  async estado(sigla: string) {
    return await buscarEstado(sigla);
  }
  
  async municipios(siglaUF: string) {
    return await municipiosPorEstado(siglaUF);
  }
  
  // ISBN
  async isbn(isbn: string) {
    return await buscarISBN(isbn);
  }
  
  // NCM
  async ncm(codigo: string) {
    return await buscarNCM(codigo);
  }
  
  async ncmPesquisar(termo: string) {
    return await pesquisarNCM(termo);
  }
  
  // PIX
  async pix() {
    return await listarParticipantesPIX();
  }
  
  // Registro BR
  async dominio(dominio: string) {
    return await consultarDominio(dominio);
  }
  
  // Taxas
  async selic() {
    return await taxaSelic();
  }
  
  async cdi() {
    return await taxaCDI();
  }
  
  async taxas() {
    return await todasTaxas();
  }
}

// Instância singleton
let brasilAPIInstance: BrasilAPICompleto | null = null;

export function getBrasilAPI(): BrasilAPICompleto {
  if (!brasilAPIInstance) {
    brasilAPIInstance = new BrasilAPICompleto();
  }
  return brasilAPIInstance;
}

// Exportações convenientes
export default {
  // Bancos
  listarBancos,
  buscarBancoPorCodigo,
  
  // Câmbio
  cotacaoMoeda,
  
  // CEP
  buscarCEP,
  buscarCEPv2,
  
  // CNPJ
  buscarCNPJ,
  
  // Corretoras
  listarCorretoras,
  buscarCorretoraPorCNPJ,
  
  // Clima
  buscarCidadesPorNome,
  previsaoClima,
  
  // DDD
  buscarDDD,
  
  // Feriados
  feriadosNacionais,
  
  // FIPE
  marcasFipe,
  tabelaFipe,
  precoFipe,
  
  // IBGE
  listarEstados,
  buscarEstado,
  municipiosPorEstado,
  
  // ISBN
  buscarISBN,
  
  // NCM
  buscarNCM,
  pesquisarNCM,
  
  // PIX
  listarParticipantesPIX,
  
  // Registro BR
  consultarDominio,
  
  // Taxas
  taxaSelic,
  taxaCDI,
  todasTaxas,
  
  // Serviço unificado
  getBrasilAPI,
};


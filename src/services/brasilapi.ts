// BrasilAPI - Dados de CNPJ Brasileiros (48 campos!)
// Documentação: https://brasilapi.com.br/docs

export interface BrasilAPIQSA {
  identificador_de_socio: number;
  nome_socio: string;
  cnpj_cpf_do_socio: string;
  codigo_qualificacao_socio: number;
  percentual_capital_social: number;
  data_entrada_sociedade: string;
  cpf_representante_legal?: string;
  nome_representante_legal?: string;
  codigo_qualificacao_representante_legal?: number;
}

export interface BrasilAPICNAE {
  codigo: number;
  descricao: string;
}

export interface BrasilAPIResponse {
  // Dados principais
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  
  // Natureza jurídica
  codigo_natureza_juridica: number;
  natureza_juridica: string;
  
  // Atividades
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  cnaes_secundarios: BrasilAPICNAE[];
  
  // Endereço completo
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  codigo_municipio: number;
  municipio: string;
  
  // Contatos
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  email?: string;
  
  // Situação cadastral
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: string;
  situacao_especial: string;
  data_situacao_especial: string;
  descricao_situacao_cadastral: string;
  
  // Datas
  data_inicio_atividade: string;
  
  // Capital e porte
  capital_social: number;
  porte: string;
  qualificacao_do_responsavel: string;
  
  // Simples Nacional / MEI
  opcao_pelo_simples: boolean;
  data_opcao_pelo_simples?: string;
  data_exclusao_do_simples?: string;
  opcao_pelo_mei: boolean;
  
  // Quadro societário
  qsa: BrasilAPIQSA[];
  
  // Outros
  pais?: string;
  nome_cidade_exterior?: string;
}

export class BrasilAPIService {
  private baseURL = 'https://brasilapi.com.br/api';
  
  /**
   * Busca dados completos de CNPJ (48 campos)
   * @param cnpj CNPJ com ou sem formatação
   * @returns Dados completos da empresa
   */
  async consultarCNPJ(cnpj: string): Promise<BrasilAPIResponse> {
    // Remove formatação do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
    }
    
    try {
      const response = await fetch(`${this.baseURL}/cnpj/v1/${cnpjLimpo}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Stratevo-V2/1.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CNPJ não encontrado na base da Receita Federal');
        }
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('BrasilAPI Error:', error);
      throw new Error(`Falha ao consultar CNPJ: ${error.message}`);
    }
  }
  
  /**
   * Formata CNPJ para exibição (XX.XXX.XXX/XXXX-XX)
   */
  formatarCNPJ(cnpj: string): string {
    const limpo = cnpj.replace(/[^\d]/g, '');
    return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  /**
   * Retorna resumo simplificado (compatível com ReceitaWS)
   */
  async consultarCNPJSimplificado(cnpj: string) {
    const dados = await this.consultarCNPJ(cnpj);
    
    return {
      cnpj: this.formatarCNPJ(dados.cnpj),
      nome: dados.razao_social,
      fantasia: dados.nome_fantasia,
      abertura: dados.data_inicio_atividade,
      situacao: dados.situacao_cadastral,
      tipo: dados.natureza_juridica,
      porte: dados.porte,
      atividade_principal: {
        code: dados.cnae_fiscal.toString(),
        text: dados.cnae_fiscal_descricao
      },
      atividades_secundarias: dados.cnaes_secundarios.map(cnae => ({
        code: cnae.codigo.toString(),
        text: cnae.descricao
      })),
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento,
      bairro: dados.bairro,
      municipio: dados.municipio,
      uf: dados.uf,
      cep: dados.cep,
      telefone: dados.ddd_telefone_1 ? `(${dados.ddd_telefone_1.slice(0, 2)}) ${dados.ddd_telefone_1.slice(2)}` : '',
      email: dados.email || '',
      capital_social: dados.capital_social.toFixed(2),
      qsa: dados.qsa.map(socio => ({
        nome: socio.nome_socio,
        qual: `Código ${socio.codigo_qualificacao_socio}`,
        pais_origem: 'Brasil',
        nome_rep_legal: socio.nome_representante_legal || '',
        qual_rep_legal: socio.codigo_qualificacao_representante_legal?.toString() || ''
      }))
    };
  }
  
  /**
   * Extrai apenas dados essenciais para o Stratevo
   */
  async getDadosEssenciais(cnpj: string) {
    const dados = await this.consultarCNPJ(cnpj);
    
    return {
      // Identificação
      cnpj: dados.cnpj,
      razao_social: dados.razao_social,
      nome_fantasia: dados.nome_fantasia,
      
      // Classificação
      porte: dados.porte,
      natureza_juridica: dados.natureza_juridica,
      atividade_principal: dados.cnae_fiscal_descricao,
      
      // Localização
      cidade: dados.municipio,
      estado: dados.uf,
      endereco_completo: `${dados.logradouro}, ${dados.numero}${dados.complemento ? ' - ' + dados.complemento : ''}, ${dados.bairro}, ${dados.municipio}/${dados.uf}, CEP ${dados.cep}`,
      
      // Contatos
      telefone: dados.ddd_telefone_1,
      telefone_2: dados.ddd_telefone_2,
      email: dados.email,
      
      // Financeiro
      capital_social: dados.capital_social,
      opcao_simples: dados.opcao_pelo_simples,
      opcao_mei: dados.opcao_pelo_mei,
      
      // Situação
      situacao: dados.situacao_cadastral,
      data_abertura: dados.data_inicio_atividade,
      
      // Sócios (resumo)
      total_socios: dados.qsa.length,
      socios_principais: dados.qsa.slice(0, 3).map(s => s.nome_socio)
    };
  }
}

// Instância singleton
export const brasilAPI = new BrasilAPIService();


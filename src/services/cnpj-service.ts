// Serviço unificado de consulta CNPJ
// Prioriza BrasilAPI (48 campos), fallback ReceitaWS (32 campos)
// Preparado para EmpresasAqui quando disponível

import { brasilAPI, BrasilAPIResponse } from './brasilapi';

export interface CNPJData {
  fonte: 'brasilapi' | 'receitaws' | 'empresasaqui';
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  porte: string;
  situacao: string;
  data_abertura: string;
  
  // Endereço
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  
  // Contatos
  telefone?: string;
  telefone2?: string;
  email?: string;
  
  // Atividades
  atividade_principal: string;
  atividades_secundarias?: string[];
  
  // Financeiro
  capital_social?: number;
  opcao_simples?: boolean;
  opcao_mei?: boolean;
  
  // Sócios
  socios?: Array<{
    nome: string;
    cpf_cnpj?: string;
    qualificacao?: string;
    percentual_capital?: number;
  }>;
  
  // Dados extras (só BrasilAPI)
  natureza_juridica?: string;
  total_funcionarios?: number;
  
  // Metadados
  consultado_em: string;
  campos_disponiveis: number;
}

export class CNPJService {
  /**
   * Consulta CNPJ usando a melhor fonte disponível
   * Prioridade: BrasilAPI > EmpresasAqui > ReceitaWS
   */
  async consultar(cnpj: string): Promise<CNPJData> {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    // Tentar BrasilAPI primeiro (48 campos)
    try {
      const dados = await brasilAPI.consultarCNPJ(cnpjLimpo);
      return this.normalizarBrasilAPI(dados);
    } catch (error) {
      console.warn('BrasilAPI falhou, tentando ReceitaWS...', error);
    }
    
    // Fallback: ReceitaWS (32 campos)
    try {
      const dados = await this.consultarReceitaWS(cnpjLimpo);
      return this.normalizarReceitaWS(dados);
    } catch (error) {
      console.error('Todas as APIs falharam:', error);
      throw new Error('Não foi possível consultar o CNPJ em nenhuma fonte disponível');
    }
  }
  
  /**
   * Consulta ReceitaWS (fallback)
   */
  private async consultarReceitaWS(cnpj: string): Promise<any> {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ReceitaWS erro: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Normaliza dados da BrasilAPI para formato padrão
   */
  private normalizarBrasilAPI(dados: BrasilAPIResponse): CNPJData {
    return {
      fonte: 'brasilapi',
      cnpj: dados.cnpj,
      razao_social: dados.razao_social,
      nome_fantasia: dados.nome_fantasia,
      porte: dados.porte,
      situacao: dados.situacao_cadastral,
      data_abertura: dados.data_inicio_atividade,
      
      // Endereço
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cidade: dados.municipio,
      estado: dados.uf,
      cep: dados.cep,
      
      // Contatos
      telefone: dados.ddd_telefone_1,
      telefone2: dados.ddd_telefone_2,
      email: dados.email,
      
      // Atividades
      atividade_principal: dados.cnae_fiscal_descricao,
      atividades_secundarias: dados.cnaes_secundarios.map(c => c.descricao),
      
      // Financeiro
      capital_social: dados.capital_social,
      opcao_simples: dados.opcao_pelo_simples,
      opcao_mei: dados.opcao_pelo_mei,
      
      // Sócios
      socios: dados.qsa.map(socio => ({
        nome: socio.nome_socio,
        cpf_cnpj: socio.cnpj_cpf_do_socio,
        qualificacao: `Código ${socio.codigo_qualificacao_socio}`,
        percentual_capital: socio.percentual_capital_social
      })),
      
      // Extras
      natureza_juridica: dados.natureza_juridica,
      
      // Metadados
      consultado_em: new Date().toISOString(),
      campos_disponiveis: 48
    };
  }
  
  /**
   * Normaliza dados da ReceitaWS para formato padrão
   */
  private normalizarReceitaWS(dados: any): CNPJData {
    return {
      fonte: 'receitaws',
      cnpj: dados.cnpj,
      razao_social: dados.nome,
      nome_fantasia: dados.fantasia,
      porte: dados.porte,
      situacao: dados.situacao,
      data_abertura: dados.abertura,
      
      // Endereço
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cidade: dados.municipio,
      estado: dados.uf,
      cep: dados.cep,
      
      // Contatos
      telefone: dados.telefone,
      email: dados.email,
      
      // Atividades
      atividade_principal: dados.atividade_principal?.[0]?.text || '',
      atividades_secundarias: dados.atividades_secundarias?.map((a: any) => a.text),
      
      // Financeiro
      capital_social: parseFloat(dados.capital_social?.replace(/\./g, '').replace(',', '.') || '0'),
      
      // Sócios
      socios: dados.qsa?.map((socio: any) => ({
        nome: socio.nome,
        qualificacao: socio.qual
      })),
      
      // Extras
      natureza_juridica: dados.tipo,
      
      // Metadados
      consultado_em: new Date().toISOString(),
      campos_disponiveis: 32
    };
  }
  
  /**
   * Formata CNPJ para exibição
   */
  formatarCNPJ(cnpj: string): string {
    const limpo = cnpj.replace(/[^\d]/g, '');
    return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  /**
   * Valida CNPJ
   */
  validarCNPJ(cnpj: string): boolean {
    const limpo = cnpj.replace(/[^\d]/g, '');
    
    if (limpo.length !== 14) return false;
    if (/^(\d)\1+$/.test(limpo)) return false; // Todos dígitos iguais
    
    // Validar dígitos verificadores
    let tamanho = limpo.length - 2;
    let numeros = limpo.substring(0, tamanho);
    const digitos = limpo.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    tamanho = tamanho + 1;
    numeros = limpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1));
  }
}

// Instância singleton
export const cnpjService = new CNPJService();


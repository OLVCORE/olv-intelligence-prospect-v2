/**
 * Calcula o score ICP de uma empresa baseado em critérios definidos
 */

export interface ICPCriteria {
  // Localização
  uf_prioritarias?: string[];
  municipios_prioritarios?: string[];
  
  // Porte
  portes_prioritarios?: string[];
  faturamento_minimo?: number;
  funcionarios_minimo?: number;
  
  // CNAE
  cnaes_prioritarios?: string[];
  cnaes_excluidos?: string[];
  
  // Situação
  situacoes_validas?: string[];
  
  // Tecnologia
  tech_stack_prioritario?: string[];
  
  // Pesos (soma deve ser 100)
  peso_localizacao?: number;
  peso_porte?: number;
  peso_cnae?: number;
  peso_situacao?: number;
  peso_tecnologia?: number;
}

// Critérios padrão
const DEFAULT_CRITERIA: ICPCriteria = {
  uf_prioritarias: ["SP", "RJ", "MG", "RS", "PR", "SC"],
  portes_prioritarios: ["MEDIO/GRANDE PORTE", "GRANDE PORTE"],
  faturamento_minimo: 1000000,
  funcionarios_minimo: 50,
  situacoes_validas: ["ATIVA"],
  peso_localizacao: 20,
  peso_porte: 30,
  peso_cnae: 25,
  peso_situacao: 10,
  peso_tecnologia: 15,
};

export interface ICPResult {
  score: number;
  temperatura: 'hot' | 'warm' | 'cold';
  breakdown: {
    localizacao: number;
    porte: number;
    cnae: number;
    situacao: number;
    tecnologia: number;
  };
  motivos: string[];
}

export function calculateICPScore(
  company: any,
  criteria: ICPCriteria = DEFAULT_CRITERIA
): ICPResult {
  const breakdown = {
    localizacao: 0,
    porte: 0,
    cnae: 0,
    situacao: 0,
    tecnologia: 0,
  };
  
  const motivos: string[] = [];

  // 1. LOCALIZAÇÃO
  if (criteria.uf_prioritarias && company.uf) {
    const ufUpper = company.uf.toUpperCase();
    if (criteria.uf_prioritarias.includes(ufUpper)) {
      breakdown.localizacao = criteria.peso_localizacao || 20;
      motivos.push(`✓ Localizado em ${ufUpper} (estado prioritário)`);
    } else {
      breakdown.localizacao = (criteria.peso_localizacao || 20) * 0.3;
      motivos.push(`✗ Localizado em ${ufUpper} (estado não prioritário)`);
    }
  }

  // 2. PORTE
  let porteScore = 0;
  
  if (criteria.portes_prioritarios && company.porte) {
    const porteUpper = company.porte.toUpperCase();
    if (criteria.portes_prioritarios.some(p => porteUpper.includes(p.toUpperCase()))) {
      porteScore += 15;
      motivos.push(`✓ Porte: ${company.porte}`);
    } else {
      porteScore += 5;
      motivos.push(`○ Porte: ${company.porte}`);
    }
  }
  
  if (criteria.faturamento_minimo && company.faturamento_estimado) {
    const faturamentoStr = company.faturamento_estimado.toString();
    const faturamentoNum = parseFloat(
      faturamentoStr.replace(/[^\d,]/g, '').replace(',', '.')
    );
    
    if (faturamentoNum >= criteria.faturamento_minimo) {
      porteScore += 10;
      motivos.push(`✓ Faturamento adequado`);
    }
  }
  
  if (criteria.funcionarios_minimo && company.funcionarios) {
    const funcionariosStr = company.funcionarios.toString().toUpperCase();
    const match = funcionariosStr.match(/(\d+)/);
    if (match) {
      const funcionariosNum = parseInt(match[1]);
      if (funcionariosNum >= criteria.funcionarios_minimo) {
        porteScore += 5;
        motivos.push(`✓ Quadro de funcionários adequado`);
      }
    }
  }
  
  breakdown.porte = Math.min(porteScore, criteria.peso_porte || 30);

  // 3. CNAE
  if (company.cnae_principal_codigo) {
    const cnae = company.cnae_principal_codigo.toString();
    
    if (criteria.cnaes_prioritarios && criteria.cnaes_prioritarios.includes(cnae)) {
      breakdown.cnae = criteria.peso_cnae || 25;
      motivos.push(`✓ CNAE prioritário: ${cnae}`);
    } else if (criteria.cnaes_excluidos && criteria.cnaes_excluidos.includes(cnae)) {
      breakdown.cnae = 0;
      motivos.push(`✗ CNAE excluído: ${cnae}`);
    } else {
      breakdown.cnae = (criteria.peso_cnae || 25) * 0.5;
      motivos.push(`○ CNAE neutro: ${cnae}`);
    }
  }

  // 4. SITUAÇÃO CADASTRAL
  if (criteria.situacoes_validas && company.situacao_cadastral) {
    const situacaoUpper = company.situacao_cadastral.toUpperCase();
    if (criteria.situacoes_validas.some(s => situacaoUpper.includes(s.toUpperCase()))) {
      breakdown.situacao = criteria.peso_situacao || 10;
      motivos.push(`✓ Situação: ${company.situacao_cadastral}`);
    } else {
      breakdown.situacao = 0;
      motivos.push(`✗ Situação: ${company.situacao_cadastral}`);
    }
  }

  // 5. TECNOLOGIA
  if (criteria.tech_stack_prioritario && company.tech_stack) {
    const techStack = company.tech_stack.toString().toUpperCase();
    const hasPriorityTech = criteria.tech_stack_prioritario.some(tech =>
      techStack.includes(tech.toUpperCase())
    );
    
    if (hasPriorityTech) {
      breakdown.tecnologia = criteria.peso_tecnologia || 15;
      motivos.push(`✓ Usa tecnologia prioritária`);
    }
  }

  // CALCULAR SCORE TOTAL
  const score = Math.round(
    breakdown.localizacao +
    breakdown.porte +
    breakdown.cnae +
    breakdown.situacao +
    breakdown.tecnologia
  );

  // DETERMINAR TEMPERATURA
  let temperatura: 'hot' | 'warm' | 'cold';
  if (score >= 70) {
    temperatura = 'hot';
  } else if (score >= 40) {
    temperatura = 'warm';
  } else {
    temperatura = 'cold';
  }

  return {
    score,
    temperatura,
    breakdown,
    motivos,
  };
}

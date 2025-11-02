import { Evidence } from './matching.ts';

const COMPETITORS = {
  sap: ['sap', 's/4hana', 'business one', 'ecc', 'fico', 'abap'],
  oracle: ['oracle', 'erp cloud', 'netsuite', 'jd edwards', 'e-business suite'],
  microsoft: ['microsoft', 'dynamics 365', 'dynamics nav', 'dynamics ax', 'business central'],
  infor: ['infor', 'cloudsuite', 'ln', 'm3'],
  ifs: ['ifs', 'ifs applications'],
  sage: ['sage', 'x3', 'sage 100', 'sage 200'],
  senior: ['senior', 'senior x', 'senior hcm'],
  sankhya: ['sankhya', 'sankhya w'],
  linx: ['linx', 'linx erp'],
  omie: ['omie', 'omie erp']
};

export async function detectCompetitors(company: any, allEvidences: Evidence[]): Promise<any[]> {
  const competitors: any[] = [];
  
  for (const [competitorName, keywords] of Object.entries(COMPETITORS)) {
    const competitorEvidences: Evidence[] = [];
    
    for (const evidence of allEvidences) {
      const text = `${evidence.title} ${evidence.snippet}`.toLowerCase();
      
      // Verificar se menciona empresa + concorrente
      if (text.includes(company.name.toLowerCase())) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            // Calcular match level do concorrente
            let matchLevel = 2; // Double: Empresa + Concorrente
            const components = [company.name, competitorName.toUpperCase()];
            
            // Triple: menciona produto específico
            if (keywords.slice(1).some(k => text.includes(k))) {
              matchLevel = 3;
              components.push('Produto');
            }
            
            // Quadruple: menciona módulo
            if (/financeiro|controladoria|estoque|compras|produção|fiscal/i.test(text)) {
              matchLevel = 4;
              components.push('Módulo');
            }
            
            // Quintuple: menciona técnico
            if (/implementação|migração|integração|customização|versão/i.test(text)) {
              matchLevel = 5;
              components.push('Técnico');
            }
            
            competitorEvidences.push({
              ...evidence,
              matchLevel: matchLevel as 2 | 3 | 4 | 5,
              components,
              confidence: matchLevel === 5 ? 98 : matchLevel === 4 ? 90 : matchLevel === 3 ? 75 : 50
            });
            
            break;
          }
        }
      }
    }
    
    if (competitorEvidences.length > 0) {
      // Calcular melhor match
      const bestMatch = Math.max(...competitorEvidences.map(e => e.matchLevel));
      
      competitors.push({
        name: competitorName.toUpperCase(),
        matchLevel: bestMatch,
        evidences: competitorEvidences,
        totalEvidences: competitorEvidences.length,
        status: competitorEvidences.some(e => e.publishedAt && 
                new Date(e.publishedAt) > new Date(Date.now() - 30*24*60*60*1000)) 
                ? 'active' : 'implemented'
      });
    }
  }
  
  // Ordenar por match level e quantidade de evidências
  return competitors.sort((a, b) => {
    if (b.matchLevel !== a.matchLevel) return b.matchLevel - a.matchLevel;
    return b.totalEvidences - a.totalEvidences;
  });
}

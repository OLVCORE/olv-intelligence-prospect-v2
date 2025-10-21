// ✅ Adapter para buscar dados jurídicos no JusBrasil
import { logger } from '@/lib/utils/logger';
import { cache, CacheKeys } from '@/lib/utils/cache';

export interface JusBrasilData {
  cnpj: string;
  companyName: string;
  totalProcesses: number;
  activeProcesses: number;
  processes: Array<{
    id: string;
    number: string;
    court: string;
    type: string;
    subject: string;
    status: string;
    startDate: string;
    lastUpdate?: string;
    value?: number;
    parties: Array<{
      name: string;
      role: string;
    }>;
  }>;
  processesByType: {
    trabalhista: number;
    civel: number;
    tributario: number;
    criminal: number;
    outros: number;
  };
  processesByStatus: {
    ativo: number;
    arquivado: number;
    suspenso: number;
    finalizado: number;
  };
  riskLevel: 'baixo' | 'medio' | 'alto' | 'critico';
  legalHealthScore: number;
}

export interface JusBrasilOptions {
  includeArchived?: boolean;
  maxResults?: number;
}

/**
 * Busca dados jurídicos da empresa no JusBrasil
 */
export async function fetchJusBrasilData(
  cnpj: string,
  options: JusBrasilOptions = {}
): Promise<JusBrasilData> {
  const cacheKey = `jusbrasil:${cnpj}`;
  
  // Verificar cache
  const cached = cache.get<JusBrasilData>(cacheKey);
  if (cached) {
    logger.info('JUSBRASIL', 'Cache hit', { cnpj });
    return cached;
  }

  try {
    logger.info('JUSBRASIL', 'Fetching legal data', { cnpj });

    // Mock de dados realísticos para demonstração
    // Em produção, isso seria uma integração real com JusBrasil API ou scraping
    const mockData: JusBrasilData = {
      cnpj,
      companyName: 'Empresa Demo LTDA',
      totalProcesses: 8,
      activeProcesses: 3,
      processes: [
        {
          id: '1',
          number: '1234567-89.2024.8.26.0100',
          court: 'TJSP - Tribunal de Justiça de São Paulo',
          type: 'Trabalhista',
          subject: 'Reclamação Trabalhista',
          status: 'Em andamento',
          startDate: '2024-03-15',
          lastUpdate: '2025-09-20',
          value: 45000,
          parties: [
            { name: 'João Silva', role: 'Reclamante' },
            { name: 'Empresa Demo LTDA', role: 'Reclamada' }
          ]
        },
        {
          id: '2',
          number: '9876543-21.2023.8.26.0100',
          court: 'TJSP - Tribunal de Justiça de São Paulo',
          type: 'Cível',
          subject: 'Ação de Cobrança',
          status: 'Arquivado',
          startDate: '2023-06-10',
          lastUpdate: '2024-12-15',
          value: 12000,
          parties: [
            { name: 'Fornecedor XYZ', role: 'Autor' },
            { name: 'Empresa Demo LTDA', role: 'Réu' }
          ]
        },
        {
          id: '3',
          number: '5555666-77.2025.8.26.0100',
          court: 'TJSP - Tribunal de Justiça de São Paulo',
          type: 'Tributário',
          subject: 'Execução Fiscal',
          status: 'Em andamento',
          startDate: '2025-01-20',
          value: 8500,
          parties: [
            { name: 'Fazenda Pública', role: 'Exequente' },
            { name: 'Empresa Demo LTDA', role: 'Executado' }
          ]
        }
      ],
      processesByType: {
        trabalhista: 3,
        civel: 2,
        tributario: 2,
        criminal: 0,
        outros: 1
      },
      processesByStatus: {
        ativo: 3,
        arquivado: 4,
        suspenso: 1,
        finalizado: 0
      },
      riskLevel: 'medio',
      legalHealthScore: 68.5
    };

    // Cachear por 7 dias (dados jurídicos mudam menos frequentemente)
    cache.set(cacheKey, mockData, 7 * 24 * 60 * 60 * 1000);

    logger.info('JUSBRASIL', 'Legal data fetched', {
      cnpj,
      totalProcesses: mockData.totalProcesses,
      activeProcesses: mockData.activeProcesses
    });

    return mockData;
  } catch (error) {
    logger.error('JUSBRASIL', 'Failed to fetch legal data', { error, cnpj });
    throw error;
  }
}

/**
 * Calcula nível de risco jurídico baseado nos processos
 */
export function calculateLegalRiskLevel(data: JusBrasilData): 'baixo' | 'medio' | 'alto' | 'critico' {
  const { totalProcesses, activeProcesses, processesByType } = data;

  // Processos criminais são críticos
  if (processesByType.criminal > 0) return 'critico';

  // Muitos processos ativos
  if (activeProcesses > 10) return 'critico';
  if (activeProcesses > 5) return 'alto';

  // Total de processos
  if (totalProcesses > 20) return 'alto';
  if (totalProcesses > 10) return 'medio';
  if (totalProcesses > 5) return 'medio';

  return 'baixo';
}

/**
 * Calcula score de saúde jurídica (0-100)
 */
export function calculateLegalHealthScore(data: JusBrasilData): number {
  let score = 100;

  // Penaliza por processos ativos
  score -= data.activeProcesses * 5;

  // Penaliza por processos criminais
  score -= data.processesByType.criminal * 20;

  // Penaliza por volume total
  if (data.totalProcesses > 20) score -= 20;
  else if (data.totalProcesses > 10) score -= 10;
  else if (data.totalProcesses > 5) score -= 5;

  // Penaliza por processos trabalhistas (indicam problemas internos)
  score -= data.processesByType.trabalhista * 3;

  return Math.max(0, Math.min(100, score));
}

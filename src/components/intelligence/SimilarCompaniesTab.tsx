import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, MapPin, Users, TrendingUp, AlertTriangle, Plus, Sparkles, Eye, RefreshCw, Globe, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimilarCompaniesTabProps {
  companyId: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  state?: string;
  size?: string;
}

interface WebDiscoveredCompany {
  id?: string;
  name: string;
  cnpj: string | null;
  setor: string;
  uf: string;
  city?: string;
  employees?: number | null;
  revenue?: number | null;
  website?: string | null;
  linkedin_url?: string | null;
  source: string;
  discovery_method: string;
  discovered_at: string;
  similarity_score: number;
  needs_enrichment: boolean;
  enrichment_status: string;
  keywords?: string[];
  already_in_database: boolean;
  existing_id?: string | null;
  raw_data?: any;
  // Campos ICP
  porte?: string;
  regime_tributario?: string;
  capital_social?: number;
  cnae?: string;
  // Sistema de pontuação ICP
  icp_score?: number;
  icp_tier?: 'premium' | 'qualified' | 'potential' | 'low';
  icp_reasons?: string[];
}

interface SimilarCompaniesData {
  similar_companies: WebDiscoveredCompany[];
  statistics: {
    total: number;
    new_companies: number;
    already_in_database: number;
    needs_enrichment: number;
    by_discovery_method: Record<string, number>;
  };
  insights: string[];
  search_criteria: {
    cnae?: string;
    sector?: string;
    state?: string;
    keywords: string;
  };
}

// Função para calcular similaridade
function calculateSimilarity(result: any, target: { companyName: string; sector?: string; state?: string }): number {
  let score = 0;
  
  const resultText = `${result.title || ''} ${result.snippet || ''} ${result.description || ''}`.toLowerCase();
  
  // Setor similar (+40 pontos) - AUMENTADO
  if (target.sector) {
    const sectorNormalized = target.sector.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (resultText.includes(sectorNormalized) || resultText.includes(target.sector.toLowerCase())) {
      score += 40;
    }
  }
  
  // Estado similar (+25 pontos) - AUMENTADO
  if (target.state && resultText.includes(target.state.toLowerCase())) {
    score += 25;
  }
  
  // Nome contém palavras-chave (+20 pontos)
  const targetWords = target.companyName.toLowerCase().split(' ').filter(w => w.length > 3);
  const matchedWords = targetWords.filter(word => resultText.includes(word));
  if (matchedWords.length > 0) {
    score += 20;
  }
  
  // Tem CNPJ (+10 pontos)
  if (result.cnpj || /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/.test(resultText)) {
    score += 10;
  }
  
  // Palavras relacionadas a indústria (+15 pontos) - NOVO
  const industryWords = ['indústria', 'industria', 'fabricante', 'comercio', 'comércio', 'ltda', 'sa'];
  if (industryWords.some(word => resultText.includes(word))) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

// Função para inferir regime tributário baseado em porte e capital social
function inferRegimeTributario(porte: string, capitalSocial: number | null): string {
  // Regras simplificadas (baseado em legislação brasileira)
  
  if (porte === 'MEI') {
    return 'Simples Nacional (MEI)';
  }
  
  if (porte === 'ME' || porte === 'EPP') {
    // ME/EPP podem ser Simples ou Presumido
    if (capitalSocial && capitalSocial > 4800000) {
      return 'Lucro Presumido';
    }
    return 'Simples Nacional';
  }
  
  // Demais (grandes empresas)
  if (porte === 'DEMAIS' || porte === 'GRANDE') {
    if (capitalSocial && capitalSocial > 78000000) {
      return 'Lucro Real (obrigatório)';
    }
    return 'Lucro Presumido ou Real';
  }
  
  return 'Não identificado';
}

// Função para estimar funcionários baseado em porte
function estimateEmployeesFromPorte(porte: string): number | null {
  // Estimativas baseadas em classificação de porte empresarial brasileiro
  switch (porte?.toUpperCase()) {
    case 'MEI':
      return 1;
    case 'ME':
      return 15; // Média entre 1-19
    case 'EPP':
      return 75; // Média entre 20-99
    case 'DEMAIS':
    case 'GRANDE':
      return 300; // Média conservadora para grandes empresas
    default:
      return null;
  }
}

// Parser inteligente de dados da web
function parseWebResult(result: any): Partial<WebDiscoveredCompany> {
  // Extrair CNPJ (formato: 00.000.000/0000-00 ou 00000000000000)
  const cnpjRegex = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
  const textToSearch = `${result.snippet || ''} ${result.title || ''} ${result.url || ''}`;
  const cnpjMatches = textToSearch.match(cnpjRegex);
  const cnpj = cnpjMatches?.[0]?.replace(/\D/g, '') || result.cnpj || result.document;
  
  // Extrair número de funcionários
  const employeesRegex = /(\d+(?:\.\d+)?)\s*(?:funcionários|colaboradores|empregados)/i;
  const employeesMatch = textToSearch.match(employeesRegex);
  const employees = employeesMatch ? parseInt(employeesMatch[1].replace('.', '')) : result.employees || result.employee_count;
  
  // Extrair estado (sigla UF)
  const stateRegex = /\b([A-Z]{2})\b/g;
  const stateMatch = textToSearch.match(stateRegex);
  const uf = stateMatch?.[0] || result.state || result.uf || result.location?.split(',')[1]?.trim()?.substring(0, 2);
  
  // Extrair cidade
  const cityRegex = /([A-Z][a-zÀ-ú]+(?:\s+[A-Z][a-zÀ-ú]+)*)\s*[,-]\s*([A-Z]{2})/;
  const cityMatch = textToSearch.match(cityRegex);
  const city = cityMatch?.[1] || result.city;
  
  // Detectar setor por palavras-chave
  let setor = result.industry || result.sector || result.segment;
  if (!setor) {
    const snippetLower = textToSearch.toLowerCase();
    if (snippetLower.includes('plást')) setor = 'Plásticos';
    else if (snippetLower.includes('metal')) setor = 'Metalurgia';
    else if (snippetLower.includes('têxtil') || snippetLower.includes('textil')) setor = 'Têxtil';
    else if (snippetLower.includes('alimento')) setor = 'Alimentos';
    else if (snippetLower.includes('tecnologia') || snippetLower.includes('software')) setor = 'Tecnologia';
  }
  
  // Limpar nome da empresa
  let name = result.company_name || result.name || result.title || 'Empresa desconhecida';
  name = name.replace(/\s*\.\.\./g, '').trim();
  
  return {
    name,
    cnpj,
    employees,
    setor,
    uf,
    city,
    website: result.website || (result.url?.includes('linkedin') ? null : result.url),
    linkedin_url: result.url?.includes('linkedin') ? result.url : result.linkedin_url || result.linkedin,
    raw_data: result
  };
}

export function SimilarCompaniesTab({ 
  companyId, 
  companyName, 
  cnpj,
  sector, 
  state, 
  size 
}: SimilarCompaniesTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddingCompany, setIsAddingCompany] = useState<string | null>(null);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['similar-companies-web', companyId, companyName, sector, state],
    queryFn: async (): Promise<SimilarCompaniesData> => {
      console.log('[DEEP-SEARCH] ===== BUSCA PROFUNDA 15 CAMADAS =====');
      
      // PASSO 1: Buscar dados da empresa alvo
      console.log('[DEBUG] ===== EMPRESA ALVO =====');
      console.log('[DEBUG] ID:', companyId);
      
      let targetCompany: any = {
        company_name: companyName,
        cnpj: cnpj,
        state: state,
        city: null,
        sector: sector
      };
      
      const { data: sc, error: fetchError } = await (supabase as any)
        .from('suggested_companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      console.log('[DEBUG] Erro ao buscar:', fetchError);
      
      if (fetchError) {
        console.error('[DEBUG] ❌ Erro ao buscar empresa:', fetchError);
        throw new Error(`Erro ao buscar empresa: ${fetchError.message}`);
      }

      if (sc) {
        targetCompany = {
          company_name: sc.company_name || companyName,
          cnpj: sc.cnpj || cnpj,
          state: sc.state || state,
          city: sc.city,
          sector: sc.sector || sector
        };
      }

      console.log('[DEBUG] Nome:', targetCompany.company_name);
      console.log('[DEBUG] CNPJ:', targetCompany.cnpj);
      console.log('[DEBUG] Setor:', targetCompany.sector);
      console.log('[DEBUG] CNAE:', sc?.cnae_principal);
      console.log('[DEBUG] Estado:', targetCompany.state);
      console.log('[DEBUG] Funcionários:', sc?.employees_count);
      console.log('[DEBUG] ========================');
      
      if (!targetCompany.company_name) {
        console.error('[DEBUG] ❌ Empresa não encontrada ou sem nome');
        throw new Error('Empresa não encontrada');
      }

      console.log('[DEEP-SEARCH] Dados da empresa alvo:', {
        name: targetCompany.company_name,
        cnpj: targetCompany.cnpj,
        state: targetCompany.state,
        city: targetCompany.city,
        sector: targetCompany.sector,
        employees: sc?.employees_count
      });

      // Inferir setor se não existir (MOVER PARA ANTES DO ICP PROFILE)
      let inferredSector = targetCompany.sector;
      if (!inferredSector && targetCompany.company_name) {
        const nameLower = targetCompany.company_name.toLowerCase();
        if (nameLower.includes('plast')) inferredSector = 'Plásticos';
        else if (nameLower.includes('metal')) inferredSector = 'Metalurgia';
        else if (nameLower.includes('textil') || nameLower.includes('têxtil')) inferredSector = 'Têxtil';
        else if (nameLower.includes('alimento')) inferredSector = 'Alimentos';
        else if (nameLower.includes('tecno') || nameLower.includes('software')) inferredSector = 'Tecnologia';
        console.log('[DEEP-SEARCH] Setor inferido:', inferredSector);
      }

      // ==================== DEFINIR PERFIL ICP ====================
      console.log('[ICP-PROFILE] Definindo perfil ICP da empresa alvo...');
      
      // Calcular faixa de funcionários aceitável (±50%)
      let minEmployees = 0;
      let maxEmployees = 999999;
      let targetEmployees = sc?.employees_count || null;
      
      if (targetEmployees) {
        minEmployees = Math.floor(targetEmployees * 0.5); // -50%
        maxEmployees = Math.ceil(targetEmployees * 1.5); // +50%
        console.log('[ICP-PROFILE] Faixa de funcionários:', minEmployees, '-', maxEmployees);
      } else {
        // Se não tem dados, usar faixa padrão do ICP TOTVS (médias/grandes empresas)
        minEmployees = 50;
        maxEmployees = 5000;
        console.log('[ICP-PROFILE] Usando faixa padrão ICP TOTVS:', minEmployees, '-', maxEmployees);
      }
      
      // Definir regime tributário esperado
      const expectedRegime = targetEmployees && targetEmployees >= 500 
        ? 'Lucro Real' 
        : 'Lucro Presumido ou Real';
      console.log('[ICP-PROFILE] Regime tributário esperado:', expectedRegime);
      
      // Calcular faixa de receita esperada (baseado em funcionários)
      let minRevenue = 0;
      let maxRevenue = 999999999999;
      if (targetEmployees) {
        // Estimativa: R$ 100k-200k receita por funcionário/ano
        minRevenue = targetEmployees * 100000 * 0.5;
        maxRevenue = targetEmployees * 200000 * 1.5;
        console.log('[ICP-PROFILE] Faixa de receita estimada:', 
          'R$', (minRevenue / 1000000).toFixed(1), 'M -',
          'R$', (maxRevenue / 1000000).toFixed(1), 'M'
        );
      }
      
      // Armazenar perfil ICP
      const icpProfile = {
        minEmployees,
        maxEmployees,
        expectedRegime,
        minRevenue,
        maxRevenue,
        targetCnae: sc?.cnae_principal,
        targetEmployees,
        targetSector: inferredSector
      };
      console.log('[ICP-PROFILE] Perfil ICP definido:', icpProfile);

      const targetState = targetCompany.state;
      const targetCity = targetCompany.city;

      // Extração inteligente de palavras-chave
      const extractKeywords = (name: string): string[] => {
        const stopWords = [
          'ltda', 'sa', 's.a.', 's/a', 'eireli', 'me', 'epp', 'mei',
          'industria', 'indústria', 'comercio', 'comércio', 
          'servicos', 'serviços', 'e', 'de', 'da', 'do', 'das', 'dos',
          'com', 'para', 'em', 'a', 'o', 'os', 'as'
        ];
        
        const normalized = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z\s]/g, ' ')
          .trim();
        
        const words = normalized
          .split(/\s+/)
          .filter(word => word.length > 3)
          .filter(word => !stopWords.includes(word))
          .filter(word => !/^\d+$/.test(word));
        
        const unique = [...new Set(words)];
        console.log('[EXTRACT-KEYWORDS] Input:', name, '→ Output:', unique);
        return unique;
      };

      const keywords = extractKeywords(targetCompany.company_name || companyName);

      // Rate limiting
      const MAX_QUERIES_PER_LAYER = 2;
      const DELAY_BETWEEN_QUERIES = 1000;
      const MAX_TOTAL_QUERIES = 20;
      let totalQueries = 0;

      let allResults: any[] = [];

      // ==================== CAMADA 1: SETOR ====================
      if (inferredSector && totalQueries < MAX_TOTAL_QUERIES) {
        console.log('[DEBUG] 🔍 CAMADA 1: Setor -', inferredSector);
        try {
          const queries = [
            targetState ? `empresas ${inferredSector} ${targetState} Brasil` : `empresas ${inferredSector} Brasil`,
            `indústria ${inferredSector} CNPJ`
          ].slice(0, MAX_QUERIES_PER_LAYER);
          
          console.log('[DEBUG] Queries da CAMADA 1:', queries);
          
          for (const query of queries) {
            if (totalQueries >= MAX_TOTAL_QUERIES) break;
            
            try {
              console.log('[SEARCH-WEB] 🔍 Query:', query, '(limit: 10)');
              
              const { data: searchData, error: searchError } = await supabase.functions.invoke('web-search', {
                body: { query, limit: 10, country: 'BR', language: 'pt' }
              });
              
              if (searchError) {
                console.error('[SEARCH-WEB] ❌ Erro Edge Function:', searchError);
              } else if (!searchData?.success) {
                console.error('[SEARCH-WEB] ❌ API retornou erro:', searchData?.error);
              } else {
                console.log('[SEARCH-WEB] ✅ Resultados:', searchData.results?.length || 0);
                
                // LOG DETALHADO DOS PRIMEIROS 3 RESULTADOS
                if (searchData.results && searchData.results.length > 0) {
                  console.log('[SEARCH-WEB] Primeiros resultados:');
                  searchData.results.slice(0, 3).forEach((r: any, i: number) => {
                    console.log(`  ${i+1}. ${r.title}`);
                    console.log(`     URL: ${r.url}`);
                    console.log(`     Snippet: ${r.snippet?.substring(0, 100)}...`);
                  });
                  allResults.push(...searchData.results.map((r: any) => ({ ...r, source: 'sector', score: 100 })));
                }
              }
              
              console.log('[DEBUG] CAMADA 1 - Query:', query, '- Resultados:', searchData?.results?.length || 0);
              totalQueries++;
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_QUERIES));
            } catch (err) {
              console.error('[DEBUG] ❌ Erro na query:', query, err);
            }
          }
          
          console.log('[DEBUG] CAMADA 1 concluída. Total de resultados até agora:', allResults.length);
        } catch (err) {
          console.error('[DEEP-SEARCH] Erro CAMADA 1:', err);
        }
      } else {
        console.log('[DEBUG] ⏭️ CAMADA 1 pulada (sem setor ou limite atingido)');
      }

      // ==================== CAMADA 2: PALAVRAS-CHAVE ====================
      if (keywords.length > 0 && totalQueries < MAX_TOTAL_QUERIES) {
        console.log('[DEBUG] 🔍 CAMADA 2: Palavras-chave -', keywords);
        try {
          for (const keyword of keywords.slice(0, 2)) {
            if (totalQueries >= MAX_TOTAL_QUERIES) break;
            
            const query = targetState 
              ? `indústria ${keyword} ${targetState} Brasil` 
              : `fabricantes ${keyword} Brasil`;
            
            try {
              console.log('[SEARCH-WEB] 🔍 Query:', query, '(limit: 5)');
              const { data: searchData, error: searchError } = await supabase.functions.invoke('web-search', {
                body: { query, limit: 5, country: 'BR', language: 'pt' }
              });
              
              if (searchError) {
                console.error('[SEARCH-WEB] ❌ Erro:', searchError);
              } else if (searchData?.success && searchData.results) {
                console.log('[SEARCH-WEB] ✅ Resultados:', searchData.results.length);
                allResults.push(...searchData.results.map((r: any) => ({ ...r, source: 'keyword', score: 80 })));
              }
              
              console.log('[DEBUG] CAMADA 2 - Query:', query, '- Resultados:', searchData?.results?.length || 0);
              totalQueries++;
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_QUERIES));
            } catch (err) {
              console.error('[DEBUG] ❌ Erro na query:', query, err);
            }
          }
          console.log('[DEBUG] CAMADA 2 concluída. Total de resultados até agora:', allResults.length);
        } catch (err) {
          console.error('[DEEP-SEARCH] Erro CAMADA 2:', err);
        }
      } else {
        console.log('[DEBUG] ⏭️ CAMADA 2 pulada (sem keywords ou limite atingido)');
      }

      // ==================== CAMADA 3: LINKEDIN ====================
      if (inferredSector && totalQueries < MAX_TOTAL_QUERIES) {
        console.log('[DEBUG] 🔍 CAMADA 3: LinkedIn');
        try {
          const query = `empresas ${inferredSector} Brasil site:linkedin.com`;
          
          console.log('[SEARCH-WEB] 🔍 Query:', query, '(limit: 5)');
          const { data: searchData, error: searchError } = await supabase.functions.invoke('web-search', {
            body: { query, limit: 5, country: 'BR', language: 'pt' }
          });
          
          if (searchError) {
            console.error('[SEARCH-WEB] ❌ Erro:', searchError);
          } else if (searchData?.success && searchData.results) {
            console.log('[SEARCH-WEB] ✅ Resultados:', searchData.results.length);
            allResults.push(...searchData.results.map((r: any) => ({ ...r, source: 'linkedin', score: 85 })));
          }
          
          console.log('[DEBUG] CAMADA 3 concluída. Total de resultados até agora:', allResults.length);
          totalQueries++;
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_QUERIES));
        } catch (err) {
          console.error('[DEEP-SEARCH] Erro CAMADA 3:', err);
        }
      } else {
        console.log('[DEBUG] ⏭️ CAMADA 3 pulada');
      }

      // ==================== CAMADA 4: CONCORRENTES ====================
      if (totalQueries < MAX_TOTAL_QUERIES) {
        console.log('[DEBUG] 🔍 CAMADA 4: Concorrentes');
        try {
          const query = `concorrentes ${targetCompany.company_name}`;
          
          console.log('[SEARCH-WEB] 🔍 Query:', query, '(limit: 5)');
          const { data: searchData, error: searchError } = await supabase.functions.invoke('web-search', {
            body: { query, limit: 5, country: 'BR', language: 'pt' }
          });
          
          if (searchError) {
            console.error('[SEARCH-WEB] ❌ Erro:', searchError);
          } else if (searchData?.success && searchData.results) {
            console.log('[SEARCH-WEB] ✅ Resultados:', searchData.results.length);
            allResults.push(...searchData.results.map((r: any) => ({ ...r, source: 'competitors', score: 90 })));
          }
          
          console.log('[DEBUG] CAMADA 4 concluída. Total de resultados até agora:', allResults.length);
          totalQueries++;
        } catch (err) {
          console.error('[DEEP-SEARCH] Erro CAMADA 4:', err);
        }
      } else {
        console.log('[DEBUG] ⏭️ CAMADA 4 pulada (limite atingido)');
      }

      console.log('[DEEP-SEARCH] Total de queries executadas:', totalQueries);
      console.log('[DEEP-SEARCH] Total de resultados brutos:', allResults.length);
      
      // FALLBACK: Se nenhum resultado da web, buscar no banco
      if (allResults.length === 0) {
        console.error('[DEBUG] ❌ NENHUM RESULTADO DA WEB!');
        console.log('[DEBUG] Possíveis causas:');
        console.log('[DEBUG] 1. Edge Function web-search não está funcionando');
        console.log('[DEBUG] 2. API Serper sem créditos ou com erro');
        console.log('[DEBUG] 3. Queries muito específicas (nenhum resultado)');
        console.log('[DEBUG] 4. Timeout nas requisições');
        console.log('[DEBUG] Tentando FALLBACK no banco de dados...');
        console.log('[DEBUG] Keywords extraídas:', keywords);
        
        try {
          let query = (supabase as any)
            .from('suggested_companies')
            .select('*')
            .neq('id', companyId);

          if (keywords.length > 0) {
            query = query.or(keywords.map((k: string) => `company_name.ilike.%${k}%`).join(','));
          }

          const { data: dbCompanies } = await query.limit(20);

          if (dbCompanies && dbCompanies.length > 0) {
            console.log('[DEEP-SEARCH] Fallback encontrou:', dbCompanies.length, 'empresas');
            allResults = dbCompanies.map((company: any) => ({
              title: company.company_name,
              url: company.website,
              snippet: `${company.sector || inferredSector || ''} - ${company.state || ''}`,
              description: `${company.sector || inferredSector || ''} - ${company.state || ''}`,
              cnpj: company.cnpj,
              location: company.state,
              industry: company.sector || inferredSector,
              source: 'database_fallback'
            }));
          }
        } catch (err) {
          console.error('[DEEP-SEARCH] Erro no fallback:', err);
        }
      }

      // Processar e limpar resultados com filtro rigoroso
      console.log('[DEBUG] ===== PROCESSANDO RESULTADOS =====');
      console.log('[DEBUG] Total de resultados brutos:', allResults.length);
      console.log('[PROCESSING] Processando', allResults.length, 'resultados brutos...');
      
      const processedCompanies: WebDiscoveredCompany[] = allResults
        .map((result, index) => {
          console.log(`[DEBUG] Processando resultado ${index + 1}/${allResults.length}:`, result.title);
          
          const parsed = parseWebResult(result);
          console.log('[DEBUG] Parsed:', {
            name: parsed.name,
            cnpj: parsed.cnpj,
            setor: parsed.setor,
            uf: parsed.uf
          });
          
          const similarity_score = calculateSimilarity(result, { 
            companyName: targetCompany.company_name, 
            sector: inferredSector, 
            state: targetState 
          });
          
          return {
            id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: result.source === 'database_fallback' ? 'database_fallback' : 'web_discovery',
            discovery_method: result.source || 'web_search',
            discovered_at: new Date().toISOString(),
            similarity_score,
            needs_enrichment: result.source !== 'database_fallback',
            enrichment_status: result.source === 'database_fallback' ? 'completed' : 'pending',
            already_in_database: result.source === 'database_fallback',
            name: parsed.name || 'Empresa desconhecida',
            cnpj: parsed.cnpj,
            setor: parsed.setor || inferredSector || 'N/A',
            uf: parsed.uf || targetState || '',
            city: parsed.city,
            employees: parsed.employees,
            website: parsed.website,
            linkedin_url: parsed.linkedin_url,
            raw_data: result
          } as WebDiscoveredCompany;
        });

      // ==================== ENRIQUECER TODAS AS EMPRESAS ====================
      console.log('[ENRICHMENT] Iniciando enriquecimento de', processedCompanies.length, 'empresas...');
      
      const enrichedCompanies = await Promise.all(
        processedCompanies.map(async (company) => {
          try {
            // Pular enriquecimento se já está no banco
            if (company.source === 'database_fallback') {
              console.log('[ENRICHMENT] ⏭️ Pulando (já no banco):', company.name);
              return company;
            }

            // Pular se não tem CNPJ (não é possível validar)
            if (!company.cnpj) {
              console.log('[ENRICHMENT] ⚠️ Sem CNPJ:', company.name);
              return company;
            }

            console.log('[ENRICHMENT] Enriquecendo:', company.name);
            
            // FONTE 1: Receita Federal (obrigatório)
            try {
              const { data: receitaData, error: receitaError } = await supabase.functions.invoke('enrich-company-receita', {
                body: { 
                  cnpj: company.cnpj.replace(/\D/g, ''),
                  company_id: company.id
                }
              });
              
              if (!receitaError && receitaData?.success && receitaData.data) {
                company.porte = receitaData.data.porte; // MEI, ME, EPP, DEMAIS
                company.capital_social = receitaData.data.capital_social ? parseFloat(receitaData.data.capital_social) : null;
                company.regime_tributario = inferRegimeTributario(receitaData.data.porte, company.capital_social);
                company.employees = company.employees || estimateEmployeesFromPorte(receitaData.data.porte);
                
                console.log('[ENRICHMENT] ✅ Receita Federal:', {
                  porte: company.porte,
                  regime: company.regime_tributario,
                  capital: company.capital_social,
                  employees: company.employees
                });
              } else {
                console.log('[ENRICHMENT] ⚠️ Receita Federal falhou:', receitaError?.message || 'Sem dados');
              }
            } catch (error) {
              console.error('[ENRICHMENT] Erro Receita Federal:', error);
            }

            // Pequeno delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return company;
            
          } catch (error) {
            console.error('[ENRICHMENT] Erro geral:', company.name, error);
            return company;
          }
        })
      );

      console.log('[ENRICHMENT] Enriquecimento concluído');

      // ==================== SISTEMA DE PONTUAÇÃO ICP ====================
      console.log('[ICP-SCORE] Calculando pontuação ICP para cada empresa...');
      
      const scoredCompanies = enrichedCompanies.map(company => {
        let icpScore = 0;
        const icpReasons: string[] = [];
        
        console.log('\n[ICP-SCORE] ===== Avaliando:', company.name, '=====');
        
        // CRITÉRIO 1: Tem CNPJ? (+20 pontos)
        if (company.cnpj && company.cnpj.replace(/\D/g, '').length === 14) {
          icpScore += 20;
          icpReasons.push('✅ CNPJ válido (+20)');
        } else {
          icpReasons.push('⚠️ Sem CNPJ (0)');
        }
        
        // CRITÉRIO 2: Número de funcionários conhecido? (+15 pontos)
        if (company.employees) {
          icpScore += 15;
          icpReasons.push(`✅ ${company.employees} funcionários (+15)`);
          
          // CRITÉRIO 3: Porte adequado? (+25 pontos BÔNUS)
          if (company.employees >= icpProfile.minEmployees && company.employees <= icpProfile.maxEmployees) {
            icpScore += 25;
            icpReasons.push(`🎯 Porte ideal (${icpProfile.minEmployees}-${icpProfile.maxEmployees}) (+25)`);
          } else if (company.employees >= icpProfile.minEmployees * 0.3 && company.employees <= icpProfile.maxEmployees * 2) {
            icpScore += 10;
            icpReasons.push(`⚠️ Porte aceitável (+10)`);
          } else {
            icpReasons.push(`❌ Porte fora da faixa (0)`);
          }
        } else {
          icpReasons.push('⚠️ Funcionários desconhecidos (0)');
        }
        
        // CRITÉRIO 4: Regime tributário conhecido? (+10 pontos)
        if (company.regime_tributario) {
          icpScore += 10;
          icpReasons.push(`✅ Regime: ${company.regime_tributario} (+10)`);
          
          // BÔNUS: Lucro Real? (+10 pontos)
          if (company.regime_tributario.includes('Lucro Real')) {
            icpScore += 10;
            icpReasons.push('🔥 Lucro Real (+10)');
          }
        } else {
          icpReasons.push('⚠️ Regime desconhecido (0)');
        }
        
        // CRITÉRIO 5: Porte Receita Federal? (+10 pontos)
        if (company.porte) {
          if (company.porte === 'DEMAIS' || company.porte === 'EPP') {
            icpScore += 10;
            icpReasons.push(`✅ Porte RF: ${company.porte} (+10)`);
          } else if (company.porte === 'ME') {
            icpScore += 5;
            icpReasons.push(`⚠️ Porte RF: ME (+5)`);
          } else {
            icpReasons.push(`❌ Porte RF muito pequeno: ${company.porte} (0)`);
          }
        } else {
          icpReasons.push('⚠️ Porte RF desconhecido (0)');
        }
        
        // CRITÉRIO 6: CNAE similar? (+15 pontos)
        if (company.cnae && icpProfile.targetCnae) {
          const companyCnaePrefix = company.cnae.substring(0, 4);
          const targetCnaePrefix = icpProfile.targetCnae.substring(0, 4);
          
          if (companyCnaePrefix === targetCnaePrefix) {
            icpScore += 15;
            icpReasons.push(`✅ CNAE idêntico (+15)`);
          } else if (company.cnae.substring(0, 2) === icpProfile.targetCnae.substring(0, 2)) {
            icpScore += 8;
            icpReasons.push(`⚠️ CNAE similar (+8)`);
          } else {
            icpReasons.push(`❌ CNAE diferente (0)`);
          }
        } else {
          icpReasons.push('⚠️ CNAE desconhecido (0)');
        }
        
        // CRITÉRIO 7: Setor correto? (+10 pontos)
        if (company.setor && icpProfile.targetSector) {
          const companySetor = company.setor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const targetSetor = icpProfile.targetSector.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          if (companySetor.includes(targetSetor) || targetSetor.includes(companySetor)) {
            icpScore += 10;
            icpReasons.push(`✅ Setor correto (+10)`);
          }
        }
        
        // CRITÉRIO 8: Localização? (+5 pontos)
        if (company.uf) {
          icpScore += 5;
          icpReasons.push(`✅ Estado: ${company.uf} (+5)`);
        }
        
        // CRITÉRIO 9: Website? (+5 pontos)
        if (company.website) {
          icpScore += 5;
          icpReasons.push(`✅ Website (+5)`);
        }
        
        // Determinar tier
        const icp_tier = icpScore >= 80 ? 'premium' : 
                        icpScore >= 60 ? 'qualified' : 
                        icpScore >= 40 ? 'potential' : 'low';
        
        console.log('[ICP-SCORE] Pontuação final:', icpScore, '/100 -', icp_tier);
        console.log('[ICP-SCORE] Detalhamento:', icpReasons.join(' | '));
        
        return {
          ...company,
          icp_score: icpScore,
          icp_tier,
          icp_reasons: icpReasons
        };
      });

      // FILTRO MÍNIMO: Apenas remover lixo óbvio
      console.log('[DEBUG] ===== APLICANDO FILTROS =====');
      console.log('[DEBUG] Empresas antes dos filtros:', scoredCompanies.length);
      
      const filteredCompanies = scoredCompanies.filter((company, index) => {
        console.log(`\n[DEBUG] Filtrando ${index + 1}/${scoredCompanies.length}:`, company.name);
        console.log('[DEBUG] ICP Score:', company.icp_score);
        console.log('[DEBUG] ICP Tier:', company.icp_tier);
        
        // Rejeitar apenas artigos/listas/associações
        const titleLower = company.name.toLowerCase();
        const isInvalid = 
          titleLower.startsWith('as ') || 
          titleLower.startsWith('os ') || 
          titleLower.startsWith('top ') ||
          titleLower.startsWith('associação') ||
          titleLower.startsWith('sindicato') ||
          titleLower.startsWith('federação') ||
          titleLower.includes('maiores') ||
          titleLower.includes('melhores') ||
          titleLower.includes('ranking') ||
          titleLower.includes('lista de');
        
        if (isInvalid) {
          console.log('[DEBUG] ❌ Rejeitado: Artigo/Lista');
          console.log('[ICP-FILTER] ❌ Rejeitado (artigo):', company.name);
          return false;
        }
        
        // Rejeitar se ICP score muito baixo (< 20)
        if ((company.icp_score || 0) < 20) {
          console.log('[DEBUG] ❌ Rejeitado: ICP score muito baixo (<20)');
          console.log('[ICP-FILTER] ❌ Rejeitado (ICP score muito baixo):', company.name, company.icp_score);
          return false;
        }
        
        console.log('[DEBUG] ✅ APROVADO');
        return true;
      });
      
      console.log('[DEBUG] Empresas após filtros:', filteredCompanies.length);
      console.log('[DEBUG] ========================');

      // ORDENAR por ICP score (maior primeiro), depois por similaridade
      const sortedCompanies = filteredCompanies
        .filter((company, index, self) =>
          // Remover duplicatas por CNPJ ou nome
          index === self.findIndex(c => 
            (c.cnpj && c.cnpj === company.cnpj) || c.name === company.name
          )
        )
        .sort((a, b) => {
          const scoreDiff = (b.icp_score || 0) - (a.icp_score || 0);
          if (scoreDiff !== 0) return scoreDiff;
          return b.similarity_score - a.similarity_score;
        })
        .slice(0, 30); // Top 30 empresas

      console.log('[ICP-SCORE] ===== RESULTADO =====');
      console.log('[ICP-SCORE] Total após filtro:', sortedCompanies.length);
      console.log('[ICP-SCORE] 🔥 Premium (80+):', sortedCompanies.filter(c => c.icp_tier === 'premium').length);
      console.log('[ICP-SCORE] ⭐ Qualificado (60-79):', sortedCompanies.filter(c => c.icp_tier === 'qualified').length);
      console.log('[ICP-SCORE] ⚠️ Potencial (40-59):', sortedCompanies.filter(c => c.icp_tier === 'potential').length);
      console.log('[ICP-SCORE] 🔻 Baixo (20-39):', sortedCompanies.filter(c => c.icp_tier === 'low').length);

      // Verificar se já existem no banco
      const finalEnrichedCompanies: WebDiscoveredCompany[] = [];
      
      for (const company of sortedCompanies) {
        if (!company.cnpj) {
          finalEnrichedCompanies.push({ 
            ...company, 
            already_in_database: false,
            icp_tier: company.icp_tier || 'low',
            icp_score: company.icp_score || 0,
            icp_reasons: company.icp_reasons || []
          } as WebDiscoveredCompany);
          continue;
        }

        const { data: existing } = await (supabase as any)
          .from('suggested_companies')
          .select('id')
          .eq('cnpj', company.cnpj)
          .maybeSingle();

        finalEnrichedCompanies.push({
          ...company,
          already_in_database: !!existing,
          existing_id: existing?.id,
          icp_tier: company.icp_tier || 'low',
          icp_score: company.icp_score || 0,
          icp_reasons: company.icp_reasons || []
        } as WebDiscoveredCompany);
      }

      // Estatísticas
      const total = finalEnrichedCompanies.length;
      const newCompanies = finalEnrichedCompanies.filter(c => !c.already_in_database).length;
      const existingCompanies = finalEnrichedCompanies.filter(c => c.already_in_database).length;

      // Estatísticas do perfil ICP
      const avgEmployees = finalEnrichedCompanies.filter(c => c.employees).length > 0
        ? Math.round(finalEnrichedCompanies.reduce((sum, c) => sum + (c.employees || 0), 0) / finalEnrichedCompanies.filter(c => c.employees).length)
        : 0;

      // Insights com foco em ICP
      const insights: string[] = [];
      
      const premiumCount = finalEnrichedCompanies.filter(c => c.icp_tier === 'premium').length;
      const qualifiedCount = finalEnrichedCompanies.filter(c => c.icp_tier === 'qualified').length;
      const potentialCount = finalEnrichedCompanies.filter(c => c.icp_tier === 'potential').length;
      
      if (total > 0) {
        insights.push(`📊 ${total} empresas descobertas e classificadas por ICP`);
        
        if (premiumCount > 0) {
          insights.push(`🔥 ${premiumCount} empresas PREMIUM (ICP 80+) - Prioridade máxima!`);
        }
        
        if (qualifiedCount > 0) {
          insights.push(`⭐ ${qualifiedCount} empresas QUALIFICADAS (ICP 60-79) - Ótimos prospects`);
        }
        
        if (potentialCount > 0) {
          insights.push(`⚠️ ${potentialCount} empresas POTENCIAIS (ICP 40-59) - Investigar mais`);
        }
        
        insights.push(`💡 Empresas ordenadas por pontuação ICP (0-100)`);
        insights.push(`🎯 Foque nas empresas Premium e Qualificadas primeiro`);
        
        if (avgEmployees > 0) {
          insights.push(`👥 Média de funcionários: ${avgEmployees} (perfil target: ${icpProfile.minEmployees}-${icpProfile.maxEmployees})`);
        }
        
        if (newCompanies > 0) {
          insights.push(`🆕 ${newCompanies} empresas novas para adicionar à quarentena`);
        }
        
        if (existingCompanies > 0) {
          insights.push(`✅ ${existingCompanies} empresas já estão no banco de dados`);
        }
      } else {
        insights.push(`⚠️ Nenhuma empresa encontrada nesta busca`);
        insights.push(`💡 O sistema usa pontuação ICP (0-100) com filtro mínimo de 20 pontos`);
        insights.push(`🔄 Tente buscar novamente ou ajuste o perfil da empresa alvo`);
      }

      console.log('[SIMILAR-WEB] ===== RESULTADO FINAL =====');
      
      return {
        similar_companies: finalEnrichedCompanies,
        statistics: {
          total,
          new_companies: newCompanies,
          already_in_database: existingCompanies,
          needs_enrichment: newCompanies,
          by_discovery_method: {}
        },
        insights,
        search_criteria: { 
          sector, 
          state,
          keywords: ''
        }
      };
    },
    enabled: !!companyId && !!companyName,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddToQuarantine = async (company: WebDiscoveredCompany) => {
    try {
      setIsAddingCompany(company.name);
      console.log('[ADD-QUARANTINE] Adicionando empresa:', company.name);
      
      // Inserir na tabela suggested_companies com campos existentes
      const insertData: any = {
        cnpj: company.cnpj,
        source: 'similar_company_discovery',
        discovered_from_company_id: companyId,
        similarity_score: company.similarity_score,
        enrichment_status: 'pending',
        discovered_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      // Adicionar campos opcionais se existirem
      if (company.name) insertData.company_name = company.name;
      if (company.website) insertData.website = company.website;
      if (company.linkedin_url) insertData.linkedin_url = company.linkedin_url;
      
      const { data: newCompany, error } = await (supabase as any)
        .from('suggested_companies')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log('[ADD-QUARANTINE] Empresa adicionada:', newCompany.id);

      // Mostrar toast de sucesso
      toast({
        title: `✅ ${company.name} adicionada à quarentena!`,
        description: 'Iniciando processo de enriquecimento...',
      });

      // Iniciar enriquecimento automático em background
      startEnrichmentProcess(newCompany.id).catch(console.error);

      // Atualizar lista
      refetch();

    } catch (error: any) {
      console.error('[ADD-QUARANTINE] Erro:', error);
      toast({
        title: 'Erro ao adicionar empresa',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsAddingCompany(null);
    }
  };

  const startEnrichmentProcess = async (newCompanyId: string) => {
    try {
      console.log('[ENRICHMENT] Iniciando enriquecimento para:', newCompanyId);
      
      // Atualizar status para in_progress
      await supabase
        .from('suggested_companies')
        .update({ enrichment_status: 'in_progress' })
        .eq('id', newCompanyId);

      // PASSO 1: Enriquecer com Receita Federal (se tiver CNPJ)
      // TODO: Implementar edge function
      
      // PASSO 2: Enriquecer com Apollo (se tiver API key)
      // TODO: Implementar edge function

      // PASSO 3: Análise STC automática
      // TODO: Implementar edge function

      // Atualizar status para completed
      await supabase
        .from('suggested_companies')
        .update({ enrichment_status: 'completed' })
        .eq('id', newCompanyId);

      console.log('[ENRICHMENT] Enriquecimento iniciado com sucesso');
      
      toast({
        title: 'Enriquecimento em andamento',
        description: 'A empresa está sendo processada em segundo plano.'
      });
      
    } catch (error) {
      console.error('[ENRICHMENT] Erro no enriquecimento:', error);
      
      // Atualizar status para failed
      await supabase
        .from('suggested_companies')
        .update({ enrichment_status: 'failed' })
        .eq('id', newCompanyId);
    }
  };

  const handleQuickEnrich = async (company: WebDiscoveredCompany) => {
    toast({
      title: 'Enriquecimento rápido',
      description: 'Esta funcionalidade estará disponível em breve.'
    });
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Atualizando...',
      description: 'Buscando novas empresas similares na web.'
    });
  };

  if (isLoading) {
    return (
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="absolute inset-0 blur-xl opacity-30 bg-primary -z-10" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Buscando empresas similares na web...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg">Erro ao buscar empresas</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { similar_companies, statistics, insights } = data;

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Empresas Similares Descobertas na Web</CardTitle>
                <CardDescription>
                  Busca inteligente de empresas similares para crescimento do banco de dados
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  console.log('[TEST] ===== TESTE MANUAL =====');
                  
                  try {
                    // Teste 1: Busca web direta
                    console.log('[TEST] Teste 1: Busca web direta');
                    const { data: testData1, error: testError1 } = await supabase.functions.invoke('web-search', {
                      body: { query: 'empresas plástico Brasil CNPJ', limit: 5 }
                    });
                    console.log('[TEST] Resultados:', testData1?.results?.length || 0);
                    console.log('[TEST] Error:', testError1);
                    console.log('[TEST] Data:', testData1);
                    
                    // Teste 2: Edge Function status
                    console.log('[TEST] Teste 2: Edge Function web-search');
                    const { data: testData2, error: testError2 } = await supabase.functions.invoke('web-search', {
                      body: { query: 'empresas Brasil', limit: 5 }
                    });
                    console.log('[TEST] Data:', testData2);
                    console.log('[TEST] Error:', testError2);
                    
                    // Teste 3: Banco de dados
                    console.log('[TEST] Teste 3: Banco de dados');
                    const { data: dbData, error: dbError } = await supabase
                      .from('suggested_companies')
                      .select('company_name, cnpj')
                      .limit(5);
                    console.log('[TEST] DB Data:', dbData?.length);
                    console.log('[TEST] DB Error:', dbError);
                    
                    console.log('[TEST] ========================');
                    
                    toast({
                      title: '🔧 Teste Debug Concluído',
                      description: 'Veja os logs no console (F12)',
                    });
                  } catch (error) {
                    console.error('[TEST] Erro:', error);
                    toast({
                      title: '❌ Erro no Teste',
                      description: String(error),
                      variant: 'destructive',
                    });
                  }
                }}
                variant="outline"
                size="sm"
              >
                🔧 Teste Debug
              </Button>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{statistics.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {similar_companies.filter(c => c.icp_tier === 'premium').length}
              </div>
              <div className="text-sm text-muted-foreground font-semibold">🔥 Premium</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {similar_companies.filter(c => c.icp_tier === 'qualified').length}
              </div>
              <div className="text-sm text-muted-foreground font-semibold">⭐ Qualificado</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {similar_companies.filter(c => c.icp_tier === 'potential').length}
              </div>
              <div className="text-sm text-muted-foreground">⚠️ Potencial</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statistics.new_companies}</div>
              <div className="text-sm text-muted-foreground">Novas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Insights Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <p key={idx} className="text-sm leading-relaxed">
                  {insight}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Empresas */}
      <div className="grid gap-4">
        {similar_companies.map((company, idx) => (
          <Card 
            key={idx} 
            className={`border-muted/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 hover:border-primary/30 transition-all duration-300 ${
              company.already_in_database ? 'opacity-75' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {company.cnpj ? `CNPJ: ${company.cnpj}` : 'CNPJ não disponível'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Badge de Status */}
                <div className="flex flex-col gap-2">
                  {/* BADGE DE TIER ICP */}
                  {company.icp_tier === 'premium' && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                      🔥 Premium ICP
                    </Badge>
                  )}
                  {company.icp_tier === 'qualified' && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      ⭐ Qualificado
                    </Badge>
                  )}
                  {company.icp_tier === 'potential' && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                      ⚠️ Potencial
                    </Badge>
                  )}
                  {company.icp_tier === 'low' && (
                    <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                      🔻 Baixa Qualificação
                    </Badge>
                  )}
                  
                  {/* SCORE ICP */}
                  <Badge variant="outline" className="text-xs font-mono">
                    ICP: {company.icp_score || 0}/100
                  </Badge>
                  
                  {/* SCORE SIMILARIDADE */}
                  <Badge variant="outline" className="text-xs">
                    Similaridade: {company.similarity_score}/100
                  </Badge>
                  
                  {company.already_in_database ? (
                    <Badge variant="secondary">✅ No Banco</Badge>
                  ) : (
                    <Badge variant="default" className="bg-emerald-600">🆕 Nova</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* DETALHAMENTO ICP */}
                {company.icp_reasons && company.icp_reasons.length > 0 && (
                  <details className="text-xs bg-muted/30 p-3 rounded-lg">
                    <summary className="cursor-pointer text-primary hover:text-primary/80 font-medium mb-2">
                      🔍 Ver critérios de qualificação ICP ({company.icp_reasons.length} avaliados)
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4 list-disc">
                      {company.icp_reasons.map((reason, idx) => (
                        <li key={idx} className="text-muted-foreground">{reason}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* BADGES DE QUALIFICAÇÃO ICP */}
                {(company.employees || company.porte || company.regime_tributario) && (
                  <div className="flex gap-2 flex-wrap pb-3 border-b">
                    {company.employees && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                        <Users className="h-3 w-3 mr-1" />
                        {company.employees} funcionários
                      </Badge>
                    )}
                    
                    {company.porte && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800">
                        <Building2 className="h-3 w-3 mr-1" />
                        Porte: {company.porte}
                      </Badge>
                    )}
                    
                    {company.regime_tributario && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                        💼 {company.regime_tributario}
                      </Badge>
                    )}
                    
                    {company.revenue && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        R$ {(company.revenue / 1000000).toFixed(1)}M
                      </Badge>
                    )}
                  </div>
                )}

                {/* Informações da Empresa */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Setor:</span>
                    <span className="font-medium">{company.setor || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="font-medium">{company.uf || 'N/A'}</span>
                  </div>
                </div>

                {company.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visitar Website
                    </a>
                  </div>
                )}
                
                {/* Botões de Ação */}
                <div className="flex gap-2 pt-2 border-t">
                  {!company.already_in_database ? (
                    <>
                      <Button
                        onClick={() => handleAddToQuarantine(company)}
                        className="flex-1 gap-2"
                        variant="default"
                        disabled={isAddingCompany === company.name}
                      >
                        {isAddingCompany === company.name ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Adicionar à Quarentena
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => handleQuickEnrich(company)}
                        variant="outline"
                        size="icon"
                        title="Enriquecimento rápido"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate(`/leads/icp-quarantine?company=${company.existing_id}`)}
                      className="flex-1 gap-2"
                      variant="secondary"
                    >
                      <Eye className="w-4 h-4" />
                      Ver na Quarentena
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {similar_companies.length === 0 && (
          <Card className="border-muted/50 bg-card/50">
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-lg font-semibold">Nenhuma empresa similar encontrada</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Tente ajustar os critérios de busca ou o setor da empresa para encontrar mais resultados.
                </p>
                <Button onClick={handleRefresh} variant="outline" className="gap-2 mt-4">
                  <RefreshCw className="h-4 w-4" />
                  Buscar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

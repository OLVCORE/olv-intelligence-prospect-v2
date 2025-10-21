// ✅ Adapter para buscar dados de empresas no LinkedIn via PhantomBuster
import { logger } from '@/lib/utils/logger';
import { cache, CacheKeys } from '@/lib/utils/cache';

export interface LinkedInCompanyData {
  companyUrl: string;
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  headquarters?: string;
  founded?: string;
  followers?: number;
  employeesOnLinkedIn?: number;
  specialties?: string[];
  posts?: Array<{
    text: string;
    likes: number;
    comments: number;
    shares: number;
    date: string;
  }>;
  engagement?: {
    totalPosts: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    engagementRate: number;
  };
  presenceScore?: number;
}

export interface LinkedInCompanyOptions {
  includeEngagement?: boolean;
  maxPosts?: number;
}

/**
 * Busca dados completos da empresa no LinkedIn via PhantomBuster
 */
export async function fetchLinkedInCompanyData(
  linkedinUrl: string,
  options: LinkedInCompanyOptions = {}
): Promise<LinkedInCompanyData> {
  const cacheKey = CacheKeys.phantom(linkedinUrl);
  
  // Verificar cache
  const cached = cache.get<LinkedInCompanyData>(cacheKey);
  if (cached) {
    logger.info('LINKEDIN_COMPANY', 'Cache hit', { url: linkedinUrl });
    return cached;
  }

  try {
    logger.info('LINKEDIN_COMPANY', 'Fetching data via PhantomBuster', { url: linkedinUrl });

    // Chamar edge function que usa PhantomBuster
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('linkedin-scrape', {
      body: { linkedinUrl, ...options }
    });

    if (error) {
      logger.error('LINKEDIN_COMPANY', 'PhantomBuster error', { error });
      throw error;
    }

    const result: LinkedInCompanyData = {
      companyUrl: linkedinUrl,
      name: data.name || 'Empresa não encontrada',
      description: data.description || '',
      website: data.website || '',
      industry: data.industry || '',
      companySize: data.companySize || '',
      headquarters: data.headquarters || '',
      founded: data.founded || '',
      followers: data.followers || 0,
      employeesOnLinkedIn: data.employeesOnLinkedIn || 0,
      specialties: data.specialties || [],
      posts: data.posts || [],
      engagement: data.engagement || {
        totalPosts: 0,
        avgLikes: 0,
        avgComments: 0,
        avgShares: 0,
        engagementRate: 0
      },
      presenceScore: 0
    };

    // Calcular presence score
    result.presenceScore = calculateLinkedInPresenceScore(result);

    // Cachear por 24 horas (dados de empresa mudam pouco)
    cache.set(cacheKey, result, 24 * 60 * 60 * 1000);

    logger.info('LINKEDIN_COMPANY', 'Data fetched successfully', {
      url: linkedinUrl,
      followers: result.followers,
      presenceScore: result.presenceScore
    });

    return result;
  } catch (error) {
    logger.error('LINKEDIN_COMPANY', 'Failed to fetch data', { error, url: linkedinUrl });
    
    // Fallback com dados mínimos
    const fallbackData: LinkedInCompanyData = {
      companyUrl: linkedinUrl,
      name: 'Dados indisponíveis',
      description: '',
      website: '',
      industry: '',
      companySize: '',
      headquarters: '',
      founded: '',
      followers: 0,
      employeesOnLinkedIn: 0,
      specialties: [],
      posts: [],
      engagement: {
        totalPosts: 0,
        avgLikes: 0,
        avgComments: 0,
        avgShares: 0,
        engagementRate: 0
      },
      presenceScore: 0
    };
    
    return fallbackData;
  }
}

/**
 * Calcula score de presença no LinkedIn (0-100)
 */
export function calculateLinkedInPresenceScore(data: LinkedInCompanyData): number {
  let score = 0;

  // Completude do perfil (0-30 pontos)
  if (data.description) score += 10;
  if (data.website) score += 5;
  if (data.industry) score += 5;
  if (data.companySize) score += 5;
  if (data.specialties && data.specialties.length > 0) score += 5;

  // Tamanho e alcance (0-40 pontos)
  if (data.followers) {
    if (data.followers > 50000) score += 20;
    else if (data.followers > 10000) score += 15;
    else if (data.followers > 1000) score += 10;
    else if (data.followers > 100) score += 5;
  }

  if (data.employeesOnLinkedIn) {
    if (data.employeesOnLinkedIn > 500) score += 20;
    else if (data.employeesOnLinkedIn > 100) score += 15;
    else if (data.employeesOnLinkedIn > 50) score += 10;
    else if (data.employeesOnLinkedIn > 10) score += 5;
  }

  // Engajamento (0-30 pontos)
  if (data.engagement) {
    const { totalPosts, engagementRate } = data.engagement;
    
    // Frequência de posts
    if (totalPosts > 50) score += 10;
    else if (totalPosts > 20) score += 7;
    else if (totalPosts > 10) score += 5;
    else if (totalPosts > 5) score += 3;

    // Taxa de engajamento
    if (engagementRate > 5) score += 20;
    else if (engagementRate > 2) score += 15;
    else if (engagementRate > 1) score += 10;
    else if (engagementRate > 0.5) score += 5;
  }

  return Math.min(100, score);
}

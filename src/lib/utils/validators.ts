// ✅ Schemas de validação centralizados com Zod
import { z } from 'zod';

/**
 * Schema de validação de CNPJ
 */
export const cnpjSchema = z.string()
  .trim()
  .transform(s => s.replace(/\D/g, '')) // Remove TODOS os não-dígitos PRIMEIRO
  .refine(s => s.length === 14, 'CNPJ deve ter exatamente 14 dígitos')
  .refine(s => /^\d{14}$/.test(s), 'CNPJ deve conter apenas números');

/**
 * Schema de busca de empresa
 */
export const companySearchSchema = z.object({
  query: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres').optional(),
  cnpj: cnpjSchema.optional()
}).refine(data => data.query || data.cnpj, {
  message: 'Informe uma empresa ou CNPJ para buscar'
});

/**
 * Schema de enriquecimento de email
 */
export const emailEnrichSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  company_domain: z.string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i, 'Domínio inválido')
    .max(253, 'Domínio muito longo'),
  decision_maker_id: z.string().uuid('ID inválido').optional()
});

/**
 * Schema de scraping LinkedIn
 */
export const linkedinScrapeSchema = z.object({
  linkedin_url: z.string()
    .trim()
    .url('URL inválida')
    .refine(url => url.includes('linkedin.com'), 'Deve ser uma URL do LinkedIn'),
  company_id: z.string().uuid('ID da empresa inválido').optional()
});

/**
 * Schema de análise TOTVS Fit
 */
export const totvsAnalysisSchema = z.object({
  companyId: z.string().uuid('ID da empresa inválido')
});

/**
 * Schema de comando AI no Canvas
 */
export const canvasAICommandSchema = z.object({
  command: z.string().trim().min(3, 'Comando muito curto').max(500, 'Comando muito longo'),
  context: z.string().optional(),
  canvasId: z.string().uuid('ID do canvas inválido').optional()
});

/**
 * Schema de criação de canvas
 */
export const createCanvasSchema = z.object({
  title: z.string().trim().min(1, 'Título obrigatório').max(200, 'Título muito longo'),
  company_id: z.string().uuid('ID da empresa inválido').optional(),
  content: z.object({
    blocks: z.array(z.any())
  }).default({ blocks: [] }),
  tags: z.array(z.string()).default([])
});

/**
 * Schema de comentário no canvas
 */
export const canvasCommentSchema = z.object({
  canvas_id: z.string().uuid('ID do canvas inválido'),
  type: z.enum(['comment', 'insight', 'risk', 'hypothesis', 'task']),
  content: z.string().trim().min(1, 'Conteúdo obrigatório').max(1000, 'Conteúdo muito longo'),
  status: z.enum(['active', 'resolved']).default('active')
});

/**
 * Utilitário para validar CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  try {
    cnpjSchema.parse(cnpj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Utilitário para formatar CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  
  return clean.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Utilitário para limpar CNPJ
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Validação de email
 */
export const emailSchema = z.string().email('Email inválido').trim().toLowerCase();

/**
 * Validação de URL
 */
export const urlSchema = z.string().url('URL inválida').trim();

/**
 * Validação de UUID
 */
export const uuidSchema = z.string().uuid('UUID inválido');

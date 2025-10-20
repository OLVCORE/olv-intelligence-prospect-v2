import { z } from 'zod';

export const cnpjSchema = z.string()
  .trim()
  .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, 'CNPJ inválido')
  .transform(s => s.replace(/\D/g, ''))
  .refine(s => s.length === 14, 'CNPJ deve ter 14 dígitos');

export const companySearchSchema = z.object({
  query: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres').optional(),
  cnpj: cnpjSchema.optional()
}).refine(data => data.query || data.cnpj, {
  message: 'Informe uma empresa ou CNPJ para buscar'
});

export const emailEnrichSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  company_domain: z.string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i, 'Domínio inválido')
    .max(253, 'Domínio muito longo'),
  decision_maker_id: z.string().uuid('ID inválido').optional()
});

export const linkedinScrapeSchema = z.object({
  linkedin_url: z.string()
    .trim()
    .url('URL inválida')
    .refine(url => url.includes('linkedin.com'), 'Deve ser uma URL do LinkedIn'),
  company_id: z.string().uuid('ID da empresa inválido').optional()
});

export const totvsAnalysisSchema = z.object({
  companyId: z.string().uuid('ID da empresa inválido')
});

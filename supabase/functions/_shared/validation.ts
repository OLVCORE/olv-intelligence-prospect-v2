import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const cnpjSchema = z.string()
  .trim()
  .transform(s => s.replace(/\D/g, '')) // Remove TODOS os não-dígitos PRIMEIRO
  .refine(s => s.length === 14, 'CNPJ deve ter exatamente 14 dígitos')
  .refine(s => /^\d{14}$/.test(s), 'CNPJ deve conter apenas números');

export const companySearchSchema = z.object({
  // Busca principal
  query: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres').optional(),
  cnpj: cnpjSchema.optional(),
  
  // Presença Digital (campos de refinamento) - URLs flexíveis
  website: z.string().trim().optional().or(z.literal('')).transform(val => {
    if (!val || val === '') return '';
    // Adicionar https:// se não tiver protocolo
    if (!/^https?:\/\//i.test(val)) {
      return `https://${val}`;
    }
    return val;
  }),
  instagram: z.string().trim().max(100).optional(),
  linkedin: z.string().trim().max(200).optional(),
  
  // Produtos & Segmentação
  produto: z.string().trim().max(100).optional(),
  marca: z.string().trim().max(100).optional(),
  linkProduto: z.string().trim().optional().or(z.literal('')).transform(val => {
    if (!val || val === '') return '';
    if (!/^https?:\/\//i.test(val)) {
      return `https://${val}`;
    }
    return val;
  }),
  
  // Localização
  logradouro: z.string().trim().max(200).optional(),
  numero: z.string().trim().max(10).optional(),
  bairro: z.string().trim().max(100).optional(),
  municipio: z.string().trim().max(100).optional(),
  estado: z.string().trim().max(2).optional(),
  pais: z.string().trim().max(100).optional(),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional().or(z.literal(''))
}).refine(data => {
  // Permitir busca com QUALQUER campo preenchido
  return data.query || data.cnpj || data.website || data.instagram || data.linkedin ||
         data.produto || data.marca || data.linkProduto || 
         data.logradouro || data.numero || data.bairro || data.municipio || data.estado || data.cep;
}, {
  message: 'Preencha pelo menos um campo para buscar'
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

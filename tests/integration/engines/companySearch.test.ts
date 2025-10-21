// ✅ Testes de integração - Company Search Engine
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCompanySearchEngine } from '@/lib/engines/search/companySearch';
import { createReceitaWSAdapter } from '@/lib/adapters/cnpj/receitaws';
import { createApolloAdapter } from '@/lib/adapters/people/apollo';
import { createSerperAdapter } from '@/lib/adapters/search/serper';
import { createTechDetectionAdapter } from '@/lib/adapters/tech/hybridDetect';

describe('Company Search Engine - Integration', () => {
  let engine: ReturnType<typeof createCompanySearchEngine>;
  
  beforeEach(() => {
    global.fetch = vi.fn();
    
    const receitaWS = createReceitaWSAdapter('test_token');
    const apollo = createApolloAdapter('test_key');
    const serper = createSerperAdapter('test_key');
    const techDetect = createTechDetectionAdapter();
    
    engine = createCompanySearchEngine(receitaWS, apollo, serper, techDetect);
  });

  it('should orchestrate full company search with CNPJ', async () => {
    // Mock ReceitaWS
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nome: 'TOTVS SA',
        cnpj: '53.113.791/0001-22',
        fantasia: 'TOTVS',
        email: 'contato@totvs.com.br',
        municipio: 'São Paulo',
        uf: 'SP',
        atividade_principal: [{ text: 'Desenvolvimento de software' }]
      })
    });

    // Mock Apollo Organization
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organizations: [{
          id: 'org123',
          name: 'TOTVS',
          website_url: 'https://www.totvs.com',
          primary_domain: 'totvs.com.br',
          industry: 'Software',
          estimated_num_employees: 10000,
          technologies: ['React', 'Java', 'AWS']
        }]
      })
    });

    // Mock Apollo People
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        people: [{
          name: 'Dennis Herszkowicz',
          title: 'CEO',
          email: 'dennis@totvs.com.br',
          email_status: 'verified',
          seniority: 'c_suite'
        }]
      })
    });

    // Mock Tech Stack
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => '<html><meta name="generator" content="React"><script src="aws-sdk.js"></script></html>'
    });

    // Mock Serper
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organic: [
          { title: 'TOTVS investe em cloud computing', snippet: 'Transformação digital AWS Azure' }
        ]
      })
    });

    const result = await engine.search({ 
      cnpj: '53.113.791/0001-22',
      query: 'TOTVS'
    });

    expect(result.company.name).toBe('TOTVS SA');
    expect(result.company.cnpj).toBe('53.113.791/0001-22');
    expect(result.company.domain).toBeTruthy();
    expect(result.decisors.length).toBeGreaterThan(0);
    expect(result.maturity).toBeDefined();
    expect(result.maturity?.overall_score).toBeGreaterThan(0);
  });

  it('should handle missing CNPJ gracefully', async () => {
    // Mock Apollo Organization only
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        organizations: [{
          name: 'Test Company',
          website_url: 'https://test.com'
        }]
      })
    });

    // Mock Apollo People
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ people: [] })
    });

    const result = await engine.search({ query: 'Test Company' });

    expect(result.company.name).toBe('Test Company');
    expect(result.company.cnpj).toBeUndefined();
    expect(result.decisors).toEqual([]);
  });
});

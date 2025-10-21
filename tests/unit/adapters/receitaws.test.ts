// ✅ Testes unitários - ReceitaWS Adapter
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReceitaWSAdapter } from '@/lib/adapters/cnpj/receitaws';

describe('ReceitaWS Adapter', () => {
  let adapter: ReturnType<typeof createReceitaWSAdapter>;
  
  beforeEach(() => {
    adapter = createReceitaWSAdapter('test_token');
    global.fetch = vi.fn();
  });

  it('should fetch company data successfully', async () => {
    const mockResponse = {
      nome: 'Empresa Teste LTDA',
      cnpj: '12.345.678/0001-90',
      fantasia: 'Empresa Teste',
      atividade_principal: [{ code: '6201-5/00', text: 'Desenvolvimento de software' }],
      situacao: 'ATIVA',
      data_situacao: '01/01/2020',
      municipio: 'São Paulo',
      uf: 'SP',
      email: 'contato@empresateste.com.br',
      telefone: '(11) 1234-5678',
      capital_social: '100000.00'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await adapter.fetchCompanyData('12345678000190');
    
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://receitaws.com.br/v1/cnpj/12345678000190',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token'
        })
      })
    );
  });

  it('should return null on API error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const result = await adapter.fetchCompanyData('00000000000000');
    expect(result).toBeNull();
  });

  it('should validate CNPJ format', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nome: 'Test' })
    });

    await adapter.fetchCompanyData('12.345.678/0001-90');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('12345678000190'),
      expect.any(Object)
    );
  });
});

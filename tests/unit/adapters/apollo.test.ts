// ✅ Testes unitários - Apollo.io Adapter
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApolloAdapter } from '@/lib/adapters/people/apollo';

describe('Apollo Adapter', () => {
  let adapter: ReturnType<typeof createApolloAdapter>;
  
  beforeEach(() => {
    adapter = createApolloAdapter('test_api_key');
    global.fetch = vi.fn();
  });

  it('should search organization successfully', async () => {
    const mockOrg = {
      id: 'org123',
      name: 'Test Company',
      website_url: 'https://testcompany.com',
      primary_domain: 'testcompany.com',
      industry: 'Technology',
      estimated_num_employees: 100,
      annual_revenue: '$10M-$50M',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      linkedin_url: 'https://linkedin.com/company/test'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [mockOrg] })
    });

    const result = await adapter.searchOrganization('Test Company', 'testcompany.com');
    
    expect(result).toEqual(mockOrg);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('organizations/search'),
      expect.any(Object)
    );
  });

  it('should search people with filters', async () => {
    const mockPeople = [
      {
        id: 'person1',
        name: 'John Doe',
        title: 'CEO',
        email: 'john@testcompany.com',
        email_status: 'verified',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        functions: ['leadership'],
        seniority: 'c_suite'
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ people: mockPeople })
    });

    const result = await adapter.searchPeople('Test Company', ['CEO', 'CTO']);
    
    expect(result).toEqual(mockPeople);
    expect(result[0].email_status).toBe('verified');
  });

  it('should return null when organization not found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [] })
    });

    const result = await adapter.searchOrganization('NonExistent Company');
    expect(result).toBeNull();
  });
});

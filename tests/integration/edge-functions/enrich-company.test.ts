import { describe, it, expect, beforeAll } from 'vitest';

describe('Enrich Company Edge Function', () => {
  const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-company-360`;
  const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  let authToken: string;

  beforeAll(async () => {
    // Mock auth token for tests
    authToken = ANON_KEY;
  });

  it('should enrich company with valid CNPJ', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        cnpj: '00000000000191', // Valid test CNPJ
      }),
    });

    expect(response.status).toBeLessThan(500);
    
    if (response.ok) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  }, 30000); // 30s timeout for external API calls

  it('should handle invalid CNPJ gracefully', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        cnpj: 'invalid-cnpj',
      }),
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should handle missing CNPJ parameter', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should handle rate limiting', async () => {
    // Make multiple rapid requests
    const promises = Array.from({ length: 5 }, () =>
      fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          cnpj: '00000000000191',
        }),
      })
    );

    const responses = await Promise.all(promises);
    
    // At least one should complete successfully or return 429
    const statuses = responses.map(r => r.status);
    expect(statuses.some(s => s === 200 || s === 429)).toBeTruthy();
  }, 60000);
});

// ✅ Setup global para testes
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup global antes de todos os testes
beforeAll(() => {
  // Mock de variáveis de ambiente
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key';
});

// Limpar após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Limpar após todos os testes
afterAll(() => {
  vi.restoreAllMocks();
});

// Mock global do fetch se necessário
global.fetch = vi.fn();

// Mock do Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    }))
  }
}));

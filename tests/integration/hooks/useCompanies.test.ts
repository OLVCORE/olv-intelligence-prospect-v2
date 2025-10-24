import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompanies, useCompany } from '@/hooks/useCompanies';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('useCompanies', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch companies with pagination', async () => {
    const mockData = [
      { id: '1', name: 'Company 1', cnpj: '12345678000190' },
      { id: '2', name: 'Company 2', cnpj: '98765432000100' },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useCompanies({ page: 0, pageSize: 50 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockData);
    expect(result.current.data?.count).toBe(2);
    expect(result.current.data?.totalPages).toBe(1);
  });

  it('should handle search filter', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(
      () => useCompanies({ page: 0, pageSize: 50, search: 'test' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const fromCall = mockFrom.mock.results[0].value;
    expect(fromCall.or).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useCompanies(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('useCompany', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch single company by id', async () => {
    const mockCompany = { id: '1', name: 'Test Company', cnpj: '12345678000190' };

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockCompany,
        error: null,
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useCompany('1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCompany);
  });

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useCompany(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
  });
});

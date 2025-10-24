import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  shouldRetry: (error) => {
    // Retry em erros de rede e rate limiting
    const status = error?.status || error?.response?.status;
    return !status || status === 429 || status >= 500;
  },
  onRetry: () => {},
};

/**
 * Executa uma função com retry automático e exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Não retry se não deve tentar novamente
      if (!opts.shouldRetry(error)) {
        throw error;
      }
      
      // Última tentativa, não espera
      if (attempt === opts.maxAttempts) {
        break;
      }
      
      // Calcula delay com exponential backoff
      const delay = Math.min(
        opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );
      
      logger.warn(
        `Retry attempt ${attempt}/${opts.maxAttempts}`,
        'Retry',
        { delay, error: error?.message }
      );
      
      opts.onRetry(attempt, error);
      
      // Aguarda antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Wrapper para edge functions com retry automático
 */
export async function invokeEdgeFunctionWithRetry<T = any>(
  supabaseClient: any,
  functionName: string,
  body: any = {},
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(
    async () => {
      const { data, error } = await supabaseClient.functions.invoke(functionName, { body });
      
      if (error) {
        logger.error('Edge function error', functionName, { error: error.message });
        throw error;
      }
      
      if (data?.error) {
        logger.error('Edge function returned error', functionName, { error: data.error });
        throw new Error(data.error);
      }
      
      return data as T;
    },
    {
      ...options,
      shouldRetry: (error) => {
        // Não retry em erros de validação (4xx exceto 429)
        const status = error?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          return false;
        }
        return options.shouldRetry ? options.shouldRetry(error) : true;
      },
    }
  );
}

/**
 * Wrapper para queries do Supabase com retry automático
 */
export async function queryWithRetry<T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(
    async () => {
      const { data, error } = await queryFn();
      
      if (error) {
        logger.error('Supabase query error', 'Query', { error: error.message });
        throw error;
      }
      
      return data as T;
    },
    options
  );
}

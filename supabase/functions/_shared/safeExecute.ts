/**
 * Safe Execution Wrapper para Edge Functions
 * Protege operações críticas com retry, logging e error handling
 */

interface SafeExecuteOptions {
  functionName: string;
  operation: () => Promise<any>;
  fallback?: any;
  retries?: number;
  timeout?: number;
  logDetails?: Record<string, any>;
}

interface SafeExecuteResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts?: number;
}

/**
 * Executa operação com proteção completa
 */
export async function safeExecute<T = any>(
  options: SafeExecuteOptions
): Promise<SafeExecuteResult<T>> {
  const {
    functionName,
    operation,
    fallback,
    retries = 3,
    timeout = 30000,
    logDetails = {},
  } = options;

  let lastError: any;
  let attempts = 0;

  for (let attempt = 0; attempt < retries; attempt++) {
    attempts++;
    
    try {
      console.log(`[${functionName}] Tentativa ${attempt + 1}/${retries}`, logDetails);

      // Executa com timeout
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        ),
      ]);

      console.log(`[${functionName}] Sucesso na tentativa ${attempt + 1}`, {
        ...logDetails,
        hasResult: !!result,
      });

      return {
        success: true,
        data: result,
        attempts,
      };
    } catch (error: any) {
      lastError = error;
      
      console.error(`[${functionName}] Erro na tentativa ${attempt + 1}:`, {
        error: error.message,
        stack: error.stack,
        ...logDetails,
      });

      // Se for último retry, não aguarda
      if (attempt < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        console.log(`[${functionName}] Aguardando ${delay}ms antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Todas tentativas falharam
  console.error(`[${functionName}] Falha após ${attempts} tentativas:`, {
    error: lastError?.message,
    ...logDetails,
  });

  // Se tem fallback, usa
  if (fallback !== undefined) {
    console.log(`[${functionName}] Usando fallback`);
    return {
      success: false,
      data: fallback,
      error: lastError?.message || 'Unknown error',
      attempts,
    };
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    attempts,
  };
}

/**
 * Valida dados de entrada
 */
export function validateInput(
  data: any,
  required: string[],
  functionName: string
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    console.error(`[${functionName}] Validação falhou - campos ausentes:`, missing);
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Cria resposta de erro padronizada
 */
export function createErrorResponse(
  message: string,
  details?: any,
  status: number = 500
): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Cria resposta de sucesso padronizada
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

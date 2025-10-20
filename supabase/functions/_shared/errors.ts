/**
 * Error mapping utility for Edge Functions
 * Maps internal errors to user-friendly messages
 * Always logs full error details server-side
 */

export interface SafeErrorResponse {
  error: string;
  requestId: string;
}

export function mapErrorToUserMessage(error: any): SafeErrorResponse {
  const requestId = crypto.randomUUID();
  
  // Log full error server-side with request ID for debugging
  console.error('[Error]', {
    requestId,
    message: error?.message,
    stack: error?.stack,
    cause: error?.cause,
    name: error?.name
  });

  const errorMessage = error?.message?.toLowerCase() || '';
  
  // Map specific errors to generic user-friendly messages
  const errorPatterns = [
    { pattern: 'api_key', message: 'Serviço temporariamente indisponível' },
    { pattern: 'api key', message: 'Serviço temporariamente indisponível' },
    { pattern: 'não configurada', message: 'Serviço temporariamente indisponível' },
    { pattern: 'rate limit', message: 'Muitas requisições. Aguarde alguns minutos.' },
    { pattern: 'timeout', message: 'Serviço demorou para responder. Tente novamente.' },
    { pattern: 'timed out', message: 'Serviço demorou para responder. Tente novamente.' },
    { pattern: 'network', message: 'Erro de conexão. Verifique sua internet.' },
    { pattern: 'fetch failed', message: 'Erro de conexão. Tente novamente.' },
    { pattern: 'duplicate key', message: 'Este registro já existe.' },
    { pattern: 'foreign key', message: 'Dados relacionados não encontrados.' },
    { pattern: 'not null', message: 'Campos obrigatórios não preenchidos.' },
    { pattern: 'invalid', message: 'Dados fornecidos são inválidos.' },
    { pattern: 'required', message: 'Campos obrigatórios faltando.' },
    { pattern: 'unauthorized', message: 'Não autorizado. Faça login novamente.' },
    { pattern: 'forbidden', message: 'Você não tem permissão para esta operação.' },
  ];

  // Find matching pattern
  for (const { pattern, message } of errorPatterns) {
    if (errorMessage.includes(pattern)) {
      return { error: message, requestId };
    }
  }

  // Default generic error
  return { 
    error: 'Ocorreu um erro ao processar sua requisição. Tente novamente.',
    requestId 
  };
}

/**
 * Create a safe error response with CORS headers
 */
export function createErrorResponse(
  error: any,
  corsHeaders: Record<string, string>,
  statusCode: number = 500
): Response {
  const { error: message, requestId } = mapErrorToUserMessage(error);
  
  return new Response(
    JSON.stringify({ error: message, requestId }),
    { 
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

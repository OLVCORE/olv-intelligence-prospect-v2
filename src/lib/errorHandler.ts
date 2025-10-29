import { toast } from '@/hooks/use-toast';

export function handleSupabaseError(error: any, context: string = 'Operação') {
  console.error(`[${context}] Erro:`, error);

  // Erro 409 - Conflito (duplicação)
  if (error.code === '23505') {
    toast({
      title: 'Registro duplicado',
      description: 'Já existe um registro com essas informações. Tente valores diferentes.',
      variant: 'destructive'
    });
    return;
  }

  // Erro 401 - Não autenticado
  if (error.status === 401 || error.message?.includes('JWT')) {
    toast({
      title: 'Sessão expirada',
      description: 'Faça login novamente para continuar.',
      variant: 'destructive'
    });
    window.location.href = '/login';
    return;
  }

  // Erro 403 - Sem permissão
  if (error.status === 403) {
    toast({
      title: 'Acesso negado',
      description: 'Você não tem permissão para realizar esta ação.',
      variant: 'destructive'
    });
    return;
  }

  // Erro 404 - Não encontrado
  if (error.status === 404) {
    toast({
      title: 'Não encontrado',
      description: 'O recurso solicitado não foi encontrado.',
      variant: 'destructive'
    });
    return;
  }

  // Erro 500 - Erro do servidor
  if (error.status >= 500) {
    toast({
      title: 'Erro no servidor',
      description: 'Ocorreu um erro no servidor. Tente novamente em alguns instantes.',
      variant: 'destructive'
    });
    return;
  }

  // Erro genérico
  toast({
    title: `Erro em ${context}`,
    description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
    variant: 'destructive'
  });
}

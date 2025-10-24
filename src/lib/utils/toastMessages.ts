import { toast } from 'sonner';

/**
 * Mensagens de toast padronizadas para manter consistência na aplicação
 */

export const toastMessages = {
  // Sucesso
  success: {
    saved: () => toast.success('Salvo com sucesso!'),
    updated: () => toast.success('Atualizado com sucesso!'),
    deleted: () => toast.success('Excluído com sucesso!'),
    created: () => toast.success('Criado com sucesso!'),
    uploaded: () => toast.success('Upload concluído!'),
    copied: () => toast.success('Copiado para área de transferência!'),
    enrichment: () => toast.success('Enriquecimento concluído!'),
    exported: () => toast.success('Exportação concluída!'),
  },

  // Loading
  loading: {
    saving: () => toast.loading('Salvando...'),
    loading: () => toast.loading('Carregando...'),
    processing: () => toast.loading('Processando...'),
    enriching: () => toast.loading('Enriquecendo dados...'),
    analyzing: () => toast.loading('Analisando...'),
    generating: () => toast.loading('Gerando relatório...'),
    uploading: () => toast.loading('Fazendo upload...'),
  },

  // Erro
  error: {
    generic: () => toast.error('Erro ao processar solicitação'),
    network: () => toast.error('Erro de conexão. Verifique sua internet.'),
    notFound: () => toast.error('Recurso não encontrado'),
    unauthorized: () => toast.error('Você não tem permissão para esta ação'),
    validation: (message: string) => toast.error(`Erro de validação: ${message}`),
    timeout: () => toast.error('Operação expirou. Tente novamente.'),
    rateLimit: () => toast.error('Muitas requisições. Aguarde um momento.'),
    serverError: () => toast.error('Erro no servidor. Tente novamente mais tarde.'),
  },

  // Info
  info: {
    noChanges: () => toast.info('Nenhuma alteração detectada'),
    processing: (count: number) => toast.info(`Processando ${count} itens...`),
    queued: () => toast.info('Adicionado à fila de processamento'),
  },

  // Warning
  warning: {
    unsavedChanges: () => toast.warning('Você tem alterações não salvas'),
    incomplete: () => toast.warning('Preencha todos os campos obrigatórios'),
    deprecated: () => toast.warning('Este recurso será descontinuado em breve'),
  },

  // Enriquecimento específico
  enrichment: {
    started: () => toast.loading('Iniciando enriquecimento...'),
    receita: {
      success: () => toast.success('Dados da Receita Federal atualizados!'),
      error: () => toast.error('Erro ao enriquecer com Receita Federal'),
    },
    apollo: {
      success: () => toast.success('Decisores encontrados com sucesso!'),
      error: () => toast.error('Erro ao buscar decisores'),
      noResults: () => toast.info('Nenhum decisor encontrado para esta empresa'),
    },
    full360: {
      success: (summary?: { enriched: number; errors: number }) => {
        if (summary) {
          toast.success(`Análise 360° concluída! ${summary.enriched} fontes atualizadas.`);
        } else {
          toast.success('Análise 360° concluída!');
        }
      },
      error: () => toast.error('Erro ao executar análise 360°'),
    },
    batch: {
      started: (count: number) => toast.info(`Iniciando enriquecimento de ${count} empresas...`),
      progress: (current: number, total: number) => 
        toast.loading(`Processando ${current}/${total} empresas...`),
      completed: (summary: { enriched: number; skipped: number; errors: number }) =>
        toast.success(
          `Enriquecimento concluído! ✓ ${summary.enriched} atualizadas, ⊘ ${summary.skipped} ignoradas, ✗ ${summary.errors} erros.`
        ),
    },
  },

  // Canvas
  canvas: {
    saved: () => toast.success('Canvas salvo!'),
    blockAdded: () => toast.success('Bloco adicionado!'),
    blockDeleted: () => toast.success('Bloco removido!'),
    versionCreated: () => toast.success('Versão criada com sucesso!'),
    exported: () => toast.success('Canvas exportado!'),
    aiProcessing: () => toast.loading('IA processando...'),
    aiError: () => toast.error('Erro na resposta da IA'),
  },

  // SDR
  sdr: {
    taskCreated: () => toast.success('Tarefa criada!'),
    taskUpdated: () => toast.success('Tarefa atualizada!'),
    dealMoved: () => toast.success('Deal movido com sucesso!'),
    messageSent: () => toast.success('Mensagem enviada!'),
    callStarted: () => toast.success('Chamada iniciada!'),
  },
};

/**
 * Helper para criar toasts de progresso atualizáveis
 */
export function createProgressToast(message: string) {
  const id = toast.loading(message);
  
  return {
    update: (newMessage: string) => toast.loading(newMessage, { id }),
    success: (successMessage: string) => toast.success(successMessage, { id }),
    error: (errorMessage: string) => toast.error(errorMessage, { id }),
    dismiss: () => toast.dismiss(id),
  };
}

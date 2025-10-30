import * as Sentry from "@sentry/react";

export function initSentry() {
  // Só inicializar em produção ou se explicitamente habilitado
  if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_ENABLE_SENTRY) {
    return;
  }

  Sentry.init({
    dsn: "COLE_SEU_DSN_AQUI",
    
    integrations: [
      new Sentry.BrowserTracing({
        // Rastrear navegação entre páginas
        tracePropagationTargets: ["localhost", /^https:\/\/.*\.lovable\.app/],
      }),
      new Sentry.Replay({
        // Session Replay - grava sessão quando há erro
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: 1.0, // 100% das transações
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% das sessões normais
    replaysOnErrorSampleRate: 1.0, // 100% quando há erro
    
    // Ambiente
    environment: import.meta.env.MODE,
    
    // Informações adicionais
    beforeSend(event, hint) {
      // Adicionar contexto extra
      if (event.exception) {
        console.error('Erro capturado pelo Sentry:', hint.originalException);
      }
      return event;
    },
  });
}

import * as Sentry from "@sentry/react";

export function initSentry() {
  Sentry.init({
    dsn: "https://71ebcf797231c84cfd695e09947c5896@o4510275860037632.ingest.us.sentry.io/4510275868819456",
    
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
    
    // Enviar dados PII (IP, user info)
    sendDefaultPii: true,
    
    // Informações adicionais
    beforeSend(event, hint) {
      // Log no console para debug
      // Adicionar contexto extra
      if (event.exception) {
        console.error('Erro capturado pelo Sentry:', hint.originalException);
      }
      return event;
    },
  });
}

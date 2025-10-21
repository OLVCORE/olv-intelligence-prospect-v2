// ✅ Sistema de logs estruturados para observabilidade

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  userId?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  
  private formatLog(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}] ${entry.message}`;
  }

  private createEntry(
    level: LogLevel,
    context: string,
    message: string,
    data?: any,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      userId
    };
  }

  private log(entry: LogEntry): void {
    const formatted = this.formatLog(entry);
    
    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted, entry.data || '');
        }
        break;
      case 'info':
        console.info(formatted, entry.data || '');
        break;
      case 'warn':
        console.warn(formatted, entry.data || '');
        break;
      case 'error':
        console.error(formatted, entry.data || '');
        break;
    }

    // Em produção, enviar para serviço de monitoramento (futuro)
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrar com serviço de monitoramento (Sentry, LogRocket, etc.)
    console.log('[MONITORING]', entry);
  }

  debug(context: string, message: string, data?: any): void {
    this.log(this.createEntry('debug', context, message, data));
  }

  info(context: string, message: string, data?: any): void {
    this.log(this.createEntry('info', context, message, data));
  }

  warn(context: string, message: string, data?: any): void {
    this.log(this.createEntry('warn', context, message, data));
  }

  error(context: string, message: string, error?: any, userId?: string): void {
    this.log(this.createEntry('error', context, message, error, userId));
  }

  // Helpers específicos para diferentes módulos
  api(method: string, endpoint: string, status: number, duration?: number): void {
    this.info('API', `${method} ${endpoint} - ${status}`, { duration });
  }

  db(operation: string, table: string, success: boolean, duration?: number): void {
    const level = success ? 'info' : 'error';
    this.log(
      this.createEntry(level, 'DB', `${operation} on ${table}`, { success, duration })
    );
  }

  auth(action: string, success: boolean, userId?: string): void {
    const level = success ? 'info' : 'warn';
    this.log(
      this.createEntry(level, 'AUTH', action, { success }, userId)
    );
  }

  edgeFunction(name: string, status: number, duration?: number, error?: any): void {
    const level = status >= 400 ? 'error' : 'info';
    this.log(
      this.createEntry(level, 'EDGE_FN', `${name} - ${status}`, { duration, error })
    );
  }
}

export const logger = new Logger();

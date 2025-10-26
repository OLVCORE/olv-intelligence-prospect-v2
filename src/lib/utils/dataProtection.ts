/**
 * Data Protection and Recovery Utilities
 * Protege dados críticos contra perda durante operações
 */

import { logger } from './logger';

interface BackupData {
  key: string;
  data: any;
  timestamp: string;
  operation: string;
}

/**
 * Cria backup de dados antes de operação crítica
 */
export function createDataBackup(key: string, data: any, operation: string): void {
  try {
    const backup: BackupData = {
      key,
      data,
      timestamp: new Date().toISOString(),
      operation,
    };
    
    const backups = JSON.parse(localStorage.getItem('data_backups') || '[]');
    backups.push(backup);
    
    // Mantém apenas últimos 20 backups
    const recentBackups = backups.slice(-20);
    localStorage.setItem('data_backups', JSON.stringify(recentBackups));
    
    logger.info('Data backup created', 'DataProtection', { key, operation });
  } catch (error) {
    logger.error('Failed to create backup', 'DataProtection', { error, key });
  }
}

/**
 * Recupera último backup de dados
 */
export function restoreDataBackup(key: string): any | null {
  try {
    const backups: BackupData[] = JSON.parse(localStorage.getItem('data_backups') || '[]');
    const backup = backups.reverse().find(b => b.key === key);
    
    if (backup) {
      logger.info('Data backup restored', 'DataProtection', { key, timestamp: backup.timestamp });
      return backup.data;
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to restore backup', 'DataProtection', { error, key });
    return null;
  }
}

/**
 * Executa operação com proteção automática
 */
export async function withDataProtection<T>(
  operation: () => Promise<T>,
  options: {
    key: string;
    currentData?: any;
    onError?: (error: any) => void;
    retries?: number;
  }
): Promise<T> {
  const { key, currentData, onError, retries = 3 } = options;
  
  // Cria backup antes da operação
  if (currentData) {
    createDataBackup(key, currentData, 'pre-operation');
  }
  
  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await operation();
      
      // Sucesso - cria backup do resultado
      createDataBackup(key, result, 'post-operation');
      
      return result;
    } catch (error) {
      lastError = error;
      logger.warn('Operation failed, retrying', 'DataProtection', {
        key,
        attempt: attempt + 1,
        error,
      });
      
      // Aguarda antes de retry (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // Todas tentativas falaram
  logger.error('Operation failed after retries', 'DataProtection', {
    key,
    retries,
    error: lastError,
  });
  
  if (onError) {
    onError(lastError);
  }
  
  throw lastError;
}

/**
 * Valida dados antes de operação crítica
 */
export function validateBeforeOperation(data: any, schema: {
  required: string[];
  types?: Record<string, string>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verifica campos obrigatórios
  for (const field of schema.required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Campo obrigatório ausente: ${field}`);
    }
  }
  
  // Verifica tipos se especificados
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (data[field] !== undefined && typeof data[field] !== expectedType) {
        errors.push(`Tipo inválido para ${field}: esperado ${expectedType}, recebido ${typeof data[field]}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Limpa backups antigos (chamar periodicamente)
 */
export function cleanupOldBackups(daysToKeep: number = 7): void {
  try {
    const backups: BackupData[] = JSON.parse(localStorage.getItem('data_backups') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const recentBackups = backups.filter(b => new Date(b.timestamp) > cutoffDate);
    localStorage.setItem('data_backups', JSON.stringify(recentBackups));
    
    logger.info('Old backups cleaned', 'DataProtection', {
      removed: backups.length - recentBackups.length,
    });
  } catch (error) {
    logger.error('Failed to cleanup backups', 'DataProtection', { error });
  }
}

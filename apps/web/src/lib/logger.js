/**
 * Logger utility para manejo consistente de logs
 * Solo logea en modo desarrollo
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log de información general
   */
  info: (...args) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log de advertencias
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log de errores
   */
  error: (...args) => {
    if (isDev) {
      console.error('[ERROR]', ...args);
    }
  },

  /**
   * Log de debugging
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export default logger;
/* eslint-disable no-console */

interface LogContext {
  [key: string]: unknown;
}

interface ErrorLike {
  message?: string;
  stack?: string;
  name?: string;
  statusCode?: number;
}

export const logger = {
  /**
   * Log informational messages for business logic events
   * Use sparingly - only for significant business events
   */
  info: (message: string, context: LogContext = {}) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  },

  /**
   * Log warnings for recoverable issues that need attention
   */
  warn: (message: string, context: LogContext = {}) => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  },

  /**
   * Log errors for debugging and monitoring
   * Include meaningful context to help with troubleshooting
   */
  error: (
    message: string,
    error: ErrorLike | string = {},
    context: LogContext = {}
  ) => {
    const errorObj = typeof error === 'string' ? { message: error } : error;

    console.error(
      JSON.stringify({
        level: 'error',
        message,
        timestamp: new Date().toISOString(),
        error: {
          message: errorObj.message || 'Unknown error',
          name: errorObj.name,
          statusCode: errorObj.statusCode,
        },
        stack: errorObj.stack,
        ...context,
      })
    );
  },
};

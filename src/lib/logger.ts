// Production-safe logger that only logs in development
const isDev = import.meta.env.DEV;

class Logger {
  error(message: string, context?: unknown): void {
    if (isDev) {
      console.error(message, context);
    }
    // In production, errors are silently handled
    // Add server-side logging integration here if needed
  }

  warn(message: string, context?: unknown): void {
    if (isDev) {
      console.warn(message, context);
    }
  }

  log(message: string, context?: unknown): void {
    if (isDev) {
      console.log(message, context);
    }
  }

  debug(message: string, context?: unknown): void {
    if (isDev) {
      console.debug(message, context);
    }
  }
}

export const logger = new Logger();

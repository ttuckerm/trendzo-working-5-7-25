import { format } from 'date-fns';
import path from 'path';

// Browser-compatible logger (no direct fs access)
export class Logger {
  private static instance: Logger;
  private logLevel: string;

  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (meta) {
      return `${formattedMessage} ${JSON.stringify(meta)}`;
    }
    
    return formattedMessage;
  }

  public debug(message: string, meta?: any): void {
    if (this.logLevel === 'debug') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  public info(message: string, meta?: any): void {
    console.info(this.formatMessage('info', message, meta));
  }

  public warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  public error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      console.error(this.formatMessage('error', message, {
        message: error.message,
        stack: error.stack
      }));
    } else {
      console.error(this.formatMessage('error', message, error));
    }
  }

  // For server-side only (will be ignored in browser)
  public writeToFile(message: string): void {
    // In browser, this is a no-op
    if (typeof window === 'undefined') {
      // Server-side code would go here, but we're making it safe for browser
      console.log('Log to file (server-side only):', message);
    }
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// For convenience
export default logger;
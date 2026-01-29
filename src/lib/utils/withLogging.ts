// src/lib/utils/withLogging.ts
import { logger } from './logger';

export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  context: string
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      // Log input
      logger.logInput(context, args);
      
      // Call the original function
      const result = fn(...args);
      
      // Handle both promises and regular returns
      if (result instanceof Promise) {
        return result
          .then(data => {
            logger.logOutput(context, data);
            return data;
          })
          .catch(error => {
            logger.error(context, error, { args });
            throw error;
          }) as ReturnType<T>;
      } else {
        // Log output for synchronous functions
        logger.logOutput(context, result);
        return result;
      }
    } catch (error) {
      logger.error(context, error, { args });
      throw error;
    }
  };
}
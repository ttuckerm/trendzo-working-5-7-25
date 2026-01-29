// src/lib/database/loggedDb.ts
import { db } from './index';
import { logger } from '@/lib/utils/logger';

export const loggedDb = {
  from: (table: string) => {
    const originalBuilder = db.from(table);
    
    // Log each database operation
    return {
      select: async (columns = '*') => {
        const requestId = Math.random().toString(36).substring(2, 9);
        logger.logInput(`DB:${table}:select`, { columns, requestId });
        
        try {
          const result = await originalBuilder.select(columns);
          logger.logOutput(`DB:${table}:select`, { result, requestId });
          return result;
        } catch (error) {
          logger.error(`DB:${table}:select`, error, { requestId });
          throw error;
        }
      },
      // Repeat for other operations (insert, update, delete, etc.)
      // ...
    };
  },
  // Include auth and storage with similar wrappers
};
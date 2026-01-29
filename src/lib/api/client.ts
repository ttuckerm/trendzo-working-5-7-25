// src/lib/api/client.ts
import { logger } from '@/lib/utils/logger';

export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> {
  const requestId = Math.random().toString(36).substring(2, 9);
  logger.logInput(`API:${endpoint}`, { method, data, requestId });
  
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    const result = await response.json();
    
    logger.logOutput(`API:${endpoint}`, { status: response.status, data: result, requestId });
    
    if (!response.ok) {
      throw new Error(result.message || 'API request failed');
    }
    
    return result as T;
  } catch (error) {
    logger.error(`API:${endpoint}`, error, { requestId });
    throw error;
  }
}
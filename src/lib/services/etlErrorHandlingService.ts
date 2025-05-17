/**
 * ETL Error Handling Service
 * 
 * This service provides comprehensive error handling and recovery mechanisms for ETL processes.
 * It includes functions for:
 * - Categorizing and logging errors
 * - Implementing retry strategies
 * - Recovery from partial failures
 * - Sending error notifications
 * - Maintaining error statistics
 */

import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, Firestore } from 'firebase/firestore';
import { ETLError, ETLLogLevel, logETLEvent } from '@/lib/utils/etlLogger';
import { etlJobService } from './etlJobService';

// Constants for collections
const ETL_ERRORS_COLLECTION = 'etlErrors';
const ETL_RECOVERY_COLLECTION = 'etlRecovery';

// Types of ETL process phases for error categorization
export type ETLPhase = 'extraction' | 'transformation' | 'loading' | 'validation' | 'unknown';

// Recovery strategies
export type RecoveryStrategy = 'retry' | 'skip' | 'fallback' | 'notify-only' | 'checkpoint';

// Interface for recovery options
interface RecoveryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  exponentialBackoff?: boolean;
  skipFailedItems?: boolean;
  notifyOnFailure?: boolean;
  useCheckpoint?: boolean;
}

// Default recovery options
const DEFAULT_RECOVERY_OPTIONS: RecoveryOptions = {
  maxRetries: 3,
  retryDelayMs: 2000,
  exponentialBackoff: true,
  skipFailedItems: true,
  notifyOnFailure: true,
  useCheckpoint: false,
};

/**
 * ETL Error Handling Service provides comprehensive error handling for ETL processes
 */
export const etlErrorHandlingService = {
  /**
   * Handle an ETL error with appropriate logging and recovery
   */
  async handleError(
    error: Error | ETLError | unknown,
    phase: ETLPhase,
    jobId: string,
    context: Record<string, any> = {},
    recoveryOptions: RecoveryOptions = DEFAULT_RECOVERY_OPTIONS
  ): Promise<{
    handled: boolean;
    strategy: RecoveryStrategy;
    retryCount?: number;
    error?: Error;
  }> {
    // Normalize the error to an ETLError
    const etlError = this.normalizeError(error, phase);
    
    // Log the error
    await this.logError(etlError, jobId, context);
    
    // Determine recovery strategy
    const strategy = this.determineRecoveryStrategy(etlError, phase, context);
    
    // Execute recovery strategy
    const result = await this.executeRecoveryStrategy(
      strategy, 
      etlError, 
      jobId, 
      context, 
      recoveryOptions
    );
    
    return result;
  },
  
  /**
   * Normalize any error to an ETLError
   */
  normalizeError(error: Error | ETLError | unknown, phase: ETLPhase): ETLError {
    if (error instanceof ETLError) {
      return error;
    }
    
    // Map phase to error type
    let errorType: any;
    switch (phase) {
      case 'extraction':
        errorType = 'EXTRACT_ERROR';
        break;
      case 'transformation':
        errorType = 'TRANSFORM_ERROR';
        break;
      case 'loading':
        errorType = 'LOAD_ERROR';
        break;
      case 'validation':
        errorType = 'VALIDATION_ERROR';
        break;
      default:
        errorType = 'UNKNOWN_ERROR';
    }
    
    if (error instanceof Error) {
      return new ETLError(error.message, errorType, error);
    }
    
    return new ETLError(
      `${phase.charAt(0).toUpperCase() + phase.slice(1)} error: ${String(error)}`,
      errorType
    );
  },
  
  /**
   * Log an ETL error to Firebase and console
   */
  async logError(error: ETLError, jobId: string, context: Record<string, any> = {}): Promise<void> {
    // Log the error with the ETL logger
    await logETLEvent(ETLLogLevel.ERROR, error.message, {
      jobId,
      errorType: error.type,
      phase: context.phase || 'unknown',
      itemId: context.itemId,
      error: error.message,
      stack: error.stack,
      ...context
    });
    
    // Store detailed error information in the ETL errors collection
    try {
      // Check if db is available before using it
      if (db) {
        await addDoc(collection(db as Firestore, ETL_ERRORS_COLLECTION), {
          jobId,
          type: error.type,
          message: error.message,
          stack: error.stack,
          context,
          timestamp: Timestamp.now(),
          handled: false,
        });
      } else {
        console.warn('Firebase db is not initialized, skipping error storage');
      }
    } catch (err) {
      // If Firebase fails, just log to console but don't throw (avoid cascading errors)
      console.error('Failed to store ETL error details in Firebase:', err);
    }
  },
  
  /**
   * Determine the best recovery strategy for an error
   */
  determineRecoveryStrategy(
    error: ETLError, 
    phase: ETLPhase, 
    context: Record<string, any>
  ): RecoveryStrategy {
    // Connection errors are typically retryable
    if (error.type === 'CONNECTION_ERROR' || error.type === 'TIMEOUT_ERROR') {
      return 'retry';
    }
    
    // Validation errors typically can't be fixed by retrying
    if (error.type === 'VALIDATION_ERROR') {
      return 'skip';
    }
    
    // Authentication and permission errors typically require notification
    if (error.type === 'AUTHENTICATION_ERROR' || error.type === 'PERMISSION_ERROR') {
      return 'notify-only';
    }
    
    // For extraction phase, use retry by default
    if (phase === 'extraction') {
      return 'retry';
    }
    
    // For transformation and loading of individual items, skip is often best
    if ((phase === 'transformation' || phase === 'loading') && context.itemId) {
      return 'skip';
    }
    
    // For larger process failures, use checkpoint if available
    if (context.hasCheckpoint) {
      return 'checkpoint';
    }
    
    // Default to notify-only for unhandled cases
    return 'notify-only';
  },
  
  /**
   * Execute a recovery strategy
   */
  async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    error: ETLError,
    jobId: string,
    context: Record<string, any>,
    options: RecoveryOptions
  ): Promise<{
    handled: boolean;
    strategy: RecoveryStrategy;
    retryCount?: number;
    error?: Error;
  }> {
    try {
      switch (strategy) {
        case 'retry':
          return await this.executeRetryStrategy(error, jobId, context, options);
        
        case 'skip':
          return await this.executeSkipStrategy(error, jobId, context, options);
        
        case 'fallback':
          return await this.executeFallbackStrategy(error, jobId, context, options);
        
        case 'checkpoint':
          return await this.executeCheckpointStrategy(error, jobId, context, options);
        
        case 'notify-only':
        default:
          return await this.executeNotifyStrategy(error, jobId, context, options);
      }
    } catch (strategyError) {
      // If the recovery strategy itself fails, log and return unhandled
      console.error(`Recovery strategy ${strategy} failed:`, strategyError);
      
      return {
        handled: false,
        strategy,
        error: strategyError instanceof Error ? strategyError : new Error(String(strategyError))
      };
    }
  },
  
  /**
   * Execute a retry recovery strategy
   */
  async executeRetryStrategy(
    error: ETLError,
    jobId: string,
    context: Record<string, any>,
    options: RecoveryOptions
  ): Promise<{
    handled: boolean;
    strategy: RecoveryStrategy;
    retryCount: number;
    error?: Error;
  }> {
    const retryCount = context.retryCount || 0;
    
    // Check if we've exceeded max retries
    if (retryCount >= (options.maxRetries || DEFAULT_RECOVERY_OPTIONS.maxRetries!)) {
      logETLEvent(ETLLogLevel.WARN, `Max retries (${options.maxRetries}) exceeded for job`, {
        jobId,
        itemId: context.itemId,
        retryCount
      });
      
      // If we've exceeded retries, fall back to skip strategy
      if (options.skipFailedItems) {
        const skipResult = await this.executeSkipStrategy(error, jobId, context, options);
        return {
          ...skipResult,
          retryCount
        };
      }
      
      return {
        handled: false,
        strategy: 'retry',
        retryCount,
        error: new Error(`Max retries (${options.maxRetries}) exceeded`)
      };
    }
    
    // Calculate retry delay with exponential backoff if enabled
    let retryDelay = options.retryDelayMs || DEFAULT_RECOVERY_OPTIONS.retryDelayMs!;
    if (options.exponentialBackoff) {
      retryDelay = retryDelay * Math.pow(2, retryCount);
    }
    
    // Log retry attempt
    logETLEvent(ETLLogLevel.INFO, `Retrying operation after error`, {
      jobId,
      itemId: context.itemId,
      retryCount: retryCount + 1,
      retryDelay,
      error: error.message
    });
    
    // Wait for the retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    return {
      handled: true,
      strategy: 'retry',
      retryCount: retryCount + 1
    };
  },
  
  /**
   * Execute a skip recovery strategy
   */
  async executeSkipStrategy(
    error: ETLError,
    jobId: string,
    context: Record<string, any>,
    options: RecoveryOptions
  ): Promise<{
    handled: boolean;
    strategy: RecoveryStrategy;
    error?: Error;
  }> {
    // Log that we're skipping this item
    logETLEvent(ETLLogLevel.WARN, `Skipping failed item and continuing`, {
      jobId,
      itemId: context.itemId,
      error: error.message
    });
    
    // Update job with skipped items if available
    if (context.itemId && context.updateJobFn) {
      try {
        await context.updateJobFn({
          skippedItem: context.itemId,
          error: error.message
        });
      } catch (updateError) {
        console.error('Failed to update job with skipped item:', updateError);
      }
    }
    
    // Store recovery action
    try {
      if (db) {
        await addDoc(collection(db as Firestore, ETL_RECOVERY_COLLECTION), {
          jobId,
          strategy: 'skip',
          itemId: context.itemId,
          error: error.message,
          timestamp: Timestamp.now()
        });
      } else {
        console.warn('Firebase db is not initialized, skipping recovery action storage');
      }
    } catch (storageError) {
      console.error('Failed to store recovery action:', storageError);
    }
    
    return {
      handled: true,
      strategy: 'skip'
    };
  },
  
  /**
   * Execute a fallback recovery strategy
   */
  async executeFallbackStrategy(
    error: ETLError,
    jobId: string,
    context: Record<string, any>,
    options: RecoveryOptions
  ): Promise<{
    handled: boolean;
    strategy: RecoveryStrategy;
    error?: Error;
  }> {
    // Check if a fallback function is provided
    if (!context.fallbackFn) {
      return {
        handled: false,
        strategy: 'fallback',
        error: new Error('No fallback function provided in context')
      };
    }
    
    // Log that we're using fallback
    logETLEvent(ETLLogLevel.WARN, `Using fallback method after error`, {
      jobId,
      itemId: context.itemId,
      error: error.message
    });
    
    try {
      // Execute the fallback function
      await context.fallbackFn(error, context);
      
      // Store recovery action
      if (db) {
        await addDoc(collection(db as Firestore, ETL_RECOVERY_COLLECTION), {
          jobId,
          strategy: 'fallback',
          itemId: context.itemId,
          error: error.message,
          timestamp: Timestamp.now()
        });
      }
      
      return {
        handled: true,
        strategy: 'fallback'
      };
    } catch (fallbackError) {
      return {
        handled: false,
        strategy: 'fallback',
        error: fallbackError instanceof Error 
          ? fallbackError 
          : new Error(`Fallback function failed: ${fallbackError}`)
      };
    }
  },
  
  /**
   * Execute a checkpoint recovery strategy
   */
  async executeCheckpointStrategy(
    error: ETLError,
    jobId: string,
    context: Record<string, any>,
    options: RecoveryOptions
  ): Promise<{
    handled: boolean;
    strategy: RecoveryStrategy;
    error?: Error;
  }> {
    // Check if checkpoint information is available
    if (!context.checkpointData) {
      return {
        handled: false,
        strategy: 'checkpoint',
        error: new Error('No checkpoint data provided in context')
      };
    }
    
    // Log that we're using checkpoint recovery
    logETLEvent(ETLLogLevel.INFO, `Recovering from checkpoint after error`, {
      jobId,
      checkpoint: context.checkpointData,
      error: error.message
    });
    
    // Store checkpoint for recovery
    try {
      if (db) {
        await addDoc(collection(db as Firestore, ETL_RECOVERY_COLLECTION), {
          jobId,
          strategy: 'checkpoint',
          checkpointData: context.checkpointData,
          error: error.message,
          timestamp: Timestamp.now()
        });
      } else {
        console.warn('Firebase db is not initialized, skipping checkpoint storage');
      }
      
      return {
        handled: true,
        strategy: 'checkpoint'
      };
    } catch (checkpointError) {
      return {
        handled: false,
        strategy: 'checkpoint',
        error: checkpointError instanceof Error 
          ? checkpointError 
          : new Error(`Checkpoint recovery failed: ${checkpointError}`)
      };
    }
  },
  
  /**
   * Execute a notify-only recovery strategy
   */
  async executeNotifyStrategy(
    error: ETLError,
    jobId: string,
    context: Record<string, any>,
    options: RecoveryOptions
  ): Promise<{
    handled: boolean;
    strategy: RecoveryStrategy;
    error?: Error;
  }> {
    // Log notification
    logETLEvent(ETLLogLevel.ERROR, `Critical ETL error requires attention`, {
      jobId,
      itemId: context.itemId,
      error: error.message,
      type: error.type
    });
    
    // Mark the job as failed
    try {
      await etlJobService.failJob(
        jobId,
        error.message,
        { 
          processed: context.processed || 0, 
          failed: context.failed || 1, 
          templates: context.templates || 0 
        }
      );
    } catch (jobError) {
      console.error('Failed to mark job as failed:', jobError);
    }
    
    // In a real implementation, we would send a notification here
    // For now, we just log it
    console.error('ETL ERROR NOTIFICATION:', {
      jobId,
      errorType: error.type,
      message: error.message,
      context
    });
    
    return {
      handled: true,
      strategy: 'notify-only'
    };
  },
  
  /**
   * Get error statistics for a specific job
   */
  async getErrorStats(jobId: string): Promise<{
    totalErrors: number;
    byType: Record<string, number>;
    byPhase: Record<string, number>;
  }> {
    try {
      if (!db) {
        console.warn('Firebase db is not initialized, returning empty error stats');
        return { totalErrors: 0, byType: {}, byPhase: {} };
      }

      const q = query(
        collection(db as Firestore, ETL_ERRORS_COLLECTION),
        where('jobId', '==', jobId)
      );
      
      const errorsSnapshot = await getDocs(q);
      const errors = errorsSnapshot.docs.map(doc => doc.data());
      
      // Count errors by type and phase
      const byType: Record<string, number> = {};
      const byPhase: Record<string, number> = {};
      
      errors.forEach(error => {
        const type = error.type || 'UNKNOWN_ERROR';
        const phase = error.context?.phase || 'unknown';
        
        byType[type] = (byType[type] || 0) + 1;
        byPhase[phase] = (byPhase[phase] || 0) + 1;
      });
      
      return {
        totalErrors: errors.length,
        byType,
        byPhase
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      throw error;
    }
  },
  
  /**
   * Get recovery actions for a specific job
   */
  async getRecoveryActions(jobId: string): Promise<any[]> {
    try {
      if (!db) {
        console.warn('Firebase db is not initialized, returning empty recovery actions');
        return [];
      }

      const q = query(
        collection(db as Firestore, ETL_RECOVERY_COLLECTION),
        where('jobId', '==', jobId),
        orderBy('timestamp', 'asc')
      );
      
      const actionsSnapshot = await getDocs(q);
      return actionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Failed to get recovery actions:', error);
      throw error;
    }
  }
}; 
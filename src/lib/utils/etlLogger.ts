/**
 * ETL Logger Utility
 * 
 * This module provides logging functionality for ETL processes with different log levels,
 * error types, and structured logging capabilities. It can be configured to output logs
 * to console and/or a persistent store like Firebase.
 */

import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Define log levels for ETL processes
export enum ETLLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// ETL error types for categorization
export type ETLErrorType = 
  | 'EXTRACT_ERROR'
  | 'TRANSFORM_ERROR'
  | 'LOAD_ERROR'
  | 'CONNECTION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'UNKNOWN_ERROR';

// Custom error class for ETL processes
export class ETLError extends Error {
  type: ETLErrorType;
  
  constructor(message: string, type: ETLErrorType = 'UNKNOWN_ERROR', cause?: Error) {
    super(message);
    this.name = 'ETLError';
    this.type = type;
    this.cause = cause;
  }
}

// Configuration for the ETL logger
let loggerConfig = {
  minLevel: ETLLogLevel.INFO,  // Minimum level to log
  logToConsole: true,          // Whether to log to console
  logToFirebase: true,         // Whether to log to Firebase
  maxFirebaseLogs: 1000,       // Maximum number of logs to store in Firebase
};

// The Firebase collection for ETL logs
const LOGS_COLLECTION = 'etlLogs';

/**
 * Log an ETL event with structured data
 * 
 * @param level - The log level
 * @param message - The log message
 * @param data - Additional structured data for the log
 */
export async function logETLEvent(
  level: ETLLogLevel,
  message: string,
  data: Record<string, any> = {}
): Promise<void> {
  // Only log if the level is at or above the minimum level
  if (!shouldLog(level)) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  // Create the log entry
  const logEntry = {
    level,
    message,
    timestamp,
    ...data
  };
  
  // Log to console if enabled
  if (loggerConfig.logToConsole) {
    logToConsole(level, message, logEntry);
  }
  
  // Log to Firebase if enabled
  if (loggerConfig.logToFirebase) {
    try {
      await logToFirebase(logEntry);
    } catch (error) {
      // If Firebase logging fails, at least log to console
      console.error('Failed to write ETL log to Firebase:', error);
      if (!loggerConfig.logToConsole) {
        console.error('ETL Log:', logEntry);
      }
    }
  }
}

/**
 * Determine if a message should be logged based on the minimum log level
 */
function shouldLog(level: ETLLogLevel): boolean {
  const levelOrder = {
    [ETLLogLevel.DEBUG]: 0,
    [ETLLogLevel.INFO]: 1,
    [ETLLogLevel.WARN]: 2,
    [ETLLogLevel.ERROR]: 3,
    [ETLLogLevel.CRITICAL]: 4
  };
  
  return levelOrder[level] >= levelOrder[loggerConfig.minLevel];
}

/**
 * Log a message to the console with appropriate formatting
 */
function logToConsole(level: ETLLogLevel, message: string, data: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  
  // Format the prefix based on log level
  let prefix = '';
  switch (level) {
    case ETLLogLevel.DEBUG:
      prefix = `🔍 DEBUG [${timestamp}]`;
      break;
    case ETLLogLevel.INFO:
      prefix = `ℹ️ INFO [${timestamp}]`;
      break;
    case ETLLogLevel.WARN:
      prefix = `⚠️ WARNING [${timestamp}]`;
      break;
    case ETLLogLevel.ERROR:
      prefix = `❌ ERROR [${timestamp}]`;
      break;
    case ETLLogLevel.CRITICAL:
      prefix = `🔥 CRITICAL [${timestamp}]`;
      break;
  }
  
  // Use the appropriate console method
  const { jobId, ...restData } = data;
  let jobPrefix = jobId ? `[Job: ${jobId}] ` : '';
  
  switch (level) {
    case ETLLogLevel.DEBUG:
      console.debug(`${prefix} ${jobPrefix}${message}`, restData);
      break;
    case ETLLogLevel.INFO:
      console.info(`${prefix} ${jobPrefix}${message}`, restData);
      break;
    case ETLLogLevel.WARN:
      console.warn(`${prefix} ${jobPrefix}${message}`, restData);
      break;
    case ETLLogLevel.ERROR:
    case ETLLogLevel.CRITICAL:
      console.error(`${prefix} ${jobPrefix}${message}`, restData);
      break;
  }
}

/**
 * Log an entry to Firebase
 */
async function logToFirebase(logEntry: Record<string, any>): Promise<void> {
  try {
    if (!db) {
      console.warn('Firebase DB is not initialized, cannot log to Firebase');
      return;
    }
    
    // Add the log entry to the collection
    await addDoc(collection(db, LOGS_COLLECTION), {
      ...logEntry,
      timestamp: Timestamp.fromDate(new Date(logEntry.timestamp))
    });
  } catch (error) {
    console.error('Error writing log to Firebase:', error);
    throw error;
  }
}

/**
 * Configure the ETL logger
 */
export function configureETLLogger(config: Partial<typeof loggerConfig>): void {
  loggerConfig = { ...loggerConfig, ...config };
}

/**
 * Set the minimum log level
 */
export function setETLLogLevel(level: ETLLogLevel): void {
  loggerConfig.minLevel = level;
}

/**
 * Clear old ETL logs from Firebase
 * This is useful for maintaining performance by limiting the number of logs
 */
export async function cleanupOldETLLogs(maxAgeDays = 30): Promise<void> {
  // Implementation of log cleanup would go here
  // This would involve querying logs older than the specified age and deleting them
  console.log(`Cleanup of logs older than ${maxAgeDays} days would be executed here`);
} 
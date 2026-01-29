/**
 * FEAT-002: DPS Event Emitter
 * 
 * Emits events for DPS calculations for downstream processing:
 * - EVT.DPS.CalculationCompleted
 * - EVT.DPS.CalculationFailed
 * - EVT.DPS.BatchCompleted
 * - EVT.DPS.CohortStatsUpdated
 * 
 * @module dps-event-emitter
 */

import { DPSResult, BatchDPSResult } from './dps-calculation-engine';
import { CohortStatsRow } from './dps-database-service';

// =====================================================
// Event Type Definitions
// =====================================================

export interface DPSCalculationCompletedEvent {
  event: 'EVT.DPS.CalculationCompleted';
  version: 'v1';
  data: {
    videoId: string;
    viralScore: number;
    classification: string;
    batchId?: string;
    processingTimeMs?: number;
    auditId: string;
    timestamp: string;
  };
}

export interface DPSCalculationFailedEvent {
  event: 'EVT.DPS.CalculationFailed';
  version: 'v1';
  data: {
    videoId: string;
    errorCode: string;
    errorMessage: string;
    batchId?: string;
    auditId: string;
    timestamp: string;
  };
}

export interface DPSBatchCompletedEvent {
  event: 'EVT.DPS.BatchCompleted';
  version: 'v1';
  data: {
    batchId: string;
    totalVideos: number;
    successCount: number;
    failureCount: number;
    processingTimeMs: number;
    auditId: string;
    timestamp: string;
  };
}

export interface DPSCohortStatsUpdatedEvent {
  event: 'EVT.DPS.CohortStatsUpdated';
  version: 'v1';
  data: {
    platform: string;
    followerBracket: string;
    cohortMedian: number;
    sampleSize: number;
    updatedAt: string;
    auditId: string;
  };
}

export type DPSEvent = 
  | DPSCalculationCompletedEvent
  | DPSCalculationFailedEvent
  | DPSBatchCompletedEvent
  | DPSCohortStatsUpdatedEvent;

// =====================================================
// Event Handlers
// =====================================================

/**
 * List of registered event handlers
 * Handlers can be added for custom processing (e.g., webhooks, analytics)
 */
const eventHandlers: Array<(event: DPSEvent) => void | Promise<void>> = [];

/**
 * Register a custom event handler
 */
export function registerEventHandler(handler: (event: DPSEvent) => void | Promise<void>) {
  eventHandlers.push(handler);
}

/**
 * Emit an event to all registered handlers
 */
async function emitEvent(event: DPSEvent): Promise<void> {
  // Log event to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[DPS Event]', event.event, event.data);
  }
  
  // Call all registered handlers
  for (const handler of eventHandlers) {
    try {
      await handler(event);
    } catch (error) {
      console.error('Event handler error:', error);
    }
  }
  
  // Store event in database (optional - for event sourcing)
  await storeEvent(event);
}

/**
 * Store event in database for audit trail
 */
async function storeEvent(event: DPSEvent): Promise<void> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Create events table if it doesn't exist (idempotent)
    // This could be moved to migration, but keeping it here for flexibility
    await supabase.rpc('create_dps_events_table_if_not_exists').catch(() => {
      // Table might not exist yet, that's okay
    });
    
    // Insert event
    await supabase
      .from('dps_events')
      .insert({
        event_type: event.event,
        event_version: event.version,
        event_data: event.data,
        created_at: new Date().toISOString(),
      })
      .catch((error) => {
        // Non-critical - log but don't throw
        console.warn('Failed to store event:', error);
      });
  } catch (error) {
    // Non-critical - log but don't throw
    console.warn('Event storage error:', error);
  }
}

// =====================================================
// Event Emission Functions
// =====================================================

/**
 * Emit calculation completed event
 */
export async function emitCalculationCompleted(
  result: DPSResult,
  batchId?: string
): Promise<void> {
  const event: DPSCalculationCompletedEvent = {
    event: 'EVT.DPS.CalculationCompleted',
    version: 'v1',
    data: {
      videoId: result.videoId,
      viralScore: result.viralScore,
      classification: result.classification,
      batchId,
      processingTimeMs: result.processingTimeMs,
      auditId: result.auditId,
      timestamp: result.calculatedAt,
    },
  };
  
  await emitEvent(event);
}

/**
 * Emit calculation failed event
 */
export async function emitCalculationFailed(
  videoId: string,
  errorCode: string,
  errorMessage: string,
  auditId: string,
  batchId?: string
): Promise<void> {
  const event: DPSCalculationFailedEvent = {
    event: 'EVT.DPS.CalculationFailed',
    version: 'v1',
    data: {
      videoId,
      errorCode,
      errorMessage,
      batchId,
      auditId,
      timestamp: new Date().toISOString(),
    },
  };
  
  await emitEvent(event);
}

/**
 * Emit batch completed event
 */
export async function emitBatchCompleted(result: BatchDPSResult): Promise<void> {
  const event: DPSBatchCompletedEvent = {
    event: 'EVT.DPS.BatchCompleted',
    version: 'v1',
    data: {
      batchId: result.batchId,
      totalVideos: result.totalVideos,
      successCount: result.successCount,
      failureCount: result.failureCount,
      processingTimeMs: result.processingTimeMs,
      auditId: result.auditId,
      timestamp: new Date().toISOString(),
    },
  };
  
  await emitEvent(event);
}

/**
 * Emit cohort stats updated event
 */
export async function emitCohortStatsUpdated(
  cohortStats: CohortStatsRow,
  auditId: string
): Promise<void> {
  const event: DPSCohortStatsUpdatedEvent = {
    event: 'EVT.DPS.CohortStatsUpdated',
    version: 'v1',
    data: {
      platform: cohortStats.platform,
      followerBracket: `${cohortStats.follower_min}-${cohortStats.follower_max}`,
      cohortMedian: cohortStats.cohort_median,
      sampleSize: cohortStats.sample_size,
      updatedAt: cohortStats.last_updated || new Date().toISOString(),
      auditId,
    },
  };
  
  await emitEvent(event);
}

// =====================================================
// Exports
// =====================================================

export const DPSEventEmitter = {
  registerEventHandler,
  emitCalculationCompleted,
  emitCalculationFailed,
  emitBatchCompleted,
  emitCohortStatsUpdated,
};

export default DPSEventEmitter;



/**
 * FEAT-002: DPS Calculation Engine - Main Export
 * 
 * Unified export for all DPS calculation functionality
 * 
 * @module dps
 */

// Core Calculation Engine
export {
  VideoInput,
  DPSResult,
  CohortStats,
  BatchDPSResult,
  VideoInputSchema,
  calculateDPS,
  calculateDecayFactor,
  calculateEngagementScore,
  calculateZScore,
  zScoreToPercentile,
  classifyVirality,
  getCohortBounds,
  calculateConfidence,
  calculateMasterViralScore,
  calculateIdentityContainerScore,
  validateVideoInput,
  calculateHoursSinceUpload,
  generateAuditId,
  DPSEngine,
  DECAY_RATES,
  PLATFORM_WEIGHTS,
  ENGAGEMENT_WEIGHTS,
  VIRALITY_THRESHOLDS,
  MAX_DECAY_HOURS,
} from './dps-calculation-engine';

// Database Service
export {
  DPSCalculationRow,
  DPSErrorRow,
  CohortStatsRow,
  saveDPSCalculation,
  getCohortStats,
  getPlatformMedian,
  logCalculationError,
  getRecentErrors,
  getVideoCalculationHistory,
  getBatchCalculations,
  updateCohortStats,
  getAllCohortStats,
  getCalculationStats,
  saveBatchCalculations,
  DPSDatabaseService,
} from './dps-database-service';

// Calculation Service (Orchestration)
export {
  calculateSingleDPS,
  calculateBatchDPS,
  processScrapedVideos,
  recalculateDPS,
  DPSCalculationService,
  DPS_ERROR_CODES,
  MAX_BATCH_SIZE,
} from './dps-calculation-service';

// Event Emitter
export {
  DPSCalculationCompletedEvent,
  DPSCalculationFailedEvent,
  DPSBatchCompletedEvent,
  DPSCohortStatsUpdatedEvent,
  DPSEvent,
  registerEventHandler,
  emitCalculationCompleted,
  emitCalculationFailed,
  emitBatchCompleted,
  emitCohortStatsUpdated,
  DPSEventEmitter,
} from './dps-event-emitter';

// Blockchain Timestamp Service (Enhancement)
export {
  BlockchainTimestamp,
  timestampPrediction,
  verifyTimestamp,
  batchTimestampPredictions,
  createCalculationHash,
  type BlockchainTimestampResult,
  type DPSCalculation,
} from './blockchain-timestamp';

// Re-export default service
export { default as DPSCalculationEngine } from './dps-calculation-engine';
export { default as DPSDatabaseService } from './dps-database-service';
export { default as DPSCalculationService } from './dps-calculation-service';
export { default as DPSEventEmitter } from './dps-event-emitter';
export { default as BlockchainTimestamp } from './blockchain-timestamp';


/**
 * FEAT-003: Pattern Extraction System - Main Export
 * 
 * Barrel export for the pattern extraction service
 * @module pattern-extraction
 */

// Core service
export {
  extractPatterns,
  getTopPatterns,
  getPatternsByType,
  batchExtractPatterns,
  PatternExtractionService,
  MAX_BATCH_SIZE,
} from './pattern-extraction-service';

// Engine functions
export {
  extractPatternsFromVideos,
  buildPatternExtractionPrompt,
  validateExtractedPattern,
  deduplicatePatterns,
  generateAuditId,
  generateBatchId,
  PatternExtractionEngine,
} from './pattern-extraction-engine';

// Database functions
export {
  queryVideosForExtraction,
  findExistingPattern,
  findSimilarPatterns,
  createPattern,
  incrementPatternFrequency,
  updatePatternStatistics,
  associatePatternWithVideo,
  getPatternsForVideo,
  createExtractionJob,
  updateJobStatus,
  getJobByBatchId,
  logExtractionError,
  getTopPatternsByNiche,
  PatternDatabaseService,
} from './pattern-database-service';

// Types
export type {
  PatternType,
  ViralPattern,
  PatternVideoAssociation,
  VideoForExtraction,
  ExtractedPattern,
  LLMExtractionResponse,
  VideoMetadataForLLM,
  PatternExtractionRequest,
  PatternExtractionResponse,
  PatternSummary,
  PatternJobStatus,
  PatternExtractionJob,
  PatternExtractionError,
  BatchExtractionResult,
  PatternErrorCode,
  PatternExtractionConfig,
} from './types';

export {
  PATTERN_ERROR_CODES,
  DEFAULT_PATTERN_CONFIG,
} from './types';

// Enhanced extraction (v2)
export {
  extractEnhancedPatterns,
} from './enhanced-extraction-service';

export type {
  VideoForDetailedExtraction,
  ExtractedVideoPattern,
  EnhancedPatternExtractionRequest,
  EnhancedPatternExtractionResponse,
  EnhancedPatternExtractionConfig,
} from './types-enhanced';

export {
  DEFAULT_ENHANCED_PATTERN_CONFIG,
} from './types-enhanced';

// Unified extraction (v2 + quality filter)
export {
  extractPatternsWithQualityFilter,
  createUnifiedExtractionOptions,
} from './unified-extraction-service';

export type {
  UnifiedExtractionOptions,
  UnifiedExtractionResponse,
} from './unified-extraction-service';

// Quality filter integration
export {
  assessVideoQuality,
  assessVideosQuality,
  getQualityStatistics,
} from './quality-filter-integration';

export type {
  QualityAssessment,
  VideoForQualityCheck,
} from './quality-filter-integration';

// Default export
export { default } from './pattern-extraction-service';


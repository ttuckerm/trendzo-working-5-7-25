/**
 * Feature Extraction Service - Public API
 *
 * Export main functions and types for feature extraction
 */

// Main service functions
export {
  extractFeaturesFromVideo,
  extractFeaturesFromVideos,
  flattenFeatureVector,
  getFeatureNames,
} from './feature-extraction-service';

// Types
export type {
  // Input/Output types
  FeatureExtractionInput,
  FeatureExtractionConfig,
  FeatureExtractionResult,
  BatchFeatureExtractionResult,
  VideoFeatureVector,

  // Feature group types
  BasicTextMetrics,
  PunctuationAnalysis,
  PronounPerspective,
  EmotionalPowerWords,
  ViralPatternWords,
  CapitalizationFormatting,
  LinguisticComplexity,
  DialogueInteraction,
  ContentStructureSignals,
  TimestampPacing,
  VideoMetadata,
  HistoricalPerformance,
} from './types';

// Config
export { 
  DEFAULT_FEATURE_EXTRACTION_CONFIG,
  TRAINING_FEATURE_EXTRACTION_CONFIG,
} from './types';

// Individual extractors (optional - for advanced usage)
export {
  extractBasicTextMetrics,
  extractPunctuationAnalysis,
  extractPronounPerspective,
  extractEmotionalPowerWords,
  extractViralPatternWords,
} from './text-analysis-extractors';

export {
  extractCapitalizationFormatting,
  extractLinguisticComplexity,
  extractDialogueInteraction,
} from './formatting-linguistic-extractors';

export {
  extractContentStructureSignals,
  extractTimestampPacing,
  extractVideoMetadata,
  extractHistoricalPerformance,
} from './content-metadata-extractors';

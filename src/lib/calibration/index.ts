/**
 * Calibration Library
 * 
 * Export all calibration utilities for fixing prediction accuracy issues.
 */

// Score calibration
export { 
  calibrateScore, 
  calibrateAllScores, 
  calculateWeightedScore,
  learnCalibration,
  calculateMeanError,
  formatCalibration,
  DEFAULT_CALIBRATIONS,
  type CalibrationConfig 
} from './score-calibrator';

// Signal detection (positive and negative)
export {
  detectNegativeSignals,
  detectPositiveSignals,
  calculatePenalty,
  calculateBonus,
  applyNegativeSignals,
  applySignals,
  getSignalSummary,
  type NegativeSignal,
  type PositiveSignal
} from './negative-signals';

// Auto-calibration
export {
  analyzeCalibration,
  applyCalibrationUpdates,
  createCalibrationHistoryEntry,
  calculateCalibrationConfidence,
  getCalibrationReport,
  type CalibrationUpdate,
  type CalibrationAnalysis
} from './auto-calibrator';

// Calibrated prompts
export {
  CALIBRATED_GPT4_PROMPT,
  CALIBRATED_GEMINI_PROMPT,
  CALIBRATED_PATTERN_PROMPT,
  CALIBRATED_XGBOOST_FEATURES_PROMPT,
  CALIBRATION_SYSTEM_PROMPT
} from './calibrated-prompts';


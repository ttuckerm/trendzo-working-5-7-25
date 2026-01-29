/**
 * Validation Gates for Orchestration Pipeline
 * 
 * Provides validation checkpoints for the prediction pipeline.
 * Ensures data quality and processing status tracking throughout the pipeline.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ProcessingStatus = 
  | 'pending'
  | 'validating'
  | 'processing'
  | 'extracting'
  | 'predicting'
  | 'storing'
  | 'completed'
  | 'failed';

export interface ValidationResult {
  passed: boolean;
  gate: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationGateResult {
  allPassed: boolean;
  results: ValidationResult[];
  failedGates: string[];
}

export interface ProcessingContext {
  videoId: string;
  status: ProcessingStatus;
  startedAt: Date;
  updatedAt: Date;
  errors: string[];
  metadata: Record<string, any>;
}

// ============================================================================
// PRE-PROCESSING VALIDATION
// ============================================================================

/**
 * Validate inputs before processing begins
 */
export function validatePreProcessing(input: {
  videoId?: string;
  videoPath?: string;
  transcript?: string;
}): ValidationGateResult {
  const results: ValidationResult[] = [];

  // Check video ID
  if (!input.videoId) {
    results.push({
      passed: false,
      gate: 'video_id',
      message: 'Video ID is required',
    });
  } else {
    results.push({
      passed: true,
      gate: 'video_id',
      message: 'Video ID present',
    });
  }

  // Check if we have either video path or transcript
  const hasVideoPath = !!input.videoPath;
  const hasTranscript = !!input.transcript && input.transcript.trim().length > 0;

  if (!hasVideoPath && !hasTranscript) {
    results.push({
      passed: false,
      gate: 'input_data',
      message: 'Either video path or transcript is required',
    });
  } else {
    results.push({
      passed: true,
      gate: 'input_data',
      message: hasVideoPath ? 'Video path available' : 'Transcript available',
      details: { hasVideoPath, hasTranscript },
    });
  }

  const failedGates = results.filter(r => !r.passed).map(r => r.gate);

  return {
    allPassed: failedGates.length === 0,
    results,
    failedGates,
  };
}

// ============================================================================
// COMPONENT VALIDATION
// ============================================================================

/**
 * Validate that all required components completed successfully
 */
export function validateAllComponents(
  componentResults: Array<{ componentId: string; success: boolean; error?: string }>
): ValidationGateResult {
  const results: ValidationResult[] = [];

  // Required components that must succeed
  const requiredComponents = [
    'feature-extraction',
    'pattern-extraction',
  ];

  // Optional components (we log but don't fail on these)
  const optionalComponents = [
    'ffmpeg-analysis',
    'whisper-transcription',
    'llm-scoring',
  ];

  for (const component of componentResults) {
    const isRequired = requiredComponents.includes(component.componentId);
    
    results.push({
      passed: component.success || !isRequired,
      gate: component.componentId,
      message: component.success 
        ? `${component.componentId} completed` 
        : component.error || `${component.componentId} failed`,
      details: { required: isRequired },
    });
  }

  // Check minimum component count
  const successfulCount = componentResults.filter(c => c.success).length;
  const minComponents = 5;
  
  results.push({
    passed: successfulCount >= minComponents,
    gate: 'min_components',
    message: `${successfulCount} components succeeded (minimum: ${minComponents})`,
    details: { successfulCount, minComponents },
  });

  const failedGates = results.filter(r => !r.passed).map(r => r.gate);

  return {
    allPassed: failedGates.length === 0,
    results,
    failedGates,
  };
}

// ============================================================================
// POST-PROCESSING VALIDATION
// ============================================================================

/**
 * Validate prediction results before storage
 */
export function validatePostProcessing(prediction: {
  dpsScore?: number;
  confidence?: number;
  featureCount?: number;
}): ValidationGateResult {
  const results: ValidationResult[] = [];

  // Check DPS score validity
  if (typeof prediction.dpsScore === 'number' && !isNaN(prediction.dpsScore)) {
    const validRange = prediction.dpsScore >= 0 && prediction.dpsScore <= 100;
    results.push({
      passed: validRange,
      gate: 'dps_score',
      message: validRange 
        ? `DPS score ${prediction.dpsScore.toFixed(2)} in valid range` 
        : `DPS score ${prediction.dpsScore} out of range [0, 100]`,
    });
  } else {
    results.push({
      passed: false,
      gate: 'dps_score',
      message: 'DPS score is missing or invalid',
    });
  }

  // Check confidence
  if (typeof prediction.confidence === 'number' && !isNaN(prediction.confidence)) {
    results.push({
      passed: prediction.confidence > 0,
      gate: 'confidence',
      message: `Confidence: ${(prediction.confidence * 100).toFixed(1)}%`,
    });
  } else {
    results.push({
      passed: false,
      gate: 'confidence',
      message: 'Confidence score is missing',
    });
  }

  // Check feature count
  const minFeatures = 50;
  if (typeof prediction.featureCount === 'number') {
    results.push({
      passed: prediction.featureCount >= minFeatures,
      gate: 'feature_count',
      message: `${prediction.featureCount} features extracted (minimum: ${minFeatures})`,
    });
  }

  const failedGates = results.filter(r => !r.passed).map(r => r.gate);

  return {
    allPassed: failedGates.length === 0,
    results,
    failedGates,
  };
}

// ============================================================================
// STORAGE VALIDATION
// ============================================================================

/**
 * Validate data before database storage
 */
export function validateStorage(data: {
  videoId: string;
  features: Record<string, any>;
  prediction?: any;
}): ValidationGateResult {
  const results: ValidationResult[] = [];

  // Check video ID
  results.push({
    passed: !!data.videoId,
    gate: 'storage_video_id',
    message: data.videoId ? 'Video ID for storage valid' : 'Video ID missing for storage',
  });

  // Check features object
  const featureCount = Object.keys(data.features || {}).length;
  results.push({
    passed: featureCount > 0,
    gate: 'storage_features',
    message: featureCount > 0 
      ? `${featureCount} features ready for storage` 
      : 'No features to store',
  });

  const failedGates = results.filter(r => !r.passed).map(r => r.gate);

  return {
    allPassed: failedGates.length === 0,
    results,
    failedGates,
  };
}

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

const processingContexts = new Map<string, ProcessingContext>();

/**
 * Update processing status for a video
 */
export function updateProcessingStatus(
  videoId: string,
  status: ProcessingStatus,
  metadata?: Record<string, any>,
  error?: string
): ProcessingContext {
  const existing = processingContexts.get(videoId);
  
  const context: ProcessingContext = {
    videoId,
    status,
    startedAt: existing?.startedAt || new Date(),
    updatedAt: new Date(),
    errors: existing?.errors || [],
    metadata: { ...existing?.metadata, ...metadata },
  };

  if (error) {
    context.errors.push(error);
  }

  processingContexts.set(videoId, context);
  
  console.log(`[Validation] ${videoId} status: ${status}`);
  
  return context;
}

/**
 * Get processing context for a video
 */
export function getProcessingContext(videoId: string): ProcessingContext | undefined {
  return processingContexts.get(videoId);
}

/**
 * Clear processing context for a video
 */
export function clearProcessingContext(videoId: string): void {
  processingContexts.delete(videoId);
}

// ============================================================================
// FULL VALIDATION PIPELINE
// ============================================================================

/**
 * Run all validation gates in sequence
 */
export async function runValidationGates(
  videoId: string,
  input: {
    videoPath?: string;
    transcript?: string;
  },
  componentResults: Array<{ componentId: string; success: boolean; error?: string }>,
  prediction: {
    dpsScore?: number;
    confidence?: number;
    featureCount?: number;
  }
): Promise<{
  allPassed: boolean;
  preProcessing: ValidationGateResult;
  components: ValidationGateResult;
  postProcessing: ValidationGateResult;
}> {
  // Update status
  updateProcessingStatus(videoId, 'validating');

  // Run all gates
  const preProcessing = validatePreProcessing({ videoId, ...input });
  const components = validateAllComponents(componentResults);
  const postProcessing = validatePostProcessing(prediction);

  const allPassed = preProcessing.allPassed && components.allPassed && postProcessing.allPassed;

  // Update final status
  updateProcessingStatus(
    videoId, 
    allPassed ? 'completed' : 'failed',
    { 
      validationPassed: allPassed,
      failedGates: [
        ...preProcessing.failedGates,
        ...components.failedGates,
        ...postProcessing.failedGates,
      ]
    }
  );

  return {
    allPassed,
    preProcessing,
    components,
    postProcessing,
  };
}

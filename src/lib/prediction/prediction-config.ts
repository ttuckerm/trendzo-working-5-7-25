/**
 * Prediction Configuration
 * 
 * Centralizes prediction behavior configuration, especially for mock components.
 * Created for Ticket A2 to ensure honest component behavior.
 */

export function getPredictionConfig() {
  return {
    enableMocks: process.env.ENABLE_MOCK_COMPONENTS === 'true',
  };
}

/**
 * Check if a component has the required inputs to run.
 * If mocks are disabled and inputs are missing, the component should skip.
 */
export function checkComponentInputs(
  componentId: string,
  input: { transcript?: string; videoPath?: string; ffmpegData?: any },
  requiredInputs: Array<'transcript' | 'videoPath' | 'ffmpegData'>
) {
  const config = getPredictionConfig();
  
  // If mocks are enabled, always run
  if (config.enableMocks) {
    return { shouldRun: true, skipReason: null };
  }

  // Check each required input
  for (const requiredInput of requiredInputs) {
    if (!input[requiredInput]) {
      return { 
        shouldRun: false, 
        skipReason: `Missing required input: ${requiredInput}` 
      };
    }
  }
  
  return { shouldRun: true, skipReason: null };
}

/**
 * Create a standardized skipped result for a component.
 */
export function createSkippedResult(
  componentId: string, 
  skipReason: string, 
  latency: number
) {
  return {
    componentId,
    success: false,
    skipped: true,
    skip_reason: skipReason,
    latency,
    insights: [`Component skipped: ${skipReason}`],
  };
}

/**
 * Check if a transcript is valid for analysis.
 */
export function hasValidTranscript(transcript?: string | null): boolean {
  return typeof transcript === 'string' && transcript.trim().length > 20;
}

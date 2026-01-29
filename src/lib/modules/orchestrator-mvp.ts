/**
 * Orchestrator - MVP Implementation
 * Simple prediction router and blender following exact specifications
 */

// import { predictDNA } from './dna-detective';

// Types matching exact specification
export type ShareEdge = {
  from: string;
  to: string;
  t: number;
};

export type DraftInput = {
  genes: boolean[];                 // length 48, required
  earlyMetrics?: {                  // optional
    views_10m: number;
    likes_10m: number;
    shares_10m: number;
  };
  shareGraph?: ShareEdge[];         // optional, array of {from, to, t}
};

export type PredictionResult = {
  probability: number;                 // 0-1 blended P_viral
  enginesUsed: string[];               // e.g. ["DNA_Detective"]
  rationales: string[];                // human-readable bullet list
};

// Fixed weights for blending (renormalize to sum 1 for active engines)
const ENGINE_WEIGHTS = {
  DNA_Detective: 0.60,
  QuantumSwarmNexus: 0.40
} as const;

// Individual engine result interface
interface EngineResult {
  engineName: string;
  probability: number;
  metadata?: any;
}

/**
 * QuantumSwarmNexus stub implementation (placeholder for future)
 */
async function callQuantumSwarmNexus(input: DraftInput): Promise<EngineResult> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 20));
  
  return {
    engineName: 'QuantumSwarmNexus',
    probability: 0.5, // Stub returns fixed 0.5
    metadata: { stub: true }
  };
}

/**
 * DNA_Detective wrapper (temporary mock for compilation)
 */
async function callDNADetective(input: DraftInput): Promise<EngineResult> {
  // Mock implementation for now
  return {
    engineName: 'DNA_Detective',
    probability: 0.73,
    metadata: {
      closest_template: { id: 'mock', name: 'Mock Template', status: 'HOT', distance: 0.25 },
      top_gene_matches: ['MockGene1', 'MockGene2']
    }
  };
}

/**
 * Determine which engines to call based on routing rules
 */
function determineEngines(input: DraftInput): string[] {
  const engines = ['DNA_Detective']; // Always call DNA_Detective
  
  // Rule 2: If earlyMetrics exist AND views_10m >= 500, call QuantumSwarmNexus
  if (input.earlyMetrics && input.earlyMetrics.views_10m >= 500) {
    engines.push('QuantumSwarmNexus');
  }
  // Rule 3: If shareGraph length >= 50, call QuantumSwarmNexus even if earlyMetrics low
  else if (input.shareGraph && input.shareGraph.length >= 50) {
    engines.push('QuantumSwarmNexus');
  }
  
  return engines;
}

/**
 * Call individual engine with error handling
 */
async function callEngine(engineName: string, input: DraftInput): Promise<EngineResult | null> {
  try {
    switch (engineName) {
      case 'DNA_Detective':
        return await callDNADetective(input);
      case 'QuantumSwarmNexus':
        return await callQuantumSwarmNexus(input);
      default:
        throw new Error(`Unknown engine: ${engineName}`);
    }
  } catch (error) {
    console.error(`Engine ${engineName} failed:`, error);
    return null; // Drop failed engine, continue with others
  }
}

/**
 * Blend probabilities using fixed weights (renormalized)
 */
function blendProbabilities(results: EngineResult[]): number {
  if (results.length === 0) return 0.0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const result of results) {
    const weight = ENGINE_WEIGHTS[result.engineName as keyof typeof ENGINE_WEIGHTS] || 0;
    weightedSum += result.probability * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.0;
}

/**
 * Generate rationales list
 */
function generateRationales(input: DraftInput, results: EngineResult[], engineNames: string[]): string[] {
  const rationales: string[] = [];
  
  // DNA_Detective rationale
  const dnaResult = results.find(r => r.engineName === 'DNA_Detective');
  if (dnaResult && dnaResult.metadata?.closest_template) {
    const template = dnaResult.metadata.closest_template;
    rationales.push(`DNA match to template ${template.name} at distance ${template.distance.toFixed(3)}`);
  }
  
  // QuantumSwarmNexus rationale (if called)
  if (engineNames.includes('QuantumSwarmNexus')) {
    if (input.earlyMetrics && input.earlyMetrics.views_10m >= 500) {
      rationales.push('High early velocity triggered QuantumSwarm routing');
    } else if (input.shareGraph && input.shareGraph.length >= 50) {
      rationales.push('Large share graph triggered QuantumSwarm routing');
    }
  }
  
  // Ensure we have at least one rationale
  if (rationales.length === 0) {
    rationales.push('Basic gene analysis completed');
  }
  
  return rationales;
}

/**
 * Main orchestration function
 */
export async function predictDraft(input: DraftInput): Promise<PredictionResult> {
  const startTime = Date.now();
  
  // Validate input
  if (!input.genes || input.genes.length !== 48) {
    throw new Error('Invalid input: genes must be boolean array of length 48');
  }
  
  // Determine which engines to call
  const engineNames = determineEngines(input);
  
  // Call engines in parallel with error handling
  const engineResults = await Promise.all(
    engineNames.map(async (engineName) => callEngine(engineName, input))
  );
  
  // Filter out failed engines
  const successfulResults = engineResults.filter((result): result is EngineResult => result !== null);
  
  // Handle edge case: no engines returned results
  if (successfulResults.length === 0) {
    return {
      probability: 0.0,
      enginesUsed: [],
      rationales: ['All prediction engines failed']
    };
  }
  
  // Blend probabilities
  const blendedProbability = blendProbabilities(successfulResults);
  
  // Generate rationales
  const rationales = generateRationales(input, successfulResults, engineNames);
  
  // Get engines that actually succeeded
  const enginesUsed = successfulResults.map(r => r.engineName);
  
  const duration = Date.now() - startTime;
  console.log(`Orchestrator: Prediction completed in ${duration}ms with engines: ${enginesUsed.join(', ')}`);
  
  return {
    probability: blendedProbability,
    enginesUsed,
    rationales
  };
}
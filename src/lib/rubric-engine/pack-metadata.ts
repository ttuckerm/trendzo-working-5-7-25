/**
 * Pack Metadata Types
 *
 * Runtime metadata for Pack 1/2/3 results to distinguish real vs mock execution.
 */

/**
 * Metadata attached to pack results to identify source and provider.
 */
export interface PackMetadata {
  /** Whether this result came from real execution or mock data */
  source: 'real' | 'mock';
  /** The provider that generated this result */
  provider: 'rule-based' | 'google-ai' | 'anthropic' | 'openai' | 'mock';
  /** Execution time in milliseconds */
  latency_ms: number;
}

/**
 * Pack 3: Viral Mechanics stub (not yet implemented).
 * Minimal schema to avoid premature lock-in.
 */
export interface ViralMechanicsStub {
  pack: '3';
  status: 'not_implemented';
  notes: string;
}

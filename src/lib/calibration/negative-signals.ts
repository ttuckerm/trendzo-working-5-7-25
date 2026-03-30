/**
 * Negative Signal Detector (FIXED)
 * 
 * Detects signals that indicate LOW viral potential.
 * Fixed to not incorrectly penalize good content.
 */

export interface NegativeSignal {
  id: string;
  name: string;
  description: string;
  detected: boolean;
  evidence: string[];
  penalty: number;
}

export interface PositiveSignal {
  id: string;
  name: string;
  detected: boolean;
  evidence: string[];
  bonus: number;
}

// Filler words that indicate low-quality content
const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'so basically',
  'kind of', 'sort of', 'i guess', 'i think maybe', 'anyway',
  'just wanted to', 'i wanted to talk about'
];

// Weak opening phrases (only penalize if NO strong hook present)
const WEAK_HOOKS = [
  'hey guys', 'hello everyone', 'hi there', 'welcome back',
  'so today', 'in this video', 'today i want to', 'so i thought',
  "what's up guys", 'hey what is up'
];

// Strong hook patterns - if found, content has a good hook
const STRONG_HOOK_PATTERNS = [
  /\?/,                                          // Questions
  /stop|wait|hold on|pause/i,                    // Pattern interrupts
  /nobody|no one|secret|hidden|truth/i,          // Curiosity triggers
  /here'?s (something|what|the|a|why|how)/i,     // Direct value
  /something .{0,30}(about|that)/i,              // Curiosity gap
  /what if|did you know|imagine/i,               // Engagement hooks
  /\d+ (years?|months?|days?|hours?)/i,          // Time investment
  /I spent|I studied|I discovered|I learned/i,   // Authority
  /\d+%|\$[\d,]+|\d+x|\d+k|\d+ million/i,        // Specific numbers
  /everyone|always|never|99%|most people/i,      // Bold claims
  /you need to|you have to|you should|you must/i,// Direct address
  /the (one|only|biggest|worst|best|real)/i,     // Superlatives
  /this (changed|is why|is how|is what)/i        // Promise statements
];

// Emotional trigger patterns
const EMOTIONAL_PATTERNS = [
  /nobody|secret|hidden|truth|discover|reveal|finally/i,  // Curiosity
  /miss|fail|wrong|mistake|never|always|must|need to/i,   // Fear/Urgency
  /want|wish|dream|imagine|could|would|desire/i,          // Desire
  /shocking|surprising|unexpected|crazy|wild|insane/i,    // Surprise
  /expert|study|research|proven|science|data|found/i,     // Authority
  /everyone|people|they|most|99%|\d+ million/i,           // Social proof
  /changed|transform|went from|before|after/i,            // Transformation
  /love|hate|angry|excited|scared|worried/i,              // Direct emotions
  /amazing|incredible|unbelievable|mind-blowing/i         // Enthusiasm
];

// Generic ending phrases
const GENERIC_PHRASES = [
  'hope you found this helpful', 'let me know in the comments',
  'don\'t forget to like and subscribe', 'hit that bell',
  'thanks for watching', 'see you in the next one'
];

export function detectNegativeSignals(transcript: string): NegativeSignal[] {
  const signals: NegativeSignal[] = [];
  const lowerTranscript = transcript.toLowerCase();
  const words = lowerTranscript.split(/\s+/);
  
  // Get first 150 characters for hook analysis (increased from 50)
  const first150Chars = transcript.slice(0, 150).toLowerCase();
  const first50Chars = transcript.slice(0, 50).toLowerCase();

  // ============================================
  // CHECK FOR STRONG HOOK FIRST
  // ============================================
  const hasStrongHook = STRONG_HOOK_PATTERNS.some(pattern => pattern.test(first150Chars));
  const foundWeakHooks = WEAK_HOOKS.filter(h => first50Chars.includes(h));

  // 1. Filler words (always check)
  const foundFillers = FILLER_WORDS.filter(f => lowerTranscript.includes(f));
  if (foundFillers.length >= 3) {  // Only penalize if 3+ filler words
    signals.push({
      id: 'filler_words',
      name: 'Filler Words Detected',
      description: 'Content contains multiple filler words that reduce engagement',
      detected: true,
      evidence: foundFillers.slice(0, 5),
      penalty: Math.min(foundFillers.length * 2, 10)  // Max 10 point penalty
    });
  }

  // 2. Weak hook - ONLY if no strong hook detected
  if (!hasStrongHook && foundWeakHooks.length > 0) {
    signals.push({
      id: 'weak_hook',
      name: 'Weak Opening Hook',
      description: 'Opening uses generic phrases instead of pattern interrupt',
      detected: true,
      evidence: foundWeakHooks,
      penalty: 12  // Reduced from 20
    });
  }

  // 3. No hook at all - ONLY if no strong hook AND no weak hook
  if (!hasStrongHook && foundWeakHooks.length === 0) {
    // Additional check: does it start with something at least somewhat engaging?
    const hasMinimalEngagement = 
      first150Chars.includes('!') || 
      first150Chars.includes('...') ||
      /^[A-Z][a-z]+ /.test(transcript);  // Starts with a proper word
    
    if (!hasMinimalEngagement) {
      signals.push({
        id: 'no_hook',
        name: 'No Clear Hook',
        description: 'First 3 seconds lack attention-grabbing element',
        detected: true,
        evidence: [first50Chars],
        penalty: 15  // Reduced from 25
      });
    }
  }

  // 4. Generic ending
  const last100Words = words.slice(-100).join(' ');
  const foundGeneric = GENERIC_PHRASES.filter(p => last100Words.includes(p));
  if (foundGeneric.length > 0) {
    signals.push({
      id: 'generic_cta',
      name: 'Generic Call-to-Action',
      description: 'Ending uses overused phrases',
      detected: true,
      evidence: foundGeneric,
      penalty: 3  // Reduced from 5
    });
  }

  // 5. Vague language (only if excessive)
  const vaguePhrases = ['something', 'stuff', 'things', 'some people', 'sometimes'];
  const vagueCount = vaguePhrases.reduce((count, phrase) => {
    return count + (lowerTranscript.match(new RegExp(`\\b${phrase}\\b`, 'g')) || []).length;
  }, 0);
  
  if (vagueCount > 5) {  // Increased threshold from 3
    signals.push({
      id: 'vague_language',
      name: 'Vague Language',
      description: 'Content lacks specific, concrete details',
      detected: true,
      evidence: [`${vagueCount} vague phrases detected`],
      penalty: 8  // Reduced from 10
    });
  }

  // 6. Too short (only for very short content)
  if (words.length < 30) {  // Reduced threshold from 50
    signals.push({
      id: 'too_short',
      name: 'Content Too Short',
      description: 'Not enough content to provide real value',
      detected: true,
      evidence: [`Only ${words.length} words`],
      penalty: 10  // Reduced from 15
    });
  }

  // 7. No emotional triggers - ONLY if truly emotionally flat
  const hasEmotionalTrigger = EMOTIONAL_PATTERNS.some(pattern => pattern.test(lowerTranscript));
  if (!hasEmotionalTrigger && words.length > 50) {  // Only check longer content
    signals.push({
      id: 'no_emotion',
      name: 'No Emotional Triggers',
      description: 'Content lacks emotional engagement',
      detected: true,
      evidence: ['No emotional trigger patterns found'],
      penalty: 5  // Reduced from 8
    });
  }

  return signals;
}

/**
 * Detect POSITIVE signals that should ADD to the score
 */
export function detectPositiveSignals(transcript: string): PositiveSignal[] {
  const signals: PositiveSignal[] = [];
  const lowerTranscript = transcript.toLowerCase();
  const first150Chars = transcript.slice(0, 150);

  // 1. Strong hook detected
  const hasStrongHook = STRONG_HOOK_PATTERNS.some(pattern => pattern.test(first150Chars));
  if (hasStrongHook) {
    signals.push({
      id: 'strong_hook',
      name: 'Strong Opening Hook',
      detected: true,
      evidence: [first150Chars.slice(0, 50)],
      bonus: 8
    });
  }

  // 2. Specific numbers/results
  if (/\d+%|\$[\d,]+|\d+ (days?|years?|months?|weeks?)|\d+x|\d+k/i.test(transcript)) {
    const matches = transcript.match(/\d+%|\$[\d,]+|\d+ (days?|years?|months?|weeks?)|\d+x|\d+k/gi) || [];
    signals.push({
      id: 'specific_data',
      name: 'Specific Data/Results',
      detected: true,
      evidence: matches.slice(0, 3),
      bonus: 6
    });
  }

  // 3. Transformation story
  if (/went from|before.*after|changed my|transform|used to.*now/i.test(lowerTranscript)) {
    signals.push({
      id: 'transformation',
      name: 'Transformation Story',
      detected: true,
      evidence: ['Transformation narrative detected'],
      bonus: 8
    });
  }

  // 4. Step-by-step structure
  if (/step \d|first.*second|here'?s how|exactly how|step by step/i.test(lowerTranscript)) {
    signals.push({
      id: 'structure',
      name: 'Clear Structure',
      detected: true,
      evidence: ['Structured format detected'],
      bonus: 5
    });
  }

  // 5. Curiosity gap
  if (/one thing|the answer|the secret|this is why|here'?s what|the reason/i.test(lowerTranscript)) {
    signals.push({
      id: 'curiosity',
      name: 'Curiosity Gap',
      detected: true,
      evidence: ['Curiosity trigger detected'],
      bonus: 6
    });
  }

  // 6. Authority/credibility
  if (/\d+ years?|expert|studied|research|proven|I've been/i.test(lowerTranscript)) {
    signals.push({
      id: 'authority',
      name: 'Authority/Credibility',
      detected: true,
      evidence: ['Authority signal detected'],
      bonus: 5
    });
  }

  // 7. Emotional resonance
  if (EMOTIONAL_PATTERNS.some(pattern => pattern.test(lowerTranscript))) {
    signals.push({
      id: 'emotional',
      name: 'Emotional Resonance',
      detected: true,
      evidence: ['Emotional triggers present'],
      bonus: 5
    });
  }

  return signals;
}

/**
 * Calculate total penalty from negative signals
 */
export function calculatePenalty(signals: NegativeSignal[]): number {
  const detected = signals.filter(s => s.detected);
  const totalPenalty = detected.reduce((sum, s) => sum + s.penalty, 0);
  return Math.min(totalPenalty, 25);  // Reduced cap from 50 to 25
}

/**
 * Calculate total bonus from positive signals
 */
export function calculateBonus(signals: PositiveSignal[]): number {
  const detected = signals.filter(s => s.detected);
  const totalBonus = detected.reduce((sum, s) => sum + s.bonus, 0);
  return Math.min(totalBonus, 15);  // Fix 1: Reduced cap from 20 to 15
}

/**
 * Apply both negative and positive signals to base score
 */
export function applySignals(baseScore: number, transcript: string): {
  adjustedScore: number;
  negativeSignals: NegativeSignal[];
  positiveSignals: PositiveSignal[];
  totalPenalty: number;
  totalBonus: number;
  netAdjustment: number;
} {
  const negativeSignals = detectNegativeSignals(transcript);
  const positiveSignals = detectPositiveSignals(transcript);
  
  const totalPenalty = calculatePenalty(negativeSignals);
  
  // Fix 2: Strengthen "No Hook" Detection
  // If severe negative signals present (no hook or weak hook), reduce bonus
  const hasSevereNegatives = negativeSignals.some(s => 
    (s.id === 'no_hook' || s.id === 'weak_hook') && s.detected
  );
  
  let totalBonus = calculateBonus(positiveSignals);
  
  // If weak/no hook detected, cap bonus at 5 max
  if (hasSevereNegatives) {
    totalBonus = Math.min(totalBonus, 5);
  }
  
  const netAdjustment = totalBonus - totalPenalty;
  
  let adjustedScore = Math.max(0, Math.min(100, baseScore + netAdjustment));

  // Fix 3: Tighten Score Ceiling
  // Apply soft ceiling - scores above 92 get compressed
  if (adjustedScore > 92) {
    adjustedScore = 92 + (adjustedScore - 92) * 0.3;
  }

  return {
    adjustedScore,
    negativeSignals,
    positiveSignals,
    totalPenalty,
    totalBonus,
    netAdjustment
  };
}

// Keep backward compatibility
export function applyNegativeSignals(baseScore: number, transcript: string) {
  const result = applySignals(baseScore, transcript);
  return {
    adjustedScore: result.adjustedScore,
    signals: result.negativeSignals,
    totalPenalty: result.totalPenalty - result.totalBonus  // Net penalty
  };
}

/**
 * Get summary of signals
 */
export function getSignalSummary(negativeSignals: NegativeSignal[], positiveSignals: PositiveSignal[]): string {
  const negDetected = negativeSignals.filter(s => s.detected);
  const posDetected = positiveSignals.filter(s => s.detected);
  
  const parts: string[] = [];
  
  if (posDetected.length > 0) {
    parts.push(`+${posDetected.length} positive (${posDetected.map(s => s.name).join(', ')})`);
  }
  
  if (negDetected.length > 0) {
    parts.push(`-${negDetected.length} negative (${negDetected.map(s => s.name).join(', ')})`);
  }
  
  return parts.length > 0 ? parts.join('; ') : 'No signals detected';
}

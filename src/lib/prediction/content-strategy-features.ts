/**
 * Content Strategy Feature Extraction (Phase 1)
 *
 * 7 text-based features that measure content STRATEGY signals
 * (not just content quality). These predict watch time, shares,
 * and completion rate — top TikTok algorithm factors.
 *
 * SHARED MODULE: imported by both extract-prediction-features.ts
 * and training/feature-extractor.ts to guarantee identical logic.
 *
 * All features are extractable from transcript text + caption alone.
 * No video file analysis needed.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ContentStrategyFeatures {
  retention_open_loop_count: number;
  share_relatability_score: number;
  share_utility_score: number;
  psych_curiosity_gap_score: number;
  psych_power_word_density: number;
  psych_direct_address_ratio: number;
  psych_social_proof_count: number;
}

// ============================================================================
// PATTERN LISTS
// ============================================================================

const OPEN_LOOP_PHRASES = [
  /here'?s why/i,
  /wait for it/i,
  /but first/i,
  /the answer is/i,
  /you won'?t believe/i,
  /what happen(ed|s) next/i,
  /stay (until|till|to) the end/i,
  /keep watching/i,
  /the (last|third|final) one/i,
  /but here'?s the thing/i,
  /at the end/i,
  /i'?ll (show|tell|reveal)/i,
  /the result (might|will|is going to)/i,
  /number \d+/i,
  /\bpart \d+\b/i,
];

const RELATABILITY_PHRASES = [
  /\bpov\b:?/i,
  /when you\b/i,
  /that feeling when/i,
  /tell me i'?m not the only one/i,
  /no because/i,
  /it'?s giving/i,
  /literally me/i,
  /you know when/i,
  /anyone else/i,
  /is it just me/i,
];

const FIRST_PERSON = /\b(i|me|my|mine|we|our|us)\b/gi;
const SECOND_PERSON = /\b(you|your|you'?re|yourself|yours)\b/gi;

const UTILITY_PHRASES = [
  /step \d+/i,
  /\b(first|second|third|fourth|fifth)\b,?\s/i,
  /how to\b/i,
  /here'?s how/i,
  /\btip\b:?/i,
  /\bhack\b:?/i,
  /\btrick\b:?/i,
  /save this/i,
  /you need to/i,
];

const IMPERATIVE_VERBS = /\b(do|make|try|use|start|stop|get|go|check|grab|take|watch|read|learn|build|create|add|remove|avoid)\b/gi;

const CURIOSITY_GAP_PHRASES = [
  /the real reason/i,
  /what nobody tells you/i,
  /what no one (talks|tells)/i,
  /stop doing/i,
  /\bis wrong\b/i,
  /the biggest mistake/i,
  /the only way/i,
  /\b\d+ things?\b/i,
  /in 20\d{2}\b/i,
  /you'?re doing (it|this) wrong/i,
  /most people don'?t know/i,
  /the truth about/i,
  /the secret (to|of|behind)/i,
  /here'?s what/i,
  /nobody (talks|knows|tells)/i,
  /this (changed|will change)/i,
];

const POWER_WORDS: Record<string, string[]> = {
  urgency: ['now', 'immediately', 'today', 'hurry', 'limited', 'before', 'deadline', 'asap', 'quickly', 'fast'],
  exclusivity: ['secret', 'hidden', 'insider', 'underground', 'exclusive', 'unknown', 'private'],
  fear: ['mistake', 'warning', 'danger', 'avoid', 'never', 'worst', 'fail', 'lose', 'risk', 'scam', 'trap'],
  desire: ['free', 'easy', 'proven', 'guaranteed', 'simple', 'ultimate', 'best', 'perfect', 'instant'],
  curiosity: ['strange', 'bizarre', 'shocking', 'surprising', 'unexpected', 'weird', 'insane', 'crazy', 'unbelievable', 'wild'],
};

const ALL_POWER_WORDS = Object.values(POWER_WORDS).flat();

const SOCIAL_PROOF_PATTERNS = [
  /\d[\d,]*\+?\s*(people|users|students|clients|followers|subscribers|customers|viewers)/i,
  /\b(everyone|most people|millions)\b/i,
  /\bresearch shows\b/i,
  /\bstudies (show|prove|say)\b/i,
  /\$[\d,]+(\.\d+)?\s*(k|m|million|billion)?/i,
  /as a (doctor|lawyer|engineer|teacher|coach|trainer|expert|professional|consultant|therapist|nurse|ceo|founder)/i,
  /after \d+\s*(years?|months?|decades?)/i,
  /i (went|grew|made|earned|gained|lost|built|scaled) from/i,
  /\d+%\s*(of|increase|decrease|growth|more|less)/i,
  /my (students|clients|team|audience|customers)/i,
];

// ============================================================================
// MAIN EXTRACTION
// ============================================================================

/**
 * Extract 7 content strategy features from transcript + caption text.
 * Returns all numeric values (never null) — 0 if no signal detected.
 *
 * Called by both prediction and training feature extractors.
 */
export function extractContentStrategyFeatures(
  transcript: string | null,
  caption: string | null
): ContentStrategyFeatures {
  const text = transcript || caption || '';
  const combined = [transcript, caption].filter(Boolean).join(' ');

  if (!text) {
    return {
      retention_open_loop_count: 0,
      share_relatability_score: 0,
      share_utility_score: 0,
      psych_curiosity_gap_score: 0,
      psych_power_word_density: 0,
      psych_direct_address_ratio: 0,
      psych_social_proof_count: 0,
    };
  }

  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const lower = text.toLowerCase();

  return {
    retention_open_loop_count: computeOpenLoopCount(text, words),
    share_relatability_score: computeRelatabilityScore(text, combined, wordCount),
    share_utility_score: computeUtilityScore(text, combined, wordCount),
    psych_curiosity_gap_score: computeCuriosityGapScore(text, wordCount),
    psych_power_word_density: computePowerWordDensity(lower, wordCount),
    psych_direct_address_ratio: computeDirectAddressRatio(text, wordCount),
    psych_social_proof_count: computeSocialProofCount(combined),
  };
}

// ============================================================================
// INDIVIDUAL FEATURE COMPUTATIONS
// ============================================================================

/**
 * B4: Count open loops / curiosity gaps in the transcript.
 * Includes phrase patterns + questions without immediate answers.
 * Output: integer count.
 */
function computeOpenLoopCount(text: string, words: string[]): number {
  let count = 0;

  // Count phrase-based open loops
  for (const pattern of OPEN_LOOP_PHRASES) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) count += matches.length;
  }

  // Count questions without immediate answers (question mark not followed
  // by an answer-like sentence within the next sentence)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  for (let i = 0; i < sentences.length; i++) {
    // Check if original text has a ? after this sentence
    const sentenceEnd = text.indexOf(sentences[i]) + sentences[i].length;
    const nextChar = text.charAt(sentenceEnd);
    if (nextChar === '?') {
      count++;
    }
  }

  // Detect numbered lists that haven't completed yet
  // e.g., "first..." without "second" or "number 1" without reaching "number 3"
  const hasFirst = /\b(first|number 1|#1)\b/i.test(text);
  const hasLast = /\b(finally|lastly|last one|last but)\b/i.test(text);
  if (hasFirst && !hasLast && sentences.length > 2) {
    count++;
  }

  return count;
}

/**
 * C1: Measure how relatable/personal the content is.
 * Signals: first/second person pronouns, POV markers, relatable phrases.
 * Output: 0-100 score based on signal density per 100 words.
 */
function computeRelatabilityScore(text: string, combined: string, wordCount: number): number {
  if (wordCount === 0) return 0;

  let signals = 0;

  // Count first person pronouns
  const firstPerson = text.match(FIRST_PERSON);
  signals += firstPerson ? firstPerson.length : 0;

  // Count second person pronouns
  const secondPerson = text.match(SECOND_PERSON);
  signals += secondPerson ? secondPerson.length : 0;

  // Count relatability phrases (weighted 3x each)
  for (const pattern of RELATABILITY_PHRASES) {
    const matches = combined.match(new RegExp(pattern.source, 'gi'));
    if (matches) signals += matches.length * 3;
  }

  // Density per 100 words, clamped to 0-100
  const density = (signals / wordCount) * 100;
  return Math.min(100, Math.round(density * 10) / 10);
}

/**
 * C2: Measure practical utility / actionable value.
 * Signals: numbered steps, how-to patterns, imperative verbs.
 * Output: 0-100 score based on signal count and density.
 */
function computeUtilityScore(text: string, combined: string, wordCount: number): number {
  if (wordCount === 0) return 0;

  let signals = 0;

  // Utility phrases (weighted 3x each)
  for (const pattern of UTILITY_PHRASES) {
    const matches = combined.match(new RegExp(pattern.source, 'gi'));
    if (matches) signals += matches.length * 3;
  }

  // Imperative verbs at start of sentences (weighted 1x each)
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase();
    if (firstWord && IMPERATIVE_VERBS.source.includes(firstWord)) {
      signals++;
    }
    // Reset lastIndex since we use the global regex elsewhere
  }

  // General imperative verb count (0.5x each)
  const imperatives = text.match(IMPERATIVE_VERBS);
  if (imperatives) signals += imperatives.length * 0.5;

  // Density per 100 words, clamped to 0-100
  const density = (signals / wordCount) * 100;
  return Math.min(100, Math.round(density * 10) / 10);
}

/**
 * F1: Measure curiosity-inducing language in the hook (first 20% of transcript).
 * Signals: incomplete information, contrarian framing, superlatives, specificity.
 * Output: 0-100 score, weighted toward first 20%.
 */
function computeCuriosityGapScore(text: string, wordCount: number): number {
  if (wordCount === 0) return 0;

  const words = text.split(/\s+/);
  const hookEndIndex = Math.ceil(words.length * 0.2);
  const hookText = words.slice(0, hookEndIndex).join(' ');
  const restText = words.slice(hookEndIndex).join(' ');

  let hookSignals = 0;
  let restSignals = 0;

  for (const pattern of CURIOSITY_GAP_PHRASES) {
    const hookMatches = hookText.match(new RegExp(pattern.source, 'gi'));
    if (hookMatches) hookSignals += hookMatches.length;

    const restMatches = restText.match(new RegExp(pattern.source, 'gi'));
    if (restMatches) restSignals += restMatches.length;
  }

  // Count unanswered questions in hook
  const hookQuestions = (hookText.match(/\?/g) || []).length;
  hookSignals += hookQuestions;

  // Weighted score: hook signals worth 3x rest signals
  const totalSignals = (hookSignals * 3) + restSignals;
  const density = (totalSignals / wordCount) * 100;

  return Math.min(100, Math.round(density * 20) / 10);
}

/**
 * F2: Count high-arousal emotional trigger words per 100 words.
 * Categories: urgency, exclusivity, fear/risk, desire, curiosity.
 * Output: density per 100 words (0-20 typical range).
 */
function computePowerWordDensity(lower: string, wordCount: number): number {
  if (wordCount === 0) return 0;

  let count = 0;
  const words = lower.split(/\s+/);

  for (const word of words) {
    // Strip punctuation for matching
    const clean = word.replace(/[^a-z]/g, '');
    if (ALL_POWER_WORDS.includes(clean)) {
      count++;
    }
  }

  // Density per 100 words
  const density = (count / wordCount) * 100;
  return Math.round(density * 100) / 100;
}

/**
 * F3: Ratio of second-person pronouns to total words.
 * Direct address creates parasocial connection.
 * Output: 0.0-1.0 ratio.
 */
function computeDirectAddressRatio(text: string, wordCount: number): number {
  if (wordCount === 0) return 0;

  const matches = text.match(SECOND_PERSON);
  const youCount = matches ? matches.length : 0;

  const ratio = youCount / wordCount;
  return Math.round(ratio * 10000) / 10000;
}

/**
 * F4: Count social proof signals.
 * Signals: numbers/statistics, authority claims, results/outcomes.
 * Output: integer count.
 */
function computeSocialProofCount(text: string): number {
  let count = 0;

  for (const pattern of SOCIAL_PROOF_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) count += matches.length;
  }

  return count;
}

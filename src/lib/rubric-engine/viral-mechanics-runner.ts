/**
 * Pack 3: Viral Mechanics Runner
 *
 * Rule-based analysis that synthesizes signals from Pack 1, Pack 2, Pack V,
 * and other component outputs to explain WHY a video should perform well.
 *
 * NO LLM CALLS - pure rule-based logic for minimal latency.
 */

import {
  Pack3Input,
  ViralMechanicsResult,
  ViralMechanic,
  VIRAL_MECHANICS,
  ComponentResultSummary,
} from './viral-mechanics-types';

// ─────────────────────────────────────────────────────────────────────────────
// Main Runner
// ─────────────────────────────────────────────────────────────────────────────

export interface ViralMechanicsExecutionResult {
  success: boolean;
  result: ViralMechanicsResult | null;
  error?: string;
}

/**
 * Run Pack 3: Viral Mechanics analysis.
 * Synthesizes all available signals to explain viral potential.
 */
export function runViralMechanics(input: Pack3Input): ViralMechanicsExecutionResult {
  const startTime = Date.now();

  try {
    const mechanics: ViralMechanic[] = [];
    const missingSignals: string[] = [];

    // Track what signals we have
    const hasPack1 = !!input.pack1;
    const hasPack2 = !!input.pack2;
    const hasPackV = !!input.packV;
    const hasTranscript = input.hasTranscript && input.transcriptLength >= 10;

    // Get component results by ID for easy lookup
    const componentMap = new Map<string, ComponentResultSummary>();
    for (const cr of input.componentResults) {
      if (cr.success) {
        componentMap.set(cr.componentId, cr);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Detect Viral Mechanics from available signals
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Visual Hook (from Pack V or hook-scorer)
    const visualHookMechanic = detectVisualHook(input.packV, componentMap);
    if (visualHookMechanic) mechanics.push(visualHookMechanic);

    // 2. Curiosity Gap (from Pack 1 hook analysis or hook-scorer)
    const curiosityGapMechanic = detectCuriosityGap(input.pack1, componentMap, hasTranscript);
    if (curiosityGapMechanic) mechanics.push(curiosityGapMechanic);

    // 3. Style-Platform Fit (from 24-styles + niche)
    const styleFitMechanic = detectStyleFit(componentMap, input.detectedStyle, input.niche);
    if (styleFitMechanic) mechanics.push(styleFitMechanic);

    // 4. Optimal Pacing (from Pack 1 pacing or Pack V)
    const pacingMechanic = detectOptimalPacing(input.pack1, input.packV);
    if (pacingMechanic) mechanics.push(pacingMechanic);

    // 5. Audio-Visual Sync (from audio-analyzer or Pack V)
    const audioSyncMechanic = detectAudioSync(input.packV, componentMap);
    if (audioSyncMechanic) mechanics.push(audioSyncMechanic);

    // 6. Trend Alignment (from trend-timing or historical-analyzer)
    const trendMechanic = detectTrendAlignment(componentMap);
    if (trendMechanic) mechanics.push(trendMechanic);

    // 7. Pattern Interrupt (from Pack V visual complexity or Pack 1)
    const patternInterruptMechanic = detectPatternInterrupt(input.packV, input.pack1);
    if (patternInterruptMechanic) mechanics.push(patternInterruptMechanic);

    // 8. Emotional Trigger (from Pack 1 attributes or 9-attributes)
    const emotionalMechanic = detectEmotionalTrigger(input.pack1, componentMap);
    if (emotionalMechanic) mechanics.push(emotionalMechanic);

    // 9. Posting Time Advantage (from posting-optimizer)
    const timingMechanic = detectTimingAdvantage(componentMap);
    if (timingMechanic) mechanics.push(timingMechanic);

    // ─────────────────────────────────────────────────────────────────────────
    // Track missing signals
    // ─────────────────────────────────────────────────────────────────────────

    if (!hasPack1) missingSignals.push('pack1 (unified grading)');
    if (!hasPack2) missingSignals.push('pack2 (editing coach)');
    if (!hasPackV) missingSignals.push('packV (visual rubric)');
    if (!hasTranscript) missingSignals.push('transcript');
    if (!componentMap.has('hook-scorer')) missingSignals.push('hook-scorer');
    if (!componentMap.has('24-styles')) missingSignals.push('24-styles');

    // ─────────────────────────────────────────────────────────────────────────
    // Sort by strength and take top 3
    // ─────────────────────────────────────────────────────────────────────────

    mechanics.sort((a, b) => b.strength - a.strength);
    const topMechanics = mechanics.slice(0, 3);

    // ─────────────────────────────────────────────────────────────────────────
    // Calculate overall confidence
    // ─────────────────────────────────────────────────────────────────────────

    const signalCount = [hasPack1, hasPack2, hasPackV, hasTranscript].filter(Boolean).length;
    const componentCount = componentMap.size;
    const baseConfidence = Math.min(0.4 + (signalCount * 0.1) + (componentCount * 0.02), 0.95);
    const mechanicBoost = topMechanics.length > 0
      ? (topMechanics.reduce((sum, m) => sum + m.strength, 0) / (topMechanics.length * 100)) * 0.2
      : 0;
    const confidence = Math.min(baseConfidence + mechanicBoost, 0.95);

    // ─────────────────────────────────────────────────────────────────────────
    // Generate summary
    // ─────────────────────────────────────────────────────────────────────────

    const summary = generateSummary(topMechanics, missingSignals, confidence);

    const latencyMs = Date.now() - startTime;

    const result: ViralMechanicsResult = {
      pack: '3',
      mechanics: topMechanics,
      summary,
      confidence: Math.round(confidence * 100) / 100,
      limited_signal_mode: missingSignals.length > 2,
      missing_signals: missingSignals.length > 0 ? missingSignals : undefined,
      _meta: {
        source: 'real',
        provider: 'rule-based',
        latency_ms: latencyMs,
      },
    };

    return { success: true, result };
  } catch (error: any) {
    return {
      success: false,
      result: null,
      error: error.message || 'Unknown error in viral mechanics analysis',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mechanic Detectors
// ─────────────────────────────────────────────────────────────────────────────

function detectVisualHook(
  packV: any | null,
  componentMap: Map<string, ComponentResultSummary>
): ViralMechanic | null {
  const evidence: string[] = [];
  const signals: string[] = [];
  let strength = 0;

  // Check Pack V visual hook score (named field, not array)
  if (packV?.visual_hook_score) {
    const hookScore = packV.visual_hook_score.score;
    if (hookScore >= 7) {
      strength = Math.max(strength, hookScore * 10);
      evidence.push(`Strong visual hook detected (score: ${hookScore}/10)`);
      signals.push('packV.visual_hook_score');
    }
  }

  // Check Pack V overall score
  if (packV?.overall_visual_score && packV.overall_visual_score >= 65) {
    strength = Math.max(strength, packV.overall_visual_score);
    evidence.push(`High overall visual quality (${packV.overall_visual_score}/100)`);
    signals.push('packV.overall_visual_score');
  }

  // Check hook-scorer component
  const hookScorer = componentMap.get('hook-scorer');
  if (hookScorer?.features?.hook_type) {
    strength = Math.max(strength, (hookScorer.prediction || 50));
    evidence.push(`Hook type: ${hookScorer.features.hook_type}`);
    signals.push('hook-scorer');
  }

  if (strength >= 50) {
    return {
      name: VIRAL_MECHANICS.VISUAL_HOOK,
      strength: Math.round(strength),
      evidence,
      signals_used: signals,
    };
  }
  return null;
}

function detectCuriosityGap(
  pack1: any | null,
  componentMap: Map<string, ComponentResultSummary>,
  hasTranscript: boolean
): ViralMechanic | null {
  const evidence: string[] = [];
  const signals: string[] = [];
  let strength = 0;

  // Check Pack 1 hook analysis
  if (pack1?.hook?.type) {
    const curiosityTypes = ['question', 'mystery', 'tease', 'surprising_fact', 'challenge'];
    if (curiosityTypes.some(t => pack1.hook.type.toLowerCase().includes(t))) {
      strength = Math.max(strength, (pack1.hook.clarity_score || 5) * 10);
      evidence.push(`Hook creates curiosity: "${pack1.hook.type}"`);
      signals.push('pack1.hook');
    }
  }

  // Check hook-scorer
  const hookScorer = componentMap.get('hook-scorer');
  if (hookScorer?.features?.curiosity_score) {
    strength = Math.max(strength, hookScorer.features.curiosity_score);
    evidence.push(`Curiosity score: ${hookScorer.features.curiosity_score}/100`);
    signals.push('hook-scorer.curiosity');
  }

  // Check 7-legos for open loops
  const legosComponent = componentMap.get('7-legos');
  if (legosComponent?.features?.open_loop) {
    strength = Math.max(strength, 70);
    evidence.push('Open loop pattern detected');
    signals.push('7-legos.open_loop');
  }

  if (!hasTranscript && strength < 50) {
    // Can't reliably detect curiosity gap without transcript
    return null;
  }

  if (strength >= 50) {
    return {
      name: VIRAL_MECHANICS.CURIOSITY_GAP,
      strength: Math.round(strength),
      evidence,
      signals_used: signals,
    };
  }
  return null;
}

function detectStyleFit(
  componentMap: Map<string, ComponentResultSummary>,
  detectedStyle?: string,
  niche?: string
): ViralMechanic | null {
  const evidence: string[] = [];
  const signals: string[] = [];
  let strength = 0;

  // Check 24-styles component
  const stylesComponent = componentMap.get('24-styles');
  if (stylesComponent?.features?.detected_style) {
    const style = stylesComponent.features.detected_style;
    const confidence = stylesComponent.features.style_confidence || 0.5;
    strength = Math.max(strength, confidence * 80);
    evidence.push(`Detected style: ${style} (confidence: ${Math.round(confidence * 100)}%)`);
    signals.push('24-styles');

    // Bonus for high-performing styles
    const viralStyles = ['meme_edit', 'storytime', 'tutorial', 'transformation', 'duet_reaction'];
    if (viralStyles.includes(style.toLowerCase())) {
      strength = Math.min(strength + 15, 95);
      evidence.push(`Style "${style}" has high viral potential on TikTok`);
    }
  } else if (detectedStyle) {
    strength = 50;
    evidence.push(`Style: ${detectedStyle}`);
    signals.push('input.detectedStyle');
  }

  // Check niche fit
  if (niche) {
    evidence.push(`Niche: ${niche}`);
    signals.push('input.niche');
    if (!stylesComponent) strength = Math.max(strength, 40);
  }

  if (strength >= 40) {
    return {
      name: VIRAL_MECHANICS.STYLE_FIT,
      strength: Math.round(strength),
      evidence,
      signals_used: signals,
    };
  }
  return null;
}

function detectOptimalPacing(pack1: any | null, packV: any | null): ViralMechanic | null {
  const evidence: string[] = [];
  const signals: string[] = [];
  let strength = 0;

  // Check Pack 1 pacing score
  if (pack1?.pacing?.score && pack1.pacing.score >= 7) {
    strength = Math.max(strength, pack1.pacing.score * 10);
    evidence.push(`Good pacing (score: ${pack1.pacing.score}/10)`);
    if (pack1.pacing.evidence) evidence.push(pack1.pacing.evidence);
    signals.push('pack1.pacing');
  }

  // Check Pack V for visual pacing (named field, not array)
  if (packV?.pacing_score) {
    const pacingScore = packV.pacing_score.score;
    if (pacingScore >= 7) {
      strength = Math.max(strength, pacingScore * 10);
      evidence.push(`Visual pacing score: ${pacingScore}/10`);
      signals.push('packV.pacing_score');
    }
  }

  if (strength >= 60) {
    return {
      name: VIRAL_MECHANICS.PACING_OPTIMAL,
      strength: Math.round(strength),
      evidence,
      signals_used: signals,
    };
  }
  return null;
}

function detectAudioSync(
  packV: any | null,
  componentMap: Map<string, ComponentResultSummary>
): ViralMechanic | null {
  const evidence: string[] = [];
  const signals: string[] = [];
  let strength = 0;

  // Check audio-analyzer component
  const audioAnalyzer = componentMap.get('audio-analyzer');
  if (audioAnalyzer?.features) {
    const features = audioAnalyzer.features;
    if (features.beat_aligned || features.has_trending_sound) {
      strength = Math.max(strength, 70);
      if (features.beat_aligned) evidence.push('Beat-aligned cuts detected');
      if (features.has_trending_sound) evidence.push('Uses trending sound');
      signals.push('audio-analyzer');
    }
    if (features.audio_quality_score) {
      strength = Math.max(strength, features.audio_quality_score);
      evidence.push(`Audio quality: ${features.audio_quality_score}/100`);
    }
  }

  // Check Pack V for audio-visual sync
  if (packV?.signal_coverage?.signals_used) {
    const audioSignal = packV.signal_coverage.signals_used.find((s: any) =>
      s.field === 'has_music' || s.field === 'audio_present'
    );
    if (audioSignal?.value) {
      strength = Math.max(strength, 50);
      evidence.push('Audio track present');
      signals.push('packV.audio');
    }
  }

  if (strength >= 50) {
    return {
      name: VIRAL_MECHANICS.AUDIO_SYNC,
      strength: Math.round(strength),
      evidence,
      signals_used: signals,
    };
  }
  return null;
}

function detectTrendAlignment(
  componentMap: Map<string, ComponentResultSummary>
): ViralMechanic | null {
  // PM-003 fix: Removed references to disabled/nonexistent components:
  // - virality-matrix (DISABLED Layer 3 Prompt 1)
  // - historical-analyzer (never existed in registry)
  // - trend-timing (disabled, empty historical path)
  // This detector now returns null — no active trend data sources exist.
  // When trend infrastructure is operational, wire real trend signals here.
  return null;
}

function detectPatternInterrupt(packV: any | null, pack1: any | null): ViralMechanic | null {
  const evidence: string[] = [];
  const signals: string[] = [];
  let strength = 0;

  // Check Pack V for pattern interrupts (named field, not array)
  if (packV?.pattern_interrupts_score) {
    const noveltyScore = packV.pattern_interrupts_score.score;
    if (noveltyScore >= 7) {
      strength = Math.max(strength, noveltyScore * 10);
      evidence.push(`High visual novelty (score: ${noveltyScore}/10)`);
      signals.push('packV.pattern_interrupts_score');
    }
  }

  // Check Pack 1 novelty
  if (pack1?.novelty?.score && pack1.novelty.score >= 7) {
    strength = Math.max(strength, pack1.novelty.score * 10);
    evidence.push(`Content novelty score: ${pack1.novelty.score}/10`);
    if (pack1.novelty.evidence) evidence.push(pack1.novelty.evidence);
    signals.push('pack1.novelty');
  }

  if (strength >= 60) {
    return {
      name: VIRAL_MECHANICS.PATTERN_INTERRUPT,
      strength: Math.round(strength),
      evidence,
      signals_used: signals,
    };
  }
  return null;
}

function detectEmotionalTrigger(
  pack1: any | null,
  componentMap: Map<string, ComponentResultSummary>
): ViralMechanic | null {
  const evidence: string[] = [];
  const signals: string[] = [];
  let strength = 0;

  // Check Pack 1 attribute scores for emotional attributes
  if (pack1?.attribute_scores) {
    const emotionalAttrs = ['emotional_journey', 'tam_resonance', 'shareability'];
    for (const attr of pack1.attribute_scores) {
      if (emotionalAttrs.some(ea => attr.attribute?.toLowerCase().includes(ea))) {
        if (attr.score >= 7) {
          strength = Math.max(strength, attr.score * 10);
          evidence.push(`${attr.attribute}: ${attr.score}/10`);
          signals.push(`pack1.${attr.attribute}`);
        }
      }
    }
  }

  // Check 9-attributes component
  const nineAttrs = componentMap.get('9-attributes');
  if (nineAttrs?.features?.emotional_score) {
    strength = Math.max(strength, nineAttrs.features.emotional_score);
    evidence.push(`Emotional resonance: ${nineAttrs.features.emotional_score}/100`);
    signals.push('9-attributes');
  }

  if (strength >= 60) {
    return {
      name: VIRAL_MECHANICS.EMOTIONAL_TRIGGER,
      strength: Math.round(strength),
      evidence,
      signals_used: signals,
    };
  }
  return null;
}

function detectTimingAdvantage(
  _componentMap: Map<string, ComponentResultSummary>
): ViralMechanic | null {
  // PM-003 fix: Removed reference to posting-optimizer (never existed in registry).
  // No timing data sources currently available. Returns null.
  // When posting time optimization is implemented, wire real data here.
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Generator
// ─────────────────────────────────────────────────────────────────────────────

function generateSummary(
  mechanics: ViralMechanic[],
  missingSignals: string[],
  confidence: number
): string {
  if (mechanics.length === 0) {
    return 'Insufficient signals to determine viral mechanics. Consider providing more content context.';
  }

  const topMechanic = mechanics[0];
  const mechanicNames = mechanics.map(m => m.name).join(', ');

  let summary = `This content shows potential through: ${mechanicNames}. `;

  if (topMechanic.strength >= 80) {
    summary += `Strong ${topMechanic.name.toLowerCase()} detected. `;
  } else if (topMechanic.strength >= 60) {
    summary += `Moderate ${topMechanic.name.toLowerCase()} present. `;
  }

  if (missingSignals.length > 2) {
    summary += `Analysis limited by missing signals (${missingSignals.length} unavailable). `;
  }

  if (confidence >= 0.7) {
    summary += 'High confidence in this assessment.';
  } else if (confidence >= 0.5) {
    summary += 'Moderate confidence - more signals would improve accuracy.';
  } else {
    summary += 'Low confidence due to limited signal availability.';
  }

  return summary.slice(0, 500); // Max 500 chars
}

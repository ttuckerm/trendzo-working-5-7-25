/**
 * Component 17: Hook Strength Scorer — Multi-Modal 5-Channel Analyzer
 *
 * Analyzes the first 3 seconds of content across 5 signal channels:
 *   1. Text   — regex pattern matching against 10-type hook taxonomy
 *   2. Audio  — hookLoudness, hookPitchMean, hookSilenceRatio from prosodic analyzer
 *   3. Visual — hook_scene_changes from FFmpeg canonical analyzer
 *   4. Pace   — hookWpm, wpmAcceleration from speaking rate analyzer
 *   5. Tone   — musicRatio, energyLevel, pitchContourSlope
 *
 * Hook strength is 45% of the Quality Gate weight — highest leverage component.
 *
 * v3 REWRITE: Replaced text-only regex (1.7pt variance) with 5-channel multi-modal
 * fusion. Deterministic, no LLM calls. Uses 10-type taxonomy from system-registry.ts.
 */

import {
  HOOK_TYPES,
  HOOK_CLUSTERS,
  type HookType,
} from '@/lib/prediction/system-registry';

// ─── Input Interface ──────────────────────────────────────────────────────────

export interface HookInput {
  // Text channel (required — fallback to transcript first 8 words)
  transcript?: string;
  whisperSegments?: Array<{ start: number; end: number; text: string }>;

  // Audio channel (optional — from audio-analyzer component results)
  audioHook?: {
    hookLoudness: number;      // Ratio >1.0 = hook louder than rest
    hookPitchMean: number;     // Ratio >1.0 = hook higher pitch than rest
    hookSilenceRatio: number;  // 0-1, lower = more speech in hook
  };

  // Visual channel (optional — from ffmpeg canonical analyzer)
  visualHook?: {
    hookSceneChanges: number;  // Number of cuts in first 3 seconds
  };

  // Pace channel (optional — from speaking rate analyzer)
  paceHook?: {
    hookWpm: number;           // Ratio >1.0 = faster hook delivery
    wpmAcceleration: number;   // Positive = speeding up
  };

  // Tone channel (optional — from audio classifier + prosodic)
  tone?: {
    musicRatio: number;        // 0-1, presence of music bed
    energyLevel: string;       // 'high' | 'medium' | 'low'
    pitchContourSlope: number; // Positive = rising energy
  };
}

// ─── Result Interface ─────────────────────────────────────────────────────────

export interface HookScorerResult {
  success: boolean;
  hookType: HookType | 'weak' | null;
  hookCluster: string;         // Psychological cluster from HOOK_CLUSTERS
  hookScore: number;           // 0-100 fused multi-modal score
  hookConfidence: number;      // 0-1
  hookText: string;
  insights: string[];
  error?: string;
  // Channel sub-scores (for transparency and training features)
  channels: {
    text:   { score: number; available: boolean; hookType: HookType | 'weak'; patterns: string[] };
    audio:  { score: number; available: boolean; hookLoudness?: number; hookPitch?: number };
    visual: { score: number; available: boolean; hookSceneChanges?: number };
    pace:   { score: number; available: boolean; hookWpm?: number };
    tone:   { score: number; available: boolean; musicPresent?: boolean; energyLevel?: string };
  };
  channelsUsed: number;        // How many of 5 channels had data
}

// ─── Channel Weights ──────────────────────────────────────────────────────────

const CHANNEL_WEIGHTS = {
  text:   0.40,  // Always available, primary signal
  audio:  0.20,  // How it SOUNDS in first 3s
  visual: 0.15,  // How it LOOKS in first 3s
  pace:   0.15,  // Delivery speed dynamics
  tone:   0.10,  // Production quality / energy
};

// ─── Hook Type Patterns (10-type taxonomy) ────────────────────────────────────

interface HookPattern {
  type: HookType;
  patterns: RegExp[];
  maxScore: number;
  scoreFn: (text: string) => number;
}

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

// ─── Cluster Lookup ───────────────────────────────────────────────────────────

function getClusterForType(hookType: HookType | 'weak'): string {
  if (hookType === 'weak') return 'none';
  for (const [clusterKey, cluster] of Object.entries(HOOK_CLUSTERS)) {
    if ((cluster.types as readonly string[]).includes(hookType)) {
      return cluster.label;
    }
  }
  return 'unknown';
}

// ─── Text Channel Scoring ─────────────────────────────────────────────────────

const HOOK_PATTERNS: HookPattern[] = [
  // Curiosity Trigger cluster
  {
    type: 'question',
    patterns: [
      /^(what|how|why|when|where|who|which|do you|have you|did you|can you|would you|should you|are you|is it|will you)/i,
      /\?$/,
      /(ever wonder|want to know|know what|know how|guess what)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/\?$/.test(text)) s += 30;
      if (/^(what|how|why)/i.test(text)) s += 25;
      else if (/^(when|where|who|which)/i.test(text)) s += 18;
      if (/(do you|have you|did you|can you|would you|should you|are you)/i.test(text)) s += 20;
      if (/(ever wonder|want to know|know what|know how|guess what)/i.test(text)) s += 25;
      return Math.min(100, s);
    },
  },
  {
    type: 'list_preview',
    patterns: [
      /^(here are|here's|these are|top \d+|\d+ (things|ways|tips|reasons|mistakes|secrets|steps|hacks|signs|rules))/i,
      /(number one|first thing|let's start with)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/^(here are|here's|these are)/i.test(text)) s += 30;
      if (/^top \d+/i.test(text)) s += 35;
      if (/\d+ (things|ways|tips|reasons|mistakes|secrets|steps|hacks|signs|rules)/i.test(text)) s += 35;
      if (/(number one|first thing|let's start with)/i.test(text)) s += 20;
      return Math.min(100, s);
    },
  },

  // Cognitive Challenge cluster
  {
    type: 'contrarian',
    patterns: [
      /(nobody tells you|they don't want you to know|secret|truth is|unpopular opinion)/i,
      /(you've been lied to|everything you know is wrong|stop doing|you're doing it wrong)/i,
      /(hot take|controversial|actually|the real reason)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/(nobody tells you|they don't want you to know|you've been lied to|everything you know is wrong)/i.test(text)) s += 40;
      if (/(secret|truth is|unpopular opinion|hot take)/i.test(text)) s += 30;
      if (/(stop doing|you're doing it wrong|controversial)/i.test(text)) s += 25;
      if (/(actually|the real reason)/i.test(text)) s += 15;
      return Math.min(100, s);
    },
  },
  {
    type: 'myth_bust',
    patterns: [
      /(myth|debunk|not true|wrong about|misconception|fake|lie|doesn't actually)/i,
      /(people think|everyone thinks|you think|most people believe)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/(myth|debunk|misconception)/i.test(text)) s += 35;
      if (/(not true|wrong about|fake|lie|doesn't actually)/i.test(text)) s += 30;
      if (/(people think|everyone thinks|you think|most people believe)/i.test(text)) s += 25;
      return Math.min(100, s);
    },
  },

  // Credibility Signal cluster
  {
    type: 'statistic',
    patterns: [
      /(\d+%|\d+ percent)/i,
      /(\d+x|\d+ times)/i,
      /(\$[\d,]+|\d+ dollars)/i,
      /(\d+ out of \d+)/i,
      /(million|billion|trillion)/i,
      /(doubled|tripled|increased|grew by)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/\d+%|\d+ percent/i.test(text)) s += 35;
      if (/\$[\d,]+|\d+ dollars/i.test(text)) s += 35;
      if (/\d+x|\d+ times/i.test(text)) s += 30;
      if (/\d+ out of \d+/i.test(text)) s += 30;
      if (/(million|billion|trillion)/i.test(text)) s += 25;
      if (/(doubled|tripled|increased|grew by)/i.test(text)) s += 15;
      return Math.min(100, s);
    },
  },
  {
    type: 'authority',
    patterns: [
      /(as a|i'm a|i am a|years of experience|\d+ years|my experience|expert|professional|certified|degree|phd|doctor|scientist)/i,
      /(study shows|research shows|according to|scientists say|data shows)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/(as a|i'm a|i am a).{1,30}(expert|professional|certified|doctor|scientist|coach|trainer)/i.test(text)) s += 40;
      if (/\d+ years/i.test(text)) s += 25;
      if (/(study shows|research shows|according to|scientists say|data shows)/i.test(text)) s += 35;
      if (/(expert|professional|certified|degree|phd)/i.test(text)) s += 20;
      return Math.min(100, s);
    },
  },
  {
    type: 'result_preview',
    patterns: [
      /(i went from|i made|i earned|i lost|i gained|the result|here's what happened|before and after)/i,
      /(in just|in only|within \d+|in \d+ (days|weeks|months))/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/(i went from|before and after)/i.test(text)) s += 35;
      if (/(i made|i earned|i lost|i gained)/i.test(text)) s += 30;
      if (/(the result|here's what happened)/i.test(text)) s += 25;
      if (/(in just|in only|within \d+|in \d+ (days|weeks|months))/i.test(text)) s += 25;
      return Math.min(100, s);
    },
  },

  // Emotional Connection cluster
  {
    type: 'personal_story',
    patterns: [
      /^(so |okay so |alright so )/i,
      /(let me tell you|story time|here's what happened|this happened)/i,
      /(i remember when|one time|last week|yesterday|today i)/i,
      /(imagine|picture this|close your eyes)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/(let me tell you|story time|here's what happened|this happened)/i.test(text)) s += 35;
      if (/(i remember when|one time|last week|yesterday|today i)/i.test(text)) s += 30;
      if (/^(so |okay so |alright so )/i.test(text)) s += 15;
      if (/(imagine|picture this|close your eyes)/i.test(text)) s += 25;
      return Math.min(100, s);
    },
  },
  {
    type: 'problem_identification',
    patterns: [
      /(struggling with|tired of|sick of|frustrated|can't figure out|keep failing)/i,
      /(the problem is|the issue is|what's wrong with|biggest mistake)/i,
      /(if you're|are you still|why you can't|why you're not)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/(struggling with|tired of|sick of|frustrated|can't figure out|keep failing)/i.test(text)) s += 35;
      if (/(the problem is|the issue is|what's wrong with|biggest mistake)/i.test(text)) s += 30;
      if (/(if you're|are you still|why you can't|why you're not)/i.test(text)) s += 25;
      return Math.min(100, s);
    },
  },

  // Urgency/Scarcity cluster
  {
    type: 'urgency',
    patterns: [
      /(right now|immediately|today|before it's too late|don't wait|hurry|limited|last chance)/i,
      /(you need to|you have to|you must|stop everything)/i,
      /(breaking|just announced|just happened|just dropped)/i,
    ],
    maxScore: 100,
    scoreFn: (text: string) => {
      let s = 0;
      if (/(right now|immediately|before it's too late|don't wait|hurry|limited|last chance)/i.test(text)) s += 35;
      if (/(you need to|you have to|you must|stop everything)/i.test(text)) s += 25;
      if (/(breaking|just announced|just happened|just dropped)/i.test(text)) s += 30;
      if (/today/i.test(text)) s += 10;
      return Math.min(100, s);
    },
  },
];

// ─── HookScorer Class ─────────────────────────────────────────────────────────

export class HookScorer {

  /**
   * Extract first 3 seconds of transcript text.
   * Uses Whisper segments with real timestamps if available,
   * otherwise falls back to 8-word approximation.
   */
  private static extractHookText(input: HookInput): string {
    if (input.whisperSegments && input.whisperSegments.length > 0) {
      const hookSegments = input.whisperSegments.filter(s => s.start < 3.0);
      const text = hookSegments.map(s => s.text).join(' ').trim();
      if (text.length > 0) return text;
    }
    // Fallback: 8-word approximation (~3 seconds at 150 WPM)
    if (input.transcript) {
      return input.transcript.trim().split(/\s+/).slice(0, 8).join(' ');
    }
    return '';
  }

  /**
   * Score text channel: detect hook type from 10-type taxonomy, return 0-100 score.
   */
  private static scoreTextChannel(hookText: string): { score: number; hookType: HookType | 'weak'; patterns: string[] } {
    if (!hookText || hookText.length < 3) {
      return { score: 10, hookType: 'weak', patterns: [] };
    }

    let bestType: HookType | 'weak' = 'weak';
    let bestScore = 0;
    const matchedPatterns: string[] = [];

    for (const hp of HOOK_PATTERNS) {
      const hasMatch = hp.patterns.some(p => p.test(hookText));
      if (!hasMatch) continue;

      const typeScore = hp.scoreFn(hookText);
      if (typeScore > bestScore) {
        bestScore = typeScore;
        bestType = hp.type;
      }
      if (typeScore > 0) {
        matchedPatterns.push(hp.type);
      }
    }

    // Weak hook floor
    if (bestScore <= 15) {
      return { score: 15, hookType: 'weak', patterns: matchedPatterns };
    }

    return { score: bestScore, hookType: bestType, patterns: matchedPatterns };
  }

  /**
   * Score audio channel: hookLoudness, hookPitchMean, hookSilenceRatio → 0-100
   */
  private static scoreAudioChannel(audio: HookInput['audioHook']): number {
    if (!audio) return 0;
    // Base 40, boost for louder/higher-pitch/more-speech hook
    return clamp(0, 100,
      40
      + (audio.hookLoudness - 1) * 80     // >1.0 = louder hook → boost
      + (audio.hookPitchMean - 1) * 60    // >1.0 = higher energy → boost
      - audio.hookSilenceRatio * 100       // less silence = better
    );
  }

  /**
   * Score visual channel: hook_scene_changes → 0-100
   */
  private static scoreVisualChannel(visual: HookInput['visualHook']): number {
    if (!visual) return 0;
    const cuts = visual.hookSceneChanges;
    if (cuts === 0) return 30;       // Static shot
    if (cuts === 1) return 50;       // One cut, moderate
    if (cuts <= 3) return 75;        // Dynamic editing
    return 85;                       // Rapid cuts (capped — too many can be jarring)
  }

  /**
   * Score pace channel: hookWpm ratio + wpmAcceleration → 0-100
   */
  private static scorePaceChannel(pace: HookInput['paceHook']): number {
    if (!pace) return 0;
    let score: number;
    if (pace.hookWpm > 1.15) {
      // Fast hook delivery — urgency
      score = clamp(60, 90, 60 + (pace.hookWpm - 1.15) * 200);
    } else if (pace.hookWpm >= 0.85) {
      // Even pace — neutral
      score = 50;
    } else {
      // Slow hook — can be deliberate (dramatic pause)
      score = clamp(35, 55, 35 + (pace.hookWpm - 0.5) * 60);
    }
    // Acceleration bonus: building momentum
    if (pace.wpmAcceleration > 0) {
      score = Math.min(100, score + pace.wpmAcceleration * 5);
    }
    return score;
  }

  /**
   * Score tone channel: musicRatio, energyLevel, pitchContourSlope → 0-100
   */
  private static scoreToneChannel(tone: HookInput['tone']): number {
    if (!tone) return 0;
    let score = 40; // baseline
    // Music bed = professional production
    if (tone.musicRatio > 0.3) score += 15;
    // Energy level
    if (tone.energyLevel === 'high') score += 20;
    else if (tone.energyLevel === 'medium') score += 10;
    // Rising pitch contour = building energy
    if (tone.pitchContourSlope > 0) score += Math.min(15, tone.pitchContourSlope * 30);
    return clamp(0, 100, score);
  }

  /**
   * Fuse channel scores with weighted average.
   * Redistributes weights of unavailable channels proportionally.
   */
  private static fuseChannelScores(
    channels: Record<string, { score: number; available: boolean }>
  ): { fusedScore: number; channelsUsed: number } {
    let totalWeight = 0;
    let weightedSum = 0;
    let channelsUsed = 0;

    for (const [key, ch] of Object.entries(channels)) {
      if (!ch.available) continue;
      const w = CHANNEL_WEIGHTS[key as keyof typeof CHANNEL_WEIGHTS] || 0;
      totalWeight += w;
      weightedSum += ch.score * w;
      channelsUsed++;
    }

    if (totalWeight === 0) return { fusedScore: 30, channelsUsed: 0 };
    return { fusedScore: Math.round(weightedSum / totalWeight), channelsUsed };
  }

  /**
   * Main multi-modal hook analysis.
   * Accepts HookInput (multi-modal) or plain string (backward compat).
   */
  public static analyze(input: HookInput | string | undefined): HookScorerResult {
    // Backward compatibility: plain string → HookInput
    const hookInput: HookInput = typeof input === 'string'
      ? { transcript: input }
      : (input || {});

    // ── No transcript at all ──
    if (!hookInput.transcript && (!hookInput.whisperSegments || hookInput.whisperSegments.length === 0)) {
      return {
        success: false,
        hookType: null,
        hookCluster: 'none',
        hookScore: 0,
        hookConfidence: 0,
        hookText: '',
        insights: ['No transcript available'],
        error: 'No transcript provided',
        channels: {
          text:   { score: 0, available: false, hookType: 'weak', patterns: [] },
          audio:  { score: 0, available: false },
          visual: { score: 0, available: false },
          pace:   { score: 0, available: false },
          tone:   { score: 0, available: false },
        },
        channelsUsed: 0,
      };
    }

    // ── Extract hook text ──
    const hookText = this.extractHookText(hookInput);

    if (hookText.length < 3) {
      return {
        success: false,
        hookType: 'weak',
        hookCluster: 'none',
        hookScore: 5,
        hookConfidence: 0.3,
        hookText,
        insights: ['Hook too short to analyze effectively'],
        channels: {
          text:   { score: 5, available: true, hookType: 'weak', patterns: [] },
          audio:  { score: 0, available: false },
          visual: { score: 0, available: false },
          pace:   { score: 0, available: false },
          tone:   { score: 0, available: false },
        },
        channelsUsed: 1,
      };
    }

    // ── Score each channel ──
    const textResult = this.scoreTextChannel(hookText);
    const audioScore = this.scoreAudioChannel(hookInput.audioHook);
    const visualScore = this.scoreVisualChannel(hookInput.visualHook);
    const paceScore = this.scorePaceChannel(hookInput.paceHook);
    const toneScore = this.scoreToneChannel(hookInput.tone);

    const channelData = {
      text:   { score: textResult.score, available: true, hookType: textResult.hookType, patterns: textResult.patterns },
      audio:  { score: audioScore, available: !!hookInput.audioHook, hookLoudness: hookInput.audioHook?.hookLoudness, hookPitch: hookInput.audioHook?.hookPitchMean },
      visual: { score: visualScore, available: !!hookInput.visualHook, hookSceneChanges: hookInput.visualHook?.hookSceneChanges },
      pace:   { score: paceScore, available: !!hookInput.paceHook, hookWpm: hookInput.paceHook?.hookWpm },
      tone:   { score: toneScore, available: !!hookInput.tone, musicPresent: hookInput.tone ? hookInput.tone.musicRatio > 0.3 : undefined, energyLevel: hookInput.tone?.energyLevel },
    };

    // ── Fuse channels ──
    const { fusedScore, channelsUsed } = this.fuseChannelScores(channelData);

    // ── Confidence: higher with more channels, lower for weak hook type ──
    const baseConfidence = textResult.hookType === 'weak' ? 0.4 : 0.6;
    const channelBonus = (channelsUsed - 1) * 0.08; // +0.08 per extra channel
    const hookConfidence = parseFloat(Math.min(0.95, baseConfidence + channelBonus).toFixed(2));

    // ── Build insights ──
    const insights: string[] = [];
    const hookType = textResult.hookType;
    const hookCluster = getClusterForType(hookType);

    if (hookType !== 'weak') {
      insights.push(`${hookCluster} hook detected: ${hookType.replace(/_/g, ' ')}`);
    } else {
      insights.push('No strong hook pattern detected in first 3 seconds');
      insights.push('Consider starting with a question, statistic, story, or bold claim');
    }

    if (fusedScore >= 75) {
      insights.push(`Excellent hook strength (${fusedScore}/100)`);
    } else if (fusedScore >= 55) {
      insights.push(`Good hook strength (${fusedScore}/100)`);
    } else if (fusedScore >= 35) {
      insights.push(`Moderate hook strength (${fusedScore}/100)`);
    } else {
      insights.push(`Weak hook strength (${fusedScore}/100) — needs improvement`);
    }

    if (channelsUsed > 1) {
      insights.push(`Multi-modal analysis: ${channelsUsed}/5 channels used`);
    }

    // Audio insight
    if (hookInput.audioHook && hookInput.audioHook.hookLoudness > 1.1) {
      insights.push('Hook is louder than rest of video — good attention grab');
    }

    // Visual insight
    if (hookInput.visualHook) {
      if (hookInput.visualHook.hookSceneChanges >= 2) {
        insights.push(`Dynamic visual hook: ${hookInput.visualHook.hookSceneChanges} scene changes in first 3s`);
      } else if (hookInput.visualHook.hookSceneChanges === 0) {
        insights.push('Static visual hook — consider adding a cut or motion in first 3 seconds');
      }
    }

    return {
      success: true,
      hookType,
      hookCluster,
      hookScore: fusedScore,
      hookConfidence,
      hookText,
      insights,
      channels: channelData,
      channelsUsed,
    };
  }

  /**
   * Convert hook analysis to VPS prediction score.
   * hookScore 0-100 maps to VPS 25-85.
   */
  public static toPrediction(result: HookScorerResult): number {
    if (!result.success) return 35;
    // Direct mapping: 0-100 → 25-85 VPS range
    return parseFloat(Math.min(85, Math.max(25, 25 + (result.hookScore / 100) * 60)).toFixed(1));
  }
}

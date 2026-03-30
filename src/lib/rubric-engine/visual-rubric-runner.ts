/**
 * Pack V: Visual Rubric Runner
 *
 * Rule-based visual analysis augmented with Gemini Vision (D13).
 * Aggregates signals from FFmpeg, thumbnail, scene, style, and audio components.
 * When a video file is available and Gemini API key is set, extracts key frames
 * and sends them to Gemini Vision for AI-powered visual scoring.
 * Final scores blend rule-based (40%) with Gemini Vision (60%) per dimension.
 * Falls back to 100% rule-based when Gemini is unavailable or fails.
 */

import {
  VisualRubricResult,
  VisualRubricInput,
  VisualScore,
  VisualRubricResultSchema,
  createVisualRubricStub,
  PackVSignalCoverage,
  SignalCoverageComponent,
} from './visual-rubric-types';
import { scoreFramesWithGemini, GeminiVisionScores } from './gemini-vision-scorer';

// ============================================================================
// Score Calculation Functions
// ============================================================================

/**
 * Calculate visual hook score based on thumbnail and opening frame quality
 */
function calculateVisualHookScore(input: VisualRubricInput): VisualScore {
  const evidenceParts: string[] = [];
  let score = 5; // Base score

  // Thumbnail quality signals
  if (input.thumbnailFeatures) {
    const thumb = input.thumbnailFeatures;

    if (thumb.thumbnail_score !== undefined) {
      const thumbScore = Math.min(10, Math.max(1, thumb.thumbnail_score / 10));
      score = (score + thumbScore) / 2;
      evidenceParts.push(`Thumbnail quality: ${thumb.thumbnail_score.toFixed(0)}/100`);
    }

    if (thumb.has_face) {
      score += 1;
      evidenceParts.push('Face detected (attention grab)');
    }

    if (thumb.has_text) {
      score += 0.5;
      evidenceParts.push('Text overlay present');
    }

    if (thumb.color_vibrancy !== undefined && thumb.color_vibrancy > 0.7) {
      score += 0.5;
      evidenceParts.push(`High color vibrancy (${(thumb.color_vibrancy * 100).toFixed(0)}%)`);
    }
  }

  // Hook scorer visual aspects
  if (input.hookFeatures?.hook_visual_score !== undefined) {
    score = (score + input.hookFeatures.hook_visual_score) / 2;
    evidenceParts.push(`Hook visual score: ${input.hookFeatures.hook_visual_score.toFixed(1)}`);
  }

  if (input.hookFeatures?.opening_frame_quality !== undefined) {
    const openingScore = input.hookFeatures.opening_frame_quality / 10;
    score = (score * 0.7) + (openingScore * 0.3);
    evidenceParts.push(`Opening frame: ${input.hookFeatures.opening_frame_quality.toFixed(0)}/100`);
  }

  // Clamp and round
  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  return {
    score,
    evidence: evidenceParts.length > 0 ? evidenceParts.join('; ') : 'Limited visual hook data available',
  };
}

/**
 * Calculate pacing score based on scene cuts, duration, and motion
 */
function calculatePacingScore(input: VisualRubricInput): VisualScore {
  const evidenceParts: string[] = [];
  let score = 5;

  if (input.ffmpegFeatures) {
    const ffmpeg = input.ffmpegFeatures;

    // Scene frequency (optimal: 1 cut every 2-4 seconds for TikTok)
    if (ffmpeg.duration_seconds && ffmpeg.scene_count) {
      const avgSceneDuration = ffmpeg.duration_seconds / ffmpeg.scene_count;

      if (avgSceneDuration >= 2 && avgSceneDuration <= 4) {
        score += 2;
        evidenceParts.push(`Optimal scene pacing (${avgSceneDuration.toFixed(1)}s avg)`);
      } else if (avgSceneDuration >= 1 && avgSceneDuration <= 6) {
        score += 1;
        evidenceParts.push(`Good scene pacing (${avgSceneDuration.toFixed(1)}s avg)`);
      } else if (avgSceneDuration < 1) {
        score -= 1;
        evidenceParts.push(`Too fast cutting (${avgSceneDuration.toFixed(1)}s avg)`);
      } else {
        score -= 1;
        evidenceParts.push(`Slow pacing (${avgSceneDuration.toFixed(1)}s avg)`);
      }
    }

    // Motion intensity
    if (ffmpeg.motion_intensity !== undefined) {
      if (ffmpeg.motion_intensity >= 0.4 && ffmpeg.motion_intensity <= 0.8) {
        score += 1;
        evidenceParts.push(`Good motion level (${(ffmpeg.motion_intensity * 100).toFixed(0)}%)`);
      } else if (ffmpeg.motion_intensity < 0.2) {
        score -= 1;
        evidenceParts.push('Low motion - may feel static');
      } else if (ffmpeg.motion_intensity > 0.9) {
        score -= 0.5;
        evidenceParts.push('Very high motion - may feel chaotic');
      }
    }

    // FPS check
    if (ffmpeg.fps && ffmpeg.fps >= 30) {
      score += 0.5;
      evidenceParts.push(`Smooth framerate (${ffmpeg.fps}fps)`);
    }
  }

  // Scene detector pacing signals
  if (input.sceneFeatures?.avg_shot_length !== undefined) {
    const shotLength = input.sceneFeatures.avg_shot_length;
    if (shotLength >= 1.5 && shotLength <= 5) {
      score += 1;
      evidenceParts.push(`Engaging shot lengths (${shotLength.toFixed(1)}s)`);
    }
  }

  // Audio-visual sync affects pacing feel
  if (input.audioFeatures?.beat_aligned) {
    score += 1;
    evidenceParts.push('Cuts aligned to beat');
  }

  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  return {
    score,
    evidence: evidenceParts.length > 0 ? evidenceParts.join('; ') : 'Limited pacing data available',
  };
}

/**
 * Calculate pattern interrupts score based on scene variety and transitions
 */
function calculatePatternInterruptsScore(input: VisualRubricInput): VisualScore {
  const evidenceParts: string[] = [];
  let score = 5;

  // Scene transitions count
  if (input.sceneFeatures?.scene_transitions !== undefined) {
    const transitions = input.sceneFeatures.scene_transitions;

    if (transitions >= 5 && transitions <= 15) {
      score += 2;
      evidenceParts.push(`Good transition variety (${transitions} transitions)`);
    } else if (transitions >= 3 && transitions <= 20) {
      score += 1;
      evidenceParts.push(`Adequate transitions (${transitions})`);
    } else if (transitions < 2) {
      score -= 2;
      evidenceParts.push('Very few pattern interrupts');
    }
  } else if (input.ffmpegFeatures?.scene_count !== undefined) {
    // Fallback to ffmpeg scene count
    const scenes = input.ffmpegFeatures.scene_count;
    if (scenes >= 4 && scenes <= 12) {
      score += 1.5;
      evidenceParts.push(`${scenes} scene changes detected`);
    } else if (scenes >= 2) {
      score += 0.5;
      evidenceParts.push(`${scenes} scenes (moderate variety)`);
    } else {
      score -= 1;
      evidenceParts.push('Single scene - no pattern interrupts');
    }
  }

  // Visual variety
  if (input.sceneFeatures?.visual_variety !== undefined) {
    const variety = input.sceneFeatures.visual_variety;
    if (variety >= 0.7) {
      score += 1.5;
      evidenceParts.push(`High visual variety (${(variety * 100).toFixed(0)}%)`);
    } else if (variety >= 0.4) {
      score += 0.5;
      evidenceParts.push(`Moderate visual variety (${(variety * 100).toFixed(0)}%)`);
    } else {
      score -= 0.5;
      evidenceParts.push('Low visual variety');
    }
  }

  // Color diversity as pattern interrupt indicator
  if (input.sceneFeatures?.dominant_colors && input.sceneFeatures.dominant_colors.length >= 4) {
    score += 0.5;
    evidenceParts.push(`Color diversity (${input.sceneFeatures.dominant_colors.length} dominant colors)`);
  }

  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  return {
    score,
    evidence: evidenceParts.length > 0 ? evidenceParts.join('; ') : 'Limited pattern interrupt data available',
  };
}

/**
 * Calculate visual clarity score based on resolution, brightness, contrast
 */
function calculateVisualClarityScore(input: VisualRubricInput): VisualScore {
  const evidenceParts: string[] = [];
  let score = 5;

  if (input.ffmpegFeatures) {
    const ffmpeg = input.ffmpegFeatures;

    // Resolution quality
    if (ffmpeg.resolution) {
      const { width, height } = ffmpeg.resolution;
      const pixels = width * height;

      if (pixels >= 1920 * 1080) {
        score += 2;
        evidenceParts.push(`HD quality (${width}x${height})`);
      } else if (pixels >= 1280 * 720) {
        score += 1;
        evidenceParts.push(`720p quality (${width}x${height})`);
      } else if (pixels >= 854 * 480) {
        evidenceParts.push(`SD quality (${width}x${height})`);
      } else {
        score -= 2;
        evidenceParts.push(`Low resolution (${width}x${height})`);
      }

      // Portrait mode bonus for TikTok
      if (height > width && width >= 720) {
        score += 0.5;
        evidenceParts.push('Vertical format (TikTok optimized)');
      }
    }

    // Brightness
    if (ffmpeg.brightness_avg !== undefined) {
      if (ffmpeg.brightness_avg >= 0.3 && ffmpeg.brightness_avg <= 0.7) {
        score += 1;
        evidenceParts.push('Good lighting balance');
      } else if (ffmpeg.brightness_avg < 0.2) {
        score -= 1;
        evidenceParts.push('Video appears dark');
      } else if (ffmpeg.brightness_avg > 0.85) {
        score -= 0.5;
        evidenceParts.push('Video may be overexposed');
      }
    }

    // Contrast
    if (ffmpeg.contrast_ratio !== undefined) {
      if (ffmpeg.contrast_ratio >= 0.4 && ffmpeg.contrast_ratio <= 0.8) {
        score += 1;
        evidenceParts.push('Good contrast ratio');
      } else if (ffmpeg.contrast_ratio < 0.2) {
        score -= 1;
        evidenceParts.push('Low contrast - may appear washed out');
      }
    }
  }

  // Thumbnail composition as proxy for overall visual quality
  if (input.thumbnailFeatures?.composition_score !== undefined) {
    const comp = input.thumbnailFeatures.composition_score / 10;
    score = (score * 0.8) + (comp * 0.2);
    evidenceParts.push(`Composition score: ${input.thumbnailFeatures.composition_score.toFixed(0)}/100`);
  }

  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  return {
    score,
    evidence: evidenceParts.length > 0 ? evidenceParts.join('; ') : 'Limited visual clarity data available',
  };
}

/**
 * Calculate style fit score based on niche and detected style
 */
function calculateStyleFitScore(input: VisualRubricInput): VisualScore {
  const evidenceParts: string[] = [];
  let score = 5;

  // Style detection
  if (input.styleFeatures) {
    const style = input.styleFeatures;

    if (style.detected_style) {
      evidenceParts.push(`Detected style: ${style.detected_style}`);

      // Style confidence boost
      if (style.style_confidence !== undefined && style.style_confidence >= 0.7) {
        score += 1;
        evidenceParts.push(`High style confidence (${(style.style_confidence * 100).toFixed(0)}%)`);
      }

      // Niche-style fit heuristics
      if (input.niche && style.detected_style) {
        const fit = evaluateNicheStyleFit(input.niche, style.detected_style);
        score += fit.adjustment;
        if (fit.reason) {
          evidenceParts.push(fit.reason);
        }
      }
    }

    // Visual elements
    if (style.visual_elements && style.visual_elements.length > 0) {
      evidenceParts.push(`Elements: ${style.visual_elements.slice(0, 3).join(', ')}`);
    }
  }

  // Music presence for certain niches
  if (input.audioFeatures?.has_music) {
    if (input.niche === 'dance' || input.niche === 'fitness' || input.niche === 'lifestyle') {
      score += 1;
      evidenceParts.push('Music present (niche appropriate)');
    }
  }

  // Audio-visual sync quality
  if (input.audioFeatures?.audio_visual_sync !== undefined) {
    if (input.audioFeatures.audio_visual_sync >= 0.8) {
      score += 1;
      evidenceParts.push('Strong audio-visual sync');
    } else if (input.audioFeatures.audio_visual_sync >= 0.5) {
      score += 0.5;
      evidenceParts.push('Moderate audio-visual sync');
    }
  }

  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));

  return {
    score,
    evidence: evidenceParts.length > 0 ? evidenceParts.join('; ') : 'Limited style data available',
  };
}

/**
 * Evaluate how well a detected style fits a niche
 */
function evaluateNicheStyleFit(
  niche: string,
  detectedStyle: string
): { adjustment: number; reason?: string } {
  const styleNorm = detectedStyle.toLowerCase();
  const nicheNorm = niche.toLowerCase().replace(/_/g, ' ');

  // Define style-niche compatibility
  const goodFits: Record<string, string[]> = {
    'side hustles': ['talking head', 'educational', 'listicle', 'story'],
    'personal finance': ['talking head', 'educational', 'professional', 'graph overlay'],
    'fitness': ['workout', 'transformation', 'high energy', 'pov'],
    'dance': ['performance', 'trend', 'music', 'challenge'],
    'cooking': ['tutorial', 'pov', 'asmr', 'montage'],
    'beauty': ['tutorial', 'transformation', 'close-up', 'review'],
    'comedy': ['skit', 'reaction', 'trend', 'relatable'],
    'lifestyle': ['vlog', 'aesthetic', 'montage', 'day in life'],
    'education': ['explainer', 'talking head', 'whiteboard', 'animation'],
    'gaming': ['gameplay', 'reaction', 'clip', 'highlight'],
  };

  const nicheStyles = goodFits[nicheNorm] || [];

  for (const goodStyle of nicheStyles) {
    if (styleNorm.includes(goodStyle) || goodStyle.includes(styleNorm)) {
      return { adjustment: 2, reason: `Style "${detectedStyle}" fits ${niche} niche well` };
    }
  }

  // Partial matches
  if (nicheStyles.length > 0) {
    return { adjustment: 0, reason: `Style "${detectedStyle}" may not be optimal for ${niche}` };
  }

  return { adjustment: 0 };
}

// ============================================================================
// Score Blending (Rule-Based + Gemini Vision)
// ============================================================================

const RULE_BASED_WEIGHT = 0.4;
const GEMINI_WEIGHT = 0.6;

/**
 * Blend a rule-based score with a Gemini Vision score.
 * When Gemini score is available: 40% rule-based + 60% Gemini.
 * When Gemini is unavailable: 100% rule-based (returned unchanged).
 */
function blendScores(
  ruleBased: VisualScore,
  gemini: { score: number; reasoning: string } | undefined,
  dimensionName: string,
): VisualScore {
  if (!gemini) {
    return ruleBased;
  }

  const blendedScore = Math.min(10, Math.max(1,
    Math.round((RULE_BASED_WEIGHT * ruleBased.score + GEMINI_WEIGHT * gemini.score) * 10) / 10
  ));

  // Combine evidence: rule-based evidence + Gemini reasoning
  const blendedEvidence = gemini.reasoning
    ? `${ruleBased.evidence} | AI Vision: ${gemini.reasoning}`
    : ruleBased.evidence;

  console.log(`[VisualRubric] ${dimensionName}: rule=${ruleBased.score}, gemini=${gemini.score}, blended=${blendedScore}`);

  return {
    score: blendedScore,
    evidence: blendedEvidence,
  };
}

// ============================================================================
// Signal Coverage Builder
// ============================================================================

/**
 * Define which fields each component can provide
 */
const COMPONENT_FIELDS: Record<string, string[]> = {
  'ffmpeg': ['fps', 'duration_seconds', 'resolution', 'scene_count', 'motion_intensity', 'brightness_avg', 'contrast_ratio', 'avg_scene_duration'],
  'visual-scene-detector': ['scene_transitions', 'avg_shot_length', 'visual_variety', 'dominant_colors'],
  'thumbnail-analyzer': ['thumbnail_score', 'has_face', 'has_text', 'color_vibrancy', 'composition_score'],
  'audio-analyzer': ['has_music', 'beat_aligned', 'audio_visual_sync', 'audio_score', 'energy_level', 'silence_ratio', 'speaking_pace'],
  '24-styles': ['detected_style', 'style_confidence', 'visual_elements'],
  'hook-scorer': ['hook_visual_score', 'opening_frame_quality'],
};

/**
 * Build signal coverage debug block
 */
function buildSignalCoverage(
  input: VisualRubricInput,
  consumedSignals: { field: string; source: string; value: string | number | boolean; used_in_score: string }[]
): PackVSignalCoverage {
  const components: SignalCoverageComponent[] = [];

  // Check ffmpeg component
  const ffmpegFields = COMPONENT_FIELDS['ffmpeg'];
  const ffmpegAvailable: string[] = [];
  const ffmpegConsumed: string[] = [];
  if (input.ffmpegFeatures) {
    for (const field of ffmpegFields) {
      const value = (input.ffmpegFeatures as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) {
        ffmpegAvailable.push(field);
      }
    }
    ffmpegConsumed.push(...consumedSignals.filter(s => s.source === 'ffmpeg').map(s => s.field));
  }
  components.push({
    component: 'ffmpeg',
    executed: !!input.ffmpegFeatures,
    fieldsAvailable: ffmpegAvailable,
    fieldsConsumed: Array.from(new Set(ffmpegConsumed)),
    status: !input.ffmpegFeatures ? 'not-executed' :
      ffmpegConsumed.length === 0 ? 'executed-but-unused' :
      ffmpegConsumed.length < ffmpegAvailable.length ? 'partial' : 'used',
  });

  // Check visual-scene-detector component
  const sceneFields = COMPONENT_FIELDS['visual-scene-detector'];
  const sceneAvailable: string[] = [];
  const sceneConsumed: string[] = [];
  if (input.sceneFeatures) {
    for (const field of sceneFields) {
      const value = (input.sceneFeatures as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) {
        sceneAvailable.push(field);
      }
    }
    sceneConsumed.push(...consumedSignals.filter(s => s.source === 'visual-scene-detector').map(s => s.field));
  }
  components.push({
    component: 'visual-scene-detector',
    executed: !!input.sceneFeatures,
    fieldsAvailable: sceneAvailable,
    fieldsConsumed: Array.from(new Set(sceneConsumed)),
    status: !input.sceneFeatures ? 'not-executed' :
      sceneConsumed.length === 0 ? 'executed-but-unused' :
      sceneConsumed.length < sceneAvailable.length ? 'partial' : 'used',
  });

  // Check thumbnail-analyzer component
  const thumbFields = COMPONENT_FIELDS['thumbnail-analyzer'];
  const thumbAvailable: string[] = [];
  const thumbConsumed: string[] = [];
  if (input.thumbnailFeatures) {
    for (const field of thumbFields) {
      const value = (input.thumbnailFeatures as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) {
        thumbAvailable.push(field);
      }
    }
    thumbConsumed.push(...consumedSignals.filter(s => s.source === 'thumbnail-analyzer').map(s => s.field));
  }
  components.push({
    component: 'thumbnail-analyzer',
    executed: !!input.thumbnailFeatures,
    fieldsAvailable: thumbAvailable,
    fieldsConsumed: Array.from(new Set(thumbConsumed)),
    status: !input.thumbnailFeatures ? 'not-executed' :
      thumbConsumed.length === 0 ? 'executed-but-unused' :
      thumbConsumed.length < thumbAvailable.length ? 'partial' : 'used',
  });

  // Check audio-analyzer component
  const audioFields = COMPONENT_FIELDS['audio-analyzer'];
  const audioAvailable: string[] = [];
  const audioConsumed: string[] = [];
  if (input.audioFeatures) {
    for (const field of audioFields) {
      const value = (input.audioFeatures as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) {
        audioAvailable.push(field);
      }
    }
    audioConsumed.push(...consumedSignals.filter(s => s.source === 'audio-analyzer').map(s => s.field));
  }
  components.push({
    component: 'audio-analyzer',
    executed: !!input.audioFeatures,
    fieldsAvailable: audioAvailable,
    fieldsConsumed: Array.from(new Set(audioConsumed)),
    status: !input.audioFeatures ? 'not-executed' :
      audioConsumed.length === 0 ? 'executed-but-unused' :
      audioConsumed.length < audioAvailable.length ? 'partial' : 'used',
  });

  // Check 24-styles component
  const styleFields = COMPONENT_FIELDS['24-styles'];
  const styleAvailable: string[] = [];
  const styleConsumed: string[] = [];
  if (input.styleFeatures) {
    for (const field of styleFields) {
      const value = (input.styleFeatures as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) {
        styleAvailable.push(field);
      }
    }
    styleConsumed.push(...consumedSignals.filter(s => s.source === '24-styles').map(s => s.field));
  }
  components.push({
    component: '24-styles',
    executed: !!input.styleFeatures,
    fieldsAvailable: styleAvailable,
    fieldsConsumed: Array.from(new Set(styleConsumed)),
    status: !input.styleFeatures ? 'not-executed' :
      styleConsumed.length === 0 ? 'executed-but-unused' :
      styleConsumed.length < styleAvailable.length ? 'partial' : 'used',
  });

  // Check hook-scorer component
  const hookFields = COMPONENT_FIELDS['hook-scorer'];
  const hookAvailable: string[] = [];
  const hookConsumed: string[] = [];
  if (input.hookFeatures) {
    for (const field of hookFields) {
      const value = (input.hookFeatures as Record<string, unknown>)[field];
      if (value !== undefined && value !== null) {
        hookAvailable.push(field);
      }
    }
    hookConsumed.push(...consumedSignals.filter(s => s.source === 'hook-scorer').map(s => s.field));
  }
  components.push({
    component: 'hook-scorer',
    executed: !!input.hookFeatures,
    fieldsAvailable: hookAvailable,
    fieldsConsumed: Array.from(new Set(hookConsumed)),
    status: !input.hookFeatures ? 'not-executed' :
      hookConsumed.length === 0 ? 'executed-but-unused' :
      hookConsumed.length < hookAvailable.length ? 'partial' : 'used',
  });

  // Calculate summary
  const totalFieldsAvailable = components.reduce((sum, c) => sum + c.fieldsAvailable.length, 0);
  const totalFieldsConsumed = components.reduce((sum, c) => sum + c.fieldsConsumed.length, 0);

  const summary = {
    total_components: components.length,
    executed_count: components.filter(c => c.executed).length,
    used_count: components.filter(c => c.status === 'used').length,
    partial_count: components.filter(c => c.status === 'partial').length,
    unused_count: components.filter(c => c.status === 'executed-but-unused').length,
    total_fields_available: totalFieldsAvailable,
    total_fields_consumed: totalFieldsConsumed,
    coverage_percent: totalFieldsAvailable > 0 ? Math.round((totalFieldsConsumed / totalFieldsAvailable) * 100) : 0,
  };

  return {
    timestamp: new Date().toISOString(),
    components,
    summary,
    signals_used: consumedSignals,
  };
}

// ============================================================================
// Main Runner
// ============================================================================

/**
 * Run Pack V visual rubric analysis
 * Does NOT require transcript - uses visual signals only
 */
export async function runVisualRubric(input: VisualRubricInput): Promise<VisualRubricResult> {
  const startTime = Date.now();

  // Check if we have ANY visual data to work with
  const hasVisualData =
    input.ffmpegFeatures ||
    input.styleFeatures ||
    input.thumbnailFeatures ||
    input.sceneFeatures ||
    input.audioFeatures ||
    input.hookFeatures;

  if (!hasVisualData) {
    console.log('[VisualRubric] No visual data available, returning stub');
    return createVisualRubricStub();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DEBUG: Detailed input field logging for Pack V troubleshooting
  // ═══════════════════════════════════════════════════════════════════════
  console.log('[VisualRubric] ═══════════════════════════════════════════════════════════');
  console.log('[VisualRubric] DEBUG: Input field presence and sizes');
  console.log(`[VisualRubric]   videoId: ${input.videoId || 'MISSING'}`);
  console.log(`[VisualRubric]   niche: ${input.niche || 'not specified'}`);

  // FFmpeg features (from ffmpeg component)
  if (input.ffmpegFeatures) {
    console.log('[VisualRubric]   ffmpegFeatures: PRESENT');
    console.log(`[VisualRubric]     - duration_seconds: ${input.ffmpegFeatures.duration_seconds ?? 'n/a'}`);
    console.log(`[VisualRubric]     - fps: ${input.ffmpegFeatures.fps ?? 'n/a'}`);
    console.log(`[VisualRubric]     - resolution: ${input.ffmpegFeatures.resolution ? `${input.ffmpegFeatures.resolution.width}x${input.ffmpegFeatures.resolution.height}` : 'n/a'}`);
    console.log(`[VisualRubric]     - scene_count: ${input.ffmpegFeatures.scene_count ?? 'n/a'}`);
    console.log(`[VisualRubric]     - motion_intensity: ${input.ffmpegFeatures.motion_intensity ?? 'n/a'}`);
    console.log(`[VisualRubric]     - brightness_avg: ${input.ffmpegFeatures.brightness_avg ?? 'n/a'}`);
    console.log(`[VisualRubric]     - contrast_ratio: ${input.ffmpegFeatures.contrast_ratio ?? 'n/a'}`);
  } else {
    console.log('[VisualRubric]   ffmpegFeatures: MISSING');
  }

  // Style features (from 24-styles component)
  if (input.styleFeatures) {
    console.log('[VisualRubric]   styleFeatures: PRESENT');
    console.log(`[VisualRubric]     - detected_style: ${input.styleFeatures.detected_style ?? 'n/a'}`);
    console.log(`[VisualRubric]     - style_confidence: ${input.styleFeatures.style_confidence ?? 'n/a'}`);
    console.log(`[VisualRubric]     - visual_elements count: ${input.styleFeatures.visual_elements?.length ?? 0}`);
  } else {
    console.log('[VisualRubric]   styleFeatures: MISSING');
  }

  // Thumbnail features (from thumbnail-analyzer component)
  if (input.thumbnailFeatures) {
    console.log('[VisualRubric]   thumbnailFeatures: PRESENT');
    console.log(`[VisualRubric]     - thumbnail_score: ${input.thumbnailFeatures.thumbnail_score ?? 'n/a'}`);
    console.log(`[VisualRubric]     - has_face: ${input.thumbnailFeatures.has_face ?? 'n/a'}`);
    console.log(`[VisualRubric]     - has_text: ${input.thumbnailFeatures.has_text ?? 'n/a'}`);
    console.log(`[VisualRubric]     - color_vibrancy: ${input.thumbnailFeatures.color_vibrancy ?? 'n/a'}`);
    console.log(`[VisualRubric]     - composition_score: ${input.thumbnailFeatures.composition_score ?? 'n/a'}`);
  } else {
    console.log('[VisualRubric]   thumbnailFeatures: MISSING');
  }

  // Scene features (from visual-scene-detector component)
  if (input.sceneFeatures) {
    console.log('[VisualRubric]   sceneFeatures: PRESENT');
    console.log(`[VisualRubric]     - scene_transitions: ${input.sceneFeatures.scene_transitions ?? 'n/a'}`);
    console.log(`[VisualRubric]     - avg_shot_length: ${input.sceneFeatures.avg_shot_length ?? 'n/a'}`);
    console.log(`[VisualRubric]     - visual_variety: ${input.sceneFeatures.visual_variety ?? 'n/a'}`);
    console.log(`[VisualRubric]     - dominant_colors count: ${input.sceneFeatures.dominant_colors?.length ?? 0}`);
  } else {
    console.log('[VisualRubric]   sceneFeatures: MISSING');
  }

  // Audio features (from audio-analyzer component)
  if (input.audioFeatures) {
    console.log('[VisualRubric]   audioFeatures: PRESENT');
    console.log(`[VisualRubric]     - has_music: ${input.audioFeatures.has_music ?? 'n/a'}`);
    console.log(`[VisualRubric]     - beat_aligned: ${input.audioFeatures.beat_aligned ?? 'n/a'}`);
    console.log(`[VisualRubric]     - audio_visual_sync: ${input.audioFeatures.audio_visual_sync ?? 'n/a'}`);
  } else {
    console.log('[VisualRubric]   audioFeatures: MISSING');
  }

  // Hook features (from hook-scorer component)
  if (input.hookFeatures) {
    console.log('[VisualRubric]   hookFeatures: PRESENT');
    console.log(`[VisualRubric]     - hook_visual_score: ${input.hookFeatures.hook_visual_score ?? 'n/a'}`);
    console.log(`[VisualRubric]     - opening_frame_quality: ${input.hookFeatures.opening_frame_quality ?? 'n/a'}`);
  } else {
    console.log('[VisualRubric]   hookFeatures: MISSING');
  }
  console.log('[VisualRubric] ═══════════════════════════════════════════════════════════');
  console.log('[VisualRubric] Running visual analysis...');

  // Track consumed signals for coverage report
  const consumedSignals: { field: string; source: string; value: string | number | boolean; used_in_score: string }[] = [];

  // Calculate individual scores and track consumed signals
  const visualHookScore = calculateVisualHookScore(input);
  const pacingScore = calculatePacingScore(input);
  const patternInterruptsScore = calculatePatternInterruptsScore(input);
  const visualClarityScore = calculateVisualClarityScore(input);
  const styleFitScore = calculateStyleFitScore(input);

  // Track which signals were consumed based on evidence strings
  // FFmpeg signals
  if (input.ffmpegFeatures) {
    if (input.ffmpegFeatures.fps !== undefined && pacingScore.evidence.includes('fps')) {
      consumedSignals.push({ field: 'fps', source: 'ffmpeg', value: input.ffmpegFeatures.fps, used_in_score: 'pacing_score' });
    }
    if (input.ffmpegFeatures.duration_seconds !== undefined && input.ffmpegFeatures.scene_count !== undefined) {
      if (pacingScore.evidence.includes('scene pacing') || patternInterruptsScore.evidence.includes('scene')) {
        consumedSignals.push({ field: 'duration_seconds', source: 'ffmpeg', value: input.ffmpegFeatures.duration_seconds, used_in_score: 'pacing_score' });
        consumedSignals.push({ field: 'scene_count', source: 'ffmpeg', value: input.ffmpegFeatures.scene_count, used_in_score: 'pacing_score' });
      }
    }
    if (input.ffmpegFeatures.motion_intensity !== undefined && pacingScore.evidence.includes('motion')) {
      consumedSignals.push({ field: 'motion_intensity', source: 'ffmpeg', value: input.ffmpegFeatures.motion_intensity, used_in_score: 'pacing_score' });
    }
    if (input.ffmpegFeatures.resolution && visualClarityScore.evidence.includes('quality')) {
      consumedSignals.push({ field: 'resolution', source: 'ffmpeg', value: `${input.ffmpegFeatures.resolution.width}x${input.ffmpegFeatures.resolution.height}`, used_in_score: 'visual_clarity_score' });
    }
    if (input.ffmpegFeatures.brightness_avg !== undefined && visualClarityScore.evidence.includes('lighting')) {
      consumedSignals.push({ field: 'brightness_avg', source: 'ffmpeg', value: input.ffmpegFeatures.brightness_avg, used_in_score: 'visual_clarity_score' });
    }
    if (input.ffmpegFeatures.contrast_ratio !== undefined && visualClarityScore.evidence.includes('contrast')) {
      consumedSignals.push({ field: 'contrast_ratio', source: 'ffmpeg', value: input.ffmpegFeatures.contrast_ratio, used_in_score: 'visual_clarity_score' });
    }
  }

  // Scene detector signals
  if (input.sceneFeatures) {
    if (input.sceneFeatures.scene_transitions !== undefined && patternInterruptsScore.evidence.includes('transition')) {
      consumedSignals.push({ field: 'scene_transitions', source: 'visual-scene-detector', value: input.sceneFeatures.scene_transitions, used_in_score: 'pattern_interrupts_score' });
    }
    if (input.sceneFeatures.avg_shot_length !== undefined && pacingScore.evidence.includes('shot')) {
      consumedSignals.push({ field: 'avg_shot_length', source: 'visual-scene-detector', value: input.sceneFeatures.avg_shot_length, used_in_score: 'pacing_score' });
    }
    if (input.sceneFeatures.visual_variety !== undefined && patternInterruptsScore.evidence.includes('variety')) {
      consumedSignals.push({ field: 'visual_variety', source: 'visual-scene-detector', value: input.sceneFeatures.visual_variety, used_in_score: 'pattern_interrupts_score' });
    }
    if (input.sceneFeatures.dominant_colors && patternInterruptsScore.evidence.includes('color')) {
      consumedSignals.push({ field: 'dominant_colors', source: 'visual-scene-detector', value: input.sceneFeatures.dominant_colors.length, used_in_score: 'pattern_interrupts_score' });
    }
  }

  // Thumbnail signals
  if (input.thumbnailFeatures) {
    if (input.thumbnailFeatures.thumbnail_score !== undefined && visualHookScore.evidence.includes('Thumbnail')) {
      consumedSignals.push({ field: 'thumbnail_score', source: 'thumbnail-analyzer', value: input.thumbnailFeatures.thumbnail_score, used_in_score: 'visual_hook_score' });
    }
    if (input.thumbnailFeatures.has_face !== undefined && visualHookScore.evidence.includes('Face')) {
      consumedSignals.push({ field: 'has_face', source: 'thumbnail-analyzer', value: input.thumbnailFeatures.has_face, used_in_score: 'visual_hook_score' });
    }
    if (input.thumbnailFeatures.has_text !== undefined && visualHookScore.evidence.includes('Text')) {
      consumedSignals.push({ field: 'has_text', source: 'thumbnail-analyzer', value: input.thumbnailFeatures.has_text, used_in_score: 'visual_hook_score' });
    }
    if (input.thumbnailFeatures.color_vibrancy !== undefined && visualHookScore.evidence.includes('vibrancy')) {
      consumedSignals.push({ field: 'color_vibrancy', source: 'thumbnail-analyzer', value: input.thumbnailFeatures.color_vibrancy, used_in_score: 'visual_hook_score' });
    }
    if (input.thumbnailFeatures.composition_score !== undefined && visualClarityScore.evidence.includes('Composition')) {
      consumedSignals.push({ field: 'composition_score', source: 'thumbnail-analyzer', value: input.thumbnailFeatures.composition_score, used_in_score: 'visual_clarity_score' });
    }
  }

  // Audio signals
  if (input.audioFeatures) {
    if (input.audioFeatures.has_music !== undefined && styleFitScore.evidence.includes('Music')) {
      consumedSignals.push({ field: 'has_music', source: 'audio-analyzer', value: input.audioFeatures.has_music, used_in_score: 'style_fit_score' });
    }
    if (input.audioFeatures.beat_aligned !== undefined && pacingScore.evidence.includes('beat')) {
      consumedSignals.push({ field: 'beat_aligned', source: 'audio-analyzer', value: input.audioFeatures.beat_aligned, used_in_score: 'pacing_score' });
    }
    if (input.audioFeatures.audio_visual_sync !== undefined && styleFitScore.evidence.includes('sync')) {
      consumedSignals.push({ field: 'audio_visual_sync', source: 'audio-analyzer', value: input.audioFeatures.audio_visual_sync, used_in_score: 'style_fit_score' });
    }
  }

  // Style signals
  if (input.styleFeatures) {
    if (input.styleFeatures.detected_style !== undefined && styleFitScore.evidence.includes('style')) {
      consumedSignals.push({ field: 'detected_style', source: '24-styles', value: input.styleFeatures.detected_style, used_in_score: 'style_fit_score' });
    }
    if (input.styleFeatures.style_confidence !== undefined && styleFitScore.evidence.includes('confidence')) {
      consumedSignals.push({ field: 'style_confidence', source: '24-styles', value: input.styleFeatures.style_confidence, used_in_score: 'style_fit_score' });
    }
    if (input.styleFeatures.visual_elements && styleFitScore.evidence.includes('Elements')) {
      consumedSignals.push({ field: 'visual_elements', source: '24-styles', value: input.styleFeatures.visual_elements.length, used_in_score: 'style_fit_score' });
    }
  }

  // Hook signals
  if (input.hookFeatures) {
    if (input.hookFeatures.hook_visual_score !== undefined && visualHookScore.evidence.includes('Hook visual')) {
      consumedSignals.push({ field: 'hook_visual_score', source: 'hook-scorer', value: input.hookFeatures.hook_visual_score, used_in_score: 'visual_hook_score' });
    }
    if (input.hookFeatures.opening_frame_quality !== undefined && visualHookScore.evidence.includes('Opening frame')) {
      consumedSignals.push({ field: 'opening_frame_quality', source: 'hook-scorer', value: input.hookFeatures.opening_frame_quality, used_in_score: 'visual_hook_score' });
    }
  }

  // Build signal coverage debug block
  const signalCoverage = buildSignalCoverage(input, consumedSignals);

  // Log signal coverage summary
  console.log('[VisualRubric] ═══════════════════════════════════════════════════════════');
  console.log('[VisualRubric] PACK V SIGNAL COVERAGE');
  console.log(`[VisualRubric]   Components executed: ${signalCoverage.summary.executed_count}/${signalCoverage.summary.total_components}`);
  console.log(`[VisualRubric]   Fields consumed: ${signalCoverage.summary.total_fields_consumed}/${signalCoverage.summary.total_fields_available} (${signalCoverage.summary.coverage_percent}%)`);
  for (const comp of signalCoverage.components) {
    const statusIcon = comp.status === 'used' ? '✓' : comp.status === 'partial' ? '◐' : comp.status === 'executed-but-unused' ? '⚠' : '✗';
    console.log(`[VisualRubric]   ${statusIcon} ${comp.component}: ${comp.status} (${comp.fieldsConsumed.length}/${comp.fieldsAvailable.length} fields)`);
    if (comp.fieldsConsumed.length > 0) {
      console.log(`[VisualRubric]       consumed: ${comp.fieldsConsumed.join(', ')}`);
    }
    if (comp.status === 'executed-but-unused' && comp.fieldsAvailable.length > 0) {
      console.log(`[VisualRubric]       available but unused: ${comp.fieldsAvailable.join(', ')}`);
    }
  }
  console.log('[VisualRubric] ═══════════════════════════════════════════════════════════');

  // ═══════════════════════════════════════════════════════════════════════════
  // Gemini Vision: Attempt AI-powered visual scoring (D13)
  // Blends with rule-based scores when available. Falls back gracefully.
  // ═══════════════════════════════════════════════════════════════════════════

  let geminiScores: GeminiVisionScores | null = null;
  let usedGemini = false;

  if (input.videoPath) {
    console.log('[VisualRubric] Video path available — attempting Gemini Vision analysis...');
    const geminiStartTime = Date.now();

    geminiScores = await scoreFramesWithGemini(
      input.videoPath,
      input.niche,
      input.ffmpegFeatures?.duration_seconds,
    );

    if (geminiScores) {
      usedGemini = true;
      const geminiLatency = Date.now() - geminiStartTime;
      console.log(`[VisualRubric] Gemini Vision scores received in ${geminiLatency}ms — blending with rule-based`);
    } else {
      console.log('[VisualRubric] Gemini Vision unavailable — using rule-based only');
    }
  } else {
    console.log('[VisualRubric] No video path (text-only prediction) — rule-based only');
  }

  // Blend scores: 40% rule-based + 60% Gemini when available, 100% rule-based otherwise
  const finalVisualHook = blendScores(visualHookScore, geminiScores?.visual_hook, 'Visual Hook');
  const finalPacing = blendScores(pacingScore, geminiScores?.pacing, 'Pacing');
  const finalPatternInterrupts = blendScores(patternInterruptsScore, geminiScores?.pattern_interrupts, 'Pattern Interrupts');
  const finalVisualClarity = blendScores(visualClarityScore, geminiScores?.visual_clarity, 'Visual Clarity');
  const finalStyleFit = blendScores(styleFitScore, geminiScores?.style_fit, 'Style Fit');

  // Calculate overall score (weighted average, scaled to 0-100)
  const weights = {
    visualHook: 0.25,      // Hook is critical for engagement
    pacing: 0.20,          // Pacing affects retention
    patternInterrupts: 0.20, // Keeps attention
    visualClarity: 0.15,   // Quality matters but less than engagement
    styleFit: 0.20,        // Niche fit affects performance
  };

  const overallScore = Math.round(
    (finalVisualHook.score * weights.visualHook +
      finalPacing.score * weights.pacing +
      finalPatternInterrupts.score * weights.patternInterrupts +
      finalVisualClarity.score * weights.visualClarity +
      finalStyleFit.score * weights.styleFit) *
      10 // Scale to 0-100
  );

  const latencyMs = Date.now() - startTime;

  const result: VisualRubricResult = {
    pack: 'V',
    visual_hook_score: finalVisualHook,
    pacing_score: finalPacing,
    pattern_interrupts_score: finalPatternInterrupts,
    visual_clarity_score: finalVisualClarity,
    style_fit_score: finalStyleFit,
    overall_visual_score: overallScore,
    signal_coverage: signalCoverage,
    _meta: {
      source: 'real',
      provider: usedGemini ? 'google-ai+rule-based' : 'rule-based',
      latency_ms: latencyMs,
    },
  };

  // Validate with Zod
  try {
    VisualRubricResultSchema.parse(result);
    console.log(`[VisualRubric] Analysis complete: overall=${overallScore}/100 in ${latencyMs}ms (provider: ${result._meta.provider})`);
  } catch (validationError) {
    console.error('[VisualRubric] Validation error:', validationError);
    // Return stub on validation failure
    return createVisualRubricStub();
  }

  return result;
}

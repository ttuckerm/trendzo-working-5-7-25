/**
 * Gemini Vision Scorer for Pack V
 *
 * Extracts key frames from a video file, sends them to Gemini Vision,
 * and returns structured scores for Pack V's 5 visual dimensions.
 *
 * This is additive — Pack V always computes rule-based scores first.
 * Gemini Vision scores are blended in when available.
 * On any failure, returns null so the caller falls back to rule-based only.
 */

import { GoogleGenAI } from '@google/genai';
import { extractThumbnails } from '@/lib/services/ffmpeg-service';
import fs from 'fs';

// ============================================================================
// Types
// ============================================================================

export interface GeminiVisionScores {
  visual_hook: { score: number; reasoning: string };
  pacing: { score: number; reasoning: string };
  pattern_interrupts: { score: number; reasoning: string };
  visual_clarity: { score: number; reasoning: string };
  style_fit: { score: number; reasoning: string };
}

// ============================================================================
// Gemini Vision Analysis
// ============================================================================

/**
 * Extract key frames from a video and score them with Gemini Vision.
 * Returns null on any failure — caller should fall back to rule-based only.
 */
export async function scoreFramesWithGemini(
  videoPath: string,
  niche?: string,
  durationSeconds?: number,
): Promise<GeminiVisionScores | null> {
  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[GeminiVision] No API key available, skipping vision analysis');
    return null;
  }

  if (!fs.existsSync(videoPath)) {
    console.log(`[GeminiVision] Video file not found: ${videoPath}`);
    return null;
  }

  let framePaths: string[] = [];

  try {
    // Step 1: Extract key frames
    const frames = await extractKeyFrames(videoPath, durationSeconds);
    framePaths = frames.map(f => f.path);

    if (framePaths.length === 0) {
      console.log('[GeminiVision] No frames extracted, skipping');
      return null;
    }

    console.log(`[GeminiVision] Extracted ${framePaths.length} key frames`);

    // Step 2: Send frames to Gemini Vision
    const ai = new GoogleGenAI({ apiKey });
    const scores = await analyzeFramesWithGemini(ai, framePaths, niche);

    return scores;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[GeminiVision] Vision analysis failed (graceful fallback): ${msg}`);
    return null;
  } finally {
    // Step 3: Clean up temp frame files
    await cleanupFrames(framePaths);
  }
}

// ============================================================================
// Frame Extraction
// ============================================================================

/**
 * Extract 5 representative frames: first, 25%, 50%, 75%, last.
 * Uses existing FFmpeg extractThumbnails infrastructure.
 */
async function extractKeyFrames(
  videoPath: string,
  durationSeconds?: number,
): Promise<{ timestamp: number; path: string }[]> {
  // Use provided duration or default to 30s (safe guess — FFmpeg will clamp)
  const duration = durationSeconds && durationSeconds > 0 ? durationSeconds : 30;

  // Calculate timestamps: first frame (0.5s in), 25%, 50%, 75%, near-end
  const timestamps: number[] = [];
  const safeStart = Math.min(0.5, duration * 0.05);
  const safeEnd = Math.max(duration - 0.5, duration * 0.95);

  timestamps.push(safeStart);                          // ~first frame
  timestamps.push(Math.max(safeStart, duration * 0.25)); // 25%
  timestamps.push(Math.max(safeStart, duration * 0.50)); // 50%
  timestamps.push(Math.max(safeStart, duration * 0.75)); // 75%
  timestamps.push(safeEnd);                             // ~last frame

  // Deduplicate timestamps that are very close (for very short videos)
  const uniqueTimestamps = timestamps.reduce<number[]>((acc, ts) => {
    if (acc.length === 0 || Math.abs(ts - acc[acc.length - 1]) >= 0.3) {
      acc.push(Math.round(ts * 10) / 10); // Round to 1 decimal
    }
    return acc;
  }, []);

  console.log(`[GeminiVision] Extracting frames at timestamps: ${uniqueTimestamps.join(', ')}s (duration: ${duration}s)`);

  const frames = await extractThumbnails(videoPath, {
    timestamps: uniqueTimestamps,
    width: 512,      // Reasonable size for Gemini Vision — not too large, not too small
    quality: 3,       // Good quality JPEG
    format: 'jpg',
  });

  return frames;
}

// ============================================================================
// Gemini Vision API Call
// ============================================================================

/**
 * Send extracted frames to Gemini Vision with a structured prompt.
 * Returns parsed scores or null on failure.
 */
async function analyzeFramesWithGemini(
  ai: GoogleGenAI,
  framePaths: string[],
  niche?: string,
): Promise<GeminiVisionScores | null> {
  // Build image parts from frame files
  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

  for (const framePath of framePaths) {
    const imageBuffer = fs.readFileSync(framePath);
    const base64 = imageBuffer.toString('base64');
    imageParts.push({
      inlineData: { mimeType: 'image/jpeg', data: base64 },
    });
  }

  const prompt = buildVisionPrompt(framePaths.length, niche);

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        ...imageParts,
        { text: prompt },
      ],
    }],
  });

  const responseText = result.text || '';
  return parseGeminiVisionResponse(responseText);
}

/**
 * Build the Gemini Vision prompt for Pack V's 5 dimensions.
 */
function buildVisionPrompt(frameCount: number, niche?: string): string {
  const nicheContext = niche
    ? `The video is in the "${niche}" niche on TikTok/short-form video.`
    : 'This is a TikTok/short-form video.';

  return `You are analyzing ${frameCount} key frames extracted from a short-form video. ${nicheContext}

Score these 5 visual dimensions on a scale of 1-10 (1=poor, 10=excellent). Be honest and critical.

1. **Visual Hook** (first impression): Does the opening frame grab attention? Are there faces, bold text, vibrant colors, or compelling visuals that would stop someone from scrolling?

2. **Pacing** (visual rhythm): Based on the frame sequence, does the video appear to have good visual pacing? Do the frames show variety and progression, or does it look static?

3. **Pattern Interrupts** (visual variety): Do the frames show different scenes, angles, or visual elements? Or do they all look similar (same framing, same background)?

4. **Visual Clarity** (production quality): Are the frames well-lit, sharp, and well-composed? Is the resolution good? Are colors balanced?

5. **Style Fit** (niche appropriateness): Do the visuals match what performs well in this content category? Does the visual style feel professional and intentional?

Return ONLY a JSON object in this exact format, no other text:
{
  "visual_hook": { "score": 7, "reasoning": "Brief explanation" },
  "pacing": { "score": 6, "reasoning": "Brief explanation" },
  "pattern_interrupts": { "score": 5, "reasoning": "Brief explanation" },
  "visual_clarity": { "score": 8, "reasoning": "Brief explanation" },
  "style_fit": { "score": 7, "reasoning": "Brief explanation" }
}`;
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse Gemini's JSON response into structured scores.
 * Returns null if parsing fails.
 */
function parseGeminiVisionResponse(responseText: string): GeminiVisionScores | null {
  try {
    let cleaned = responseText.trim();

    // Strip markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);

    // Validate all 5 dimensions exist with valid scores
    const dimensions = ['visual_hook', 'pacing', 'pattern_interrupts', 'visual_clarity', 'style_fit'] as const;
    for (const dim of dimensions) {
      if (!parsed[dim] || typeof parsed[dim].score !== 'number') {
        console.error(`[GeminiVision] Missing or invalid dimension: ${dim}`);
        return null;
      }
      // Clamp scores to 1-10
      parsed[dim].score = Math.min(10, Math.max(1, Math.round(parsed[dim].score * 10) / 10));
      // Default reasoning if missing
      if (typeof parsed[dim].reasoning !== 'string') {
        parsed[dim].reasoning = '';
      }
    }

    console.log(`[GeminiVision] Parsed scores: hook=${parsed.visual_hook.score}, pacing=${parsed.pacing.score}, interrupts=${parsed.pattern_interrupts.score}, clarity=${parsed.visual_clarity.score}, style=${parsed.style_fit.score}`);

    return parsed as GeminiVisionScores;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[GeminiVision] Failed to parse response: ${msg}`);
    console.error(`[GeminiVision] Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
    return null;
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Remove temporary frame files.
 */
async function cleanupFrames(framePaths: string[]): Promise<void> {
  for (const p of framePaths) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {
      // Best-effort cleanup — don't fail on cleanup errors
    }
  }
}

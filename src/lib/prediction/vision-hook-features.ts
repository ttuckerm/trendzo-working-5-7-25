/**
 * Vision Hook Features — Gemini Vision analysis of opening frames
 *
 * Extracts 4 features from the first frames of a video:
 *   1. hook_face_present        — binary: human face in frame 1?
 *   2. hook_text_overlay         — binary: text overlay in first 3s?
 *   3. hook_composition_score    — 1-10: how attention-grabbing is frame 1?
 *   4. hook_emotion_intensity    — 1-10: facial expression intensity (0 if no face)
 *
 * Uses Gemini Vision (gemini-2.5-flash) via @google/genai SDK.
 * Graceful fallback: returns null features on any failure.
 */

import { GoogleGenAI } from '@google/genai';
import { extractThumbnails } from '../services/ffmpeg-service';
import fs from 'fs';

// ============================================================================
// Types
// ============================================================================

export interface VisionHookFeatures {
  hook_face_present: number;       // 0 or 1
  hook_text_overlay: number;       // 0 or 1
  hook_composition_score: number;  // 1-10
  hook_emotion_intensity: number;  // 0-10 (0 if no face)
}

// ============================================================================
// Main
// ============================================================================

const VISION_TIMEOUT = 45_000;

/**
 * Extract vision hook features from a video file.
 * Returns null on any failure (no API key, no video, Gemini error, timeout).
 */
export async function extractVisionHookFeatures(
  videoPath: string,
): Promise<VisionHookFeatures | null> {
  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[VisionHook] No API key available, skipping vision hook features');
    return null;
  }

  if (!fs.existsSync(videoPath)) {
    console.log(`[VisionHook] Video file not found: ${videoPath}`);
    return null;
  }

  let framePaths: string[] = [];

  try {
    // Extract 2 frames: first frame (0.1s) and frame at 1.5s
    const frames = await extractThumbnails(videoPath, {
      timestamps: [0.1, 1.5],
      width: 512,
      quality: 3,
      format: 'jpg',
    });

    framePaths = frames.map(f => f.path);

    if (framePaths.length === 0) {
      console.log('[VisionHook] No frames extracted, skipping');
      return null;
    }

    console.log(`[VisionHook] Extracted ${framePaths.length} frames`);

    // Read frames to base64
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (const fp of framePaths) {
      const buf = fs.readFileSync(fp);
      imageParts.push({
        inlineData: { mimeType: 'image/jpeg', data: buf.toString('base64') },
      });
    }

    // Call Gemini Vision with timeout
    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildPrompt(framePaths.length);

    const result = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [
            ...imageParts,
            { text: prompt },
          ],
        }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini Vision timeout')), VISION_TIMEOUT)
      ),
    ]);

    const responseText = result.text || '';
    return parseResponse(responseText);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[VisionHook] Failed (graceful fallback): ${msg}`);
    return null;
  } finally {
    // Clean up temp frame files
    for (const p of framePaths) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {
        // Best-effort cleanup
      }
    }
  }
}

// ============================================================================
// Prompt
// ============================================================================

function buildPrompt(frameCount: number): string {
  const frameDesc = frameCount >= 2
    ? 'Image 1 is the first frame (0.1s). Image 2 is at 1.5 seconds.'
    : 'Image 1 is the first frame (0.1s).';

  return `You are analyzing ${frameCount} frame(s) from the opening of a short-form video (TikTok/Reels). ${frameDesc}

Answer these 4 questions about the video opening:

1. **Face Present**: Is there a human face clearly visible in the first frame (Image 1)?
   Answer: 1 (yes, face visible) or 0 (no face)

2. **Text Overlay**: Is there designed text overlaid on the video (NOT auto-generated captions/subtitles, but intentional text overlays like titles, hooks, or annotations) visible in any of the frames?
   Answer: 1 (text overlay present) or 0 (no text overlay)

3. **Composition Score**: How attention-grabbing is the opening frame (Image 1)? Consider: bold colors, interesting framing, visual contrast, whether it would stop someone scrolling.
   Answer: integer 1-10 (1=boring/generic, 10=extremely eye-catching)

4. **Emotion Intensity**: If a face is present in Image 1, how expressive is it? (surprise, excitement, concern, laughter, etc.)
   Answer: integer 0-10 (0=no face present, 1=neutral/deadpan, 10=extremely expressive)

Return ONLY a JSON object in this exact format, no other text:
{
  "hook_face_present": 0,
  "hook_text_overlay": 1,
  "hook_composition_score": 7,
  "hook_emotion_intensity": 0
}`;
}

// ============================================================================
// Response Parsing
// ============================================================================

function parseResponse(responseText: string): VisionHookFeatures | null {
  try {
    let cleaned = responseText.trim();

    // Strip markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);

    // Validate and clamp
    const face = parsed.hook_face_present === 1 ? 1 : 0;
    const text = parsed.hook_text_overlay === 1 ? 1 : 0;

    let composition = typeof parsed.hook_composition_score === 'number'
      ? Math.round(parsed.hook_composition_score)
      : 5; // default if parsing fails
    composition = Math.min(10, Math.max(1, composition));

    let emotion = typeof parsed.hook_emotion_intensity === 'number'
      ? Math.round(parsed.hook_emotion_intensity)
      : (face === 1 ? 5 : 0);
    emotion = face === 0 ? 0 : Math.min(10, Math.max(0, emotion));

    const result: VisionHookFeatures = {
      hook_face_present: face,
      hook_text_overlay: text,
      hook_composition_score: composition,
      hook_emotion_intensity: emotion,
    };

    console.log(`[VisionHook] Parsed: face=${face}, text=${text}, composition=${composition}, emotion=${emotion}`);
    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[VisionHook] Failed to parse response: ${msg}`);
    console.error(`[VisionHook] Raw (first 300): ${responseText.substring(0, 300)}`);
    return null;
  }
}

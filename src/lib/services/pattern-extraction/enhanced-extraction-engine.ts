/**
 * Enhanced Pattern Extraction Engine (v2)
 * Extracts detailed 9-field breakdown for EACH video
 */

import { randomUUID } from 'crypto';
import { LLMWrapper } from '@/lib/llm/wrapper';
import type {
  VideoForDetailedExtraction,
  ExtractedVideoPattern,
  EnhancedBatchExtractionResponse,
  EnhancedPatternExtractionConfig,
  DEFAULT_ENHANCED_PATTERN_CONFIG,
} from './types-enhanced';
import { EnhancedBatchExtractionResponseSchema } from './types-enhanced';

const llmWrapper = new LLMWrapper();

// =====================================================
// Enhanced Prompt Generation
// =====================================================

/**
 * Build detailed extraction prompt for individual videos
 */
export function buildEnhancedExtractionPrompt(
  videos: VideoForDetailedExtraction[],
  niche: string
): string {
  const videoDetails = videos.map((v, i) => {
    const transcript = v.transcript?.substring(0, 1000) || 'No transcript available';
    const title = v.title || 'No title';
    const description = v.description?.substring(0, 300) || 'No description';
    
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIDEO ${i + 1}: ${v.videoId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${title}
Description: ${description}
Hashtags: ${v.hashtags?.join(', ') || 'None'}
DPS Score: ${v.dpsScore} (Top ${(100 - v.dpsPercentile).toFixed(1)}%)
Views: ${v.viewsCount.toLocaleString()} | Likes: ${v.likesCount?.toLocaleString() || '0'}

TRANSCRIPT (first 1000 chars):
${transcript}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }).join('\n\n');

  return `You are an expert viral content analyst specializing in the "${niche}" niche.

Your task is to analyze each video and extract a DETAILED 9-FIELD BREAKDOWN of its viral patterns.

🎯 **THE 9 FIELDS (7 Idea Legos with Hook broken down):**

1. **topic** (string): Core subject matter - what is this fundamentally about?
   Example: "Banking mistakes"

2. **angle** (string): Unique perspective, premise, or approach - what makes this different?
   Example: "What NOT to do"

3. **hook_spoken** (string): The EXACT words spoken in first 3 seconds (or paraphrased if no transcript)
   Example: "If you save money like this..."

4. **hook_text** (string): On-screen text visible during the hook (first 3 seconds)
   Example: "❌ Worst banks"
   (If none visible, write "No text overlay")

5. **hook_visual** (string): What's visually shown during the hook
   Example: "Talking head pointing at camera"

6. **story** (string): How the narrative flows (beginning → middle → end)
   Example: "List (3-5 items)"

7. **visuals** (string): Overall visual presentation style throughout the video
   Example: "Talking head + text overlays"

8. **key_elements** (array of strings): Specific recurring visual elements (2-8 items)
   Example: ["Red X graphics", "Bank logos", "Hand gestures"]

9. **audio** (string): Music, sound effects, voice-over style
   Example: "Upbeat music"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📹 **VIDEOS TO ANALYZE:**

${videoDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ **INSTRUCTIONS:**

1. Analyze EACH video individually and extract ALL 9 fields
2. Base your analysis primarily on the TRANSCRIPT (what's spoken)
3. Infer visual/audio elements from context clues in transcript and title
4. Be SPECIFIC and DETAILED - avoid generic descriptions
5. For hook_spoken, use exact quotes when available
6. For key_elements, list 3-8 specific items (not generic descriptions)
7. Include a confidence score (0-1) based on how much information was available

📋 **RETURN FORMAT:**

Return a JSON object with this EXACT structure:

{
  "patterns": [
    {
      "video_id": "VIDEO_ID_HERE",
      "topic": "...",
      "angle": "...",
      "hook_spoken": "...",
      "hook_text": "...",
      "hook_visual": "...",
      "story": "...",
      "visuals": "...",
      "key_elements": ["element1", "element2", "element3"],
      "audio": "...",
      "confidence": 0.85
    }
  ],
  "summary": "Optional brief summary of common patterns across these videos"
}

🚨 **CRITICAL REQUIREMENTS:**
- Return ONLY valid JSON (no markdown, no code blocks)
- Include ALL ${videos.length} videos in the response
- Each pattern must have ALL 9 fields + confidence
- Be specific and actionable (not generic)
- Confidence should be >= 0.7 (if less, note what information was missing)

Begin analysis now.`;
}

// =====================================================
// Extraction Function
// =====================================================

/**
 * Extract detailed patterns from videos using GPT-4
 */
export async function extractEnhancedPatternsFromVideos(
  videos: VideoForDetailedExtraction[],
  niche: string,
  config: EnhancedPatternExtractionConfig = DEFAULT_ENHANCED_PATTERN_CONFIG
): Promise<{
  patterns: ExtractedVideoPattern[];
  llmTokensUsed: number;
  llmCostUsd: number;
  llmCallsCount: number;
}> {
  if (videos.length === 0) {
    return {
      patterns: [],
      llmTokensUsed: 0,
      llmCostUsd: 0,
      llmCallsCount: 0,
    };
  }

  const allPatterns: ExtractedVideoPattern[] = [];
  let totalTokensUsed = 0;
  let totalCostUsd = 0;
  let totalCalls = 0;

  // Process videos in smaller batches for detailed extraction
  const batchSize = config.maxVideosPerLLMCall;
  const batches: VideoForDetailedExtraction[][] = [];
  for (let i = 0; i < videos.length; i += batchSize) {
    batches.push(videos.slice(i, i + batchSize));
  }

  console.log(`[Enhanced Pattern Engine] Processing ${batches.length} batches (${videos.length} total videos, ${batchSize} per batch)`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    try {
      const prompt = buildEnhancedExtractionPrompt(batch, niche);
      console.log(`[Enhanced Pattern Engine] Batch ${batchIndex + 1}/${batches.length}: Analyzing ${batch.length} videos...`);

      // Call LLM with structured output
      const result = await llmWrapper.callLLM({
        ctx: {
          auditId: `enhanced_pattern_extraction_${randomUUID()}`,
          role: 'Scout',
          model: {
            provider: 'openai',
            name: config.llmModel,
          },
          budget: {
            maxOutputTokens: config.llmMaxTokens,
          },
        },
        schema: EnhancedBatchExtractionResponseSchema,
        messages: [
          {
            role: 'system',
            content: `You are an expert viral content analyst. Extract detailed, specific patterns from each video. Return ONLY valid JSON matching the exact schema provided. No markdown, no code blocks, no additional text.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.llmTemperature,
        maxTokens: config.llmMaxTokens,
      });

      // Track LLM usage
      const tokensUsed = (result.meta.tokens?.input || 0) + (result.meta.tokens?.output || 0);
      totalTokensUsed += tokensUsed;
      totalCostUsd += result.meta.costUsd || 0;
      totalCalls += 1;

      console.log(`[Enhanced Pattern Engine] Batch ${batchIndex + 1} complete - Tokens: ${tokensUsed}, Cost: $${(result.meta.costUsd || 0).toFixed(4)}`);

      // Extract patterns from response
      if (result.data) {
        const response = result.data as EnhancedBatchExtractionResponse;
        console.log(`[Enhanced Pattern Engine] Extracted ${response.patterns?.length || 0} detailed patterns from LLM`);

        // Convert to internal format and filter by confidence
        const validPatterns = response.patterns
          .filter(p => p.confidence >= config.minConfidenceScore)
          .map(p => ({
            videoId: p.video_id,
            topic: p.topic,
            angle: p.angle,
            hookSpoken: p.hook_spoken,
            hookText: p.hook_text,
            hookVisual: p.hook_visual,
            storyStructure: p.story,
            visualFormat: p.visuals,
            keyVisualElements: p.key_elements,
            audioDescription: p.audio,
            confidence: p.confidence,
          }));

        console.log(`[Enhanced Pattern Engine] ${validPatterns.length}/${response.patterns.length} patterns passed confidence threshold (>= ${config.minConfidenceScore})`);
        
        // Log sample pattern for debugging
        if (validPatterns.length > 0) {
          console.log('[Enhanced Pattern Engine] Sample pattern:', JSON.stringify(validPatterns[0], null, 2));
        }
        
        allPatterns.push(...validPatterns);
      } else {
        console.error('[Enhanced Pattern Engine] LLM extraction failed: no data returned');
      }

      // Add delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        console.log('[Enhanced Pattern Engine] Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`[Enhanced Pattern Engine] Error extracting patterns from batch ${batchIndex + 1}:`, error);
      // Continue with next batch instead of failing entirely
    }
  }

  console.log(`[Enhanced Pattern Engine] Complete! Extracted ${allPatterns.length} total patterns`);
  console.log(`[Enhanced Pattern Engine] Total: ${totalCalls} LLM calls, ${totalTokensUsed} tokens, $${totalCostUsd.toFixed(4)}`);

  return {
    patterns: allPatterns,
    llmTokensUsed: totalTokensUsed,
    llmCostUsd: totalCostUsd,
    llmCallsCount: totalCalls,
  };
}

/**
 * Utility: Sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


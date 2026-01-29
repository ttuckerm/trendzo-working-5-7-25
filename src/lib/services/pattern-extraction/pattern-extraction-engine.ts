/**
 * FEAT-003: Pattern Extraction Engine
 * 
 * Core logic for extracting viral patterns from video metadata using LLM
 * Handles LLM prompting, response parsing, and pattern validation
 * 
 * @module pattern-extraction-engine
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { LLMWrapper } from '@/lib/llm/wrapper';
import type {
  VideoForExtraction,
  ExtractedPattern,
  LLMExtractionResponse,
  VideoMetadataForLLM,
  PatternType,
  PatternErrorCode,
  PATTERN_ERROR_CODES,
  PatternExtractionConfig,
  DEFAULT_PATTERN_CONFIG,
} from './types';

// Initialize LLM wrapper
const llmWrapper = new LLMWrapper();

// =====================================================
// Constants
// =====================================================

const PATTERN_TYPES: PatternType[] = [
  'topic',
  'angle',
  'hook_structure',
  'story_structure',
  'visual_format',
  'key_visuals',
  'audio',
];

// =====================================================
// Validation Schemas
// =====================================================

/**
 * Zod schema for single extracted pattern
 */
const ExtractedPatternSchema = z.object({
  type: z.enum([
    'topic',
    'angle',
    'hook_structure',
    'story_structure',
    'visual_format',
    'key_visuals',
    'audio',
  ]),
  description: z.string().min(5).max(500),
  confidence: z.number().min(0).max(1),
  details: z.record(z.any()).optional(),
});

/**
 * Zod schema for LLM extraction response
 */
const LLMExtractionResponseSchema = z.object({
  patterns: z.array(ExtractedPatternSchema),
  summary: z.string().optional(),
});

// =====================================================
// Core Extraction Functions
// =====================================================

/**
 * Generate LLM prompt for pattern extraction
 */
export function buildPatternExtractionPrompt(
  videos: VideoForExtraction[],
  niche: string
): string {
  const videoMetadata = videos.map(v => prepareVideoMetadata(v));
  
  return `You are an expert viral content analyst specializing in the "${niche}" niche. 
Your task is to analyze TikTok videos and extract the 7 Idea Legos (viral patterns) that make them successful.

**THE 7 IDEA LEGOS:**
1. **Topic**: The core subject matter or theme (e.g., "budgeting tips", "workout routines")
2. **Angle**: The unique perspective or approach (e.g., "controversial take", "beginner-friendly", "myth-busting")
3. **Hook Structure**: How the video captures attention in first 3 seconds (e.g., "shocking statistic", "pattern interrupt", "bold claim")
4. **Story Structure**: How the narrative unfolds (e.g., "problem-solution", "before-after", "list format")
5. **Visual Format**: The visual presentation style (e.g., "talking head", "text overlay on B-roll", "screen recording")
6. **Key Visuals**: Distinctive visual elements (e.g., "hand gestures", "product close-ups", "meme templates")
7. **Audio**: Sound strategy (e.g., "trending sound", "original voiceover", "background music type")

**VIDEOS TO ANALYZE:**
${videoMetadata.map((v, i) => `
Video ${i + 1} (DPS: ${v.dpsScore}):
- Title: ${v.title}
- Description: ${v.description}
- Hashtags: ${v.hashtags.join(', ')}
- Engagement: ${v.engagement.views.toLocaleString()} views, ${v.engagement.likes.toLocaleString()} likes
${v.visual ? `- Visual Quality: ${v.visual.resolution || 'unknown'} @ ${v.visual.fps || 'unknown'}fps, Duration: ${v.visual.durationMs ? Math.round(v.visual.durationMs / 1000) + 's' : 'unknown'}, Hook Cuts: ${v.visual.hookSceneChanges || 'unknown'}, Quality: ${v.visual.qualityScore ? (v.visual.qualityScore * 100).toFixed(0) + '%' : 'unknown'}` : ''}
`).join('\n')}

**INSTRUCTIONS:**
1. Identify common patterns across these high-performing videos
2. For each pattern, specify which of the 7 Idea Legos it represents
3. Provide a clear, actionable description of the pattern
4. Rate your confidence (0-1) in each pattern identification
5. Focus on patterns that appear multiple times or have strong signals
6. Be specific but concise - descriptions should be 1-2 sentences max
7. **USE VISUAL QUALITY DATA**: When available, use resolution, FPS, hook cuts, and quality scores to identify **visual_format** and **key_visuals** patterns (e.g., "High-quality 1080p with 60fps for smooth motion", "2-3 hook cuts in first 3 seconds for attention retention")

**IMPORTANT:**
- Only extract patterns you are confident about (confidence >= 0.7)
- Patterns should be actionable and specific to the "${niche}" niche
- Avoid generic patterns that apply to all content
- If a pattern type doesn't apply, don't force it
- **Visual intelligence data (resolution, FPS, hook cuts) is critical for identifying production quality patterns**

Return your analysis as a JSON object following this structure:
{
  "patterns": [
    {
      "type": "topic" | "angle" | "hook_structure" | "story_structure" | "visual_format" | "key_visuals" | "audio",
      "description": "Clear, specific description of the pattern",
      "confidence": 0.0-1.0,
      "details": { optional additional context }
    }
  ],
  "summary": "Optional brief summary of overall trends"
}`;
}

/**
 * Prepare video metadata for LLM prompt
 */
function prepareVideoMetadata(video: VideoForExtraction): VideoMetadataForLLM {
  return {
    title: video.title || 'No title',
    description: video.description || 'No description',
    hashtags: video.hashtags || [],
    dpsScore: video.dpsScore,
    engagement: {
      views: video.viewsCount,
      likes: video.likesCount || 0,
      comments: video.commentsCount || 0,
      shares: video.sharesCount || 0,
    },
    // Include FFmpeg visual intelligence if available
    visual: video.visualData,
  };
}

/**
 * Extract patterns from a batch of videos using LLM
 * 
 * @param videos - Array of videos to analyze
 * @param niche - Content niche
 * @param config - Extraction configuration
 * @returns Extracted patterns with metadata
 */
export async function extractPatternsFromVideos(
  videos: VideoForExtraction[],
  niche: string,
  config: PatternExtractionConfig = DEFAULT_PATTERN_CONFIG
): Promise<{
  patterns: ExtractedPattern[];
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

  const allPatterns: ExtractedPattern[] = [];
  let totalTokensUsed = 0;
  let totalCostUsd = 0;
  let totalCalls = 0;

  // Process videos in batches to avoid token limits
  const batchSize = config.maxVideosPerLLMCall;
  const batches = chunkArray(videos, batchSize);

  console.log(`[Pattern Engine] Processing ${batches.length} batches (${videos.length} total videos, ${batchSize} per batch)`);

  for (const batch of batches) {
    try {
      const prompt = buildPatternExtractionPrompt(batch, niche);
      console.log(`[Pattern Engine] Calling LLM for batch of ${batch.length} videos...`);

      // Call LLM with structured output
      const result = await llmWrapper.callLLM({
        ctx: {
          auditId: `pattern_extraction_${randomUUID()}`,
          role: 'Scout',
          model: {
            provider: 'openai',
            name: config.llmModel,
          },
          budget: {
            maxOutputTokens: config.llmMaxTokens,
          },
        },
        schema: LLMExtractionResponseSchema,
        messages: [
          {
            role: 'system',
            content: `You are an expert viral content analyst. Extract actionable patterns from high-performing videos. Always return valid JSON matching the exact schema provided.`,
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

      console.log(`[Pattern Engine] LLM result - Tokens: ${tokensUsed}, Cost: $${(result.meta.costUsd || 0).toFixed(4)}`);

      // Extract patterns from response
      if (result.data) {
        const response = result.data as LLMExtractionResponse;
        console.log(`[Pattern Engine] Extracted ${response.patterns?.length || 0} patterns from LLM`);

        // Filter patterns by confidence threshold
        const validPatterns = response.patterns.filter(
          p => p.confidence >= config.minConfidenceScore
        );

        console.log(`[Pattern Engine] ${validPatterns.length} patterns passed confidence threshold (>= ${config.minConfidenceScore})`);
        allPatterns.push(...validPatterns);
      } else {
        console.error('[Pattern Engine] LLM extraction failed: no data returned');
      }

      // Add delay between batches to avoid rate limiting
      if (batches.length > 1) {
        await sleep(1000);
      }
    } catch (error) {
      console.error('Error extracting patterns from batch:', error);
      // Continue with next batch instead of failing entirely
    }
  }

  return {
    patterns: allPatterns,
    llmTokensUsed: totalTokensUsed,
    llmCostUsd: totalCostUsd,
    llmCallsCount: totalCalls,
  };
}

/**
 * Validate extracted pattern
 */
export function validateExtractedPattern(pattern: unknown): ExtractedPattern | null {
  try {
    return ExtractedPatternSchema.parse(pattern);
  } catch (error) {
    console.error('Invalid pattern format:', error);
    return null;
  }
}

/**
 * Deduplicate patterns by description similarity
 * Groups similar patterns together and keeps the one with highest confidence
 */
export function deduplicatePatterns(
  patterns: ExtractedPattern[],
  similarityThreshold: number = 0.8
): ExtractedPattern[] {
  const deduped: ExtractedPattern[] = [];
  const seen = new Set<string>();

  // Group by pattern type first
  const byType = groupBy(patterns, p => p.type);

  for (const [type, typePatterns] of Object.entries(byType)) {
    // Sort by confidence descending
    const sorted = typePatterns.sort((a, b) => b.confidence - a.confidence);

    for (const pattern of sorted) {
      const normalizedDesc = normalizeDescription(pattern.description);
      
      // Check if we've seen a similar pattern
      let isDuplicate = false;
      for (const seenDesc of seen) {
        if (calculateSimilarity(normalizedDesc, seenDesc) >= similarityThreshold) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        deduped.push(pattern);
        seen.add(normalizedDesc);
      }
    }
  }

  return deduped;
}

/**
 * Normalize pattern description for comparison
 */
function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate simple Jaccard similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Group array elements by key
 */
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate audit ID for tracking
 */
export function generateAuditId(): string {
  return `audit_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

/**
 * Generate batch ID for tracking
 */
export function generateBatchId(): string {
  return `batch_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

// =====================================================
// Exports
// =====================================================

export const PatternExtractionEngine = {
  extractPatternsFromVideos,
  buildPatternExtractionPrompt,
  validateExtractedPattern,
  deduplicatePatterns,
  generateAuditId,
  generateBatchId,
};

export default PatternExtractionEngine;


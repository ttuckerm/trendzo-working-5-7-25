/**
 * FEAT-007: Idea Legos Extraction Service
 * Uses GPT-4 to extract the 7 core elements (Idea Legos) from a script/storyboard
 */

import OpenAI from 'openai';
import { IdeaLegos } from '@/types/pre-content-prediction';

// ============================================================================
// Configuration
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Extraction Prompt
// ============================================================================

const EXTRACTION_PROMPT = `You are an expert at deconstructing viral content into its core components.

Analyze the following script/storyboard and extract the 7 "Idea Legos" - the fundamental building blocks of viral content:

1. **Topic**: What is this content fundamentally about? (1-2 sentences)
2. **Angle**: What unique perspective, premise, or twist makes this different? (1-2 sentences)
3. **Hook Structure**: How does it grab attention in the first 3 seconds? What pattern? (1 sentence)
4. **Story Structure**: How does the narrative flow? What's the beginning → middle → end arc? (1-2 sentences)
5. **Visual Format**: What is the primary visual style/format? (POV, talking head, B-roll montage, etc.) (1 sentence)
6. **Key Visuals**: What specific visual elements or moments will appear? (1-2 sentences)
7. **Audio**: What style of music, sound effects, or voice-over? (1 sentence)

Return your analysis as a JSON object with exactly these keys:
{
  "topic": "...",
  "angle": "...",
  "hookStructure": "...",
  "storyStructure": "...",
  "visualFormat": "...",
  "keyVisuals": "...",
  "audio": "..."
}

Return ONLY the JSON object, no additional text.`;

// ============================================================================
// Extraction Service
// ============================================================================

/**
 * Extract Idea Legos from script using GPT-4
 */
export async function extractIdeaLegos(
  script: string,
  storyboard?: string
): Promise<IdeaLegos> {
  try {
    const contentToAnalyze = storyboard
      ? `Script:\n${script}\n\nStoryboard:\n${storyboard}`
      : `Script:\n${script}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use gpt-4o-mini which supports JSON mode and is cheaper
      messages: [
        {
          role: 'system',
          content: EXTRACTION_PROMPT,
        },
        {
          role: 'user',
          content: contentToAnalyze,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from GPT-4');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate all required fields are present
    const requiredFields = [
      'topic',
      'angle',
      'hookStructure',
      'storyStructure',
      'visualFormat',
      'keyVisuals',
      'audio',
    ];

    for (const field of requiredFields) {
      if (!parsed[field] || typeof parsed[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    return {
      topic: parsed.topic.trim(),
      angle: parsed.angle.trim(),
      hookStructure: parsed.hookStructure.trim(),
      storyStructure: parsed.storyStructure.trim(),
      visualFormat: parsed.visualFormat.trim(),
      keyVisuals: parsed.keyVisuals.trim(),
      audio: parsed.audio.trim(),
    };
  } catch (error) {
    console.error('Idea Legos extraction failed:', error);

    // If JSON parsing fails, provide a fallback
    if (error instanceof SyntaxError) {
      console.warn('Failed to parse GPT-4 response as JSON, using fallback extraction');
      return extractFallbackLegos(script, storyboard);
    }

    throw error;
  }
}

/**
 * Fallback extraction using simpler heuristics
 * Used if GPT-4 JSON parsing fails
 */
function extractFallbackLegos(script: string, storyboard?: string): IdeaLegos {
  const firstSentence = script.split(/[.!?]/)[0]?.trim() || script.substring(0, 100);
  const hasNumbers = /\d+/.test(firstSentence);
  const hasQuestion = /\?/.test(firstSentence);

  return {
    topic: `Content about ${firstSentence.toLowerCase().substring(0, 50)}...`,
    angle: 'Direct, straightforward approach',
    hookStructure: hasQuestion
      ? 'Opens with question'
      : hasNumbers
      ? 'Opens with specific number/stat'
      : 'Direct statement hook',
    storyStructure: 'Linear narrative flow',
    visualFormat: storyboard ? 'Structured storyboard format' : 'Talking head or screen recording',
    keyVisuals: storyboard || 'Visual elements from script description',
    audio: 'Voice narration with background music',
  };
}

/**
 * Batch extract Idea Legos for multiple scripts
 * Useful for analysis pipelines
 */
export async function batchExtractIdeaLegos(
  scripts: Array<{ script: string; storyboard?: string }>
): Promise<IdeaLegos[]> {
  const results = await Promise.allSettled(
    scripts.map(({ script, storyboard }) => extractIdeaLegos(script, storyboard))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Extraction failed for script ${index}:`, result.reason);
      return extractFallbackLegos(scripts[index].script, scripts[index].storyboard);
    }
  });
}

/**
 * Get a similarity score between two Idea Legos (0-100)
 * Useful for comparing scripts or finding similar content
 */
export function calculateLegosSimilarity(legos1: IdeaLegos, legos2: IdeaLegos): number {
  const fields: (keyof IdeaLegos)[] = [
    'topic',
    'angle',
    'hookStructure',
    'storyStructure',
    'visualFormat',
    'keyVisuals',
    'audio',
  ];

  let totalSimilarity = 0;

  for (const field of fields) {
    const text1 = legos1[field].toLowerCase();
    const text2 = legos2[field].toLowerCase();

    // Simple word overlap similarity
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    const similarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0;
    totalSimilarity += similarity;
  }

  return Math.round(totalSimilarity / fields.length);
}

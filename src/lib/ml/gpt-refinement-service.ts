/**
 * GPT-4 Refinement Service
 *
 * Qualitative analysis layer that refines XGBoost predictions
 * by analyzing transcript for viral hooks, emotional resonance, and unique angles
 */

import OpenAI from 'openai';
import { buildViralAnalysisPrompt, buildQuickAnalysisPrompt, type ViralAnalysisContext } from './prompts/viral-analysis-prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GPTRefinementInput {
  transcript: string;
  title: string;
  baseDpsPrediction: number;
  xgboostConfidence: number;
  topFeatures: {
    name: string;
    value: number;
    importance: number;
  }[];
  useQuickAnalysis?: boolean; // Use cheaper, faster analysis
}

export interface GPTRefinementOutput {
  adjustment: number;           // -20 to +20
  confidence: number;           // 0-100
  reasoning: string;
  viralHooks: string[];
  weaknesses: string[];
  recommendations: string[];
  overallAssessment?: string;
  llmModel: string;
  llmTokensUsed: number;
  llmCostUsd: number;
  processingTimeMs: number;
}

/**
 * Refine DPS prediction using GPT-4 analysis
 */
export async function refineWithGPT4(
  input: GPTRefinementInput
): Promise<GPTRefinementOutput> {
  const startTime = Date.now();

  try {
    const context: ViralAnalysisContext = {
      transcript: input.transcript,
      title: input.title,
      baseDpsPrediction: input.baseDpsPrediction,
      xgboostConfidence: input.xgboostConfidence,
      topFeatures: input.topFeatures.slice(0, 10), // Top 10 features only
    };

    // Choose prompt based on analysis type
    const prompt = input.useQuickAnalysis
      ? buildQuickAnalysisPrompt(context)
      : buildViralAnalysisPrompt(context);

    // Choose model based on analysis type
    const model = input.useQuickAnalysis ? 'gpt-4o-mini' : 'gpt-4o-mini';

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert viral content analyst. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const analysis = JSON.parse(responseText);

    // Calculate cost
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // GPT-4o-mini pricing: $0.150 per 1M input tokens, $0.600 per 1M output tokens
    const costUsd = (inputTokens * 0.150 + outputTokens * 0.600) / 1_000_000;

    const processingTimeMs = Date.now() - startTime;

    // Validate and clamp adjustment
    let adjustment = Number(analysis.adjustment) || 0;
    adjustment = Math.max(-20, Math.min(20, adjustment));

    // Validate confidence
    let confidence = Number(analysis.confidence) || 50;
    confidence = Math.max(0, Math.min(100, confidence));

    return {
      adjustment,
      confidence,
      reasoning: analysis.reasoning || 'No reasoning provided',
      viralHooks: Array.isArray(analysis.viral_hooks) ? analysis.viral_hooks : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      overallAssessment: analysis.overall_assessment,
      llmModel: model,
      llmTokensUsed: totalTokens,
      llmCostUsd: costUsd,
      processingTimeMs,
    };
  } catch (error: any) {
    console.error('GPT-4 refinement error:', error.message);

    // Return neutral adjustment on error
    return {
      adjustment: 0,
      confidence: 50,
      reasoning: `Error during GPT-4 analysis: ${error.message}`,
      viralHooks: [],
      weaknesses: ['Unable to complete qualitative analysis'],
      recommendations: ['Retry prediction or use XGBoost baseline only'],
      llmModel: 'error',
      llmTokensUsed: 0,
      llmCostUsd: 0,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Batch refinement for multiple predictions
 */
export async function refineWithGPT4Batch(
  inputs: GPTRefinementInput[],
  options?: {
    maxConcurrent?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<GPTRefinementOutput[]> {
  const maxConcurrent = options?.maxConcurrent || 5;
  const results: GPTRefinementOutput[] = [];

  console.log(`\n🤖 Starting GPT-4 batch refinement for ${inputs.length} predictions...`);

  for (let i = 0; i < inputs.length; i += maxConcurrent) {
    const batch = inputs.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(input => refineWithGPT4(input))
    );

    results.push(...batchResults);

    if (options?.onProgress) {
      options.onProgress(results.length, inputs.length);
    }

    console.log(`   Completed: ${results.length}/${inputs.length}`);
  }

  const totalCost = results.reduce((sum, r) => sum + r.llmCostUsd, 0);
  const avgAdjustment = results.reduce((sum, r) => sum + Math.abs(r.adjustment), 0) / results.length;

  console.log(`\n✅ GPT-4 batch refinement complete`);
  console.log(`   Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`   Avg Adjustment: ±${avgAdjustment.toFixed(1)} DPS points\n`);

  return results;
}

/**
 * Determine if GPT-4 refinement is needed based on XGBoost confidence
 */
export function shouldRefineWithGPT4(xgboostConfidence: number, threshold = 0.7): boolean {
  // Only use GPT-4 for low-confidence predictions or important decisions
  return xgboostConfidence < threshold;
}

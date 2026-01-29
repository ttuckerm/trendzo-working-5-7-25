/**
 * GPT-4 Viral Analysis Prompts
 *
 * Prompt templates for GPT-4 refinement layer
 */

export interface ViralAnalysisContext {
  transcript: string;
  title: string;
  baseDpsPrediction: number;
  xgboostConfidence: number;
  topFeatures: {
    name: string;
    value: number;
    importance: number;
  }[];
}

export function buildViralAnalysisPrompt(context: ViralAnalysisContext): string {
  const { transcript, title, baseDpsPrediction, xgboostConfidence, topFeatures } = context;

  const topFeaturesText = topFeatures
    .map(f => `  • ${f.name}: ${f.value.toFixed(2)} (importance: ${f.importance.toFixed(3)})`)
    .join('\n');

  return `You are an expert viral content analyst specializing in TikTok and social media virality prediction.

An ML model (XGBoost) has analyzed this video and predicted a DPS (Dynamic Percentile Score) of ${baseDpsPrediction.toFixed(1)} with ${(xgboostConfidence * 100).toFixed(0)}% confidence.

VIDEO DETAILS:
Title: ${title}

Transcript:
${transcript}

TOP CONTRIBUTING FEATURES (from ML model):
${topFeaturesText}

YOUR TASK:
Analyze this video's viral potential considering qualitative factors that the ML model may have missed or overweighted:

1. HOOK STRENGTH (First 3 seconds)
   - Is there an immediate attention grabber?
   - Does it create curiosity or surprise?
   - Would viewers stop scrolling?

2. EMOTIONAL RESONANCE
   - What emotions does this evoke?
   - Is there authentic vulnerability or relatability?
   - Does it create a strong reaction (positive or negative)?

3. STORY STRUCTURE
   - Is there a clear narrative arc?
   - Does it have conflict and resolution?
   - Is the pacing appropriate?

4. UNIQUE ANGLE
   - Is this perspective fresh or overdone?
   - Does it subvert expectations?
   - Is there a memorable twist or insight?

5. AUDIENCE RELEVANCE
   - Who is the target audience?
   - Does it tap into current trends or evergreen themes?
   - Is the message clear and actionable?

ADJUSTMENT DECISION:
Based on your analysis, determine if the ML prediction should be adjusted:

- **Strong viral elements the ML missed**: Adjust +10 to +20
  (e.g., exceptional hook, unique angle, perfect emotional timing)

- **Weak elements the ML didn't capture**: Adjust -10 to -20
  (e.g., confusing message, poor pacing, dated reference)

- **ML prediction seems accurate**: Adjust 0 to ±5
  (e.g., features align well with your qualitative assessment)

IMPORTANT:
- Be conservative with adjustments (most should be ±10 or less)
- Provide specific evidence from the transcript
- Focus on factors the ML model cannot measure (tone, timing, cultural context)

OUTPUT FORMAT (JSON):
{
  "adjustment": <number between -20 and 20>,
  "confidence": <number between 0 and 100>,
  "reasoning": "<2-3 sentence explanation of why you adjusted>",
  "viral_hooks": ["<specific hook 1>", "<specific hook 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendations": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "overall_assessment": "<1-2 sentence summary of viral potential>"
}

Respond ONLY with valid JSON. No markdown, no additional text.`;
}

export function buildQuickAnalysisPrompt(context: Pick<ViralAnalysisContext, 'transcript' | 'title' | 'baseDpsPrediction'>): string {
  const { transcript, title, baseDpsPrediction } = context;

  return `Analyze this video's viral potential. ML predicted DPS: ${baseDpsPrediction.toFixed(1)}

Title: ${title}
Transcript: ${transcript.substring(0, 500)}...

Provide adjustment (-20 to +20) and brief reasoning. Focus on hook strength, emotional resonance, and unique angle.

JSON format:
{
  "adjustment": <number>,
  "confidence": <number 0-100>,
  "reasoning": "<brief explanation>",
  "viral_hooks": ["<hook>"],
  "weaknesses": ["<weakness>"],
  "recommendations": ["<tip 1>", "<tip 2>"]
}`;
}

/**
 * Pack 1: Unified Grading Rubric LLM Prompt
 */

export const UNIFIED_GRADING_SYSTEM_PROMPT = `You are a viral content grading expert. Analyze the provided transcript and return a detailed rubric evaluation.

IMPORTANT: Return ONLY valid JSON matching the exact schema below. No markdown, no explanations, no code blocks.

## Scoring Guidelines

For each 1-10 score:
- 1-3: Poor/Missing - The element is absent or severely lacking
- 4-5: Below Average - Present but weak execution
- 6-7: Good - Competent execution with room for improvement
- 8-9: Excellent - Strong execution, above most content
- 10: Exceptional - Best-in-class, viral-worthy

## Required JSON Schema

{
  "rubric_version": "1.0",
  "niche": "<detected or provided niche>",
  "goal": "<detected or provided goal>",
  "style_classification": {
    "label": "<educational|entertainment|inspirational|informational|promotional>",
    "confidence": <0.0-1.0>
  },
  "idea_legos": {
    "lego_1": <true if clear topic identified>,
    "lego_2": <true if relevant to target audience>,
    "lego_3": <true if unique angle presented>,
    "lego_4": <true if intriguing hook present>,
    "lego_5": <true if story structure exists>,
    "lego_6": <true if visual format matches content>,
    "lego_7": <true if call-to-action present>,
    "notes": "<brief notes on missing legos>"
  },
  "attribute_scores": [
    {"attribute": "tam_resonance", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "shareability", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "value_density", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "emotional_journey", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "hook_strength", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "format_innovation", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "pacing_rhythm", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "curiosity_gaps", "score": <1-10>, "evidence": "<quote or observation>"},
    {"attribute": "clear_payoff", "score": <1-10>, "evidence": "<quote or observation>"}
  ],
  "hook": {
    "type": "<question|statistic|story|claim|visual|contrast|mystery|direct|weak>",
    "clarity_score": <1-10>,
    "pattern": "<identified viral pattern or 'none'>",
    "evidence": "<first 2-3 sentences of transcript>",
    "rewrite_options": ["<suggested hook rewrite 1>", "<suggested hook rewrite 2>"]
  },
  "pacing": {"score": <1-10>, "evidence": "<observation about pacing>"},
  "clarity": {"score": <1-10>, "evidence": "<observation about clarity>"},
  "novelty": {"score": <1-10>, "evidence": "<observation about novelty>"},
  "compliance_flags": ["<any platform policy concerns>"],
  "warnings": ["<any quality concerns>"],
  "grader_confidence": <0.0-1.0 based on transcript quality>
}`;

export function buildUnifiedGradingUserPrompt(
  transcript: string,
  niche?: string,
  goal?: string
): string {
  let prompt = `Analyze this transcript and return the grading rubric JSON:\n\n`;

  if (niche) {
    prompt += `Niche: ${niche}\n`;
  }
  if (goal) {
    prompt += `Goal: ${goal}\n`;
  }

  prompt += `\nTRANSCRIPT:\n${transcript}\n\n`;
  prompt += `Return ONLY the JSON object. No other text.`;

  return prompt;
}

export function buildRepairPrompt(
  originalResponse: string,
  validationErrors: string[]
): string {
  return `The previous response had validation errors. Fix these issues and return valid JSON:

ERRORS:
${validationErrors.join('\n')}

PREVIOUS RESPONSE:
${originalResponse}

Return ONLY the corrected JSON object. No explanations.`;
}

/**
 * Unified Grading Prompt Template
 *
 * LLM prompt for the unified grading rubric system.
 * Enforces strict JSON output with evidence-based scoring.
 */

import { ATTRIBUTE_NAMES, IDEA_LEGO_DESCRIPTIONS } from '../unified-grading-types';

/**
 * System prompt for the unified grading engine
 */
export const UNIFIED_GRADING_SYSTEM_PROMPT = `You are a strict grading engine for Trendzo viral video analysis.

## CRITICAL REQUIREMENTS
1. You MUST output ONLY valid JSON matching the provided schema
2. No markdown, no commentary, no explanations outside JSON
3. Every numeric score must include evidence quoting specific transcript moments or feature values
4. Be conservative: don't over-score. If unsure, lower confidence and add a warning
5. If information is missing, return null fields and add a warning

## SCORING GUIDELINES

### Score Ranges (1-10 scale)
- **1-3 (Poor):** Significant issues, missing key elements, likely to underperform
- **4-6 (Adequate):** Meets basic requirements but nothing exceptional
- **7-8 (Strong):** Above average execution with clear strengths
- **9-10 (Exceptional):** Outstanding, viral-worthy, rare to see

### Evidence Requirements
- Every score MUST cite specific evidence from the transcript or features
- Minimum 10 characters per evidence string
- Quote actual phrases when possible
- Reference specific timestamps or feature values when available

### Common Mistakes to Avoid
- Don't give uniform scores (e.g., all 7s) - this indicates low effort
- Don't use generic phrases like "good content" or "nice video"
- Don't score based on personal taste - score based on viral mechanics
- Don't confuse "interesting topic" with "strong execution"`;

/**
 * Build attribute scoring instructions
 */
function buildAttributeInstructions(): string {
  const instructions = ATTRIBUTE_NAMES.map((name, i) => {
    const descriptions: Record<string, string> = {
      tam_resonance: `Target Audience Match - How well does the content resonate with the stated niche and goal? Look for specific language, references, and topics that would appeal to the target audience.`,
      shareability: `Shareability Factor - Would viewers share this? Look for quotable moments, surprising revelations, useful tips, or emotional peaks that compel sharing.`,
      value_density: `Value Density - How much useful/entertaining content per second? High density = no wasted time, every sentence adds value.`,
      emotional_journey: `Emotional Journey - Is there an emotional arc? Look for tension, release, surprise, joy, or other emotional movements throughout.`,
      hook_strength: `Hook Strength - First 3 seconds: Does it stop the scroll? Look for pattern interrupts, curiosity gaps, bold claims, or immediate value promises.`,
      format_innovation: `Format Innovation - Is the format creative or just standard talking head? Look for unique visual approaches, creative editing, or novel presentation styles.`,
      pacing_rhythm: `Pacing & Rhythm - Does the content flow well? Look for varied sentence lengths, strategic pauses, and energy management.`,
      curiosity_gaps: `Curiosity Gaps - Are there open loops that keep viewers watching? Look for unanswered questions, teased revelations, or "wait for it" moments.`,
      clear_payoff: `Clear Payoff - Is there a satisfying conclusion? Look for delivered promises, resolved tensions, or actionable takeaways.`
    };
    return `### attr_${i + 1}: ${name}
${descriptions[name] || 'Score based on quality of execution.'}`;
  }).join('\n\n');

  return instructions;
}

/**
 * Build idea lego instructions
 */
function buildIdeaLegoInstructions(): string {
  return Object.entries(IDEA_LEGO_DESCRIPTIONS)
    .map(([key, desc]) => `- **${key}:** ${desc}`)
    .join('\n');
}

/**
 * Build the user prompt with input data
 */
export function buildUnifiedGradingPrompt(
  niche: string,
  goal: string,
  transcript: string,
  featureSnapshot: Record<string, unknown>
): string {
  return `## INPUT DATA

**Niche:** ${niche}
**Goal:** ${goal}

**Transcript:**
"""
${transcript}
"""

**Feature Snapshot:**
\`\`\`json
${JSON.stringify(featureSnapshot, null, 2)}
\`\`\`

## SCORING INSTRUCTIONS

### 9 Attributes (score each 1-10 with evidence)

${buildAttributeInstructions()}

### 7 Idea Legos (boolean flags)

Evaluate whether each "idea lego" building block is present:

${buildIdeaLegoInstructions()}

### Hook Analysis

Analyze the opening hook:
- **type:** One of: "question", "statistic", "story", "claim", "visual", "contrast", "mystery", "direct", "weak"
- **clarity_score:** 1-10 how clear is the hook's value proposition
- **pattern:** What viral hook pattern is used (if any)
- **evidence:** Quote the exact hook from transcript
- **rewrite_options:** 2-3 alternative hooks that might perform better

### Additional Dimensions

- **pacing:** Score 1-10 with evidence about content flow
- **clarity:** Score 1-10 with evidence about message clarity
- **novelty:** Score 1-10 with evidence about uniqueness

### Compliance & Warnings

- **compliance_flags:** List any content concerns (e.g., "music_copyright", "medical_claims", "financial_advice")
- **warnings:** List any grading concerns (e.g., "transcript_incomplete", "low_confidence_classification")

## OUTPUT SCHEMA

Return ONLY this JSON structure (no other text):

{
  "rubric_version": "1.0",
  "niche": "${niche}",
  "goal": "${goal}",
  "style_classification": {
    "label": "<style label>",
    "confidence": <0.0-1.0>
  },
  "idea_legos": {
    "lego_1": <true/false>,
    "lego_2": <true/false>,
    "lego_3": <true/false>,
    "lego_4": <true/false>,
    "lego_5": <true/false>,
    "lego_6": <true/false>,
    "lego_7": <true/false>,
    "notes": "<any notes about idea legos>"
  },
  "attribute_scores": [
    {"attribute": "attr_1", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_2", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_3", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_4", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_5", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_6", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_7", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_8", "score": <1-10>, "evidence": "<specific evidence>"},
    {"attribute": "attr_9", "score": <1-10>, "evidence": "<specific evidence>"}
  ],
  "hook": {
    "type": "<hook type>",
    "clarity_score": <1-10>,
    "pattern": "<pattern name or empty>",
    "evidence": "<hook text from transcript>",
    "rewrite_options": ["<option 1>", "<option 2>"]
  },
  "pacing": {"score": <1-10>, "evidence": "<specific evidence>"},
  "clarity": {"score": <1-10>, "evidence": "<specific evidence>"},
  "novelty": {"score": <1-10>, "evidence": "<specific evidence>"},
  "compliance_flags": [<list of flags or empty>],
  "warnings": [<list of warnings or empty>],
  "grader_confidence": <0.0-1.0>
}`;
}

/**
 * Pack configuration for unified grading
 */
export const UNIFIED_GRADING_CONFIG = {
  packId: 'unified-grading',
  version: '1.0.0',
  name: 'Unified Grading Pack',
  description: 'Comprehensive rubric covering 9 attributes, 7 idea legos, hook analysis, and additional dimensions',
  model: 'gemini-1.5-flash',
  temperature: 0.3,
  maxTokens: 2000
};

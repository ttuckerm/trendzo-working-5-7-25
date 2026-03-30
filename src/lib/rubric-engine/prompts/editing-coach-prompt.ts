/**
 * Pack 2: Editing Coach LLM Prompt
 */

import { UnifiedGradingResult } from '../unified-grading-types';
import type { CreatorContext } from '@/lib/prediction/creator-context';

export const EDITING_COACH_SYSTEM_PROMPT = `You are an expert video editing coach. Given a content rubric analysis, provide the TOP 3 most impactful improvements the creator can make.

IMPORTANT RULES:
1. Return ONLY valid JSON matching the schema below
2. Focus on the LOWEST scoring attributes that have HIGH impact potential
3. Each suggestion must be specific and actionable
4. Estimated lift should be conservative (use the weights provided)
5. Maximum 3 suggestions, sorted by impact

Each suggestion must target specific rubric fields with paths like:
- "rubric.hook.clarity_score"
- "rubric.attribute_scores[4]" (hook_strength)
- "rubric.pacing.score"
- "rubric.idea_legos.lego_4" (intriguing hook)

## JSON Schema

{
  "pack": "2",
  "predicted_before": <current VPS>,
  "predicted_after_estimate": <estimated VPS after changes>,
  "changes": [
    {
      "priority": 1,
      "what_to_change": "<specific element>",
      "how_to_change": "<detailed instructions>",
      "example": "<concrete example text or description>",
      "targets": ["rubric.field.path"],
      "estimated_lift": <number 0-15>,
      "confidence": <0.0-1.0>
    }
  ],
  "notes": "<overall coaching notes>"
}`;

export function buildEditingCoachUserPrompt(
  rubric: UnifiedGradingResult,
  predictedScore: number,
  topDrivers?: string[],
  creatorContext?: CreatorContext
): string {
  // Find lowest scoring attributes
  const sortedAttributes = [...rubric.attribute_scores].sort(
    (a, b) => a.score - b.score
  );
  const lowestAttributes = sortedAttributes.slice(0, 5);

  // Build context
  let prompt = `Analyze this rubric and provide TOP 3 improvement suggestions:

CURRENT PREDICTED VPS: ${predictedScore}

LOWEST SCORING ATTRIBUTES:
${lowestAttributes.map((a) => `- ${a.attribute}: ${a.score}/10 - "${a.evidence}"`).join('\n')}

HOOK ANALYSIS:
- Type: ${rubric.hook.type}
- Clarity: ${rubric.hook.clarity_score}/10
- Evidence: "${rubric.hook.evidence}"

DIMENSION SCORES:
- Pacing: ${rubric.pacing.score}/10
- Clarity: ${rubric.clarity.score}/10
- Novelty: ${rubric.novelty.score}/10

IDEA LEGOS (missing = improvement opportunity):
${Object.entries(rubric.idea_legos)
  .filter(([k, v]) => k !== 'notes' && !v)
  .map(([k]) => `- ${k}: MISSING`)
  .join('\n') || '- All present'}

WARNINGS: ${rubric.warnings.join(', ') || 'None'}
`;

  if (topDrivers && topDrivers.length > 0) {
    prompt += `\nTOP PREDICTION DRIVERS (focus improvements here):
${topDrivers.map((d) => `- ${d}`).join('\n')}
`;
  }

  // Creator profile section for personalization
  if (creatorContext) {
    prompt += buildCreatorContextSection(creatorContext);
  }

  prompt += `
WEIGHT REFERENCE (for estimating lift):
- hook_strength: 18% impact
- curiosity_gaps: 14% impact
- shareability: 12% impact
- tam_resonance: 11% impact
- value_density: 10% impact
- pacing_rhythm: 9% impact
- emotional_journey: 8% impact
- clear_payoff: 8% impact
- format_innovation: 5% impact

Return ONLY the JSON object with max 3 changes. Be conservative with lift estimates.`;

  return prompt;
}

// ============================================================================
// Creator Profile Prompt Section
// ============================================================================

function buildCreatorContextSection(ctx: CreatorContext): string {
  let section = '\nCREATOR PROFILE (personalize suggestions to this creator):\n';

  if (ctx.channelData) {
    section += `- Account: @${ctx.channelData.username}`;
    if (ctx.channelData.followerCount != null) {
      section += ` (${formatFollowers(ctx.channelData.followerCount)} followers)`;
    }
    section += '\n';
    if (ctx.channelData.avgViews != null) {
      section += `- Average views: ${Math.round(ctx.channelData.avgViews).toLocaleString()}\n`;
    }
    if (ctx.channelData.avgEngagementRate != null) {
      section += `- Average engagement rate: ${(ctx.channelData.avgEngagementRate * 100).toFixed(1)}%\n`;
    }
  }

  section += `- Creator stage: ${ctx.creatorStage}\n`;

  if (ctx.calibrationProfile?.rawScores) {
    const scores = ctx.calibrationProfile.rawScores;

    const topHookStyles = getTopPreferences(scores.hookStylePreference, 2);
    if (topHookStyles.length > 0) {
      section += `- Preferred hook styles: ${topHookStyles.join(', ')}\n`;
    }

    const topFormats = getTopPreferences(scores.contentFormatPreference, 2);
    if (topFormats.length > 0) {
      section += `- Preferred content formats: ${topFormats.join(', ')}\n`;
    }

    if (ctx.calibrationProfile.inferredProfile?.inferredContentStyle) {
      section += `- Content style: ${ctx.calibrationProfile.inferredProfile.inferredContentStyle}\n`;
    }
  }

  section += '\nIMPORTANT: Use the creator profile to RANK and TAILOR suggestions (e.g., suggest hook styles they prefer, reference their content format). Do NOT change scoring or lift estimates based on the profile.\n';

  return section;
}

function getTopPreferences(prefs: Record<string, number>, n: number): string[] {
  return Object.entries(prefs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .filter(([, score]) => score > 50) // Only preferences above neutral baseline
    .map(([key]) => key);
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

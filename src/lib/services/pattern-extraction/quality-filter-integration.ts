/**
 * Quality Filter Integration for Pattern Extraction
 * Integrates LLM-based quality filtering with enhanced pattern extraction
 *
 * This module adds quality assessment to the existing pattern extraction pipeline
 * without duplicating niche detection or framework identification.
 */

import OpenAI from 'openai';
import { VIRAL_NICHES } from '../viral-prediction/niche-framework-definitions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QualityAssessment {
  qualityScore: number; // 0-100
  confidence: number; // 0-1
  shouldInclude: boolean;
  qualitySignals: {
    hasActionableContent: boolean;
    hasSpecificValue: boolean;
    isProfessional: boolean;
    isOriginalContent: boolean;
  };
  rejectionReasons?: string[];
}

export interface VideoForQualityCheck {
  videoId: string;
  title: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
  transcript?: string;
  detectedNiche?: string; // From pattern extraction
  detectedFrameworks?: string[]; // From pattern extraction
}

/**
 * Assess video quality using LLM
 * This complements pattern extraction by adding quality filtering
 */
export async function assessVideoQuality(
  video: VideoForQualityCheck
): Promise<QualityAssessment> {
  try {
    const prompt = buildQualityAssessmentPrompt(video);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: QUALITY_ASSESSMENT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      qualityScore: result.qualityScore || 50,
      confidence: result.confidence || 0.5,
      shouldInclude: result.shouldInclude !== false,
      qualitySignals: {
        hasActionableContent: result.qualitySignals?.hasActionableContent || false,
        hasSpecificValue: result.qualitySignals?.hasSpecificValue || false,
        isProfessional: result.qualitySignals?.isProfessional || false,
        isOriginalContent: result.qualitySignals?.isOriginalContent || false,
      },
      rejectionReasons: result.rejectionReasons || []
    };

  } catch (error) {
    console.error('Quality assessment error:', error);
    // Fail-open: default to including the video
    return {
      qualityScore: 50,
      confidence: 0.5,
      shouldInclude: true,
      qualitySignals: {
        hasActionableContent: false,
        hasSpecificValue: false,
        isProfessional: false,
        isOriginalContent: false,
      },
      rejectionReasons: ['Quality assessment error']
    };
  }
}

/**
 * Batch assess multiple videos
 */
export async function assessVideosQuality(
  videos: VideoForQualityCheck[],
  options: {
    maxConcurrent?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<Map<string, QualityAssessment>> {
  const { maxConcurrent = 5, onProgress } = options;
  const results = new Map<string, QualityAssessment>();

  for (let i = 0; i < videos.length; i += maxConcurrent) {
    const batch = videos.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(async (video) => {
        const assessment = await assessVideoQuality(video);
        return { videoId: video.videoId, assessment };
      })
    );

    for (const { videoId, assessment } of batchResults) {
      results.set(videoId, assessment);
    }

    if (onProgress) {
      onProgress(Math.min(i + maxConcurrent, videos.length), videos.length);
    }

    // Small delay between batches
    if (i + maxConcurrent < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Build quality assessment prompt
 */
function buildQualityAssessmentPrompt(video: VideoForQualityCheck): string {
  const contentText = buildContentText(video);
  const nicheCriteria = getNicheCriteria(video.detectedNiche);

  return `Assess the quality of this TikTok video.

VIDEO CONTENT:
${contentText}

${video.detectedNiche ? `DETECTED NICHE: ${video.detectedNiche}

NICHE-SPECIFIC CRITERIA:
${nicheCriteria}` : ''}

${video.detectedFrameworks && video.detectedFrameworks.length > 0 ? `
DETECTED FRAMEWORKS: ${video.detectedFrameworks.join(', ')}` : ''}

Your task:
1. Assess overall content quality (0-100)
2. Determine if this video should be included in our database
3. Identify quality signals

QUALITY CRITERIA:
- Has actionable, valuable content (not just fluff)
- Provides specific tips, strategies, or insights
- Professional presentation (even if casual style)
- Original content (not just reposted/stolen content)
${nicheCriteria ? '- Meets niche-specific quality standards' : ''}

Return a JSON object:
{
  "qualityScore": number (0-100),
  "confidence": number (0-1),
  "shouldInclude": boolean,
  "qualitySignals": {
    "hasActionableContent": boolean,
    "hasSpecificValue": boolean,
    "isProfessional": boolean,
    "isOriginalContent": boolean
  },
  "rejectionReasons": string[] (if shouldInclude = false)
}`;
}

/**
 * Build content text for assessment
 */
function buildContentText(video: VideoForQualityCheck): string {
  const parts: string[] = [];

  if (video.title) parts.push(`Title: ${video.title}`);
  if (video.description) parts.push(`Description: ${video.description}`);
  if (video.caption) parts.push(`Caption: ${video.caption}`);
  if (video.hashtags && video.hashtags.length > 0) {
    parts.push(`Hashtags: ${video.hashtags.join(' ')}`);
  }
  if (video.transcript) {
    const truncatedTranscript = video.transcript.substring(0, 500);
    parts.push(`Transcript (first 500 chars): ${truncatedTranscript}`);
  }

  return parts.join('\n');
}

/**
 * Get niche-specific quality criteria
 */
function getNicheCriteria(nicheId?: string): string {
  if (!nicheId) return '';

  const niche = VIRAL_NICHES.find(n => n.id === nicheId);
  if (!niche) return '';

  const parts: string[] = [];

  if (niche.llmFilterCriteria.mustHave.length > 0) {
    parts.push(`Must Have: ${niche.llmFilterCriteria.mustHave.join(', ')}`);
  }

  if (niche.llmFilterCriteria.mustNotHave.length > 0) {
    parts.push(`Must NOT Have: ${niche.llmFilterCriteria.mustNotHave.join(', ')}`);
  }

  if (niche.llmFilterCriteria.qualitySignals.length > 0) {
    parts.push(`Quality Signals: ${niche.llmFilterCriteria.qualitySignals.join(', ')}`);
  }

  return parts.join('\n');
}

const QUALITY_ASSESSMENT_SYSTEM_PROMPT = `You are a viral content quality analyst.

Your role is to objectively assess the quality of TikTok videos based on:
- Content value and actionability
- Professional presentation
- Originality
- Niche-specific quality standards

Be strict but fair. Focus on genuine value to viewers.

Always respond with valid JSON matching the requested format.`;

/**
 * Get quality statistics from assessments
 */
export function getQualityStatistics(
  assessments: Map<string, QualityAssessment>
): {
  total: number;
  included: number;
  rejected: number;
  averageQuality: number;
  highQuality: number; // 80+
  mediumQuality: number; // 60-79
  lowQuality: number; // <60
} {
  let included = 0;
  let rejected = 0;
  let totalQuality = 0;
  let highQuality = 0;
  let mediumQuality = 0;
  let lowQuality = 0;

  for (const assessment of assessments.values()) {
    if (assessment.shouldInclude) included++;
    else rejected++;

    totalQuality += assessment.qualityScore;

    if (assessment.qualityScore >= 80) highQuality++;
    else if (assessment.qualityScore >= 60) mediumQuality++;
    else lowQuality++;
  }

  return {
    total: assessments.size,
    included,
    rejected,
    averageQuality: assessments.size > 0 ? totalQuality / assessments.size : 0,
    highQuality,
    mediumQuality,
    lowQuality
  };
}

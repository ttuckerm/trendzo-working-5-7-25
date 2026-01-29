/**
 * Content and Metadata Feature Extractors (Groups I-L)
 *
 * Extracts 35 features:
 * - Group I: Content Structure Signals (8 features)
 * - Group J: Timestamp and Pacing (4 features)
 * - Group K: Video Metadata (10 features)
 * - Group L: Historical Performance (10 features)
 */

import type {
  ContentStructureSignals,
  TimestampPacing,
  VideoMetadata,
  HistoricalPerformance,
  FeatureExtractionInput,
} from './types';

// ============================================================================
// WORD LISTS
// ============================================================================

const TRANSITION_WORDS = [
  'first', 'second', 'third', 'next', 'then', 'finally', 'lastly',
  'however', 'therefore', 'moreover', 'furthermore', 'additionally',
  'consequently', 'meanwhile', 'subsequently', 'nevertheless', 'nonetheless',
  'in addition', 'on the other hand', 'in contrast', 'similarly',
  'for example', 'for instance', 'in fact', 'indeed', 'thus',
  'also', 'besides', 'anyway', 'meanwhile', 'eventually'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function countWordOccurrences(text: string, wordList: string[]): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const word of wordList) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

// ============================================================================
// GROUP I: CONTENT STRUCTURE SIGNALS
// ============================================================================

export function extractContentStructureSignals(transcript: string): ContentStructureSignals {
  // Detect numbered lists
  const hasNumberedList = /\b\d+[\.)]\s/.test(transcript) || /\bstep \d+/i.test(transcript);

  // Detect bullet points (heuristic: lines starting with dash, asterisk, or bullet)
  const hasBulletPoints = /^[-•*]\s/m.test(transcript);

  // Count list items (numbered or bulleted)
  const numberedItems = (transcript.match(/\b\d+[\.)]\s/g) || []).length;
  const bulletItems = (transcript.match(/^[-•*]\s/gm) || []).length;
  const listItemCount = numberedItems + bulletItems;

  // Count sections (heuristic: double line breaks or explicit section markers)
  const sections = transcript.split(/\n\n+/).filter(s => s.trim().length > 0);
  const sectionCount = sections.length;

  // Count transition words
  const transitionWordCount = countWordOccurrences(transcript, TRANSITION_WORDS);

  // Calculate intro/conclusion lengths
  const words = transcript.match(/\b\w+\b/g) || [];
  const totalWords = words.length;

  const introLength = Math.floor(totalWords * 0.1);
  const conclusionLength = Math.floor(totalWords * 0.1);

  const bodyLength = totalWords - introLength - conclusionLength;
  const bodyToIntroRatio = introLength > 0 ? bodyLength / introLength : bodyLength;

  return {
    has_numbered_list: hasNumberedList,
    has_bullet_points: hasBulletPoints,
    list_item_count: listItemCount,
    section_count: sectionCount,
    transition_word_count: transitionWordCount,
    introduction_length: introLength,
    conclusion_length: conclusionLength,
    body_to_intro_ratio: bodyToIntroRatio,
  };
}

// ============================================================================
// GROUP J: TIMESTAMP AND PACING
// ============================================================================

export function extractTimestampPacing(
  transcript: string,
  videoDurationSeconds?: number
): TimestampPacing {
  const words = (transcript.match(/\b\w+\b/g) || []).length;

  // Calculate words per second
  const wordsPerSecond = videoDurationSeconds && videoDurationSeconds > 0
    ? words / videoDurationSeconds
    : 0;

  // Detect silence/pauses (heuristic: multiple spaces, ellipsis, or line breaks)
  const silencePauseCount = (transcript.match(/\.\.\.|  +|\n\n+/g) || []).length;

  // Split transcript into segments and calculate word density
  const segments = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const segmentWordCounts = segments.map(s => (s.match(/\b\w+\b/g) || []).length);

  // Rapid-fire segments: word count > average + 1 std dev
  const avgWordsPerSegment = segmentWordCounts.reduce((sum, c) => sum + c, 0) / Math.max(segmentWordCounts.length, 1);
  const variance = segmentWordCounts.reduce((sum, c) => sum + Math.pow(c - avgWordsPerSegment, 2), 0) / Math.max(segmentWordCounts.length, 1);
  const stdDev = Math.sqrt(variance);

  const rapidFireThreshold = avgWordsPerSegment + stdDev;
  const slowThreshold = avgWordsPerSegment - stdDev;

  const rapidFireSegments = segmentWordCounts.filter(c => c > rapidFireThreshold).length;
  const slowSegments = segmentWordCounts.filter(c => c < slowThreshold && c > 0).length;

  return {
    words_per_second: wordsPerSecond,
    silence_pause_count: silencePauseCount,
    rapid_fire_segments: rapidFireSegments,
    slow_segments: slowSegments,
  };
}

// ============================================================================
// GROUP K: VIDEO METADATA
// ============================================================================

export function extractVideoMetadata(input: FeatureExtractionInput): VideoMetadata {
  const titleLength = (input.title || '').length;
  const descriptionLength = (input.description || '').length;
  const captionLength = (input.caption || '').length;

  const hashtags = input.hashtags || [];
  const hashtagCount = hashtags.length;
  const hashtagTotalChars = hashtags.join('').length;

  const hasLocation = !!input.location;

  // Parse upload timestamp
  let uploadHour = 0;
  let uploadDayOfWeek = 0;
  let daysSinceUpload = 0;

  if (input.uploadedAt) {
    const uploadDate = new Date(input.uploadedAt);
    uploadHour = uploadDate.getHours();
    uploadDayOfWeek = uploadDate.getDay(); // 0 = Sunday, 6 = Saturday

    const now = new Date();
    const diffMs = now.getTime() - uploadDate.getTime();
    daysSinceUpload = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    video_duration_seconds: input.videoDurationSeconds || 0,
    title_length: titleLength,
    description_length: descriptionLength,
    hashtag_count: hashtagCount,
    hashtag_total_chars: hashtagTotalChars,
    caption_length: captionLength,
    has_location: hasLocation,
    upload_hour: uploadHour,
    upload_day_of_week: uploadDayOfWeek,
    days_since_upload: daysSinceUpload,
  };
}

// ============================================================================
// GROUP L: HISTORICAL PERFORMANCE
// ============================================================================

export function extractHistoricalPerformance(input: FeatureExtractionInput): HistoricalPerformance {
  const viewsCount = input.viewsCount || 0;
  const likesCount = input.likesCount || 0;
  const commentsCount = input.commentsCount || 0;
  const sharesCount = input.sharesCount || 0;
  const savesCount = input.savesCount || 0;

  // Calculate engagement rates
  const engagementRate = viewsCount > 0
    ? (likesCount + commentsCount + sharesCount) / viewsCount
    : 0;

  const likeRate = viewsCount > 0 ? likesCount / viewsCount : 0;
  const commentRate = viewsCount > 0 ? commentsCount / viewsCount : 0;
  const shareRate = viewsCount > 0 ? sharesCount / viewsCount : 0;

  const dpsScore = input.dpsScore || 0;

  return {
    views_count: viewsCount,
    likes_count: likesCount,
    comments_count: commentsCount,
    shares_count: sharesCount,
    saves_count: savesCount,
    engagement_rate: engagementRate,
    like_rate: likeRate,
    comment_rate: commentRate,
    share_rate: shareRate,
    dps_score: dpsScore,
  };
}

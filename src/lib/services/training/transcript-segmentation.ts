/**
 * Transcript Segmentation
 * 
 * Segments transcripts into hook, body, and conclusion for analysis.
 */

export interface TranscriptSegment {
  type: 'hook' | 'body' | 'conclusion';
  text: string;
  startTime?: number;
  endTime?: number;
  wordCount: number;
}

export interface SegmentedTranscript {
  hook: TranscriptSegment;
  body: TranscriptSegment;
  conclusion: TranscriptSegment;
  totalWordCount: number;
  estimatedDuration: number;
}

/**
 * Segment a transcript by estimation (without timestamps)
 * Uses word count heuristics:
 * - Hook: First ~15% of words
 * - Body: Middle ~70% of words
 * - Conclusion: Last ~15% of words
 */
export function segmentTranscriptByEstimation(transcript: string): SegmentedTranscript {
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  if (totalWords === 0) {
    const emptySegment: TranscriptSegment = {
      type: 'hook',
      text: '',
      wordCount: 0,
    };
    return {
      hook: { ...emptySegment, type: 'hook' },
      body: { ...emptySegment, type: 'body' },
      conclusion: { ...emptySegment, type: 'conclusion' },
      totalWordCount: 0,
      estimatedDuration: 0,
    };
  }

  // Calculate segment boundaries
  const hookEnd = Math.ceil(totalWords * 0.15);
  const conclusionStart = Math.floor(totalWords * 0.85);

  const hookWords = words.slice(0, hookEnd);
  const bodyWords = words.slice(hookEnd, conclusionStart);
  const conclusionWords = words.slice(conclusionStart);

  // Estimate duration (assume ~150 words per minute)
  const estimatedDuration = (totalWords / 150) * 60;

  return {
    hook: {
      type: 'hook',
      text: hookWords.join(' '),
      wordCount: hookWords.length,
    },
    body: {
      type: 'body',
      text: bodyWords.join(' '),
      wordCount: bodyWords.length,
    },
    conclusion: {
      type: 'conclusion',
      text: conclusionWords.join(' '),
      wordCount: conclusionWords.length,
    },
    totalWordCount: totalWords,
    estimatedDuration,
  };
}

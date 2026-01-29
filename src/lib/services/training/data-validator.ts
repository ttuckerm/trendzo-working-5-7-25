/**
 * Data Validation Service
 * 
 * Validates video data quality before feature extraction.
 * Ensures data integrity and calculates quality scores.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  qualityScore: number; // 0-100
  issues: ValidationIssue[];
  warnings: string[];
}

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate video data for training readiness
 */
export function validateVideoData(video: any): ValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: string[] = [];
  let qualityScore = 100;

  // Required fields check
  const requiredFields = ['video_id', 'views_count', 'likes_count', 'dps_score'];
  for (const field of requiredFields) {
    if (video[field] === null || video[field] === undefined) {
      issues.push({
        field,
        issue: `Missing required field: ${field}`,
        severity: 'error'
      });
      qualityScore -= 25;
    }
  }

  // Transcript check (important for text features)
  if (!video.transcript_text || video.transcript_text.trim().length < 10) {
    warnings.push('Missing or very short transcript - text features will be limited');
    qualityScore -= 15;
  } else if (video.transcript_text.trim().length < 50) {
    warnings.push('Short transcript - some text features may be limited');
    qualityScore -= 5;
  }

  // Caption check
  if (!video.caption || video.caption.trim().length < 5) {
    warnings.push('Missing or very short caption');
    qualityScore -= 5;
  }

  // Engagement sanity checks
  if (video.views_count && video.likes_count) {
    const likeRate = video.likes_count / video.views_count;
    if (likeRate > 1) {
      issues.push({
        field: 'likes_count',
        issue: 'Like rate exceeds 100% - suspicious data',
        severity: 'warning'
      });
      qualityScore -= 10;
    }
    if (likeRate > 0.5) {
      warnings.push('Unusually high like rate (>50%)');
      qualityScore -= 5;
    }
  }

  // Views sanity check
  if (video.views_count && video.views_count < 100) {
    warnings.push('Very low view count - limited engagement data');
    qualityScore -= 5;
  }

  // Duration check
  if (!video.duration_seconds || video.duration_seconds < 1) {
    warnings.push('Missing or invalid duration');
    qualityScore -= 5;
  } else if (video.duration_seconds > 600) {
    warnings.push('Video longer than 10 minutes - may not be typical short-form content');
    qualityScore -= 3;
  }

  // DPS sanity check
  if (video.dps_score !== null && video.dps_score !== undefined) {
    if (video.dps_score < 0 || video.dps_score > 100) {
      issues.push({
        field: 'dps_score',
        issue: 'DPS score out of valid range (0-100)',
        severity: 'error'
      });
      qualityScore -= 20;
    }
  }

  // Hashtags check
  if (!video.hashtags || video.hashtags.length === 0) {
    warnings.push('No hashtags - some features will be limited');
    qualityScore -= 5;
  }

  // Creator data check
  if (!video.creator_followers_count || video.creator_followers_count === 0) {
    warnings.push('Missing creator follower count');
    qualityScore -= 5;
  }

  // Timestamp check
  if (!video.upload_timestamp) {
    warnings.push('Missing upload timestamp');
    qualityScore -= 3;
  }

  // Ensure quality score stays in bounds
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    isValid: !issues.some(i => i.severity === 'error'),
    qualityScore,
    issues,
    warnings
  };
}

/**
 * Map DPS classification to standardized performance tier
 */
export function mapPerformanceTier(dpsClassification: string | null): string {
  if (!dpsClassification) return 'average';

  const mapping: Record<string, string> = {
    'mega-viral': 'mega-viral',
    'hyper-viral': 'mega-viral',
    'viral': 'viral',
    'above-average': 'above-average',
    'normal': 'average',
    'average': 'average',
    'below-average': 'below-average',
    'poor': 'poor',
    'low': 'poor'
  };

  return mapping[dpsClassification.toLowerCase()] || 'average';
}

/**
 * Calculate engagement rate from video metrics
 */
export function calculateEngagementRate(video: any): number {
  if (!video.views_count || video.views_count === 0) return 0;

  const engagements =
    (video.likes_count || 0) +
    (video.comments_count || 0) +
    (video.shares_count || 0) +
    (video.saves_count || 0);

  return engagements / video.views_count;
}

/**
 * Validate a batch of videos and return statistics
 */
export function validateVideoBatch(videos: any[]): {
  valid: number;
  invalid: number;
  avgQuality: number;
  commonIssues: Record<string, number>;
} {
  let valid = 0;
  let invalid = 0;
  let totalQuality = 0;
  const issueCount: Record<string, number> = {};

  for (const video of videos) {
    const result = validateVideoData(video);
    
    if (result.isValid) {
      valid++;
    } else {
      invalid++;
    }
    
    totalQuality += result.qualityScore;

    // Count issues
    for (const issue of result.issues) {
      issueCount[issue.issue] = (issueCount[issue.issue] || 0) + 1;
    }
    for (const warning of result.warnings) {
      issueCount[warning] = (issueCount[warning] || 0) + 1;
    }
  }

  return {
    valid,
    invalid,
    avgQuality: videos.length > 0 ? totalQuality / videos.length : 0,
    commonIssues: issueCount
  };
}
























































































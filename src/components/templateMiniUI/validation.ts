export type ValidationIssueSeverity = "info" | "warning" | "error";

export interface ValidationIssue {
  id: string;
  severity: ValidationIssueSeverity;
  message: string;
  fix?: () => void;
}

export interface ValidateParams {
  platform: "tiktok" | "instagram" | "youtube" | string;
  slots: {
    hook: string;
    onScreenText: string;
    captions: string;
    hashtags: string[];
    shotList: string[];
    thumbnailBrief: string;
    first3sCue: string;
  };
}

export function validateTemplate(params: ValidateParams): ValidationIssue[] {
  const { platform, slots } = params;
  const issues: ValidationIssue[] = [];

  // Hashtag validation with platform limits
  const hashtagLimits: Record<string, number> = {
    tiktok: 3,
    instagram: 5,
    youtube: 15,
  };
  const maxTags = hashtagLimits[platform] ?? 5;
  if (slots.hashtags.length > maxTags) {
    issues.push({
      id: "hashtags-too-many",
      severity: "warning",
      message: `Reduce hashtags to ≤ ${maxTags} for ${platform}. Auto-fix available.`,
    });
  }

  // First 3 seconds cue validation
  if (!slots.first3sCue || slots.first3sCue.trim().length === 0) {
    issues.push({
      id: "missing-first3s",
      severity: "error",
      message: "Add a compelling first-3s cue to capture attention. Auto-fix available.",
    });
  }

  // Platform-specific validations
  if (platform === "tiktok") {
    if (slots.onScreenText.length > 80) {
      issues.push({
        id: "on-screen-too-long",
        severity: "warning",
        message: "On-screen text is long for mobile viewport; consider trimming under 80 chars.",
      });
    }
    
    if (slots.hook.length > 150) {
      issues.push({
        id: "hook-too-long-tiktok",
        severity: "warning",
        message: "Hook may be too long for TikTok's fast-paced format. Consider shortening.",
      });
    }
  }

  if (platform === "instagram") {
    if (slots.hashtags.length < 3) {
      issues.push({
        id: "hashtags-too-few-instagram",
        severity: "info",
        message: "Instagram performs better with 3-5 relevant hashtags.",
      });
    }
  }

  if (platform === "youtube") {
    if (!slots.thumbnailBrief || slots.thumbnailBrief.trim().length === 0) {
      issues.push({
        id: "missing-thumbnail-brief",
        severity: "warning",
        message: "YouTube thumbnails are crucial for click-through rates. Add thumbnail guidance.",
      });
    }
  }

  // Cross-platform validations
  if (!slots.hook || slots.hook.trim().length === 0) {
    issues.push({
      id: "missing-hook",
      severity: "error",
      message: "Hook is required to grab viewer attention.",
    });
  }

  if (slots.captions && slots.captions.length > 2200) {
    issues.push({
      id: "captions-too-long",
      severity: "warning",
      message: "Captions may be too long for optimal engagement. Consider breaking into parts.",
    });
  }

  // Content quality checks
  const hasGenericHashtags = slots.hashtags.some(tag => 
    /^#(viral|trending|like|follow|share)$/i.test(tag)
  );
  if (hasGenericHashtags) {
    issues.push({
      id: "generic-hashtags",
      severity: "info",
      message: "Consider replacing generic hashtags with more specific, niche-relevant ones.",
    });
  }

  return issues;
}



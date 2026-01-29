/**
 * 24 Video Production Styles Framework
 * Last updated: 2025-11-03
 *
 * These are the 24 expert-led, proof-driven instructional short-form video styles
 * that target "teach-prove-convert" formats. These define HOW content is presented,
 * complementing WHAT viral strategy is used.
 *
 * Integration: Used by Donna to identify video format and apply format-specific
 * prediction adjustments based on platform alignment and production complexity.
 */

export interface VideoStyle {
  id: string;
  name: string;
  styleNumber: number; // 1-24
  description: string;

  // Platform performance (0-5 scale)
  platformAlignment: {
    tiktok: number;
    instagram: number;
    youtube: number;
    linkedin: number;
  };

  // Production requirements
  productionComplexity: 'low' | 'medium' | 'high';
  requiresFaceOnCamera: boolean;
  requiresEditing: 'minimal' | 'moderate' | 'heavy';

  // Performance modifiers
  avgCompletionRate: number; // 0-100 percentage
  avgEngagementBoost: number; // Multiplier (1.0 = baseline)

  // Detection patterns (for automated classification)
  visualCues: string[];
  audioPatterns?: string[];

  // Best use cases
  idealFor: string[];
  notRecommendedFor: string[];
}

export const VIDEO_STYLES_24: VideoStyle[] = [
  {
    id: 'talking-head-explainer',
    name: 'Talking-Head Explainer',
    styleNumber: 1,
    description: 'Direct-to-camera with jump-cuts and kinetic captions',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 4 },
    productionComplexity: 'low',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 65,
    avgEngagementBoost: 1.0,
    visualCues: ['face-to-camera', 'jump-cuts', 'animated-captions'],
    idealFor: ['quick-tips', 'personal-brand', 'advice', 'commentary'],
    notRecommendedFor: ['technical-tutorials', 'product-demos']
  },

  {
    id: 'green-screen-commentary',
    name: 'Green-Screen Commentary',
    styleNumber: 2,
    description: 'Creator over headlines, screenshots, or data visualizations',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'heavy',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.15,
    visualCues: ['green-screen', 'overlaid-visuals', 'data-charts'],
    idealFor: ['news-commentary', 'data-analysis', 'research-breakdown', 'reactions'],
    notRecommendedFor: ['personal-stories', 'product-demos']
  },

  {
    id: 'picture-in-picture-walkthrough',
    name: 'Picture-in-Picture Screen Walkthrough',
    styleNumber: 3,
    description: 'Face cam combined with app or website demonstration',
    platformAlignment: { tiktok: 3, instagram: 3, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 75,
    avgEngagementBoost: 1.25,
    visualCues: ['split-screen', 'screen-recording', 'cursor-movement'],
    idealFor: ['software-tutorials', 'app-reviews', 'website-audits', 'how-to-tech'],
    notRecommendedFor: ['entertainment', 'storytelling']
  },

  {
    id: 'voiceover-broll-montage',
    name: 'Voiceover + B-Roll Montage',
    styleNumber: 4,
    description: 'Hands, product shots, UI clips, charts - no face required',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 3 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: false,
    requiresEditing: 'heavy',
    avgCompletionRate: 60,
    avgEngagementBoost: 1.1,
    visualCues: ['b-roll-footage', 'voiceover', 'no-talking-head'],
    idealFor: ['lifestyle', 'product-showcase', 'educational-concepts', 'faceless-channels'],
    notRecommendedFor: ['personal-brand-building', 'authority-positioning']
  },

  {
    id: 'whiteboard-notepad-teach',
    name: 'Whiteboard/Notepad Teach',
    styleNumber: 5,
    description: 'Sketching formulas, frameworks, and visual lists',
    platformAlignment: { tiktok: 3, instagram: 3, youtube: 5, linkedin: 5 },
    productionComplexity: 'low',
    requiresFaceOnCamera: false,
    requiresEditing: 'minimal',
    avgCompletionRate: 80,
    avgEngagementBoost: 1.3,
    visualCues: ['hand-drawing', 'whiteboard', 'diagrams', 'frameworks'],
    idealFor: ['education', 'frameworks', 'complex-concepts', 'teaching'],
    notRecommendedFor: ['entertainment', 'product-sales']
  },

  {
    id: 'desk-top-down-demo',
    name: 'Desk/Top-Down "Hands-Only" Demo',
    styleNumber: 6,
    description: 'Overhead view of hands demonstrating recipes, DIY, or device usage',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 2 },
    productionComplexity: 'low',
    requiresFaceOnCamera: false,
    requiresEditing: 'minimal',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.2,
    visualCues: ['overhead-angle', 'hands-visible', 'process-demonstration'],
    idealFor: ['cooking', 'diy', 'crafts', 'device-setup', 'unboxing'],
    notRecommendedFor: ['advice', 'commentary', 'storytelling']
  },

  {
    id: 'product-feature-demo',
    name: 'Product/Feature Demo',
    styleNumber: 7,
    description: 'Benefit-led product demonstration with outcome clips and CTA',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 4 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: false,
    requiresEditing: 'moderate',
    avgCompletionRate: 55,
    avgEngagementBoost: 1.0,
    visualCues: ['product-focus', 'benefit-callouts', 'cta-overlay'],
    idealFor: ['ecommerce', 'saas', 'physical-products', 'app-features'],
    notRecommendedFor: ['educational-content', 'entertainment']
  },

  {
    id: 'case-study-before-after',
    name: 'Case Study / Before-After',
    styleNumber: 8,
    description: 'Transformation showcase with metrics overlays and timelines',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: false,
    requiresEditing: 'moderate',
    avgCompletionRate: 75,
    avgEngagementBoost: 1.4,
    visualCues: ['before-after-split', 'metrics-overlay', 'timeline-visual'],
    idealFor: ['transformations', 'results-proof', 'testimonials', 'case-studies'],
    notRecommendedFor: ['quick-tips', 'entertainment']
  },

  {
    id: 'comparison-abc',
    name: 'Comparison / A-vs-B-vs-C',
    styleNumber: 9,
    description: 'Side-by-side comparisons with scorecard lower-thirds and checkmarks',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 5, linkedin: 4 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: false,
    requiresEditing: 'moderate',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.25,
    visualCues: ['side-by-side', 'scorecards', 'checkmarks', 'comparison-table'],
    idealFor: ['product-reviews', 'option-analysis', 'buying-guides', 'rankings'],
    notRecommendedFor: ['storytelling', 'personal-brand']
  },

  {
    id: 'myth-bust-red-green-flag',
    name: 'Myth-Bust / Red-Flag-Green-Flag',
    styleNumber: 10,
    description: 'Debunking with receipts on screen and source citations',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 4 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'heavy',
    avgCompletionRate: 75,
    avgEngagementBoost: 1.35,
    visualCues: ['red-green-indicators', 'source-citations', 'receipts-overlay'],
    idealFor: ['myth-busting', 'fact-checking', 'advice-evaluation', 'expert-positioning'],
    notRecommendedFor: ['product-demos', 'tutorials']
  },

  {
    id: 'sop-checklist-walkthrough',
    name: 'SOP/Checklist Walkthrough',
    styleNumber: 11,
    description: 'Step-by-step process with numbered steps and progress bar',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'low',
    requiresFaceOnCamera: false,
    requiresEditing: 'moderate',
    avgCompletionRate: 80,
    avgEngagementBoost: 1.2,
    visualCues: ['numbered-steps', 'progress-bar', 'checklist-visual'],
    idealFor: ['processes', 'tutorials', 'how-to', 'step-by-step-guides'],
    notRecommendedFor: ['entertainment', 'storytelling']
  },

  {
    id: 'decision-tree-if-then',
    name: 'Decision Tree / If-Then Navigator',
    styleNumber: 12,
    description: 'Interactive decision flow with on-screen branching paths',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'high',
    requiresFaceOnCamera: false,
    requiresEditing: 'heavy',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.3,
    visualCues: ['branching-diagram', 'decision-points', 'flowchart'],
    idealFor: ['complex-decisions', 'personalized-advice', 'troubleshooting', 'option-selection'],
    notRecommendedFor: ['simple-tips', 'entertainment']
  },

  {
    id: 'challenge-protocol',
    name: 'Challenge / 7–30 Day Protocol',
    styleNumber: 13,
    description: 'Multi-day challenge with day markers and trendline overlays',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 5, linkedin: 3 },
    productionComplexity: 'high',
    requiresFaceOnCamera: true,
    requiresEditing: 'heavy',
    avgCompletionRate: 85,
    avgEngagementBoost: 1.5,
    visualCues: ['day-counter', 'progress-tracking', 'transformation-timeline'],
    idealFor: ['challenges', 'habit-building', 'transformations', 'engagement-series'],
    notRecommendedFor: ['quick-tips', 'one-off-content']
  },

  {
    id: 'live-build-teardown',
    name: 'Live Build / Real-Time Teardown',
    styleNumber: 14,
    description: 'Real-time process with chapter stamps and "do it with me" approach',
    platformAlignment: { tiktok: 3, instagram: 3, youtube: 5, linkedin: 4 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 75,
    avgEngagementBoost: 1.25,
    visualCues: ['real-time-recording', 'chapter-markers', 'live-commentary'],
    idealFor: ['tutorials', 'audits', 'critiques', 'technical-walkthroughs'],
    notRecommendedFor: ['quick-consumption', 'mobile-first-content']
  },

  {
    id: 'faq-ama-rapid-fire',
    name: 'FAQ/AMA Rapid-Fire',
    styleNumber: 15,
    description: 'Quick-cut Q&A with captioned questions and answers',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 3 },
    productionComplexity: 'low',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 65,
    avgEngagementBoost: 1.15,
    visualCues: ['quick-cuts', 'q-and-a-captions', 'rapid-pacing'],
    idealFor: ['audience-engagement', 'community-building', 'answering-objections'],
    notRecommendedFor: ['complex-explanations', 'detailed-tutorials']
  },

  {
    id: 'expert-clip-interview',
    name: 'Expert Clip / Interview Bite',
    styleNumber: 16,
    description: 'Interview excerpt with pull-quote and proof overlays',
    platformAlignment: { tiktok: 3, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.2,
    visualCues: ['interview-setup', 'pull-quotes', 'expert-credentials'],
    idealFor: ['authority-borrowing', 'insights', 'industry-commentary', 'b2b'],
    notRecommendedFor: ['entertainment', 'diy-tutorials']
  },

  {
    id: 'ugc-testimonial-social-proof',
    name: 'UGC Testimonial / Social Proof Stack',
    styleNumber: 17,
    description: 'Customer results with screenshots and outcome overlays',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 4 },
    productionComplexity: 'low',
    requiresFaceOnCamera: false,
    requiresEditing: 'minimal',
    avgCompletionRate: 60,
    avgEngagementBoost: 1.3,
    visualCues: ['user-generated-content', 'testimonial-screenshots', 'results-proof'],
    idealFor: ['social-proof', 'conversions', 'testimonials', 'trust-building'],
    notRecommendedFor: ['educational-content', 'entertainment']
  },

  {
    id: 'transformation-timelapse',
    name: 'Transformation Time-Lapse',
    styleNumber: 18,
    description: 'Visual transformation with voiceover explaining changes made',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 3 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: false,
    requiresEditing: 'heavy',
    avgCompletionRate: 75,
    avgEngagementBoost: 1.4,
    visualCues: ['timelapse-video', 'transformation-sequence', 'voiceover-explanation'],
    idealFor: ['before-after', 'process-showcase', 'results-proof', 'physical-transformations'],
    notRecommendedFor: ['quick-tips', 'talking-points']
  },

  {
    id: 'checklist-review-audit',
    name: 'Checklist Review / Audit',
    styleNumber: 19,
    description: 'Rating and improvement format with rubric lower-third graphics',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.25,
    visualCues: ['rating-system', 'audit-checklist', 'improvement-suggestions'],
    idealFor: ['audits', 'reviews', 'critiques', 'improvement-advice'],
    notRecommendedFor: ['entertainment', 'storytelling']
  },

  {
    id: 'template-framework-explainer',
    name: 'Template/Framework Explainer',
    styleNumber: 20,
    description: 'Model presentation → steps breakdown → example application',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 75,
    avgEngagementBoost: 1.3,
    visualCues: ['framework-diagram', 'step-breakdown', 'example-walkthrough'],
    idealFor: ['teaching-systems', 'frameworks', 'models', 'structured-learning'],
    notRecommendedFor: ['entertainment', 'product-demos']
  },

  {
    id: 'price-roi-breakdown',
    name: 'Price/ROI Breakdown',
    styleNumber: 21,
    description: 'Financial analysis with cost tiles and calculator overlays',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.2,
    visualCues: ['price-comparison', 'roi-calculator', 'cost-breakdown'],
    idealFor: ['financial-advice', 'buying-decisions', 'investment-analysis', 'value-justification'],
    notRecommendedFor: ['entertainment', 'quick-tips']
  },

  {
    id: 'regulation-update-explainer',
    name: 'Regulation/Update Explainer',
    styleNumber: 22,
    description: 'News analysis showing what changed and actionable next steps',
    platformAlignment: { tiktok: 3, instagram: 3, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: true,
    requiresEditing: 'moderate',
    avgCompletionRate: 65,
    avgEngagementBoost: 1.15,
    visualCues: ['before-after-comparison', 'action-steps', 'policy-changes'],
    idealFor: ['industry-news', 'compliance', 'policy-changes', 'regulatory-updates'],
    notRecommendedFor: ['entertainment', 'evergreen-content']
  },

  {
    id: 'routine-system',
    name: 'Routine/System',
    styleNumber: 23,
    description: 'Daily/weekly routine breakdown with habit loops and cadence visual',
    platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 4 },
    productionComplexity: 'low',
    requiresFaceOnCamera: true,
    requiresEditing: 'minimal',
    avgCompletionRate: 70,
    avgEngagementBoost: 1.2,
    visualCues: ['schedule-display', 'habit-tracking', 'routine-visuals'],
    idealFor: ['productivity', 'lifestyle', 'habit-building', 'routine-sharing'],
    notRecommendedFor: ['technical-tutorials', 'complex-concepts']
  },

  {
    id: 'slideshow-infographic',
    name: 'Slideshow Infographic',
    styleNumber: 24,
    description: 'Data-driven presentation from macro facts to micro actions with voiceover',
    platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
    productionComplexity: 'medium',
    requiresFaceOnCamera: false,
    requiresEditing: 'heavy',
    avgCompletionRate: 65,
    avgEngagementBoost: 1.1,
    visualCues: ['slide-transitions', 'infographic-design', 'data-visualization'],
    idealFor: ['data-presentation', 'research-sharing', 'educational-content', 'statistics'],
    notRecommendedFor: ['personal-stories', 'product-demos']
  }
];

/**
 * Get video style by ID
 */
export function getVideoStyleById(id: string): VideoStyle | undefined {
  return VIDEO_STYLES_24.find(style => style.id === id);
}

/**
 * Get video style by style number (1-24)
 */
export function getVideoStyleByNumber(num: number): VideoStyle | undefined {
  return VIDEO_STYLES_24.find(style => style.styleNumber === num);
}

/**
 * Get all video styles for a specific platform, ranked by alignment
 */
export function getStylesForPlatform(
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
): VideoStyle[] {
  return [...VIDEO_STYLES_24].sort((a, b) =>
    b.platformAlignment[platform] - a.platformAlignment[platform]
  );
}

/**
 * Calculate style match score for given video characteristics
 * Returns style recommendations with confidence scores
 */
export function detectVideoStyle(characteristics: {
  hasFaceOnCamera: boolean;
  editingComplexity: 'minimal' | 'moderate' | 'heavy';
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin';
  visualCuesDetected: string[];
}): Array<{ style: VideoStyle; confidence: number }> {
  const matches: Array<{ style: VideoStyle; confidence: number }> = [];

  for (const style of VIDEO_STYLES_24) {
    let confidence = 0;

    // Face requirement match (30% weight)
    if (style.requiresFaceOnCamera === characteristics.hasFaceOnCamera) {
      confidence += 0.3;
    }

    // Editing complexity match (20% weight)
    if (style.requiresEditing === characteristics.editingComplexity) {
      confidence += 0.2;
    }

    // Platform alignment (30% weight)
    const platformScore = style.platformAlignment[characteristics.platform] / 5;
    confidence += platformScore * 0.3;

    // Visual cues match (20% weight)
    const matchedCues = style.visualCues.filter(cue =>
      characteristics.visualCuesDetected.includes(cue)
    );
    const cueScore = matchedCues.length / Math.max(style.visualCues.length, 1);
    confidence += cueScore * 0.2;

    matches.push({ style, confidence });
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get production complexity distribution
 */
export function getComplexityDistribution(): Record<string, number> {
  const dist = { low: 0, medium: 0, high: 0 };
  VIDEO_STYLES_24.forEach(style => {
    dist[style.productionComplexity]++;
  });
  return dist;
}

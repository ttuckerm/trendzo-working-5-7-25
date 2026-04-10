/**
 * Agency Skill Sets — Atlas Foundation
 *
 * Defines monitoring patterns, content strategies, and coaching focus per niche.
 * Atlas uses these to determine what to monitor and how to generate briefs.
 *
 * Must match the 20 niches in src/lib/freedom-agent/niche-templates.ts
 */

export interface AgencySkillSet {
  nicheKey: string;
  contentFormats: string[];
  kpiPriority: string[];
  culturalSources: string[];
  briefTemplateHints: string[];
  coachingFocus: string[];
}

export const AGENCY_SKILL_SETS: Record<string, AgencySkillSet> = {
  'side-hustles': {
    nicheKey: 'side-hustles',
    contentFormats: ['income-proof', 'tutorial', 'day-in-life', 'tool-review', 'step-by-step'],
    kpiPriority: ['save_rate', 'share_rate', 'follower_growth'],
    culturalSources: ['reddit:sidehustle', 'reddit:beermoney', 'tiktok:sidehustle'],
    briefTemplateHints: ['Trending side hustles this month', 'Income proof videos', 'Tool vs tool comparisons', 'Beginner-friendly hustles'],
    coachingFocus: ['Income proof in first 3 seconds', 'Specificity over vagueness', 'Step-by-step clarity'],
  },
  'personal-finance': {
    nicheKey: 'personal-finance',
    contentFormats: ['explainer', 'myth-busting', 'portfolio-update', 'budgeting-tip', 'news-reaction'],
    kpiPriority: ['save_rate', 'comment_rate', 'share_rate'],
    culturalSources: ['reddit:personalfinance', 'reddit:investing', 'tiktok:finance'],
    briefTemplateHints: ['Market reactions', 'Budgeting challenges', 'Debt payoff stories', 'Investment for beginners'],
    coachingFocus: ['Simplify jargon', 'Use real numbers', 'Authority without condescension'],
  },
  'fitness': {
    nicheKey: 'fitness',
    contentFormats: ['transformation', 'workout-routine', 'challenge', 'form-check', 'day-in-life'],
    kpiPriority: ['save_rate', 'comment_rate', 'follower_growth'],
    culturalSources: ['reddit:fitness', 'reddit:loseit', 'tiktok:fitness'],
    briefTemplateHints: ['New year challenges', 'Summer body prep', 'Home vs gym', 'Progressive overload'],
    coachingFocus: ['Hook in first 2 seconds', 'Before/after storytelling', 'Form demonstration clarity'],
  },
  'business': {
    nicheKey: 'business',
    contentFormats: ['founder-story', 'lesson-learned', 'behind-scenes', 'revenue-breakdown', 'advice'],
    kpiPriority: ['share_rate', 'comment_rate', 'follower_growth'],
    culturalSources: ['reddit:entrepreneur', 'reddit:startups', 'tiktok:business'],
    briefTemplateHints: ['Startup failure lessons', 'Revenue milestones', 'Hiring stories', 'Product launches'],
    coachingFocus: ['Authenticity over polish', 'Specific numbers and timelines', 'Storytelling arc'],
  },
  'food-nutrition': {
    nicheKey: 'food-nutrition',
    contentFormats: ['what-i-eat', 'myth-busting', 'meal-prep', 'macro-breakdown', 'supplement-review'],
    kpiPriority: ['save_rate', 'share_rate', 'comment_rate'],
    culturalSources: ['reddit:nutrition', 'reddit:mealprep', 'tiktok:nutrition'],
    briefTemplateHints: ['Seasonal meal plans', 'Budget nutrition', 'Supplement deep dives', 'Myth vs fact'],
    coachingFocus: ['Visual food presentation', 'Credible sourcing', 'Practical takeaways'],
  },
  'beauty': {
    nicheKey: 'beauty',
    contentFormats: ['tutorial', 'product-review', 'grwm', 'dupes', 'skincare-routine'],
    kpiPriority: ['save_rate', 'share_rate', 'engagement_rate'],
    culturalSources: ['reddit:skincareaddiction', 'reddit:makeupaddiction', 'tiktok:beauty'],
    briefTemplateHints: ['Seasonal skincare transitions', 'Drugstore dupes', 'Ingredient deep dives', 'Get ready with me'],
    coachingFocus: ['Lighting and close-up quality', 'Before/after reveals', 'Honest product opinions'],
  },
  'real-estate': {
    nicheKey: 'real-estate',
    contentFormats: ['market-update', 'home-tour', 'investing-tip', 'first-time-buyer', 'renovation'],
    kpiPriority: ['save_rate', 'share_rate', 'follower_growth'],
    culturalSources: ['reddit:realestateinvesting', 'reddit:firsttimehomebuyer', 'tiktok:realestate'],
    briefTemplateHints: ['Market predictions', 'House hacking strategies', 'Renovation ROI', 'First-time buyer tips'],
    coachingFocus: ['Local market specificity', 'Number transparency', 'Tour pacing and narration'],
  },
  'self-improvement': {
    nicheKey: 'self-improvement',
    contentFormats: ['morning-routine', 'habit-stack', 'book-summary', 'mindset-shift', 'accountability'],
    kpiPriority: ['save_rate', 'share_rate', 'follower_growth'],
    culturalSources: ['reddit:selfimprovement', 'reddit:productivity', 'tiktok:selfimprovement'],
    briefTemplateHints: ['Morning routine breakdowns', '30-day challenges', 'Book recommendations', 'Productivity systems'],
    coachingFocus: ['Authenticity over guru vibes', 'Actionable steps', 'Vulnerability in storytelling'],
  },
  'dating': {
    nicheKey: 'dating',
    contentFormats: ['storytime', 'advice', 'red-flag-green-flag', 'dating-app-tips', 'relationship-check'],
    kpiPriority: ['comment_rate', 'share_rate', 'engagement_rate'],
    culturalSources: ['reddit:dating', 'reddit:relationships', 'tiktok:dating'],
    briefTemplateHints: ['Dating app experiments', 'Red/green flag series', 'Communication tips', 'First date ideas'],
    coachingFocus: ['Relatable storytelling', 'Balanced perspectives', 'Conversation-starting hooks'],
  },
  'education': {
    nicheKey: 'education',
    contentFormats: ['study-tips', 'exam-prep', 'explainer', 'campus-life', 'study-with-me'],
    kpiPriority: ['save_rate', 'share_rate', 'follower_growth'],
    culturalSources: ['reddit:college', 'reddit:studytips', 'tiktok:studytok'],
    briefTemplateHints: ['Exam season tips', 'Scholarship advice', 'Study method comparisons', 'College application'],
    coachingFocus: ['Clear visual aids', 'Concise explanations', 'Relatable student energy'],
  },
  'career': {
    nicheKey: 'career',
    contentFormats: ['resume-tips', 'interview-prep', 'salary-negotiation', 'day-in-life', 'career-switch'],
    kpiPriority: ['save_rate', 'share_rate', 'comment_rate'],
    culturalSources: ['reddit:careerguidance', 'reddit:jobs', 'tiktok:career'],
    briefTemplateHints: ['Resume red flags', 'Salary negotiation scripts', 'Industry switches', 'Interview prep'],
    coachingFocus: ['Specific actionable advice', 'Real salary numbers', 'Professional credibility'],
  },
  'parenting': {
    nicheKey: 'parenting',
    contentFormats: ['day-in-life', 'hack', 'product-review', 'milestone', 'real-talk'],
    kpiPriority: ['save_rate', 'share_rate', 'comment_rate'],
    culturalSources: ['reddit:parenting', 'reddit:mommit', 'tiktok:momtok'],
    briefTemplateHints: ['Age-specific milestones', 'Budget parenting hacks', 'Real talk moments', 'Product comparisons'],
    coachingFocus: ['Authenticity over perfection', 'Quick useful hacks', 'Emotional connection'],
  },
  'tech': {
    nicheKey: 'tech',
    contentFormats: ['review', 'tutorial', 'comparison', 'unboxing', 'coding-tip'],
    kpiPriority: ['save_rate', 'view_count', 'share_rate'],
    culturalSources: ['reddit:technology', 'reddit:programming', 'tiktok:tech'],
    briefTemplateHints: ['New product launches', 'AI tool roundups', 'Coding tutorials', 'Tech vs tech'],
    coachingFocus: ['Demo over talk', 'Screen recording quality', 'Jargon calibration for audience'],
  },
  'fashion': {
    nicheKey: 'fashion',
    contentFormats: ['ootd', 'haul', 'styling-tip', 'thrift-flip', 'capsule-wardrobe'],
    kpiPriority: ['save_rate', 'share_rate', 'engagement_rate'],
    culturalSources: ['reddit:femalefashionadvice', 'reddit:malefashionadvice', 'tiktok:fashion'],
    briefTemplateHints: ['Seasonal transitions', 'Budget styling', 'Capsule wardrobe builds', 'Trend reports'],
    coachingFocus: ['Outfit transition edits', 'Lighting and color grading', 'Personality in styling'],
  },
  'health': {
    nicheKey: 'health',
    contentFormats: ['myth-busting', 'symptom-explainer', 'wellness-routine', 'doctor-reacts', 'prevention-tip'],
    kpiPriority: ['save_rate', 'share_rate', 'comment_rate'],
    culturalSources: ['reddit:health', 'reddit:medicine', 'tiktok:health'],
    briefTemplateHints: ['Seasonal health tips', 'Common myth debunking', 'When to see a doctor', 'Wellness routines'],
    coachingFocus: ['Credibility and sourcing', 'Avoid medical advice liability', 'Clear visual explanations'],
  },
  'cooking': {
    nicheKey: 'cooking',
    contentFormats: ['recipe-video', 'asmr-cooking', 'meal-prep', 'food-hack', 'restaurant-review'],
    kpiPriority: ['save_rate', 'share_rate', 'follower_growth'],
    culturalSources: ['reddit:cooking', 'reddit:foodhacks', 'tiktok:cooking'],
    briefTemplateHints: ['Seasonal ingredients', 'Holiday recipes', 'Budget meals', 'Quick weeknight dinners'],
    coachingFocus: ['Overhead filming quality', 'Recipe pacing', 'Ingredient close-ups'],
  },
  'psychology': {
    nicheKey: 'psychology',
    contentFormats: ['explainer', 'myth-busting', 'self-check', 'book-recommendation', 'coping-strategy'],
    kpiPriority: ['save_rate', 'share_rate', 'comment_rate'],
    culturalSources: ['reddit:psychology', 'reddit:mentalhealth', 'tiktok:mentalhealth'],
    briefTemplateHints: ['Attachment style content', 'Therapy myths', 'Coping mechanisms', 'Relationship psychology'],
    coachingFocus: ['Responsible framing', 'Disclaimer clarity', 'Relatable examples'],
  },
  'travel': {
    nicheKey: 'travel',
    contentFormats: ['destination-guide', 'budget-travel', 'hidden-gem', 'packing-tips', 'vlog'],
    kpiPriority: ['save_rate', 'share_rate', 'engagement_rate'],
    culturalSources: ['reddit:travel', 'reddit:solotravel', 'tiktok:travel'],
    briefTemplateHints: ['Off-season destinations', 'Budget breakdowns', 'Hidden gems', 'Travel hack series'],
    coachingFocus: ['Cinematic B-roll', 'Specific cost breakdowns', 'Actionable itineraries'],
  },
  'diy': {
    nicheKey: 'diy',
    contentFormats: ['tutorial', 'before-after', 'tool-review', 'budget-build', 'repair-guide'],
    kpiPriority: ['save_rate', 'share_rate', 'view_count'],
    culturalSources: ['reddit:diy', 'reddit:homeimprovement', 'tiktok:diy'],
    briefTemplateHints: ['Weekend projects', 'Tool comparisons', 'Rental-friendly upgrades', 'Budget renovations'],
    coachingFocus: ['Clear step-by-step progression', 'Before/after reveals', 'Safety callouts'],
  },
  'language': {
    nicheKey: 'language',
    contentFormats: ['lesson', 'pronunciation', 'cultural-tip', 'immersion-vlog', 'mistake-correction'],
    kpiPriority: ['save_rate', 'comment_rate', 'follower_growth'],
    culturalSources: ['reddit:languagelearning', 'reddit:polyglot', 'tiktok:language'],
    briefTemplateHints: ['Common mistake series', 'Cultural context lessons', 'Fluency challenges', 'Phrasebook essentials'],
    coachingFocus: ['Clear pronunciation audio', 'Visual text overlays', 'Cultural context depth'],
  },
};

export function getAgencySkills(nicheKey: string): AgencySkillSet {
  return AGENCY_SKILL_SETS[nicheKey] || {
    nicheKey: 'default',
    contentFormats: ['educational', 'storytelling', 'tutorial', 'behind-scenes'],
    kpiPriority: ['view_count', 'engagement_rate', 'follower_growth'],
    culturalSources: ['reddit:general', 'tiktok:trending'],
    briefTemplateHints: ['Trending topics', 'Audience Q&A', 'Behind the scenes'],
    coachingFocus: ['Hook quality', 'Consistency', 'Audience interaction'],
  };
}

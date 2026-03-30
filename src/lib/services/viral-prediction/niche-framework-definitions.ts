/**
 * Niche and Framework Definitions
 * Defines 20 niches × 60+ frameworks for pattern-based scraping
 *
 * This file serves as the central configuration for:
 * - Which niches to scrape
 * - Which viral frameworks apply to each niche
 * - LLM filter criteria for content quality
 */

export interface NicheDefinition {
  id: string;
  name: string;
  description: string;
  keywords: string[]; // Search terms for scraping
  frameworks: string[]; // Framework IDs that work well in this niche
  llmFilterCriteria: {
    mustHave: string[]; // Content must include these elements
    mustNotHave: string[]; // Content must NOT include these
    qualitySignals: string[]; // Indicators of high-quality content
  };
  exampleCreators?: string[]; // Reference creators in this niche
}

/**
 * 20 High-Value Niches for Viral Content
 */
export const VIRAL_NICHES: NicheDefinition[] = [
  {
    id: 'personal-finance',
    name: 'Personal Finance & Money',
    description: 'Money-making, investing, side hustles, financial freedom',
    keywords: [
      '#money', '#investing', '#sidehustle', '#financialfreedom',
      '#makemoneyonline', '#crypto', '#stocks', '#passiveincome',
      '#entrepreneur', '#wealthbuilding'
    ],
    frameworks: [
      'triple-layer-hook', 'problem-agitation-solution', 'story-to-lesson',
      'secret-reveal', 'mistake-framework', 'transformation-showcase'
    ],
    llmFilterCriteria: {
      mustHave: ['actionable advice', 'specific strategy', 'real results'],
      mustNotHave: ['illegal activities', 'pyramid scheme', 'get rich quick scam'],
      qualitySignals: ['data/statistics', 'personal experience', 'step-by-step guide']
    }
  },
  {
    id: 'self-improvement',
    name: 'Self-Improvement & Productivity',
    description: 'Habits, productivity, mindset, personal development',
    keywords: [
      '#selfimprovement', '#productivity', '#habits', '#mindset',
      '#motivation', '#discipline', '#morningroutine', '#growthmindset',
      '#successmindset', '#personaldevelopment'
    ],
    frameworks: [
      'transformation-showcase', 'day-in-life', 'routine-breakdown',
      'before-after', 'challenge-framework', 'habit-stacking'
    ],
    llmFilterCriteria: {
      mustHave: ['practical tips', 'clear steps', 'measurable outcomes'],
      mustNotHave: ['toxic positivity', 'harmful advice'],
      qualitySignals: ['scientific backing', 'personal results', 'actionable steps']
    }
  },
  {
    id: 'fitness-health',
    name: 'Fitness & Health',
    description: 'Workouts, nutrition, weight loss, muscle building',
    keywords: [
      '#fitness', '#gym', '#workout', '#weightloss',
      '#nutrition', '#bodybuilding', '#transformation', '#health',
      '#fitnessmotivation', '#gains'
    ],
    frameworks: [
      'transformation-showcase', 'workout-tutorial', 'myth-busting',
      'before-after', 'day-in-life', 'challenge-framework'
    ],
    llmFilterCriteria: {
      mustHave: ['proper form', 'safety tips', 'realistic expectations'],
      mustNotHave: ['dangerous techniques', 'eating disorders', 'unqualified medical advice'],
      qualitySignals: ['certified trainer', 'scientific explanation', 'progression shown']
    }
  },
  {
    id: 'dating-relationships',
    name: 'Dating & Relationships',
    description: 'Dating advice, relationship tips, social dynamics',
    keywords: [
      '#dating', '#relationships', '#datingadvice', '#love',
      '#relationshiptips', '#datingtips', '#masculinity', '#femininity',
      '#selfcare', '#boundaries'
    ],
    frameworks: [
      'story-to-lesson', 'mistake-framework', 'red-flags-green-flags',
      'pov-format', 'scenario-breakdown', 'psychology-reveal'
    ],
    llmFilterCriteria: {
      mustHave: ['healthy communication', 'respect', 'boundaries'],
      mustNotHave: ['manipulation tactics', 'toxic behavior', 'misogyny/misandry'],
      qualitySignals: ['therapist-backed', 'psychological insights', 'real experiences']
    }
  },
  {
    id: 'tech-ai',
    name: 'Technology & AI',
    description: 'AI tools, tech tutorials, coding, digital trends',
    keywords: [
      '#ai', '#chatgpt', '#tech', '#coding',
      '#technology', '#artificialintelligence', '#programming', '#midjourney',
      '#automation', '#machinelearning'
    ],
    frameworks: [
      'tool-showcase', 'tutorial-format', 'comparison-framework',
      'before-after-ai', 'secret-feature', 'productivity-hack'
    ],
    llmFilterCriteria: {
      mustHave: ['practical use case', 'clear demo', 'actual value'],
      mustNotHave: ['misleading claims', 'fake AI', 'clickbait tech'],
      qualitySignals: ['working example', 'detailed walkthrough', 'real application']
    }
  },
  {
    id: 'business-entrepreneurship',
    name: 'Business & Entrepreneurship',
    description: 'Starting businesses, scaling, marketing, sales',
    keywords: [
      '#business', '#entrepreneur', '#startup', '#marketing',
      '#sales', '#businesstips', '#growyourbusiness', '#ecommerce',
      '#dropshipping', '#businessgrowth'
    ],
    frameworks: [
      'case-study', 'revenue-reveal', 'mistake-framework',
      'strategy-breakdown', 'behind-the-scenes', 'transformation-showcase'
    ],
    llmFilterCriteria: {
      mustHave: ['real numbers', 'specific strategy', 'actionable steps'],
      mustNotHave: ['fake guru', 'unrealistic promises', 'course pitch only'],
      qualitySignals: ['proof of results', 'detailed process', 'transparency']
    }
  },
  {
    id: 'content-creation',
    name: 'Content Creation & Social Media',
    description: 'Growing followers, video editing, content strategy',
    keywords: [
      '#contentcreator', '#socialmediagrowth', '#tiktokgrowth', '#videoediting',
      '#contentcreation', '#influencer', '#algorithm', '#viraltips',
      '#growyouraccount', '#creatortips'
    ],
    frameworks: [
      'meta-content', 'growth-strategy', 'algorithm-hack',
      'before-after-growth', 'analytics-reveal', 'framework-teaching'
    ],
    llmFilterCriteria: {
      mustHave: ['proven results', 'specific tactics', 'actual data'],
      mustNotHave: ['fake growth', 'bot services', 'misleading metrics'],
      qualitySignals: ['real analytics', 'case studies', 'transparent methods']
    }
  },
  {
    id: 'cooking-food',
    name: 'Cooking & Food',
    description: 'Recipes, cooking tutorials, food hacks',
    keywords: [
      '#cooking', '#recipe', '#foodtiktok', '#easyrecipe',
      '#cookinghacks', '#foodie', '#baking', '#mealprep',
      '#quickrecipes', '#homemade'
    ],
    frameworks: [
      'recipe-tutorial', 'satisfying-visual', 'hack-reveal',
      'transformation-food', 'comparison-taste-test', 'asmr-cooking'
    ],
    llmFilterCriteria: {
      mustHave: ['clear steps', 'ingredient list', 'visual appeal'],
      mustNotHave: ['unsafe food handling', 'wasted food', 'incomplete recipe'],
      qualitySignals: ['professional technique', 'final result shown', 'useful tips']
    }
  },
  {
    id: 'psychology-mind',
    name: 'Psychology & Human Behavior',
    description: 'Psychology facts, mental health, cognitive science',
    keywords: [
      '#psychology', '#mentalhealth', '#psychologyfacts', '#mindset',
      '#therapy', '#neuroscience', '#cognitivescience', '#behavioralpsychology',
      '#selfawareness', '#emotionalintelligence'
    ],
    frameworks: [
      'psychology-reveal', 'study-breakdown', 'myth-busting',
      'storytelling-lesson', 'comparison-framework', 'science-explainer'
    ],
    llmFilterCriteria: {
      mustHave: ['scientific basis', 'credible source', 'nuanced explanation'],
      mustNotHave: ['pseudoscience', 'harmful misinformation', 'unqualified diagnosis'],
      qualitySignals: ['research cited', 'expert credentials', 'balanced perspective']
    }
  },
  {
    id: 'career-work',
    name: 'Career & Professional Development',
    description: 'Job search, interviews, workplace tips, career growth',
    keywords: [
      '#career', '#jobsearch', '#interview', '#resume',
      '#professionaldevelopment', '#worklife', '#careeradvice', '#salary',
      '#jobinterview', '#careertips'
    ],
    frameworks: [
      'interview-framework', 'career-story', 'mistake-framework',
      'strategy-breakdown', 'comparison-framework', 'transformation-showcase'
    ],
    llmFilterCriteria: {
      mustHave: ['practical advice', 'professional tone', 'actionable tips'],
      mustNotHave: ['unprofessional content', 'illegal advice', 'discriminatory content'],
      qualitySignals: ['industry experience', 'specific examples', 'proven methods']
    }
  },
  {
    id: 'real-estate',
    name: 'Real Estate & Property',
    description: 'Real estate investing, home buying, property tours',
    keywords: [
      '#realestate', '#realestateinvesting', '#property', '#homebuying',
      '#realtor', '#realestatetips', '#housetour', '#realestateinvestor',
      '#propertyinvestment', '#flippinghouses'
    ],
    frameworks: [
      'property-showcase', 'investment-breakdown', 'before-after-renovation',
      'market-analysis', 'tour-format', 'strategy-reveal'
    ],
    llmFilterCriteria: {
      mustHave: ['real numbers', 'specific location context', 'honest assessment'],
      mustNotHave: ['get rich quick', 'misleading financials', 'pump and dump'],
      qualitySignals: ['professional expertise', 'market data', 'detailed analysis']
    }
  },
  {
    id: 'travel-adventure',
    name: 'Travel & Adventure',
    description: 'Travel tips, destinations, adventures, budget travel',
    keywords: [
      '#travel', '#traveltips', '#adventure', '#budgettravel',
      '#traveltiktok', '#backpacking', '#wanderlust', '#travelhacks',
      '#travelguide', '#solotravel'
    ],
    frameworks: [
      'destination-showcase', 'travel-hack', 'budget-breakdown',
      'day-in-life-travel', 'comparison-destinations', 'journey-story'
    ],
    llmFilterCriteria: {
      mustHave: ['useful information', 'realistic costs', 'practical tips'],
      mustNotHave: ['cultural insensitivity', 'illegal activities', 'dangerous advice'],
      qualitySignals: ['personal experience', 'detailed budget', 'cultural respect']
    }
  },
  {
    id: 'fashion-style',
    name: 'Fashion & Style',
    description: 'Fashion tips, outfit ideas, styling, trends',
    keywords: [
      '#fashion', '#style', '#outfit', '#fashiontips',
      '#ootd', '#stylingtips', '#fashionhacks', '#wardrobe',
      '#fashiontrends', '#styleinspiration'
    ],
    frameworks: [
      'outfit-transformation', 'styling-tutorial', 'comparison-framework',
      'trend-analysis', 'capsule-wardrobe', 'before-after-style'
    ],
    llmFilterCriteria: {
      mustHave: ['practical styling tips', 'clear visuals', 'wearable looks'],
      mustNotHave: ['body shaming', 'promoting eating disorders', 'unrealistic standards'],
      qualitySignals: ['versatile advice', 'budget-friendly options', 'inclusive content']
    }
  },
  {
    id: 'parenting-kids',
    name: 'Parenting & Kids',
    description: 'Parenting tips, kid activities, family life',
    keywords: [
      '#parenting', '#momsoftiktok', '#dadsoftiktok', '#parentingtips',
      '#kids', '#toddler', '#family', '#momlife',
      '#dadlife', '#parentingadvice'
    ],
    frameworks: [
      'parenting-hack', 'story-to-lesson', 'day-in-life-parent',
      'comparison-framework', 'problem-solution', 'reality-check'
    ],
    llmFilterCriteria: {
      mustHave: ['child safety', 'age-appropriate', 'helpful tips'],
      mustNotHave: ['child endangerment', 'exploiting children', 'harmful advice'],
      qualitySignals: ['evidence-based', 'experienced parent', 'realistic expectations']
    }
  },
  {
    id: 'education-learning',
    name: 'Education & Learning',
    description: 'Study tips, learning hacks, educational content',
    keywords: [
      '#studytips', '#education', '#learning', '#studywithme',
      '#student', '#college', '#studyhacks', '#productivity',
      '#examprep', '#studymotivation'
    ],
    frameworks: [
      'tutorial-format', 'study-method', 'comparison-framework',
      'transformation-academic', 'routine-breakdown', 'hack-reveal'
    ],
    llmFilterCriteria: {
      mustHave: ['proven methods', 'actionable advice', 'clear explanation'],
      mustNotHave: ['cheating methods', 'plagiarism', 'harmful shortcuts'],
      qualitySignals: ['scientific backing', 'personal results', 'detailed process']
    }
  },
  {
    id: 'home-diy',
    name: 'Home & DIY',
    description: 'Home improvement, DIY projects, organization',
    keywords: [
      '#diy', '#home', '#homeimprovement', '#diyhome',
      '#organization', '#homedecor', '#hometips', '#cleaning',
      '#diyprojects', '#homeorganization'
    ],
    frameworks: [
      'diy-tutorial', 'before-after-home', 'hack-reveal',
      'transformation-home', 'step-by-step', 'budget-project'
    ],
    llmFilterCriteria: {
      mustHave: ['clear instructions', 'safety warnings', 'realistic results'],
      mustNotHave: ['unsafe practices', 'structural damage risk', 'misleading difficulty'],
      qualitySignals: ['detailed steps', 'cost breakdown', 'professional tips']
    }
  },
  {
    id: 'cars-automotive',
    name: 'Cars & Automotive',
    description: 'Car reviews, maintenance, detailing, automotive tips',
    keywords: [
      '#cars', '#automotive', '#carmaintenance', '#carreview',
      '#cardetailing', '#cartips', '#mechaniclife', '#supercars',
      '#carmodification', '#cartok'
    ],
    frameworks: [
      'review-format', 'tutorial-maintenance', 'before-after-detailing',
      'comparison-cars', 'myth-busting-automotive', 'showcase-format'
    ],
    llmFilterCriteria: {
      mustHave: ['accurate info', 'safety considerations', 'practical advice'],
      mustNotHave: ['unsafe modifications', 'illegal activities', 'reckless driving'],
      qualitySignals: ['expert knowledge', 'detailed explanation', 'safety-first']
    }
  },
  {
    id: 'pets-animals',
    name: 'Pets & Animals',
    description: 'Pet care, training, cute animals, pet tips',
    keywords: [
      '#pets', '#dogs', '#cats', '#petcare',
      '#dogsoftiktok', '#catsoftiktok', '#pettraining', '#animals',
      '#puppies', '#kittens'
    ],
    frameworks: [
      'cute-showcase', 'training-tutorial', 'story-format',
      'before-after-training', 'day-in-life-pet', 'behavior-explainer'
    ],
    llmFilterCriteria: {
      mustHave: ['animal welfare', 'proper care', 'responsible ownership'],
      mustNotHave: ['animal abuse', 'dangerous situations', 'harmful advice'],
      qualitySignals: ['veterinary-backed', 'positive reinforcement', 'safety-focused']
    }
  },
  {
    id: 'comedy-entertainment',
    name: 'Comedy & Entertainment',
    description: 'Skits, humor, relatable content, entertainment',
    keywords: [
      '#comedy', '#funny', '#humor', '#skit',
      '#relatable', '#comedyskit', '#funnytiktok', '#entertainment',
      '#jokes', '#funnyvideos'
    ],
    frameworks: [
      'skit-format', 'pov-comedy', 'relatable-humor',
      'character-comedy', 'parody-format', 'reaction-comedy'
    ],
    llmFilterCriteria: {
      mustHave: ['original humor', 'good timing', 'relatable content'],
      mustNotHave: ['offensive content', 'bullying', 'harmful stereotypes'],
      qualitySignals: ['creative concept', 'good execution', 'positive reception']
    }
  },
  {
    id: 'storytelling-true-crime',
    name: 'Storytelling & True Crime',
    description: 'True crime, story time, mystery, narratives',
    keywords: [
      '#truecrime', '#storytime', '#mystery', '#truecrimestory',
      '#storytelling', '#scary', '#truecrimecommunity', '#unsolved',
      '#crimestory', '#thriller'
    ],
    frameworks: [
      'story-format', 'mystery-reveal', 'serial-storytelling',
      'documentary-style', 'cliffhanger-format', 'narrative-arc'
    ],
    llmFilterCriteria: {
      mustHave: ['factual accuracy', 'respectful tone', 'proper research'],
      mustNotHave: ['victim exploitation', 'misinformation', 'glorifying violence'],
      qualitySignals: ['well-researched', 'engaging narrative', 'respectful approach']
    }
  }
];

/**
 * Get all keywords for scraping across all niches
 */
export function getAllScrapingKeywords(): string[] {
  return VIRAL_NICHES.flatMap(niche => niche.keywords);
}

/**
 * Get keywords for a specific niche
 */
export function getNicheKeywords(nicheId: string): string[] {
  const niche = VIRAL_NICHES.find(n => n.id === nicheId);
  return niche?.keywords || [];
}

/**
 * Get all niche IDs
 */
export function getAllNicheIds(): string[] {
  return VIRAL_NICHES.map(n => n.id);
}

/**
 * Get niche definition by ID
 */
export function getNicheById(nicheId: string): NicheDefinition | undefined {
  return VIRAL_NICHES.find(n => n.id === nicheId);
}

/**
 * Get applicable frameworks for a niche
 */
export function getFrameworksForNiche(nicheId: string): string[] {
  const niche = getNicheById(nicheId);
  return niche?.frameworks || [];
}

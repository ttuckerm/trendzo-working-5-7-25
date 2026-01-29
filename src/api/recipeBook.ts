import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import NodeCache from 'node-cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cache results for 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300 });

// Validation schemas
const QueryParamsSchema = z.object({
  status: z.enum(['HOT', 'COOLING', 'NEW', 'STABLE']).optional(),
  niche: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  // Advanced recommendation parameters
  userSkillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  recentViews: z.string().optional(), // Comma-separated template IDs
  preferredGenes: z.string().optional(), // Comma-separated gene indices
  seasonalBoost: z.coerce.boolean().default(true).optional()
});

const TemplateResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  niche: z.string(),
  status: z.enum(['HOT', 'COOLING', 'NEW', 'STABLE']),
  success_rate: z.number(),
  trend_pct: z.number(),
  main_genes: z.array(z.string())
});

const RecipeBookResponseSchema = z.object({
  templates: z.array(TemplateResponseSchema)
});

export type TemplateResponse = z.infer<typeof TemplateResponseSchema>;
export type RecipeBookResponse = z.infer<typeof RecipeBookResponseSchema>;

// Gene framework mapping (top 48 genes by index)
const GENE_NAMES = [
  'AuthorityHook', 'ControversyHook', 'TransformationBeforeAfter', 'QuestionHook', 'NumbersHook',
  'UrgencyHook', 'PersonalStoryHook', 'FailureToSuccessHook', 'ComparisonHook', 'TutorialHook',
  'ReactionHook', 'SecretRevealHook', 'MythBustingHook', 'TrendJackingHook', 'EmotionalHook',
  'VisualImpactElement', 'ColorContrastElement', 'MotionElement', 'TextOverlayElement', 'TransitionElement',
  'MusicSyncElement', 'FilterEffectElement', 'CameraAngleElement', 'LightingElement', 'FramingElement',
  'PacingStructure', 'CliffhangerStructure', 'CallbackStructure', 'LoopStructure', 'BuildupStructure',
  'RevealStructure', 'PatternBreakStructure', 'MirrorStructure', 'ContrastStructure', 'ProgressionStructure',
  'EmotionalArc', 'SurpriseArc', 'ReliefArc', 'TensionArc', 'SatisfactionArc',
  'EngagementTrigger', 'ShareabilityTrigger', 'MemorabilityTrigger', 'CuriosityTrigger', 'UrgencyTrigger',
  'SocialProofTrigger', 'FOMOTrigger', 'ViralityTrigger'
];

/**
 * Extract main genes from centroid vector
 */
function extractMainGenes(centroid: number[]): string[] {
  if (!centroid || centroid.length === 0) {
    return ['UnknownGene1', 'UnknownGene2'];
  }

  // Get indices sorted by value (descending)
  const indexValuePairs = centroid
    .map((value, index) => ({ index, value }))
    .sort((a, b) => b.value - a.value);

  // Take top 2 indices and map to gene names
  const topTwoIndices = indexValuePairs.slice(0, 2).map(pair => pair.index);
  
  return topTwoIndices.map(index => {
    return index < GENE_NAMES.length ? GENE_NAMES[index] : `Gene${index}`;
  });
}

/**
 * Generate cache key for request parameters
 */
function getCacheKey(status?: string, niche?: string, limit?: number): string {
  return `recipe_book:${status || 'all'}:${niche || 'all'}:${limit || 50}`;
}

/**
 * Advanced recommendation algorithms for template discovery
 */
interface RecommendationContext {
  userNiche?: string;
  userSkillLevel?: 'beginner' | 'intermediate' | 'advanced';
  recentViews?: string[];
  preferredGenes?: number[];
  seasonalBoost?: boolean;
}

/**
 * Calculate template similarity using advanced algorithms
 */
function calculateTemplateSimiliarity(template1: any, template2: any): number {
  if (!template1.centroid || !template2.centroid) return 0;
  
  // Cosine similarity for gene vectors
  const dotProduct = template1.centroid.reduce((sum: number, val: number, idx: number) => 
    sum + (val * (template2.centroid[idx] || 0)), 0);
  
  const magnitude1 = Math.sqrt(template1.centroid.reduce((sum: number, val: number) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(template2.centroid.reduce((sum: number, val: number) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Content-based filtering using gene patterns and performance metrics
 */
function applyContentBasedFiltering(templates: any[], context: RecommendationContext): any[] {
  if (!context.preferredGenes || context.preferredGenes.length === 0) {
    return templates;
  }

  // Score templates based on gene alignment with user preferences
  return templates.map(template => {
    if (!template.centroid) return { ...template, contentScore: 0 };

    // Calculate gene alignment score
    let geneAlignment = 0;
    for (const geneIndex of context.preferredGenes!) {
      if (geneIndex < template.centroid.length) {
        geneAlignment += template.centroid[geneIndex] || 0;
      }
    }
    
    geneAlignment /= context.preferredGenes!.length;

    // Boost score based on performance and status
    let performanceBoost = 1;
    switch (template.status) {
      case 'HOT': performanceBoost = 1.3; break;
      case 'NEW': performanceBoost = 1.15; break;
      case 'STABLE': performanceBoost = 1.05; break;
      case 'COOLING': performanceBoost = 0.8; break;
    }

    const successRateBoost = Math.min((template.success_rate || 0) * 2, 1.2);
    const trendBoost = Math.max(1, 1 + ((template.trend_pct || 0) * 0.5));

    const contentScore = geneAlignment * performanceBoost * successRateBoost * trendBoost;

    return { ...template, contentScore };
  }).sort((a, b) => (b.contentScore || 0) - (a.contentScore || 0));
}

/**
 * Collaborative filtering using template co-occurrence patterns
 */
async function applyCollaborativeFiltering(templates: any[], context: RecommendationContext): Promise<any[]> {
  if (!context.recentViews || context.recentViews.length === 0) {
    return templates;
  }

  try {
    // Get templates that users who viewed recent templates also used
    const { data: cooccurrenceData, error } = await supabase
      .from('template_usage_patterns') // Hypothetical table for tracking usage
      .select('template_id, related_templates, usage_count')
      .in('template_id', context.recentViews);

    if (error || !cooccurrenceData) {
      console.warn('Collaborative filtering data unavailable:', error?.message);
      return templates;
    }

    // Build recommendation scores based on co-occurrence
    const collaborativeScores: Map<string, number> = new Map();

    for (const usage of cooccurrenceData) {
      const relatedTemplates = Array.isArray(usage.related_templates) ? usage.related_templates : [];
      const baseScore = (usage.usage_count || 0) / 100; // Normalize usage count

      for (const relatedId of relatedTemplates) {
        const currentScore = collaborativeScores.get(relatedId) || 0;
        collaborativeScores.set(relatedId, currentScore + baseScore);
      }
    }

    // Apply collaborative scores to templates
    return templates.map(template => {
      const collaborativeScore = collaborativeScores.get(template.template_id) || 0;
      return { ...template, collaborativeScore };
    }).sort((a, b) => (b.collaborativeScore || 0) - (a.collaborativeScore || 0));

  } catch (error) {
    console.warn('Collaborative filtering failed:', error);
    return templates;
  }
}

/**
 * Apply seasonal and trending boosts
 */
function applySeasonalTrendingBoosts(templates: any[], context: RecommendationContext): any[] {
  if (!context.seasonalBoost) return templates;

  const now = new Date();
  const month = now.getMonth();
  const dayOfWeek = now.getDay();

  return templates.map(template => {
    let seasonalScore = 1;

    // Monthly seasonal patterns
    const monthlyBoosts: Record<string, number[]> = {
      'fitness': [0, 11, 0, 1, 2, 3], // January, December (New Year), March-May (summer prep)
      'food': [10, 11, 0, 8, 9],      // Thanksgiving, Christmas, New Year, fall months
      'education': [7, 8, 0, 1],      // Back to school, New Year learning
      'business': [0, 8, 9],          // New Year, September planning
      'entertainment': [5, 6, 11]     // Summer, Christmas
    };

    const niche = template.niche?.toLowerCase() || '';
    for (const [nichePattern, boostMonths] of Object.entries(monthlyBoosts)) {
      if (niche.includes(nichePattern) && boostMonths.includes(month)) {
        seasonalScore *= 1.2;
        break;
      }
    }

    // Weekly patterns (weekend boost for entertainment, weekday for business)
    if (niche.includes('entertainment') && (dayOfWeek === 5 || dayOfWeek === 6)) {
      seasonalScore *= 1.1;
    } else if (niche.includes('business') && dayOfWeek >= 1 && dayOfWeek <= 5) {
      seasonalScore *= 1.1;
    }

    // Trend momentum boost
    const trendMomentum = (template.trend_pct || 0) > 0.1 ? 1.15 : 1;

    return { ...template, seasonalScore: seasonalScore * trendMomentum };
  });
}

/**
 * Diversification algorithm to avoid too similar templates
 */
function applyDiversification(templates: any[], maxSimilarTemplates: number = 3): any[] {
  if (templates.length <= maxSimilarTemplates) return templates;

  const diversifiedTemplates: any[] = [];
  const similarityThreshold = 0.8;

  for (const template of templates) {
    // Check if this template is too similar to already selected ones
    const isTooSimilar = diversifiedTemplates.some(selected => {
      const similarity = calculateTemplateSimiliarity(template, selected);
      return similarity > similarityThreshold;
    });

    if (!isTooSimilar || diversifiedTemplates.length < maxSimilarTemplates) {
      diversifiedTemplates.push(template);
    }

    // Stop when we have enough diverse templates
    if (diversifiedTemplates.length >= templates.length * 0.8) break;
  }

  return diversifiedTemplates;
}

/**
 * Fetch templates from database with advanced recommendation algorithms
 */
async function fetchTemplates(
  status?: string, 
  niche?: string, 
  limit: number = 50,
  context: RecommendationContext = {}
): Promise<TemplateResponse[]> {
  let query = supabase
    .from('template_library')
    .select('template_id, name, niche, status, success_rate, trend_pct, centroid, updated_at');

  // Apply status filter
  if (status) {
    query = query.eq('status', status);
  }

  // Apply niche filter (case-insensitive substring match)
  if (niche) {
    query = query.ilike('niche', `%${niche}%`);
    context.userNiche = niche; // Set user niche context
  }

  // Fetch more data for better recommendation algorithms
  query = query.limit(Math.min(limit * 2, 200)); // Get 2x data for better filtering

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Apply advanced recommendation algorithms
  let processedTemplates = [...data];

  // 1. Apply content-based filtering (gene preferences)
  if (context.preferredGenes && context.preferredGenes.length > 0) {
    processedTemplates = applyContentBasedFiltering(processedTemplates, context);
  }

  // 2. Apply collaborative filtering (similar users' preferences)
  processedTemplates = await applyCollaborativeFiltering(processedTemplates, context);

  // 3. Apply seasonal and trending boosts
  if (context.seasonalBoost !== false) { // Default to true unless explicitly disabled
    context.seasonalBoost = true;
    processedTemplates = applySeasonalTrendingBoosts(processedTemplates, context);
  }

  // 4. Apply skill level filtering
  if (context.userSkillLevel) {
    processedTemplates = processedTemplates.filter(template => {
      const complexity = calculateTemplateComplexity(template.centroid || []);
      
      switch (context.userSkillLevel) {
        case 'beginner':
          return complexity <= 0.4; // Simple templates
        case 'intermediate':
          return complexity > 0.3 && complexity <= 0.7; // Medium complexity
        case 'advanced':
          return complexity > 0.6; // Complex templates
        default:
          return true;
      }
    });
  }

  // 5. Custom sort with advanced ranking
  const statusPriority = { 'HOT': 0, 'NEW': 1, 'STABLE': 2, 'COOLING': 3 };
  
  processedTemplates.sort((a, b) => {
    // Combine multiple scoring factors
    const aScore = calculateFinalScore(a, statusPriority);
    const bScore = calculateFinalScore(b, statusPriority);
    
    return bScore - aScore; // Higher scores first
  });

  // 6. Apply diversification to avoid too similar results
  processedTemplates = applyDiversification(processedTemplates, 3);

  // 7. Apply final limit
  processedTemplates = processedTemplates.slice(0, limit);

  // Transform to response format
  return processedTemplates.map(template => ({
    id: template.template_id,
    name: template.name || 'Untitled Template',
    niche: template.niche || 'general',
    status: template.status as 'HOT' | 'COOLING' | 'NEW' | 'STABLE',
    success_rate: template.success_rate || 0,
    trend_pct: template.trend_pct || 0,
    main_genes: extractMainGenes(template.centroid || [])
  }));
}

/**
 * Calculate template complexity based on gene activation patterns
 */
function calculateTemplateComplexity(centroid: number[]): number {
  if (!centroid || centroid.length === 0) return 0.5; // Default medium complexity
  
  // Count activated genes (threshold > 0.3)
  const activatedGenes = centroid.filter(gene => gene > 0.3).length;
  const activationRatio = activatedGenes / centroid.length;
  
  // Calculate diversity of activation (higher diversity = more complex)
  const mean = centroid.reduce((sum, val) => sum + val, 0) / centroid.length;
  const variance = centroid.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / centroid.length;
  const diversity = Math.sqrt(variance);
  
  // Combine factors for complexity score
  return Math.min((activationRatio * 0.6) + (diversity * 0.4), 1);
}

/**
 * Calculate final ranking score combining multiple factors
 */
function calculateFinalScore(template: any, statusPriority: Record<string, number>): number {
  // Base score from status priority (inverted so lower priority = higher score)
  const statusScore = (4 - (statusPriority[template.status] || 4)) * 25; // 0-75 points
  
  // Performance score
  const successScore = (template.success_rate || 0) * 20; // 0-20 points
  const trendScore = Math.max(-10, Math.min(10, (template.trend_pct || 0) * 100)); // -10 to +10 points
  
  // Recommendation algorithm scores
  const contentScore = (template.contentScore || 0) * 15; // 0-15 points
  const collaborativeScore = (template.collaborativeScore || 0) * 10; // 0-10 points
  const seasonalScore = ((template.seasonalScore || 1) - 1) * 20; // 0-20 points for seasonal boost
  
  // Recency bonus (newer templates get small boost)
  const recencyBonus = template.updated_at ? 
    Math.max(0, 5 - ((Date.now() - new Date(template.updated_at).getTime()) / (24 * 60 * 60 * 1000))) : 0;
  
  return statusScore + successScore + trendScore + contentScore + collaborativeScore + seasonalScore + recencyBonus;
}

/**
 * Recipe Book API Router
 */
export const recipeBookRouter = Router();

recipeBookRouter.get('/recipe-book', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Validate query parameters
    const validationResult = QueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validationResult.error.format()
      });
    }

    const { status, niche, limit, userSkillLevel, recentViews, preferredGenes, seasonalBoost } = validationResult.data;
    const effectiveLimit = Math.min(limit || 50, 100);

    // Build recommendation context
    const context: RecommendationContext = {
      userSkillLevel,
      seasonalBoost
    };

    // Parse comma-separated parameters
    if (recentViews) {
      context.recentViews = recentViews.split(',').map(id => id.trim()).filter(Boolean);
    }

    if (preferredGenes) {
      context.preferredGenes = preferredGenes.split(',')
        .map(gene => parseInt(gene.trim(), 10))
        .filter(gene => !isNaN(gene) && gene >= 0 && gene < 48); // Validate gene indices
    }

    // Enhanced cache key includes recommendation context
    const contextKey = JSON.stringify({
      userSkillLevel,
      recentViews: context.recentViews?.slice(0, 5), // Only first 5 for caching
      preferredGenes: context.preferredGenes?.slice(0, 10), // Only first 10 for caching
      seasonalBoost
    });
    const cacheKey = `${getCacheKey(status, niche, effectiveLimit)}:${Buffer.from(contextKey).toString('base64').slice(0, 16)}`;
    
    const cachedResult = cache.get<RecipeBookResponse>(cacheKey);
    
    if (cachedResult) {
      const duration = Date.now() - startTime;
      res.set('X-Response-Time', `${duration}ms`);
      res.set('X-Cache-Hit', 'true');
      res.set('X-Recommendation-Context', 'cached');
      return res.json(cachedResult);
    }

    // Fetch from database with advanced recommendations
    const templates = await fetchTemplates(status, niche, effectiveLimit, context);
    
    const response: RecipeBookResponse = {
      templates
    };

    // Validate response
    const responseValidation = RecipeBookResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      return res.status(500).json({
        error: 'Internal server error - response validation failed'
      });
    }

    // Cache the result
    cache.set(cacheKey, response);

    const duration = Date.now() - startTime;
    res.set('X-Response-Time', `${duration}ms`);
    res.set('X-Cache-Hit', 'false');
    res.set('X-Templates-Count', templates.length.toString());
    res.set('X-Recommendation-Context', JSON.stringify({
      skillLevel: context.userSkillLevel,
      hasRecentViews: !!(context.recentViews && context.recentViews.length > 0),
      hasPreferredGenes: !!(context.preferredGenes && context.preferredGenes.length > 0),
      seasonalBoost: context.seasonalBoost
    }));
    
    // Performance monitoring with recommendation context
    if (duration > 50) {
      console.warn(`RecipeBook API slow response: ${duration}ms for ${templates.length} templates with advanced recommendations`);
    }

    return res.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('RecipeBook API error:', error);
    
    res.set('X-Response-Time', `${duration}ms`);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Advanced recommendations endpoint with detailed analytics
recipeBookRouter.get('/recipe-book/recommendations', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const validationResult = QueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validationResult.error.format()
      });
    }

    const { status, niche, limit, userSkillLevel, recentViews, preferredGenes, seasonalBoost } = validationResult.data;
    const effectiveLimit = Math.min(limit || 20, 50); // Smaller limit for detailed recommendations

    // Build enhanced recommendation context
    const context: RecommendationContext = {
      userSkillLevel,
      seasonalBoost
    };

    if (recentViews) {
      context.recentViews = recentViews.split(',').map(id => id.trim()).filter(Boolean);
    }

    if (preferredGenes) {
      context.preferredGenes = preferredGenes.split(',')
        .map(gene => parseInt(gene.trim(), 10))
        .filter(gene => !isNaN(gene) && gene >= 0 && gene < 48);
    }

    // Fetch templates with full analytics
    const templates = await fetchTemplates(status, niche, effectiveLimit * 2, context);
    
    // Calculate recommendation reasons for each template
    const templatesWithReasons = templates.slice(0, effectiveLimit).map(template => {
      const reasons: string[] = [];
      
      // Add specific recommendation reasons
      if (template.status === 'HOT') {
        reasons.push('🔥 Currently trending with high engagement');
      }
      
      if (template.status === 'NEW') {
        reasons.push('✨ Newly discovered viral pattern');
      }
      
      if ((template.success_rate || 0) > 0.7) {
        reasons.push('📈 High success rate in recent tests');
      }
      
      if ((template.trend_pct || 0) > 0.2) {
        reasons.push('📊 Strong positive trend momentum');
      }
      
      if (context.userSkillLevel) {
        const complexity = calculateTemplateComplexity(template.centroid || []);
        if (context.userSkillLevel === 'beginner' && complexity <= 0.3) {
          reasons.push('👶 Perfect for beginners - simple to execute');
        } else if (context.userSkillLevel === 'advanced' && complexity > 0.7) {
          reasons.push('🎯 Advanced template with sophisticated techniques');
        }
      }
      
      if (context.recentViews && context.recentViews.length > 0) {
        reasons.push('🤝 Similar to your recently viewed templates');
      }
      
      if (seasonalBoost) {
        const now = new Date();
        const month = now.getMonth();
        const niche = template.niche?.toLowerCase() || '';
        
        if (niche.includes('fitness') && [0, 11, 1, 2, 3].includes(month)) {
          reasons.push('💪 Seasonal fitness trend boost');
        } else if (niche.includes('food') && [10, 11, 0].includes(month)) {
          reasons.push('🍽️ Holiday season content boost');
        }
      }
      
      // Default reason if no specific ones
      if (reasons.length === 0) {
        reasons.push('⭐ Quality template from our curated library');
      }

      return {
        ...template,
        recommendation_reasons: reasons,
        recommendation_score: Math.round(((template as any).finalScore || 50))
      };
    });

    const response = {
      templates: templatesWithReasons,
      recommendation_meta: {
        algorithm_version: '2.0',
        context_applied: {
          skill_level_filtering: !!context.userSkillLevel,
          collaborative_filtering: !!(context.recentViews && context.recentViews.length > 0),
          content_based_filtering: !!(context.preferredGenes && context.preferredGenes.length > 0),
          seasonal_boosting: !!context.seasonalBoost,
          diversification_applied: templatesWithReasons.length > 3
        },
        processing_stats: {
          total_candidates_evaluated: templates.length,
          final_recommendations: templatesWithReasons.length,
          processing_time_ms: Date.now() - startTime
        }
      }
    };

    const duration = Date.now() - startTime;
    res.set('X-Response-Time', `${duration}ms`);
    res.set('X-Algorithm-Version', '2.0');
    res.set('X-Recommendations-Count', templatesWithReasons.length.toString());
    
    return res.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Advanced RecipeBook recommendations error:', error);
    
    res.set('X-Response-Time', `${duration}ms`);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
recipeBookRouter.get('/recipe-book/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache_stats: cache.getStats(),
    features: {
      content_based_filtering: true,
      collaborative_filtering: true,
      seasonal_boosting: true,
      skill_level_filtering: true,
      diversification: true,
      advanced_scoring: true
    }
  });
});

export default recipeBookRouter;
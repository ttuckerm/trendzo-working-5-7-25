/**
 * DNA_Detective - Baseline Per-Video Predictor
 * 
 * Lightweight prediction engine that uses only the 48-gene vector and template library
 * to provide instant viral probability predictions on cold-start drafts.
 * 
 * Performance target: < 50ms response time
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cosineSimilarity, cosineDistance, booleanToVector } from '../utils/cosine-similarity';
import frameworkGenes from '../data/framework_genes.json';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Input validation schema
const inputSchema = z.object({
  genes: z.array(z.boolean()).length(48, "Genes array must contain exactly 48 boolean values")
});

// Output validation schema
const outputSchema = z.object({
  video_probability: z.number().min(0).max(1),
  closest_template: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['HOT', 'COOLING', 'NEW', 'STABLE']),
    distance: z.number().min(0).max(2)
  }),
  top_gene_matches: z.array(z.string()).max(5)
});

// Template interface from database
interface TemplateLibraryEntry {
  template_id: string;
  name: string;
  centroid: number[];
  success_rate: number;
  status: 'HOT' | 'COOLING' | 'NEW' | 'STABLE';
}

// Cache for template library to avoid repeated database calls
let templateCache: {
  templates: TemplateLibraryEntry[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load templates from Supabase with caching
 */
async function loadTemplates(): Promise<TemplateLibraryEntry[]> {
  // Check cache first
  if (templateCache && (Date.now() - templateCache.timestamp) < CACHE_TTL) {
    return templateCache.templates;
  }

  try {
    const { data, error } = await supabase
      .from('template_library')
      .select('template_id, name, centroid, success_rate, status')
      .in('status', ['HOT', 'NEW', 'STABLE']);

    if (error) {
      console.error('DNA_Detective: Failed to load templates from database:', error);
      return [];
    }

    const templates: TemplateLibraryEntry[] = (data || []).map(row => ({
      template_id: row.template_id,
      name: row.name || `Template ${row.template_id}`,
      centroid: Array.isArray(row.centroid) ? row.centroid : [],
      success_rate: row.success_rate || 0,
      status: row.status
    })).filter(template => 
      template.centroid.length === 48 // Ensure valid centroid
    );

    // Update cache
    templateCache = {
      templates,
      timestamp: Date.now()
    };

    return templates;
  } catch (error) {
    console.error('DNA_Detective: Database connection error:', error);
    return [];
  }
}

/**
 * Find genes that match between input and template centroid
 */
function findTopGeneMatches(genes: boolean[], centroid: number[]): string[] {
  const matches: { index: number; strength: number; name: string }[] = [];

  for (let i = 0; i < genes.length; i++) {
    if (genes[i] && centroid[i] >= 0.5) {
      const geneName = frameworkGenes[i.toString() as keyof typeof frameworkGenes];
      if (geneName) {
        matches.push({
          index: i,
          strength: centroid[i],
          name: geneName
        });
      }
    }
  }

  // Sort by centroid strength and take top 5
  return matches
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5)
    .map(match => match.name);
}

/**
 * Calculate viral probability score using heuristic algorithm
 */
function calculateScore(distance: number, successRate: number): number {
  const similarity = 1 - distance;
  return similarity * successRate;
}

/**
 * Handle edge case where all genes are false
 */
function handleAllFalseGenes(): ReturnType<typeof outputSchema.parse> {
  return {
    video_probability: 0.05,
    closest_template: {
      id: '',
      name: 'No Template Match',
      status: 'STABLE',
      distance: 2.0
    },
    top_gene_matches: []
  };
}

/**
 * Handle edge case where template library is empty
 */
function handleEmptyLibrary(): ReturnType<typeof outputSchema.parse> {
  return {
    video_probability: 0.0,
    closest_template: {
      id: '',
      name: 'No Templates Available',
      status: 'STABLE',
      distance: 2.0
    },
    top_gene_matches: []
  };
}

/**
 * Main DNA_Detective prediction function
 * 
 * @param genes - Boolean array of 48 gene values
 * @returns Prediction result with probability and closest template
 */
export async function predictDNA(
  genes: boolean[]
): Promise<ReturnType<typeof outputSchema.parse>> {
  const startTime = Date.now();

  try {
    // Validate input
    const validationResult = inputSchema.safeParse({ genes });
    if (!validationResult.success) {
      throw new Error(`Invalid input: ${validationResult.error.message}`);
    }

    // Handle edge case: all genes false
    if (!genes.some(gene => gene)) {
      return handleAllFalseGenes();
    }

    // Load templates from database
    const templates = await loadTemplates();
    
    // Handle edge case: empty template library
    if (templates.length === 0) {
      return handleEmptyLibrary();
    }

    // Convert boolean genes to number vector
    const geneVector = booleanToVector(genes);

    let bestTemplate: TemplateLibraryEntry | null = null;
    let bestScore = -1;
    let bestDistance = 2.0;

    // Find best matching template
    for (const template of templates) {
      if (template.centroid.length !== 48) {
        continue; // Skip invalid centroids
      }

      const distance = cosineDistance(geneVector, template.centroid);
      const score = calculateScore(distance, template.success_rate);

      if (score > bestScore) {
        bestScore = score;
        bestDistance = distance;
        bestTemplate = template;
      }
    }

    // Handle case where no valid template found
    if (!bestTemplate) {
      return handleEmptyLibrary();
    }

    // Find top gene matches
    const topGeneMatches = findTopGeneMatches(genes, bestTemplate.centroid);

    // Clamp probability to [0, 1] range
    const videoProbability = Math.max(0, Math.min(1, bestScore));

    const result = {
      video_probability: videoProbability,
      closest_template: {
        id: bestTemplate.template_id,
        name: bestTemplate.name,
        status: bestTemplate.status,
        distance: bestDistance
      },
      top_gene_matches: topGeneMatches
    };

    // Validate output
    const outputValidation = outputSchema.safeParse(result);
    if (!outputValidation.success) {
      console.error('DNA_Detective: Output validation failed:', outputValidation.error);
      throw new Error('Internal error: Invalid output format');
    }

    const duration = Date.now() - startTime;
    console.log(`DNA_Detective: Prediction completed in ${duration}ms`);

    return result;

  } catch (error) {
    console.error('DNA_Detective: Prediction error:', error);
    
    // Return safe fallback
    return {
      video_probability: 0.0,
      closest_template: {
        id: '',
        name: 'Error',
        status: 'STABLE',
        distance: 2.0
      },
      top_gene_matches: []
    };
  }
}

/**
 * Clear template cache (useful for testing or forced refresh)
 */
export function clearTemplateCache(): void {
  templateCache = null;
}

/**
 * Get current cache status (useful for monitoring)
 */
export function getCacheStatus(): { cached: boolean; age: number; count: number } {
  if (!templateCache) {
    return { cached: false, age: 0, count: 0 };
  }

  return {
    cached: true,
    age: Date.now() - templateCache.timestamp,
    count: templateCache.templates.length
  };
}

// Export types for external use
export type DNAPredictionInput = z.infer<typeof inputSchema>;
export type DNAPredictionOutput = z.infer<typeof outputSchema>;
export type { TemplateLibraryEntry };
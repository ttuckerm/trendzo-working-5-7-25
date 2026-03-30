/**
 * AdvisorService - Template Match + Fix-List Generator
 * 
 * Runs after Orchestrator to compare draft genes to HOT templates,
 * identifies missing genes, and generates concrete fix recommendations.
 * 
 * Performance target: < 10ms
 */

import { createClient } from '@supabase/supabase-js';
import { recordPrediction } from '@/lib/prediction/record'
import { clamp } from 'lodash';
import type { CohortAxes } from '@/lib/cohorts/key'
import frameworkGenes from '../data/framework_genes.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Input/Output Types
export type AdvisorInput = {
  video_id: string;           // for logging
  genes: boolean[48];         // from GeneTagger
  prediction: {               // from Orchestrator
    probability: number;
    closest_template: {
      id: string;
      name: string;
      status: string;         // 'HOT', 'NEW', etc.
      distance: number;
    };
    enginesUsed: string[];
  };
  variantId?: string | null;
  cohortSnapshot?: CohortAxes;
  modelVersion?: string;
  forceRecheck?: boolean;
};

export type AdvisorOutput = {
  recommendation: {
    template_id: string;
    template_name: string;
    expected_probability: number;  // probability after fixes
    fix_list: string[];            // bullet list of edits
  };
};

// Template library entry type
interface TemplateLibraryEntry {
  id: string;
  name: string;
  status: string;
  centroid: number[];
  created_at: string;
}

/**
 * Gene index to name mapping from framework_genes.json
 */
const GENE_INDEX_TO_NAME: Record<number, string> = frameworkGenes;

/**
 * Generate human-readable fix recommendations based on missing genes
 */
function generateFixRecommendations(missingGenes: string[]): string[] {
  if (missingGenes.length === 0) {
    return ["No changes needed—publish as is."];
  }

  const fixes: string[] = [];
  const maxFixes = Math.min(missingGenes.length, 5); // Show max 5 fixes

  for (let i = 0; i < maxFixes; i++) {
    const gene = missingGenes[i];
    
    // Generate contextual advice based on gene type
    if (gene.includes('Authority')) {
      fixes.push(`Add Authority hook—establish credibility in first 3 seconds`);
    } else if (gene.includes('Transformation') || gene.includes('BeforeAfter')) {
      fixes.push(`Insert before/after at 8s—show dramatic change`);
    } else if (gene.includes('Secret') || gene.includes('Reveal')) {
      fixes.push(`Add secret reveal—"Here's what they don't tell you..."`);
    } else if (gene.includes('Controversy') || gene.includes('Polarizing')) {
      fixes.push(`Add controversial angle—take a strong stance`);
    } else if (gene.includes('Trend') || gene.includes('Current')) {
      fixes.push(`Reference current trend—connect to what's happening now`);
    } else if (gene.includes('Personal') || gene.includes('Story')) {
      fixes.push(`Share personal story—make it relatable and authentic`);
    } else if (gene.includes('Visual') || gene.includes('Hook')) {
      fixes.push(`Enhance visual hook—stronger opening shot/graphic`);
    } else if (gene.includes('CTA') || gene.includes('Action')) {
      fixes.push(`Add clear call-to-action—tell viewers what to do next`);
    } else {
      fixes.push(`Add ${gene} element—incorporate missing viral component`);
    }
  }

  return fixes;
}

/**
 * Main AdvisorService function
 */
export async function advise(input: AdvisorInput): Promise<AdvisorOutput> {
  const startTime = Date.now();
  
  try {
    // 1. Pull template row by id from template_library
    const { data: template, error } = await supabase
      .from('template_library')
      .select('id, name, status, centroid, created_at')
      .eq('id', input.prediction.closest_template.id)
      .single();

    if (error || !template) {
      throw new Error(`Template ${input.prediction.closest_template.id} not found: ${error?.message}`);
    }

    const templateData = template as TemplateLibraryEntry;

    // 2. Determine missing genes
    const missingGenes: string[] = [];
    const centroid = templateData.centroid;

    for (let i = 0; i < 48; i++) {
      if (centroid[i] >= 0.5 && input.genes[i] === false) {
        const geneName = GENE_INDEX_TO_NAME[i] || `Gene${i}`;
        missingGenes.push(geneName);
      }
    }

    // 3. Build fix_list text
    let fixList: string[];
    
    if (templateData.status !== 'HOT' && templateData.status !== 'NEW') {
      // Edge case: template not hot or new
      fixList = ["Template cooling—consider different topic"];
    } else {
      fixList = generateFixRecommendations(missingGenes);
    }

    // 4. Calculate expected_probability
    const missingGeneCount = missingGenes.length;
    const probabilityBoost = 0.10 * missingGeneCount;
    const expectedProbability = clamp(input.prediction.probability + probabilityBoost, 0, 1);

    // 5. Save advisory row in Supabase
    const advisoryData = {
      video_id: input.video_id,
      template_id: templateData.id,
      original_prob: input.prediction.probability,
      expected_prob: expectedProbability,
      fix_list: fixList,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('video_advice')
      .insert(advisoryData);

    // 6. Record prediction event (best-effort)
    try {
      await recordPrediction({
        templateId: templateData.id,
        variantId: input.variantId ?? null,
        cohortSnapshot: input.cohortSnapshot || {
          platform: process.env.NEXT_PUBLIC_DEFAULT_PLATFORM || 'tiktok',
          niche: null,
          contentType: null,
          accountTier: null,
          region: null,
          language: null,
          lengthBand: null,
          productionStyle: null,
          trendStage: null,
          creatorMaturity: null,
          daypartCadence: null,
          audioUsage: null
        },
        predictedProb: input.prediction.probability,
        modelVersion: input.modelVersion || 'advisor-flow',
        force: Boolean(input.forceRecheck)
      })
    } catch {}

    const processingTime = Date.now() - startTime;
    console.log(`AdvisorService: Completed in ${processingTime}ms for video ${input.video_id}`);

    return {
      recommendation: {
        template_id: templateData.id,
        template_name: templateData.name,
        expected_probability: expectedProbability,
        fix_list: fixList
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`AdvisorService error (${processingTime}ms):`, error);
    
    // Fallback response
    return {
      recommendation: {
        template_id: input.prediction.closest_template.id,
        template_name: input.prediction.closest_template.name,
        expected_probability: input.prediction.probability,
        fix_list: ["Analysis unavailable—system error occurred"]
      }
    };
  }
}
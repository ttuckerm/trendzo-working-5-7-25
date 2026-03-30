/**
 * DNA_Detective API Endpoint
 * REST API for viral video prediction using gene-centroid matching
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { predictDNA, clearTemplateCache, getCacheStatus } from '../../../../lib/modules/dna-detective';
import { recordPrediction } from '@/lib/prediction/record'

// Request validation schema
const CohortAxesSchema = z.object({
  platform: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  accountTier: z.string().nullable().optional(),
  niche: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  lengthBand: z.string().nullable().optional(),
  productionStyle: z.string().nullable().optional(),
  trendStage: z.string().nullable().optional(),
  creatorMaturity: z.string().nullable().optional(),
  daypartCadence: z.string().nullable().optional(),
  audioUsage: z.string().nullable().optional()
}).optional()

const PredictRequestSchema = z.object({
  genes: z.array(z.boolean()).length(48, "Genes array must contain exactly 48 boolean values"),
  variantId: z.string().optional(),
  cohortSnapshot: CohortAxesSchema,
  modelVersion: z.string().optional(),
  forceRecheck: z.boolean().optional()
});

// Response schema for documentation
const PredictResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    video_probability: z.number().min(0).max(1),
    closest_template: z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(['HOT', 'COOLING', 'NEW', 'STABLE']),
      distance: z.number().min(0).max(2)
    }),
    top_gene_matches: z.array(z.string()).max(5)
  }).optional(),
  error: z.string().optional(),
  metadata: z.object({
    processing_time_ms: z.number(),
    cache_status: z.object({
      cached: z.boolean(),
      age: z.number(),
      count: z.number()
    })
  })
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          metadata: {
            processing_time_ms: Date.now() - startTime,
            cache_status: getCacheStatus()
          }
        },
        { status: 400 }
      );
    }

    const validationResult = PredictRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid request parameters: ${validationResult.error.message}`,
          metadata: {
            processing_time_ms: Date.now() - startTime,
            cache_status: getCacheStatus()
          }
        },
        { status: 400 }
      );
    }

    const { genes } = validationResult.data;

    // Run prediction
    const prediction = await predictDNA(genes);

    const processingTime = Date.now() - startTime;

    // Record prediction_event (best-effort) for template probability
    try {
      const force = Boolean(validationResult.data.forceRecheck) || (request.headers.get('x-recheck') === 'true')
      const cohort = validationResult.data.cohortSnapshot || {
        platform: 'unknown', contentType: null, accountTier: null, niche: null, region: null, language: null,
        lengthBand: null, productionStyle: null, trendStage: null, creatorMaturity: null, daypartCadence: null, audioUsage: null
      }
      await recordPrediction({
        templateId: String(prediction.closest_template.id || ''),
        variantId: validationResult.data.variantId || null,
        cohortSnapshot: cohort,
        predictedProb: Number(prediction.video_probability || 0),
        modelVersion: validationResult.data.modelVersion || 'dna-detective',
        force
      })
    } catch {}

    // Prepare response
    const response = {
      success: true,
      data: prediction,
      metadata: {
        processing_time_ms: processingTime,
        cache_status: getCacheStatus()
      }
    };

    // Add performance headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Processing-Time': `${processingTime}ms`,
      'X-Cache-Status': getCacheStatus().cached ? 'HIT' : 'MISS',
      'X-Template-Count': getCacheStatus().count.toString()
    });

    return NextResponse.json(response, { headers });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('DNA_Detective API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        metadata: {
          processing_time_ms: processingTime,
          cache_status: getCacheStatus()
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'status':
      return NextResponse.json({
        module: 'DNA_Detective',
        status: 'operational',
        cache_status: getCacheStatus(),
        endpoints: {
          predict: 'POST /api/dna-detective/predict',
          status: 'GET /api/dna-detective/predict?action=status',
          'clear-cache': 'GET /api/dna-detective/predict?action=clear-cache'
        },
        version: '1.0.0'
      });

    case 'clear-cache':
      clearTemplateCache();
      return NextResponse.json({
        success: true,
        message: 'Template cache cleared',
        cache_status: getCacheStatus()
      });

    default:
      return NextResponse.json(
        {
          error: 'Invalid action. Use ?action=status or ?action=clear-cache',
          available_actions: ['status', 'clear-cache']
        },
        { status: 400 }
      );
  }
}

// Note: Avoid exporting types from route modules to keep Next typegen clean
/**
 * Enhanced Pattern Extraction API Endpoint (v2)
 * POST /api/patterns/extract-enhanced
 * 
 * Extracts detailed 9-field patterns for EACH video
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractEnhancedPatterns } from '@/lib/services/pattern-extraction/enhanced-extraction-service';
import type { EnhancedPatternExtractionRequest } from '@/lib/services/pattern-extraction/types-enhanced';

// =====================================================
// Request Validation
// =====================================================

const EnhancedExtractionRequestSchema = z.object({
  niche: z.string().min(1).max(100),
  minDPSScore: z.number().min(0).max(100),
  dateRange: z.string().regex(/^\d+d$/, 'Date range must be in format "30d", "7d", etc.'),
  limit: z.number().int().positive().max(100).optional(),
});

// =====================================================
// POST Handler
// =====================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = EnhancedExtractionRequestSchema.parse(body);
    
    console.log('\n🎯 Enhanced Pattern Extraction Request:', validated);
    
    // Extract patterns
    const result = await extractEnhancedPatterns({
      niche: validated.niche,
      minDPSScore: validated.minDPSScore,
      dateRange: validated.dateRange,
      limit: validated.limit,
    });
    
    return NextResponse.json({
      ...result,
      apiProcessingTimeMs: Date.now() - startTime,
    });

  } catch (error) {
    console.error('❌ Enhanced pattern extraction API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Pattern extraction failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET Handler (Retrieve Stored Patterns)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const minDPSScore = parseFloat(searchParams.get('minDPSScore') || '70');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!niche) {
      return NextResponse.json(
        { success: false, error: 'Niche parameter is required' },
        { status: 400 }
      );
    }

    // Import here to avoid circular dependencies
    const { getTopVideoPatterns } = await import('@/lib/services/pattern-extraction/enhanced-database-service');
    
    const patterns = await getTopVideoPatterns(niche, minDPSScore, limit);
    
    return NextResponse.json({
      success: true,
      niche,
      patterns,
      count: patterns.length,
    });

  } catch (error) {
    console.error('❌ Error fetching enhanced patterns:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch patterns',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


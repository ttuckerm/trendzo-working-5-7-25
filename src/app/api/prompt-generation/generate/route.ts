/**
 * POST /api/prompt-generation/generate
 * Generate cinematic video prompts from user input
 */

import { NextRequest, NextResponse } from 'next/server';
import { PromptGeneratorEngine } from '@/lib/services/prompt-generation/prompt-generator-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_input, constraints, dps_context, use_smart_detection } = body;

    // Validate input
    if (!user_input || user_input.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'user_input is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Initialize engine
    const engine = new PromptGeneratorEngine();

    // Generate prompt
    const result = await engine.generate({
      user_input: user_input.trim(),
      constraints: constraints || {},
      dps_context,
      use_smart_detection: use_smart_detection !== undefined ? use_smart_detection : true, // Default to smart detection
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Prompt generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate prompt',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

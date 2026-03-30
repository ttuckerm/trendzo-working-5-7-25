/**
 * POST /api/generate-cinematic-prompt
 * Transform a TikTok script into a detailed cinematic video prompt for AI video generation
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface CinematicPromptRequest {
  script: string;
  niche?: string;
  visualStyle?: 'modern' | 'cinematic' | 'documentary' | 'dramatic' | 'vibrant';
  duration?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CinematicPromptRequest = await request.json();
    const { script, niche = 'General', visualStyle = 'modern', duration = 15 } = body;

    if (!script || script.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Script is required' },
        { status: 400 }
      );
    }

    const prompt = `Transform this TikTok script into a detailed cinematic video prompt for AI video generation.

SCRIPT:
${script}

NICHE: ${niche}
VISUAL STYLE: ${visualStyle}
TARGET DURATION: ${duration} seconds

Create a production-ready prompt that includes:

1. VISUAL DIRECTION
   - Camera angles (close-up, medium, wide)
   - Camera movements (pan, zoom, dolly, static)
   - Lighting style (natural, dramatic, soft, neon)
   
2. SCENE BREAKDOWN
   - Shot 1 (0-3s): [Hook visual - attention-grabbing opening]
   - Shot 2 (3-8s): [Context visual - establishing the scene]
   - Shot 3 (8-${duration - 5}s): [Value visual - main content]
   - Shot 4 (${duration - 5}-${duration}s): [CTA visual - call to action]

3. AESTHETIC DETAILS
   - Color grading (warm, cool, vibrant, muted, cinematic)
   - Text overlay style suggestions
   - Transition types (cut, fade, swipe, zoom)

4. AI VIDEO PROMPT
   A single, detailed prompt optimized for Kling/Runway/Sora that captures all the above in one cohesive description.

Output as JSON:
{
  "visualDirection": {
    "cameraAngles": [...],
    "cameraMovements": [...],
    "lightingStyle": "..."
  },
  "sceneBreakdown": [
    { "timing": "0-3s", "description": "...", "shotType": "..." },
    { "timing": "3-8s", "description": "...", "shotType": "..." },
    { "timing": "8-${duration - 5}s", "description": "...", "shotType": "..." },
    { "timing": "${duration - 5}-${duration}s", "description": "...", "shotType": "..." }
  ],
  "aesthetics": {
    "colorGrading": "...",
    "textOverlayStyle": "...",
    "transitions": [...]
  },
  "aiVideoPrompt": "Single detailed prompt for video generation - should be 1-2 paragraphs that paint a vivid picture for the AI",
  "estimatedDuration": ${duration}
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional video director and cinematographer. Create detailed, production-ready video prompts optimized for AI video generation tools like Kling, Runway, and Sora. Focus on visual storytelling, dynamic camera work, and engaging aesthetics.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const cinematicData = JSON.parse(content);

    return NextResponse.json({
      success: true,
      cinematicPrompt: cinematicData.aiVideoPrompt,
      fullDetails: cinematicData,
    });

  } catch (error: any) {
    console.error('Cinematic prompt generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate cinematic prompt',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}





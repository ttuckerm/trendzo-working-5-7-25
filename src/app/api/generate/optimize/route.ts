import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface OptimizeRequest {
  originalScript: {
    hook: { content: string };
    context: { content: string };
    value: { content: string };
    cta: { content: string };
    fullScript: string;
  };
  selectedRecommendations: Array<{
    attribute: string;
    suggestion: string;
    example: string;
  }>;
  platform: string;
  length: number;
  niche: string;
}

/**
 * POST /api/generate/optimize
 * Apply optimization recommendations and regenerate script
 */
export async function POST(req: NextRequest) {
  try {
    const body: OptimizeRequest = await req.json();
    const { originalScript, selectedRecommendations, platform, length, niche } = body;

    if (!originalScript || !selectedRecommendations || selectedRecommendations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build optimization instructions from selected recommendations
    const optimizationInstructions = selectedRecommendations
      .map(rec => `- ${rec.suggestion}\n  Example: ${rec.example}`)
      .join('\n\n');

    const systemPrompt = `You are an expert viral video script optimizer. Your task is to improve an existing ${platform} script by applying specific optimization recommendations while maintaining the core concept and message.`;

    const userPrompt = `ORIGINAL SCRIPT:
${originalScript.fullScript}

OPTIMIZATION INSTRUCTIONS:
${optimizationInstructions}

Apply these optimizations to improve the script while keeping the same structure:
1. Hook (0-3s)
2. Context (3-8s)
3. Value (8-${length - 5}s)
4. CTA (${length - 5}s-${length}s)

Respond in the EXACT same format as before:

HOOK (0-3s):
[Optimized hook here]

CONTEXT (3-8s):
[Optimized context here]

VALUE (8-${length - 5}s):
[Optimized value section here]

CTA (${length - 5}s-${length}s):
[Optimized CTA here]

FULL SCRIPT:
[Complete optimized script with timing cues]

CHANGES MADE:
[List the specific improvements you made]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content || '';

    // Parse the optimized script
    const optimizedScript = parseOptimizedScript(content);

    // Extract changes made
    const changesMatch = content.match(/CHANGES MADE[^\n]*:\s*\n([\s\S]*?)(?=$)/i);
    const changesMade = changesMatch ? changesMatch[1].trim() : 'Script optimized based on selected recommendations';

    return NextResponse.json({
      success: true,
      data: {
        optimizedScript,
        changesMade,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });

  } catch (error: any) {
    console.error('Error optimizing script:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function parseOptimizedScript(content: string) {
  const sections = {
    hook: '',
    context: '',
    value: '',
    cta: '',
    fullScript: '',
  };

  // Extract each section using regex
  const hookMatch = content.match(/HOOK[^\n]*:\s*\n([\s\S]*?)(?=\n\n|CONTEXT|$)/i);
  const contextMatch = content.match(/CONTEXT[^\n]*:\s*\n([\s\S]*?)(?=\n\n|VALUE|$)/i);
  const valueMatch = content.match(/VALUE[^\n]*:\s*\n([\s\S]*?)(?=\n\n|CTA|$)/i);
  const ctaMatch = content.match(/CTA[^\n]*:\s*\n([\s\S]*?)(?=\n\n|FULL SCRIPT|$)/i);
  const fullScriptMatch = content.match(/FULL SCRIPT[^\n]*:\s*\n([\s\S]*?)(?=\n\n|CHANGES MADE|$)/i);

  if (hookMatch) sections.hook = hookMatch[1].trim();
  if (contextMatch) sections.context = contextMatch[1].trim();
  if (valueMatch) sections.value = valueMatch[1].trim();
  if (ctaMatch) sections.cta = ctaMatch[1].trim();
  if (fullScriptMatch) sections.fullScript = fullScriptMatch[1].trim();

  return {
    hook: {
      section: 'Hook',
      timing: '0-3s',
      content: sections.hook,
    },
    context: {
      section: 'Context',
      timing: '3-8s',
      content: sections.context,
    },
    value: {
      section: 'Value',
      timing: '8-15s',
      content: sections.value,
    },
    cta: {
      section: 'CTA',
      timing: '15-20s',
      content: sections.cta,
    },
    fullScript: sections.fullScript || `${sections.hook}\n\n${sections.context}\n\n${sections.value}\n\n${sections.cta}`,
  };
}

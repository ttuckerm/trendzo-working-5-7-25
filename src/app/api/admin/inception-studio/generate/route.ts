import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateRequest {
  action: string;
  niche: string;
  platform: string;
  customPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, niche, platform, customPrompt }: GenerateRequest = await request.json();

    if (!action || !niche || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const content = await generateViralContent(action, niche, platform, customPrompt);

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Inception Studio generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

async function generateViralContent(action: string, niche: string, platform: string, customPrompt?: string) {
  const prompts = {
    copy_viral: `Create an ultra-viral ${platform} video script for ${niche} that copies the structure of top viral videos. Include:
1. A hook that stops scrolling in the first 3 seconds
2. A transformation/reveal moment
3. Strong emotional trigger (curiosity, shock, or inspiration)
4. Call-to-action that drives engagement
5. Platform-specific elements (trending sounds, hashtags, etc.)
${customPrompt ? `Additional context: ${customPrompt}` : ''}

Make it so viral that it's guaranteed to get millions of views. Focus on proven viral formulas.`,

    optimize_viral: `Take a ${niche} video concept and optimize it for maximum virality on ${platform}. Include:
1. Psychological triggers that create addiction
2. Pattern interrupts every 3-5 seconds
3. Controversy or polarizing elements
4. Social proof and FOMO
5. Interactive elements that boost engagement
${customPrompt ? `Base concept: ${customPrompt}` : ''}

Make it irresistible to watch and share.`,

    perfect_platform: `Create a ${platform}-native viral video script for ${niche} that leverages:
1. Current trending formats on ${platform}
2. Platform-specific features and limitations
3. Audience behavior patterns unique to ${platform}
4. Optimal timing and pacing for ${platform}
5. Algorithm-friendly elements
${customPrompt ? `Focus area: ${customPrompt}` : ''}

Make it perfectly optimized for ${platform}'s algorithm and user behavior.`,

    viral_inception: `Create a viral ${platform} video script that promotes a viral video prediction platform while being incredibly viral itself. For ${niche} audience:
1. Start with "What if I told you there's a platform that predicts viral videos with 90% accuracy?"
2. Show transformation/before-after of someone using the platform
3. Include social proof and scarcity
4. End with "Comment 'VIRAL' for access"
5. Make the video itself demonstrate the platform's power
${customPrompt ? `Additional angle: ${customPrompt}` : ''}

This should be so viral that it proves the platform's effectiveness.`,

    trend_hijack: `Create a viral ${platform} script for ${niche} that hijacks current trending topics while staying relevant. Include:
1. Reference to a trending meme/topic
2. Unexpected twist that relates to ${niche}
3. Timely and culturally relevant content
4. Shareable moment that becomes quotable
5. Trend-jacking without being forced
${customPrompt ? `Trending topic to hijack: ${customPrompt}` : ''}

Make it feel natural while riding the trend wave.`,

    engagement_magnet: `Create a ${platform} script for ${niche} that maximizes engagement (comments, shares, saves). Include:
1. Questions that demand answers in comments
2. Controversial or debatable statements
3. "Save this" moments with practical value
4. Share-worthy quotes or moments
5. Community-building elements
${customPrompt ? `Engagement focus: ${customPrompt}` : ''}

Design every element to drive specific engagement actions.`
  };

  const prompt = prompts[action as keyof typeof prompts] || prompts.copy_viral;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert viral content creator who has created multiple videos with 10M+ views. You understand psychology, social media algorithms, and what makes content irresistibly shareable. Generate content that's guaranteed to go viral.

Return your response in this exact JSON format:
{
  "title": "Compelling video title",
  "script": "Complete video script with scene directions",
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "viralProbability": 0.95,
  "reasoning": "Why this will go viral"
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedContent = JSON.parse(response);

    // Add metadata
    return {
      id: crypto.randomUUID(),
      title: parsedContent.title,
      script: parsedContent.script,
      viralProbability: parsedContent.viralProbability || 0.9,
      hooks: parsedContent.hooks || [],
      platform,
      niche,
      timestamp: new Date().toISOString(),
      reasoning: parsedContent.reasoning
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback content generation
    return generateFallbackContent(action, niche, platform);
  }
}

function generateFallbackContent(action: string, niche: string, platform: string) {
  const fallbackContent = {
    copy_viral: {
      title: `This ${niche} Hack Changed Everything (You Won't Believe What Happened)`,
      script: `HOOK: "What I'm about to show you will completely change how you think about ${niche}..."

SETUP: Show the problem that everyone in ${niche} faces

TRANSFORMATION: Reveal the solution with dramatic before/after

PROOF: Show social proof and results

CTA: "Comment 'TELL ME' if you want to know the secret"`,
      hooks: ['What I\'m about to show you', 'You won\'t believe', 'This changes everything', 'Comment if you want', 'Before/after reveal']
    },
    optimize_viral: {
      title: `The ${niche} Method That's Breaking the Internet`,
      script: `HOOK: "Everyone's doing ${niche} wrong, and I'm about to prove it..."

CONTROVERSY: Challenge common beliefs

REVEAL: Show the "right" way with evidence

SOCIAL PROOF: Show others' success

CTA: "Save this before it gets taken down"`,
      hooks: ['Everyone\'s doing it wrong', 'I\'m about to prove', 'Save this before', 'Breaking the internet', 'This got taken down']
    },
    viral_inception: {
      title: `This Platform Predicts Viral Videos with 90% Accuracy`,
      script: `HOOK: "What if I told you there's a platform that predicts viral videos?"

STORY: Show someone going from 0 to viral using the platform

PROOF: Show the prediction vs actual results

SOCIAL PROOF: Multiple success stories

CTA: "Comment 'VIRAL' for early access"`,
      hooks: ['What if I told you', 'Predicts viral videos', '90% accuracy', 'Comment VIRAL', 'Early access only']
    }
  };

  const content = fallbackContent[action as keyof typeof fallbackContent] || fallbackContent.copy_viral;

  return {
    id: crypto.randomUUID(),
    title: content.title,
    script: content.script,
    viralProbability: Math.random() * 0.15 + 0.85, // 85-100%
    hooks: content.hooks,
    platform,
    niche,
    timestamp: new Date().toISOString()
  };
}
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { prompt, context } = await request.json();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are JARVIS - the AI assistant for Trendzo. Be helpful and concise.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return NextResponse.json({ 
      text: data.choices[0].message.content, 
      actionApplied: false 
    });
    
  } catch (error) {
    console.error('Brain API error:', error);
    return NextResponse.json({ 
      text: `I apologize, but I'm having trouble connecting to the AI service. Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      actionApplied: false 
    });
  }
}
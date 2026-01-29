import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();
  
  // Just call OpenAI directly - no BS
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
            content: 'You are a helpful AI assistant for the Trendzo platform. Be concise and helpful.'
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
      console.error('OpenAI error:', data.error);
      return NextResponse.json({ 
        text: `Error: ${data.error.message}`, 
        actionApplied: false 
      });
    }
    
    return NextResponse.json({ 
      text: data.choices[0].message.content, 
      actionApplied: false 
    });
    
  } catch (error) {
    console.error('Direct error:', error);
    return NextResponse.json({ 
      text: `Error: ${error.message}`, 
      actionApplied: false 
    });
  }
}
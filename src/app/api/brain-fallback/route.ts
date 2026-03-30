import { NextRequest, NextResponse } from 'next/server';

// Fallback brain API that doesn't use OpenAI - for testing and rate limit avoidance
export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json();
    
    console.log('Brain fallback API called:', {
      prompt: prompt?.substring(0, 50) + '...',
      hasContext: !!context
    });
    
    // Simple pattern matching for common questions
    let response = '';
    
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      response = "Hello! I'm JARVIS, your AI assistant for the Trendzo platform. How can I help you today?";
    } else if (lowerPrompt.includes('what') && lowerPrompt.includes('do')) {
      response = "I can help you with various tasks on the Trendzo platform including viral prediction analysis, template management, and system monitoring. What specific feature would you like to explore?";
    } else if (lowerPrompt.includes('viral') || lowerPrompt.includes('prediction')) {
      response = "The viral prediction system analyzes content using 43 frameworks with 91.3% accuracy. Would you like to analyze a specific video or learn more about the prediction models?";
    } else if (lowerPrompt.includes('help')) {
      response = "I'm here to help! You can ask me about:\n• Viral prediction analysis\n• Template management\n• System performance\n• Feature explanations\n\nWhat would you like to know more about?";
    } else if (lowerPrompt.includes('how') && lowerPrompt.includes('work')) {
      response = "The Trendzo platform uses AI-powered analysis across 11 modules running 24/7. Each module specializes in different aspects like content analysis, trend detection, and optimization. Which module interests you?";
    } else {
      // Default contextual response
      response = `I understand you're asking about: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}". 

The Trendzo platform offers comprehensive viral content analysis with:
• 91.3% prediction accuracy
• 43 viral frameworks
• Real-time trend analysis
• Template optimization

Could you be more specific about what aspect you'd like to explore?`;
    }
    
    return NextResponse.json({ 
      text: response, 
      actionApplied: false,
      fallback: true 
    });
    
  } catch (error) {
    console.error('Brain fallback error:', error);
    
    return NextResponse.json({
      text: "I'm having trouble processing your request. Please try again.",
      actionApplied: false,
      error: true
    });
  }
}
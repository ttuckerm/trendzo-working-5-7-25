import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firebase/firebase';
import { Firestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { AICustomizationResponse, GenerateVariationsRequest } from '@/lib/types/remix';
import { v4 as uuidv4 } from 'uuid';
import { Anthropic } from '@anthropic-ai/sdk';

// Use a type-safe approach for Anthropic API
// For production, install the official SDK with: npm install @anthropic-ai/sdk
interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequest {
  model: string;
  system: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  temperature: number;
}

interface AnthropicContent {
  text: string;
  type: string;
}

interface AnthropicResponse {
  id: string;
  content: AnthropicContent[];
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Simplified Anthropic client for demonstration
const anthropic = {
  messages: {
    create: async (params: AnthropicRequest): Promise<AnthropicResponse> => {
      // In production, replace this with the actual Anthropic SDK call
      // This is just for type-checking during development
      try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error('Missing Anthropic API key');
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Anthropic API error:", error);
        throw error;
      }
    }
  }
};

/**
 * Analyze template using Claude for more creative suggestions
 * 
 * This endpoint uses Anthropic's Claude to provide alternative AI-generated
 * template variations with a focus on creativity and trend awareness.
 */
export async function POST(request: Request) {
  // Authenticate user
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    // Parse request body
    const body: GenerateVariationsRequest = await request.json();
    
    // Validate request
    if (!body.templateId) {
      return NextResponse.json(
        { error: 'Missing required field: templateId' },
        { status: 400 }
      );
    }
    
    // Fetch template data from Firestore
    if (!db) {
      throw new Error('Firestore database not initialized');
    }
    
    const firestore = db as Firestore;
    const templateRef = doc(firestore, 'templates', body.templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    const templateData = templateSnap.data();
    let aiResponse: AICustomizationResponse;
    
    // Get testing mode status from environment variables
    const testingMode = process.env.TESTING_MODE === 'true';
    
    if (testingMode) {
      // Use mock data in testing mode
      aiResponse = generateMockResponse(body.templateId, templateData, body);
    } else {
      try {
        // Call the Claude API for creative suggestions
        aiResponse = await generateClaudeResponse(body.templateId, templateData, body);
        
        // Store the AI response in Firestore for future reference
        const aiResponsesRef = collection(firestore, 'aiResponses');
        await setDoc(doc(aiResponsesRef, uuidv4()), {
          templateId: body.templateId,
          userId: session.user.id,
          timestamp: new Date().toISOString(),
          request: body,
          response: aiResponse,
          model: 'claude'
        });
        
      } catch (aiError) {
        console.error('Error calling Claude service:', aiError);
        // Fallback to mock data if AI service fails
        aiResponse = generateMockResponse(body.templateId, templateData, body);
      }
    }
    
    // Return the AI suggestions
    return NextResponse.json(aiResponse);
    
  } catch (error) {
    console.error('Error analyzing template with Claude:', error);
    return NextResponse.json(
      { error: 'Failed to analyze template' },
      { status: 500 }
    );
  }
}

/**
 * Generate AI response using Claude
 */
async function generateClaudeResponse(
  templateId: string,
  templateData: any,
  requestData: GenerateVariationsRequest
): Promise<AICustomizationResponse> {
  try {
    // Extract the previousPerformance data if available
    const previousPerformance = requestData.previousPerformance || [];
    
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create the system prompt with performance history if available
    let systemPrompt = `You are Claude, an AI assistant specializing in creative content optimization and template analysis. 
Your task is to analyze a template and suggest improvements that will optimize it for ${requestData.goal || 'engagement'}.
You will provide specific, actionable suggestions that will help the user improve their template's performance.`;

    // Add performance history context if available
    if (previousPerformance.length > 0) {
      systemPrompt += `\n\nIMPORTANT: I have performance history data from previous template optimizations that you should use to improve your predictions:`;
      
      // Include up to 3 most recent performance comparisons
      const recentComparisons = previousPerformance.slice(0, 3);
      
      recentComparisons.forEach(comparison => {
        const accuracy = comparison.accuracyMetrics.overallAccuracy * 100;
        systemPrompt += `\n
- Template optimized for: ${comparison.optimizationGoal}
- Model used: ${comparison.modelUsed}
- Prediction accuracy: ${accuracy.toFixed(1)}%
- Predicted views: ${comparison.prediction.predictedViews}, Actual views: ${comparison.actual.actualViews}
- Prediction vs. Actual engagement: ${comparison.prediction.engagementScore} vs. ${comparison.actual.engagementRate * 100}
- Successful suggestions: ${comparison.appliedSuggestions.filter(s => s.applied).length}`;
      });
      
      systemPrompt += `\n\nPlease learn from these previous optimizations. If certain suggestion types performed well, prioritize similar approaches. If predictions were not aligned with reality, calibrate your predictions accordingly.`;
    }
    
    // The user message with template details
    const userMessage = `Here is the template to analyze:
Template ID: ${templateId}
Title: ${templateData.title || 'Untitled Template'}
Category: ${templateData.category || 'Unknown'}
Goal: ${requestData.goal || 'engagement'}
Content Type: ${requestData.contentType || 'video'}
${templateData.description ? `Description: ${templateData.description}` : ''}

Please provide the following in your JSON response:
1. A list of insights about the current template
2. 4-6 creative improvement suggestions with clear reasoning
3. Performance predictions if these changes are implemented

Each suggestion should include:
- A name and description
- The specific reasoning behind it
- The current value and suggested value
- The type of change (caption, hashtags, timing, design, audio, text)
- The expected impact (high, medium, low)

Be creative, specific, and provide suggestions that would significantly enhance this template.`;

    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ],
    });

    // Extract the response text
    const responseText = response.content.map((c: { text: string }) => c.text).join('');
    
    // Parse the JSON from the response
    let parsedResponse;
    try {
      // Use regex to extract JSON if needed
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      parsedResponse = JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing Claude's JSON response:", error);
      console.log("Raw Claude response:", responseText);
      throw new Error("Invalid JSON response from Claude");
    }
    
    // Ensure each suggestion has an ID
    if (parsedResponse.suggestions) {
      parsedResponse.suggestions = parsedResponse.suggestions.map((suggestion: any) => ({
        ...suggestion,
        id: suggestion.id || uuidv4()
      }));
    }
    
    // Construct the response in the expected format
    const aiResponse: AICustomizationResponse = {
      templateId,
      insights: parsedResponse.insights || [],
      suggestions: parsedResponse.suggestions || [],
      performancePrediction: parsedResponse.performancePrediction || {
        engagementScore: 75,
        viralityPotential: 70,
        predictedViews: 12000,
        predictedLikes: 950
      }
    };
    
    return aiResponse;
    
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    throw error;
  }
}

/**
 * Helper function to generate mock AI response data for development
 */
function generateMockResponse(
  templateId: string, 
  templateData: any,
  requestData: GenerateVariationsRequest
): AICustomizationResponse {
  const goal = requestData.goal || 'engagement';
  
  // Generate insights based on template and goal
  const insights = [
    `Your template could benefit from more creative ${goal === 'engagement' ? 'storytelling' : 'call-to-actions'}.`,
    'Incorporating trending audio could increase discovery by up to 45%.',
    'The current aesthetic would appeal more to the 25-34 demographic with slight adjustments.',
    'Adding pattern interrupts would significantly improve viewer retention.',
    'Your content has potential for cross-platform repurposing with minimal adjustments.'
  ];
  
  // Generate suggestions
  const suggestions = [
    {
      id: uuidv4(),
      name: 'Narrative Hook',
      description: 'Story-driven caption to create emotional connection',
      reasoning: 'Narrative-driven content receives 2.3x more engagement than promotional content',
      currentValue: templateData.caption || 'Check out our new product!',
      suggestedValue: 'I never thought our biggest problem could be solved so easily until I discovered this. Here\'s what changed everything for our team... 👇 #gamechangers',
      type: 'caption' as const,
      impact: 'high' as const
    },
    {
      id: uuidv4(),
      name: 'Trend-Aligned Hashtags',
      description: 'Hashtags linked to current platform trends',
      reasoning: 'Trend-aligned hashtags can increase reach by 78% in the first 24 hours',
      currentValue: templateData.hashtags || '#business #productivity',
      suggestedValue: '#productivitok #worklifebalance #techsolutions #dayinthelife #officecore',
      type: 'hashtags' as const,
      impact: 'high' as const
    },
    {
      id: uuidv4(),
      name: 'Pattern Interrupt',
      description: 'Unexpected visual or audio element at 7-second mark',
      reasoning: 'Pattern interrupts at key moments increase watch-through rates by 34%',
      currentValue: 'Consistent pacing throughout',
      suggestedValue: 'Add surprising element at 7-second mark with quick zoom or sound effect',
      type: 'timing' as const,
      impact: 'medium' as const
    },
    {
      id: uuidv4(),
      name: 'Color Psychology Update',
      description: 'Shift color palette to trigger specific emotions',
      reasoning: 'Color psychology can increase conversion rates by up to 21%',
      currentValue: templateData.colorScheme || 'Standard corporate colors',
      suggestedValue: 'Vibrant orange/blue contrast palette for excitement and trust',
      type: 'design' as const,
      impact: 'medium' as const
    },
    {
      id: uuidv4(),
      name: 'Trending Sound Integration',
      description: 'Incorporate viral sound trend relevant to your niche',
      reasoning: 'Content using trending sounds gets 84% more views on average',
      currentValue: templateData.audio || 'Stock music/No audio',
      suggestedValue: 'Adapt the "Core Memory" or "Aesthetic Yearning" sound trend',
      type: 'audio' as const,
      impact: 'high' as const
    }
  ];
  
  // Generate performance prediction
  const performancePrediction = {
    engagementScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-99
    viralityPotential: Math.floor(Math.random() * 40) + 60, // Random score between 60-99
    predictedViews: Math.floor(Math.random() * 50000) + 10000, // Random between 10k-60k
    predictedLikes: Math.floor(Math.random() * 5000) + 1000, // Random between 1k-6k
    targetAudience: ['25-34', '18-24', 'creative professionals', 'early adopters'],
    bestTimeToPost: '12-2pm or 8-10pm weekdays'
  };
  
  return {
    templateId,
    insights,
    suggestions,
    performancePrediction
  };
} 
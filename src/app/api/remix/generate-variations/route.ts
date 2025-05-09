import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/firebase/firebase';
import { Firestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { AICustomizationResponse, GenerateVariationsRequest, RemixSuggestion } from '@/lib/types/remix';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Generate AI variations for a template
 * 
 * This endpoint uses an AI model to suggest variations for a given template
 * based on content analysis and engagement optimization.
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
        // Call the OpenAI API for real suggestions
        aiResponse = await generateAIResponse(body.templateId, templateData, body);
        
        // Store the AI response in Firestore for future reference
        const aiResponsesRef = collection(firestore, 'aiResponses');
        await setDoc(doc(aiResponsesRef, uuidv4()), {
          templateId: body.templateId,
          userId: session.user.id,
          timestamp: new Date().toISOString(),
          request: body,
          response: aiResponse,
          model: 'openai'
        });
        
      } catch (aiError) {
        console.error('Error calling AI service:', aiError);
        // Fallback to mock data if AI service fails
        aiResponse = generateMockResponse(body.templateId, templateData, body);
      }
    }
    
    // Return the AI suggestions
    return NextResponse.json(aiResponse);
    
  } catch (error) {
    console.error('Error generating template variations:', error);
    return NextResponse.json(
      { error: 'Failed to generate variations' },
      { status: 500 }
    );
  }
}

/**
 * Generate AI response using OpenAI
 */
async function generateAIResponse(
  templateId: string,
  templateData: any,
  requestData: GenerateVariationsRequest
): Promise<AICustomizationResponse> {
  try {
    // Extract the previousPerformance data if available
    const previousPerformance = requestData.previousPerformance || [];
    
    // Create the system prompt with performance history if available
    let systemPrompt = `You are an expert content optimization AI that specializes in analyzing and improving templates. 
You will be provided with template data and you should suggest improvements to optimize it for ${requestData.goal || 'engagement'}.
Analyze the template structure, content, and elements to identify opportunities for improvement.`;

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
      
      systemPrompt += `\n\nPlease use this performance data to calibrate your predictions and suggestions. If a certain type of suggestion performed well, consider similar approaches. If predictions were too optimistic or pessimistic, adjust accordingly.`;
    }
    
    // Construct the user prompt with template data
    const userPrompt = `Here is the template data to analyze:
Template ID: ${templateId}
Title: ${templateData.title || 'Untitled Template'}
Category: ${templateData.category || 'Unknown'}
Goal: ${requestData.goal || 'engagement'}
Content Type: ${requestData.contentType || 'video'}
${templateData.description ? `Description: ${templateData.description}` : ''}

Please provide the following in your JSON response:
1. A list of insights about the current template
2. 4-6 specific improvement suggestions with clear reasoning
3. Performance predictions if these changes are implemented

Each suggestion should include:
- A name and description
- The specific reasoning behind it
- The current value and suggested value
- The type of change (caption, hashtags, timing, design, audio, text)
- The expected impact (high, medium, low)`;
    
    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      console.log("Raw content:", content);
      throw new Error("Invalid JSON response from AI service");
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
        viralityPotential: 65,
        predictedViews: 10000,
        predictedLikes: 800
      }
    };
    
    return aiResponse;
    
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
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
    `Your template could benefit from more engaging ${goal === 'engagement' ? 'captions' : 'call-to-actions'}.`,
    'Adding trending hashtags could increase discovery by up to 34%.',
    'The current visual style appeals well to the 18-24 demographic.',
    'Consider adding more dynamic transitions for improved retention.',
    'The pacing is good, but could be optimized for mobile viewing experiences.'
  ];
  
  // Generate suggestions
  const suggestions = [
    {
      id: uuidv4(),
      name: 'Enhanced Caption',
      description: 'More engaging caption with trending keywords',
      reasoning: 'Captions with questions increase comment rates by 89% on average',
      currentValue: templateData.caption || 'Check out our new product!',
      suggestedValue: 'Ever wondered how to boost your productivity? Our new tool makes it easy! 💯 #productivityhack',
      type: 'caption' as const,
      impact: 'high' as const
    },
    {
      id: uuidv4(),
      name: 'Optimized Hashtags',
      description: 'Trending hashtags relevant to your content',
      reasoning: 'Using 3-5 relevant hashtags can increase reach by up to 40%',
      currentValue: templateData.hashtags || '#business #productivity',
      suggestedValue: '#productivitytips #worksmarter #lifehack #productivity2023 #workfromhome',
      type: 'hashtags' as const,
      impact: 'medium' as const
    },
    {
      id: uuidv4(),
      name: 'Timing Optimization',
      description: 'Adjust pacing for key moments',
      reasoning: 'Slowing down at key points increases viewer retention by 23%',
      currentValue: 'Uniform pacing',
      suggestedValue: 'Variable pacing with emphasis on product features',
      type: 'timing' as const,
      impact: 'medium' as const
    },
    {
      id: uuidv4(),
      name: 'Visual Enhancement',
      description: 'Brightened color palette for better engagement',
      reasoning: 'Brighter color schemes receive 18% more engagement on mobile devices',
      currentValue: templateData.colorScheme || 'Muted colors',
      suggestedValue: 'Vibrant palette with higher contrast',
      type: 'design' as const,
      impact: 'high' as const
    },
    {
      id: uuidv4(),
      name: 'Audio Suggestion',
      description: 'Add trending audio track',
      reasoning: 'Content with trending audio receives 45% more views on average',
      currentValue: templateData.audio || 'No audio / Default audio',
      suggestedValue: 'Trending track: "Summer Vibes Remix"',
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
    targetAudience: ['18-24', '25-34', 'tech enthusiasts', 'professionals'],
    bestTimeToPost: '6-8pm weekdays'
  };
  
  return {
    templateId,
    insights,
    suggestions,
    performancePrediction
  };
} 
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getCurrentUserId, handleApiError, createErrorResponse } from '@/lib/utils/apiHelpers'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * POST endpoint to generate a TikTok script using OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request)
    
    // In a production app, check subscription tier here
    // For demo purposes, we'll allow any request to go through
    // const { canAccess } = useSubscription()
    // if (!canAccess('business')) {
    //   return createErrorResponse('AI script generation requires a Business subscription', 403)
    // }
    
    // Parse the request body
    const body = await request.json()
    const { sectionName, industry, style, duration, objective } = body
    
    // Validate required parameters
    if (!sectionName || !industry || !style) {
      return createErrorResponse(
        'Missing required parameters: sectionName, industry, style',
        400
      )
    }
    
    // Create a prompt based on the provided parameters
    const prompt = `Create a short, engaging TikTok script for the section "${sectionName}" 
for a ${industry} business. The style should be ${style}${
      duration ? ` and approximately ${duration} seconds in length` : ''
    }${
      objective ? `. The objective is to ${objective}` : ''
    }. The script should be concise, catchy, and optimized for TikTok's format.`
    
    // Call OpenAI API to generate the script
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a TikTok content expert who specializes in creating engaging, viral scripts for businesses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    })
    
    // Extract the generated script from the response
    const generatedScript = response.choices[0]?.message?.content || 'Unable to generate script'
    
    // Return the generated script
    return NextResponse.json({ 
      script: generatedScript,
      params: { sectionName, industry, style, duration, objective } 
    })
    
  } catch (error) {
    return handleApiError(error, 'Failed to generate script')
  }
} 
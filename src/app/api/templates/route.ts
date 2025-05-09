import { NextRequest, NextResponse } from 'next/server'
import { templateService } from '@/lib/services/templateService'
import { Template } from '@/lib/types/template'
import { getCurrentUserId, handleApiError } from '@/lib/utils/apiHelpers'

// GET all templates for the current user
export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request)
    
    // Fetch templates for the user
    const templates = await templateService.getUserTemplates(userId)
    
    return NextResponse.json(templates)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch templates')
  }
}

// POST create a new template
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request)
    
    // Parse the template data from request body
    const templateData = await request.json() as Partial<Template>
    
    // Create the new template
    const newTemplate = await templateService.createTemplate(userId, templateData)
    
    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Failed to create template')
  }
} 
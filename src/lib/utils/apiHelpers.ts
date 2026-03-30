/**
 * Utility functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Get the current user ID from request headers or cookies
 * For demo purposes, this uses a simple approach
 * In a production app, integrate with Firebase Auth properly
 */
export function getCurrentUserId(request: NextRequest): string {
  // First check the x-user-id header (client can set for testing/demo)
  const headerUserId = request.headers.get('x-user-id')
  if (headerUserId) {
    return headerUserId
  }
  
  // Then check for session cookie (would be set on login)
  const sessionCookie = cookies().get('session')?.value
  if (sessionCookie) {
    // In a real app, you would decode and verify the session cookie
    // For now, return a demo user ID
    return 'auth-user-id'
  }
  
  // Fallback to demo user for testing
  return 'demo-user-id'
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
  message: string, 
  status = 500, 
  details?: string
) {
  const response: { error: string; details?: string } = {
    error: message
  }
  
  if (details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Handle API errors with consistent error responses
 */
export function handleApiError(error: unknown, defaultMessage: string) {
  console.error(`API Error: ${defaultMessage}`, error)
  
  const errorMessage = error instanceof Error ? error.message : defaultMessage
  return createErrorResponse(defaultMessage, 500, errorMessage)
}

/**
 * Check if the request includes a valid user identifier
 * Returns null if authenticated, or an error response if not
 */
export function checkAuthentication(request: NextRequest) {
  const userId = getCurrentUserId(request)
  
  // In a real app, you would validate the user ID/session properly
  // For now, just check if we have something other than the fallback
  if (!userId || userId === 'demo-user-id') {
    // For demo purposes, we're allowing demo-user-id to pass
    // In a real app, you would return an unauthorized response for invalid sessions
    // return createErrorResponse('Unauthorized', 401)
  }
  
  return null
} 
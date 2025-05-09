import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { adminAuthOptions, checkAdminAuth } from '@/lib/auth/admin-auth-options';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await checkAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real implementation, this would:
    // 1. Fetch conversation history from the database
    // 2. Format it for display
    
    // Mock response for demonstration
    const history = [
      {
        id: 'conv-1',
        title: 'Content Structure Updates',
        lastUpdated: new Date(),
        updatedFrameworks: ['Content Structure Analysis', 'Viral Script Engineering'],
        messages: [
          {
            id: 'msg-1',
            content: 'How can we improve the hook types classification?',
            role: 'user',
            timestamp: new Date(Date.now() - 86400000) // 1 day ago
          },
          {
            id: 'msg-2',
            content: 'We can add a new category for "curiosity-based hooks" that trigger user questions.',
            role: 'assistant',
            timestamp: new Date(Date.now() - 86300000)
          }
        ]
      },
      {
        id: 'conv-2',
        title: 'Engagement Framework Adjustments',
        lastUpdated: new Date(Date.now() - 172800000), // 2 days ago
        updatedFrameworks: ['Psychological Engagement'],
        messages: [
          {
            id: 'msg-3',
            content: 'We need better engagement metrics for education content.',
            role: 'user',
            timestamp: new Date(Date.now() - 172800000)
          },
          {
            id: 'msg-4',
            content: 'Let\'s implement a "knowledge transfer efficacy" metric based on comment quality.',
            role: 'assistant',
            timestamp: new Date(Date.now() - 172700000)
          }
        ]
      }
    ];
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Get Conversation History API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
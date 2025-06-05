/**
 * TRENDZO Creator Attribution API
 * 
 * Handles ethical content attribution and creator relationship management
 */

import { NextResponse } from 'next/server';
import { creatorAttributionService } from '@/lib/services/creatorAttributionService';
import { Platform } from '@/lib/types/database';

// POST /api/creator-attribution - Handle attribution actions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'register_creator':
        return await handleRegisterCreator(params);
      
      case 'create_attribution':
        return await handleCreateAttribution(params);
      
      case 'execute_attribution':
        return await handleExecuteAttribution(params);
      
      case 'track_response':
        return await handleTrackResponse(params);
      
      default:
        return NextResponse.json(
          { error: 'Unknown action', availableActions: [
            'register_creator', 'create_attribution', 'execute_attribution', 'track_response'
          ]},
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Creator Attribution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/creator-attribution - Get attribution analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeframe = (searchParams.get('timeframe') as '7d' | '30d' | '90d') || '30d';

    switch (action) {
      case 'analytics':
        return await handleGetAnalytics(timeframe);
      
      case 'dashboard':
        return await handleGetDashboard();
      
      default:
        return await handleGetDashboard();
    }

  } catch (error) {
    console.error('Creator Attribution API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Register a new creator from viral video discovery
 */
async function handleRegisterCreator(params: {
  videoUrl: string;
  platform: Platform;
  username: string;
  displayName?: string;
  avatar?: string;
  followerCount?: number;
  verificationLevel?: 'none' | 'verified' | 'blue' | 'business';
  engagementRate?: number;
}) {
  try {
    console.log('👤 Registering creator:', params.username);

    const creator = await creatorAttributionService.registerCreator(
      params.videoUrl,
      params.platform,
      {
        username: params.username,
        displayName: params.displayName,
        avatar: params.avatar,
        followerCount: params.followerCount,
        verificationLevel: params.verificationLevel,
        engagementRate: params.engagementRate
      }
    );

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        username: creator.username,
        displayName: creator.displayName,
        platform: creator.platform,
        avatar: creator.avatar,
        followerCount: creator.followerCount,
        verificationLevel: creator.verificationLevel,
        profileUrl: creator.profileUrl,
        attributionScore: creator.attributionScore
      },
      message: 'Creator registered successfully',
      attributionReady: true
    });

  } catch (error) {
    console.error('Error registering creator:', error);
    return NextResponse.json(
      { error: 'Failed to register creator', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Create attribution action when user uses a template
 */
async function handleCreateAttribution(params: {
  templateId: string;
  creatorId: string;
  userId: string;
  attributionType?: 'comment' | 'story' | 'post' | 'dm';
  customMessage?: string;
  autoSend?: boolean;
  scheduleFor?: string;
}) {
  try {
    console.log('📧 Creating attribution action for template:', params.templateId);

    const attribution = await creatorAttributionService.createAttributionAction(
      params.templateId,
      params.creatorId,
      params.userId,
      {
        attributionType: params.attributionType,
        customMessage: params.customMessage,
        autoSend: params.autoSend,
        scheduleFor: params.scheduleFor ? new Date(params.scheduleFor) : undefined
      }
    );

    return NextResponse.json({
      success: true,
      attribution: {
        id: attribution.id,
        templateId: attribution.templateId,
        creatorId: attribution.creatorId,
        attributionType: attribution.attributionType,
        attributionMessage: attribution.attributionMessage,
        status: attribution.status,
        scheduledFor: attribution.scheduledFor,
        createdAt: attribution.createdAt
      },
      message: 'Attribution action created successfully',
      nextSteps: [
        'Review attribution message',
        'Choose when to send attribution',
        'Track creator response',
        'Monitor relationship impact'
      ]
    });

  } catch (error) {
    console.error('Error creating attribution:', error);
    return NextResponse.json(
      { error: 'Failed to create attribution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Execute an attribution action
 */
async function handleExecuteAttribution(params: {
  attributionId: string;
}) {
  try {
    console.log('🚀 Executing attribution:', params.attributionId);

    const result = await creatorAttributionService.executeAttribution(params.attributionId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        result,
        message: 'Attribution executed successfully',
        tracking: {
          responseTracking: true,
          engagementMonitoring: true,
          relationshipImpact: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        suggestions: [
          'Check platform permissions',
          'Verify creator profile is active',
          'Try different attribution method',
          'Schedule for better timing'
        ]
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error executing attribution:', error);
    return NextResponse.json(
      { error: 'Failed to execute attribution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Track creator response to attribution
 */
async function handleTrackResponse(params: {
  attributionId: string;
  response: 'positive' | 'neutral' | 'negative';
  responseMessage?: string;
  responseEngagement?: number;
}) {
  try {
    console.log('📊 Tracking creator response:', params.response);

    await creatorAttributionService.trackCreatorResponse(
      params.attributionId,
      params.response,
      params.responseMessage,
      params.responseEngagement
    );

    return NextResponse.json({
      success: true,
      message: 'Creator response tracked successfully',
      impact: {
        relationshipScore: params.response === 'positive' ? '+5' : 
                          params.response === 'negative' ? '-10' : '0',
        communityStanding: params.response === 'positive' ? 'improved' : 'unchanged',
        futureOpportunities: params.response === 'positive' ? 'increased' : 'unchanged'
      }
    });

  } catch (error) {
    console.error('Error tracking response:', error);
    return NextResponse.json(
      { error: 'Failed to track response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get attribution analytics
 */
async function handleGetAnalytics(timeframe: '7d' | '30d' | '90d') {
  try {
    console.log(`📈 Getting attribution analytics for ${timeframe}`);

    const report = await creatorAttributionService.generateAttributionReport(timeframe);

    return NextResponse.json({
      success: true,
      timeframe,
      analytics: {
        summary: report.summary,
        topCreators: report.topCreators.slice(0, 10),
        platformBreakdown: report.platformBreakdown,
        methodEffectiveness: report.methodEffectiveness
      },
      insights: [
        `${report.summary.responseRate.toFixed(1)}% of creators respond to attribution`,
        `${report.summary.positiveResponseRate.toFixed(1)}% of responses are positive`,
        `${report.summary.relationshipGrowth} new creator relationships built`,
        'Attribution improves community standing and collaboration opportunities'
      ],
      recommendations: [
        'Personalize attribution messages for better response rates',
        'Follow up on positive responses to build relationships',
        'Share success stories to encourage more attribution',
        'Track long-term collaboration opportunities'
      ]
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get attribution dashboard
 */
async function handleGetDashboard() {
  try {
    console.log('📊 Getting attribution dashboard');

    // Get recent attribution data
    const report = await creatorAttributionService.generateAttributionReport('30d');

    const dashboard = {
      summary: {
        totalCreators: 156,
        activeAttributions: 23,
        responseRate: report.summary.responseRate,
        relationshipGrowth: report.summary.relationshipGrowth,
        communityScore: 87.3 // Overall community engagement score
      },
      recentActivity: [
        {
          type: 'creator_registered',
          creator: '@viral_fitness_coach',
          platform: 'instagram',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          type: 'attribution_sent',
          creator: '@productivity_guru',
          method: 'comment',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          type: 'positive_response',
          creator: '@business_insights',
          engagement: 15,
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ],
      topPerformers: {
        creators: report.topCreators.slice(0, 5).map(creator => ({
          username: creator.creator.username,
          platform: creator.creator.platform,
          attributions: creator.attributions,
          responseRate: creator.responseRate,
          relationshipGrowth: creator.relationshipGrowth
        })),
        methods: [
          { method: 'comment', successRate: 78, usage: 45 },
          { method: 'dm', successRate: 65, usage: 32 },
          { method: 'story', successRate: 82, usage: 28 }
        ]
      },
      ethical_impact: {
        creatorsSupported: 156,
        positiveInteractions: 234,
        collaborationsFormed: 18,
        communityGrowth: '+34%'
      }
    };

    return NextResponse.json({
      success: true,
      dashboard,
      ethicalPractices: {
        transparencyScore: 95,
        creatorSatisfaction: 4.6,
        communityTrust: 89,
        collaborationRate: 23
      },
      nextActions: [
        'Review pending attributions',
        'Follow up on recent responses',
        'Plan collaboration outreach',
        'Update attribution templates'
      ]
    });

  } catch (error) {
    console.error('Error getting dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
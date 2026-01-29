import { NextResponse } from 'next/server';
import { TemplateDiscoveryEngine } from '@/lib/analytics/discovery';

// This is a simple way to protect the route.
// In a production environment, you'd want something more robust,
// like checking a secret key or an authenticated user's role.
const AUTH_TOKEN = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (AUTH_TOKEN && token !== AUTH_TOKEN) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log('CRON JOB: Starting daily recipe generation...');
    const recipes = await TemplateDiscoveryEngine.generateDailyRecipes();
    console.log('CRON JOB: Finished daily recipe generation.');
    
    return NextResponse.json({
      success: true,
      message: `Generated ${recipes.length} new recipes.`,
      recipes,
    });
  } catch (error) {
    console.error('CRON JOB: Error generating daily recipes:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({ success: false, message: 'An error occurred.', error: errorMessage }),
      { status: 500 }
    );
  }
} 
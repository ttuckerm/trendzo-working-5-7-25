import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with the service role key for admin-level access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Get and validate query parameters with sensible defaults
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const platform = searchParams.get('platform');

    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // 2. Build the database query
    let query = supabase
      .from('video_intelligence')
      .select('*', { count: 'exact' });

    // Apply filtering if a platform is specified
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 3. Execute the query
    const { data, error, count } = await query;

    if (error) {
      // Throw the database error to be caught by the catch block
      throw error;
    }

    // 4. Prepare and return the structured response
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('API Error fetching video intelligence:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch video intelligence data from the database.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
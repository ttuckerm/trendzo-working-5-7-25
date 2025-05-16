// Create this file: src/app/api/test-supabase/route.js
import { createSupabaseClient } from '@/lib/supabase-standalone';
import { NextResponse } from 'next/server';

export async function GET() {
  // Log environment variables - server side only
  console.log('Server-side environment check:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set');
  
  // Create client
  const supabase = createSupabaseClient();
  
  if (!supabase) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create Supabase client' 
    }, { status: 500 });
  }
  
  try {
    // Test a simple query
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      clientInfo: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
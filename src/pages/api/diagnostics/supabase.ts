import { NextApiRequest, NextApiResponse } from 'next';
import { diagnoseSupabaseConnection } from '../../../lib/supabaseConnectionDiagnostics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Starting server-side Supabase diagnostics...');
    
    // Run the diagnostics
    const report = await diagnoseSupabaseConnection();
    
    console.log('Server-side diagnostics completed with status:', report.overallStatus);
    
    // Return the results
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Error running server-side diagnostics:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
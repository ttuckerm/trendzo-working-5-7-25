import { NextApiRequest, NextApiResponse } from 'next';

// Simple proxy to help bypass CORS for testing
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow GET requests for security
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }

    console.log(`Proxying request to: ${url}`);

    // Extract headers from the query string
    let headers: Record<string, string> = {};
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('header_')) {
        const headerName = key.substring(7);
        headers[headerName] = req.query[key] as string;
      }
    });

    // Add Supabase anon key if not already in headers
    if (!headers['apikey'] && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      headers['apikey'] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }

    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    // Get status code and headers
    const status = response.status;
    const responseHeaders = Object.fromEntries(response.headers.entries());

    // Get response body
    let body: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    // Return response
    res.status(status).json({
      status,
      headers: responseHeaders,
      body
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
/**
 * Thumbnail Proxy API
 * 
 * Proxies TikTok thumbnail images to avoid CORS issues
 * and handle expired thumbnail URLs
 * 
 * GET /api/proxy-thumbnail?url=<encoded_thumbnail_url>
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }
  
  try {
    // Validate URL is from TikTok CDN
    const urlObj = new URL(url);
    const validHosts = [
      'p16-sign-va.tiktokcdn.com',
      'p16-sign-sg.tiktokcdn.com',
      'p19-sign-va.tiktokcdn.com',
      'p77-sign-va.tiktokcdn.com',
      'p16-sign.tiktokcdn-us.com',
      'images.tiktok.com',
      // Add more TikTok CDN hosts as needed
    ];
    
    const isValidHost = validHosts.some(host => urlObj.hostname.includes(host) || urlObj.hostname.endsWith('tiktokcdn.com'));
    
    if (!isValidHost) {
      // For non-TikTok URLs, just redirect
      return NextResponse.redirect(url);
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    
    if (!response.ok) {
      console.error(`Thumbnail fetch failed: ${response.status} for ${url}`);
      // Return a default placeholder
      return NextResponse.redirect(
        new URL('/api/placeholder-thumbnail', request.url).toString()
      );
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error: any) {
    console.error('Thumbnail proxy error:', error.message);
    
    // Return redirect to placeholder on error
    return NextResponse.redirect(
      new URL('/api/placeholder-thumbnail', request.url).toString()
    );
  }
}













/**
 * Placeholder Thumbnail API
 * 
 * Returns a simple SVG placeholder image for videos without thumbnails
 * 
 * GET /api/placeholder-thumbnail?title=<video_title>&category=<category>
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Generate a gradient based on category
function getCategoryColor(category?: string): { from: string; to: string } {
  const colors: Record<string, { from: string; to: string }> = {
    'personal-finance': { from: '#0f766e', to: '#14b8a6' },
    'fitness': { from: '#4ade80', to: '#22c55e' },
    'business': { from: '#1e40af', to: '#3b82f6' },
    'food': { from: '#f97316', to: '#fb923c' },
    'beauty': { from: '#ec4899', to: '#f472b6' },
    'real-estate': { from: '#8b5cf6', to: '#a78bfa' },
    'tech': { from: '#6366f1', to: '#818cf8' },
    'career': { from: '#059669', to: '#34d399' },
  };
  
  return colors[category || ''] || { from: '#7b61ff', to: '#ff61a6' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Viral Video';
  const category = searchParams.get('category') || 'all';
  
  const colors = getCategoryColor(category);
  
  // Truncate title if too long
  const displayTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
  
  // Create SVG placeholder with gradient background and title
  const svg = `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.from}"/>
          <stop offset="100%" style="stop-color:${colors.to}"/>
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="600" fill="url(#bg)"/>
      
      <!-- Subtle pattern overlay -->
      <rect width="400" height="600" fill="rgba(0,0,0,0.1)"/>
      
      <!-- Play button circle -->
      <circle cx="200" cy="280" r="50" fill="rgba(255,255,255,0.2)" filter="url(#shadow)"/>
      <circle cx="200" cy="280" r="45" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      
      <!-- Play triangle -->
      <polygon points="188,260 188,300 218,280" fill="rgba(255,255,255,0.9)"/>
      
      <!-- Title text -->
      <text x="200" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.9)" text-anchor="middle">
        ${displayTitle.split(' ').slice(0, 4).join(' ')}
      </text>
      ${displayTitle.split(' ').length > 4 ? `
        <text x="200" y="455" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.9)" text-anchor="middle">
          ${displayTitle.split(' ').slice(4, 8).join(' ')}
        </text>
      ` : ''}
      
      <!-- Category badge -->
      <rect x="150" y="490" width="100" height="28" rx="14" fill="rgba(255,255,255,0.2)"/>
      <text x="200" y="509" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" fill="white" text-anchor="middle">
        🎬 TikTok Video
      </text>
      
      <!-- Viral DNA dots -->
      <circle cx="370" cy="30" r="5" fill="rgba(255,255,255,0.6)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="350" cy="30" r="5" fill="rgba(255,255,255,0.6)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" begin="0.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="330" cy="30" r="5" fill="rgba(255,255,255,0.6)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" begin="0.4s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `.trim();
  
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}













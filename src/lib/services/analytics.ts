// Analytics Service for Campaign Tracking
// Handles all event tracking for landing pages and user journey

import { supabaseClient } from '@/lib/supabase-client';
import { Niche, Platform } from '@/lib/types/database';

// Generate a unique visitor ID for anonymous tracking
function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let visitorId = localStorage.getItem('trendzo_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('trendzo_visitor_id', visitorId);
  }
  return visitorId;
}

// Generate session ID
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('trendzo_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('trendzo_session_id', sessionId);
  }
  return sessionId;
}

// Get device type
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'server';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Extract UTM parameters from URL
function getUTMParameters(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
} {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
  };
}

// Get landing page ID for niche/platform combination
async function getLandingPageId(niche: Niche, platform: Platform): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('landing_pages')
      .select('id')
      .eq('niche', niche)
      .eq('platform', platform)
      .eq('ab_variant', 'control')
      .single();

    if (error) {
      console.error('Error getting landing page ID:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in getLandingPageId:', error);
    return null;
  }
}

// Main event tracking function
export async function trackEvent(
  eventType: string,
  metadata: {
    niche?: Niche;
    platform?: Platform;
    [key: string]: any;
  } = {}
): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const deviceType = getDeviceType();
    const utmParams = getUTMParameters();

    // Get landing page ID if niche and platform are provided
    let landingPageId = null;
    if (metadata.niche && metadata.platform) {
      landingPageId = await getLandingPageId(metadata.niche, metadata.platform);
    }

    const analyticsData = {
      landing_page_id: landingPageId,
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: eventType,
      metadata: metadata,
      device_type: deviceType,
      ...utmParams
    };

    const { error } = await supabaseClient
      .from('campaign_analytics')
      .insert([analyticsData]);

    if (error) {
      console.error('Analytics tracking error:', error);
    }
  } catch (error) {
    console.error('Error in trackEvent:', error);
  }
}

// Specific tracking functions for common events

export async function trackPageView(params: {
  niche: Niche;
  platform: Platform;
  source?: string;
}): Promise<void> {
  await trackEvent('page_view', {
    niche: params.niche,
    platform: params.platform,
    source: params.source || 'direct'
  });
}

export async function trackExitIntentTrigger(params: {
  niche: Niche;
  platform: Platform;
  trigger?: 'mouse' | 'scroll' | 'time';
}): Promise<void> {
  await trackEvent('exit_intent_trigger', {
    niche: params.niche,
    platform: params.platform,
    trigger: params.trigger || 'mouse'
  });
}

export async function trackExitIntentConvert(params: {
  niche: Niche;
  platform: Platform;
  email: string;
}): Promise<void> {
  await trackEvent('exit_intent_convert', {
    niche: params.niche,
    platform: params.platform,
    email_domain: params.email.split('@')[1] // Store domain only for privacy
  });
}

export async function trackCTAClick(params: {
  niche: Niche;
  platform: Platform;
  location: 'hero' | 'phone' | 'footer';
}): Promise<void> {
  await trackEvent('cta_click', {
    niche: params.niche,
    platform: params.platform,
    location: params.location
  });
}

export async function trackEditorEntry(params: {
  niche: Niche;
  platform: Platform;
  source: 'landing' | 'exit_intent' | 'direct';
}): Promise<void> {
  await trackEvent('editor_entry', {
    niche: params.niche,
    platform: params.platform,
    source: params.source
  });
}

export async function trackTemplateSelect(params: {
  templateId: string;
  niche: Niche;
  platform: Platform;
}): Promise<void> {
  await trackEvent('template_select', {
    templateId: params.templateId,
    niche: params.niche,
    platform: params.platform
  });
}

export async function trackEmailCapture(params: {
  email: string;
  source: 'landing_exit' | 'editor_exit' | 'save_template';
  niche?: Niche;
  platform?: Platform;
  templateId?: string;
}): Promise<void> {
  await trackEvent('email_capture', {
    email_domain: params.email.split('@')[1],
    source: params.source,
    niche: params.niche,
    platform: params.platform,
    templateId: params.templateId
  });
}

export async function trackTemplateComplete(params: {
  templateId: string;
  userId: string;
  completionTime: number; // in seconds
}): Promise<void> {
  await trackEvent('template_complete', {
    templateId: params.templateId,
    userId: params.userId,
    completionTime: params.completionTime
  });
}

export async function trackAttributionGiven(params: {
  templateId: string;
  userId: string;
  creatorUsername: string;
  creatorPlatform: string;
}): Promise<void> {
  await trackEvent('attribution_given', {
    templateId: params.templateId,
    userId: params.userId,
    creatorUsername: params.creatorUsername,
    creatorPlatform: params.creatorPlatform
  });
}

// Analytics aggregation functions (for admin dashboard)

export async function getConversionFunnel(params: {
  niche?: Niche;
  platform?: Platform;
  dateRange?: { start: string; end: string };
}): Promise<{
  pageViews: number;
  exitIntentTriggers: number;
  exitIntentConversions: number;
  editorEntries: number;
  templateSelections: number;
  templateCompletions: number;
}> {
  try {
    const { data, error } = await supabaseClient.rpc('get_conversion_funnel', {
      p_niche: params.niche,
      p_platform: params.platform,
      p_start_date: params.dateRange?.start,
      p_end_date: params.dateRange?.end
    });

    if (error) throw error;

    return data || {
      pageViews: 0,
      exitIntentTriggers: 0,
      exitIntentConversions: 0,
      editorEntries: 0,
      templateSelections: 0,
      templateCompletions: 0
    };
  } catch (error) {
    console.error('Error getting conversion funnel:', error);
    return {
      pageViews: 0,
      exitIntentTriggers: 0,
      exitIntentConversions: 0,
      editorEntries: 0,
      templateSelections: 0,
      templateCompletions: 0
    };
  }
}

export async function getTopPerformingPages(limit: number = 10): Promise<Array<{
  niche: Niche;
  platform: Platform;
  pageViews: number;
  conversions: number;
  conversionRate: number;
}>> {
  try {
    const { data, error } = await supabaseClient.rpc('get_top_performing_pages', {
      p_limit: limit
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting top performing pages:', error);
    return [];
  }
}

// Real-time activity for landing page badges
export async function getLiveActivity(): Promise<Array<{
  location: string;
  count: number;
  activity: string;
}>> {
  try {
    // Get recent activity from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabaseClient
      .from('campaign_analytics')
      .select('metadata, created_at')
      .gte('created_at', oneHourAgo)
      .in('event_type', ['page_view', 'template_complete', 'exit_intent_convert'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Process data to generate geographic activity
    // This is a simplified version - in production you'd use IP geolocation
    const locations = ['New York', 'California', 'Texas', 'Florida', 'Pennsylvania'];
    const activities = data || [];
    
    return locations.map(location => ({
      location,
      count: Math.floor(Math.random() * 15) + 1, // Simulated for now
      activity: Math.random() > 0.5 ? 'going viral' : 'using templates'
    }));
  } catch (error) {
    console.error('Error getting live activity:', error);
    return [];
  }
}
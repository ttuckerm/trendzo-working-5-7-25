import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface VideoIntelligence {
  id: string;
  created_at: string;
  video_url: string;
  platform: string;
  author?: string;
  description?: string;
  thumbnail_url?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  engagement_score: number;
  hashtags?: any;
  status: string;
  raw_scraper_payload?: any;
  video_preview_url?: string;
}

export interface ScrapedVideoData {
  platform: string;
  author?: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  engagement_score: number;
  hashtags?: string[];
  raw_data?: any;
}

export class VideoIntelligenceService {
  
  /**
   * Check if a video URL already exists in the database
   */
  static async getVideoByUrl(videoUrl: string): Promise<VideoIntelligence | null> {
    try {
      const { data, error } = await supabase
        .from('video_intelligence')
        .select('*')
        .eq('video_url', videoUrl)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking video URL:', error);
      throw error;
    }
  }

  /**
   * Insert new video intelligence data
   */
  static async createVideoIntelligence(
    videoUrl: string, 
    scrapedData: ScrapedVideoData
  ): Promise<VideoIntelligence> {
    try {
      const { data, error } = await supabase
        .from('video_intelligence')
        .insert({
          video_url: videoUrl,
          platform: scrapedData.platform,
          author: scrapedData.author,
          description: scrapedData.description,
          thumbnail_url: scrapedData.thumbnail_url,
          video_preview_url: scrapedData.video_url,
          like_count: scrapedData.like_count,
          comment_count: scrapedData.comment_count,
          share_count: scrapedData.share_count,
          view_count: scrapedData.view_count,
          engagement_score: scrapedData.engagement_score,
          hashtags: scrapedData.hashtags,
          status: 'unverified',
          raw_scraper_payload: scrapedData.raw_data
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating video intelligence record:', error);
      throw error;
    }
  }

  /**
   * Get all video intelligence records ordered by creation date
   */
  static async getAllVideos(limit: number = 50): Promise<VideoIntelligence[]> {
    try {
      const { data, error } = await supabase
        .from('video_intelligence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching video intelligence records:', error);
      throw error;
    }
  }

  /**
   * Update video status (for tracking prediction accuracy)
   */
  static async updateVideoStatus(id: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('video_intelligence')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating video status:', error);
      throw error;
    }
  }

  /**
   * Get videos by platform
   */
  static async getVideosByPlatform(platform: string, limit: number = 20): Promise<VideoIntelligence[]> {
    try {
      const { data, error } = await supabase
        .from('video_intelligence')
        .select('*')
        .eq('platform', platform)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching videos by platform:', error);
      throw error;
    }
  }
}
/**
 * Real Data Connector
 * 
 * Replaces ALL mock data with real API calls throughout the platform.
 * This is the single source of truth for viral metrics and template data.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TemplateMetrics {
  success_rate: number;
  avg_views: number;
  avg_engagement: number;
  avg_dps: number;
  sample_size: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface VideoMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  dps_score: number;
  engagement_rate: number;
}

export interface PatternData {
  pattern: string;
  dps: number;
  velocity: string;
  niche: string;
  confidence: number;
  count: number;
}

export class RealDataConnector {
  /**
   * Get real metrics for a template instead of mock "91% success rate"
   */
  async getTemplateMetrics(templateId: string): Promise<TemplateMetrics> {
    // First try to get from viral_templates
    const { data: template, error } = await supabase
      .from('viral_templates')
      .select('success_rate, avg_views, avg_engagement, sample_size')
      .eq('id', templateId)
      .single();

    if (!error && template && template.sample_size > 0) {
      return {
        success_rate: template.success_rate || 0,
        avg_views: template.avg_views || 0,
        avg_engagement: template.avg_engagement || 0,
        avg_dps: 0, // Will calculate
        sample_size: template.sample_size,
        confidence: this.calculateConfidence(template.sample_size)
      };
    }

    // Fall back to calculating from similar scraped videos
    return this.calculateMetricsFromSimilarVideos(templateId);
  }

  /**
   * Calculate metrics from similar scraped videos when template data isn't available
   */
  async calculateMetricsFromSimilarVideos(templateId: string): Promise<TemplateMetrics> {
    // Get pattern/style from template
    const { data: template } = await supabase
      .from('viral_templates')
      .select('niche, pattern_type, keywords')
      .eq('id', templateId)
      .single();

    if (!template) {
      return this.getDefaultMetrics();
    }

    // Find similar videos in scraped_videos
    let query = supabase
      .from('scraped_videos')
      .select('dps_score, views_count, likes_count, comments_count, shares_count');

    // Filter by niche if available
    if (template.niche) {
      query = query.ilike('creator_username', `%${template.niche}%`);
    }

    const { data: videos, error } = await query.limit(100);

    if (error || !videos || videos.length === 0) {
      return this.getDefaultMetrics();
    }

    // Calculate averages
    const avgDps = videos.reduce((sum, v) => sum + (parseFloat(v.dps_score) || 0), 0) / videos.length;
    const avgViews = videos.reduce((sum, v) => sum + (v.views_count || 0), 0) / videos.length;
    const viralCount = videos.filter(v => parseFloat(v.dps_score) >= 70).length;

    return {
      success_rate: (viralCount / videos.length) * 100,
      avg_views: avgViews,
      avg_engagement: 0.08, // Default engagement rate
      avg_dps: avgDps,
      sample_size: videos.length,
      confidence: this.calculateConfidence(videos.length)
    };
  }

  /**
   * Get trending patterns from real data (not mock)
   */
  async getTrendingPatterns(limit: number = 5): Promise<PatternData[]> {
    // Get from viral_patterns table
    const { data: patterns, error } = await supabase
      .from('viral_patterns')
      .select('*')
      .order('avg_dps_score', { ascending: false })
      .limit(limit);

    if (!error && patterns && patterns.length > 0) {
      return patterns.map(p => ({
        pattern: p.pattern_description?.substring(0, 50) || p.pattern_type,
        dps: parseFloat(p.avg_dps_score) || 50,
        velocity: this.calculateVelocity(parseFloat(p.success_rate || '0') * 100),
        niche: p.niche || 'General',
        confidence: Math.min(0.95, 0.7 + (p.viral_videos_count / 100)),
        count: p.frequency_count || 1
      }));
    }

    // Fall back to extracting from high-DPS videos
    return this.extractPatternsFromVideos(limit);
  }

  /**
   * Extract patterns from high-performing videos
   */
  async extractPatternsFromVideos(limit: number): Promise<PatternData[]> {
    const { data: videos } = await supabase
      .from('scraped_videos')
      .select('title, dps_score, creator_username')
      .gte('dps_score', 60)
      .order('dps_score', { ascending: false })
      .limit(100);

    if (!videos || videos.length === 0) {
      return [];
    }

    // Extract patterns from titles
    const patternCounts = new Map<string, { dps: number[], count: number }>();
    
    const commonPatterns = [
      { regex: /how to/i, name: 'How To Tutorial' },
      { regex: /secret|hack|trick/i, name: 'Secret Hack' },
      { regex: /mistake|wrong|stop/i, name: 'Avoid Mistakes' },
      { regex: /\d+\s*(ways|tips|things)/i, name: 'Listicle' },
      { regex: /truth|actually|real/i, name: 'Truth Bomb' },
    ];

    videos.forEach(video => {
      if (!video.title) return;
      
      commonPatterns.forEach(pattern => {
        if (pattern.regex.test(video.title)) {
          if (!patternCounts.has(pattern.name)) {
            patternCounts.set(pattern.name, { dps: [], count: 0 });
          }
          const stats = patternCounts.get(pattern.name)!;
          stats.dps.push(parseFloat(video.dps_score));
          stats.count++;
        }
      });
    });

    // Convert to PatternData array
    const results: PatternData[] = [];
    patternCounts.forEach((stats, name) => {
      if (stats.count >= 2) {
        const avgDps = stats.dps.reduce((a, b) => a + b, 0) / stats.dps.length;
        results.push({
          pattern: name,
          dps: Math.round(avgDps * 10) / 10,
          velocity: this.calculateVelocity(Math.round((avgDps - 50) * 2)),
          niche: 'General',
          confidence: Math.min(0.9, 0.6 + (stats.count / 50)),
          count: stats.count
        });
      }
    });

    return results.sort((a, b) => b.dps - a.dps).slice(0, limit);
  }

  /**
   * Get component reliability scores from learning loop
   */
  async getComponentReliability(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('component_reliability')
      .select('component_id, reliability_score')
      .eq('enabled', true);

    if (error || !data) {
      return {};
    }

    const result: Record<string, number> = {};
    data.forEach(c => {
      result[c.component_id] = parseFloat(c.reliability_score);
    });
    return result;
  }

  /**
   * Get Algorithm IQ score and trend
   */
  async getAlgorithmIQ(): Promise<{ score: number; trend: number; history: number[] }> {
    const { data, error } = await supabase
      .from('algorithm_performance')
      .select('iq_score, date')
      .order('date', { ascending: false })
      .limit(7);

    if (error || !data || data.length === 0) {
      return { score: 50, trend: 0, history: [50] };
    }

    const latest = data[0].iq_score;
    const previous = data.length > 1 ? data[1].iq_score : latest;
    const trend = latest - previous;
    const history = data.map(d => d.iq_score).reverse();

    return { score: latest, trend, history };
  }

  /**
   * Get user experience metrics for smart routing
   */
  async getUserExperience(userId: string): Promise<{
    videosCreated: number;
    avgDPS: number;
    successRate: number;
    level: 'beginner' | 'intermediate' | 'expert';
  }> {
    // Get prediction count for user
    const { data: predictions, count } = await supabase
      .from('prediction_events')
      .select('predicted_dps', { count: 'exact' })
      .eq('user_id', userId);

    const videosCreated = count || 0;
    
    // Calculate average DPS
    let avgDPS = 0;
    if (predictions && predictions.length > 0) {
      avgDPS = predictions.reduce((sum, p) => sum + (p.predicted_dps || 0), 0) / predictions.length;
    }

    // Get success rate from outcomes
    const { data: outcomes } = await supabase
      .from('prediction_outcomes')
      .select('within_confidence_range')
      .eq('user_id', userId);

    let successRate = 0;
    if (outcomes && outcomes.length > 0) {
      const successful = outcomes.filter(o => o.within_confidence_range).length;
      successRate = (successful / outcomes.length) * 100;
    }

    // Determine level
    let level: 'beginner' | 'intermediate' | 'expert' = 'beginner';
    if (videosCreated >= 20 && avgDPS >= 70) {
      level = 'expert';
    } else if (videosCreated >= 5) {
      level = 'intermediate';
    }

    return { videosCreated, avgDPS, successRate, level };
  }

  /**
   * Get live prediction stats
   */
  async getPredictionStats(): Promise<{
    total: number;
    avgAccuracy: number;
    avgDPS: number;
    topNiche: string;
  }> {
    const { data: outcomes } = await supabase
      .from('prediction_outcomes')
      .select('accuracy_delta, actual_dps');

    const { data: predictions } = await supabase
      .from('prediction_events')
      .select('predicted_dps, niche');

    const total = predictions?.length || 0;
    
    let avgAccuracy = 0;
    if (outcomes && outcomes.length > 0) {
      const totalError = outcomes.reduce((sum, o) => sum + Math.abs(o.accuracy_delta || 0), 0);
      avgAccuracy = 100 - (totalError / outcomes.length);
    }

    let avgDPS = 0;
    if (predictions && predictions.length > 0) {
      avgDPS = predictions.reduce((sum, p) => sum + (p.predicted_dps || 0), 0) / predictions.length;
    }

    // Find top niche
    const nicheCounts = new Map<string, number>();
    predictions?.forEach(p => {
      if (p.niche) {
        nicheCounts.set(p.niche, (nicheCounts.get(p.niche) || 0) + 1);
      }
    });
    
    let topNiche = 'General';
    let maxCount = 0;
    nicheCounts.forEach((count, niche) => {
      if (count > maxCount) {
        maxCount = count;
        topNiche = niche;
      }
    });

    return { total, avgAccuracy, avgDPS, topNiche };
  }

  // Helper methods
  private calculateConfidence(sampleSize: number): 'low' | 'medium' | 'high' {
    if (sampleSize >= 50) return 'high';
    if (sampleSize >= 10) return 'medium';
    return 'low';
  }

  private calculateVelocity(changePercent: number): string {
    if (changePercent >= 50) return 'Explosive';
    if (changePercent >= 25) return 'Accelerating';
    if (changePercent >= 10) return 'Fast';
    if (changePercent >= 0) return 'Steady';
    return 'Declining';
  }

  private getDefaultMetrics(): TemplateMetrics {
    return {
      success_rate: 50,
      avg_views: 10000,
      avg_engagement: 0.05,
      avg_dps: 50,
      sample_size: 0,
      confidence: 'low'
    };
  }
}

// Export singleton instance
export const realData = new RealDataConnector();










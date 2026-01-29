// Engagement Velocity Tracker - Real-time viral momentum detection

import { createClient } from '@supabase/supabase-js';
import { EngagementVelocity } from '@/lib/types/viral-prediction';

export class EngagementVelocityTracker {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async trackEngagement(videoId: string): Promise<EngagementVelocity> {
    // Get current video metrics
    const { data: video } = await this.supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();
    
    if (!video) {
      throw new Error('Video not found');
    }

    const hoursSinceUpload = this.calculateHoursSince(video.upload_timestamp);
    
    // Calculate current velocities
    const velocity: EngagementVelocity = {
      likesPerHour: video.like_count / hoursSinceUpload,
      commentsPerHour: video.comment_count / hoursSinceUpload,
      sharesPerHour: video.share_count / hoursSinceUpload,
      viewsPerHour: video.view_count / hoursSinceUpload,
      timeDecayWeight: this.calculateDecayWeight(hoursSinceUpload),
      acceleration: 0 // Will calculate below
    };

    // Store snapshot for future acceleration calculations
    await this.storeSnapshot(videoId, video, velocity, hoursSinceUpload);
    
    // Calculate acceleration by comparing to previous snapshot
    velocity.acceleration = await this.calculateAcceleration(videoId, velocity);
    
    return velocity;
  }

  private async storeSnapshot(
    videoId: string, 
    video: any, 
    velocity: EngagementVelocity,
    hoursSinceUpload: number
  ) {
    await this.supabase.from('engagement_snapshots').insert({
      video_id: videoId,
      snapshot_timestamp: new Date().toISOString(),
      hours_since_upload: hoursSinceUpload,
      view_count: video.view_count,
      like_count: video.like_count,
      comment_count: video.comment_count,
      share_count: video.share_count,
      likes_per_hour: velocity.likesPerHour,
      comments_per_hour: velocity.commentsPerHour,
      shares_per_hour: velocity.sharesPerHour,
      engagement_acceleration: velocity.acceleration
    });
  }

  private async calculateAcceleration(
    videoId: string, 
    currentVelocity: EngagementVelocity
  ): Promise<number> {
    // Get previous snapshot (from 1 hour ago)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const { data: previousSnapshot } = await this.supabase
      .from('engagement_snapshots')
      .select('*')
      .eq('video_id', videoId)
      .lte('snapshot_timestamp', oneHourAgo.toISOString())
      .order('snapshot_timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (!previousSnapshot) {
      return 0; // No previous data to compare
    }

    // Calculate weighted acceleration across all metrics
    const likeAcceleration = 
      (currentVelocity.likesPerHour - previousSnapshot.likes_per_hour) / 
      previousSnapshot.likes_per_hour;
    
    const commentAcceleration = 
      (currentVelocity.commentsPerHour - previousSnapshot.comments_per_hour) / 
      previousSnapshot.comments_per_hour;
    
    const shareAcceleration = 
      (currentVelocity.sharesPerHour - previousSnapshot.shares_per_hour) / 
      previousSnapshot.shares_per_hour;

    // Weighted average (shares are most important for virality)
    return (
      likeAcceleration * 0.3 + 
      commentAcceleration * 0.3 + 
      shareAcceleration * 0.4
    );
  }

  private calculateHoursSince(timestamp: string): number {
    const uploadTime = new Date(timestamp);
    const now = new Date();
    return (now.getTime() - uploadTime.getTime()) / (1000 * 60 * 60);
  }

  private calculateDecayWeight(hoursSinceUpload: number): number {
    // Videos are most viral in first 0-72 hours
    if (hoursSinceUpload <= 24) return 1.0;
    if (hoursSinceUpload <= 48) return 0.8;
    if (hoursSinceUpload <= 72) return 0.6;
    return 0.4;
  }

  // Identify viral momentum patterns
  async identifyViralMomentum(videoId: string): Promise<{
    isAccelerating: boolean;
    momentumScore: number;
    viralityStage: 'ignition' | 'explosive' | 'peak' | 'declining' | 'stable';
  }> {
    // Get last 6 snapshots
    const { data: snapshots } = await this.supabase
      .from('engagement_snapshots')
      .select('*')
      .eq('video_id', videoId)
      .order('snapshot_timestamp', { ascending: false })
      .limit(6);
    
    if (!snapshots || snapshots.length < 2) {
      return {
        isAccelerating: false,
        momentumScore: 0,
        viralityStage: 'stable'
      };
    }

    // Calculate average acceleration
    const accelerations = snapshots.map(s => s.engagement_acceleration);
    const avgAcceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    
    // Determine virality stage based on pattern
    let viralityStage: 'ignition' | 'explosive' | 'peak' | 'declining' | 'stable';
    
    if (avgAcceleration > 0.5) {
      viralityStage = 'explosive';
    } else if (avgAcceleration > 0.2) {
      viralityStage = 'ignition';
    } else if (avgAcceleration < -0.2) {
      viralityStage = 'declining';
    } else if (snapshots[0].hours_since_upload > 48 && avgAcceleration < 0.1) {
      viralityStage = 'peak';
    } else {
      viralityStage = 'stable';
    }

    return {
      isAccelerating: avgAcceleration > 0,
      momentumScore: Math.abs(avgAcceleration),
      viralityStage
    };
  }

  // Alert system for explosive growth
  async checkForViralAlert(videoId: string): Promise<boolean> {
    const momentum = await this.identifyViralMomentum(videoId);
    
    // Alert if video is in explosive growth phase
    if (momentum.viralityStage === 'explosive' && momentum.momentumScore > 0.75) {
      await this.createViralAlert(videoId, momentum);
      return true;
    }
    
    return false;
  }

  private async createViralAlert(videoId: string, momentum: any) {
    await this.supabase.from('viral_alerts').insert({
      video_id: videoId,
      alert_type: 'explosive_growth',
      momentum_score: momentum.momentumScore,
      virality_stage: momentum.viralityStage,
      created_at: new Date().toISOString()
    });
  }
}
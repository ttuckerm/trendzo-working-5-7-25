/**
 * Kling AI Video Generation Service
 *
 * Integrates with Kling AI API to generate videos from text scripts.
 * Handles async job submission and polling for completion.
 *
 * API Documentation: https://platform.klingai.com/docs
 * 
 * Authentication: Uses Access Key + Secret Key to generate JWT tokens
 */

import jwt from 'jsonwebtoken';

export interface KlingVideoRequest {
  prompt: string;
  duration: '5' | '10';
  aspect_ratio: '16:9' | '9:16' | '1:1';
  mode: 'std' | 'pro';
  negative_prompt?: string;
}

export interface KlingVideoResponse {
  code: number;
  message: string;
  request_id: string;
  data: {
    task_id: string;
    task_status: 'submitted' | 'processing' | 'succeed' | 'failed';
    task_status_msg?: string;
    created_at: number;
    updated_at: number;
    task_result?: {
      videos: Array<{
        id: string;
        url: string;
        duration: number;
      }>;
    };
  };
}

export interface KlingTaskStatusResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    task_status: 'submitted' | 'processing' | 'succeed' | 'failed';
    task_status_msg?: string;
    created_at: number;
    updated_at: number;
    task_result?: {
      videos: Array<{
        id: string;
        url: string;
        duration: number;
      }>;
    };
  };
}

class KlingService {
  private accessKey: string;
  private secretKey: string;
  private baseUrl = 'https://api.klingai.com/v1';

  constructor() {
    this.accessKey = process.env.KLING_ACCESS_KEY || '';
    this.secretKey = process.env.KLING_SECRET_KEY || '';
    if (!this.accessKey || !this.secretKey) {
      console.warn('KLING_ACCESS_KEY or KLING_SECRET_KEY not set - video generation will fail');
    }
  }

  /**
   * Check if Kling API is properly configured
   */
  isConfigured(): boolean {
    return !!(this.accessKey && this.secretKey);
  }

  /**
   * Generate JWT token for Kling API authentication
   * Based on Kling's API requirements
   */
  private generateToken(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.accessKey,
      exp: now + 1800, // Token expires in 30 minutes
      nbf: now - 5, // Not valid before 5 seconds ago (clock skew)
    };
    
    // Sign with HS256 algorithm using secret key
    return jwt.sign(payload, this.secretKey, { 
      algorithm: 'HS256',
      header: {
        alg: 'HS256',
        typ: 'JWT'
      }
    });
  }

  /**
   * Submit a text-to-video generation request
   */
  async createVideoFromText(params: KlingVideoRequest): Promise<KlingVideoResponse> {
    if (!this.isConfigured()) {
      throw new Error('Kling API not configured: Missing KLING_ACCESS_KEY or KLING_SECRET_KEY');
    }

    const token = this.generateToken();
    
    const response = await fetch(`${this.baseUrl}/videos/text2video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_name: 'kling-v1',
        ...params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Kling API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check the status of a video generation task
   */
  async getTaskStatus(taskId: string): Promise<KlingTaskStatusResponse> {
    if (!this.isConfigured()) {
      throw new Error('Kling API not configured: Missing KLING_ACCESS_KEY or KLING_SECRET_KEY');
    }

    const token = this.generateToken();
    
    const response = await fetch(`${this.baseUrl}/videos/text2video/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Kling API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Poll for video completion with exponential backoff
   */
  async pollUntilComplete(
    taskId: string,
    options: {
      maxAttempts?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
      onProgress?: (status: string) => void;
    } = {}
  ): Promise<KlingTaskStatusResponse> {
    const {
      maxAttempts = 60, // 60 attempts
      initialDelayMs = 10000, // Start at 10 seconds
      maxDelayMs = 30000, // Max 30 seconds between polls
      onProgress,
    } = options;

    let attempt = 0;
    let delay = initialDelayMs;

    while (attempt < maxAttempts) {
      const status = await this.getTaskStatus(taskId);

      if (onProgress) {
        onProgress(status.data.task_status);
      }

      if (status.data.task_status === 'succeed') {
        return status;
      }

      if (status.data.task_status === 'failed') {
        throw new Error(`Video generation failed: ${status.data.task_status_msg || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * 1.5, maxDelayMs);
      attempt++;
    }

    throw new Error(`Video generation timed out after ${maxAttempts} attempts`);
  }

  /**
   * Generate video from script with automatic polling
   * This is the main high-level method to use
   */
  async generateVideoFromScript(
    script: string,
    options: {
      platform: 'tiktok' | 'instagram' | 'youtube';
      length: 15 | 30 | 60;
      niche: string;
      onProgress?: (status: string, progress: number) => void;
    }
  ): Promise<{ videoUrl: string; duration: number; taskId: string }> {
    // Map platform to aspect ratio
    const aspectRatio: '16:9' | '9:16' | '1:1' =
      options.platform === 'youtube' ? '16:9' : '9:16';

    // Map length to duration (Kling only supports 5 or 10 seconds currently)
    const duration: '5' | '10' = options.length <= 15 ? '5' : '10';

    // Use 'std' mode for free tier (pro mode costs more)
    const mode: 'std' | 'pro' = 'std';

    if (options.onProgress) {
      options.onProgress('submitting', 0);
    }

    // Submit video generation request
    const response = await this.createVideoFromText({
      prompt: this.optimizePromptForKling(script, options.niche),
      duration,
      aspect_ratio: aspectRatio,
      mode,
      negative_prompt: 'blurry, distorted, low quality, watermark, text overlay',
    });

    const taskId = response.data.task_id;

    if (options.onProgress) {
      options.onProgress('processing', 20);
    }

    // Poll for completion
    const result = await this.pollUntilComplete(taskId, {
      onProgress: (status) => {
        if (options.onProgress) {
          const progressMap: Record<string, number> = {
            submitted: 30,
            processing: 60,
            succeed: 100,
          };
          options.onProgress(status, progressMap[status] || 50);
        }
      },
    });

    if (!result.data.task_result?.videos?.[0]) {
      throw new Error('No video returned from Kling');
    }

    const video = result.data.task_result.videos[0];

    return {
      videoUrl: video.url,
      duration: video.duration,
      taskId,
    };
  }

  /**
   * Optimize script text for Kling's video generation
   * Kling works best with visual descriptions, not voiceover scripts
   */
  private optimizePromptForKling(script: string, niche: string): string {
    // Convert script to visual description
    // This is a simplified version - could be enhanced with GPT
    const visualPrompt = `Create a dynamic ${niche} video showing: ${script.substring(0, 500)}.

    Style: Modern, engaging, professional quality with smooth transitions and eye-catching visuals.
    Lighting: Well-lit, vibrant colors.
    Camera: Dynamic angles, smooth movements.
    Mood: Energetic and inspiring.`;

    return visualPrompt;
  }

  /**
   * Estimate cost for video generation
   */
  estimateCost(duration: 5 | 10, mode: 'std' | 'pro'): number {
    // Kling pricing (approximate):
    // Standard mode: 0.1 credits per second
    // Pro mode: 0.3 credits per second
    // Free tier: 66 credits
    const creditsPerSecond = mode === 'std' ? 0.1 : 0.3;
    return duration * creditsPerSecond;
  }
}

// Export singleton instance
export const klingService = new KlingService();

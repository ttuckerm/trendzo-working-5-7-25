/**
 * Component 15: Audio Analysis
 *
 * Analyzes audio track from video to detect engagement patterns:
 * - Speaking pace (words per minute)
 * - Volume variance (dynamic range)
 * - Silence ratio (dead air percentage)
 * - Energy level (overall audio intensity)
 *
 * Uses existing FFmpeg service for audio extraction.
 *
 * Returns: audioScore, speakingPace, energyLevel, silenceRatio
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { extractAudio } from '@/lib/services/ffmpeg-service';
import { unlink } from 'fs/promises';
import { analyzeProsody, type ProsodicAnalysisResult } from '@/lib/services/audio-prosodic-analyzer';
import { type SpeakingRateResult } from '@/lib/services/speaking-rate-analyzer';
import { classifyAudioContent, generateAudioFingerprint, type AudioClassification, type AudioFingerprintResult } from '@/lib/services/audio-classifier';

// Configure FFmpeg paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

export interface AudioAnalysisResult {
  success: boolean;
  audioScore: number; // 0-10
  speakingPace: 'fast' | 'moderate' | 'slow' | 'unknown';
  energyLevel: 'high' | 'medium' | 'low' | 'unknown';
  silenceRatio: number; // 0-1 (percentage of silence)
  volumeVariance: number; // 0-1 (dynamic range)
  insights: string[];
  error?: string;

  // Raw metrics
  rawMetrics?: {
    meanVolume: number; // dB
    maxVolume: number; // dB
    silenceDuration: number; // seconds
    totalDuration: number; // seconds
  };

  // Enhanced prosodic analysis (Batch B)
  prosodic?: ProsodicAnalysisResult;
  speakingRate?: SpeakingRateResult;
  soundProfile?: {
    musicRatio: number;
    speechRatio: number;
    audioType: string;
    hasBothMusicAndSpeech: boolean;
    fingerprint?: string;
  };
}

export class AudioAnalyzer {
  /**
   * Analyze audio track from video file
   */
  public static async analyze(videoPath: string): Promise<AudioAnalysisResult> {
    let audioPath: string | null = null;

    try {
      // Extract audio using existing FFmpeg service
      audioPath = await extractAudio(videoPath, {
        format: 'wav', // WAV for easier analysis
        sampleRate: 16000 // Lower sample rate for faster processing
      });

      // Analyze audio metrics using FFmpeg volumedetect and silencedetect filters
      const metrics = await this.analyzeAudioMetrics(audioPath);

      // Calculate scores
      const silenceRatio = metrics.silenceDuration / metrics.totalDuration;
      const volumeVariance = this.calculateVolumeVariance(metrics.meanVolume, metrics.maxVolume);
      const energyLevel = this.classifyEnergyLevel(metrics.meanVolume);
      const speakingPace = this.estimateSpeakingPace(metrics, silenceRatio);

      // Calculate overall audio score (0-10)
      const audioScore = this.calculateAudioScore({
        silenceRatio,
        volumeVariance,
        energyLevel,
        speakingPace
      });

      // Generate insights
      const insights = this.generateInsights({
        audioScore,
        silenceRatio,
        energyLevel,
        speakingPace,
        volumeVariance
      });

      // Cleanup temp audio file
      if (audioPath) {
        await unlink(audioPath).catch(() => {});
      }

      // Run prosodic analysis and sound classification in parallel (Batch B)
      let prosodic: ProsodicAnalysisResult | undefined;
      let soundProfile: AudioAnalysisResult['soundProfile'] | undefined;

      try {
        const [prosodicResult, classificationResult, fingerprintResult] = await Promise.all([
          analyzeProsody(videoPath).catch((err) => {
            console.warn('[AudioAnalyzer] Prosodic analysis failed:', err.message);
            return null;
          }),
          classifyAudioContent(videoPath).catch((err) => {
            console.warn('[AudioAnalyzer] Audio classification failed:', err.message);
            return null;
          }),
          generateAudioFingerprint(videoPath).catch((err) => {
            console.warn('[AudioAnalyzer] Audio fingerprinting failed:', err.message);
            return null;
          }),
        ]);

        if (prosodicResult?.success) {
          prosodic = prosodicResult;
        }

        if (classificationResult?.success) {
          soundProfile = {
            musicRatio: classificationResult.musicRatio,
            speechRatio: classificationResult.speechRatio,
            audioType: classificationResult.audioType,
            hasBothMusicAndSpeech: classificationResult.hasBothMusicAndSpeech,
            fingerprint: fingerprintResult?.success ? fingerprintResult.fingerprint : undefined,
          };
        }
      } catch (err: any) {
        console.warn('[AudioAnalyzer] Enhanced analysis failed:', err.message);
      }

      return {
        success: true,
        audioScore,
        speakingPace,
        energyLevel,
        silenceRatio,
        volumeVariance,
        insights,
        rawMetrics: metrics,
        prosodic,
        soundProfile,
      };

    } catch (error: any) {
      // Cleanup on error
      if (audioPath) {
        await unlink(audioPath).catch(() => {});
      }

      return {
        success: false,
        audioScore: 0,
        speakingPace: 'unknown',
        energyLevel: 'unknown',
        silenceRatio: 0,
        volumeVariance: 0,
        insights: ['Audio analysis failed'],
        error: error.message
      };
    }
  }

  /**
   * Analyze audio metrics using FFmpeg filters
   */
  private static async analyzeAudioMetrics(audioPath: string): Promise<{
    meanVolume: number;
    maxVolume: number;
    silenceDuration: number;
    totalDuration: number;
  }> {
    return new Promise((resolve, reject) => {
      let meanVolume = -30; // Default moderate volume
      let maxVolume = -10;
      let silenceDuration = 0;
      let totalDuration = 0;

      // Run FFmpeg with volumedetect and silencedetect filters
      ffmpeg(audioPath)
        .audioFilters([
          'volumedetect',
          'silencedetect=n=-40dB:d=0.5' // Detect silence below -40dB for 0.5s+
        ])
        .format('null')
        .output('-')
        .on('start', (cmd) => {
          console.log('[AudioAnalyzer] FFmpeg command:', cmd);
        })
        .on('stderr', (stderrLine) => {
          // Parse volumedetect output
          const meanMatch = stderrLine.match(/mean_volume:\s*([-\d.]+)\s*dB/);
          if (meanMatch) {
            meanVolume = parseFloat(meanMatch[1]);
          }

          const maxMatch = stderrLine.match(/max_volume:\s*([-\d.]+)\s*dB/);
          if (maxMatch) {
            maxVolume = parseFloat(maxMatch[1]);
          }

          // Parse silencedetect output
          const silenceEndMatch = stderrLine.match(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/);
          if (silenceEndMatch) {
            silenceDuration += parseFloat(silenceEndMatch[2]);
          }

          // Parse duration
          const durationMatch = stderrLine.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
          if (durationMatch && totalDuration === 0) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            totalDuration = hours * 3600 + minutes * 60 + seconds;
          }
        })
        .on('end', () => {
          resolve({
            meanVolume,
            maxVolume,
            silenceDuration,
            totalDuration: totalDuration || 30 // Default if parsing failed
          });
        })
        .on('error', (err) => {
          reject(new Error(`Audio analysis failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Calculate volume variance (0-1)
   * Higher variance = more dynamic audio = better engagement
   */
  private static calculateVolumeVariance(meanVolume: number, maxVolume: number): number {
    // Normalize dB range to 0-1
    // Typical range: mean -30dB, max -5dB (25dB difference = high variance)
    const dbDifference = maxVolume - meanVolume;
    const variance = Math.min(1, Math.max(0, dbDifference / 30));
    return parseFloat(variance.toFixed(2));
  }

  /**
   * Classify energy level based on mean volume
   */
  private static classifyEnergyLevel(meanVolume: number): 'high' | 'medium' | 'low' | 'unknown' {
    if (meanVolume > -15) return 'high';    // Loud, energetic
    if (meanVolume > -25) return 'medium';  // Moderate
    if (meanVolume > -40) return 'low';     // Quiet
    return 'unknown';
  }

  /**
   * Estimate speaking pace based on silence ratio
   * Less silence = faster pace (generally)
   */
  private static estimateSpeakingPace(
    metrics: { silenceDuration: number; totalDuration: number },
    silenceRatio: number
  ): 'fast' | 'moderate' | 'slow' | 'unknown' {
    if (silenceRatio < 0.15) return 'fast';      // <15% silence = rapid speech
    if (silenceRatio < 0.30) return 'moderate';  // 15-30% silence = normal
    if (silenceRatio < 0.50) return 'slow';      // 30-50% silence = deliberate
    return 'slow'; // >50% silence = very slow or music-heavy
  }

  /**
   * Calculate overall audio score (0-10)
   */
  private static calculateAudioScore(params: {
    silenceRatio: number;
    volumeVariance: number;
    energyLevel: 'high' | 'medium' | 'low' | 'unknown';
    speakingPace: 'fast' | 'moderate' | 'slow' | 'unknown';
  }): number {
    let score = 5; // Base score

    // Energy level scoring (0-3 points)
    if (params.energyLevel === 'high') score += 3;
    else if (params.energyLevel === 'medium') score += 2;
    else if (params.energyLevel === 'low') score += 1;

    // Speaking pace scoring (0-2 points)
    if (params.speakingPace === 'fast') score += 2;
    else if (params.speakingPace === 'moderate') score += 1.5;
    else if (params.speakingPace === 'slow') score += 0.5;

    // Silence ratio penalty (-2 to 0 points)
    if (params.silenceRatio > 0.4) score -= 2;
    else if (params.silenceRatio > 0.3) score -= 1;

    // Volume variance bonus (0-2 points)
    score += params.volumeVariance * 2;

    // Normalize to 0-10 range
    return parseFloat(Math.max(0, Math.min(10, score)).toFixed(1));
  }

  /**
   * Generate actionable insights
   */
  private static generateInsights(params: {
    audioScore: number;
    silenceRatio: number;
    energyLevel: 'high' | 'medium' | 'low' | 'unknown';
    speakingPace: 'fast' | 'moderate' | 'slow' | 'unknown';
    volumeVariance: number;
  }): string[] {
    const insights: string[] = [];

    // Overall score insight
    if (params.audioScore >= 8) {
      insights.push('Excellent audio quality - high energy and engagement');
    } else if (params.audioScore >= 6) {
      insights.push('Good audio quality - maintains viewer attention');
    } else if (params.audioScore >= 4) {
      insights.push('Moderate audio quality - room for improvement');
    } else {
      insights.push('Weak audio quality - may hurt retention');
    }

    // Energy level insight
    if (params.energyLevel === 'high') {
      insights.push('High energy audio drives engagement and excitement');
    } else if (params.energyLevel === 'low') {
      insights.push('Low energy audio - consider boosting volume or enthusiasm');
    }

    // Speaking pace insight
    if (params.speakingPace === 'fast') {
      insights.push('Fast speaking pace keeps viewers engaged');
    } else if (params.speakingPace === 'slow') {
      insights.push('Slow speaking pace - may lose viewer attention');
    }

    // Silence ratio insight
    if (params.silenceRatio > 0.35) {
      insights.push(`High silence ratio (${(params.silenceRatio * 100).toFixed(0)}%) - cut dead air for better retention`);
    } else if (params.silenceRatio < 0.1) {
      insights.push('Minimal dead air - excellent pacing');
    }

    // Volume variance insight
    if (params.volumeVariance > 0.7) {
      insights.push('Great dynamic range - audio has emotional variation');
    } else if (params.volumeVariance < 0.3) {
      insights.push('Low dynamic range - audio feels flat, add more variation');
    }

    return insights;
  }

  /**
   * Convert audio analysis to VPS prediction score.
   * Renamed from toDPS — these are VPS-range prediction scores, NOT DPS measurements.
   */
  public static toPrediction(result: AudioAnalysisResult): number {
    if (!result.success) {
      return 50; // Neutral if analysis failed
    }

    // Map audio score (0-10) to VPS prediction (35-75)
    const base = 35 + (result.audioScore * 4);

    let boost = 0;

    // Original boosts
    if (result.energyLevel === 'high' && result.speakingPace === 'fast') {
      boost += 5; // High energy + fast pace = viral combo
    }
    if (result.silenceRatio < 0.15 && result.volumeVariance > 0.6) {
      boost += 3; // Minimal silence + dynamic audio = engaging
    }

    // Prosodic signal boosts (Batch B)
    if (result.prosodic) {
      const vol = result.prosodic.volumeDynamics;
      const pitch = result.prosodic.pitchAnalysis;
      const silence = result.prosodic.silencePatterns;

      // Volume dynamics bonus: high loudnessVariance + high loudnessRange → +3-5 points
      if (vol) {
        const dynamicScore = Math.min(1, (vol.loudnessVariance / 20) + (vol.loudnessRange / 15));
        boost += dynamicScore * 5; // 0-5 points
      }

      // Pitch bonus: high pitchVariance + wide pitchRange → +3-5 points (expressive speaker)
      if (pitch) {
        const expressiveScore = Math.min(1, (pitch.pitchVariance / 5000) + (pitch.pitchRange / 200));
        boost += expressiveScore * 5; // 0-5 points
      }

      // Silence pattern: rhythmic → +1, front-loaded → -2
      if (silence) {
        if (silence.silencePattern === 'rhythmic') boost += 1;
        if (silence.silencePattern === 'front-loaded') boost -= 2; // Silence in hook is bad
      }
    }

    // Speaking rate boost
    if (result.speakingRate?.success) {
      if (result.speakingRate.paceCategory === 'dynamic') boost += 2;
    }

    // Sound profile boost
    if (result.soundProfile?.hasBothMusicAndSpeech) {
      boost += 1; // Voiceover with music is engaging on TikTok
    }

    const finalScore = Math.min(75, Math.max(35, base + boost));
    return parseFloat(finalScore.toFixed(1));
  }
}

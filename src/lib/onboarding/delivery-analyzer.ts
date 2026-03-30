/**
 * Delivery Baseline Analyzer (SERVER-ONLY)
 *
 * Hybrid approach: FFmpeg for deterministic audio metrics (volume, silence)
 * + Gemini for linguistic metrics (WPM, speaking rate variance, energy).
 *
 * Runs during channel verification on 2-3 of the creator's top-performing videos.
 *
 * NOTE: This file uses Node.js APIs (fs, ffmpeg). For the browser-safe type
 * and scoring function, import from './delivery-baseline' instead.
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { GoogleGenAI } from '@google/genai';

// Re-export the browser-safe type and scoring function
export { DeliveryBaseline, deliveryBaselineToScore } from './delivery-baseline';

if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);
if (ffprobeStatic.path) ffmpeg.setFfprobePath(ffprobeStatic.path);

interface FFmpegAudioStats {
  meanVolume: number;
  maxVolume: number;
  silenceRatio: number;
  duration: number;
}

interface GeminiDeliveryAnalysis {
  estimatedWpm: number;
  speakingRateVariance: number;
  energyClassification: 'low' | 'moderate' | 'high' | 'very_high';
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Analyze delivery baseline from 2-3 video URLs.
 * Downloads audio only (-vn), runs FFmpeg + Gemini analysis, returns normalized scores.
 */
export async function analyzeDeliveryBaseline(
  videoUrls: string[]
): Promise<DeliveryBaseline | null> {
  if (videoUrls.length === 0) return null;

  const urls = videoUrls.slice(0, 3);
  const results: { ffmpeg: FFmpegAudioStats; gemini: GeminiDeliveryAnalysis | null }[] = [];

  for (const url of urls) {
    try {
      const audioPath = await downloadAudioTrack(url);
      try {
        const [ffmpegStats, geminiAnalysis] = await Promise.all([
          analyzeAudioWithFFmpeg(audioPath),
          analyzeAudioWithGemini(audioPath),
        ]);
        results.push({ ffmpeg: ffmpegStats, gemini: geminiAnalysis });
      } finally {
        await fs.unlink(audioPath).catch(() => {});
      }
    } catch (err) {
      console.error(`[DeliveryAnalyzer] Failed to analyze video: ${err}`);
    }
  }

  if (results.length === 0) return null;

  return mergeResults(results);
}


// ============================================================================
// FFmpeg Analysis
// ============================================================================

function downloadAudioTrack(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `delivery_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`);

    ffmpeg(videoUrl)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .duration(60)
      .output(tmpFile)
      .on('end', () => resolve(tmpFile))
      .on('error', (err: Error) => reject(new Error(`Audio download failed: ${err.message}`)))
      .run();
  });
}

function analyzeAudioWithFFmpeg(audioPath: string): Promise<FFmpegAudioStats> {
  return new Promise((resolve, reject) => {
    let stderrOutput = '';

    ffmpeg(audioPath)
      .audioFilters('volumedetect')
      .format('null')
      .output('-')
      .on('stderr', (line: string) => {
        stderrOutput += line + '\n';
      })
      .on('end', () => {
        const meanMatch = stderrOutput.match(/mean_volume:\s*([-\d.]+)\s*dB/);
        const maxMatch = stderrOutput.match(/max_volume:\s*([-\d.]+)\s*dB/);
        const durationMatch = stderrOutput.match(/Duration:\s*(\d+):(\d+):(\d+)/);

        const meanVolume = meanMatch ? parseFloat(meanMatch[1]) : -30;
        const maxVolume = maxMatch ? parseFloat(maxMatch[1]) : -10;
        const duration = durationMatch
          ? parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseInt(durationMatch[3])
          : 30;

        detectSilenceRatio(audioPath, duration)
          .then(silenceRatio => {
            resolve({ meanVolume, maxVolume, silenceRatio, duration });
          })
          .catch(() => {
            resolve({ meanVolume, maxVolume, silenceRatio: 0.3, duration });
          });
      })
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

function detectSilenceRatio(audioPath: string, totalDuration: number): Promise<number> {
  return new Promise((resolve, reject) => {
    let stderrOutput = '';
    let totalSilence = 0;

    ffmpeg(audioPath)
      .audioFilters('silencedetect=noise=-40dB:d=0.5')
      .format('null')
      .output('-')
      .on('stderr', (line: string) => {
        stderrOutput += line + '\n';
        const durationMatch = line.match(/silence_duration:\s*([\d.]+)/);
        if (durationMatch) {
          totalSilence += parseFloat(durationMatch[1]);
        }
      })
      .on('end', () => {
        const ratio = totalDuration > 0 ? totalSilence / totalDuration : 0;
        resolve(Math.min(1, ratio));
      })
      .on('error', reject)
      .run();
  });
}

// ============================================================================
// Gemini Analysis
// ============================================================================

async function analyzeAudioWithGemini(audioPath: string): Promise<GeminiDeliveryAnalysis | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const audioBuffer = await fs.readFile(audioPath);
    const base64Audio = audioBuffer.toString('base64');

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: base64Audio,
            },
          },
          {
            text: `Analyze this audio from a TikTok creator's video. Estimate:
1. estimatedWpm: Speaking rate in words per minute (typical range: 100-200 WPM for video content)
2. speakingRateVariance: How much the speaking rate varies (0 = monotone, 100 = highly dynamic pacing)
3. energyClassification: Overall vocal energy level ("low", "moderate", "high", "very_high")

Return ONLY a JSON object:
{"estimatedWpm": 150, "speakingRateVariance": 60, "energyClassification": "high"}`,
          },
        ],
      }],
    });

    const text = result.text?.trim() || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      estimatedWpm: Math.max(0, Math.min(300, parsed.estimatedWpm || 130)),
      speakingRateVariance: Math.max(0, Math.min(100, parsed.speakingRateVariance || 50)),
      energyClassification: ['low', 'moderate', 'high', 'very_high'].includes(parsed.energyClassification)
        ? parsed.energyClassification
        : 'moderate',
    };
  } catch (err) {
    console.error(`[DeliveryAnalyzer] Gemini audio analysis failed: ${err}`);
    return null;
  }
}

// ============================================================================
// Merge Results
// ============================================================================

function mergeResults(
  results: { ffmpeg: FFmpegAudioStats; gemini: GeminiDeliveryAnalysis | null }[]
): DeliveryBaseline {
  const n = results.length;

  // FFmpeg-derived metrics (averaged)
  const avgSilenceRatio = results.reduce((s, r) => s + r.ffmpeg.silenceRatio, 0) / n;

  // Volume → energy normalization: -50dB = 0, -10dB = 100
  const avgMeanVolume = results.reduce((s, r) => s + r.ffmpeg.meanVolume, 0) / n;
  const ffmpegEnergy = Math.max(0, Math.min(100, ((avgMeanVolume + 50) / 40) * 100));

  // Gemini-derived metrics (averaged, with fallbacks)
  const geminiResults = results.map(r => r.gemini).filter(Boolean) as GeminiDeliveryAnalysis[];

  let speakingRateWpm: number;
  let speakingRateVariance: number;
  let energyLevel: number;

  if (geminiResults.length > 0) {
    const avgWpm = geminiResults.reduce((s, g) => s + g.estimatedWpm, 0) / geminiResults.length;
    speakingRateWpm = normalizeWpm(avgWpm);

    speakingRateVariance = geminiResults.reduce((s, g) => s + g.speakingRateVariance, 0) / geminiResults.length;

    const energyMap = { low: 25, moderate: 50, high: 75, very_high: 95 };
    const geminiEnergy = geminiResults.reduce((s, g) => s + energyMap[g.energyClassification], 0) / geminiResults.length;
    energyLevel = Math.round(ffmpegEnergy * 0.4 + geminiEnergy * 0.6);
  } else {
    speakingRateWpm = avgSilenceRatio > 0.5 ? 20 : 50;
    speakingRateVariance = 50;
    energyLevel = Math.round(ffmpegEnergy);
  }

  return {
    speakingRateWpm: Math.round(speakingRateWpm),
    speakingRateVariance: Math.round(speakingRateVariance),
    energyLevel: Math.round(energyLevel),
    silenceRatio: Math.round(avgSilenceRatio * 100) / 100,
    sampleCount: n,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Normalize WPM to 0-100 scale.
 * Sweet spot for TikTok is ~140-170 WPM. Below 100 = low, above 200 = very fast.
 */
function normalizeWpm(wpm: number): number {
  if (wpm <= 80) return 20;
  if (wpm <= 100) return 35;
  if (wpm <= 120) return 50;
  if (wpm <= 140) return 65;
  if (wpm <= 170) return 80;
  if (wpm <= 200) return 70;
  return 55;
}

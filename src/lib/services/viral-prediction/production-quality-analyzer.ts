// God Mode Production Quality Analyzer - Authenticity Paradox Engine

import { createClient } from '@supabase/supabase-js';
import { ProductionQuality } from '@/lib/types/viral-prediction';

export class ProductionQualityAnalyzer {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async analyzeProductionQuality(video: {
    id: string;
    visual_features: any;
    audio_features: any;
    duration_seconds: number;
    caption: string;
  }): Promise<ProductionQuality> {
    
    // 1. Shot Pacing Analysis (2-second rule)
    const shotPacing = await this.analyzeShotPacing(video.visual_features, video.duration_seconds);
    
    // 2. Production Quality Balance Assessment
    const qualityBalance = await this.assessQualityBalance(video.visual_features, video.audio_features);
    
    // 3. Authenticity Paradox Calculation
    const authenticity = await this.calculateAuthenticityParadox(video);

    const productionAnalysis: ProductionQuality = {
      shotPacingScore: shotPacing.score,
      averageShotDuration: shotPacing.avgDuration,
      rapidCutPercentage: shotPacing.rapidCutPercentage,
      patternInterruptCount: shotPacing.patternInterrupts,
      authenticityBalance: authenticity.balance,
      calculatedSpontaneityScore: authenticity.spontaneityScore
    };

    // Store analysis
    await this.storeProductionAnalysis(video.id, productionAnalysis, {
      shotPacing,
      qualityBalance,
      authenticity
    });

    return productionAnalysis;
  }

  private async analyzeShotPacing(
    visualFeatures: any, 
    duration: number
  ): Promise<{
    score: number;
    avgDuration: number;
    rapidCutPercentage: number;
    patternInterrupts: number;
  }> {
    // Default values if visual analysis not available
    let avgShotDuration = 4; // seconds
    let rapidCutPercentage = 0;
    let patternInterrupts = 0;
    
    if (visualFeatures?.shot_analysis) {
      const shots = visualFeatures.shot_analysis.shots || [];
      const shotDurations = shots.map((shot: any) => shot.duration);
      
      // Calculate average shot duration
      avgShotDuration = shotDurations.length > 0 
        ? shotDurations.reduce((a: number, b: number) => a + b, 0) / shotDurations.length 
        : 4;
      
      // Calculate rapid cuts (under 2 seconds)
      const rapidCuts = shotDurations.filter((d: number) => d < 2).length;
      rapidCutPercentage = (rapidCuts / shotDurations.length) * 100;
      
      // Pattern interrupts (dramatic changes in shot type/angle)
      patternInterrupts = shots.filter((shot: any, index: number) => {
        if (index === 0) return false;
        const prevShot = shots[index - 1];
        return Math.abs(shot.angle_change - prevShot.angle_change) > 45;
      }).length;
    } else {
      // Estimate based on duration and content type
      if (duration < 15) {
        avgShotDuration = 2.5; // Shorter videos tend to have faster cuts
        rapidCutPercentage = 40;
      } else if (duration < 30) {
        avgShotDuration = 3.5;
        rapidCutPercentage = 25;
      }
    }

    // Score based on optimal pacing (2-second average is ideal)
    let score = 0;
    
    // Ideal shot pacing score
    if (avgShotDuration >= 1.5 && avgShotDuration <= 3) {
      score += 0.4; // Perfect range
    } else if (avgShotDuration <= 5) {
      score += 0.3; // Good range
    } else {
      score += 0.1; // Too slow
    }
    
    // Rapid cut bonus (keeps attention)
    if (rapidCutPercentage >= 30 && rapidCutPercentage <= 60) {
      score += 0.3; // Optimal rapid cut ratio
    } else if (rapidCutPercentage > 0) {
      score += 0.2; // Some rapid cuts
    }
    
    // Pattern interrupt bonus (maintains engagement)
    score += Math.min(patternInterrupts * 0.1, 0.3); // Max 0.3 bonus

    return {
      score: Math.min(score, 1),
      avgDuration: avgShotDuration,
      rapidCutPercentage,
      patternInterrupts
    };
  }

  private async assessQualityBalance(
    visualFeatures: any,
    audioFeatures: any
  ): Promise<{
    lightingScore: number;
    professionalScore: number;
    accessibilityScore: number;
    overallBalance: number;
  }> {
    let lightingScore = 0.7; // Default good lighting
    let professionalScore = 0.6; // Default semi-professional
    let accessibilityScore = 0.8; // Default accessible

    // Lighting analysis
    if (visualFeatures?.lighting) {
      const lighting = visualFeatures.lighting;
      
      // Good lighting indicators
      if (lighting.consistency > 0.8) lightingScore += 0.2;
      if (lighting.exposure_balance > 0.7) lightingScore += 0.1;
      if (lighting.natural_vs_artificial === 'natural') lightingScore += 0.1;
      
      lightingScore = Math.min(lightingScore, 1);
    }

    // Professional production indicators
    if (visualFeatures?.production_quality) {
      const quality = visualFeatures.production_quality;
      
      professionalScore = 0;
      if (quality.camera_stability > 0.8) professionalScore += 0.3;
      if (quality.focus_quality > 0.8) professionalScore += 0.2;
      if (quality.color_grading > 0.7) professionalScore += 0.2;
      if (quality.composition_score > 0.7) professionalScore += 0.3;
    }

    // Audio quality
    if (audioFeatures?.quality) {
      const audio = audioFeatures.quality;
      
      if (audio.clarity > 0.8) professionalScore += 0.1;
      if (audio.background_noise < 0.2) professionalScore += 0.1;
      
      // Accessibility
      if (audio.volume_consistency > 0.8) accessibilityScore += 0.1;
      if (audioFeatures.has_captions) accessibilityScore += 0.1;
    }

    // Calculate balance (too professional can hurt authenticity)
    const overallBalance = this.calculateQualityBalance(
      lightingScore, 
      professionalScore, 
      accessibilityScore
    );

    return {
      lightingScore: Math.min(lightingScore, 1),
      professionalScore: Math.min(professionalScore, 1),
      accessibilityScore: Math.min(accessibilityScore, 1),
      overallBalance
    };
  }

  private calculateQualityBalance(
    lighting: number, 
    professional: number, 
    accessibility: number
  ): number {
    // Sweet spot: high accessibility, good lighting, but not too professional
    const optimalProfessional = 0.7; // 70% professional is ideal
    
    let balance = 0;
    
    // Lighting should be good (0.7+)
    if (lighting >= 0.7) {
      balance += 0.3;
    } else {
      balance += lighting * 0.3;
    }
    
    // Accessibility should be high
    balance += accessibility * 0.3;
    
    // Professional quality has diminishing returns (authenticity paradox)
    if (professional <= optimalProfessional) {
      balance += professional * 0.4;
    } else {
      // Penalty for being too professional
      const penalty = (professional - optimalProfessional) * 0.5;
      balance += (optimalProfessional * 0.4) - penalty;
    }
    
    return Math.max(Math.min(balance, 1), 0);
  }

  private async calculateAuthenticityParadox(video: any): Promise<{
    balance: number;
    spontaneityScore: number;
    strategicIndicators: string[];
  }> {
    const strategicIndicators: string[] = [];
    const caption = video.caption.toLowerCase();
    
    // Strategic planning indicators (reduce authenticity)
    const planningSignals = [
      { pattern: 'follow for more', indicator: 'cta_present', penalty: 0.1 },
      { pattern: 'link in bio', indicator: 'marketing_cta', penalty: 0.15 },
      { pattern: 'sponsored', indicator: 'sponsored_content', penalty: 0.2 },
      { pattern: 'ad', indicator: 'advertisement', penalty: 0.1 },
      { pattern: 'brand', indicator: 'brand_mention', penalty: 0.05 }
    ];

    let strategicPenalty = 0;
    planningSignals.forEach(signal => {
      if (caption.includes(signal.pattern)) {
        strategicPenalty += signal.penalty;
        strategicIndicators.push(signal.indicator);
      }
    });

    // Spontaneity indicators (increase authenticity)
    const spontaneitySignals = [
      'just happened',
      'can\'t believe',
      'omg',
      'wait what',
      'this is crazy',
      'randomly',
      'unexpected'
    ];

    let spontaneityBonus = 0;
    spontaneitySignals.forEach(signal => {
      if (caption.includes(signal)) {
        spontaneityBonus += 0.1;
      }
    });

    // Production quality impact on authenticity
    const productionPenalty = video.visual_features?.production_quality?.overall_score > 0.9 ? 0.2 : 0;

    // Calculate final scores
    const spontaneityScore = Math.min(spontaneityBonus, 1);
    const authenticityBalance = Math.max(
      1 - strategicPenalty - productionPenalty + spontaneityScore * 0.5,
      0
    );

    return {
      balance: Math.min(authenticityBalance, 1),
      spontaneityScore,
      strategicIndicators
    };
  }

  private async storeProductionAnalysis(
    videoId: string,
    analysis: ProductionQuality,
    details: any
  ) {
    await this.supabase.from('production_quality').insert({
      video_id: videoId,
      shot_pacing_score: analysis.shotPacingScore,
      average_shot_duration: analysis.averageShotDuration,
      rapid_cut_percentage: analysis.rapidCutPercentage,
      pattern_interrupt_count: analysis.patternInterruptCount,
      pattern_interrupt_effectiveness: details.shotPacing.score,
      lighting_balance: details.qualityBalance.lightingScore,
      lighting_consistency: details.qualityBalance.lightingScore,
      professional_score: details.qualityBalance.professionalScore,
      accessibility_score: details.qualityBalance.accessibilityScore,
      calculated_spontaneity_score: analysis.calculatedSpontaneityScore,
      strategic_planning_indicators: details.authenticity.strategicIndicators,
      authenticity_balance: analysis.authenticityBalance
    });
  }

  // Calculate God Mode accuracy boost from production quality
  calculateAccuracyBoost(analysis: ProductionQuality): number {
    let boost = 0;

    // Shot pacing boost (2-second rule effectiveness)
    if (analysis.shotPacingScore > 0.8) boost += 0.03; // +3%
    
    // Authenticity paradox boost (strategic but feels spontaneous)
    if (analysis.authenticityBalance > 0.7 && analysis.calculatedSpontaneityScore > 0.5) {
      boost += 0.04; // +4%
    }

    return Math.min(boost, 0.07); // Max 7% boost
  }
}
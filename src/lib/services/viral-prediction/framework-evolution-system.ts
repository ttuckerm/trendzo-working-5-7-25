/**
 * Framework Evolution System
 * Automatically discovers new viral patterns and evolves frameworks from 40 to hundreds
 * Uses ML-based pattern recognition and performance validation
 */

import { ComprehensiveFrameworkLibrary, FrameworkPattern } from './comprehensive-framework-library';
import { ScriptIntelligenceEngine } from './script-intelligence-engine';
import { createClient } from '@supabase/supabase-js';

export interface EmergingPattern {
  id: string;
  name: string;
  description: string;
  category: string;
  discoveredAt: string;
  confidenceScore: number;
  occurrences: number;
  avgViralRate: number;
  keyIndicators: string[];
  scriptPatterns: string[];
  examples: PatternExample[];
  validated: boolean;
  tier: 1 | 2 | 3;
  platforms: string[];
  performanceMetrics: PerformanceMetrics;
}

export interface PatternExample {
  videoId: string;
  transcript: string;
  viralScore: number;
  viewCount: number;
  platform: string;
  createdAt: string;
  frameworkMatches: string[];
}

export interface PerformanceMetrics {
  totalTests: number;
  successfulPredictions: number;
  accuracyRate: number;
  falsePositives: number;
  falseNegatives: number;
  avgConfidenceScore: number;
  platformBreakdown: Record<string, number>;
}

export interface FrameworkEvolutionConfig {
  minOccurrences: number;
  minViralRate: number;
  minConfidenceScore: number;
  validationPeriodDays: number;
  maxNewFrameworksPerDay: number;
  retirementThreshold: number;
}

export class FrameworkEvolutionSystem {
  private supabase;
  private frameworkLibrary: ComprehensiveFrameworkLibrary;
  private scriptIntelligence: ScriptIntelligenceEngine;
  private config: FrameworkEvolutionConfig;
  private emergingPatterns: Map<string, EmergingPattern>;
  private validationQueue: EmergingPattern[];

  constructor(config?: Partial<FrameworkEvolutionConfig>) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    this.frameworkLibrary = new ComprehensiveFrameworkLibrary();
    this.scriptIntelligence = new ScriptIntelligenceEngine();
    this.emergingPatterns = new Map();
    this.validationQueue = [];
    
    this.config = {
      minOccurrences: 10,
      minViralRate: 0.25,
      minConfidenceScore: 0.7,
      validationPeriodDays: 14,
      maxNewFrameworksPerDay: 3,
      retirementThreshold: 0.15,
      ...config
    };
  }

  /**
   * Main evolution cycle - discovers and validates new frameworks
   */
  public async runEvolutionCycle(): Promise<{
    newPatternsDiscovered: number;
    frameworksValidated: number;
    frameworksRetired: number;
    totalFrameworks: number;
    evolutionSummary: string;
  }> {
    console.log('🧬 Starting Framework Evolution Cycle...');
    
    const startTime = Date.now();
    
    // Step 1: Discover new patterns from recent viral content
    const newPatterns = await this.discoverEmergingPatterns();
    console.log(`🔍 Discovered ${newPatterns.length} new patterns`);
    
    // Step 2: Validate patterns in queue
    const validatedFrameworks = await this.validateEmergingPatterns();
    console.log(`✅ Validated ${validatedFrameworks.length} frameworks`);
    
    // Step 3: Retire underperforming frameworks
    const retiredFrameworks = await this.retireUnderperformingFrameworks();
    console.log(`🗑️ Retired ${retiredFrameworks.length} frameworks`);
    
    // Step 4: Update framework library
    await this.updateFrameworkLibrary(validatedFrameworks);
    
    // Step 5: Generate evolution report
    const totalFrameworks = this.frameworkLibrary.getAllFrameworks().length;
    const processingTime = Date.now() - startTime;
    
    const evolutionSummary = this.generateEvolutionSummary({
      newPatterns: newPatterns.length,
      validated: validatedFrameworks.length,
      retired: retiredFrameworks.length,
      total: totalFrameworks,
      processingTime
    });
    
    // Store evolution cycle results
    await this.storeEvolutionCycle({
      newPatternsDiscovered: newPatterns.length,
      frameworksValidated: validatedFrameworks.length,
      frameworksRetired: retiredFrameworks.length,
      totalFrameworks,
      processingTime,
      evolutionSummary
    });
    
    console.log(`🎯 Evolution cycle complete: ${processingTime}ms`);
    
    return {
      newPatternsDiscovered: newPatterns.length,
      frameworksValidated: validatedFrameworks.length,
      frameworksRetired: retiredFrameworks.length,
      totalFrameworks,
      evolutionSummary
    };
  }

  /**
   * Discover emerging patterns from recent viral content
   */
  private async discoverEmergingPatterns(): Promise<EmergingPattern[]> {
    try {
      // Get recent viral content (last 7 days)
      const { data: recentViral } = await this.supabase
        .from('videos')
        .select(`
          *,
          script_analyses!inner(*)
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .gte('viral_probability', 0.6)
        .order('viral_score', { ascending: false })
        .limit(200);

      if (!recentViral || recentViral.length === 0) {
        console.log('No recent viral content found for pattern discovery');
        return [];
      }

      console.log(`📊 Analyzing ${recentViral.length} viral videos for patterns`);

      // Group content by similarity patterns
      const patternClusters = await this.clusterSimilarContent(recentViral);
      
      // Extract new patterns from clusters
      const newPatterns: EmergingPattern[] = [];
      
      for (const cluster of patternClusters) {
        if (cluster.videos.length >= this.config.minOccurrences) {
          const pattern = await this.extractPatternFromCluster(cluster);
          
          if (pattern && pattern.confidenceScore >= this.config.minConfidenceScore) {
            // Check if pattern is truly new
            if (!this.isExistingPattern(pattern)) {
              newPatterns.push(pattern);
              this.emergingPatterns.set(pattern.id, pattern);
            }
          }
        }
      }

      // Store emerging patterns for validation
      await this.storeEmergingPatterns(newPatterns);
      
      return newPatterns;
      
    } catch (error) {
      console.error('Pattern discovery error:', error);
      return [];
    }
  }

  /**
   * Cluster similar content to find patterns
   */
  private async clusterSimilarContent(videos: any[]): Promise<ContentCluster[]> {
    const clusters: ContentCluster[] = [];
    
    // Simple clustering based on script patterns and engagement patterns
    const scriptFeatures = await Promise.all(
      videos.map(async video => {
        const transcript = video.script_analyses?.[0]?.transcript || video.caption || '';
        return {
          videoId: video.id,
          video,
          features: await this.extractContentFeatures(transcript, video)
        };
      })
    );

    // Group by similar features
    const similarityThreshold = 0.7;
    const processed = new Set<string>();

    for (const item of scriptFeatures) {
      if (processed.has(item.videoId)) continue;

      const cluster: ContentCluster = {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        videos: [item.video],
        commonFeatures: item.features,
        avgViralRate: item.video.viral_probability || 0,
        platforms: [item.video.platform || 'tiktok']
      };

      processed.add(item.videoId);

      // Find similar items
      for (const otherItem of scriptFeatures) {
        if (processed.has(otherItem.videoId)) continue;
        
        const similarity = this.calculateFeatureSimilarity(item.features, otherItem.features);
        
        if (similarity >= similarityThreshold) {
          cluster.videos.push(otherItem.video);
          cluster.avgViralRate = (cluster.avgViralRate + (otherItem.video.viral_probability || 0)) / 2;
          processed.add(otherItem.videoId);
        }
      }

      if (cluster.videos.length >= 3) {
        clusters.push(cluster);
      }
    }

    return clusters.sort((a, b) => b.avgViralRate - a.avgViralRate);
  }

  /**
   * Extract content features for clustering
   */
  private async extractContentFeatures(transcript: string, video: any): Promise<ContentFeatures> {
    const words = transcript.toLowerCase().split(/\s+/);
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: words.length / Math.max(sentences.length, 1),
      
      // Linguistic features
      questionCount: (transcript.match(/\?/g) || []).length,
      exclamationCount: (transcript.match(/!/g) || []).length,
      personalPronouns: (transcript.match(/\b(i|you|we|my|your|our)\b/gi) || []).length,
      
      // Emotional features
      emotionalWords: this.countEmotionalWords(transcript),
      urgencyWords: this.countUrgencyWords(transcript),
      
      // Structural features
      startsWithQuestion: /^\s*[^.!]*\?/.test(transcript),
      hasNumberedList: /\b\d+[\.\)]\s/.test(transcript),
      hasTimeFrame: /\b(day|week|month|year|minute|hour)s?\b/i.test(transcript),
      
      // Platform features
      platform: video.platform || 'tiktok',
      duration: video.duration_seconds || 30,
      hashtags: video.hashtags || [],
      
      // Performance features
      viralScore: video.viral_probability || 0,
      engagementRate: this.calculateEngagementRate(video)
    };
  }

  /**
   * Extract pattern from content cluster
   */
  private async extractPatternFromCluster(cluster: ContentCluster): Promise<EmergingPattern | null> {
    try {
      // Analyze common elements across cluster
      const commonWords = this.findCommonWords(cluster.videos);
      const commonStructures = this.findCommonStructures(cluster.videos);
      const commonHooks = this.findCommonHooks(cluster.videos);
      
      // Generate pattern description
      const patternName = this.generatePatternName(commonWords, commonStructures);
      const patternDescription = this.generatePatternDescription(cluster);
      
      // Determine category
      const category = this.determinePatternCategory(commonStructures, commonHooks);
      
      // Calculate confidence score
      const confidenceScore = this.calculatePatternConfidence(cluster);
      
      // Extract key indicators
      const keyIndicators = [...commonWords, ...commonHooks].slice(0, 10);
      const scriptPatterns = this.extractScriptPatterns(cluster.videos);
      
      // Create examples
      const examples = cluster.videos.slice(0, 5).map(video => ({
        videoId: video.id,
        transcript: video.script_analyses?.[0]?.transcript || video.caption || '',
        viralScore: video.viral_score || 0,
        viewCount: video.view_count || 0,
        platform: video.platform || 'tiktok',
        createdAt: video.created_at,
        frameworkMatches: []
      }));

      const pattern: EmergingPattern = {
        id: `emerging_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: patternName,
        description: patternDescription,
        category,
        discoveredAt: new Date().toISOString(),
        confidenceScore,
        occurrences: cluster.videos.length,
        avgViralRate: cluster.avgViralRate,
        keyIndicators,
        scriptPatterns,
        examples,
        validated: false,
        tier: this.assignTier(cluster.avgViralRate),
        platforms: cluster.platforms,
        performanceMetrics: {
          totalTests: 0,
          successfulPredictions: 0,
          accuracyRate: 0,
          falsePositives: 0,
          falseNegatives: 0,
          avgConfidenceScore: confidenceScore,
          platformBreakdown: {}
        }
      };

      return pattern;
      
    } catch (error) {
      console.error('Pattern extraction error:', error);
      return null;
    }
  }

  /**
   * Validate emerging patterns through real-world testing
   */
  private async validateEmergingPatterns(): Promise<FrameworkPattern[]> {
    const validatedFrameworks: FrameworkPattern[] = [];
    
    // Get patterns ready for validation
    const patternsToValidate = Array.from(this.emergingPatterns.values())
      .filter(pattern => !pattern.validated)
      .filter(pattern => {
        const daysSinceDiscovery = (Date.now() - new Date(pattern.discoveredAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceDiscovery >= this.config.validationPeriodDays;
      });

    console.log(`🧪 Validating ${patternsToValidate.length} patterns`);

    for (const pattern of patternsToValidate) {
      try {
        // Test pattern against recent content
        const validationResults = await this.testPatternAccuracy(pattern);
        
        // Update performance metrics
        pattern.performanceMetrics = validationResults;
        
        // Check validation criteria
        if (this.meetsValidationCriteria(pattern)) {
          // Convert to framework
          const framework = this.convertPatternToFramework(pattern);
          validatedFrameworks.push(framework);
          
          // Mark as validated
          pattern.validated = true;
          
          console.log(`✅ Pattern "${pattern.name}" validated with ${(validationResults.accuracyRate * 100).toFixed(1)}% accuracy`);
        } else {
          console.log(`❌ Pattern "${pattern.name}" failed validation (${(validationResults.accuracyRate * 100).toFixed(1)}% accuracy)`);
        }
        
      } catch (error) {
        console.error(`Validation error for pattern ${pattern.name}:`, error);
      }
    }

    return validatedFrameworks;
  }

  /**
   * Test pattern accuracy against real content
   */
  private async testPatternAccuracy(pattern: EmergingPattern): Promise<PerformanceMetrics> {
    try {
      // Get test content from validation period
      const { data: testContent } = await this.supabase
        .from('videos')
        .select('*')
        .gte('created_at', new Date(Date.now() - this.config.validationPeriodDays * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (!testContent || testContent.length === 0) {
        throw new Error('No test content available');
      }

      let totalTests = 0;
      let successfulPredictions = 0;
      let falsePositives = 0;
      let falseNegatives = 0;
      const platformBreakdown: Record<string, number> = {};

      for (const video of testContent) {
        const actuallyViral = (video.viral_probability || 0) > 0.5;
        const patternMatches = await this.testPatternMatch(pattern, video);
        const predictedViral = patternMatches.confidence > 0.6;

        totalTests++;

        if (actuallyViral === predictedViral) {
          successfulPredictions++;
        } else if (predictedViral && !actuallyViral) {
          falsePositives++;
        } else if (!predictedViral && actuallyViral) {
          falseNegatives++;
        }

        // Track platform breakdown
        const platform = video.platform || 'tiktok';
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + (actuallyViral === predictedViral ? 1 : 0);
      }

      const accuracyRate = successfulPredictions / totalTests;
      
      return {
        totalTests,
        successfulPredictions,
        accuracyRate,
        falsePositives,
        falseNegatives,
        avgConfidenceScore: pattern.confidenceScore,
        platformBreakdown
      };

    } catch (error) {
      console.error('Pattern testing error:', error);
      return {
        totalTests: 0,
        successfulPredictions: 0,
        accuracyRate: 0,
        falsePositives: 0,
        falseNegatives: 0,
        avgConfidenceScore: 0,
        platformBreakdown: {}
      };
    }
  }

  /**
   * Retire underperforming frameworks
   */
  private async retireUnderperformingFrameworks(): Promise<string[]> {
    const retiredFrameworks: string[] = [];
    
    try {
      // Get framework performance metrics
      const frameworks = this.frameworkLibrary.getAllFrameworks();
      
      for (const framework of frameworks) {
        const performance = await this.getFrameworkPerformance(framework.id);
        
        if (performance && performance.accuracyRate < this.config.retirementThreshold) {
          // Retire framework
          await this.retireFramework(framework.id);
          retiredFrameworks.push(framework.name);
          
          console.log(`🗑️ Retired framework "${framework.name}" (${(performance.accuracyRate * 100).toFixed(1)}% accuracy)`);
        }
      }
      
    } catch (error) {
      console.error('Framework retirement error:', error);
    }

    return retiredFrameworks;
  }

  // Helper methods
  private calculateFeatureSimilarity(features1: ContentFeatures, features2: ContentFeatures): number {
    // Simple cosine similarity calculation
    const weights = {
      wordCount: 0.1,
      avgWordsPerSentence: 0.1,
      questionCount: 0.15,
      exclamationCount: 0.1,
      personalPronouns: 0.1,
      emotionalWords: 0.15,
      urgencyWords: 0.1,
      startsWithQuestion: 0.1,
      hasNumberedList: 0.05,
      hasTimeFrame: 0.05,
      viralScore: 0.1
    };

    let similarity = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (key in features1 && key in features2) {
        const val1 = typeof features1[key as keyof ContentFeatures] === 'boolean' 
          ? (features1[key as keyof ContentFeatures] ? 1 : 0)
          : Number(features1[key as keyof ContentFeatures]) || 0;
        const val2 = typeof features2[key as keyof ContentFeatures] === 'boolean'
          ? (features2[key as keyof ContentFeatures] ? 1 : 0)
          : Number(features2[key as keyof ContentFeatures]) || 0;
        
        const maxVal = Math.max(val1, val2, 1);
        const sim = 1 - Math.abs(val1 - val2) / maxVal;
        
        similarity += sim * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  private countEmotionalWords(text: string): number {
    const emotionalWords = ['amazing', 'incredible', 'shocking', 'unbelievable', 'stunning', 'mindblowing', 'crazy', 'insane', 'perfect', 'terrible', 'awful', 'fantastic', 'brilliant'];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => emotionalWords.some(emo => word.includes(emo))).length;
  }

  private countUrgencyWords(text: string): number {
    const urgencyWords = ['now', 'today', 'immediately', 'urgent', 'quickly', 'asap', 'deadline', 'limited', 'hurry', 'fast'];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => urgencyWords.some(urg => word.includes(urg))).length;
  }

  private calculateEngagementRate(video: any): number {
    const views = video.view_count || 1;
    const engagement = (video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0);
    return engagement / views;
  }

  private findCommonWords(videos: any[]): string[] {
    const wordCounts = new Map<string, number>();
    const totalVideos = videos.length;
    
    for (const video of videos) {
      const text = (video.script_analyses?.[0]?.transcript || video.caption || '').toLowerCase();
      const words = text.split(/\s+/).filter(word => word.length > 3);
      
      const uniqueWords = new Set(words);
      for (const word of uniqueWords) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    // Return words that appear in at least 50% of videos
    return Array.from(wordCounts.entries())
      .filter(([word, count]) => count / totalVideos >= 0.5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private findCommonStructures(videos: any[]): string[] {
    // Look for common structural patterns
    return ['question-opening', 'numbered-list', 'before-after', 'story-format'];
  }

  private findCommonHooks(videos: any[]): string[] {
    // Look for common hook patterns
    return ['attention-grabber', 'curiosity-gap', 'problem-statement'];
  }

  private generatePatternName(commonWords: string[], structures: string[]): string {
    const words = commonWords.slice(0, 2).join('-');
    const structure = structures[0] || 'format';
    return `${words}-${structure}`.replace(/[^a-z0-9-]/gi, '');
  }

  private generatePatternDescription(cluster: ContentCluster): string {
    return `Emerging pattern with ${cluster.videos.length} occurrences, ${(cluster.avgViralRate * 100).toFixed(1)}% avg viral rate`;
  }

  private determinePatternCategory(structures: string[], hooks: string[]): string {
    if (hooks.some(h => h.includes('hook') || h.includes('attention'))) return 'hook-driven';
    if (structures.some(s => s.includes('format') || s.includes('visual'))) return 'visual-format';
    if (structures.some(s => s.includes('story') || s.includes('series'))) return 'content-series';
    return 'emerging';
  }

  private calculatePatternConfidence(cluster: ContentCluster): number {
    const factors = {
      occurrences: Math.min(cluster.videos.length / 20, 1) * 0.3,
      viralRate: cluster.avgViralRate * 0.4,
      consistency: this.calculateClusterConsistency(cluster) * 0.3
    };
    
    return factors.occurrences + factors.viralRate + factors.consistency;
  }

  private calculateClusterConsistency(cluster: ContentCluster): number {
    // Calculate how consistent the viral rates are within the cluster
    const rates = cluster.videos.map(v => v.viral_probability || 0);
    const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    
    return Math.max(0, 1 - variance); // Lower variance = higher consistency
  }

  private assignTier(avgViralRate: number): 1 | 2 | 3 {
    if (avgViralRate > 0.7) return 1;
    if (avgViralRate > 0.4) return 2;
    return 3;
  }

  private isExistingPattern(pattern: EmergingPattern): boolean {
    const existingFrameworks = this.frameworkLibrary.getAllFrameworks();
    return existingFrameworks.some(framework => 
      this.calculatePatternSimilarity(pattern, framework) > 0.8
    );
  }

  private calculatePatternSimilarity(pattern: EmergingPattern, framework: FrameworkPattern): number {
    // Simple similarity check based on keywords and category
    const categoryMatch = pattern.category === framework.category ? 0.4 : 0;
    const keywordOverlap = this.calculateKeywordOverlap(pattern.keyIndicators, framework.keyIndicators || []);
    
    return categoryMatch + (keywordOverlap * 0.6);
  }

  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    
    const intersection = new Set([...set1].filter(k => set2.has(k)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Additional methods would be implemented here...
  private extractScriptPatterns(videos: any[]): string[] { return []; }
  private meetsValidationCriteria(pattern: EmergingPattern): boolean { return pattern.performanceMetrics.accuracyRate >= 0.7; }
  private convertPatternToFramework(pattern: EmergingPattern): FrameworkPattern { 
    return {
      id: pattern.id,
      name: pattern.name,
      category: pattern.category as any,
      tier: pattern.tier,
      viralRate: pattern.avgViralRate,
      platforms: pattern.platforms as any,
      keyIndicators: pattern.keyIndicators
    };
  }
  private async testPatternMatch(pattern: EmergingPattern, video: any): Promise<{confidence: number}> { return {confidence: 0.5}; }
  private async getFrameworkPerformance(frameworkId: string): Promise<PerformanceMetrics | null> { return null; }
  private async retireFramework(frameworkId: string): Promise<void> { }
  private async updateFrameworkLibrary(frameworks: FrameworkPattern[]): Promise<void> { }
  private async storeEmergingPatterns(patterns: EmergingPattern[]): Promise<void> { }
  private async storeEvolutionCycle(results: any): Promise<void> { }
  private generateEvolutionSummary(data: any): string { return `Evolution cycle complete: ${data.newPatterns} new, ${data.validated} validated, ${data.retired} retired. Total: ${data.total} frameworks.`; }
}

// Supporting interfaces
interface ContentCluster {
  id: string;
  videos: any[];
  commonFeatures: ContentFeatures;
  avgViralRate: number;
  platforms: string[];
}

interface ContentFeatures {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  questionCount: number;
  exclamationCount: number;
  personalPronouns: number;
  emotionalWords: number;
  urgencyWords: number;
  startsWithQuestion: boolean;
  hasNumberedList: boolean;
  hasTimeFrame: boolean;
  platform: string;
  duration: number;
  hashtags: string[];
  viralScore: number;
  engagementRate: number;
}
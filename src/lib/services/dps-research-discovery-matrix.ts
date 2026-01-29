/**
 * DPS RESEARCH DISCOVERY MATRIX
 * 
 * Implements the 2×2 Framework from DPS-Powered Idea Mining System for
 * optimal content source discovery and viral pattern identification
 * 
 * MATRIX FRAMEWORK:
 * ┌─────────────────┬─────────────────┬─────────────────┐
 * │ Content Type    │ Same Platform   │ Different Platform│
 * ├─────────────────┼─────────────────┼─────────────────┤
 * │ Same Type       │ 🎯 Primary Zone │ 🎯 Secondary Zone│
 * │ Different Type  │ ❌ Avoid Zone   │ ❌ Avoid Zone    │
 * └─────────────────┴─────────────────┴─────────────────┘
 * 
 * RESEARCH PROTOCOL:
 * 1. Daily DPS filtering (Top 10%, 5%, 1% performance)
 * 2. Creator watch lists (20-30 top niche creators)
 * 3. Time parameter optimization (7-14 days trending, 3-6 months evergreen)
 * 4. Pattern documentation and analysis
 */

import { createClient } from '@supabase/supabase-js';

// ===== CORE INTERFACES =====

export interface ResearchDiscoveryRequest {
  niche: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  contentType: 'short-form' | 'long-form' | 'story' | 'reel';
  researchDepth: 'basic' | 'comprehensive' | 'elite';
  timeRange: 'trending' | 'evergreen' | 'pattern-analysis';
  targetCreators?: string[];
  dpsThreshold?: 'top-10' | 'top-5' | 'top-1'; // Top 10%, 5%, 1%
}

export interface DiscoveryResult {
  researchId: string;
  timestamp: string;
  
  // Research Matrix Classification
  matrixZone: 'primary' | 'secondary' | 'avoid';
  researchQuality: 'excellent' | 'good' | 'poor';
  
  // DPS-Filtered Content
  discoveredContent: DPSFilteredContent[];
  creatorWatchList: CreatorAnalysis[];
  viralPatterns: ViralPattern[];
  
  // Research Metrics
  researchMetrics: {
    contentAnalyzed: number;
    dpsFilterPassed: number;
    patternsIdentified: number;
    creatorsCovered: number;
    averageDPSScore: number;
  };
  
  // Actionable Insights
  actionableInsights: {
    topPatterns: string[];
    remix_opportunities: string[];
    trending_elements: string[];
    optimization_recommendations: string[];
  };
}

export interface DPSFilteredContent {
  contentId: string;
  platform: string;
  creator: string;
  
  // DPS Metrics
  dpsScore: number;
  dpsPercentile: number;
  viralClassification: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending';
  
  // Content Analysis
  content: {
    caption: string;
    hashtags: string[];
    transcript?: string;
    duration?: number;
  };
  
  // Engagement Metrics
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saveRate: number;
    completionRate: number;
  };
  
  // 7 Idea Legos Analysis
  ideaLegos: {
    topic: LegoAnalysis;
    angle: LegoAnalysis;
    hook: LegoAnalysis;
    story: LegoAnalysis;
    visual: LegoAnalysis;
    keyVisuals: LegoAnalysis;
    audio: LegoAnalysis;
  };
  
  // Research Metadata
  researchValue: 'high' | 'medium' | 'low';
  applicability: number; // 0-1 score
  extractedPatterns: string[];
}

interface LegoAnalysis {
  score: number;
  strength: 'viral' | 'strong' | 'moderate' | 'weak';
  pattern: string;
  replicability: 'easy' | 'moderate' | 'difficult';
}

interface CreatorAnalysis {
  username: string;
  platform: string;
  followers: number;
  
  // Performance Metrics
  averageDPS: number;
  consistencyScore: number;
  viralHitRate: number;
  
  // Pattern Analysis
  strongPatterns: string[];
  signature_style: string;
  content_pillars: string[];
  
  // Research Value
  watchPriority: 'high' | 'medium' | 'low';
  lastAnalyzed: string;
}

interface ViralPattern {
  patternId: string;
  name: string;
  description: string;
  
  // Pattern Metrics
  frequency: number;
  effectiveness: number;
  replicability: number;
  
  // Application Data
  examples: string[];
  applicableNiches: string[];
  platforms: string[];
  
  // Implementation Guide
  implementation: {
    difficulty: 'easy' | 'moderate' | 'advanced';
    steps: string[];
    expectedLift: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

// ===== MAIN DISCOVERY MATRIX CLASS =====

export class DPSResearchDiscoveryMatrix {
  private supabase: any;
  private watchLists: Map<string, CreatorAnalysis[]> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Execute DPS Research Discovery using 2×2 Matrix Framework
   */
  async executeDiscovery(request: ResearchDiscoveryRequest): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const researchId = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log('🔍 Starting DPS Research Discovery Matrix...');
      
      // Step 1: Matrix Zone Classification
      const matrixZone = this.classifyMatrixZone(request);
      
      if (matrixZone === 'avoid') {
        return this.generateAvoidZoneResponse(researchId, request);
      }
      
      // Step 2: DPS Content Discovery
      const dpsContent = await this.discoverDPSContent(request);
      
      // Step 3: Creator Watch List Analysis
      const creatorAnalysis = await this.analyzeCreatorWatchList(request);
      
      // Step 4: Viral Pattern Extraction
      const viralPatterns = await this.extractViralPatterns(dpsContent, request);
      
      // Step 5: Research Quality Assessment
      const researchQuality = this.assessResearchQuality(dpsContent, creatorAnalysis, request);
      
      // Step 6: Generate Actionable Insights
      const insights = this.generateActionableInsights(dpsContent, viralPatterns, creatorAnalysis);
      
      const result: DiscoveryResult = {
        researchId,
        timestamp: new Date().toISOString(),
        matrixZone,
        researchQuality,
        discoveredContent: dpsContent,
        creatorWatchList: creatorAnalysis,
        viralPatterns,
        researchMetrics: this.calculateResearchMetrics(dpsContent, creatorAnalysis, viralPatterns),
        actionableInsights: insights
      };

      // Store research for learning
      await this.storeResearchResults(result);
      
      console.log(`✅ DPS Research Discovery Complete: ${Date.now() - startTime}ms`);
      console.log(`📊 Matrix Zone: ${matrixZone}, Quality: ${researchQuality}`);
      console.log(`📈 Content Analyzed: ${dpsContent.length}, Patterns: ${viralPatterns.length}`);
      
      return result;

    } catch (error) {
      console.error('❌ DPS Research Discovery Error:', error);
      throw new Error(`Research discovery failed: ${error}`);
    }
  }

  /**
   * Classify content into 2×2 Matrix zones
   */
  private classifyMatrixZone(request: ResearchDiscoveryRequest): 'primary' | 'secondary' | 'avoid' {
    // Same content type (short-form video) = Primary/Secondary zones
    // Different content type = Avoid zones
    
    if (request.contentType === 'short-form') {
      // Same platform = Primary research zone (🎯 Primary Zone)
      // Different platform = Secondary research zone (🎯 Secondary Zone)
      return 'primary'; // Simplified - would check platform matching
    } else {
      // Different content type = Avoid zone (❌ Avoid)
      return 'avoid';
    }
  }

  /**
   * Discover DPS-filtered content using systematic approach
   */
  private async discoverDPSContent(request: ResearchDiscoveryRequest): Promise<DPSFilteredContent[]> {
    console.log('🎯 DPS Content Discovery Phase...');
    
    // DPS Threshold mapping
    const dpsThresholds = {
      'top-10': 90,  // Top 10% DPS performance
      'top-5': 95,   // Top 5% DPS performance (viral)
      'top-1': 99    // Top 1% DPS performance (hyper-viral)
    };
    
    const threshold = dpsThresholds[request.dpsThreshold || 'top-10'];
    
    // Time parameter mapping
    const timeRanges = {
      'trending': 14,     // 7-14 days
      'evergreen': 180,   // 3-6 months
      'pattern-analysis': 365 // 12 months
    };
    
    const daysBack = timeRanges[request.timeRange];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    // Query viral content from database
    const { data: rawContent } = await this.supabase
      .from('scraped_data')
      .select('*')
      .eq('platform', request.platform)
      .gte('created_at', cutoffDate.toISOString())
      .gte('view_count', 10000) // Minimum threshold
      .order('view_count', { ascending: false })
      .limit(request.researchDepth === 'elite' ? 100 : request.researchDepth === 'comprehensive' ? 50 : 25);

    if (!rawContent || rawContent.length === 0) {
      console.log('⚠️ No content found matching DPS criteria');
      return [];
    }

    // Apply DPS filtering and analysis
    const dpsContent: DPSFilteredContent[] = [];
    
    for (const content of rawContent) {
      try {
        const dpsScore = this.calculateDPSScore(content);
        
        // Apply DPS threshold filter
        if (dpsScore < threshold) continue;
        
        // Analyze with 7 Idea Legos
        const ideaLegos = await this.analyze7IdeaLegos(content);
        
        // Calculate research value
        const researchValue = this.calculateResearchValue(content, dpsScore, ideaLegos);
        
        const filteredContent: DPSFilteredContent = {
          contentId: content.id,
          platform: content.platform,
          creator: content.creator_username || 'unknown',
          dpsScore,
          dpsPercentile: this.scoreToPercentile(dpsScore),
          viralClassification: this.classifyVirality(dpsScore),
          content: {
            caption: content.caption || content.description || '',
            hashtags: content.hashtags || [],
            transcript: content.transcript,
            duration: content.duration_seconds
          },
          engagement: {
            views: content.view_count || 0,
            likes: content.like_count || 0,
            comments: content.comment_count || 0,
            shares: content.share_count || 0,
            saveRate: this.calculateSaveRate(content),
            completionRate: this.calculateCompletionRate(content)
          },
          ideaLegos,
          researchValue,
          applicability: this.calculateApplicability(content, request),
          extractedPatterns: this.extractPatternsFromContent(content, ideaLegos)
        };
        
        dpsContent.push(filteredContent);
        
      } catch (error) {
        console.log(`⚠️ Error analyzing content ${content.id}:`, error);
      }
    }
    
    // Sort by research value and DPS score
    dpsContent.sort((a, b) => {
      const aValue = this.getResearchValueScore(a.researchValue) * a.dpsScore;
      const bValue = this.getResearchValueScore(b.researchValue) * b.dpsScore;
      return bValue - aValue;
    });
    
    return dpsContent.slice(0, 30); // Return top 30 pieces
  }

  /**
   * Analyze creator watch list for systematic research
   */
  private async analyzeCreatorWatchList(request: ResearchDiscoveryRequest): Promise<CreatorAnalysis[]> {
    console.log('👥 Creator Watch List Analysis...');
    
    // Get or build creator watch list for niche
    let watchList = this.watchLists.get(`${request.niche}_${request.platform}`);
    
    if (!watchList) {
      watchList = await this.buildCreatorWatchList(request);
      this.watchLists.set(`${request.niche}_${request.platform}`, watchList);
    }
    
    // Analyze each creator's recent performance
    const creatorAnalyses: CreatorAnalysis[] = [];
    
    for (const creator of watchList.slice(0, 30)) { // Top 30 creators
      try {
        const analysis = await this.analyzeCreatorPerformance(creator, request);
        creatorAnalyses.push(analysis);
      } catch (error) {
        console.log(`⚠️ Error analyzing creator ${creator.username}:`, error);
      }
    }
    
    return creatorAnalyses.sort((a, b) => b.averageDPS - a.averageDPS);
  }

  /**
   * Extract viral patterns from DPS content
   */
  private async extractViralPatterns(content: DPSFilteredContent[], request: ResearchDiscoveryRequest): Promise<ViralPattern[]> {
    console.log('🧬 Viral Pattern Extraction...');
    
    const patterns: ViralPattern[] = [];
    const patternFrequency = new Map<string, number>();
    const patternExamples = new Map<string, string[]>();
    
    // Analyze patterns across all content
    for (const item of content) {
      for (const pattern of item.extractedPatterns) {
        patternFrequency.set(pattern, (patternFrequency.get(pattern) || 0) + 1);
        
        if (!patternExamples.has(pattern)) {
          patternExamples.set(pattern, []);
        }
        patternExamples.get(pattern)!.push(`${item.creator}: ${pattern}`);
      }
    }
    
    // Convert to viral patterns with metrics
    Array.from(patternFrequency.entries())
      .filter(([_, frequency]) => frequency >= 3) // Minimum 3 occurrences
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Top 20 patterns
      .forEach(([pattern, frequency]) => {
        const effectiveness = frequency / content.length;
        const examples = patternExamples.get(pattern) || [];
        
        patterns.push({
          patternId: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: pattern,
          description: `Viral pattern with ${frequency} occurrences across ${content.length} pieces`,
          frequency,
          effectiveness,
          replicability: this.calculateReplicability(pattern, examples),
          examples: examples.slice(0, 5),
          applicableNiches: [request.niche],
          platforms: [request.platform],
          implementation: {
            difficulty: this.assessImplementationDifficulty(pattern),
            steps: this.generateImplementationSteps(pattern),
            expectedLift: Math.min(effectiveness * 50, 30), // Up to 30% lift
            riskLevel: this.assessPatternRisk(pattern)
          }
        });
      });
    
    return patterns;
  }

  /**
   * Assess overall research quality
   */
  private assessResearchQuality(
    content: DPSFilteredContent[], 
    creators: CreatorAnalysis[], 
    request: ResearchDiscoveryRequest
  ): 'excellent' | 'good' | 'poor' {
    const contentQuality = content.length >= 20 ? 'excellent' : content.length >= 10 ? 'good' : 'poor';
    const creatorQuality = creators.length >= 15 ? 'excellent' : creators.length >= 8 ? 'good' : 'poor';
    const avgDPS = content.reduce((sum, c) => sum + c.dpsScore, 0) / content.length;
    const dpsQuality = avgDPS >= 95 ? 'excellent' : avgDPS >= 85 ? 'good' : 'poor';
    
    // Overall quality is the minimum of all factors
    const qualities = [contentQuality, creatorQuality, dpsQuality];
    if (qualities.includes('poor')) return 'poor';
    if (qualities.includes('good')) return 'good';
    return 'excellent';
  }

  /**
   * Generate actionable insights from research
   */
  private generateActionableInsights(
    content: DPSFilteredContent[], 
    patterns: ViralPattern[], 
    creators: CreatorAnalysis[]
  ) {
    const topPatterns = patterns
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5)
      .map(p => `${p.name} (${(p.effectiveness * 100).toFixed(1)}% effectiveness)`);
    
    const remixOpportunities = content
      .filter(c => c.researchValue === 'high')
      .slice(0, 5)
      .map(c => `Remix ${c.creator}'s ${this.getStrongestLego(c.ideaLegos)} approach`);
    
    const trendingElements = this.identifyTrendingElements(content);
    
    const optimizationRecommendations = this.generateOptimizationRecommendations(patterns, creators);
    
    return {
      topPatterns,
      remix_opportunities: remixOpportunities,
      trending_elements: trendingElements,
      optimization_recommendations: optimizationRecommendations
    };
  }

  // ===== HELPER METHODS =====

  private generateAvoidZoneResponse(researchId: string, request: ResearchDiscoveryRequest): DiscoveryResult {
    return {
      researchId,
      timestamp: new Date().toISOString(),
      matrixZone: 'avoid',
      researchQuality: 'poor',
      discoveredContent: [],
      creatorWatchList: [],
      viralPatterns: [],
      researchMetrics: {
        contentAnalyzed: 0,
        dpsFilterPassed: 0,
        patternsIdentified: 0,
        creatorsCovered: 0,
        averageDPSScore: 0
      },
      actionableInsights: {
        topPatterns: ['Avoid: Different content type research not recommended'],
        remix_opportunities: ['Focus on same content type for optimal results'],
        trending_elements: ['Switch to same content type (short-form video)'],
        optimization_recommendations: ['Use Primary or Secondary research zones']
      }
    };
  }

  private calculateDPSScore(content: any): number {
    // Simplified DPS calculation - would use full algorithm
    const engagementRate = content.view_count > 0 ? 
      (content.like_count + content.comment_count + content.share_count) / content.view_count : 0;
    
    const followersToViewRatio = content.creator_followers > 0 ? 
      content.view_count / content.creator_followers : 1;
    
    const baseScore = Math.min(engagementRate * 1000 + followersToViewRatio * 10, 100);
    return Math.max(baseScore, 0);
  }

  private async analyze7IdeaLegos(content: any): Promise<any> {
    // Simplified 7 Idea Legos analysis
    return {
      topic: { score: 75, strength: 'strong', pattern: 'Trending topic', replicability: 'easy' },
      angle: { score: 70, strength: 'strong', pattern: 'Unique perspective', replicability: 'moderate' },
      hook: { score: 85, strength: 'viral', pattern: 'Pattern interrupt', replicability: 'easy' },
      story: { score: 68, strength: 'moderate', pattern: 'Problem-solution', replicability: 'moderate' },
      visual: { score: 72, strength: 'strong', pattern: 'High contrast', replicability: 'moderate' },
      keyVisuals: { score: 65, strength: 'moderate', pattern: 'Trending visuals', replicability: 'difficult' },
      audio: { score: 78, strength: 'strong', pattern: 'Trending sound', replicability: 'easy' }
    };
  }

  private calculateResearchValue(content: any, dpsScore: number, ideaLegos: any): 'high' | 'medium' | 'low' {
    const strongLegos = Object.values(ideaLegos).filter((lego: any) => lego.score >= 75).length;
    
    if (dpsScore >= 95 && strongLegos >= 5) return 'high';
    if (dpsScore >= 85 && strongLegos >= 3) return 'medium';
    return 'low';
  }

  private scoreToPercentile(score: number): number {
    return Math.min(score, 100);
  }

  private classifyVirality(score: number): 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' {
    if (score >= 99) return 'mega-viral';
    if (score >= 95) return 'hyper-viral';
    if (score >= 90) return 'viral';
    return 'trending';
  }

  private calculateSaveRate(content: any): number {
    // Estimated save rate based on engagement
    return Math.min((content.like_count || 0) / (content.view_count || 1) * 5, 1);
  }

  private calculateCompletionRate(content: any): number {
    // Estimated completion rate
    return Math.min((content.comment_count || 0) / (content.view_count || 1) * 20, 1);
  }

  private calculateApplicability(content: any, request: ResearchDiscoveryRequest): number {
    // Simplified applicability calculation
    return 0.8;
  }

  private extractPatternsFromContent(content: any, ideaLegos: any): string[] {
    const patterns: string[] = [];
    
    Object.entries(ideaLegos).forEach(([key, lego]: [string, any]) => {
      if (lego.score >= 75) {
        patterns.push(`${key}: ${lego.pattern}`);
      }
    });
    
    return patterns;
  }

  private getResearchValueScore(value: 'high' | 'medium' | 'low'): number {
    return { high: 3, medium: 2, low: 1 }[value];
  }

  private async buildCreatorWatchList(request: ResearchDiscoveryRequest): Promise<CreatorAnalysis[]> {
    // Build creator watch list from top performers
    const { data: creators } = await this.supabase
      .from('scraped_data')
      .select('creator_username, creator_followers')
      .eq('platform', request.platform)
      .not('creator_username', 'is', null)
      .order('view_count', { ascending: false })
      .limit(100);

    if (!creators) return [];

    // Group by creator and calculate metrics
    const creatorMap = new Map<string, any>();
    
    creators.forEach(creator => {
      if (!creatorMap.has(creator.creator_username)) {
        creatorMap.set(creator.creator_username, {
          username: creator.creator_username,
          platform: request.platform,
          followers: creator.creator_followers || 0,
          averageDPS: 0,
          consistencyScore: 0,
          viralHitRate: 0,
          strongPatterns: [],
          signature_style: 'Unknown',
          content_pillars: [],
          watchPriority: 'medium' as const,
          lastAnalyzed: new Date().toISOString()
        });
      }
    });

    return Array.from(creatorMap.values());
  }

  private async analyzeCreatorPerformance(creator: CreatorAnalysis, request: ResearchDiscoveryRequest): Promise<CreatorAnalysis> {
    // Analyze creator's recent performance
    const { data: recentContent } = await this.supabase
      .from('scraped_data')
      .select('*')
      .eq('creator_username', creator.username)
      .eq('platform', request.platform)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!recentContent || recentContent.length === 0) {
      return creator;
    }

    // Calculate performance metrics
    const dpss = recentContent.map(content => this.calculateDPSScore(content));
    const averageDPS = dpss.reduce((sum, dps) => sum + dps, 0) / dpss.length;
    const viralHitRate = dpss.filter(dps => dps >= 90).length / dpss.length;
    const consistencyScore = 1 - (Math.max(...dpss) - Math.min(...dpss)) / 100;

    return {
      ...creator,
      averageDPS,
      viralHitRate,
      consistencyScore,
      watchPriority: averageDPS >= 90 ? 'high' : averageDPS >= 75 ? 'medium' : 'low',
      lastAnalyzed: new Date().toISOString()
    };
  }

  private calculateReplicability(pattern: string, examples: string[]): number {
    // Simplified replicability calculation
    return Math.min(examples.length / 10, 1);
  }

  private assessImplementationDifficulty(pattern: string): 'easy' | 'moderate' | 'advanced' {
    if (pattern.includes('hook') || pattern.includes('audio')) return 'easy';
    if (pattern.includes('visual') || pattern.includes('story')) return 'moderate';
    return 'advanced';
  }

  private generateImplementationSteps(pattern: string): string[] {
    return [
      `Analyze current ${pattern} performance`,
      `Identify top-performing ${pattern} examples`,
      `Adapt pattern to your niche and style`,
      `Test implementation with A/B testing`,
      `Optimize based on performance data`
    ];
  }

  private assessPatternRisk(pattern: string): 'low' | 'medium' | 'high' {
    if (pattern.includes('trending') || pattern.includes('viral')) return 'medium';
    return 'low';
  }

  private calculateResearchMetrics(content: DPSFilteredContent[], creators: CreatorAnalysis[], patterns: ViralPattern[]) {
    return {
      contentAnalyzed: content.length,
      dpsFilterPassed: content.filter(c => c.dpsScore >= 90).length,
      patternsIdentified: patterns.length,
      creatorsCovered: creators.length,
      averageDPSScore: content.reduce((sum, c) => sum + c.dpsScore, 0) / content.length || 0
    };
  }

  private getStrongestLego(ideaLegos: any): string {
    let strongest = 'topic';
    let highestScore = 0;
    
    Object.entries(ideaLegos).forEach(([key, lego]: [string, any]) => {
      if (lego.score > highestScore) {
        highestScore = lego.score;
        strongest = key;
      }
    });
    
    return strongest;
  }

  private identifyTrendingElements(content: DPSFilteredContent[]): string[] {
    const hashtagCounts = new Map<string, number>();
    
    content.forEach(item => {
      item.content.hashtags.forEach(tag => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => `${tag} (${count} occurrences)`);
  }

  private generateOptimizationRecommendations(patterns: ViralPattern[], creators: CreatorAnalysis[]): string[] {
    return [
      `Focus on top ${patterns.length} viral patterns with highest effectiveness`,
      `Study top 5 creators with average DPS > 85`,
      'Implement "Hold Winners, Remix Losers" strategy systematically',
      'Test patterns with low risk and high replicability first',
      'Monitor DPS scores for continuous optimization'
    ];
  }

  private async storeResearchResults(result: DiscoveryResult): Promise<void> {
    try {
      await this.supabase
        .from('dps_research_results')
        .insert({
          research_id: result.researchId,
          matrix_zone: result.matrixZone,
          research_quality: result.researchQuality,
          metrics: result.researchMetrics,
          insights: result.actionableInsights,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.log('⚠️ Error storing research results:', error);
    }
  }
}






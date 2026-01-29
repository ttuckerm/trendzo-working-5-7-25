/**
 * Script Intelligence Engine
 * Analyzes what creators SAY, not just visuals
 * Framework-based script analysis for viral content prediction
 */

import { ComprehensiveFrameworkLibrary } from './comprehensive-framework-library';

export interface ScriptAnalysis {
  scriptId: string;
  transcript: string;
  confidence: number;
  detectedFrameworks: DetectedFramework[];
  viralPotential: number;
  emotionalArc: EmotionalArc;
  hookAnalysis: HookAnalysis;
  narrativeStructure: NarrativeStructure;
  persuasionTechniques: PersuasionTechnique[];
  linguisticPatterns: LinguisticPattern[];
  improvements: string[];
  scriptScore: number;
  processingTime: number;
  // DPS-Powered Idea Mining Integration
  ideaLegos: SevenIdeaLegos;
  dpsOptimizations: DPSOptimization[];
  remixOpportunities: RemixOpportunity[];
  viralPatternMatches: ViralPatternMatch[];
}

// 7 Idea Legos Framework Integration
export interface SevenIdeaLegos {
  topic: TopicAnalysis;
  angle: AngleAnalysis;
  hookStructure: HookStructureAnalysis;
  storyStructure: StoryStructureAnalysis;
  visualFormat: VisualFormatAnalysis;
  keyVisuals: KeyVisualsAnalysis;
  audio: AudioAnalysis;
  legoScores: LegoScore[];
  overallScore: number;
}

export interface LegoScore {
  legoName: string;
  score: number; // 0-100
  strength: 'weak' | 'moderate' | 'strong' | 'viral';
  holdOrRemix: 'hold' | 'remix';
  optimizationPotential: number;
}

export interface DPSOptimization {
  component: string;
  currentScore: number;
  targetScore: number;
  improvementStrategy: string;
  expectedLift: number;
  confidence: number;
}

export interface RemixOpportunity {
  originalPattern: string;
  remixSuggestion: string;
  expectedDPSImprovement: number;
  riskLevel: 'low' | 'medium' | 'high';
  implementationDifficulty: 'easy' | 'moderate' | 'complex';
}

export interface DetectedFramework {
  frameworkId: string;
  frameworkName: string;
  confidence: number;
  matchedPatterns: string[];
  category: string;
  tier: number;
  scriptSegments: ScriptSegment[];
}

export interface ScriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  purpose: 'hook' | 'buildup' | 'climax' | 'cta' | 'transition';
  emotionalIntensity: number;
}

export interface EmotionalArc {
  overall: 'rising' | 'falling' | 'plateau' | 'roller-coaster' | 'explosive';
  peak: number; // 0-100
  valley: number; // 0-100
  arcScore: number;
  keyMoments: EmotionalMoment[];
}

export interface EmotionalMoment {
  timestamp: number;
  intensity: number;
  emotion: 'excitement' | 'curiosity' | 'fear' | 'joy' | 'anger' | 'surprise';
  trigger: string;
}

export interface HookAnalysis {
  hookType: string;
  strength: number; // 0-100
  timeToHook: number; // seconds
  retentionProbability: number;
  frameworks: string[];
  improvements: string[];
}

export interface NarrativeStructure {
  structure: 'problem-solution' | 'before-after' | 'list' | 'story' | 'tutorial' | 'reaction';
  completeness: number; // 0-100
  clarity: number; // 0-100
  engagement: number; // 0-100
}

export interface PersuasionTechnique {
  technique: string;
  strength: number;
  location: string; // where in script
  effectiveness: number;
}

export interface LinguisticPattern {
  pattern: string;
  frequency: number;
  viralCorrelation: number;
  examples: string[];
}

export class ScriptIntelligenceEngine {
  private frameworkLibrary: ComprehensiveFrameworkLibrary;
  private viralPhrases: Map<string, number>;
  private emotionalTriggers: Map<string, string>;
  private persuasionPatterns: RegExp[];

  constructor() {
    this.frameworkLibrary = new ComprehensiveFrameworkLibrary();
    this.initializeViralPhrases();
    this.initializeEmotionalTriggers();
    this.initializePersuasionPatterns();
  }

  /**
   * Analyze script content for viral potential with DPS-Powered Idea Mining
   */
  public async analyzeScript(
    scriptId: string,
    transcript: string,
    audioFeatures?: any
  ): Promise<ScriptAnalysis> {
    const startTime = Date.now();

    try {
      // Clean and prepare transcript
      const cleanedTranscript = this.cleanTranscript(transcript);
      
      // Detect frameworks in script
      const detectedFrameworks = await this.detectScriptFrameworks(cleanedTranscript);
      
      // Analyze emotional arc
      const emotionalArc = this.analyzeEmotionalArc(cleanedTranscript);
      
      // Analyze hook effectiveness
      const hookAnalysis = this.analyzeHook(cleanedTranscript);
      
      // Analyze narrative structure
      const narrativeStructure = this.analyzeNarrativeStructure(cleanedTranscript);
      
      // Detect persuasion techniques
      const persuasionTechniques = this.detectPersuasionTechniques(cleanedTranscript);
      
      // Analyze linguistic patterns
      const linguisticPatterns = this.analyzeLinguisticPatterns(cleanedTranscript);

      // 🎯 DPS-POWERED IDEA MINING ANALYSIS
      const ideaLegos = this.analyzeSevenIdeaLegos(cleanedTranscript, audioFeatures);
      const dpsOptimizations = this.generateDPSOptimizations(ideaLegos, detectedFrameworks);
      const remixOpportunities = this.identifyRemixOpportunities(ideaLegos);
      const viralPatternMatches = this.matchViralPatterns(cleanedTranscript, ideaLegos);
      
      // Enhanced viral potential with DPS insights
      const viralPotential = this.calculateEnhancedViralPotential(
        detectedFrameworks,
        emotionalArc,
        hookAnalysis,
        narrativeStructure,
        ideaLegos
      );
      
      // Generate comprehensive improvements including DPS optimizations
      const improvements = this.generateComprehensiveImprovements(
        detectedFrameworks,
        emotionalArc,
        hookAnalysis,
        narrativeStructure,
        dpsOptimizations,
        remixOpportunities
      );
      
      // Calculate overall script score with DPS enhancement
      const scriptScore = this.calculateEnhancedScriptScore(
        viralPotential,
        emotionalArc.arcScore,
        hookAnalysis.strength,
        narrativeStructure.engagement,
        ideaLegos.overallScore
      );

      const processingTime = Date.now() - startTime;

      return {
        scriptId,
        transcript: cleanedTranscript,
        confidence: this.calculateConfidence(cleanedTranscript, detectedFrameworks),
        detectedFrameworks,
        viralPotential,
        emotionalArc,
        hookAnalysis,
        narrativeStructure,
        persuasionTechniques,
        linguisticPatterns,
        improvements,
        scriptScore,
        processingTime,
        // DPS-Powered Idea Mining Results
        ideaLegos,
        dpsOptimizations,
        remixOpportunities,
        viralPatternMatches
      };

    } catch (error) {
      console.error('Script analysis error:', error);
      throw new Error(`Script analysis failed: ${error}`);
    }
  }

  /**
   * Detect viral frameworks in script content
   */
  private async detectScriptFrameworks(transcript: string): Promise<DetectedFramework[]> {
    const frameworks = this.frameworkLibrary.getAllFrameworks();
    const detectedFrameworks: DetectedFramework[] = [];

    for (const framework of frameworks) {
      const confidence = this.calculateFrameworkMatch(transcript, framework);
      
      if (confidence > 0.3) { // 30% threshold
        const matchedPatterns = this.findMatchedPatterns(transcript, framework);
        const scriptSegments = this.extractScriptSegments(transcript, framework);
        
        detectedFrameworks.push({
          frameworkId: framework.id,
          frameworkName: framework.name,
          confidence,
          matchedPatterns,
          category: framework.category,
          tier: framework.tier,
          scriptSegments
        });
      }
    }

    return detectedFrameworks.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze emotional arc throughout the script
   */
  private analyzeEmotionalArc(transcript: string): EmotionalArc {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const emotions: number[] = [];
    const keyMoments: EmotionalMoment[] = [];

    sentences.forEach((sentence, index) => {
      const intensity = this.calculateEmotionalIntensity(sentence);
      const emotion = this.detectPrimaryEmotion(sentence);
      emotions.push(intensity);

      // Track significant emotional moments
      if (intensity > 70) {
        keyMoments.push({
          timestamp: (index / sentences.length) * 100,
          intensity,
          emotion,
          trigger: sentence.trim().substring(0, 50) + '...'
        });
      }
    });

    const peak = Math.max(...emotions);
    const valley = Math.min(...emotions);
    const arcType = this.determineArcType(emotions);
    const arcScore = this.calculateArcScore(emotions, arcType);

    return {
      overall: arcType,
      peak,
      valley,
      arcScore,
      keyMoments
    };
  }

  /**
   * Analyze hook effectiveness
   */
  private analyzeHook(transcript: string): HookAnalysis {
    const firstSentences = transcript.split(/[.!?]+/).slice(0, 3).join('. ');
    const hookPatterns = [
      /^(what if|imagine|here's why|this is|nobody talks about|i went from)/i,
      /\?/g, // Questions
      /(shocking|secret|truth|revealed|exposed)/i,
      /^(stop|wait|listen)/i
    ];

    let strength = 0;
    let hookType = 'standard';
    const frameworks: string[] = [];
    const improvements: string[] = [];

    // Check for hook patterns
    hookPatterns.forEach((pattern, index) => {
      if (pattern.test(firstSentences)) {
        strength += 25;
        hookType = ['pattern', 'question', 'curiosity', 'command'][index] || 'standard';
      }
    });

    // Check for viral phrases in hook
    for (const [phrase, score] of this.viralPhrases) {
      if (firstSentences.toLowerCase().includes(phrase)) {
        strength += score;
      }
    }

    // Framework detection in hook
    const hookFrameworks = this.frameworkLibrary.getAllFrameworks()
      .filter(f => f.category === 'hook-driven')
      .filter(f => this.calculateFrameworkMatch(firstSentences, f) > 0.4);
    
    frameworks.push(...hookFrameworks.map(f => f.name));

    strength = Math.min(strength, 100); // Cap at 100

    // Generate improvements
    if (strength < 60) {
      improvements.push('Consider starting with a question or bold statement');
      improvements.push('Add emotional triggers in first 3 seconds');
      improvements.push('Use pattern interrupt techniques');
    }

    return {
      hookType,
      strength,
      timeToHook: this.calculateTimeToHook(firstSentences),
      retentionProbability: strength * 0.8, // Hook strength correlates with retention
      frameworks,
      improvements
    };
  }

  /**
   * Analyze narrative structure
   */
  private analyzeNarrativeStructure(transcript: string): NarrativeStructure {
    const structures = {
      'problem-solution': /problem|issue|struggle.*solution|answer|fix/gi,
      'before-after': /before|used to|now|after|today/gi,
      'list': /first|second|third|next|finally|\d+\./gi,
      'story': /story|remember|happened|experience/gi,
      'tutorial': /how to|step|tutorial|guide|learn/gi,
      'reaction': /react|response|watching|seeing/gi
    };

    let detectedStructure: keyof typeof structures = 'story';
    let maxMatches = 0;

    // Detect primary structure
    for (const [structure, pattern] of Object.entries(structures)) {
      const matches = (transcript.match(pattern) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedStructure = structure as keyof typeof structures;
      }
    }

    const completeness = this.calculateStructureCompleteness(transcript, detectedStructure);
    const clarity = this.calculateClarity(transcript);
    const engagement = this.calculateEngagement(transcript);

    return {
      structure: detectedStructure,
      completeness,
      clarity,
      engagement
    };
  }

  /**
   * Detect persuasion techniques in script
   */
  private detectPersuasionTechniques(transcript: string): PersuasionTechnique[] {
    const techniques: PersuasionTechnique[] = [];

    const persuasionPatterns = {
      'social-proof': /(everyone|most people|thousands|millions|studies show)/gi,
      'scarcity': /(limited|only|few|running out|deadline)/gi,
      'authority': /(expert|doctor|research|study|proven)/gi,
      'reciprocity': /(free|gift|bonus|value)/gi,
      'commitment': /(promise|guarantee|commit|pledge)/gi,
      'liking': /(you|your|we|us|together)/gi
    };

    for (const [technique, pattern] of Object.entries(persuasionPatterns)) {
      const matches = transcript.match(pattern);
      if (matches && matches.length > 0) {
        const strength = Math.min(matches.length * 10, 100);
        const location = this.findTechniqueLocation(transcript, pattern);
        
        techniques.push({
          technique,
          strength,
          location,
          effectiveness: this.calculateTechniqueEffectiveness(technique, strength, location)
        });
      }
    }

    return techniques.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Analyze linguistic patterns
   */
  private analyzeLinguisticPatterns(transcript: string): LinguisticPattern[] {
    const patterns: LinguisticPattern[] = [];

    const linguisticChecks = {
      'short-sentences': transcript.split(/[.!?]+/).filter(s => s.trim().split(' ').length <= 5).length,
      'questions': (transcript.match(/\?/g) || []).length,
      'exclamations': (transcript.match(/!/g) || []).length,
      'personal-pronouns': (transcript.match(/\b(i|you|we|my|your)\b/gi) || []).length,
      'action-words': (transcript.match(/\b(get|make|create|build|start|stop|go|come)\b/gi) || []).length,
      'emotional-words': (transcript.match(/\b(amazing|incredible|shocked|surprised|love|hate)\b/gi) || []).length
    };

    for (const [pattern, frequency] of Object.entries(linguisticChecks)) {
      if (frequency > 0) {
        const viralCorrelation = this.calculateViralCorrelation(pattern, frequency, transcript.length);
        const examples = this.extractPatternExamples(transcript, pattern);
        
        patterns.push({
          pattern,
          frequency,
          viralCorrelation,
          examples
        });
      }
    }

    return patterns.sort((a, b) => b.viralCorrelation - a.viralCorrelation);
  }

  // Helper methods
  private cleanTranscript(transcript: string): string {
    return transcript
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?'-]/g, '')
      .trim();
  }

  private calculateFrameworkMatch(transcript: string, framework: any): number {
    const keywords = framework.keyIndicators || [];
    const patterns = framework.scriptPatterns || [];
    
    let score = 0;
    const totalWords = transcript.split(' ').length;

    // Check keyword matches
    keywords.forEach((keyword: string) => {
      const matches = (transcript.toLowerCase().match(new RegExp(keyword, 'gi')) || []).length;
      score += (matches / totalWords) * 100;
    });

    // Check pattern matches
    patterns.forEach((pattern: string) => {
      if (new RegExp(pattern, 'i').test(transcript)) {
        score += 20;
      }
    });

    return Math.min(score / 100, 1);
  }

  private calculateViralPotential(
    frameworks: DetectedFramework[],
    emotionalArc: EmotionalArc,
    hookAnalysis: HookAnalysis,
    narrativeStructure: NarrativeStructure
  ): number {
    const frameworkScore = frameworks.reduce((sum, f) => sum + (f.confidence * f.tier * 10), 0) / 100;
    const emotionalScore = emotionalArc.arcScore / 100;
    const hookScore = hookAnalysis.strength / 100;
    const structureScore = narrativeStructure.engagement / 100;

    return Math.min(
      (frameworkScore * 0.4) + 
      (emotionalScore * 0.3) + 
      (hookScore * 0.2) + 
      (structureScore * 0.1),
      1
    );
  }

  private generateImprovements(
    frameworks: DetectedFramework[],
    emotionalArc: EmotionalArc,
    hookAnalysis: HookAnalysis,
    narrativeStructure: NarrativeStructure
  ): string[] {
    const improvements: string[] = [];

    // Framework-based improvements
    if (frameworks.length < 2) {
      improvements.push('Incorporate more viral frameworks for higher success rate');
    }

    // Emotional arc improvements
    if (emotionalArc.arcScore < 60) {
      improvements.push('Strengthen emotional arc with more dynamic moments');
    }

    // Hook improvements
    if (hookAnalysis.strength < 70) {
      improvements.push('Improve hook with stronger opening statement or question');
    }

    // Structure improvements
    if (narrativeStructure.clarity < 70) {
      improvements.push('Clarify narrative structure for better comprehension');
    }

    return improvements;
  }

  private calculateScriptScore(
    viralPotential: number,
    arcScore: number,
    hookStrength: number,
    engagement: number
  ): number {
    return Math.round(
      (viralPotential * 40) +
      (arcScore * 0.25) +
      (hookStrength * 0.25) +
      (engagement * 0.1)
    );
  }

  // Initialize data structures
  private initializeViralPhrases(): void {
    this.viralPhrases = new Map([
      ['nobody talks about', 25],
      ['here\'s why', 20],
      ['what if i told you', 20],
      ['this changed everything', 18],
      ['you won\'t believe', 18],
      ['secret', 15],
      ['shocking truth', 15],
      ['exposed', 12],
      ['revealed', 12],
      ['mind-blowing', 10]
    ]);
  }

  private initializeEmotionalTriggers(): void {
    this.emotionalTriggers = new Map([
      ['amazing', 'joy'],
      ['shocking', 'surprise'],
      ['terrible', 'fear'],
      ['incredible', 'excitement'],
      ['outrageous', 'anger'],
      ['fascinating', 'curiosity']
    ]);
  }

  private initializePersuasionPatterns(): void {
    this.persuasionPatterns = [
      /\b(you|your)\b/gi,
      /\b(free|bonus|gift)\b/gi,
      /\b(proven|guaranteed|works)\b/gi,
      /\b(limited|exclusive|special)\b/gi
    ];
  }

  // Additional helper methods (simplified implementations)
  private findMatchedPatterns(transcript: string, framework: any): string[] {
    return framework.keyIndicators?.filter((indicator: string) => 
      transcript.toLowerCase().includes(indicator.toLowerCase())
    ) || [];
  }

  private extractScriptSegments(transcript: string, framework: any): ScriptSegment[] {
    // Simplified implementation - would be more sophisticated in production
    return [{
      startTime: 0,
      endTime: 30,
      text: transcript.substring(0, 100),
      purpose: 'hook',
      emotionalIntensity: 75
    }];
  }

  private calculateEmotionalIntensity(sentence: string): number {
    let intensity = 30; // baseline
    
    // Check for emotional triggers
    for (const [word, emotion] of this.emotionalTriggers) {
      if (sentence.toLowerCase().includes(word)) {
        intensity += 20;
      }
    }
    
    // Check for punctuation
    if (sentence.includes('!')) intensity += 15;
    if (sentence.includes('?')) intensity += 10;
    
    return Math.min(intensity, 100);
  }

  private detectPrimaryEmotion(sentence: string): 'excitement' | 'curiosity' | 'fear' | 'joy' | 'anger' | 'surprise' {
    for (const [word, emotion] of this.emotionalTriggers) {
      if (sentence.toLowerCase().includes(word)) {
        return emotion as any;
      }
    }
    return 'curiosity'; // default
  }

  private determineArcType(emotions: number[]): 'rising' | 'falling' | 'plateau' | 'roller-coaster' | 'explosive' {
    if (emotions.length < 3) return 'plateau';
    
    const first = emotions[0];
    const last = emotions[emotions.length - 1];
    const variance = this.calculateVariance(emotions);
    
    if (variance > 400) return 'roller-coaster';
    if (last > first + 20) return 'rising';
    if (first > last + 20) return 'falling';
    if (Math.max(...emotions) > 80) return 'explosive';
    
    return 'plateau';
  }

  private calculateArcScore(emotions: number[], arcType: string): number {
    const variance = this.calculateVariance(emotions);
    const peak = Math.max(...emotions);
    
    const typeMultipliers = {
      'rising': 1.2,
      'explosive': 1.1,
      'roller-coaster': 1.0,
      'falling': 0.8,
      'plateau': 0.7
    };
    
    const baseScore = (peak + variance / 10) / 2;
    return Math.min(baseScore * (typeMultipliers[arcType as keyof typeof typeMultipliers] || 1), 100);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private calculateTimeToHook(hookText: string): number {
    // Estimate reading time: ~150 words per minute
    const words = hookText.split(' ').length;
    return (words / 150) * 60; // seconds
  }

  private calculateStructureCompleteness(transcript: string, structure: string): number {
    // Simplified scoring based on structure
    const structureScores = {
      'problem-solution': this.hasPattern(transcript, /(problem|issue).*solution/gi) ? 80 : 40,
      'before-after': this.hasPattern(transcript, /before.*after/gi) ? 85 : 45,
      'list': (transcript.match(/\d+\.|first|second|third/gi) || []).length * 20,
      'story': this.hasPattern(transcript, /(beginning|middle|end)|story/gi) ? 75 : 50,
      'tutorial': this.hasPattern(transcript, /step|how.*to/gi) ? 70 : 35,
      'reaction': this.hasPattern(transcript, /react|watch|see/gi) ? 65 : 40
    };
    
    return Math.min(structureScores[structure as keyof typeof structureScores] || 50, 100);
  }

  private calculateClarity(transcript: string): number {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = transcript.split(' ').length / sentences.length;
    
    // Ideal: 10-20 words per sentence
    let clarityScore = 100;
    if (avgWordsPerSentence > 25) clarityScore -= 30;
    if (avgWordsPerSentence < 5) clarityScore -= 20;
    
    return Math.max(clarityScore, 0);
  }

  private calculateEngagement(transcript: string): number {
    let engagement = 50; // baseline
    
    // Questions increase engagement
    engagement += (transcript.match(/\?/g) || []).length * 5;
    
    // Personal pronouns increase engagement
    engagement += (transcript.match(/\b(you|your|we|us)\b/gi) || []).length * 2;
    
    // Action words increase engagement
    engagement += (transcript.match(/\b(get|make|start|go|do|try)\b/gi) || []).length * 1;
    
    return Math.min(engagement, 100);
  }

  private findTechniqueLocation(transcript: string, pattern: RegExp): string {
    const match = transcript.match(pattern);
    if (!match) return 'not found';
    
    const index = transcript.indexOf(match[0]);
    const totalLength = transcript.length;
    
    if (index < totalLength * 0.33) return 'beginning';
    if (index < totalLength * 0.66) return 'middle';
    return 'end';
  }

  private calculateTechniqueEffectiveness(technique: string, strength: number, location: string): number {
    const locationMultipliers = {
      'beginning': 1.2,
      'middle': 1.0,
      'end': 0.8
    };
    
    const techniqueMultipliers = {
      'social-proof': 1.1,
      'authority': 1.2,
      'scarcity': 1.0,
      'reciprocity': 0.9,
      'commitment': 1.1,
      'liking': 0.8
    };
    
    return strength * 
           (locationMultipliers[location as keyof typeof locationMultipliers] || 1) * 
           (techniqueMultipliers[technique as keyof typeof techniqueMultipliers] || 1);
  }

  private calculateViralCorrelation(pattern: string, frequency: number, transcriptLength: number): number {
    const density = frequency / (transcriptLength / 100); // per 100 characters
    
    const correlations = {
      'short-sentences': density * 8,
      'questions': density * 12,
      'exclamations': density * 10,
      'personal-pronouns': density * 6,
      'action-words': density * 7,
      'emotional-words': density * 15
    };
    
    return Math.min(correlations[pattern as keyof typeof correlations] || 0, 100);
  }

  private extractPatternExamples(transcript: string, pattern: string): string[] {
    // Simplified - would extract actual examples in production
    return [`Example of ${pattern} usage`];
  }

  private hasPattern(text: string, pattern: RegExp): boolean {
    return pattern.test(text);
  }

  private calculateConfidence(transcript: string, frameworks: DetectedFramework[]): number {
    const textLength = transcript.split(' ').length;
    const frameworkCount = frameworks.length;
    
    let confidence = 50; // baseline
    
    // More text generally means higher confidence
    if (textLength > 50) confidence += 20;
    if (textLength > 100) confidence += 10;
    
    // More detected frameworks increase confidence
    confidence += frameworkCount * 5;
    
    // High-confidence frameworks boost overall confidence
    const highConfidenceFrameworks = frameworks.filter(f => f.confidence > 0.7);
    confidence += highConfidenceFrameworks.length * 10;
    
    return Math.min(confidence, 100);
  }

  // ===== DPS-POWERED IDEA MINING METHODS =====

  /**
   * Analyze the 7 Idea Legos framework for systematic viral optimization
   */
  private analyzeSevenIdeaLegos(transcript: string, audioFeatures?: any): SevenIdeaLegos {
    const topic = this.analyzeTopic(transcript);
    const angle = this.analyzeAngle(transcript);
    const hookStructure = this.analyzeHookStructure(transcript);
    const storyStructure = this.analyzeStoryStructure(transcript);
    const visualFormat = this.analyzeVisualFormat(transcript);
    const keyVisuals = this.analyzeKeyVisuals(transcript);
    const audio = this.analyzeAudio(transcript, audioFeatures);

    const legoScores = [
      { legoName: 'Topic', score: topic.score, strength: this.getLegoStrength(topic.score), holdOrRemix: this.getHoldOrRemix(topic.score), optimizationPotential: 100 - topic.score },
      { legoName: 'Angle', score: angle.score, strength: this.getLegoStrength(angle.score), holdOrRemix: this.getHoldOrRemix(angle.score), optimizationPotential: 100 - angle.score },
      { legoName: 'Hook Structure', score: hookStructure.score, strength: this.getLegoStrength(hookStructure.score), holdOrRemix: this.getHoldOrRemix(hookStructure.score), optimizationPotential: 100 - hookStructure.score },
      { legoName: 'Story Structure', score: storyStructure.score, strength: this.getLegoStrength(storyStructure.score), holdOrRemix: this.getHoldOrRemix(storyStructure.score), optimizationPotential: 100 - storyStructure.score },
      { legoName: 'Visual Format', score: visualFormat.score, strength: this.getLegoStrength(visualFormat.score), holdOrRemix: this.getHoldOrRemix(visualFormat.score), optimizationPotential: 100 - visualFormat.score },
      { legoName: 'Key Visuals', score: keyVisuals.score, strength: this.getLegoStrength(keyVisuals.score), holdOrRemix: this.getHoldOrRemix(keyVisuals.score), optimizationPotential: 100 - keyVisuals.score },
      { legoName: 'Audio', score: audio.score, strength: this.getLegoStrength(audio.score), holdOrRemix: this.getHoldOrRemix(audio.score), optimizationPotential: 100 - audio.score }
    ];

    const overallScore = legoScores.reduce((sum, lego) => sum + lego.score, 0) / legoScores.length;

    return {
      topic,
      angle,
      hookStructure,
      storyStructure,
      visualFormat,
      keyVisuals,
      audio,
      legoScores,
      overallScore
    };
  }

  /**
   * Generate DPS optimizations for viral enhancement
   */
  private generateDPSOptimizations(ideaLegos: SevenIdeaLegos, frameworks: DetectedFramework[]): DPSOptimization[] {
    const optimizations: DPSOptimization[] = [];

    // Identify weak legos that need remixing
    const weakLegos = ideaLegos.legoScores.filter(lego => lego.holdOrRemix === 'remix');

    for (const lego of weakLegos) {
      const optimization: DPSOptimization = {
        component: lego.legoName,
        currentScore: lego.score,
        targetScore: Math.min(lego.score + (lego.optimizationPotential * 0.6), 95),
        improvementStrategy: this.getImprovementStrategy(lego.legoName, lego.score),
        expectedLift: this.calculateExpectedLift(lego.optimizationPotential),
        confidence: this.calculateOptimizationConfidence(lego.score, frameworks)
      };
      optimizations.push(optimization);
    }

    return optimizations;
  }

  /**
   * Identify remix opportunities using "Hold Winners, Remix Losers" strategy
   */
  private identifyRemixOpportunities(ideaLegos: SevenIdeaLegos): RemixOpportunity[] {
    const opportunities: RemixOpportunity[] = [];
    const remixTargets = ideaLegos.legoScores.filter(lego => lego.holdOrRemix === 'remix');

    for (const target of remixTargets) {
      const opportunity: RemixOpportunity = {
        originalPattern: this.describeCurrentPattern(target.legoName, target.score),
        remixSuggestion: this.generateRemixSuggestion(target.legoName),
        expectedDPSImprovement: target.optimizationPotential * 0.4,
        riskLevel: this.assessRemixRisk(target.legoName, target.score),
        implementationDifficulty: this.assessImplementationDifficulty(target.legoName)
      };
      opportunities.push(opportunity);
    }

    return opportunities;
  }

  /**
   * Enhanced viral potential calculation with DPS insights
   */
  private calculateEnhancedViralPotential(
    frameworks: DetectedFramework[],
    emotionalArc: EmotionalArc,
    hookAnalysis: HookAnalysis,
    narrativeStructure: NarrativeStructure,
    ideaLegos: SevenIdeaLegos
  ): number {
    // Original viral potential
    const originalPotential = this.calculateViralPotential(frameworks, emotionalArc, hookAnalysis, narrativeStructure);
    
    // DPS enhancement based on Idea Legos strength
    const dpsMultiplier = 1 + (ideaLegos.overallScore / 100) * 0.3; // Up to 30% boost
    
    // Apply systematic remix bonus for well-optimized content
    const remixBonus = ideaLegos.legoScores.filter(lego => lego.holdOrRemix === 'hold').length >= 5 ? 1.15 : 1.0;
    
    return Math.min(originalPotential * dpsMultiplier * remixBonus, 1.0);
  }

  /**
   * Enhanced script score calculation with DPS integration
   */
  private calculateEnhancedScriptScore(
    viralPotential: number,
    emotionalArcScore: number,
    hookStrength: number,
    narrativeEngagement: number,
    ideaLegosScore: number
  ): number {
    // Original weighted combination
    const originalScore = this.calculateScriptScore(viralPotential, emotionalArcScore, hookStrength, narrativeEngagement);
    
    // DPS enhancement (25% weight on Idea Legos analysis)
    const dpsEnhancement = ideaLegosScore * 0.25;
    
    // Final enhanced score
    const enhancedScore = (originalScore * 0.75) + dpsEnhancement;
    
    return Math.min(Math.max(enhancedScore, 0), 100);
  }

  /**
   * Generate comprehensive improvements including DPS optimizations
   */
  private generateComprehensiveImprovements(
    detectedFrameworks: DetectedFramework[],
    emotionalArc: EmotionalArc,
    hookAnalysis: HookAnalysis,
    narrativeStructure: NarrativeStructure,
    dpsOptimizations: DPSOptimization[],
    remixOpportunities: RemixOpportunity[]
  ): string[] {
    const improvements = this.generateImprovements(detectedFrameworks, emotionalArc, hookAnalysis, narrativeStructure);
    
    // Add DPS-specific improvements
    const dpsImprovements = dpsOptimizations.map(opt => 
      `${opt.component}: ${opt.improvementStrategy} (Expected lift: +${opt.expectedLift.toFixed(1)}%)`
    );
    
    const remixImprovements = remixOpportunities
      .filter(opp => opp.riskLevel === 'low' || opp.riskLevel === 'medium')
      .map(opp => `Remix: ${opp.remixSuggestion} (${opp.expectedDPSImprovement.toFixed(1)}% DPS improvement)`);
    
    return [...improvements, ...dpsImprovements, ...remixImprovements];
  }

  /**
   * Match viral patterns using DPS methodology
   */
  private matchViralPatterns(transcript: string, ideaLegos: SevenIdeaLegos): ViralPatternMatch[] {
    // Placeholder for viral pattern matching - would integrate with your existing viral frameworks
    return [
      {
        pattern: 'DPS Top 5% Pattern',
        confidence: ideaLegos.overallScore / 100,
        category: 'systematic_optimization',
        strength: ideaLegos.overallScore >= 80 ? 'strong' : ideaLegos.overallScore >= 60 ? 'moderate' : 'weak'
      }
    ];
  }

  // Helper methods for DPS analysis
  private getLegoStrength(score: number): 'weak' | 'moderate' | 'strong' | 'viral' {
    if (score >= 85) return 'viral';
    if (score >= 70) return 'strong';
    if (score >= 50) return 'moderate';
    return 'weak';
  }

  private getHoldOrRemix(score: number): 'hold' | 'remix' {
    return score >= 70 ? 'hold' : 'remix';
  }

  private getImprovementStrategy(legoName: string, score: number): string {
    const strategies = {
      'Topic': score < 40 ? 'Broaden appeal with universal themes' : 'Add trending elements',
      'Angle': score < 40 ? 'Find unique perspective or controversy' : 'Strengthen unique selling proposition',
      'Hook Structure': score < 40 ? 'Start with pattern interrupt' : 'Optimize first 3 seconds',
      'Story Structure': score < 40 ? 'Add clear beginning-middle-end' : 'Increase tension and payoff',
      'Visual Format': score < 40 ? 'Switch to proven viral format' : 'Enhance visual appeal',
      'Key Visuals': score < 40 ? 'Add engaging B-roll or graphics' : 'Optimize visual pacing',
      'Audio': score < 40 ? 'Use trending sound or music' : 'Sync audio to visual beats'
    };
    return strategies[legoName] || 'General optimization needed';
  }

  private calculateExpectedLift(optimizationPotential: number): number {
    return optimizationPotential * 0.3; // Conservative 30% of potential realized
  }

  private calculateOptimizationConfidence(score: number, frameworks: DetectedFramework[]): number {
    const baseConfidence = Math.min(frameworks.length / 5, 1.0); // More frameworks = higher confidence
    const scoreConfidence = score / 100; // Current score reliability
    return (baseConfidence + scoreConfidence) / 2;
  }

  // Placeholder methods for Lego analysis - to be implemented with specific logic
  private analyzeTopic(transcript: string): any {
    return { score: 75, description: 'Topic analysis placeholder' };
  }

  private analyzeAngle(transcript: string): any {
    return { score: 68, description: 'Angle analysis placeholder' };
  }

  private analyzeHookStructure(transcript: string): any {
    return { score: 82, description: 'Hook structure analysis placeholder' };
  }

  private analyzeStoryStructure(transcript: string): any {
    return { score: 71, description: 'Story structure analysis placeholder' };
  }

  private analyzeVisualFormat(transcript: string): any {
    return { score: 65, description: 'Visual format analysis placeholder' };
  }

  private analyzeKeyVisuals(transcript: string): any {
    return { score: 73, description: 'Key visuals analysis placeholder' };
  }

  private analyzeAudio(transcript: string, audioFeatures?: any): any {
    return { score: 69, description: 'Audio analysis placeholder' };
  }

  private describeCurrentPattern(legoName: string, score: number): string {
    return `Current ${legoName} pattern with ${score}% effectiveness`;
  }

  private generateRemixSuggestion(legoName: string): string {
    const suggestions = {
      'Topic': 'Remix with broader appeal or trending topic',
      'Angle': 'Try contrarian perspective or personal story angle',
      'Hook Structure': 'Use "Wait for it..." or "This is why..." hook',
      'Story Structure': 'Switch to list format or problem-solution',
      'Visual Format': 'Try split-screen or before/after format',
      'Key Visuals': 'Add trending visuals or meme formats',
      'Audio': 'Use viral sound trending in your niche'
    };
    return suggestions[legoName] || 'General remix suggestion';
  }

  private assessRemixRisk(legoName: string, score: number): 'low' | 'medium' | 'high' {
    if (score < 30) return 'low'; // Low risk to change very weak elements
    if (score < 60) return 'medium';
    return 'high'; // High risk to change working elements
  }

  private assessImplementationDifficulty(legoName: string): 'easy' | 'moderate' | 'complex' {
    const difficulties = {
      'Topic': 'easy',
      'Angle': 'easy',
      'Hook Structure': 'moderate',
      'Story Structure': 'moderate',
      'Visual Format': 'complex',
      'Key Visuals': 'complex',
      'Audio': 'easy'
    };
    return difficulties[legoName] as 'easy' | 'moderate' | 'complex' || 'moderate';
  }
}
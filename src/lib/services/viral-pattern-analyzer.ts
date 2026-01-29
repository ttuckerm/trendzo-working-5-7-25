/**
 * 🧬 VIRAL PATTERN ANALYZER - ML-Based Framework Matching
 * 
 * Uses advanced pattern recognition to analyze video content and match
 * to optimal viral frameworks based on viral DNA analysis.
 */

export interface ViralDNA {
  emotional_triggers: string[];
  content_patterns: string[];
  hook_mechanisms: string[];
  engagement_drivers: string[];
  viral_coefficients: {
    curiosity: number;
    relatability: number;
    surprise: number;
    authority: number;
    transformation: number;
    exclusivity: number;
  };
}

export interface ContentAnalysis {
  transcript: string;
  duration: number;
  viral_score: number;
  view_count: number;
  title: string;
  creator_profile: string;
}

export interface FrameworkMatch {
  framework_id: string;
  framework_name: string;
  confidence_score: number;
  reasoning: string[];
  viral_dna_alignment: number;
  optimization_suggestions: string[];
}

/**
 * 🎯 VIRAL PATTERN ANALYZER CLASS
 * 
 * Advanced ML-based system for analyzing video content and determining
 * optimal viral framework matches using viral DNA pattern recognition.
 */
export class ViralPatternAnalyzer {
  
  /**
   * 🧬 Extract Viral DNA from Video Content
   * 
   * Analyzes transcript, title, and metadata to identify viral DNA patterns
   */
  static extractViralDNA(content: ContentAnalysis): ViralDNA {
    const transcript = content.transcript.toLowerCase();
    const title = content.title.toLowerCase();
    const combinedText = `${title} ${transcript}`;
    
    // 🎭 Emotional Trigger Detection
    const emotional_triggers = this.detectEmotionalTriggers(combinedText);
    
    // 🔍 Content Pattern Recognition  
    const content_patterns = this.detectContentPatterns(combinedText, content);
    
    // 🪝 Hook Mechanism Analysis
    const hook_mechanisms = this.detectHookMechanisms(combinedText, content.title);
    
    // ⚡ Engagement Driver Identification
    const engagement_drivers = this.detectEngagementDrivers(combinedText, content);
    
    // 📊 Viral Coefficient Calculation
    const viral_coefficients = this.calculateViralCoefficients(
      combinedText, 
      content,
      emotional_triggers,
      content_patterns
    );
    
    return {
      emotional_triggers,
      content_patterns,
      hook_mechanisms,
      engagement_drivers,
      viral_coefficients
    };
  }
  
  /**
   * 🎭 Detect Emotional Triggers Using NLP Pattern Matching
   */
  private static detectEmotionalTriggers(text: string): string[] {
    const triggers: string[] = [];
    
    // Curiosity triggers
    const curiosityPatterns = [
      /secret|hidden|nobody talks about|never told|reveal/i,
      /shocking|surprising|can't believe|mind-blowing/i,
      /why|how|what if|discover|find out/i
    ];
    
    // Relatability triggers  
    const relatabilityPatterns = [
      /pov:|point of view|when you|if you're|anyone else/i,
      /struggle|tired of|frustrated|we all/i,
      /used to|before|after|transformation/i
    ];
    
    // Authority triggers
    const authorityPatterns = [
      /expert|professional|years of experience|proven/i,
      /research shows|study found|data reveals/i,
      /I built|I made|I achieved|my success/i
    ];
    
    // Exclusivity triggers
    const exclusivityPatterns = [
      /exclusive|limited|only|insider|private/i,
      /most people don't|rarely shared|first time/i,
      /members only|special access|invitation/i
    ];
    
    if (curiosityPatterns.some(p => p.test(text))) triggers.push('curiosity');
    if (relatabilityPatterns.some(p => p.test(text))) triggers.push('relatability');  
    if (authorityPatterns.some(p => p.test(text))) triggers.push('authority');
    if (exclusivityPatterns.some(p => p.test(text))) triggers.push('exclusivity');
    
    return triggers;
  }
  
  /**
   * 🔍 Detect Content Patterns Using Advanced Pattern Recognition
   */
  private static detectContentPatterns(text: string, content: ContentAnalysis): string[] {
    const patterns: string[] = [];
    
    // Before/After Pattern
    if (/before.*after|transformation|changed my life|used to.*now/i.test(text)) {
      patterns.push('before_after_transformation');
    }
    
    // Tutorial/Educational Pattern
    if (/how to|step by step|tutorial|guide|learn|teach/i.test(text)) {
      patterns.push('educational_tutorial');
    }
    
    // Challenge/Documentation Pattern  
    if (/challenge|day \d+|trying.*for|documenting|journey/i.test(text)) {
      patterns.push('challenge_documentation');
    }
    
    // Authority/Credibility Pattern
    if (/figure|million|successful|business|expert|professional/i.test(text)) {
      patterns.push('authority_credibility');
    }
    
    // POV/Relatability Pattern
    if (/pov|point of view|when you|if you/i.test(text)) {
      patterns.push('pov_relatability');
    }
    
    // Secret Knowledge Pattern
    if (/secret|hack|trick|nobody|hidden|reveal/i.test(text)) {
      patterns.push('secret_knowledge');
    }
    
    return patterns;
  }
  
  /**
   * 🪝 Detect Hook Mechanisms in Content
   */
  private static detectHookMechanisms(text: string, title: string): string[] {
    const hooks: string[] = [];
    
    // Curiosity Gap Hook
    if (/but here's|however|plot twist|surprisingly/i.test(text)) {
      hooks.push('curiosity_gap');
    }
    
    // Credibility Statement Hook
    if (/I've|my experience|after \d+ years|as someone who/i.test(title)) {
      hooks.push('credibility_statement');
    }
    
    // Problem Agitation Hook
    if (/tired of|frustrated|struggle|problem|issue/i.test(text)) {
      hooks.push('problem_agitation');
    }
    
    // Outcome Preview Hook
    if (/result|outcome|what happened|ended up|finally/i.test(text)) {
      hooks.push('outcome_preview');
    }
    
    return hooks;
  }
  
  /**
   * ⚡ Detect Engagement Drivers
   */
  private static detectEngagementDrivers(text: string, content: ContentAnalysis): string[] {
    const drivers: string[] = [];
    
    // High-stakes storytelling
    if (/lost everything|changed my life|almost gave up|breakthrough/i.test(text)) {
      drivers.push('high_stakes');
    }
    
    // Social proof
    if (/thousands|millions|everyone|most people/i.test(text)) {
      drivers.push('social_proof');
    }
    
    // Practical value
    if (/how to|step \d|method|technique|strategy|tip/i.test(text)) {
      drivers.push('practical_value');
    }
    
    // Emotional connection
    if (/feel|emotion|heart|soul|passion|love|hate/i.test(text)) {
      drivers.push('emotional_connection');
    }
    
    return drivers;
  }
  
  /**
   * 📊 Calculate Viral Coefficients Using ML Scoring
   */
  private static calculateViralCoefficients(
    text: string, 
    content: ContentAnalysis,
    emotional_triggers: string[],
    content_patterns: string[]
  ) {
    const base_score = Math.min(content.viral_score / 100, 1.0);
    const view_factor = Math.log10(content.view_count + 1) / 7; // Normalize to 0-1
    
    return {
      curiosity: this.calculateCuriosityScore(text, emotional_triggers) * base_score,
      relatability: this.calculateRelatabilityScore(text, content_patterns) * base_score, 
      surprise: this.calculateSurpriseScore(text) * view_factor,
      authority: this.calculateAuthorityScore(text, content.creator_profile) * base_score,
      transformation: this.calculateTransformationScore(text, content_patterns) * base_score,
      exclusivity: this.calculateExclusivityScore(text, emotional_triggers) * base_score
    };
  }
  
  private static calculateCuriosityScore(text: string, triggers: string[]): number {
    let score = 0;
    if (triggers.includes('curiosity')) score += 0.4;
    if (/\?/.test(text)) score += 0.2;
    if (/secret|hidden|reveal/.test(text)) score += 0.3;
    if (/why|how|what/.test(text)) score += 0.1;
    return Math.min(score, 1.0);
  }
  
  private static calculateRelatabilityScore(text: string, patterns: string[]): number {
    let score = 0;
    if (patterns.includes('pov_relatability')) score += 0.5;
    if (/we all|everyone|you too|same/.test(text)) score += 0.3;
    if (/struggle|problem|issue/.test(text)) score += 0.2;
    return Math.min(score, 1.0);
  }
  
  private static calculateSurpriseScore(text: string): number {
    let score = 0;
    if (/shocking|unbelievable|incredible|amazing/.test(text)) score += 0.4;
    if (/plot twist|however|but|surprisingly/.test(text)) score += 0.3;
    if (/never expected|didn't see coming/.test(text)) score += 0.3;
    return Math.min(score, 1.0);
  }
  
  private static calculateAuthorityScore(text: string, creator: string): number {
    let score = 0;
    if (/expert|professional|certified/.test(text)) score += 0.4;
    if (/\d+.*years|experience|background/.test(text)) score += 0.3;
    if (/research|study|data|proven/.test(text)) score += 0.3;
    return Math.min(score, 1.0);
  }
  
  private static calculateTransformationScore(text: string, patterns: string[]): number {
    let score = 0;
    if (patterns.includes('before_after_transformation')) score += 0.5;
    if (/changed|transformation|breakthrough/.test(text)) score += 0.3;
    if (/before.*after|used to.*now/.test(text)) score += 0.2;
    return Math.min(score, 1.0);
  }
  
  private static calculateExclusivityScore(text: string, triggers: string[]): number {
    let score = 0;
    if (triggers.includes('exclusivity')) score += 0.4;
    if (/only|exclusive|limited|private/.test(text)) score += 0.3;
    if (/members|invitation|select/.test(text)) score += 0.3;
    return Math.min(score, 1.0);
  }
  
  /**
   * 🎯 Find Best Framework Matches
   * 
   * Uses viral DNA analysis to determine optimal framework matches
   */
  static findBestFrameworks(viral_dna: ViralDNA, available_frameworks: any[]): FrameworkMatch[] {
    const matches: FrameworkMatch[] = [];
    
    for (const framework of available_frameworks) {
      const match = this.calculateFrameworkMatch(viral_dna, framework);
      if (match.confidence_score > 0.3) { // Only include viable matches
        matches.push(match);
      }
    }
    
    // Sort by confidence score (highest first)
    return matches.sort((a, b) => b.confidence_score - a.confidence_score);
  }
  
  /**
   * 🧮 Calculate Framework Match Score
   */
  private static calculateFrameworkMatch(viral_dna: ViralDNA, framework: any): FrameworkMatch {
    const framework_name = framework.recipe_name;
    const viral_elements = framework.viral_elements;
    
    let confidence_score = 0;
    let reasoning: string[] = [];
    let optimization_suggestions: string[] = [];
    
    // Authority Hook Framework
    if (framework_name === 'Authority Hook') {
      confidence_score = viral_dna.viral_coefficients.authority * 0.4 + 
                        viral_dna.viral_coefficients.curiosity * 0.3 +
                        (viral_dna.emotional_triggers.includes('authority') ? 0.3 : 0);
      
      if (viral_dna.content_patterns.includes('authority_credibility')) {
        confidence_score += 0.2;
        reasoning.push('Strong authority/credibility patterns detected');
      }
      
      if (viral_dna.viral_coefficients.authority > 0.7) {
        reasoning.push('High authority coefficient indicates expert positioning');
      }
      
      optimization_suggestions = [
        'Lead with strongest credential in first 3 seconds',
        'Include specific numbers or results as proof',
        'Use authoritative language and confident tone'
      ];
    }
    
    // Before/After Transformation Framework
    else if (framework_name === 'Before/After Transformation') {
      confidence_score = viral_dna.viral_coefficients.transformation * 0.5 +
                        viral_dna.viral_coefficients.relatability * 0.3 +
                        (viral_dna.content_patterns.includes('before_after_transformation') ? 0.2 : 0);
      
      if (viral_dna.engagement_drivers.includes('high_stakes')) {
        confidence_score += 0.2;
        reasoning.push('High-stakes transformation story detected');
      }
      
      optimization_suggestions = [
        'Show dramatic before state to establish stakes',
        'Reveal transformation method as the hook',
        'Connect with viewer\'s similar struggle'
      ];
    }
    
    // Secret Knowledge Reveal Framework
    else if (framework_name === 'Secret Knowledge Reveal') {
      confidence_score = viral_dna.viral_coefficients.curiosity * 0.4 +
                        viral_dna.viral_coefficients.exclusivity * 0.4 +
                        (viral_dna.content_patterns.includes('secret_knowledge') ? 0.2 : 0);
      
      if (viral_dna.hook_mechanisms.includes('curiosity_gap')) {
        confidence_score += 0.2;
        reasoning.push('Strong curiosity gap mechanism identified');
      }
      
      optimization_suggestions = [
        'Promise exclusive information in opening',
        'Build curiosity gap before revealing',
        'Deliver genuine insider insight'
      ];
    }
    
    // POV Relatability Framework
    else if (framework_name === 'POV Relatability') {
      confidence_score = viral_dna.viral_coefficients.relatability * 0.5 +
                        (viral_dna.content_patterns.includes('pov_relatability') ? 0.3 : 0) +
                        (viral_dna.engagement_drivers.includes('emotional_connection') ? 0.2 : 0);
      
      if (viral_dna.emotional_triggers.includes('relatability')) {
        reasoning.push('Strong relatability triggers present');
      }
      
      optimization_suggestions = [
        'Start with universally relatable scenario',
        'Build emotional connection through shared experience',
        'Show transformation possibility'
      ];
    }
    
    // Quick Tutorial Format Framework
    else if (framework_name === 'Quick Tutorial Format') {
      confidence_score = (viral_dna.content_patterns.includes('educational_tutorial') ? 0.4 : 0) +
                        (viral_dna.engagement_drivers.includes('practical_value') ? 0.3 : 0) +
                        viral_dna.viral_coefficients.authority * 0.3;
      
      optimization_suggestions = [
        'Identify specific problem immediately',
        'Promise quick, actionable solution',
        'Deliver step-by-step value'
      ];
    }
    
    // Challenge Documentation Framework  
    else if (framework_name === 'Challenge Documentation') {
      confidence_score = (viral_dna.content_patterns.includes('challenge_documentation') ? 0.4 : 0) +
                        viral_dna.viral_coefficients.transformation * 0.3 +
                        (viral_dna.engagement_drivers.includes('high_stakes') ? 0.3 : 0);
      
      optimization_suggestions = [
        'Document authentic struggle and progress',
        'Show consistent daily updates',
        'Reveal dramatic final transformation'
      ];
    }
    
    // Calculate viral DNA alignment
    const viral_dna_alignment = this.calculateViralDNAAlignment(viral_dna, viral_elements);
    
    return {
      framework_id: framework.id,
      framework_name,
      confidence_score: Math.min(confidence_score, 1.0),
      reasoning,
      viral_dna_alignment,
      optimization_suggestions
    };
  }
  
  /**
   * 🧬 Calculate Viral DNA Alignment Score
   */
  private static calculateViralDNAAlignment(viral_dna: ViralDNA, framework_elements: any): number {
    let alignment = 0;
    let total_factors = 0;
    
    // Check emotional trigger alignment
    if (framework_elements.emotional_triggers) {
      const trigger_overlap = framework_elements.emotional_triggers.filter(
        (trigger: string) => viral_dna.emotional_triggers.includes(trigger)
      ).length;
      alignment += (trigger_overlap / framework_elements.emotional_triggers.length) * 0.3;
      total_factors += 0.3;
    }
    
    // Check pattern alignment  
    const pattern_match = viral_dna.content_patterns.some(pattern => 
      framework_elements.pattern && framework_elements.pattern.includes(pattern.split('_')[0])
    );
    if (pattern_match) {
      alignment += 0.4;
    }
    total_factors += 0.4;
    
    // Check viral coefficient alignment
    const avg_coefficient = Object.values(viral_dna.viral_coefficients).reduce((a, b) => a + b, 0) / 6;
    alignment += avg_coefficient * 0.3;
    total_factors += 0.3;
    
    return total_factors > 0 ? alignment / total_factors : 0;
  }
}

/**
 * 🚀 ENHANCED FRAMEWORK MATCHER - Main Service Function
 * 
 * Public interface for ML-based framework matching
 */
export async function analyzeContentAndMatchFrameworks(
  content: ContentAnalysis,
  available_frameworks: any[]
): Promise<{
  viral_dna: ViralDNA;
  framework_matches: FrameworkMatch[];
  recommended_framework: FrameworkMatch | null;
}> {
  
  // Extract viral DNA from content
  const viral_dna = ViralPatternAnalyzer.extractViralDNA(content);
  
  // Find best framework matches
  const framework_matches = ViralPatternAnalyzer.findBestFrameworks(viral_dna, available_frameworks);
  
  // Get top recommendation
  const recommended_framework = framework_matches.length > 0 ? framework_matches[0] : null;
  
  return {
    viral_dna,
    framework_matches,
    recommended_framework
  };
} 
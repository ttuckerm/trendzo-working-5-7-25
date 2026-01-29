/**
 * ML-DEPLOYMENT-SPECIALIST: Framework Caching System
 * 
 * Caches framework_genes.json in memory to eliminate file I/O bottleneck
 * Target: Reduce framework analysis from 500ms+ to <50ms
 */
import * as fs from 'fs';
import * as path from 'path';

interface FrameworkGene {
  id: number;
  name: string;
  description: string;
  detection_method: string;
  success_rate: number;
  applicability: string[];
  examples: string[];
  pattern_type?: string;
  trigger_words?: string[];
  emotional_impact?: number;
  viral_score_multiplier?: number;
}

class FrameworkCache {
  private frameworks: FrameworkGene[] | null = null;
  private lastLoaded: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private loading: Promise<FrameworkGene[]> | null = null;

  /**
   * Get frameworks from cache or load if necessary
   */
  async getFrameworks(): Promise<FrameworkGene[]> {
    const now = Date.now();
    
    // Return cached if valid
    if (this.frameworks && (now - this.lastLoaded) < this.CACHE_TTL) {
      return this.frameworks;
    }
    
    // If already loading, wait for existing load
    if (this.loading) {
      return await this.loading;
    }
    
    // Start loading
    this.loading = this.loadFrameworksFromFile();
    this.frameworks = await this.loading;
    this.lastLoaded = now;
    this.loading = null;
    
    // Safety check: ensure frameworks is always an array
    if (!this.frameworks || !Array.isArray(this.frameworks)) {
      console.warn('⚠️ Framework loading failed, using default frameworks');
      this.frameworks = this.getDefaultFrameworks();
    }
    
    console.log(`📋 Framework cache loaded: ${this.frameworks?.length || 0} frameworks`);
    return this.frameworks;
  }

  /**
   * Load frameworks from file system
   */
  private async loadFrameworksFromFile(): Promise<FrameworkGene[]> {
    try {
      const frameworkPath = path.join(process.cwd(), 'framework_genes.json');
      
      if (!fs.existsSync(frameworkPath)) {
        console.error('❌ framework_genes.json not found at:', frameworkPath);
        return this.getDefaultFrameworks();
      }
      
      const fileContent = fs.readFileSync(frameworkPath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      let frameworks: FrameworkGene[] = [];

      // Support both top-level array and { genes: [...] } legacy wrapper
      if (Array.isArray(parsed)) {
        frameworks = parsed as FrameworkGene[];
      } else if (parsed && Array.isArray(parsed.genes)) {
        // Map legacy gene entries to FrameworkGene with safe defaults
        frameworks = (parsed.genes as any[]).map((g: any, idx: number) => ({
          id: typeof g.id === 'number' ? g.id : idx,
          name: g.name || `Gene_${idx}`,
          description: g.description || '',
          detection_method: g.detection_method || (g.pattern || g.text_pattern ? 'regex' : 'unknown'),
          success_rate: typeof g.success_rate === 'number' ? g.success_rate : 0.7,
          applicability: Array.isArray(g.applicability) ? g.applicability : [],
          examples: Array.isArray(g.examples) ? g.examples : [],
          pattern_type: g.type || g.pattern_type,
          trigger_words: Array.isArray(g.trigger_words) ? g.trigger_words : [],
          emotional_impact: typeof g.emotional_impact === 'number' ? g.emotional_impact : undefined,
          viral_score_multiplier: typeof g.viral_score_multiplier === 'number' ? g.viral_score_multiplier : 1.0
        }));
      } else {
        console.warn('⚠️ Unrecognized framework_genes.json format, using fallback');
        return this.getDefaultFrameworks();
      }

      // Safety check: ensure frameworks is an array
      if (!frameworks || !Array.isArray(frameworks)) {
        console.warn('⚠️ Parsed frameworks is not an array, using fallback');
        return this.getDefaultFrameworks();
      }
      
      console.log(`✅ Loaded ${frameworks.length} frameworks from framework_genes.json`);
      return frameworks;
      
    } catch (error) {
      console.error('❌ Failed to load framework_genes.json:', error);
      return this.getDefaultFrameworks();
    }
  }

  /**
   * Get frameworks matching specific criteria (cached lookup)
   */
  async getFrameworksByType(type: string): Promise<FrameworkGene[]> {
    const frameworks = await this.getFrameworks();
    return frameworks.filter(fw => 
      fw.pattern_type === type || 
      fw.applicability.includes(type.toLowerCase())
    );
  }

  /**
   * Get high-impact frameworks for quick analysis
   */
  async getHighImpactFrameworks(): Promise<FrameworkGene[]> {
    const frameworks = await this.getFrameworks();
    return frameworks
      .filter(fw => fw.success_rate > 0.7) // >70% success rate
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 20); // Top 20 highest performing
  }

  /**
   * Search frameworks by trigger words (optimized)
   */
  async searchFrameworksByContent(content: string): Promise<FrameworkGene[]> {
    try {
      const frameworks = await this.getFrameworks();
      
      // Safety check: ensure frameworks is an array
      if (!frameworks || !Array.isArray(frameworks)) {
        console.warn('⚠️ Frameworks not loaded properly, using fallback');
        return this.getDefaultFrameworks();
      }
      
      const contentLower = content.toLowerCase();
      
      return frameworks.filter(fw => {
      // Check trigger words
      if (fw.trigger_words && fw.trigger_words.some(word => contentLower.includes(String(word).toLowerCase()))) {
        return true;
      }
      
      // Check examples
      if (fw.examples && fw.examples.some(example => contentLower.includes(String(example).toLowerCase()))) {
        return true;
      }
      
      // Check name match
      if (contentLower.includes(fw.name.toLowerCase())) {
        return true;
      }
      
      return false;
    });
    } catch (error) {
      console.error('❌ Framework search failed:', error);
      return this.getDefaultFrameworks();
    }
  }

  /**
   * Calculate framework score for content (optimized)
   */
  async calculateFrameworkScore(content: string, hashtags: string[] = []): Promise<{
    score: number;
    matchedFrameworks: Array<{framework: FrameworkGene, strength: number}>;
  }> {
    try {
      const matchedFrameworks = await this.searchFrameworksByContent(content);
      const hashtagString = hashtags.join(' ').toLowerCase();
    
    let totalScore = 0;
    const frameworkMatches: Array<{framework: FrameworkGene, strength: number}> = [];
    
    for (const framework of matchedFrameworks) {
      let matchStrength = framework.success_rate;
      
      // Boost for hashtag alignment
      if (framework.applicability.some(app => hashtagString.includes(app))) {
        matchStrength *= 1.2;
      }
      
      // Boost for viral score multiplier
      if (framework.viral_score_multiplier) {
        matchStrength *= framework.viral_score_multiplier;
      }
      
      totalScore += matchStrength;
      frameworkMatches.push({ framework, strength: matchStrength });
    }
    
    // Normalize score to 0-100 range
    const normalizedScore = Math.min(totalScore * 10, 100);
    
      return {
        score: normalizedScore,
        matchedFrameworks: frameworkMatches
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 10) // Top 10 matches
      };
    } catch (error) {
      console.error('❌ Framework score calculation failed:', error);
      return {
        score: 0.5, // Baseline score
        matchedFrameworks: []
      };
    }
  }

  /**
   * Force refresh cache
   */
  async refreshCache(): Promise<void> {
    this.frameworks = null;
    this.lastLoaded = 0;
    await this.getFrameworks();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    loaded: boolean;
    frameworkCount: number;
    lastLoaded: string;
    ageMs: number;
  } {
    return {
      loaded: this.frameworks !== null,
      frameworkCount: this.frameworks?.length || 0,
      lastLoaded: new Date(this.lastLoaded).toISOString(),
      ageMs: Date.now() - this.lastLoaded
    };
  }

  /**
   * Fallback frameworks if file loading fails
   */
  private getDefaultFrameworks(): FrameworkGene[] {
    return [
      {
        id: 0,
        name: "AuthorityHook",
        description: "Content starts with a strong, credible statement",
        detection_method: "NLP_Authority_Keyword_Detection",
        success_rate: 0.85,
        applicability: ["educational", "news", "expert_advice"],
        examples: ["As a neuroscientist, I can tell you..."],
        trigger_words: ["as a", "expert", "scientist", "doctor", "according to"],
        viral_score_multiplier: 1.2
      },
      {
        id: 1,
        name: "EmotionalHook",
        description: "Strong emotional trigger in opening",
        detection_method: "Sentiment_Analysis",
        success_rate: 0.78,
        applicability: ["entertainment", "personal", "storytelling"],
        examples: ["I can't believe this happened to me..."],
        trigger_words: ["shocked", "amazed", "unbelievable", "incredible"],
        viral_score_multiplier: 1.15
      }
    ];
  }
}

// Singleton instance
export const frameworkCache = new FrameworkCache();
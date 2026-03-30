/**
 * PERFORMANCE CACHE MANAGER - INTELLIGENT MULTI-TIER CACHING
 * 
 * 🎯 TARGET: 80% cache hit rate for 90% speed improvement
 * 
 * STRATEGY:
 * - L1 Cache: Memory-resident hot predictions (<1ms)
 * - L2 Cache: Redis distributed cache (<10ms)
 * - L3 Cache: Database result cache (<50ms)
 * - Intelligent cache warming and eviction
 * - Predictive prefetching based on patterns
 * - Cache invalidation strategies
 * 
 * ARCHITECTURE:
 * - Multi-tier caching with automatic promotion/demotion
 * - Smart cache keys with content fingerprinting
 * - Probabilistic cache warming
 * - Real-time cache performance monitoring
 */

import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import { realTimeMonitor } from '@/lib/monitoring/real-time-monitor';

// ===== TYPES & INTERFACES =====

interface CacheInput {
  content: string;
  hashtags: string[];
  platform: string;
  creator_followers: number;
  niche: string;
  video_length?: number;
  cache_strategy?: 'aggressive' | 'conservative' | 'smart';
}

interface CachedResult {
  viral_score: number;
  viral_probability: number;
  confidence: number;
  recommendations: string[];
  cache_metadata: {
    cache_level: 'L1' | 'L2' | 'L3';
    cache_timestamp: Date;
    hit_count: number;
    ttl_remaining: number;
    cache_key: string;
  };
}

interface CachePerformance {
  l1_hit_rate: number;
  l2_hit_rate: number;
  l3_hit_rate: number;
  overall_hit_rate: number;
  average_response_time: number;
  cache_efficiency: number;
  eviction_rate: number;
  prefetch_accuracy: number;
}

interface CacheKey {
  content_fingerprint: string;
  platform: string;
  niche: string;
  creator_tier: string;
  version: string;
}

interface CacheEntry {
  key: string;
  value: any;
  timestamp: Date;
  ttl: number;
  hit_count: number;
  score: number; // Cache scoring for intelligent eviction
  size_bytes: number;
}

// ===== PERFORMANCE CACHE MANAGER =====

export class PerformanceCacheManager {
  private redis: Redis;
  private supabase: any;
  
  // L1 Cache: Memory-resident (hot predictions)
  private l1Cache: Map<string, CacheEntry>;
  private l1MaxSize = 10000; // 10k hot predictions
  private l1MaxMemoryMB = 256; // 256MB memory limit
  
  // L2 Cache: Redis distributed
  private l2TTL = 3600; // 1 hour TTL
  private l2MaxSize = 100000; // 100k predictions
  
  // L3 Cache: Database-backed
  private l3TTL = 86400; // 24 hour TTL
  
  // Performance tracking
  private cacheStats = {
    l1_hits: 0,
    l2_hits: 0,
    l3_hits: 0,
    misses: 0,
    total_requests: 0,
    total_response_time: 0,
    prefetch_attempts: 0,
    prefetch_hits: 0
  };
  
  // Cache warming patterns
  private warmingPatterns: Map<string, number>;
  private isInitialized = false;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    this.l1Cache = new Map();
    this.warmingPatterns = new Map();
    
    // Initialize cache warming
    this.initializeAsync();
  }
  
  /**
   * MAIN CACHE RETRIEVAL METHOD
   * 🎯 TARGET: <10ms average response time with 80% hit rate
   */
  async getCachedPrediction(input: CacheInput): Promise<CachedResult | null> {
    const startTime = performance.now();
    this.cacheStats.total_requests++;
    
    try {
      // Generate smart cache key
      const cacheKey = this.generateCacheKey(input);
      
      // L1 Cache Check (Memory - <1ms)
      const l1Result = this.checkL1Cache(cacheKey);
      if (l1Result) {
        this.cacheStats.l1_hits++;
        this.trackCachePerformance('L1', performance.now() - startTime);
        
        return {
          ...l1Result.value,
          cache_metadata: {
            cache_level: 'L1',
            cache_timestamp: l1Result.timestamp,
            hit_count: l1Result.hit_count,
            ttl_remaining: l1Result.ttl - (Date.now() - l1Result.timestamp.getTime()),
            cache_key: cacheKey
          }
        };
      }
      
      // L2 Cache Check (Redis - <10ms)
      const l2Result = await this.checkL2Cache(cacheKey);
      if (l2Result) {
        this.cacheStats.l2_hits++;
        
        // Promote to L1 for hot predictions
        this.promoteToL1(cacheKey, l2Result);
        
        this.trackCachePerformance('L2', performance.now() - startTime);
        
        return {
          ...l2Result,
          cache_metadata: {
            cache_level: 'L2',
            cache_timestamp: new Date(),
            hit_count: 1,
            ttl_remaining: this.l2TTL,
            cache_key: cacheKey
          }
        };
      }
      
      // L3 Cache Check (Database - <50ms)
      const l3Result = await this.checkL3Cache(cacheKey);
      if (l3Result) {
        this.cacheStats.l3_hits++;
        
        // Store in L2 for faster future access
        await this.storeInL2(cacheKey, l3Result);
        
        this.trackCachePerformance('L3', performance.now() - startTime);
        
        return {
          ...l3Result,
          cache_metadata: {
            cache_level: 'L3',
            cache_timestamp: new Date(),
            hit_count: 1,
            ttl_remaining: this.l3TTL,
            cache_key: cacheKey
          }
        };
      }
      
      // Cache miss
      this.cacheStats.misses++;
      this.trackCachePerformance('MISS', performance.now() - startTime);
      
      // Trigger predictive prefetching for similar content
      await this.triggerPredictivePrefetch(input, cacheKey);
      
      return null;
      
    } catch (error) {
      console.error('❌ Cache retrieval failed:', error);
      return null;
    }
  }
  
  /**
   * Store prediction result in appropriate cache tiers
   */
  async storePrediction(input: CacheInput, result: any): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(input);
      const cacheValue = {
        viral_score: result.viral_score || result.viralScore,
        viral_probability: result.viral_probability || result.viralProbability,
        confidence: result.confidence,
        recommendations: result.recommendations || []
      };
      
      // Determine cache strategy based on content characteristics
      const strategy = this.determineCacheStrategy(input, result);
      
      // Store in appropriate tiers based on strategy
      if (strategy.storeInL1) {
        this.storeInL1(cacheKey, cacheValue);
      }
      
      if (strategy.storeInL2) {
        await this.storeInL2(cacheKey, cacheValue);
      }
      
      if (strategy.storeInL3) {
        await this.storeInL3(cacheKey, cacheValue, input);
      }
      
      // Update warming patterns
      this.updateWarmingPatterns(input);
      
    } catch (error) {
      console.error('❌ Cache storage failed:', error);
    }
  }
  
  /**
   * Generate intelligent cache key with content fingerprinting
   */
  private generateCacheKey(input: CacheInput): string {
    // Create content fingerprint for semantic similarity
    const contentFingerprint = this.createContentFingerprint(input.content);
    
    // Create platform-niche signature
    const contextSignature = this.createContextSignature(input);
    
    // Combine into cache key
    return `pred_v2_${contentFingerprint}_${contextSignature}`;
  }
  
  /**
   * Create content fingerprint for semantic caching
   */
  private createContentFingerprint(content: string): string {
    // Normalize content for semantic similarity
    const normalizedContent = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract key features for fingerprinting
    const words = normalizedContent.split(' ');
    const keyWords = words.filter(word => word.length > 3).slice(0, 10);
    
    // Create semantic hash
    let hash = 0;
    const combined = keyWords.join('_');
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Create context signature for platform/niche grouping
   */
  private createContextSignature(input: CacheInput): string {
    const creatorTier = this.getCreatorTier(input.creator_followers);
    const contentLength = this.getContentLengthCategory(input.video_length);
    
    return `${input.platform}_${input.niche}_${creatorTier}_${contentLength}`;
  }
  
  /**
   * L1 Cache Operations (Memory)
   */
  private checkL1Cache(key: string): CacheEntry | null {
    const entry = this.l1Cache.get(key);
    if (!entry) return null;
    
    // Check TTL
    const isExpired = Date.now() - entry.timestamp.getTime() > entry.ttl;
    if (isExpired) {
      this.l1Cache.delete(key);
      return null;
    }
    
    // Update hit count and score
    entry.hit_count++;
    entry.score = this.calculateCacheScore(entry);
    
    return entry;
  }
  
  private storeInL1(key: string, value: any): void {
    // Check if L1 cache is full
    if (this.l1Cache.size >= this.l1MaxSize) {
      this.evictFromL1();
    }
    
    const entry: CacheEntry = {
      key,
      value,
      timestamp: new Date(),
      ttl: 1800000, // 30 minutes for L1
      hit_count: 0,
      score: 1,
      size_bytes: this.estimateObjectSize(value)
    };
    
    this.l1Cache.set(key, entry);
  }
  
  private evictFromL1(): void {
    // Intelligent LRU + scoring eviction
    const entries = Array.from(this.l1Cache.entries());
    
    // Sort by score (lower scores evicted first)
    entries.sort(([,a], [,b]) => a.score - b.score);
    
    // Evict lowest scoring 10% of entries
    const evictCount = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < evictCount; i++) {
      this.l1Cache.delete(entries[i][0]);
    }
  }
  
  /**
   * L2 Cache Operations (Redis)
   */
  private async checkL2Cache(key: string): Promise<any | null> {
    try {
      const result = await this.redis.get(key);
      if (!result) return null;
      
      return JSON.parse(result);
      
    } catch (error) {
      console.error('L2 cache error:', error);
      return null;
    }
  }
  
  private async storeInL2(key: string, value: any): Promise<void> {
    try {
      await this.redis.setex(key, this.l2TTL, JSON.stringify(value));
      
    } catch (error) {
      console.error('L2 cache storage error:', error);
    }
  }
  
  /**
   * L3 Cache Operations (Database)
   */
  private async checkL3Cache(key: string): Promise<any | null> {
    try {
      const { data } = await this.supabase
        .from('prediction_cache')
        .select('cached_result, created_at')
        .eq('cache_key', key)
        .gte('created_at', new Date(Date.now() - this.l3TTL * 1000).toISOString())
        .single();
      
      return data?.cached_result || null;
      
    } catch (error) {
      return null; // Not found or expired
    }
  }
  
  private async storeInL3(key: string, value: any, input: CacheInput): Promise<void> {
    try {
      await this.supabase.from('prediction_cache').upsert({
        cache_key: key,
        cached_result: value,
        platform: input.platform,
        niche: input.niche,
        creator_tier: this.getCreatorTier(input.creator_followers),
        content_fingerprint: this.createContentFingerprint(input.content),
        cache_level: 'L3',
        created_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('L3 cache storage error:', error);
    }
  }
  
  /**
   * Cache Strategy Determination
   */
  private determineCacheStrategy(input: CacheInput, result: any): {
    storeInL1: boolean;
    storeInL2: boolean;
    storeInL3: boolean;
  } {
    // High confidence predictions get cached aggressively
    const isHighConfidence = (result.confidence || 0) > 0.8;
    
    // Popular content types get cached more
    const isPopularContent = this.isPopularContentType(input);
    
    // Large creators get cached for faster repeat access
    const isLargeCreator = input.creator_followers > 100000;
    
    return {
      storeInL1: isHighConfidence && (isPopularContent || isLargeCreator),
      storeInL2: isHighConfidence || isPopularContent,
      storeInL3: true // Always store in L3 for learning
    };
  }
  
  /**
   * Predictive Prefetching
   */
  private async triggerPredictivePrefetch(input: CacheInput, missedKey: string): Promise<void> {
    try {
      this.cacheStats.prefetch_attempts++;
      
      // Find similar content patterns
      const similarPatterns = await this.findSimilarPatterns(input);
      
      // Prefetch related predictions (async, non-blocking)
      setImmediate(async () => {
        for (const pattern of similarPatterns) {
          const prefetchKey = this.generateCacheKey(pattern);
          
          // Check if already cached
          const cached = await this.checkL2Cache(prefetchKey);
          if (!cached) {
            // Would trigger prediction pipeline for prefetch
            // For now, just log the prefetch opportunity
            console.log(`🔮 Prefetch opportunity: ${prefetchKey}`);
          }
        }
      });
      
    } catch (error) {
      console.error('Prefetch error:', error);
    }
  }
  
  /**
   * Cache Promotion Strategy
   */
  private promoteToL1(key: string, value: any): void {
    // Only promote if L1 has space or value is worth evicting for
    if (this.l1Cache.size < this.l1MaxSize || this.isWorthPromoting(value)) {
      this.storeInL1(key, value);
    }
  }
  
  private isWorthPromoting(value: any): boolean {
    // Promote high-confidence predictions
    return (value.confidence || 0) > 0.85;
  }
  
  // ===== UTILITY METHODS =====
  
  private getCreatorTier(followers: number): string {
    if (followers < 1000) return 'micro';
    if (followers < 10000) return 'small';
    if (followers < 100000) return 'medium';
    if (followers < 1000000) return 'large';
    return 'mega';
  }
  
  private getContentLengthCategory(length?: number): string {
    if (!length) return 'unknown';
    if (length < 30) return 'short';
    if (length < 120) return 'medium';
    return 'long';
  }
  
  private calculateCacheScore(entry: CacheEntry): number {
    const ageMinutes = (Date.now() - entry.timestamp.getTime()) / (1000 * 60);
    const recencyScore = Math.max(0, 1 - ageMinutes / 60); // Decay over 1 hour
    const popularityScore = Math.min(entry.hit_count / 10, 1); // Max at 10 hits
    
    return recencyScore * 0.6 + popularityScore * 0.4;
  }
  
  private estimateObjectSize(obj: any): number {
    // Rough estimate of object size in bytes
    return JSON.stringify(obj).length * 2; // Unicode characters
  }
  
  private isPopularContentType(input: CacheInput): boolean {
    const popularNiches = ['fitness', 'business', 'finance', 'lifestyle'];
    return popularNiches.includes(input.niche.toLowerCase());
  }
  
  private async findSimilarPatterns(input: CacheInput): Promise<CacheInput[]> {
    // Simplified similar pattern finding
    return [
      {
        ...input,
        content: input.content.replace(/\d+/g, 'X') // Number variations
      },
      {
        ...input,
        creator_followers: Math.floor(input.creator_followers * 1.2) // Similar creator sizes
      }
    ];
  }
  
  private updateWarmingPatterns(input: CacheInput): void {
    const pattern = `${input.platform}_${input.niche}`;
    const currentCount = this.warmingPatterns.get(pattern) || 0;
    this.warmingPatterns.set(pattern, currentCount + 1);
  }
  
  private trackCachePerformance(level: string, responseTime: number): void {
    this.cacheStats.total_response_time += responseTime;
    
    // Track with monitoring system
    realTimeMonitor.recordResponseTime({
      endpoint: `/cache/${level.toLowerCase()}`,
      method: 'GET',
      responseTime,
      statusCode: 200,
      timestamp: new Date()
    });
  }
  
  private async initializeAsync(): Promise<void> {
    try {
      console.log('🚀 Initializing Performance Cache Manager...');
      
      // Load warming patterns from database
      await this.loadWarmingPatterns();
      
      // Setup cache cleanup intervals
      this.setupCacheCleanup();
      
      this.isInitialized = true;
      console.log('✅ Performance Cache Manager initialized');
      
    } catch (error) {
      console.error('❌ Cache manager initialization failed:', error);
    }
  }
  
  private async loadWarmingPatterns(): Promise<void> {
    try {
      // Load popular prediction patterns for warming
      const { data: patterns } = await this.supabase
        .from('cache_warming_patterns')
        .select('pattern, frequency')
        .order('frequency', { ascending: false })
        .limit(100);
      
      if (patterns) {
        for (const pattern of patterns) {
          this.warmingPatterns.set(pattern.pattern, pattern.frequency);
        }
        console.log(`✅ Loaded ${patterns.length} warming patterns`);
      }
      
    } catch (error) {
      console.error('⚠️ Failed to load warming patterns:', error);
    }
  }
  
  private setupCacheCleanup(): void {
    // L1 cache cleanup every 10 minutes
    setInterval(() => {
      this.cleanupL1Cache();
    }, 10 * 60 * 1000);
    
    // L3 cache cleanup every hour
    setInterval(() => {
      this.cleanupL3Cache();
    }, 60 * 60 * 1000);
  }
  
  private cleanupL1Cache(): void {
    const now = Date.now();
    const entriesDeleted = [];
    
    for (const [key, entry] of this.l1Cache.entries()) {
      const isExpired = now - entry.timestamp.getTime() > entry.ttl;
      if (isExpired) {
        this.l1Cache.delete(key);
        entriesDeleted.push(key);
      }
    }
    
    if (entriesDeleted.length > 0) {
      console.log(`🧹 L1 cache cleanup: ${entriesDeleted.length} expired entries removed`);
    }
  }
  
  private async cleanupL3Cache(): Promise<void> {
    try {
      // Remove expired L3 cache entries
      const cutoffDate = new Date(Date.now() - this.l3TTL * 1000);
      
      const { count } = await this.supabase
        .from('prediction_cache')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (count && count > 0) {
        console.log(`🧹 L3 cache cleanup: ${count} expired entries removed`);
      }
      
    } catch (error) {
      console.error('L3 cache cleanup error:', error);
    }
  }
  
  /**
   * Get comprehensive cache performance statistics
   */
  getCachePerformance(): CachePerformance {
    const totalRequests = this.cacheStats.total_requests;
    
    if (totalRequests === 0) {
      return {
        l1_hit_rate: 0,
        l2_hit_rate: 0,
        l3_hit_rate: 0,
        overall_hit_rate: 0,
        average_response_time: 0,
        cache_efficiency: 0,
        eviction_rate: 0,
        prefetch_accuracy: 0
      };
    }
    
    const l1HitRate = this.cacheStats.l1_hits / totalRequests;
    const l2HitRate = this.cacheStats.l2_hits / totalRequests;
    const l3HitRate = this.cacheStats.l3_hits / totalRequests;
    const overallHitRate = (this.cacheStats.l1_hits + this.cacheStats.l2_hits + this.cacheStats.l3_hits) / totalRequests;
    
    const averageResponseTime = this.cacheStats.total_response_time / totalRequests;
    const cacheEfficiency = overallHitRate * (1 - averageResponseTime / 100); // Efficiency considering speed
    
    const prefetchAccuracy = this.cacheStats.prefetch_attempts > 0 
      ? this.cacheStats.prefetch_hits / this.cacheStats.prefetch_attempts 
      : 0;
    
    return {
      l1_hit_rate: l1HitRate,
      l2_hit_rate: l2HitRate,
      l3_hit_rate: l3HitRate,
      overall_hit_rate: overallHitRate,
      average_response_time: averageResponseTime,
      cache_efficiency: cacheEfficiency,
      eviction_rate: 0.1, // Placeholder
      prefetch_accuracy: prefetchAccuracy
    };
  }
  
  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(pattern: string): Promise<void> {
    try {
      // Clear from all cache levels
      const keysToDelete = [];
      
      // L1 cache
      for (const key of this.l1Cache.keys()) {
        if (key.includes(pattern)) {
          this.l1Cache.delete(key);
          keysToDelete.push(key);
        }
      }
      
      // L2 cache (Redis pattern delete)
      const redisKeys = await this.redis.keys(`*${pattern}*`);
      if (redisKeys.length > 0) {
        await this.redis.del(...redisKeys);
        keysToDelete.push(...redisKeys);
      }
      
      // L3 cache (Database)
      await this.supabase
        .from('prediction_cache')
        .delete()
        .like('cache_key', `%${pattern}%`);
      
      console.log(`🗑️ Cache invalidation: ${keysToDelete.length} entries removed for pattern: ${pattern}`);
      
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

// Export singleton instance
export const performanceCacheManager = new PerformanceCacheManager();
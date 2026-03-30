/**
 * ML-DEPLOYMENT-SPECIALIST: Prediction Result Caching System
 * 
 * Caches prediction results to avoid redundant calculations
 * TARGET: 95% latency reduction for repeated URLs (3800ms → 190ms)
 */
import { createHash, randomUUID } from 'crypto';

interface CachedPrediction {
  result: any;
  timestamp: number;
  hits: number;
  lastAccessed: number;
}

class PredictionCache {
  private cache: Map<string, CachedPrediction> = new Map();
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private hits = 0;
  private misses = 0;

  /**
   * Generate cache key from input
   */
  private generateKey(input: any): string {
    // Create deterministic hash from meaningful input properties
    const keyString = JSON.stringify({
      videoUrl: input.videoUrl,
      content: input.content,
      creator: input.creator,
      platform: input.platform
    });
    
    return createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Get cached prediction result
   */
  get(input: any): any | null {
    const key = this.generateKey(input);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.misses++;
      return null;
    }
    
    const now = Date.now();
    
    // Check if cache entry is expired
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    // Update access stats
    cached.hits++;
    cached.lastAccessed = now;
    this.hits++;
    
    console.log(`🎯 Cache HIT: ${key.substring(0, 8)}... (${cached.hits} total hits)`);
    
    // Return cloned result to prevent mutation
    return JSON.parse(JSON.stringify(cached.result));
  }

  /**
   * Store prediction result in cache
   */
  set(input: any, result: any): void {
    const key = this.generateKey(input);
    const now = Date.now();
    
    // Evict oldest entries if cache is full
    this.evictIfNeeded();
    
    this.cache.set(key, {
      result: JSON.parse(JSON.stringify(result)), // Deep clone to prevent mutation
      timestamp: now,
      hits: 0,
      lastAccessed: now
    });
    
    console.log(`💾 Cache SET: ${key.substring(0, 8)}... (cache size: ${this.cache.size})`);
  }

  /**
   * Evict oldest/least used entries when cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size < this.MAX_CACHE_SIZE) return;
    
    // Find the oldest, least accessed entry
    let oldestKey: string | null = null;
    let oldestScore = Number.MAX_SAFE_INTEGER;
    
    for (const [key, cached] of this.cache.entries()) {
      // Score based on age and usage (lower is worse)
      const age = Date.now() - cached.timestamp;
      const score = cached.hits * 1000 - age; // Favor recent and frequently used
      
      if (score < oldestScore) {
        oldestScore = score;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Cache evicted: ${oldestKey.substring(0, 8)}...`);
    }
  }

  /**
   * Check if result should be cached (avoid caching low-confidence predictions)
   */
  shouldCache(result: any): boolean {
    // Only cache results with reasonable confidence
    if (result.confidence < 0.3) return false;
    
    // Don't cache error results
    if (result.error) return false;
    
    // Cache if processing time was significant (>1000ms)
    if (result.processingTime > 1000) return true;
    
    return true;
  }

  /**
   * Invalidate cache entries for a specific video URL
   */
  invalidateUrl(videoUrl: string): number {
    let invalidated = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.result.input?.videoUrl === videoUrl) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    console.log(`🗑️ Invalidated ${invalidated} cache entries for URL`);
    return invalidated;
  }

  /**
   * Clear expired entries (maintenance)
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
    
    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    let oldestTimestamp = Number.MAX_SAFE_INTEGER;
    let newestTimestamp = 0;
    let oldestKey: string | null = null;
    let newestKey: string | null = null;
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
        oldestKey = key;
      }
      if (cached.timestamp > newestTimestamp) {
        newestTimestamp = cached.timestamp;
        newestKey = key;
      }
    }
    
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      oldestEntry: oldestKey ? new Date(oldestTimestamp).toISOString() : null,
      newestEntry: newestKey ? new Date(newestTimestamp).toISOString() : null
    };
  }

  /**
   * Warm up cache with popular predictions
   */
  async warmUp(popularInputs: any[]): Promise<void> {
    console.log(`🔥 Warming up cache with ${popularInputs.length} popular predictions...`);
    
    // This would typically pre-compute and cache popular video predictions
    // For now, just log the intent
    for (const input of popularInputs) {
      const key = this.generateKey(input);
      console.log(`🔥 Would warm cache for: ${key.substring(0, 8)}...`);
    }
  }

  /**
   * Clear all cache (for testing/development)
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log(`🗑️ Cache cleared: ${size} entries removed`);
  }
  /**
   * Raw cache operations for high-performance scenarios
   */
  getRaw(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      cached.hits++;
      this.totalHits++;
      console.log(`⚡ Raw cache HIT: ${key.substring(0, 20)}...`);
      return cached.result;
    }
    this.totalRequests++;
    return null;
  }

  setRaw(key: string, value: any, customTTL?: number): void {
    this.cache.set(key, {
      result: value,
      timestamp: Date.now(),
      hits: 0,
      ttl: customTTL || this.TTL
    });
    console.log(`💾 Raw cache SET: ${key.substring(0, 20)}...`);
  }

  /**
   * Clear cache for specific key pattern
   */
  clearPattern(pattern: string): number {
    let cleared = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    console.log(`🧹 Cache cleared: ${cleared} entries with pattern "${pattern}"`);
    return cleared;
  }
}

// Singleton instance
export const predictionCache = new PredictionCache();
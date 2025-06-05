import { supabaseClient } from '@/lib/supabase-client';
import { Platform, Niche } from '@/lib/types/database';

// Types for asset management
export interface Asset {
  id: string;
  type: 'video' | 'image' | 'audio' | 'font' | 'graphic';
  category: 'stock' | 'user_upload' | 'generated' | 'brand';
  name: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  metadata: AssetMetadata;
  tags: string[];
  license: LicenseInfo;
  usage: UsageStats;
  status: 'active' | 'processing' | 'failed' | 'archived';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AssetMetadata {
  fileSize: number; // bytes
  duration?: number; // seconds for video/audio
  dimensions?: { width: number; height: number };
  format: string; // mp4, jpg, png, etc.
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  fps?: number; // for video
  bitrate?: number; // for audio/video
  colorProfile?: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  dominantColors?: string[];
  aiGenerated?: boolean;
  processed?: boolean;
}

export interface LicenseInfo {
  type: 'royalty_free' | 'creative_commons' | 'purchased' | 'user_owned' | 'subscription';
  source: string; // Pexels, Unsplash, user, etc.
  sourceUrl?: string;
  attribution?: string;
  restrictions?: string[];
  commercial_use: boolean;
  expires_at?: string;
}

export interface UsageStats {
  download_count: number;
  use_count: number;
  viral_score_avg: number;
  platforms_used: Platform[];
  last_used_at?: string;
  performance_rating: number; // 1-5 stars
}

export interface AssetCollection {
  id: string;
  name: string;
  description: string;
  type: 'curated' | 'trending' | 'user' | 'brand_kit' | 'campaign';
  assets: string[]; // Asset IDs
  tags: string[];
  visibility: 'public' | 'private' | 'team';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UploadRequest {
  file: File | string; // File object or URL
  type: Asset['type'];
  name: string;
  description?: string;
  tags?: string[];
  category?: Asset['category'];
  userId: string;
  metadata?: Partial<AssetMetadata>;
}

export interface AssetSearchParams {
  query?: string;
  type?: Asset['type'];
  category?: Asset['category'];
  platform?: Platform;
  niche?: Niche;
  orientation?: 'landscape' | 'portrait' | 'square';
  duration?: { min?: number; max?: number };
  tags?: string[];
  license?: LicenseInfo['type'];
  sort?: 'relevance' | 'popularity' | 'recent' | 'viral_score' | 'alphabetical';
  limit?: number;
  offset?: number;
}

export interface StockProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
  supportedTypes: Asset['type'][];
}

/**
 * Asset Management System
 * Handles stock media, user uploads, processing, and optimization
 */
export class AssetManager {
  private static instance: AssetManager;
  private stockProviders: Map<string, StockProvider> = new Map();
  private isTestMode: boolean = true;

  private constructor() {
    this.initializeStockProviders();
    
    // Check if we have real storage configured
    const hasStorage = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.isTestMode = !hasStorage;
    
    if (this.isTestMode) {
      console.warn('⚠️ AssetManager running in TEST MODE - using mock data');
    }
  }

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Search assets with filters
   */
  async searchAssets(params: AssetSearchParams): Promise<{
    assets: Asset[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      if (this.isTestMode) {
        return this.getMockAssets(params);
      }

      let query = supabaseClient
        .from('assets')
        .select('*, usage_stats(*)', { count: 'exact' })
        .eq('status', 'active');

      // Apply filters
      if (params.type) {
        query = query.eq('type', params.type);
      }

      if (params.category) {
        query = query.eq('category', params.category);
      }

      if (params.orientation) {
        query = query.eq('metadata->>orientation', params.orientation);
      }

      if (params.tags && params.tags.length > 0) {
        query = query.overlaps('tags', params.tags);
      }

      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%,tags.cs.{${params.query}}`);
      }

      if (params.duration) {
        if (params.duration.min) {
          query = query.gte('metadata->>duration', params.duration.min);
        }
        if (params.duration.max) {
          query = query.lte('metadata->>duration', params.duration.max);
        }
      }

      // Apply sorting
      switch (params.sort) {
        case 'popularity':
          query = query.order('usage_stats.use_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'viral_score':
          query = query.order('usage_stats.viral_score_avg', { ascending: false });
          break;
        case 'alphabetical':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('usage_stats.performance_rating', { ascending: false });
      }

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Asset search failed: ${error.message}`);
      }

      return {
        assets: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Asset search error:', error);
      return { assets: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get trending assets
   */
  async getTrendingAssets(params: {
    type?: Asset['type'];
    platform?: Platform;
    timeframe?: 'day' | 'week' | 'month';
    limit?: number;
  } = {}): Promise<Asset[]> {
    const timeframeDays = params.timeframe === 'day' ? 1 : params.timeframe === 'week' ? 7 : 30;
    
    if (this.isTestMode) {
      return this.getMockTrendingAssets(params);
    }

    try {
      let query = supabaseClient
        .from('assets')
        .select('*, usage_stats(*)')
        .eq('status', 'active')
        .gte('usage_stats.last_used_at', new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString())
        .order('usage_stats.viral_score_avg', { ascending: false })
        .limit(params.limit || 10);

      if (params.type) {
        query = query.eq('type', params.type);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Trending assets fetch failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching trending assets:', error);
      return [];
    }
  }

  /**
   * Upload asset
   */
  async uploadAsset(request: UploadRequest): Promise<{
    success: boolean;
    asset?: Asset;
    error?: string;
  }> {
    try {
      if (this.isTestMode) {
        return this.mockUploadAsset(request);
      }

      // Process the file
      const processedAsset = await this.processAsset(request);
      
      // Save to database
      const { data, error } = await supabaseClient
        .from('assets')
        .insert([processedAsset])
        .select()
        .single();

      if (error) {
        throw new Error(`Asset upload failed: ${error.message}`);
      }

      // Initialize usage stats
      await supabaseClient
        .from('asset_usage_stats')
        .insert([{
          asset_id: data.id,
          download_count: 0,
          use_count: 0,
          viral_score_avg: 0,
          platforms_used: [],
          performance_rating: 3
        }]);

      return { success: true, asset: data };
    } catch (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Get stock assets from external providers
   */
  async getStockAssets(params: {
    query: string;
    type: 'video' | 'image';
    provider?: 'pexels' | 'unsplash' | 'pixabay';
    limit?: number;
    orientation?: 'landscape' | 'portrait' | 'square';
  }): Promise<Asset[]> {
    try {
      if (this.isTestMode) {
        return this.getMockStockAssets(params);
      }

      const provider = params.provider || 'pexels';
      const stockProvider = this.stockProviders.get(provider);

      if (!stockProvider) {
        throw new Error(`Stock provider ${provider} not configured`);
      }

      // Fetch from external API based on provider
      switch (provider) {
        case 'pexels':
          return this.fetchFromPexels(params);
        case 'unsplash':
          return this.fetchFromUnsplash(params);
        case 'pixabay':
          return this.fetchFromPixabay(params);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('Stock asset fetch error:', error);
      return [];
    }
  }

  /**
   * Create asset collection
   */
  async createCollection(params: {
    name: string;
    description: string;
    type: AssetCollection['type'];
    assetIds: string[];
    tags?: string[];
    visibility?: AssetCollection['visibility'];
    userId: string;
  }): Promise<{ success: boolean; collection?: AssetCollection; error?: string }> {
    try {
      const collection: Omit<AssetCollection, 'id'> = {
        name: params.name,
        description: params.description,
        type: params.type,
        assets: params.assetIds,
        tags: params.tags || [],
        visibility: params.visibility || 'private',
        created_by: params.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (this.isTestMode) {
        return {
          success: true,
          collection: { ...collection, id: `collection_${Date.now()}` }
        };
      }

      const { data, error } = await supabaseClient
        .from('asset_collections')
        .insert([collection])
        .select()
        .single();

      if (error) {
        throw new Error(`Collection creation failed: ${error.message}`);
      }

      return { success: true, collection: data };
    } catch (error) {
      console.error('Collection creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Creation failed' 
      };
    }
  }

  /**
   * Track asset usage
   */
  async trackAssetUsage(assetId: string, context: {
    userId: string;
    platform: Platform;
    templateId?: string;
    viralScore?: number;
  }): Promise<void> {
    try {
      if (this.isTestMode) {
        console.log(`Tracking usage for asset ${assetId}:`, context);
        return;
      }

      // Update usage stats
      await supabaseClient.rpc('update_asset_usage', {
        p_asset_id: assetId,
        p_platform: context.platform,
        p_viral_score: context.viralScore || 0
      });

      // Log usage event
      await supabaseClient
        .from('asset_usage_events')
        .insert([{
          asset_id: assetId,
          user_id: context.userId,
          platform: context.platform,
          template_id: context.templateId,
          viral_score: context.viralScore,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error tracking asset usage:', error);
    }
  }

  /**
   * Optimize asset for platform
   */
  async optimizeAssetForPlatform(
    assetId: string,
    platform: Platform,
    options?: {
      quality?: 'low' | 'medium' | 'high';
      dimensions?: { width: number; height: number };
      format?: string;
    }
  ): Promise<{ success: boolean; optimizedUrl?: string; error?: string }> {
    try {
      if (this.isTestMode) {
        return {
          success: true,
          optimizedUrl: `https://optimized.trendzo.com/${assetId}_${platform}.mp4`
        };
      }

      // Get original asset
      const { data: asset, error } = await supabaseClient
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error || !asset) {
        throw new Error('Asset not found');
      }

      // Check if optimized version already exists
      const optimizedKey = `${assetId}_${platform}_${options?.quality || 'medium'}`;
      const { data: existingOptimized } = await supabaseClient
        .from('asset_optimizations')
        .select('optimized_url')
        .eq('original_asset_id', assetId)
        .eq('platform', platform)
        .eq('optimization_key', optimizedKey)
        .single();

      if (existingOptimized) {
        return { success: true, optimizedUrl: existingOptimized.optimized_url };
      }

      // Trigger optimization job (implementation depends on your video processing service)
      const optimizedUrl = await this.processAssetOptimization(asset, platform, options);

      // Save optimized version
      await supabaseClient
        .from('asset_optimizations')
        .insert([{
          original_asset_id: assetId,
          platform,
          optimization_key: optimizedKey,
          optimized_url: optimizedUrl,
          created_at: new Date().toISOString()
        }]);

      return { success: true, optimizedUrl };
    } catch (error) {
      console.error('Asset optimization error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Optimization failed' 
      };
    }
  }

  /**
   * Get user's uploaded assets
   */
  async getUserAssets(userId: string, params?: AssetSearchParams): Promise<Asset[]> {
    try {
      if (this.isTestMode) {
        return this.getMockUserAssets(userId);
      }

      let query = supabaseClient
        .from('assets')
        .select('*, usage_stats(*)')
        .eq('created_by', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (params?.type) {
        query = query.eq('type', params.type);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`User assets fetch failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user assets:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private async processAsset(request: UploadRequest): Promise<Omit<Asset, 'id'>> {
    // Generate asset ID
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract metadata from file
    const metadata = await this.extractAssetMetadata(request.file);

    // Generate thumbnails and previews
    const thumbnailUrl = await this.generateThumbnail(request.file, request.type);
    const previewUrl = request.type === 'video' ? 
      await this.generateVideoPreview(request.file) : thumbnailUrl;

    return {
      id: assetId,
      type: request.type,
      category: request.category || 'user_upload',
      name: request.name,
      description: request.description,
      url: typeof request.file === 'string' ? request.file : `https://assets.trendzo.com/${assetId}`,
      thumbnailUrl,
      previewUrl,
      metadata: { ...metadata, ...request.metadata },
      tags: request.tags || [],
      license: {
        type: 'user_owned',
        source: 'user_upload',
        commercial_use: true
      },
      usage: {
        download_count: 0,
        use_count: 0,
        viral_score_avg: 0,
        platforms_used: [],
        performance_rating: 3
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: request.userId
    };
  }

  private async extractAssetMetadata(file: File | string): Promise<AssetMetadata> {
    // Mock metadata extraction - in production, use proper media analysis
    if (typeof file === 'string') {
      return {
        fileSize: 1024 * 1024, // 1MB estimate
        format: file.split('.').pop() || 'unknown',
        processed: true
      };
    }

    return {
      fileSize: file.size,
      format: file.type.split('/')[1] || 'unknown',
      processed: false
    };
  }

  private async generateThumbnail(file: File | string, type: Asset['type']): Promise<string> {
    // Mock thumbnail generation
    return `https://thumbnails.trendzo.com/${Date.now()}.jpg`;
  }

  private async generateVideoPreview(file: File | string): Promise<string> {
    // Mock video preview generation
    return `https://previews.trendzo.com/${Date.now()}.mp4`;
  }

  private async processAssetOptimization(
    asset: Asset,
    platform: Platform,
    options?: any
  ): Promise<string> {
    // Mock optimization - in production, use video processing service
    return `https://optimized.trendzo.com/${asset.id}_${platform}.mp4`;
  }

  private initializeStockProviders(): void {
    // Initialize stock providers with API keys
    if (process.env.PEXELS_API_KEY) {
      this.stockProviders.set('pexels', {
        name: 'Pexels',
        apiKey: process.env.PEXELS_API_KEY,
        baseUrl: 'https://api.pexels.com/v1',
        rateLimit: 200,
        supportedTypes: ['video', 'image']
      });
    }

    if (process.env.UNSPLASH_ACCESS_KEY) {
      this.stockProviders.set('unsplash', {
        name: 'Unsplash',
        apiKey: process.env.UNSPLASH_ACCESS_KEY,
        baseUrl: 'https://api.unsplash.com',
        rateLimit: 50,
        supportedTypes: ['image']
      });
    }

    if (process.env.PIXABAY_API_KEY) {
      this.stockProviders.set('pixabay', {
        name: 'Pixabay',
        apiKey: process.env.PIXABAY_API_KEY,
        baseUrl: 'https://pixabay.com/api',
        rateLimit: 100,
        supportedTypes: ['video', 'image']
      });
    }
  }

  private async fetchFromPexels(params: any): Promise<Asset[]> {
    // Pexels API integration
    throw new Error('Pexels integration not implemented yet');
  }

  private async fetchFromUnsplash(params: any): Promise<Asset[]> {
    // Unsplash API integration
    throw new Error('Unsplash integration not implemented yet');
  }

  private async fetchFromPixabay(params: any): Promise<Asset[]> {
    // Pixabay API integration
    throw new Error('Pixabay integration not implemented yet');
  }

  // Mock data methods for testing
  private getMockAssets(params: AssetSearchParams): Promise<{
    assets: Asset[];
    total: number;
    hasMore: boolean;
  }> {
    const mockAssets = this.generateMockAssets(20);
    const filtered = mockAssets.filter(asset => {
      if (params.type && asset.type !== params.type) return false;
      if (params.category && asset.category !== params.category) return false;
      if (params.query && !asset.name.toLowerCase().includes(params.query.toLowerCase())) return false;
      return true;
    });

    const limit = params.limit || 20;
    const offset = params.offset || 0;
    const paginatedAssets = filtered.slice(offset, offset + limit);

    return Promise.resolve({
      assets: paginatedAssets,
      total: filtered.length,
      hasMore: filtered.length > offset + limit
    });
  }

  private getMockTrendingAssets(params: any): Asset[] {
    return this.generateMockAssets(params.limit || 10).filter(asset => 
      asset.usage.viral_score_avg > 75
    );
  }

  private getMockStockAssets(params: any): Asset[] {
    return this.generateMockAssets(params.limit || 10).map(asset => ({
      ...asset,
      category: 'stock',
      license: {
        type: 'royalty_free',
        source: params.provider || 'pexels',
        commercial_use: true
      }
    }));
  }

  private getMockUserAssets(userId: string): Asset[] {
    return this.generateMockAssets(5).map(asset => ({
      ...asset,
      category: 'user_upload',
      created_by: userId
    }));
  }

  private mockUploadAsset(request: UploadRequest): Promise<{
    success: boolean;
    asset?: Asset;
    error?: string;
  }> {
    const asset: Asset = {
      id: `asset_${Date.now()}`,
      type: request.type,
      category: request.category || 'user_upload',
      name: request.name,
      description: request.description,
      url: `https://assets.trendzo.com/mock/${Date.now()}.mp4`,
      thumbnailUrl: `https://thumbnails.trendzo.com/mock/${Date.now()}.jpg`,
      metadata: {
        fileSize: 1024 * 1024,
        format: 'mp4',
        processed: true
      },
      tags: request.tags || [],
      license: {
        type: 'user_owned',
        source: 'user_upload',
        commercial_use: true
      },
      usage: {
        download_count: 0,
        use_count: 0,
        viral_score_avg: 0,
        platforms_used: [],
        performance_rating: 3
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: request.userId
    };

    return Promise.resolve({ success: true, asset });
  }

  private generateMockAssets(count: number): Asset[] {
    const assets: Asset[] = [];
    const types: Asset['type'][] = ['video', 'image', 'audio'];
    const categories: Asset['category'][] = ['stock', 'user_upload', 'generated'];

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      assets.push({
        id: `mock_asset_${i}`,
        type,
        category,
        name: `Mock ${type} ${i + 1}`,
        description: `Mock ${type} asset for testing`,
        url: `https://assets.trendzo.com/mock/${type}_${i}.mp4`,
        thumbnailUrl: `https://thumbnails.trendzo.com/mock/${type}_${i}.jpg`,
        metadata: {
          fileSize: Math.floor(Math.random() * 10000000) + 1000000,
          duration: type === 'video' ? Math.floor(Math.random() * 30) + 5 : undefined,
          dimensions: { width: 1920, height: 1080 },
          format: type === 'video' ? 'mp4' : type === 'image' ? 'jpg' : 'mp3',
          orientation: 'landscape',
          processed: true
        },
        tags: ['mock', type, `tag${i}`],
        license: {
          type: 'royalty_free',
          source: 'mock',
          commercial_use: true
        },
        usage: {
          download_count: Math.floor(Math.random() * 100),
          use_count: Math.floor(Math.random() * 50),
          viral_score_avg: Math.floor(Math.random() * 100),
          platforms_used: ['instagram', 'tiktok'],
          performance_rating: Math.floor(Math.random() * 5) + 1
        },
        status: 'active',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return assets;
  }
}

// Export singleton instance
export const assetManager = AssetManager.getInstance();
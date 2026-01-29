/**
 * TRENDZO ASSET MANAGER
 * 
 * Centralized asset management system for the Trendzo platform
 * Handles images, graphics, icons, audio files, and other media assets
 * with optimization, caching, and responsive delivery capabilities.
 */

import { trendzoBrand } from '../branding/trendzo-brand';

// ===== ASSET TYPES =====

export interface AssetMetadata {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'icon' | 'audio' | 'video' | 'document';
  category: string;
  tags: string[];
  size?: number;
  dimensions?: { width: number; height: number };
  format: string;
  alt_text?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ResponsiveImageSet {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
}

// ===== ASSET CATALOG =====

export const assetCatalog = {
  // ===== LOGOS & BRANDING =====
  logos: {
    flame_icon: {
      id: 'logo-flame-icon',
      name: 'Trendzo Flame Icon',
      path: '/images/logos/trendzo-flame-icon.svg',
      type: 'icon' as const,
      category: 'branding',
      tags: ['logo', 'icon', 'flame', 'brand'],
      format: 'svg',
      alt_text: 'Trendzo flame icon',
      description: 'Primary Trendzo flame icon in SVG format'
    },
    full_logo: {
      id: 'logo-full',
      name: 'Trendzo Full Logo',
      path: '/images/logos/trendzo-full-logo.svg',
      type: 'icon' as const,
      category: 'branding',
      tags: ['logo', 'full', 'brand', 'complete'],
      format: 'svg',
      alt_text: 'Trendzo full logo',
      description: 'Complete Trendzo logo with text and icon'
    },
    text_logo: {
      id: 'logo-text',
      name: 'Trendzo Text Logo',
      path: '/images/logos/trendzo-text-logo.svg',
      type: 'icon' as const,
      category: 'branding',
      tags: ['logo', 'text', 'wordmark', 'brand'],
      format: 'svg',
      alt_text: 'Trendzo text logo',
      description: 'Trendzo text-only logo/wordmark'
    },
    main_logo: {
      id: 'logo-main',
      name: 'Trendzo Main Logo',
      path: '/images/logos/trendzo-logo.svg',
      type: 'icon' as const,
      category: 'branding',
      tags: ['logo', 'main', 'primary', 'brand'],
      format: 'svg',
      alt_text: 'Trendzo logo',
      description: 'Primary Trendzo logo'
    }
  },

  // ===== HERO & MARKETING IMAGES =====
  hero: {
    hero_light: {
      id: 'hero-light',
      name: 'Hero Image Light',
      path: '/images/hero/hero-light.png',
      type: 'image' as const,
      category: 'marketing',
      tags: ['hero', 'light', 'marketing', 'banner'],
      format: 'png',
      alt_text: 'Trendzo platform hero image - light theme',
      description: 'Hero banner image for light theme'
    },
    hero_dark: {
      id: 'hero-dark',
      name: 'Hero Image Dark',
      path: '/images/hero/hero-dark.png',
      type: 'image' as const,
      category: 'marketing',
      tags: ['hero', 'dark', 'marketing', 'banner'],
      format: 'png',
      alt_text: 'Trendzo platform hero image - dark theme',
      description: 'Hero banner image for dark theme'
    }
  },

  // ===== CONTENT IMAGES =====
  content: {
    dashboard_view: {
      id: 'dashboard-view',
      name: 'Dashboard View',
      path: '/images/content/trendzo-dashboard-view.png',
      type: 'image' as const,
      category: 'screenshots',
      tags: ['dashboard', 'interface', 'ui', 'preview'],
      format: 'png',
      alt_text: 'Trendzo dashboard interface',
      description: 'Screenshot of the main Trendzo dashboard'
    },
    // Netflix-style content examples
    stranger_things: {
      id: 'content-stranger-things',
      name: 'Stranger Things',
      path: '/images/content/stranger-things.jpg',
      type: 'image' as const,
      category: 'content_examples',
      tags: ['netflix', 'series', 'example', 'viral'],
      format: 'jpg',
      alt_text: 'Stranger Things promotional image',
      description: 'Example viral content - Stranger Things'
    },
    money_heist: {
      id: 'content-money-heist',
      name: 'Money Heist',
      path: '/images/content/money-heist.jpg',
      type: 'image' as const,
      category: 'content_examples',
      tags: ['netflix', 'series', 'example', 'viral'],
      format: 'jpg',
      alt_text: 'Money Heist promotional image',
      description: 'Example viral content - Money Heist'
    }
  },

  // ===== TEMPLATE THUMBNAILS =====
  templates: {
    placeholder: {
      id: 'template-placeholder',
      name: 'Template Placeholder',
      path: '/thumbnails/placeholder-template.jpg',
      type: 'image' as const,
      category: 'templates',
      tags: ['template', 'placeholder', 'thumbnail'],
      format: 'jpg',
      alt_text: 'Template placeholder thumbnail',
      description: 'Default placeholder for content templates'
    },
    template_1: {
      id: 'template-1',
      name: 'Template 1',
      path: '/thumbnails/template1.jpg',
      type: 'image' as const,
      category: 'templates',
      tags: ['template', 'thumbnail', 'viral'],
      format: 'jpg',
      alt_text: 'Content template 1 thumbnail',
      description: 'Thumbnail for viral content template 1'
    },
    template_2: {
      id: 'template-2',
      name: 'Template 2',
      path: '/thumbnails/template2.jpg',
      type: 'image' as const,
      category: 'templates',
      tags: ['template', 'thumbnail', 'viral'],
      format: 'jpg',
      alt_text: 'Content template 2 thumbnail',
      description: 'Thumbnail for viral content template 2'
    }
  },

  // ===== AUDIO ASSETS =====
  audio: {
    electronic_beat: {
      id: 'audio-electronic-beat',
      name: 'Electronic Beat',
      path: '/audio/electronic-beat.mp3',
      type: 'audio' as const,
      category: 'music',
      tags: ['electronic', 'beat', 'background', 'trending'],
      format: 'mp3',
      alt_text: 'Electronic beat audio track',
      description: 'Trending electronic beat for content creation'
    },
    guitar_acoustic: {
      id: 'audio-guitar-acoustic',
      name: 'Acoustic Guitar',
      path: '/audio/guitar-acoustic.mp3',
      type: 'audio' as const,
      category: 'music',
      tags: ['guitar', 'acoustic', 'background', 'calm'],
      format: 'mp3',
      alt_text: 'Acoustic guitar audio track',
      description: 'Calm acoustic guitar track for content'
    },
    piano_melody: {
      id: 'audio-piano-melody',
      name: 'Piano Melody',
      path: '/audio/piano-melody.mp3',
      type: 'audio' as const,
      category: 'music',
      tags: ['piano', 'melody', 'background', 'emotional'],
      format: 'mp3',
      alt_text: 'Piano melody audio track',
      description: 'Emotional piano melody for content creation'
    }
  },

  // ===== WORKFLOW DOCUMENTS =====
  workflows: {
    template_workflow: {
      id: 'workflow-template',
      name: 'Template Workflow Guide',
      path: '/workflows/1-template-workflow/index.pdf',
      type: 'document' as const,
      category: 'documentation',
      tags: ['workflow', 'template', 'guide', 'pdf'],
      format: 'pdf',
      alt_text: 'Template workflow guide PDF',
      description: 'Step-by-step guide for template workflow'
    },
    analyzer_workflow: {
      id: 'workflow-analyzer',
      name: 'Analyzer Workflow Guide',
      path: '/workflows/2-analyzer-workflow/index.pdf',
      type: 'document' as const,
      category: 'documentation',
      tags: ['workflow', 'analyzer', 'guide', 'pdf'],
      format: 'pdf',
      alt_text: 'Analyzer workflow guide PDF',
      description: 'Step-by-step guide for analyzer workflow'
    }
  },

  // ===== AVATARS & PLACEHOLDERS =====
  avatars: {
    default_avatar: {
      id: 'avatar-default',
      name: 'Default Avatar',
      path: '/default-avatar.png',
      type: 'image' as const,
      category: 'avatars',
      tags: ['avatar', 'default', 'user', 'placeholder'],
      format: 'png',
      alt_text: 'Default user avatar',
      description: 'Default avatar for users without profile picture'
    }
  }
};

// ===== ASSET MANAGER CLASS =====

export class AssetManager {
  private static instance: AssetManager;
  private cache: Map<string, string> = new Map();
  private preloadedAssets: Set<string> = new Set();

  private constructor() {
    // Initialize with critical assets preloading
    this.preloadCriticalAssets();
  }

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // ===== ASSET RETRIEVAL =====

  /**
   * Get asset by ID from catalog
   */
  getAsset(assetId: string): AssetMetadata | null {
    // Search through all categories
    for (const category of Object.values(assetCatalog)) {
      for (const asset of Object.values(category)) {
        if (asset.id === assetId) {
          return asset as AssetMetadata;
        }
      }
    }
    return null;
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: string): AssetMetadata[] {
    const assets: AssetMetadata[] = [];
    
    for (const categoryAssets of Object.values(assetCatalog)) {
      for (const asset of Object.values(categoryAssets)) {
        if (asset.category === category) {
          assets.push(asset as AssetMetadata);
        }
      }
    }
    
    return assets;
  }

  /**
   * Get assets by tags
   */
  getAssetsByTags(tags: string[]): AssetMetadata[] {
    const assets: AssetMetadata[] = [];
    
    for (const categoryAssets of Object.values(assetCatalog)) {
      for (const asset of Object.values(categoryAssets)) {
        const assetTags = asset.tags || [];
        if (tags.some(tag => assetTags.includes(tag))) {
          assets.push(asset as AssetMetadata);
        }
      }
    }
    
    return assets;
  }

  /**
   * Search assets by name or description
   */
  searchAssets(query: string): AssetMetadata[] {
    const assets: AssetMetadata[] = [];
    const searchTerm = query.toLowerCase();
    
    for (const categoryAssets of Object.values(assetCatalog)) {
      for (const asset of Object.values(categoryAssets)) {
        const matchesName = asset.name.toLowerCase().includes(searchTerm);
        const matchesDescription = asset.description?.toLowerCase().includes(searchTerm);
        const matchesTags = asset.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (matchesName || matchesDescription || matchesTags) {
          assets.push(asset as AssetMetadata);
        }
      }
    }
    
    return assets;
  }

  // ===== RESPONSIVE IMAGES =====

  /**
   * Generate responsive image set for Next.js Image component
   */
  getResponsiveImage(assetId: string, sizes?: string): ResponsiveImageSet | null {
    const asset = this.getAsset(assetId);
    if (!asset || asset.type !== 'image') return null;

    // For SVGs, return simple set
    if (asset.format === 'svg') {
      return {
        src: asset.path,
        srcSet: asset.path,
        sizes: sizes || '100vw',
        alt: asset.alt_text || asset.name,
        width: asset.dimensions?.width || 100,
        height: asset.dimensions?.height || 100
      };
    }

    // For raster images, generate responsive variants
    const basePath = asset.path.replace(/\.[^/.]+$/, '');
    const extension = asset.format;

    return {
      src: asset.path,
      srcSet: [
        `${basePath}-400w.${extension} 400w`,
        `${basePath}-800w.${extension} 800w`,
        `${basePath}-1200w.${extension} 1200w`,
        `${asset.path} ${asset.dimensions?.width || 1600}w`
      ].join(', '),
      sizes: sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      alt: asset.alt_text || asset.name,
      width: asset.dimensions?.width || 800,
      height: asset.dimensions?.height || 600
    };
  }

  // ===== PRELOADING =====

  /**
   * Preload critical assets for better performance
   */
  private async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      'logo-flame-icon',
      'logo-text',
      'hero-dark',
      'avatar-default'
    ];

    for (const assetId of criticalAssets) {
      await this.preloadAsset(assetId);
    }
  }

  /**
   * Preload specific asset
   */
  async preloadAsset(assetId: string): Promise<void> {
    if (this.preloadedAssets.has(assetId)) return;

    const asset = this.getAsset(assetId);
    if (!asset) return;

    try {
      if (asset.type === 'image' || asset.type === 'icon') {
        const img = new Image();
        img.src = asset.path;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } else if (asset.type === 'audio') {
        const audio = new Audio();
        audio.src = asset.path;
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = resolve;
          audio.onerror = reject;
        });
      }

      this.preloadedAssets.add(assetId);
    } catch (error) {
      console.warn(`Failed to preload asset ${assetId}:`, error);
    }
  }

  // ===== OPTIMIZATION =====

  /**
   * Get optimized asset URL with parameters
   */
  getOptimizedAssetUrl(assetId: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  }): string {
    const asset = this.getAsset(assetId);
    if (!asset) return '';

    // For SVGs, return as-is
    if (asset.format === 'svg') {
      return asset.path;
    }

    // For other formats, apply optimizations
    let optimizedUrl = asset.path;
    
    if (options) {
      const params = new URLSearchParams();
      
      if (options.width) params.set('w', options.width.toString());
      if (options.height) params.set('h', options.height.toString());
      if (options.quality) params.set('q', options.quality.toString());
      if (options.format) params.set('f', options.format);
      
      if (params.toString()) {
        optimizedUrl += `?${params.toString()}`;
      }
    }

    return optimizedUrl;
  }

  // ===== BRAND ASSETS =====

  /**
   * Get brand-specific logo based on context
   */
  getBrandLogo(context: 'header' | 'footer' | 'hero' | 'icon' = 'header'): string {
    switch (context) {
      case 'icon':
        return assetCatalog.logos.flame_icon.path;
      case 'hero':
        return assetCatalog.logos.full_logo.path;
      case 'header':
        return assetCatalog.logos.text_logo.path;
      case 'footer':
        return assetCatalog.logos.main_logo.path;
      default:
        return assetCatalog.logos.main_logo.path;
    }
  }

  /**
   * Get platform-specific assets
   */
  getPlatformAssets(platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter'): AssetMetadata[] {
    return this.getAssetsByTags([platform]);
  }

  /**
   * Get template thumbnails
   */
  getTemplateThumbnails(): AssetMetadata[] {
    return this.getAssetsByCategory('templates');
  }

  /**
   * Get audio assets for content creation
   */
  getAudioAssets(): AssetMetadata[] {
    return this.getAssetsByCategory('music');
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Clear asset cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; preloaded: number } {
    return {
      size: this.cache.size,
      preloaded: this.preloadedAssets.size
    };
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get asset manager instance
 */
export function getAssetManager(): AssetManager {
  return AssetManager.getInstance();
}

/**
 * Quick asset path getter
 */
export function getAssetPath(assetId: string): string {
  const asset = getAssetManager().getAsset(assetId);
  return asset?.path || '';
}

/**
 * Quick brand logo getter
 */
export function getBrandLogo(context?: 'header' | 'footer' | 'hero' | 'icon'): string {
  return getAssetManager().getBrandLogo(context);
}

/**
 * Quick responsive image getter
 */
export function getResponsiveImage(assetId: string, sizes?: string): ResponsiveImageSet | null {
  return getAssetManager().getResponsiveImage(assetId, sizes);
}

export default AssetManager;






















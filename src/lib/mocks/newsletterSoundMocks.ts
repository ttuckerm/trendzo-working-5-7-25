import { WeeklyTrendingSoundsShowcase, NewsletterSoundRecommendation, SoundPerformanceData } from '@/lib/types/newsletter';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock data for newsletter sound showcase
 * This is used as a fallback when the Firebase backend is not available
 */

// Mock sound recommendations
const mockSoundRecommendations: NewsletterSoundRecommendation[] = [
  {
    soundId: 'sound-001',
    soundTitle: 'Summer Vibes Beat',
    authorName: 'MusicProducer',
    category: 'Pop',
    thumbnailUrl: 'https://via.placeholder.com/150',
    templatePairings: [
      {
        templateId: 'template-001',
        templateTitle: 'Dance Challenge',
        correlationScore: 92
      },
      {
        templateId: 'template-002',
        templateTitle: 'Summer Story',
        correlationScore: 85
      }
    ],
    trendingStatus: 'growing',
    weeklyChange: 345,
    playUrl: 'https://example.com/audio/summer-vibes.mp3'
  },
  {
    soundId: 'sound-002',
    soundTitle: 'Epic Cinematic Intro',
    authorName: 'SoundDesigner',
    category: 'Cinematic',
    thumbnailUrl: 'https://via.placeholder.com/150',
    templatePairings: [
      {
        templateId: 'template-003',
        templateTitle: 'Product Showcase',
        correlationScore: 88
      },
      {
        templateId: 'template-004',
        templateTitle: 'Dramatic Reveal',
        correlationScore: 94
      }
    ],
    trendingStatus: 'peaking',
    weeklyChange: 567,
    playUrl: 'https://example.com/audio/epic-intro.mp3'
  },
  {
    soundId: 'sound-003',
    soundTitle: 'Lofi Study Beats',
    authorName: 'ChillBeats',
    category: 'Lo-fi',
    thumbnailUrl: 'https://via.placeholder.com/150',
    templatePairings: [
      {
        templateId: 'template-005',
        templateTitle: 'Study Vlog',
        correlationScore: 95
      },
      {
        templateId: 'template-006',
        templateTitle: 'Day in the Life',
        correlationScore: 87
      }
    ],
    trendingStatus: 'emerging',
    weeklyChange: 234,
    playUrl: 'https://example.com/audio/lofi-beats.mp3'
  },
  {
    soundId: 'sound-004',
    soundTitle: 'Trending TikTok Sound',
    authorName: 'ViralSounds',
    category: 'Trending',
    thumbnailUrl: 'https://via.placeholder.com/150',
    templatePairings: [
      {
        templateId: 'template-007',
        templateTitle: 'Viral Challenge',
        correlationScore: 98
      },
      {
        templateId: 'template-008',
        templateTitle: 'Transition Effects',
        correlationScore: 91
      }
    ],
    trendingStatus: 'peaking',
    weeklyChange: 789,
    playUrl: 'https://example.com/audio/tiktok-trend.mp3'
  },
  {
    soundId: 'sound-005',
    soundTitle: 'Upbeat Corporate Music',
    authorName: 'BusinessBeats',
    category: 'Corporate',
    thumbnailUrl: 'https://via.placeholder.com/150',
    templatePairings: [
      {
        templateId: 'template-009',
        templateTitle: 'Business Intro',
        correlationScore: 96
      },
      {
        templateId: 'template-010',
        templateTitle: 'Product Demo',
        correlationScore: 89
      }
    ],
    trendingStatus: 'stable',
    weeklyChange: 123,
    playUrl: 'https://example.com/audio/corporate.mp3'
  }
];

// Mock Weekly Trending Sounds Showcase
export const getMockWeeklyShowcase = (): WeeklyTrendingSoundsShowcase => {
  return {
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    title: `Weekly Trending Sounds - ${new Date().toLocaleDateString()}`,
    description: 'Discover this week\'s trending sounds to boost your content performance.',
    sounds: mockSoundRecommendations,
    createdAt: new Date().toISOString()
  };
};

// Mock Sound Performance Data
export const getMockSoundPerformanceData = (soundId: string): SoundPerformanceData => {
  const soundMap: Record<string, SoundPerformanceData> = {
    'sound-001': {
      soundId: 'sound-001',
      title: 'Summer Vibes Beat',
      authorName: 'MusicProducer',
      usageCount: 8547,
      weeklyChange: 345,
      trendDirection: 'up',
      topTemplates: [
        { templateId: 'template-001', templateTitle: 'Dance Challenge', usageCount: 2345 },
        { templateId: 'template-002', templateTitle: 'Summer Story', usageCount: 1890 }
      ],
      trackingUrl: '/api/sounds/performance-tracking?soundId=sound-001',
      engagement: {
        clicks: 12456,
        completionRate: 0.78,
        conversionRate: 0.23,
        averageDuration: 28.5,
        returningUsers: 3241
      },
      demographics: {
        age: { '13-17': 15, '18-24': 45, '25-34': 30, '35+': 10 },
        location: { 'US': 40, 'UK': 15, 'Canada': 10, 'Australia': 8, 'Other': 27 },
        device: { 'Mobile': 75, 'Desktop': 20, 'Tablet': 5 }
      },
      trends: {
        hourly: Array(24).fill(0).map((_, hour) => ({ 
          hour, 
          count: Math.floor(100 + Math.sin(hour / 3) * 50 + Math.random() * 30) 
        })),
        daily: Array(7).fill(0).map((_, day) => ({ 
          date: new Date(Date.now() - (6 - day) * 86400000).toISOString().split('T')[0], 
          count: Math.floor(500 + Math.random() * 300) 
        })),
        monthly: Array(6).fill(0).map((_, month) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - month));
          return { month: date.toLocaleString('default', { month: 'short' }), count: Math.floor(2000 + Math.random() * 1000) };
        }),
        seasonal: [
          { season: 'Winter', count: 6500 },
          { season: 'Spring', count: 7800 },
          { season: 'Summer', count: 8900 },
          { season: 'Fall', count: 7200 }
        ]
      }
    },
    'sound-002': {
      soundId: 'sound-002',
      title: 'Epic Cinematic Intro',
      authorName: 'SoundDesigner',
      usageCount: 6789,
      weeklyChange: 567,
      trendDirection: 'up',
      topTemplates: [
        { templateId: 'template-003', templateTitle: 'Product Showcase', usageCount: 1845 },
        { templateId: 'template-004', templateTitle: 'Dramatic Reveal', usageCount: 1456 }
      ],
      trackingUrl: '/api/sounds/performance-tracking?soundId=sound-002',
      engagement: {
        clicks: 9876,
        completionRate: 0.85,
        conversionRate: 0.31,
        averageDuration: 42.3,
        returningUsers: 2987
      },
      demographics: {
        age: { '13-17': 5, '18-24': 25, '25-34': 45, '35+': 25 },
        location: { 'US': 35, 'UK': 18, 'Canada': 12, 'Germany': 10, 'Other': 25 },
        device: { 'Mobile': 65, 'Desktop': 30, 'Tablet': 5 }
      },
      trends: {
        hourly: Array(24).fill(0).map((_, hour) => ({ 
          hour, 
          count: Math.floor(80 + Math.cos(hour / 4) * 40 + Math.random() * 25) 
        })),
        daily: Array(7).fill(0).map((_, day) => ({ 
          date: new Date(Date.now() - (6 - day) * 86400000).toISOString().split('T')[0], 
          count: Math.floor(400 + Math.random() * 250) 
        })),
        monthly: Array(6).fill(0).map((_, month) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - month));
          return { month: date.toLocaleString('default', { month: 'short' }), count: Math.floor(1800 + Math.random() * 900) };
        }),
        seasonal: [
          { season: 'Winter', count: 5400 },
          { season: 'Spring', count: 6700 },
          { season: 'Summer', count: 5900 },
          { season: 'Fall', count: 7800 }
        ]
      }
    },
    'sound-003': {
      soundId: 'sound-003',
      title: 'Lofi Study Beats',
      authorName: 'ChillBeats',
      usageCount: 4567,
      weeklyChange: 234,
      trendDirection: 'up',
      topTemplates: [
        { templateId: 'template-005', templateTitle: 'Study Vlog', usageCount: 1245 },
        { templateId: 'template-006', templateTitle: 'Day in the Life', usageCount: 987 }
      ],
      trackingUrl: '/api/sounds/performance-tracking?soundId=sound-003',
      engagement: {
        clicks: 7654,
        completionRate: 0.92,
        conversionRate: 0.18,
        averageDuration: 64.7,
        returningUsers: 3876
      },
      demographics: {
        age: { '13-17': 20, '18-24': 50, '25-34': 20, '35+': 10 },
        location: { 'US': 30, 'UK': 12, 'Canada': 10, 'Japan': 15, 'Other': 33 },
        device: { 'Mobile': 60, 'Desktop': 35, 'Tablet': 5 }
      },
      trends: {
        hourly: Array(24).fill(0).map((_, hour) => ({ 
          hour, 
          count: Math.floor(120 + Math.sin((hour - 6) / 4) * 60 + Math.random() * 30) 
        })),
        daily: Array(7).fill(0).map((_, day) => ({ 
          date: new Date(Date.now() - (6 - day) * 86400000).toISOString().split('T')[0], 
          count: Math.floor(350 + Math.random() * 200) 
        })),
        monthly: Array(6).fill(0).map((_, month) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - month));
          return { month: date.toLocaleString('default', { month: 'short' }), count: Math.floor(1600 + Math.random() * 800) };
        }),
        seasonal: [
          { season: 'Winter', count: 4900 },
          { season: 'Spring', count: 3800 },
          { season: 'Summer', count: 3400 },
          { season: 'Fall', count: 5200 }
        ]
      }
    },
    'sound-004': {
      soundId: 'sound-004',
      title: 'Trending TikTok Sound',
      authorName: 'ViralSounds',
      usageCount: 12567,
      weeklyChange: 789,
      trendDirection: 'up',
      topTemplates: [
        { templateId: 'template-007', templateTitle: 'Viral Challenge', usageCount: 4321 },
        { templateId: 'template-008', templateTitle: 'Transition Effects', usageCount: 3456 }
      ],
      trackingUrl: '/api/sounds/performance-tracking?soundId=sound-004',
      engagement: {
        clicks: 23456,
        completionRate: 0.71,
        conversionRate: 0.42,
        averageDuration: 15.8,
        returningUsers: 5432
      },
      demographics: {
        age: { '13-17': 35, '18-24': 45, '25-34': 15, '35+': 5 },
        location: { 'US': 45, 'UK': 12, 'Canada': 8, 'Brazil': 7, 'Other': 28 },
        device: { 'Mobile': 90, 'Desktop': 8, 'Tablet': 2 }
      },
      trends: {
        hourly: Array(24).fill(0).map((_, hour) => ({ 
          hour, 
          count: Math.floor(200 + Math.sin(hour / 2) * 100 + Math.random() * 50) 
        })),
        daily: Array(7).fill(0).map((_, day) => ({ 
          date: new Date(Date.now() - (6 - day) * 86400000).toISOString().split('T')[0], 
          count: Math.floor(800 + Math.random() * 400) 
        })),
        monthly: Array(6).fill(0).map((_, month) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - month));
          return { month: date.toLocaleString('default', { month: 'short' }), count: Math.floor(3000 + Math.random() * 2000) };
        }),
        seasonal: [
          { season: 'Winter', count: 10200 },
          { season: 'Spring', count: 11800 },
          { season: 'Summer', count: 14900 },
          { season: 'Fall', count: 12200 }
        ]
      }
    },
    'sound-005': {
      soundId: 'sound-005',
      title: 'Upbeat Corporate Music',
      authorName: 'BusinessBeats',
      usageCount: 3456,
      weeklyChange: 123,
      trendDirection: 'stable',
      topTemplates: [
        { templateId: 'template-009', templateTitle: 'Business Intro', usageCount: 987 },
        { templateId: 'template-010', templateTitle: 'Product Demo', usageCount: 765 }
      ],
      trackingUrl: '/api/sounds/performance-tracking?soundId=sound-005',
      engagement: {
        clicks: 5432,
        completionRate: 0.83,
        conversionRate: 0.27,
        averageDuration: 32.1,
        returningUsers: 1876
      },
      demographics: {
        age: { '13-17': 2, '18-24': 15, '25-34': 45, '35+': 38 },
        location: { 'US': 40, 'UK': 15, 'Canada': 10, 'Germany': 8, 'Other': 27 },
        device: { 'Mobile': 40, 'Desktop': 55, 'Tablet': 5 }
      },
      trends: {
        hourly: Array(24).fill(0).map((_, hour) => ({ 
          hour, 
          count: Math.floor(70 + Math.cos((hour - 10) / 3) * 35 + Math.random() * 20) 
        })),
        daily: Array(7).fill(0).map((_, day) => ({ 
          date: new Date(Date.now() - (6 - day) * 86400000).toISOString().split('T')[0], 
          count: Math.floor(300 + Math.random() * 150) 
        })),
        monthly: Array(6).fill(0).map((_, month) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - month));
          return { month: date.toLocaleString('default', { month: 'short' }), count: Math.floor(1400 + Math.random() * 700) };
        }),
        seasonal: [
          { season: 'Winter', count: 3200 },
          { season: 'Spring', count: 3600 },
          { season: 'Summer', count: 2900 },
          { season: 'Fall', count: 3800 }
        ]
      }
    }
  };

  // Return the specified sound or the first one as a fallback
  return soundMap[soundId] || soundMap['sound-001'];
};

/**
 * Get mock sound recommendations for a specific template
 * @param templateId The template ID to get recommendations for
 * @param limit Maximum number of recommendations to return (default: 3)
 * @returns Array of sound recommendations
 */
export const getMockTemplateSoundRecommendations = (templateId: string, limit: number = 3): NewsletterSoundRecommendation[] => {
  // Template categories for specialized recommendations
  const templateCategories: Record<string, string> = {
    'template-001': 'Dance',
    'template-002': 'Summer',
    'template-003': 'Product',
    'template-004': 'Dramatic',
    'template-005': 'Study',
    'template-006': 'Lifestyle',
    'template-007': 'Viral',
    'template-008': 'Transition',
    'template-009': 'Business',
    'template-010': 'Demo'
  };

  // Default template titles if not in the map
  const getTemplateTitle = (id: string): string => {
    const categoryMap: Record<string, string> = {
      'Dance': 'Dance Challenge',
      'Summer': 'Summer Story',
      'Product': 'Product Showcase',
      'Dramatic': 'Dramatic Reveal',
      'Study': 'Study Vlog',
      'Lifestyle': 'Day in the Life',
      'Viral': 'Viral Challenge',
      'Transition': 'Transition Effects',
      'Business': 'Business Intro',
      'Demo': 'Product Demo'
    };
    
    const category = templateCategories[id] || 'Generic';
    return categoryMap[category] || `Template ${id.substring(id.length - 3)}`;
  };
  
  // Filter sounds based on template category if possible
  let filteredSounds = [...mockSoundRecommendations];
  const templateCategory = templateCategories[templateId];
  
  if (templateCategory) {
    // Try to match sounds to template category (simple logic for mock data)
    filteredSounds = filteredSounds.map(sound => {
      // Create a copy with modified template pairings for this specific template
      return {
        ...sound,
        templatePairings: [
          {
            templateId: templateId,
            templateTitle: getTemplateTitle(templateId),
            correlationScore: Math.floor(Math.random() * 30) + 70 // Random score between 70-99
          },
          ...(sound.templatePairings || []).filter(p => p.templateId !== templateId)
        ]
      };
    });
    
    // Sort by a simple heuristic based on template name and sound category
    filteredSounds.sort((a, b) => {
      const aMatch = a.category.toLowerCase().includes(templateCategory.toLowerCase()) ? 1 : 0;
      const bMatch = b.category.toLowerCase().includes(templateCategory.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch || b.templatePairings[0].correlationScore - a.templatePairings[0].correlationScore;
    });
  }
  
  // Return limited results
  return filteredSounds.slice(0, limit);
}; 
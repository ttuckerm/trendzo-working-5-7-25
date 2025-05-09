/**
 * Mock data for sounds API endpoints
 * This is used when Firebase is not available or in development mode
 */
import { TikTokSound, SoundTrendReport } from '@/lib/types/tiktok';

// Generate sample mock sounds
export const mockSounds: TikTokSound[] = [
  createMockSound('sound-001', 'Viral Dance Beat', 'MusicProducer123', 'music', 'growing'),
  createMockSound('sound-002', 'Funny Voice Effect', 'ComedyCreator', 'voiceover', 'peaking'),
  createMockSound('sound-003', 'Trending Pop Song', 'PopStar', 'music', 'stable'),
  createMockSound('sound-004', 'Original Sound Mix', 'ContentCreator', 'original', 'emerging'),
  createMockSound('sound-005', 'Remix Viral Track', 'DJ_Mixer', 'remix', 'declining'),
  createMockSound('sound-006', 'Epic Soundtrack', 'FilmComposer', 'music', 'growing'),
  createMockSound('sound-007', 'Voice Tutorial', 'VoiceoverArtist', 'voiceover', 'stable'),
  createMockSound('sound-008', 'Lo-Fi Beat', 'ChillProducer', 'music', 'emerging'),
  createMockSound('sound-009', 'Ambient Sounds', 'SoundDesigner', 'soundEffect', 'stable'),
  createMockSound('sound-010', 'Viral Challenge Music', 'TrendSetter', 'music', 'peaking'),
  createMockSound('sound-011', 'Comedy Skit Audio', 'FunnyPerson', 'voiceover', 'growing'),
  createMockSound('sound-012', 'EDM Drop', 'DJMaster', 'music', 'peaking'),
  createMockSound('sound-013', 'Sound Effect Pack', 'SFXCreator', 'soundEffect', 'stable'),
  createMockSound('sound-014', 'Piano Melody', 'PianistPro', 'music', 'emerging'),
  createMockSound('sound-015', 'Dramatic Voice', 'NarratorPro', 'voiceover', 'declining')
];

// Mock categories
export const mockCategories = {
  soundCategories: ['music', 'voiceover', 'soundEffect', 'remix', 'original', 'mixed'],
  genres: ['pop', 'rock', 'hip-hop', 'electronic', 'dance', 'ambient', 'jazz'],
  moods: ['happy', 'energetic', 'calm', 'sad', 'intense', 'relaxed', 'focused'],
  tempos: ['slow', 'medium', 'fast']
};

// Mock statistics
export const mockStats = {
  soundCategories: {
    music: 7,
    voiceover: 4,
    soundEffect: 2, 
    remix: 1,
    original: 1
  },
  genres: {
    pop: 4,
    electronic: 3,
    dance: 3,
    ambient: 2,
    rock: 2,
    'hip-hop': 1
  },
  moods: {
    energetic: 5,
    happy: 4,
    calm: 3,
    relaxed: 2,
    intense: 1
  },
  tempos: {
    medium: 7,
    fast: 5,
    slow: 3
  }
};

// Mock template objects
export const mockTemplates = [
  {
    id: 'template-001',
    title: 'Product Showcase',
    category: 'marketing'
  },
  {
    id: 'template-002',
    title: 'Dance Tutorial',
    category: 'entertainment'
  },
  {
    id: 'template-003',
    title: 'Comedy Skit',
    category: 'comedy'
  }
];

/**
 * Create a mock sound with realistic data
 */
function createMockSound(
  id: string,
  title: string,
  authorName: string,
  category: string,
  stage: 'emerging' | 'growing' | 'peaking' | 'declining' | 'stable'
): TikTokSound {
  // Current date and dates for history
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Generate usage history over past 30 days
  const usageHistory: Record<string, number> = {};
  let usageCount = Math.floor(Math.random() * 5000) + 1000;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Different growth patterns based on stage
    let growthFactor = 1.0;
    
    if (stage === 'emerging') {
      growthFactor = 1.1 + (Math.random() * 0.1); // Slow start
    } else if (stage === 'growing') {
      growthFactor = 1.2 + (Math.random() * 0.2); // Accelerating
    } else if (stage === 'peaking') {
      growthFactor = i > 15 ? 1.2 : 1.05; // Slowing down
    } else if (stage === 'declining') {
      growthFactor = i > 20 ? 1.2 : 0.95; // Declining
    } else {
      growthFactor = 1.01 + (Math.random() * 0.02); // Stable
    }
    
    usageCount = Math.floor(usageCount * growthFactor);
    usageHistory[dateStr] = usageCount;
  }
  
  // Calculate change metrics
  const today7d = new Date();
  today7d.setDate(today.getDate() - 7);
  const date7dAgo = today7d.toISOString().split('T')[0];
  
  const today14d = new Date();
  today14d.setDate(today.getDate() - 14);
  const date14dAgo = today14d.toISOString().split('T')[0];
  
  const today30d = new Date();
  today30d.setDate(today.getDate() - 30);
  const date30dAgo = today30d.toISOString().split('T')[0];
  
  const currentUsage = usageHistory[todayStr] || 0;
  const usageChange7d = currentUsage - (usageHistory[date7dAgo] || 0);
  const usageChange14d = currentUsage - (usageHistory[date14dAgo] || 0);
  const usageChange30d = currentUsage - (usageHistory[date30dAgo] || 0);
  
  // Calculate growth velocity (change per day)
  const velocity7d = usageChange7d / 7;
  const velocity14d = usageChange14d / 14;
  const velocity30d = usageChange30d / 30;
  
  // Determine trend
  let trend: 'rising' | 'stable' | 'falling' = 'stable';
  if (velocity7d > 0) {
    trend = 'rising';
  } else if (velocity7d < 0) {
    trend = 'falling';
  }
  
  // Find peak usage
  let peakUsage = 0;
  let peakDate = todayStr;
  Object.entries(usageHistory).forEach(([date, usage]) => {
    if (usage > peakUsage) {
      peakUsage = usage;
      peakDate = date;
    }
  });
  
  // Create base genres based on category
  const genres = category === 'music' ? 
    [['pop', 'rock', 'hip-hop', 'electronic', 'dance'][Math.floor(Math.random() * 5)]] : 
    [];
  
  // Create mood based on stage and genre
  let moods: string[] = [];
  if (stage === 'growing' || stage === 'peaking') {
    moods = ['energetic', 'intense'];
  } else if (stage === 'declining') {
    moods = ['calm', 'sad'];
  } else {
    moods = ['happy', 'relaxed', 'focused'];
  }
  
  // Mix it up a bit to avoid deterministic patterns
  if (Math.random() > 0.7) {
    moods = [['happy', 'energetic', 'calm', 'sad', 'intense', 'relaxed', 'focused'][Math.floor(Math.random() * 7)]];
  }
  
  // Get a tempo
  const tempo = ['slow', 'medium', 'fast'][Math.floor(Math.random() * 3)] as any;
  
  // Create a virality score based on stage and trend
  let viralityScore = 0;
  if (stage === 'growing') {
    viralityScore = 60 + Math.random() * 30;
  } else if (stage === 'peaking') {
    viralityScore = 80 + Math.random() * 20;
  } else if (stage === 'emerging') {
    viralityScore = 30 + Math.random() * 30;
  } else if (stage === 'declining') {
    viralityScore = 10 + Math.random() * 40;
  } else {
    viralityScore = 40 + Math.random() * 20;
  }
  
  // Generate a playUrl for sample sounds
  const playUrl = `https://example.com/sounds/${id}.mp3`;
  
  return {
    id,
    title,
    authorName,
    playUrl,
    duration: Math.floor(Math.random() * 60) + 15,
    original: category === 'original',
    isRemix: category === 'remix',
    usageCount: currentUsage,
    creationDate: today.getTime() - (Math.random() * 90 * 24 * 60 * 60 * 1000), // 0-90 days ago
    stats: {
      usageCount: currentUsage,
      usageChange7d,
      usageChange14d,
      usageChange30d,
      growthVelocity7d: velocity7d,
      growthVelocity14d: velocity14d,
      growthVelocity30d: velocity30d,
      trend,
      peakUsage,
      peakDate,
      likeCount: Math.floor(Math.random() * 100000),
      commentCount: Math.floor(Math.random() * 10000),
      shareCount: Math.floor(Math.random() * 50000)
    },
    relatedTemplates: Math.random() > 0.5 ? 
      [['template-001', 'template-002', 'template-003'][Math.floor(Math.random() * 3)]] : 
      [],
    categories: [category, ...genres],
    soundCategory: category as any,
    mood: moods,
    tempo,
    language: 'en',
    viralityScore,
    classification: {
      genre: genres,
      style: category === 'music' ? [['modern', 'classic', 'indie'][Math.floor(Math.random() * 3)]] : undefined,
      vocals: Math.random() > 0.5
    },
    expertAnnotations: {
      qualityRating: Math.floor(Math.random() * 5) + 1,
      trendPotential: Math.floor(Math.random() * 10) + 1,
      notes: "This is a mock sound for testing"
    },
    lifecycle: {
      stage,
      discoveryDate: date30dAgo,
      lastDetectedDate: todayStr
    },
    usageHistory,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create mock template correlations between sounds and templates
 */
export function createMockTemplateCorrelations() {
  // Generate template correlations for each sound
  const soundsWithCorrelations = mockSounds.map(sound => {
    const correlations = [];
    
    // Add 1-3 random template correlations
    const numCorrelations = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numCorrelations; i++) {
      const template = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
      const correlationScore = Math.floor(Math.random() * 40) + 60; // 60-100
      const engagementLift = Math.floor(Math.random() * 80) - 20; // -20 to 60
      
      correlations.push({
        templateId: template.id,
        correlationScore,
        engagementLift
      });
    }
    
    return {
      ...sound,
      templateCorrelations: correlations
    };
  });
  
  return soundsWithCorrelations;
}

// Mock sounds with template correlations
export const mockSoundsWithCorrelations = createMockTemplateCorrelations();

// Mock trend report
export const mockTrendReport: SoundTrendReport = {
  id: 'report-001',
  date: new Date().toISOString().split('T')[0],
  topSounds: {
    daily: mockSounds.slice(0, 5).map(s => s.id),
    weekly: mockSounds.slice(3, 8).map(s => s.id),
    monthly: mockSounds.slice(5, 10).map(s => s.id)
  },
  emergingSounds: mockSounds.filter(s => s.lifecycle?.stage === 'emerging').map(s => s.id),
  peakingSounds: mockSounds.filter(s => s.lifecycle?.stage === 'peaking').map(s => s.id),
  decliningTrends: mockSounds.filter(s => s.lifecycle?.stage === 'declining').map(s => s.id),
  genreDistribution: {
    pop: 4,
    electronic: 3,
    dance: 3,
    ambient: 2,
    rock: 2,
    'hip-hop': 1
  },
  createdAt: new Date()
}; 
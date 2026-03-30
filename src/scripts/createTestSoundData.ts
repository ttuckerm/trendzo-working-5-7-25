// import { getFirestore, setDoc, doc } from 'firebase/firestore';
// import { initializeApp } from 'firebase/app';
// import { db as firebaseDb } from '../lib/firebase/firebase'; // firebaseDb will be null
import { TikTokSound } from '../lib/types/tiktok';
import { v4 as uuidv4 } from 'uuid';

const SCRIPT_DISABLED_MSG_PREFIX = "createTestSoundData script: Firebase backend is removed.";

// Collection names
const SOUNDS_COLLECTION = 'sounds';
const TREND_REPORTS_COLLECTION = 'soundTrendReports';

// Use the imported database instance or create a fallback for testing
const db = null; // firebaseDb is null, getFirestore is commented out. Explicitly null.

/**
 * Generate random test sound data
 */
async function createTestSoundData() {
  try {
    console.log('Creating test sound data (Firebase operations will be skipped)...');
    
    // Generate sample sounds
    const testSounds = [
      createTestSound('viral_dance_beat', 'Viral Dance Beat', 'MusicProducer123', 'music', 'growing'),
      createTestSound('funny_voice_effect', 'Funny Voice Effect', 'ComedyCreator', 'voiceover', 'peaking'),
      createTestSound('trending_pop_song', 'Trending Pop Song', 'PopStar', 'music', 'stable'),
      createTestSound('original_sound_mix', 'Original Sound Mix', 'ContentCreator', 'original', 'emerging'),
      createTestSound('remix_viral_track', 'Remix Viral Track', 'DJ_Mixer', 'remix', 'declining')
    ];
    
    // Store sounds
    for (const sound of testSounds) {
      // await setDoc(doc(db, SOUNDS_COLLECTION, sound.id), sound);
      console.warn(`${SCRIPT_DISABLED_MSG_PREFIX} Skipping setDoc for sound: ${sound.title} (ID: ${sound.id}). Data:`, sound);
      console.log(`Generated (but not stored) test sound: ${sound.title}`);
    }
    
    // Create a test trend report
    const trendReport = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      topSounds: {
        daily: testSounds.slice(0, 3).map(s => s.id),
        weekly: testSounds.slice(1, 4).map(s => s.id),
        monthly: testSounds.map(s => s.id)
      },
      emergingSounds: [testSounds[3].id],
      peakingSounds: [testSounds[1].id],
      decliningTrends: [testSounds[4].id],
      genreDistribution: {
        music: 2,
        voiceover: 1,
        original: 1,
        remix: 1
      },
      createdAt: new Date()
    };
    
    // await setDoc(doc(db, TREND_REPORTS_COLLECTION, trendReport.id), trendReport);
    console.warn(`${SCRIPT_DISABLED_MSG_PREFIX} Skipping setDoc for trend report: ${trendReport.id}. Data:`, trendReport);
    console.log(`Generated (but not stored) test trend report: ${trendReport.id}`);
    
    console.log('Test data generation completed (Firebase operations skipped).');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

/**
 * Create a test sound with realistic data
 */
function createTestSound(
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
  
  return {
    id,
    title,
    authorName,
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
    relatedTemplates: [],
    categories: [category, category === 'music' ? 'pop' : 'effect'],
    soundCategory: category as any,
    tempo: ['slow', 'medium', 'fast'][Math.floor(Math.random() * 3)] as any,
    language: 'en',
    viralityScore: Math.random() * 10,
    classification: {
      genre: category === 'music' ? ['pop', 'dance'] : [],
      vocals: Math.random() > 0.5
    },
    expertAnnotations: {
      qualityRating: Math.floor(Math.random() * 5) + 1,
      trendPotential: Math.floor(Math.random() * 10) + 1,
      notes: "Test sound created for schema validation"
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

// Execute if run directly
if (require.main === module) {
  createTestSoundData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { createTestSoundData }; 
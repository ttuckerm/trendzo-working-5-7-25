import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function generateSyntheticVideos(count: number) {
  console.log(`Generating ${count} synthetic videos...`);
  
  const syntheticData = [];
  const niches = ['fitness', 'finance', 'tech', 'beauty', 'food'];
  
  for (let i = 0; i < count; i++) {
    const niche = niches[Math.floor(Math.random() * niches.length)];
    const hasPattern = Math.random() > 0.5;
    
    const video = {
      id: `syn_${Date.now()}_${i}`,
      niche,
      dps_score: hasPattern ? 80 + Math.random() * 20 : 40 + Math.random() * 40,
      pattern_matches: hasPattern ? 1 : 0,
      pattern_confidence: hasPattern ? 0.8 + Math.random() * 0.2 : 0,
      is_synthetic: true,
      created_at: new Date().toISOString()
    };
    
    syntheticData.push(video);
  }
  
  // In a real scenario, we'd write this to a CSV or DB
  console.log(`Generated ${syntheticData.length} samples.`);
  return syntheticData;
}

// If run directly
if (require.main === module) {
  generateSyntheticVideos(10000).then(() => console.log('Done'));
}







import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * =================================================================================
 * TEMPLATE DISCOVERY ENGINE
 * 
 * This engine analyzes video performance data to identify and extract viral patterns.
 * It forms the basis of the "Recipe Book" by generating actionable content templates.
 * =================================================================================
 */

// Type definitions for our discovered patterns and recipes
// We'll expand these as we build the algorithm

interface ViralPattern {
  type: 'sound' | 'hashtag' | 'keyword' | 'duration_range';
  value: string | { min: number; max: number };
  score: number; // How strongly this pattern correlates with virality
  video_examples: string[]; // examples of videos that use this pattern
}

interface ContentRecipe {
  id: string;
  title: string;
  description: string;
  success_rate: number; // Predicted success rate (0-1)
  patterns: ViralPattern[];
  created_at: string;
}

export class TemplateDiscoveryEngine {

  /**
   * Main function to run the discovery process.
   * This will be the entry point for a daily job.
   */
  public static async generateDailyRecipes(): Promise<ContentRecipe[]> {
    console.log('🚀 Starting daily recipe generation...');

    // 1. Fetch high-performing videos from the last 7 days
    const viralVideos = await this.fetchViralVideos();
    if (!viralVideos || viralVideos.length === 0) {
      console.log('No recent viral videos found. Skipping recipe generation.');
      return [];
    }
    console.log(`Analyzing ${viralVideos.length} viral videos...`);

    // 2. Analyze patterns (sounds, hashtags, etc.)
    const soundPatterns = this.analyzeSoundPatterns(viralVideos);
    const hashtagPatterns = this.analyzeHashtagPatterns(viralVideos);
    // ... more pattern analysis to come

    // 3. Combine patterns into recipes (this will get more sophisticated)
    const recipes = this.createRecipesFromPatterns([...soundPatterns, ...hashtagPatterns]);
    console.log(`✅ Generated ${recipes.length} new content recipes.`);

    // 4. Store recipes in the 'recipe_book_daily' table
    await this.storeRecipes(recipes);
    
    return recipes;
  }

  /**
   * Fetches recent videos that are considered "viral".
   * Definition of viral: > 1M views or high engagement scores (top 5% percentile).
   * We'll start with a simple view count threshold.
   */
  private static async fetchViralVideos(days: number = 7, minViews: number = 1000000) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .gt('view_count', minViews)
      .gt('upload_timestamp', dateThreshold.toISOString())
      .order('view_count', { ascending: false })
      .limit(100); // Limit to top 100 for now to keep it fast

    if (error) {
      console.error('Error fetching viral videos:', error);
      return null;
    }
    return data;
  }

  /**
   * Stores the generated recipes in the database.
   * It first clears out any old recipes for the current day.
   */
  private static async storeRecipes(recipes: ContentRecipe[]): Promise<void> {
    if (recipes.length === 0) {
      return;
    }

    // Clear any existing recipes for today to prevent duplicates on re-runs
    const today = new Date().toISOString().slice(0, 10);
    const { error: deleteError } = await supabase
      .from('recipe_book_daily')
      .delete()
      .eq('generation_date', today);

    if (deleteError) {
      console.error('Error clearing old recipes for today:', deleteError);
      // Continue anyway, upsert might handle it
    }

    const recordsToInsert = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      success_rate: recipe.success_rate,
      patterns: recipe.patterns,
      generation_date: today,
    }));

    const { error: insertError } = await supabase
      .from('recipe_book_daily')
      .insert(recordsToInsert);

    if (insertError) {
      console.error('Error storing new recipes:', insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${recipes.length} recipes in the database.`);
  }

  /**
   * Analyzes trending sounds from a set of videos.
   */
  private static analyzeSoundPatterns(videos: any[]): ViralPattern[] {
    const soundCounts = new Map<string, { count: number, video_ids: string[] }>();

    for (const video of videos) {
      if (video.sound_id && video.sound_name) {
        const soundKey = `${video.sound_id}|${video.sound_name}`;
        if (!soundCounts.has(soundKey)) {
          soundCounts.set(soundKey, { count: 0, video_ids: [] });
        }
        const current = soundCounts.get(soundKey)!;
        current.count++;
        current.video_ids.push(video.tiktok_id);
      }
    }

    const patterns: ViralPattern[] = [];
    for (const [soundKey, data] of soundCounts.entries()) {
      if (data.count > 1) { // Only consider sounds used in more than one viral video
        const [soundId, soundName] = soundKey.split('|');
        patterns.push({
          type: 'sound',
          value: soundName,
          score: data.count / videos.length, // simple score for now
          video_examples: data.video_ids.slice(0, 3) // first 3 examples
        });
      }
    }

    // Sort by score descending
    return patterns.sort((a, b) => b.score - a.score);
  }

  /**
   * Analyzes trending hashtags from a set of videos.
   */
  private static analyzeHashtagPatterns(videos: any[]): ViralPattern[] {
    const hashtagCounts = new Map<string, { count: number, video_ids: string[] }>();

    for (const video of videos) {
      if (video.hashtags && Array.isArray(video.hashtags)) {
        for (const tag of video.hashtags) {
          if (!hashtagCounts.has(tag)) {
            hashtagCounts.set(tag, { count: 0, video_ids: [] });
          }
          const current = hashtagCounts.get(tag)!;
          current.count++;
          current.video_ids.push(video.tiktok_id);
        }
      }
    }

    const patterns: ViralPattern[] = [];
    for (const [tag, data] of hashtagCounts.entries()) {
      if (data.count > 1) { // Only consider hashtags used in more than one viral video
        patterns.push({
          type: 'hashtag',
          value: tag,
          score: data.count / videos.length,
          video_examples: data.video_ids.slice(0, 3)
        });
      }
    }
    
    return patterns.sort((a, b) => b.score - a.score);
  }

  /**
   * A simple placeholder for combining patterns into recipes.
   * In the future, this will use more advanced logic to find co-occurring patterns.
   */
  private static createRecipesFromPatterns(patterns: ViralPattern[]): ContentRecipe[] {
    // For now, let's just create a recipe for the top pattern of each type
    const topSound = patterns.find(p => p.type === 'sound');
    const topHashtag = patterns.find(p => p.type === 'hashtag');

    const recipes: ContentRecipe[] = [];

    if (topSound) {
      recipes.push({
        id: `recipe-${Date.now()}-sound`,
        title: `Trending Sound: ${topSound.value}`,
        description: `This sound is frequently used in viral videos. Consider using it to boost your content.`,
        success_rate: topSound.score,
        patterns: [topSound],
        created_at: new Date().toISOString()
      });
    }

    if (topHashtag) {
      recipes.push({
        id: `recipe-${Date.now()}-hashtag`,
        title: `Viral Hashtag: #${topHashtag.value}`,
        description: `Leverage this trending hashtag to increase visibility.`,
        success_rate: topHashtag.score,
        patterns: [topHashtag],
        created_at: new Date().toISOString()
      });
    }
    
    return recipes;
  }
} 
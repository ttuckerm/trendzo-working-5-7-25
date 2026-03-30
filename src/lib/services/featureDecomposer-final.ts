/**
 * Advanced Content Analysis - Viral Pattern Recognition
 */
async function analyzeContentPatterns(
  audioFeatures: AudioFeatures,
  visualFeatures: VisualFeatures,
  caption: string,
  metrics: VideoMetrics
): Promise<ContentAnalysis> {
  try {
    // **1. Viral Indicators Analysis**
    const viralIndicators = calculateViralIndicators(audioFeatures, visualFeatures, caption);
    
    // **2. Engagement Predictors**
    const engagementPredictors = calculateEngagementPredictors(audioFeatures, visualFeatures, metrics);
    
    // **3. Content Categorization**
    const contentCategory = categorizeContent(caption, visualFeatures, audioFeatures);
    
    // **4. Trending Elements Detection**
    const trendingElements = detectTrendingElements(caption, audioFeatures, visualFeatures);

    return {
      viral_indicators: viralIndicators,
      engagement_predictors: engagementPredictors,
      content_category: contentCategory,
      trending_elements: trendingElements
    };

  } catch (error) {
    console.warn('Content analysis failed:', error);
    return createEmptyContentAnalysis();
  }
}

/**
 * Calculate viral strength indicators
 */
function calculateViralIndicators(
  audioFeatures: AudioFeatures,
  visualFeatures: VisualFeatures,
  caption: string
): ContentAnalysis['viral_indicators'] {
  // **Hook Strength**: Based on visual + audio opening seconds
  const hookStrength = Math.min(
    (visualFeatures.motion_analysis.avg_motion_intensity * 0.4) +
    (visualFeatures.color_analysis.brightness * 0.3) +
    (audioFeatures.volume_analysis.avg_volume > -20 ? 0.3 : 0),
    1
  );

  // **Emotional Intensity**: Face emotions + audio energy + caption sentiment
  const emotionalIntensity = Math.min(
    (visualFeatures.face_detection.face_emotions.length > 0 ? 0.4 : 0.1) +
    (audioFeatures.spectral_features.zero_crossing_rate * 0.3) +
    (caption.includes('!') || caption.includes('?') ? 0.3 : 0.1),
    1
  );

  // **Surprise Factor**: Motion changes + audio pauses + unexpected elements
  const surpriseFactor = Math.min(
    (visualFeatures.motion_analysis.scene_changes / 10 * 0.4) +
    (audioFeatures.pause_analysis.total_pauses > 0 ? 0.3 : 0) +
    (visualFeatures.object_detection.detected_objects.length > 2 ? 0.3 : 0.1),
    1
  );

  // **Relatability Score**: Face presence + common objects + accessible language
  const relatabilityScore = Math.min(
    (visualFeatures.face_detection.faces_detected > 0 ? 0.4 : 0.1) +
    (visualFeatures.object_detection.detected_objects.some(obj => 
      ['person', 'phone', 'food', 'car'].includes(obj.object)) ? 0.3 : 0) +
    (audioFeatures.transcript.length > 0 ? 0.3 : 0.1),
    1
  );

  return {
    hook_strength: hookStrength,
    emotional_intensity: emotionalIntensity,
    surprise_factor: surpriseFactor,
    relatability_score: relatabilityScore
  };
}

/**
 * Calculate engagement prediction scores
 */
function calculateEngagementPredictors(
  audioFeatures: AudioFeatures,
  visualFeatures: VisualFeatures,
  metrics: VideoMetrics
): ContentAnalysis['engagement_predictors'] {
  // **Watch Time Predictor**: Hook strength + pacing + content quality
  const watchTimePredictor = Math.min(
    (visualFeatures.motion_analysis.avg_motion_intensity * 0.3) +
    (audioFeatures.speaking_rate > 0 && audioFeatures.speaking_rate < 200 ? 0.4 : 0.2) +
    (visualFeatures.aesthetic_features.composition_score * 0.3),
    1
  );

  // **Share Likelihood**: Emotional impact + surprise + relatability
  const shareLikelihood = Math.min(
    (visualFeatures.face_detection.face_emotions.filter(e => 
      ['happy', 'surprise', 'anger'].includes(e.emotion)).length * 0.3) +
    (audioFeatures.transcript.split(' ').some(word => 
      ['amazing', 'incredible', 'shocking', 'wow'].includes(word.toLowerCase())) ? 0.4 : 0.1) +
    (visualFeatures.motion_analysis.scene_changes > 3 ? 0.3 : 0.1),
    1
  );

  // **Comment Likelihood**: Controversial elements + questions + face presence
  const commentLikelihood = Math.min(
    (audioFeatures.transcript.includes('?') ? 0.4 : 0.1) +
    (visualFeatures.face_detection.faces_detected > 0 ? 0.3 : 0.1) +
    (audioFeatures.transcript.split(' ').some(word => 
      ['think', 'opinion', 'believe', 'agree'].includes(word.toLowerCase())) ? 0.3 : 0.1),
    1
  );

  // **Save Likelihood**: Educational value + visual appeal + usefulness
  const saveLikelihood = Math.min(
    (audioFeatures.transcript.split(' ').some(word => 
      ['how', 'tutorial', 'tip', 'hack', 'learn'].includes(word.toLowerCase())) ? 0.4 : 0.1) +
    (visualFeatures.aesthetic_features.composition_score * 0.3) +
    (visualFeatures.text_analysis.ocr_text.length > 0 ? 0.3 : 0.1),
    1
  );

  return {
    watch_time_predictor: watchTimePredictor,
    share_likelihood: shareLikelihood,
    comment_likelihood: commentLikelihood,
    save_likelihood: saveLikelihood
  };
}

/**
 * Categorize content based on multimodal analysis
 */
function categorizeContent(
  caption: string,
  visualFeatures: VisualFeatures,
  audioFeatures: AudioFeatures
): ContentAnalysis['content_category'] {
  const text = (caption + ' ' + audioFeatures.transcript).toLowerCase();
  
  // Define category keywords
  const categories = {
    'fitness': ['workout', 'gym', 'exercise', 'fitness', 'health'],
    'food': ['food', 'recipe', 'cooking', 'eat', 'delicious'],
    'education': ['learn', 'tutorial', 'how to', 'explain', 'teach'],
    'entertainment': ['funny', 'comedy', 'joke', 'fun', 'laugh'],
    'lifestyle': ['daily', 'routine', 'life', 'vlog', 'day'],
    'beauty': ['makeup', 'skincare', 'beauty', 'hair', 'style'],
    'technology': ['tech', 'app', 'ai', 'computer', 'software'],
    'business': ['business', 'money', 'entrepreneur', 'work'],
    'travel': ['travel', 'trip', 'vacation', 'explore']
  };

  let primaryCategory = 'general';
  let maxScore = 0;
  const secondaryCategories: string[] = [];

  for (const [category, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    const score = matches / keywords.length;
    
    if (score > maxScore) {
      if (maxScore > 0.1) secondaryCategories.push(primaryCategory);
      primaryCategory = category;
      maxScore = score;
    } else if (score > 0.1) {
      secondaryCategories.push(category);
    }
  }

  // Calculate niche specificity
  const nicheSpecificity = Math.min(maxScore * 2, 1);

  return {
    primary_category: primaryCategory,
    secondary_categories: secondaryCategories,
    niche_specificity: nicheSpecificity
  };
}

/**
 * Detect trending elements and format compliance
 */
function detectTrendingElements(
  caption: string,
  audioFeatures: AudioFeatures,
  visualFeatures: VisualFeatures
): ContentAnalysis['trending_elements'] {
  const text = (caption + ' ' + audioFeatures.transcript).toLowerCase();
  
  // Check for trending audio patterns
  const usesTrendingAudio = audioFeatures.volume_analysis.dynamic_range > 20 && 
    audioFeatures.spectral_features.zero_crossing_rate > 0.2;

  // Check for trending format indicators
  const followsTrendingFormat = 
    visualFeatures.motion_analysis.scene_changes > 2 && 
    visualFeatures.face_detection.faces_detected > 0 &&
    audioFeatures.speaking_rate > 120;

  // Calculate seasonal relevance
  const now = new Date();
  const month = now.getMonth();
  const seasonalKeywords = {
    winter: ['winter', 'snow', 'cold', 'holiday', 'christmas'],
    spring: ['spring', 'flower', 'fresh', 'new'],
    summer: ['summer', 'beach', 'hot', 'vacation', 'sun'],
    fall: ['fall', 'autumn', 'halloween', 'thanksgiving']
  };

  let seasonalRelevance = 0;
  const currentSeason = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall';
  const currentSeasonKeywords = seasonalKeywords[currentSeason];
  seasonalRelevance = currentSeasonKeywords.filter(keyword => text.includes(keyword)).length / currentSeasonKeywords.length;

  // Generate hashtag potential
  const hashtagPotential = [
    `#${primaryCategory}`,
    '#viral',
    '#trending',
    ...(visualFeatures.face_detection.faces_detected > 0 ? ['#selfie', '#face'] : []),
    ...(audioFeatures.transcript.length > 0 ? ['#voice', '#audio'] : []),
    ...(seasonalRelevance > 0.3 ? [`#${currentSeason}`] : [])
  ].slice(0, 8);

  return {
    uses_trending_audio: usesTrendingAudio,
    follows_trending_format: followsTrendingFormat,
    seasonal_relevance: seasonalRelevance,
    hashtag_potential: hashtagPotential
  };
}

/**
 * Create empty content analysis
 */
function createEmptyContentAnalysis(): ContentAnalysis {
  return {
    viral_indicators: {
      hook_strength: 0.3,
      emotional_intensity: 0.3,
      surprise_factor: 0.3,
      relatability_score: 0.3
    },
    engagement_predictors: {
      watch_time_predictor: 0.3,
      share_likelihood: 0.3,
      comment_likelihood: 0.3,
      save_likelihood: 0.3
    },
    content_category: {
      primary_category: 'general',
      secondary_categories: [],
      niche_specificity: 0.3
    },
    trending_elements: {
      uses_trending_audio: false,
      follows_trending_format: false,
      seasonal_relevance: 0,
      hashtag_potential: ['#general']
    }
  };
}

/**
 * Save comprehensive features to database
 */
async function saveComprehensiveFeatures(features: ComprehensiveVideoFeatures): Promise<void> {
  try {
    await ensureComprehensiveVideoFeaturesTable();

    const { error } = await supabase
      .from('comprehensive_video_features')
      .insert({
        video_id: features.video_id,
        metrics: features.metrics,
        audio_features: features.audio_features,
        visual_features: features.visual_features,
        content_analysis: features.content_analysis,
        processing_metadata: features.processing_metadata,
        created_at: features.created_at
      });

    if (error) {
      if (error.code === '23505') {
        console.log(`Comprehensive features for ${features.video_id} already exist`);
        return;
      }
      throw error;
    }

    console.log(`✅ Saved comprehensive features for ${features.video_id}`);
  } catch (error) {
    console.error(`❌ Error saving comprehensive features for ${features.video_id}:`, error);
    throw error;
  }
}

/**
 * Log processing errors for monitoring
 */
async function logProcessingError(videoId: string, error: any, processingTime: number): Promise<void> {
  try {
    await supabase
      .from('video_processing_errors')
      .insert({
        video_id: videoId,
        error_message: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? error.stack : null,
        processing_time_ms: processingTime,
        created_at: new Date().toISOString()
      });
  } catch (logError) {
    console.warn('Failed to log processing error:', logError);
  }
}

/**
 * Cleanup temporary files
 */
async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('Failed to cleanup temp files:', error);
  }
}

/**
 * Create comprehensive video features table
 */
async function ensureComprehensiveVideoFeaturesTable(): Promise<void> {
  try {
    const { error } = await supabase
      .from('comprehensive_video_features')
      .select('video_id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('Creating comprehensive_video_features table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS comprehensive_video_features (
          video_id TEXT PRIMARY KEY,
          metrics JSONB NOT NULL,
          audio_features JSONB NOT NULL,
          visual_features JSONB NOT NULL,
          content_analysis JSONB NOT NULL,
          processing_metadata JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_comprehensive_features_created_at 
        ON comprehensive_video_features(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_comprehensive_features_content_category
        ON comprehensive_video_features USING GIN ((content_analysis->'content_category'));
      `;

      const { error: createError } = await supabase.rpc('exec_sql', {
        query: createTableSQL
      });

      if (createError) {
        throw createError;
      }

      console.log('✅ comprehensive_video_features table created successfully');
    }
  } catch (error) {
    console.error('❌ Error ensuring comprehensive_video_features table:', error);
    throw error;
  }
}

/**
 * Batch processing function for multiple videos
 */
export async function batchProcessVideos(videoRequests: DecomposeArgs[]): Promise<ComprehensiveVideoFeatures[]> {
  const results: ComprehensiveVideoFeatures[] = [];
  const errors: Array<{ id: string; error: Error }> = [];

  console.log(`🎬 Starting batch processing of ${videoRequests.length} videos`);

  // Process in parallel with concurrency limit
  const concurrencyLimit = 3;
  for (let i = 0; i < videoRequests.length; i += concurrencyLimit) {
    const batch = videoRequests.slice(i, i + concurrencyLimit);
    
    const batchPromises = batch.map(async (request) => {
      try {
        const result = await decomposeVideo(request);
        results.push(result);
        return result;
      } catch (error) {
        errors.push({ id: request.id, error: error as Error });
        console.error(`❌ Failed to process video ${request.id}:`, error);
        return null;
      }
    });

    await Promise.all(batchPromises);
    console.log(`📊 Batch ${Math.floor(i / concurrencyLimit) + 1} completed`);
  }

  console.log(`✅ Batch processing completed: ${results.length} successful, ${errors.length} failed`);
  
  if (errors.length > 0) {
    console.log('❌ Failed videos:', errors.map(e => e.id).join(', '));
  }

  return results;
}

export {
  ComprehensiveVideoFeatures,
  VideoMetrics,
  AudioFeatures,
  VisualFeatures,
  ContentAnalysis,
  DecomposeArgs
};
/**
 * Feature Extraction Service
 * 
 * Extracts comprehensive features from videos for viral prediction ML models.
 * This service coordinates various analysis modules to create feature vectors.
 */

import { VideoProcessor } from './video-processor'

export interface ExtractedFeatures {
  // Visual features
  visual: {
    aspectRatio: number
    colorfulness: number
    brightness: number
    contrast: number
    dominantColors: string[]
    faceDetections: number
    objectDetections: number
    visualComplexity: number
    sceneVariety: number
  }
  
  // Audio features
  audio: {
    hasMusic: boolean
    hasSpeech: boolean
    volume: number
    tempo?: number
    speechClarity: number
    silencePercentage: number
    audioQuality: number
    musicGenre?: string
  }
  
  // Text features
  text: {
    hasTextOverlay: boolean
    textDuration: number
    textDensity: number
    detectedText: string[]
    readabilityScore: number
    languageConfidence: number
  }
  
  // Structural features
  structural: {
    duration: number
    hookDuration: number
    sceneChanges: number
    pacing: 'slow' | 'medium' | 'fast'
    segments: Array<{
      type: 'hook' | 'build' | 'payoff' | 'cta'
      duration: number
      confidence: number
    }>
    faceScreenTime: number
    textOverlayDuration: number
  }
  
  // Content analysis
  content: {
    emotionalTone: {
      positive: number
      negative: number
      neutral: number
      surprise: number
      excitement: number
    }
    complexityScore: number
    noveltyScore: number
    engagementTriggers: string[]
    contentCategory: string
    viralElements: string[]
  }
  
  // ML-ready feature vector
  mlVector: number[]
  
  // Processing metadata
  processingTime: number
  extractionVersion: string
}

export class FeatureExtractor {
  private static readonly FEATURE_VERSION = '1.0.0'
  
  /**
   * Extract all features from a video URL
   */
  static async extractAllFeatures(videoUrl: string): Promise<ExtractedFeatures> {
    const startTime = Date.now()
    
    console.log('🔬 Starting comprehensive feature extraction...')
    
    try {
      // Get comprehensive video analysis
      const analysis = await VideoProcessor.processForPrediction(videoUrl)
      
      // Extract visual features
      const visual = this.extractVisualFeatures(analysis.visual, analysis.metadata)
      
      // Extract audio features
      const audio = this.extractAudioFeatures(analysis.audio)
      
      // Extract text features
      const text = this.extractTextFeatures(analysis.text)
      
      // Extract structural features
      const structural = this.extractStructuralFeatures(analysis.structure, analysis.metadata)
      
      // Extract content features
      const content = this.extractContentFeatures(analysis)
      
      // Generate ML feature vector
      const mlVector = this.generateMLVector({
        visual,
        audio,
        text,
        structural,
        content
      })
      
      const processingTime = Date.now() - startTime
      
      console.log(`✅ Feature extraction completed in ${processingTime}ms`)
      
      return {
        visual,
        audio,
        text,
        structural,
        content,
        mlVector,
        processingTime,
        extractionVersion: this.FEATURE_VERSION
      }
      
    } catch (error) {
      console.error('❌ Feature extraction failed:', error)
      throw error
    }
  }
  
  /**
   * Extract visual features
   */
  private static extractVisualFeatures(visual: any, metadata: any): ExtractedFeatures['visual'] {
    return {
      aspectRatio: metadata.aspectRatio || 0.5625, // 9:16 default for mobile
      colorfulness: visual.colorfulness || 0.5,
      brightness: visual.brightness || 0.5,
      contrast: visual.contrast || 0.5,
      dominantColors: visual.dominantColors || [],
      faceDetections: Math.floor(Math.random() * 5), // Simulated
      objectDetections: Math.floor(Math.random() * 10), // Simulated
      visualComplexity: this.calculateVisualComplexity(visual),
      sceneVariety: Math.random() * 0.8 + 0.2 // Simulated
    }
  }
  
  /**
   * Extract audio features
   */
  private static extractAudioFeatures(audio: any): ExtractedFeatures['audio'] {
    return {
      hasMusic: audio.hasMusic || false,
      hasSpeech: audio.hasSpeech || false,
      volume: audio.volume || 0.5,
      tempo: audio.tempo,
      speechClarity: audio.speechClarity || 0.7,
      silencePercentage: audio.silencePercentage || 0.1,
      audioQuality: this.calculateAudioQuality(audio),
      musicGenre: audio.musicGenre
    }
  }
  
  /**
   * Extract text features
   */
  private static extractTextFeatures(text: any): ExtractedFeatures['text'] {
    const hasText = text.hasTextOverlay || false
    const textCount = text.detectedText?.length || 0
    
    return {
      hasTextOverlay: hasText,
      textDuration: text.textDuration || 0,
      textDensity: textCount / Math.max(1, text.textDuration || 1),
      detectedText: text.detectedText || [],
      readabilityScore: hasText ? Math.random() * 0.4 + 0.6 : 0,
      languageConfidence: hasText ? Math.random() * 0.3 + 0.7 : 0
    }
  }
  
  /**
   * Extract structural features
   */
  private static extractStructuralFeatures(structure: any, metadata: any): ExtractedFeatures['structural'] {
    const duration = metadata.duration || 30
    const hookDuration = structure.hookDuration || 3
    
    return {
      duration,
      hookDuration,
      sceneChanges: structure.sceneChanges?.length || 2,
      pacing: structure.pacing || 'medium',
      segments: structure.segments?.map((seg: any) => ({
        type: seg.type,
        duration: seg.end - seg.start,
        confidence: seg.confidence
      })) || [],
      faceScreenTime: Math.random() * 60 + 20, // Simulated percentage
      textOverlayDuration: Math.random() * 10 // Simulated seconds
    }
  }
  
  /**
   * Extract content analysis features
   */
  private static extractContentFeatures(analysis: any): ExtractedFeatures['content'] {
    // Simulate advanced content analysis
    // In production, this would use NLP, computer vision, and ML models
    
    const emotionalTone = {
      positive: Math.random() * 0.6 + 0.2,
      negative: Math.random() * 0.3,
      neutral: Math.random() * 0.4 + 0.3,
      surprise: Math.random() * 0.5,
      excitement: Math.random() * 0.7 + 0.1
    }
    
    // Normalize emotional tone
    const total = Object.values(emotionalTone).reduce((a, b) => a + b, 0)
    Object.keys(emotionalTone).forEach(key => {
      emotionalTone[key as keyof typeof emotionalTone] /= total
    })
    
    const engagementTriggers = this.detectEngagementTriggers(analysis)
    const viralElements = this.detectViralElements(analysis)
    
    return {
      emotionalTone,
      complexityScore: Math.random() * 0.6 + 0.2,
      noveltyScore: Math.random() * 0.8 + 0.1,
      engagementTriggers,
      contentCategory: this.classifyContent(analysis),
      viralElements
    }
  }
  
  /**
   * Calculate visual complexity score
   */
  private static calculateVisualComplexity(visual: any): number {
    let complexity = 0.3 // Base complexity
    
    // More colors = higher complexity
    if (visual.dominantColors?.length > 3) complexity += 0.2
    
    // High contrast = higher complexity
    if (visual.contrast > 0.7) complexity += 0.2
    
    // High colorfulness = higher complexity
    if (visual.colorfulness > 0.6) complexity += 0.3
    
    return Math.min(1.0, complexity)
  }
  
  /**
   * Calculate audio quality score
   */
  private static calculateAudioQuality(audio: any): number {
    let quality = 0.5 // Base quality
    
    // Clear speech improves quality
    if (audio.speechClarity > 0.8) quality += 0.2
    
    // Good volume levels
    if (audio.volume > 0.3 && audio.volume < 0.9) quality += 0.1
    
    // Low silence percentage
    if (audio.silencePercentage < 0.2) quality += 0.2
    
    return Math.min(1.0, quality)
  }
  
  /**
   * Detect engagement triggers in content
   */
  private static detectEngagementTriggers(analysis: any): string[] {
    const triggers = []
    
    // Simulated trigger detection
    const possibleTriggers = [
      'question_hook',
      'surprising_fact',
      'before_after',
      'numbered_list',
      'trending_topic',
      'relatable_problem',
      'emotional_story',
      'quick_tips',
      'behind_scenes',
      'transformation'
    ]
    
    // Randomly select 2-4 triggers based on content
    const triggerCount = Math.floor(Math.random() * 3) + 2
    for (let i = 0; i < triggerCount; i++) {
      const trigger = possibleTriggers[Math.floor(Math.random() * possibleTriggers.length)]
      if (!triggers.includes(trigger)) {
        triggers.push(trigger)
      }
    }
    
    return triggers
  }
  
  /**
   * Detect viral elements in content
   */
  private static detectViralElements(analysis: any): string[] {
    const elements = []
    
    // Simulated viral element detection
    const possibleElements = [
      'strong_hook',
      'pattern_interrupt',
      'social_proof',
      'emotional_trigger',
      'clear_value_prop',
      'trending_audio',
      'face_reveal',
      'text_overlay',
      'quick_cuts',
      'call_to_action'
    ]
    
    // Select elements based on analysis
    if (analysis.structural?.hookDuration < 4) elements.push('strong_hook')
    if (analysis.audio?.hasMusic) elements.push('trending_audio')
    if (analysis.text?.hasTextOverlay) elements.push('text_overlay')
    if (analysis.structural?.sceneChanges?.length > 3) elements.push('quick_cuts')
    
    // Add random elements
    while (elements.length < 4) {
      const element = possibleElements[Math.floor(Math.random() * possibleElements.length)]
      if (!elements.includes(element)) {
        elements.push(element)
      }
    }
    
    return elements
  }
  
  /**
   * Classify content category
   */
  private static classifyContent(analysis: any): string {
    // Simulated content classification
    const categories = [
      'business',
      'education',
      'entertainment',
      'lifestyle',
      'tutorial',
      'story',
      'review',
      'comedy',
      'motivation',
      'news'
    ]
    
    // In production, this would use ML classification
    return categories[Math.floor(Math.random() * categories.length)]
  }
  
  /**
   * Generate ML-ready feature vector
   */
  private static generateMLVector(features: {
    visual: ExtractedFeatures['visual']
    audio: ExtractedFeatures['audio']
    text: ExtractedFeatures['text']
    structural: ExtractedFeatures['structural']
    content: ExtractedFeatures['content']
  }): number[] {
    const vector: number[] = []
    
    // Visual features (20 dimensions)
    vector.push(
      features.visual.aspectRatio,
      features.visual.colorfulness,
      features.visual.brightness,
      features.visual.contrast,
      features.visual.faceDetections / 10, // Normalize
      features.visual.objectDetections / 20, // Normalize
      features.visual.visualComplexity,
      features.visual.sceneVariety,
      features.visual.dominantColors.length / 10, // Normalize
      ...Array(11).fill(0) // Padding for additional visual features
    )
    
    // Audio features (15 dimensions)
    vector.push(
      features.audio.hasMusic ? 1 : 0,
      features.audio.hasSpeech ? 1 : 0,
      features.audio.volume,
      features.audio.speechClarity,
      features.audio.silencePercentage,
      features.audio.audioQuality,
      features.audio.tempo ? features.audio.tempo / 200 : 0, // Normalize BPM
      ...Array(8).fill(0) // Padding for additional audio features
    )
    
    // Text features (10 dimensions)
    vector.push(
      features.text.hasTextOverlay ? 1 : 0,
      features.text.textDuration / 30, // Normalize to 30 seconds
      features.text.textDensity,
      features.text.readabilityScore,
      features.text.languageConfidence,
      features.text.detectedText.length / 10, // Normalize
      ...Array(4).fill(0) // Padding
    )
    
    // Structural features (15 dimensions)
    vector.push(
      features.structural.duration / 60, // Normalize to 60 seconds
      features.structural.hookDuration / 10, // Normalize
      features.structural.sceneChanges / 10, // Normalize
      features.structural.pacing === 'fast' ? 1 : features.structural.pacing === 'medium' ? 0.5 : 0,
      features.structural.faceScreenTime / 100, // Normalize percentage
      features.structural.textOverlayDuration / 30, // Normalize
      features.structural.segments.length / 5, // Normalize
      ...Array(8).fill(0) // Padding
    )
    
    // Content features (25 dimensions)
    vector.push(
      features.content.emotionalTone.positive,
      features.content.emotionalTone.negative,
      features.content.emotionalTone.neutral,
      features.content.emotionalTone.surprise,
      features.content.emotionalTone.excitement,
      features.content.complexityScore,
      features.content.noveltyScore,
      features.content.engagementTriggers.length / 10, // Normalize
      features.content.viralElements.length / 10, // Normalize
      ...Array(16).fill(0) // Padding for additional content features
    )
    
    // Add some engineered features (derived combinations)
    vector.push(
      features.visual.brightness * features.visual.contrast, // Visual appeal
      features.audio.volume * features.audio.audioQuality, // Audio appeal
      features.structural.hookDuration / features.structural.duration, // Hook ratio
      features.content.emotionalTone.positive + features.content.emotionalTone.excitement, // Positive energy
      features.visual.faceDetections * features.structural.faceScreenTime / 100 // Face engagement
    )
    
    // Ensure vector is exactly the expected length (90 dimensions)
    while (vector.length < 90) {
      vector.push(0)
    }
    
    return vector.slice(0, 90) // Truncate if too long
  }
  
  /**
   * Extract features optimized for specific platforms
   */
  static async extractPlatformFeatures(
    videoUrl: string, 
    platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
  ): Promise<ExtractedFeatures & { platformScore: number }> {
    const features = await this.extractAllFeatures(videoUrl)
    const platformScore = this.calculatePlatformScore(features, platform)
    
    return {
      ...features,
      platformScore
    }
  }
  
  /**
   * Calculate platform-specific optimization score
   */
  private static calculatePlatformScore(
    features: ExtractedFeatures, 
    platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
  ): number {
    let score = 0.5 // Base score
    
    switch (platform) {
      case 'tiktok':
        // Vertical format is crucial
        if (features.visual.aspectRatio > 1.2) score += 0.2
        // Short duration preferred
        if (features.structural.duration <= 60) score += 0.15
        // Quick pacing
        if (features.structural.pacing === 'fast') score += 0.1
        // Strong hook
        if (features.structural.hookDuration <= 3) score += 0.15
        break
        
      case 'instagram':
        // Square or vertical format
        if (features.visual.aspectRatio >= 0.8) score += 0.15
        // Visual appeal important
        if (features.visual.colorfulness > 0.6) score += 0.1
        if (features.visual.brightness > 0.4 && features.visual.brightness < 0.8) score += 0.1
        // Moderate duration
        if (features.structural.duration <= 90) score += 0.15
        break
        
      case 'youtube':
        // Horizontal format traditional
        if (features.visual.aspectRatio <= 0.8) score += 0.1
        // Longer content acceptable
        if (features.structural.duration >= 60) score += 0.1
        // Audio quality important
        if (features.audio.audioQuality > 0.7) score += 0.15
        // Content depth
        if (features.content.complexityScore > 0.5) score += 0.15
        break
        
      case 'linkedin':
        // Professional content
        if (features.content.contentCategory === 'business') score += 0.2
        // Clear speech
        if (features.audio.hasSpeech && features.audio.speechClarity > 0.8) score += 0.15
        // Moderate pacing
        if (features.structural.pacing === 'medium') score += 0.1
        // Text overlays for key points
        if (features.text.hasTextOverlay) score += 0.05
        break
    }
    
    return Math.min(1.0, score)
  }
}
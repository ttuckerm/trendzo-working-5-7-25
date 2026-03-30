/**
 * Video Processing Service
 * 
 * Handles video file analysis, metadata extraction, and preprocessing
 * for the viral prediction system.
 */

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  aspectRatio: number
  fileSize: number
  format: string
  hasAudio: boolean
  bitrate?: number
}

export interface FrameAnalysis {
  timestamp: number
  sceneChange: boolean
  faces: Array<{
    confidence: number
    boundingBox: {
      x: number
      y: number
      width: number
      height: number
    }
    emotions?: {
      happy: number
      surprised: number
      neutral: number
      sad: number
      angry: number
    }
  }>
  objects: Array<{
    label: string
    confidence: number
    boundingBox: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  colors: {
    dominant: string[]
    palette: Array<{
      color: string
      percentage: number
    }>
  }
  brightness: number
  contrast: number
  textDetected: boolean
}

export class VideoProcessor {
  /**
   * Extract basic metadata from video file
   */
  static async extractMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      
      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // Default, would need more sophisticated detection
          aspectRatio: video.videoWidth / video.videoHeight,
          fileSize: file.size,
          format: file.type,
          hasAudio: true, // Assume true, would need audio track detection
          bitrate: Math.round(file.size * 8 / video.duration / 1000) // Rough estimate
        }
        
        resolve(metadata)
        URL.revokeObjectURL(video.src)
      }
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'))
        URL.revokeObjectURL(video.src)
      }
      
      video.src = URL.createObjectURL(file)
    })
  }

  /**
   * Extract frames from video for analysis
   */
  static async extractFrames(
    videoUrl: string, 
    options: {
      maxFrames?: number
      interval?: number // seconds between frames
      quality?: number // 0-1
    } = {}
  ): Promise<HTMLCanvasElement[]> {
    const {
      maxFrames = 10,
      interval = 2,
      quality = 0.8
    } = options

    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const frames: HTMLCanvasElement[] = []
      
      video.crossOrigin = 'anonymous'
      video.preload = 'metadata'
      
      video.onloadedmetadata = async () => {
        const duration = video.duration
        const frameCount = Math.min(maxFrames, Math.floor(duration / interval))
        
        try {
          for (let i = 0; i < frameCount; i++) {
            const timestamp = (i * duration) / frameCount
            const canvas = await this.captureFrame(video, timestamp)
            frames.push(canvas)
          }
          resolve(frames)
        } catch (error) {
          reject(error)
        }
      }
      
      video.onerror = () => reject(new Error('Failed to load video'))
      video.src = videoUrl
    })
  }

  /**
   * Capture a single frame at specific timestamp
   */
  private static captureFrame(video: HTMLVideoElement, timestamp: number): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const seeked = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        video.removeEventListener('seeked', seeked)
        resolve(canvas)
      }
      
      video.addEventListener('seeked', seeked)
      video.currentTime = timestamp
    })
  }

  /**
   * Analyze video structure and pacing
   */
  static async analyzeStructure(videoUrl: string): Promise<{
    sceneChanges: number[]
    hookDuration: number
    pacing: 'slow' | 'medium' | 'fast'
    segments: Array<{
      start: number
      end: number
      type: 'hook' | 'build' | 'payoff' | 'cta'
      confidence: number
    }>
  }> {
    try {
      // For demo purposes, we'll simulate structure analysis
      // In production, this would use computer vision and ML models
      
      const frames = await this.extractFrames(videoUrl, { maxFrames: 20, interval: 1 })
      const sceneChanges = await this.detectSceneChanges(frames)
      
      // Estimate hook duration (typically first 3-5 seconds)
      const hookDuration = Math.min(5, sceneChanges[0] || 3)
      
      // Determine pacing based on scene changes
      const pacing = sceneChanges.length > 8 ? 'fast' : 
                    sceneChanges.length > 4 ? 'medium' : 'slow'
      
      // Estimate segments (simplified algorithm)
      const totalDuration = frames.length * 1 // Assuming 1 second intervals
      const segments = this.estimateSegments(totalDuration, sceneChanges)
      
      return {
        sceneChanges,
        hookDuration,
        pacing,
        segments
      }
    } catch (error) {
      console.error('Structure analysis failed:', error)
      // Return default structure if analysis fails
      return {
        sceneChanges: [3, 8, 15],
        hookDuration: 3,
        pacing: 'medium',
        segments: [
          { start: 0, end: 3, type: 'hook', confidence: 0.8 },
          { start: 3, end: 15, type: 'build', confidence: 0.7 },
          { start: 15, end: 25, type: 'payoff', confidence: 0.6 },
          { start: 25, end: 30, type: 'cta', confidence: 0.5 }
        ]
      }
    }
  }

  /**
   * Detect scene changes between frames
   */
  private static async detectSceneChanges(frames: HTMLCanvasElement[]): Promise<number[]> {
    const sceneChanges: number[] = []
    const threshold = 0.3 // Similarity threshold for scene change
    
    for (let i = 1; i < frames.length; i++) {
      const similarity = await this.calculateFrameSimilarity(frames[i-1], frames[i])
      
      if (similarity < threshold) {
        sceneChanges.push(i) // Frame index as timestamp approximation
      }
    }
    
    return sceneChanges
  }

  /**
   * Calculate similarity between two frames
   */
  private static async calculateFrameSimilarity(frame1: HTMLCanvasElement, frame2: HTMLCanvasElement): Promise<number> {
    const ctx1 = frame1.getContext('2d')!
    const ctx2 = frame2.getContext('2d')!
    
    // Resize frames for faster comparison
    const size = 64
    const canvas1 = document.createElement('canvas')
    const canvas2 = document.createElement('canvas')
    
    canvas1.width = canvas2.width = size
    canvas1.height = canvas2.height = size
    
    const smallCtx1 = canvas1.getContext('2d')!
    const smallCtx2 = canvas2.getContext('2d')!
    
    smallCtx1.drawImage(frame1, 0, 0, size, size)
    smallCtx2.drawImage(frame2, 0, 0, size, size)
    
    const data1 = smallCtx1.getImageData(0, 0, size, size).data
    const data2 = smallCtx2.getImageData(0, 0, size, size).data
    
    let diff = 0
    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i+1], b1 = data1[i+2]
      const r2 = data2[i], g2 = data2[i+1], b2 = data2[i+2]
      
      diff += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)
    }
    
    // Normalize to 0-1 scale (higher = more similar)
    const maxDiff = size * size * 3 * 255
    return 1 - (diff / maxDiff)
  }

  /**
   * Estimate video segments based on structure analysis
   */
  private static estimateSegments(
    duration: number, 
    sceneChanges: number[]
  ): Array<{
    start: number
    end: number
    type: 'hook' | 'build' | 'payoff' | 'cta'
    confidence: number
  }> {
    const segments = []
    
    // Hook (first 3-5 seconds or until first scene change)
    const hookEnd = Math.min(5, sceneChanges[0] || 3)
    segments.push({
      start: 0,
      end: hookEnd,
      type: 'hook' as const,
      confidence: 0.8
    })
    
    // Build phase (main content)
    const buildEnd = duration * 0.7 // Roughly 70% through
    segments.push({
      start: hookEnd,
      end: buildEnd,
      type: 'build' as const,
      confidence: 0.7
    })
    
    // Payoff (climax/resolution)
    const payoffEnd = duration * 0.9 // 90% through
    segments.push({
      start: buildEnd,
      end: payoffEnd,
      type: 'payoff' as const,
      confidence: 0.6
    })
    
    // CTA (final 10%)
    segments.push({
      start: payoffEnd,
      end: duration,
      type: 'cta' as const,
      confidence: 0.5
    })
    
    return segments
  }

  /**
   * Analyze audio characteristics
   */
  static async analyzeAudio(videoUrl: string): Promise<{
    hasMusic: boolean
    hasSpeech: boolean
    volume: number
    tempo?: number
    musicGenre?: string
    speechClarity: number
    silencePercentage: number
  }> {
    // For demo purposes, return simulated audio analysis
    // In production, this would use Web Audio API or server-side audio processing
    
    return {
      hasMusic: Math.random() > 0.3,
      hasSpeech: Math.random() > 0.2,
      volume: Math.random() * 0.8 + 0.2,
      tempo: Math.random() > 0.5 ? Math.floor(Math.random() * 60) + 120 : undefined,
      musicGenre: Math.random() > 0.5 ? ['pop', 'hip-hop', 'electronic', 'acoustic'][Math.floor(Math.random() * 4)] : undefined,
      speechClarity: Math.random() * 0.4 + 0.6,
      silencePercentage: Math.random() * 0.3
    }
  }

  /**
   * Detect text overlays and captions
   */
  static async detectText(frames: HTMLCanvasElement[]): Promise<{
    hasTextOverlay: boolean
    textDuration: number
    detectedText: string[]
    textPositions: Array<{
      text: string
      frame: number
      boundingBox: {
        x: number
        y: number
        width: number
        height: number
      }
      confidence: number
    }>
  }> {
    // Simulate text detection
    // In production, this would use OCR libraries like Tesseract.js
    
    const hasTextOverlay = Math.random() > 0.4
    const textDuration = hasTextOverlay ? Math.random() * 15 + 2 : 0
    
    return {
      hasTextOverlay,
      textDuration,
      detectedText: hasTextOverlay ? ['Sample Text', 'Call to Action'] : [],
      textPositions: hasTextOverlay ? [
        {
          text: 'Sample Text',
          frame: 1,
          boundingBox: { x: 100, y: 50, width: 200, height: 40 },
          confidence: 0.95
        }
      ] : []
    }
  }

  /**
   * Extract color palette and visual characteristics
   */
  static extractColorPalette(canvas: HTMLCanvasElement): {
    dominantColors: string[]
    colorfulness: number
    brightness: number
    contrast: number
  } {
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Simplified color analysis
    const colorCounts: { [key: string]: number } = {}
    let totalBrightness = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Calculate brightness
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      totalBrightness += brightness
      
      // Quantize colors for palette extraction
      const quantizedR = Math.floor(r / 32) * 32
      const quantizedG = Math.floor(g / 32) * 32
      const quantizedB = Math.floor(b / 32) * 32
      const colorKey = `rgb(${quantizedR},${quantizedG},${quantizedB})`
      
      colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1
    }
    
    // Get dominant colors
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color)
    
    const avgBrightness = totalBrightness / (data.length / 4)
    
    return {
      dominantColors: sortedColors,
      colorfulness: Math.random() * 0.5 + 0.3, // Simplified
      brightness: avgBrightness / 255,
      contrast: Math.random() * 0.6 + 0.4 // Simplified
    }
  }

  /**
   * Process video for viral prediction analysis
   */
  static async processForPrediction(videoUrl: string): Promise<{
    metadata: VideoMetadata
    structure: any
    audio: any
    visual: any
    text: any
  }> {
    try {
      console.log('🎬 Starting video processing for prediction...')
      
      // Run all analyses in parallel where possible
      const [structure, audio, frames] = await Promise.all([
        this.analyzeStructure(videoUrl),
        this.analyzeAudio(videoUrl),
        this.extractFrames(videoUrl, { maxFrames: 5, interval: 3 })
      ])
      
      // Process frames for visual analysis
      const visual = frames.length > 0 ? this.extractColorPalette(frames[0]) : {
        dominantColors: [],
        colorfulness: 0.5,
        brightness: 0.5,
        contrast: 0.5
      }
      
      // Detect text overlays
      const text = await this.detectText(frames)
      
      console.log('✅ Video processing completed')
      
      return {
        metadata: {
          duration: structure.segments.reduce((max, seg) => Math.max(max, seg.end), 0),
          width: 1080, // Default values - would be from actual metadata
          height: 1920,
          fps: 30,
          aspectRatio: 1080/1920,
          fileSize: 0,
          format: 'video/mp4',
          hasAudio: audio.hasSpeech || audio.hasMusic
        },
        structure,
        audio,
        visual,
        text
      }
    } catch (error) {
      console.error('Video processing failed:', error)
      throw error
    }
  }
}
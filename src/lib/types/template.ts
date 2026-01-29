// Template data structure types for TikTok template editor

export type TextOverlayPosition = 'top' | 'middle' | 'bottom'
export type TextOverlayStyle = 'caption' | 'headline' | 'quote'

export interface TextOverlay {
  id: string
  text: string
  position: TextOverlayPosition
  style: TextOverlayStyle
  color?: string
  fontSize?: number
}

export interface TemplateSection {
  id: string
  name: string
  duration: number
  textOverlays: TextOverlay[]
  videoUrl?: string
  imageUrl?: string
  backgroundColor?: string
  transition?: 'fade' | 'slide' | 'zoom' | 'none'
  order: number
}

export interface Template {
  id: string
  name: string
  industry: string
  category: string
  description?: string
  sections: TemplateSection[]
  views: number
  usageCount: number
  isPublished: boolean
  userId: string
  createdAt: string
  updatedAt: string
  thumbnailUrl?: string
  totalDuration?: number
  // Sound-related fields
  soundId?: string
  soundTitle?: string
  soundAuthor?: string
  soundUrl?: string
}

export interface TemplateAnalytics {
  views: number
  usageCount: number
  completionRate: number
  averageDuration: number
  industryBenchmark?: {
    views: number
    usageCount: number
    completionRate: number
  }
}

// Template variation types for A/B testing and remixing
export type VariationType = 'color' | 'text' | 'layout' | 'content' | 'timing' | 'remix'

export interface TemplateVariation {
  id: string
  templateId: string
  name: string
  description?: string
  type: VariationType
  changes: {
    sections?: Partial<TemplateSection>[]
    textOverlays?: Partial<TextOverlay>[]
    timing?: {
      section: string
      newDuration: number
    }[]
    style?: {
      colorPalette?: string[]
      fontStyles?: Record<string, any>
    }
    // Sound variation
    sound?: {
      soundId?: string
      soundTitle?: string
      soundAuthor?: string
      soundUrl?: string
    }
  }
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  isActive: boolean
  testingStatus?: 'draft' | 'running' | 'completed'
  performancePrediction?: {
    score?: number
    confidence?: number
    improvedMetrics?: string[] 
    recommendations?: string[]
  }
  testResults?: {
    views: number
    engagementRate: number
    completionRate: number
    conversionRate?: number
    comparedToOriginal: {
      views: number
      engagement: number
      completion: number
      conversion?: number
    }
  }
} 
'use client'

import React, { useState, useEffect, useRef } from 'react'

interface ViralTemplate {
  id: string
  name: string
  description: string
  mood: string
  colors: string[]
  aiPersona: string
  aiColor: string
  emoji: string
  format: string
}

interface ValueTemplateEditorProps {
  selectedVideo?: any
  onContentChange?: (content: any) => void
  viralPrediction?: any
  isAnalyzing?: boolean
}

// 🧬 New interfaces for ML-based analysis
interface ViralDNA {
  emotionalTriggers: string[]
  contentPatterns: string[]
  hookMechanisms: string[]
  engagementDrivers: string[]
  viralCoefficients: {
    curiosity: number
    relatability: number
    surprise: number
    authority: number
    transformation: number
    exclusivity: number
  }
}

interface WorkspaceConfig {
  workspaceId: string
  recommendedFramework: {
    id: string
    name: string
    confidence: number
    reasoning: string[]
    viralDnaAlignment: number
  } | null
  alternativeFrameworks: Array<{
    id: string
    name: string
    confidence: number
    reasoning: string
  }>
  viralDNA: ViralDNA
  suggestedHooks: string[]
  optimizationInsights: Array<{
    type: string
    category: string
    message: string
    impact: string
    actionable: boolean
  }>
  performancePredictions: {
    expectedViralScore: number
    engagementPrediction: number
    shareabilityScore: number
    retentionPrediction: number
  }
}

export default function ValueTemplateEditor({ 
  selectedVideo, 
  onContentChange, 
  viralPrediction,
  isAnalyzing = false 
}: ValueTemplateEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ViralTemplate | null>(null)
  const [userContent, setUserContent] = useState({
    script: '',
    hook: '',
    style: ''
  })
  const [activeTab, setActiveTab] = useState('script')
  const [viralScore, setViralScore] = useState(0)
  const [backgroundMood, setBackgroundMood] = useState('default')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  
  // 🧬 New state for ML-based analysis
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [showViralDNA, setShowViralDNA] = useState(false)
  const [showOptimizations, setShowOptimizations] = useState(false)
  
  // 🎬 New state for related videos (Phase 3 enhancement)
  const [relatedVideos, setRelatedVideos] = useState<any[]>([])
  const [isLoadingRelatedVideos, setIsLoadingRelatedVideos] = useState(false)
  
  // Viral format templates (connected to Discovery phase)
  const viralTemplates: ViralTemplate[] = [
    {
      id: 'authority',
      name: 'Authority Gap Hook',
      description: 'Establish credibility immediately to build instant trust',
      mood: 'authority',
      colors: ['rgba(68, 138, 255, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(67, 56, 202, 0.8)'],
      aiPersona: 'Authority Coach',
      aiColor: '#448aff',
      emoji: '👑',
      format: 'authority'
    },
    {
      id: 'storytelling',
      name: 'Storytelling Loop',
      description: 'Open narrative questions that compel viewers to watch until resolution',
      mood: 'storytelling',
      colors: ['rgba(255, 138, 101, 0.8)', 'rgba(255, 193, 7, 0.8)', 'rgba(255, 87, 34, 0.8)'],
      aiPersona: 'Story Architect',
      aiColor: '#ff8a65',
      emoji: '📖',
      format: 'storytelling'
    },
    {
      id: 'challenge',
      name: 'Challenge Documentation',
      description: 'Real-time progress updates on ambitious goals',
      mood: 'challenge',
      colors: ['rgba(34, 197, 94, 0.8)', 'rgba(255, 235, 59, 0.8)', 'rgba(102, 187, 106, 0.8)'],
      aiPersona: 'Challenge Coach',
      aiColor: '#22c55e',
      emoji: '⚡',
      format: 'challenge'
    },
    {
      id: 'controversial',
      name: 'Controversial/Polarizing',
      description: 'Deliberately divisive statements that trigger emotional responses',
      mood: 'controversial',
      colors: ['rgba(244, 67, 54, 0.8)', 'rgba(233, 30, 99, 0.8)', 'rgba(156, 39, 176, 0.8)'],
      aiPersona: 'Controversy Strategist',
      aiColor: '#f44336',
      emoji: '🔥',
      format: 'controversial'
    },
    {
      id: 'hero',
      name: "Hero's Journey",
      description: 'Compress the classic transformation arc into 30-60 seconds',
      mood: 'hero',
      colors: ['rgba(103, 58, 183, 0.8)', 'rgba(63, 81, 181, 0.8)', 'rgba(48, 63, 159, 0.8)'],
      aiPersona: 'Transformation Guide',
      aiColor: '#673ab7',
      emoji: '🦸',
      format: 'hero'
    },
    {
      id: 'creative',
      name: 'Creative Showcase',
      description: 'Highlight unique skills, talents, or creative processes',
      mood: 'creative',
      colors: ['rgba(0, 188, 212, 0.8)', 'rgba(0, 150, 136, 0.8)', 'rgba(76, 175, 80, 0.8)'],
      aiPersona: 'Creative Director',
      aiColor: '#00bcd4',
      emoji: '🎨',
      format: 'creative'
    }
  ]

  // 🧬 Load ML-based workspace configuration
  useEffect(() => {
    if (selectedVideo?.id) {
      loadWorkspaceConfig(selectedVideo.id)
    }
  }, [selectedVideo])

  // 🧬 Load workspace configuration with ML analysis
  const loadWorkspaceConfig = async (videoId: string) => {
    setIsLoadingConfig(true)
    try {
      console.log('🧬 Loading ML-enhanced workspace config for video:', videoId)
      
      const response = await fetch(`/api/value-template-editor/workspace-config?videoId=${videoId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load workspace config: ${response.status}`)
      }
      
      const config: WorkspaceConfig = await response.json()
      console.log('🧬 Received workspace config:', config)
      
      setWorkspaceConfig(config)
      
      // Auto-select recommended framework template
      if (config.recommendedFramework) {
        const recommendedTemplate = findTemplateByFramework(config.recommendedFramework.name)
        if (recommendedTemplate) {
          setSelectedTemplate(recommendedTemplate)
          setBackgroundMood(recommendedTemplate.mood)
          
          // Pre-populate with intelligent suggestions
          setUserContent({
            script: generateIntelligentScript(config),
            hook: config.suggestedHooks[0] || '',
            style: generateStyleSuggestion(config)
          })
        }
        
        // 🎬 Load related videos based on determined framework
        await loadRelatedVideos(config.recommendedFramework.name, videoId)
      }
      
      // Set initial viral score from predictions
      if (config.performancePredictions) {
        setViralScore(config.performancePredictions.expectedViralScore)
      }
      
    } catch (error) {
      console.error('❌ Failed to load workspace config:', error)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  // 🎬 Load related videos based on framework (NEW)
  const loadRelatedVideos = async (framework: string, excludeVideoId: string) => {
    setIsLoadingRelatedVideos(true)
    try {
      console.log('🎬 Loading related videos for framework:', framework)
      
      const response = await fetch(
        `/api/value-template-editor/related-videos?framework=${encodeURIComponent(framework)}&exclude=${excludeVideoId}&limit=6`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to load related videos: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('🎬 Received related videos:', result.videos?.length || 0, 'videos')
      
      if (result.success) {
        setRelatedVideos(result.videos || [])
      }
      
    } catch (error) {
      console.error('❌ Failed to load related videos:', error)
      setRelatedVideos([]) // Fallback to empty array
    } finally {
      setIsLoadingRelatedVideos(false)
    }
  }

  // 🧬 Map framework names to template IDs
  const findTemplateByFramework = (frameworkName: string): ViralTemplate | null => {
    const frameworkMap: { [key: string]: string } = {
      'Authority Hook': 'authority',
      'Before/After Transformation': 'storytelling',
      'Secret Knowledge Reveal': 'authority',
      'POV Relatability': 'storytelling',
      'Quick Tutorial Format': 'creative',
      'Challenge Documentation': 'challenge'
    }
    
    const templateId = frameworkMap[frameworkName] || 'authority'
    return viralTemplates.find(t => t.id === templateId) || null
  }

  // 🧬 Generate intelligent script based on ML analysis
  const generateIntelligentScript = (config: WorkspaceConfig): string => {
    if (!config.recommendedFramework || !config.viralDNA) return ''
    
    const framework = config.recommendedFramework.name
    const viralDNA = config.viralDNA
    
    // Generate script based on dominant viral coefficients
    const coefficients = viralDNA.viralCoefficients
    const dominantTrait = Object.entries(coefficients).reduce((a, b) => 
      coefficients[a[0] as keyof typeof coefficients] > coefficients[b[0] as keyof typeof coefficients] ? a : b
    )[0]
    
    const scriptTemplates: { [key: string]: string } = {
      authority: `As someone who's achieved [specific result], I discovered the one thing that made all the difference...\n\nMost people try [common approach], but here's what actually works...\n\n[Share specific strategy or insight]`,
      
      curiosity: `You won't believe what happened when I tried this for 30 days...\n\nEveryone said it was impossible, but...\n\n[Reveal surprising outcome]`,
      
      transformation: `6 months ago I was [struggling state]...\n\nToday, everything changed because I discovered...\n\n[Share transformation method]`,
      
      relatability: `POV: You've been doing [common thing] wrong your entire life...\n\nWe've all been there, but here's what I learned...\n\n[Share relatable solution]`
    }
    
    return scriptTemplates[dominantTrait] || scriptTemplates.authority
  }

  // 🧬 Generate style suggestion based on viral DNA
  const generateStyleSuggestion = (config: WorkspaceConfig): string => {
    if (!config.viralDNA) return ''
    
    const triggers = config.viralDNA.emotionalTriggers
    const patterns = config.viralDNA.contentPatterns
    
    let style = 'Authentic, engaging'
    
    if (triggers.includes('authority')) style += ', confident'
    if (triggers.includes('curiosity')) style += ', mysterious'
    if (triggers.includes('relatability')) style += ', conversational'
    if (patterns.includes('before_after_transformation')) style += ', inspirational'
    
    return style
  }

  // Auto-select template based on selected video (enhanced with ML)
  useEffect(() => {
    if (selectedVideo && !selectedTemplate && !workspaceConfig) {
      // Fallback template mapping if workspace config fails
      const templateMap: { [key: string]: string } = {
        'How I Built a 7-Figure Business': 'authority',
        'This Morning Routine Changed My Life': 'storytelling', 
        'Secret Productivity Hack': 'authority',
        'POV: You Just Discovered': 'storytelling',
        'Psychology Trick That Makes People Listen': 'authority',
        'Before vs After: 30 Days': 'hero'
      }
      
      const templateId = Object.keys(templateMap).find(key => 
        selectedVideo.title?.includes(key)
      ) ? templateMap[Object.keys(templateMap).find(key => 
        selectedVideo.title?.includes(key)
      )!] : 'authority' // default
      
      const template = viralTemplates.find(t => t.id === templateId) || viralTemplates[0]
      setSelectedTemplate(template)
      setBackgroundMood(template.mood)
    }
  }, [selectedVideo, workspaceConfig])

  // Handle template selection
  const handleTemplateSelect = (template: ViralTemplate) => {
    setSelectedTemplate(template)
    setBackgroundMood(template.mood)
    
    // Clear content when switching templates
    setUserContent({ script: '', hook: '', style: '' })
    
    // Generate template-specific placeholder content
    const placeholders = getTemplatePlaceholders(template)
    setUserContent(placeholders)
  }

  // Generate template-specific placeholders (framework guidance without revealing frameworks)
  const getTemplatePlaceholders = (template: ViralTemplate) => {
    // Use ML suggestions if available
    if (workspaceConfig) {
      return {
        script: generateIntelligentScript(workspaceConfig),
        hook: workspaceConfig.suggestedHooks[0] || '',
        style: generateStyleSuggestion(workspaceConfig)
      }
    }
    
    // Fallback to static placeholders
    const placeholders: { [key: string]: any } = {
      authority: {
        script: `I lost 60 pounds doing one of these...\n\nAs a certified nutritionist with 10 years experience, I discovered the one thing that made all the difference was...`,
        hook: 'Credibility statement + surprising claim',
        style: 'Professional, confident, evidence-based'
      },
      storytelling: {
        script: `Is it possible to get a 6-pack without going to the gym?\n\nFirst, I tried the obvious solution but...\nThen something unexpected happened...\nThe answer changed everything...`,
        hook: 'Open narrative question',
        style: 'Engaging, suspenseful, relatable'
      },
      challenge: {
        script: `Turn $100 into $10K in 30 days\n\nDay 7: First $1000 or quit\nComment your predictions below...`,
        hook: 'Ambitious goal with timeline',
        style: 'Raw, authentic, data-driven'
      },
      controversial: {
        script: `I'm sorry but no amount of money could make me...\n\nHere's why I believe this...\nI know this might upset some people, but...`,
        hook: 'Polarizing statement',
        style: 'Bold, unapologetic, logical'
      },
      hero: {
        script: `6 months ago I was broke, depressed, and lost...\n\nToday, everything changed because...\nHere's exactly what I learned...`,
        hook: 'Transformation story',
        style: 'Inspirational, vulnerable, triumphant'
      },
      creative: {
        script: `Watch me create this incredible...\n\nThe secret technique nobody talks about...\nHere's the step-by-step process...`,
        hook: 'Creative process reveal',
        style: 'Artistic, innovative, educational'
      }
    }
    
    return placeholders[template.id] || placeholders.authority
  }

  // Handle content changes with real-time viral scoring
  const handleContentUpdate = (field: string, value: string) => {
    const updatedContent = { ...userContent, [field]: value }
    setUserContent(updatedContent)
    
    // Calculate real-time viral score (enhanced by hidden framework analysis)
    const newViralScore = calculateViralScore(updatedContent, selectedTemplate)
    setViralScore(newViralScore)
    
    // Notify parent component
    if (onContentChange) {
      onContentChange(updatedContent)
    }
  }

  // Calculate viral score (framework-enhanced but hidden from user)
  const calculateViralScore = (content: any, template: ViralTemplate | null) => {
    if (!template || !content.script) return 0
    
    const baseScore = selectedVideo?.viral_score || 75
    let score = baseScore
    
    // Framework-specific scoring (hidden logic)
    if (content.script.length > 50) score += 5
    if (content.script.length > 150) score += 5
    if (content.hook && content.hook.length > 10) score += 3
    if (content.style && content.style.length > 10) score += 2
    
    // Template-specific bonuses (framework logic hidden)
    const templateBonuses: { [key: string]: number } = {
      authority: content.script.includes('I') || content.script.includes('experience') ? 8 : 0,
      storytelling: content.script.includes('?') ? 6 : 0,
      challenge: content.script.includes('$') || content.script.includes('days') ? 7 : 0,
      controversial: content.script.includes('sorry') || content.script.includes('but') ? 5 : 0,
      hero: content.script.includes('ago') || content.script.includes('changed') ? 6 : 0,
      creative: content.script.includes('create') || content.script.includes('secret') ? 4 : 0
    }
    
    score += templateBonuses[template.id] || 0
    
    return Math.min(Math.max(score, 0), 100)
  }

  // 🎬 Handle video thumbnail click for inspiration (NEW)
  const handleVideoThumbnailClick = (video: any) => {
    console.log('🎬 User clicked related video for inspiration:', video.title)
    // Could open a preview modal, copy elements, or provide insights
    // For now, just log the interaction for analytics
  }

  return (
    <div className="value-template-editor">
      <style jsx>{`
        /* Enhanced Particles Background with Mood System */
        .value-template-editor {
          position: relative;
          min-height: 100vh;
          background: #000;
          overflow: hidden;
        }

        .particles-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: #000;
          transition: all 2s ease;
        }

        /* Format-specific background moods */
        .particles-bg.mood-authority {
          background: linear-gradient(135deg, #001a4d 0%, #003380 50%, #0052cc 100%);
        }

        .particles-bg.mood-storytelling {
          background: linear-gradient(135deg, #4d1f00 0%, #803300 50%, #cc5200 100%);
        }

        .particles-bg.mood-challenge {
          background: linear-gradient(135deg, #003300 0%, #006600 50%, #009900 100%);
        }

        .particles-bg.mood-controversial {
          background: linear-gradient(135deg, #4d0000 0%, #800000 50%, #cc0000 100%);
        }

        .particles-bg.mood-hero {
          background: linear-gradient(135deg, #1a004d 0%, #330080 50%, #5200cc 100%);
        }

        .particles-bg.mood-creative {
          background: linear-gradient(135deg, #004d4d 0%, #008080 50%, #00cccc 100%);
        }

        /* 🎬 Related Videos Row - Framework Examples */
        .story-row {
          height: 140px;
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 16px 32px;
          align-items: flex-start;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .story-row::-webkit-scrollbar {
          display: none;
        }

        /* Framework Indicator */
        .framework-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-right: 24px;
          padding: 16px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 12px;
          min-width: 120px;
        }

        .framework-badge {
          color: #00ff88;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .framework-confidence {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
        }

        /* Video Thumbnails */
        .video-thumbnail {
          width: 120px;
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.3s ease;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .video-thumbnail:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 255, 136, 0.5);
        }

        .thumbnail-container {
          position: relative;
          width: 100%;
          height: 68px;
          overflow: hidden;
        }

        .thumbnail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.7));
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .video-thumbnail:hover .video-overlay {
          opacity: 1;
        }

        .play-button {
          color: white;
          font-size: 20px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .viral-score {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 255, 136, 0.9);
          color: black;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .duration-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 10px;
        }

        .video-info {
          padding: 8px;
        }

        .video-title {
          color: white;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .video-stats {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Loading States */
        .video-thumbnail.loading {
          background: rgba(255, 255, 255, 0.05);
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 68px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .loading-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 1.5s infinite;
        }

        .loading-text {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin: 2px 0;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        /* No Videos Message */
        .no-videos-message {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          padding: 40px;
        }

        /* Workbench Grid */
        .workbench {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 32px;
          flex: 1;
          padding: 0 32px 24px 32px;
          min-height: 0;
          align-items: start;
        }

        /* Template Preview Card - Enhanced 3D Phone */
        .template-card {
          grid-column: span 6;
          background: transparent;
          border-radius: 24px;
          padding: 24px;
          min-width: 480px;
          perspective: 1000px;
          position: relative;
        }

        /* 3D Phone Container */
        .phone-container {
          position: relative;
          width: 380px;
          height: 750px;
          margin: 0 auto;
          transform-style: preserve-3d;
          transform: rotateY(-15deg) rotateX(5deg);
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .phone-container:hover {
          transform: rotateY(-5deg) rotateX(2deg) scale(1.02);
        }

        /* Phone Frame */
        .phone-frame {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 40px;
          padding: 12px;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.8),
            0 0 0 1px rgba(255,255,255,0.1),
            inset 0 0 0 1px rgba(255,255,255,0.05);
          transform: translateZ(20px);
        }

        /* Phone Screen */
        .phone-screen {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
          border-radius: 32px;
          overflow: hidden;
          transform: translateZ(40px);
          box-shadow: 
            inset 0 0 20px rgba(0,0,0,0.5),
            0 0 40px rgba(139, 92, 246, 0.2);
        }

        /* Screen Glow Effect */
        .phone-screen::before {
          content: '';
          position: absolute;
          inset: -50%;
          background: radial-gradient(circle at center, transparent 40%, rgba(139, 92, 246, 0.1) 100%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .phone-container:hover .phone-screen::before {
          opacity: 1;
        }

        .template-header {
          position: absolute;
          top: 30px;
          left: 30px;
          right: 30px;
          height: 48px;
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 10;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(10px);
          padding: 8px 12px;
          border-radius: 24px;
        }

        .template-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF3FA4, #833ab4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .template-username {
          font-size: 14px;
          font-weight: 600;
        }

        .template-format-badge {
          margin-left: auto;
          font-size: 10px;
          padding: 4px 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-canvas {
          position: absolute;
          inset: 80px 20px 120px 20px;
          background: #000;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 20px;
        }

        .preview-content {
          text-align: center;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.6s ease forwards;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .preview-text {
          color: white;
          font-size: 16px;
          line-height: 1.4;
          text-align: left;
          white-space: pre-wrap;
        }

        /* Editing Panel */
        .editing-panel {
          grid-column: span 6;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 24px;
          height: fit-content;
        }

        .editing-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .editing-tab {
          flex: 1;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .editing-tab.active {
          background: linear-gradient(135deg, #e50914, #ff1744);
          color: white;
        }

        .content-editor {
          margin-bottom: 24px;
        }

        .editor-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 8px;
        }

        .editor-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          transition: border-color 0.3s ease;
        }

        .editor-textarea:focus {
          outline: none;
          border-color: #e50914;
        }

        .editor-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Viral Score Meter */
        .viral-score-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }

        .score-meter {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 16px;
        }

        .score-circle {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .score-inner {
          width: 80%;
          height: 80%;
          border-radius: 50%;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .score-value {
          font-size: 24px;
          font-weight: bold;
          color: #00ff88;
        }

        .score-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .action-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #e50914, #ff1744);
          color: white;
        }

        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        /* 🧬 Viral DNA Analysis Styles */
        .viral-dna-panel, .framework-panel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .panel-header h4 {
          margin: 0;
          color: #00ff88;
          font-size: 16px;
          font-weight: 600;
        }

        .toggle-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .coefficients-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 16px;
        }

        .coefficient-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .coefficient-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          width: 80px;
          text-transform: capitalize;
        }

        .coefficient-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .coefficient-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
        }

        .coefficient-value {
          font-size: 12px;
          color: white;
          font-weight: 600;
          width: 40px;
          text-align: right;
        }

        .dna-section {
          margin-bottom: 16px;
        }

        .dna-section h5 {
          margin: 0 0 8px 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 600;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dna-tag {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .dna-tag.emotional {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .dna-tag.pattern {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        /* Framework Recommendations Styles */
        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .framework-name {
          color: #00ff88;
          font-weight: 600;
          font-size: 16px;
        }

        .confidence-badge {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .framework-reasoning {
          margin-bottom: 16px;
        }

        .reason-item {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .alternatives h5 {
          margin: 0 0 8px 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .alt-framework {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin-bottom: 4px;
        }
      `}</style>

      {/* Particles Background with Mood */}
      <div className={`particles-bg mood-${backgroundMood}`}></div>

      {/* 🎬 Related Videos Row - Framework Examples (Phase 3 Enhancement) */}
      <div className="story-row">
        {workspaceConfig?.recommendedFramework && (
          <div className="framework-indicator">
            <span className="framework-badge">
              🎯 {workspaceConfig.recommendedFramework.name}
            </span>
            <span className="framework-confidence">
              {Math.round(workspaceConfig.recommendedFramework.confidence * 100)}% match
            </span>
          </div>
        )}
        
        {isLoadingRelatedVideos ? (
          // Loading state
          Array.from({ length: 6 }).map((_, index) => (
            <div key={`loading-${index}`} className="video-thumbnail loading">
              <div className="thumbnail-placeholder">
                <div className="loading-shimmer"></div>
              </div>
              <div className="video-info">
                <div className="loading-text"></div>
              </div>
            </div>
          ))
        ) : relatedVideos.length > 0 ? (
          // Related videos from the same framework
          relatedVideos.map((video) => (
            <div
              key={video.id}
              className="video-thumbnail"
              onClick={() => handleVideoThumbnailClick(video)}
            >
              <div className="thumbnail-container">
                <img 
                  src={video.thumbnail_url || '/thumbnails/placeholder-template.jpg'} 
                  alt={video.title}
                  className="thumbnail-image"
                />
                <div className="video-overlay">
                  <div className="play-button">▶</div>
                  <div className="viral-score">{video.viral_score}%</div>
                </div>
                <div className="duration-badge">
                  {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="video-info">
                <div className="video-title">{video.title.slice(0, 40)}...</div>
                <div className="video-stats">
                  <span className="creator">@{video.creator_name}</span>
                  <span className="views">{(video.view_count / 1000000).toFixed(1)}M views</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Fallback when no related videos
          <div className="no-videos-message">
            <span>🎬 Loading framework examples...</span>
          </div>
        )}
      </div>

      {/* Workbench Grid */}
      <div className="workbench">
        {/* 3D Phone Preview */}
        <div className="template-card">
          <div className="phone-container">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="template-header">
                  <div className="template-avatar">
                    {selectedTemplate?.emoji || '👤'}
                  </div>
                  <span className="template-username">@viral_creator</span>
                  <div className="template-format-badge">
                    {selectedTemplate?.format || 'Format'}
                  </div>
                </div>
                <div className="preview-canvas">
                  <div className="preview-content">
                    <div className="preview-text">
                      {userContent.script || 'Start typing to see your content preview...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editing Panel */}
        <div className="editing-panel">
          <h3 style={{ color: 'white', marginBottom: '24px', fontSize: '20px', fontWeight: 'bold' }}>
            {selectedTemplate ? `${selectedTemplate.name} Editor` : 'Value Template Editor'}
          </h3>

          {/* Editing Tabs */}
          <div className="editing-tabs">
            <button 
              className={`editing-tab ${activeTab === 'script' ? 'active' : ''}`}
              onClick={() => setActiveTab('script')}
            >
              Script
            </button>
            <button 
              className={`editing-tab ${activeTab === 'hook' ? 'active' : ''}`}
              onClick={() => setActiveTab('hook')}
            >
              Hook
            </button>
            <button 
              className={`editing-tab ${activeTab === 'style' ? 'active' : ''}`}
              onClick={() => setActiveTab('style')}
            >
              Style
            </button>
          </div>

          {/* Content Editor */}
          <div className="content-editor">
            <label className="editor-label">
              {activeTab === 'script' && 'Video Script'}
              {activeTab === 'hook' && 'Opening Hook'}
              {activeTab === 'style' && 'Visual Style'}
            </label>
            <textarea
              className="editor-textarea"
              placeholder={
                activeTab === 'script' ? userContent.script || 'Create your viral script here...' :
                activeTab === 'hook' ? userContent.hook || 'Craft your attention-grabbing hook...' :
                userContent.style || 'Define your visual style and pacing...'
              }
              value={
                activeTab === 'script' ? userContent.script :
                activeTab === 'hook' ? userContent.hook :
                userContent.style
              }
              onChange={(e) => handleContentUpdate(activeTab, e.target.value)}
            />
          </div>

          {/* 🧬 Viral DNA Analysis Panel */}
          {workspaceConfig && (
            <div className="viral-dna-panel">
              <div className="panel-header">
                <h4>🧬 Viral DNA Analysis</h4>
                <button 
                  className="toggle-btn"
                  onClick={() => setShowViralDNA(!showViralDNA)}
                >
                  {showViralDNA ? '−' : '+'}
                </button>
              </div>
              
              {showViralDNA && (
                <div className="dna-content">
                  {/* Viral Coefficients */}
                  <div className="coefficients-grid">
                    {Object.entries(workspaceConfig.viralDNA.viralCoefficients).map(([key, value]) => (
                      <div key={key} className="coefficient-item">
                        <div className="coefficient-label">{key}</div>
                        <div className="coefficient-bar">
                          <div 
                            className="coefficient-fill"
                            style={{
                              width: `${value}%`,
                              background: value > 70 ? '#00ff88' : value > 40 ? '#ffaa00' : '#ff4444'
                            }}
                          />
                        </div>
                        <div className="coefficient-value">{value}%</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Emotional Triggers */}
                  <div className="dna-section">
                    <h5>🎭 Emotional Triggers</h5>
                    <div className="tags-container">
                      {workspaceConfig.viralDNA.emotionalTriggers.map(trigger => (
                        <span key={trigger} className="dna-tag emotional">{trigger}</span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Content Patterns */}
                  <div className="dna-section">
                    <h5>🔍 Content Patterns</h5>
                    <div className="tags-container">
                      {workspaceConfig.viralDNA.contentPatterns.map(pattern => (
                        <span key={pattern} className="dna-tag pattern">{pattern.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🚀 Framework Recommendations */}
          {workspaceConfig?.recommendedFramework && (
            <div className="framework-panel">
              <div className="recommendation-header">
                <div className="framework-name">
                  🎯 {workspaceConfig.recommendedFramework.name}
                </div>
                <div className="confidence-badge">
                  {workspaceConfig.recommendedFramework.confidence}% confidence
                </div>
              </div>
              
              <div className="framework-reasoning">
                {workspaceConfig.recommendedFramework.reasoning.map((reason, idx) => (
                  <div key={idx} className="reason-item">
                    • {reason}
                  </div>
                ))}
              </div>
              
              {/* Alternative Frameworks */}
              {workspaceConfig.alternativeFrameworks.length > 0 && (
                <div className="alternatives">
                  <h5>Alternative Frameworks:</h5>
                  {workspaceConfig.alternativeFrameworks.slice(0, 2).map(alt => (
                    <div key={alt.id} className="alt-framework">
                      {alt.name} ({alt.confidence}%)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Viral Score Meter */}
          <div className="viral-score-container">
            <div className="score-meter">
              <div className="score-circle" style={{
                background: `conic-gradient(
                  from 0deg,
                  #ff4444 0deg ${viralScore * 3.6}deg,
                  rgba(255, 255, 255, 0.1) ${viralScore * 3.6}deg 360deg
                )`
              }}>
                <div className="score-inner">
                  <div className="score-value">{Math.round(viralScore)}</div>
                  <div className="score-label">
                    {isLoadingConfig ? 'Analyzing...' : 'Viral Score'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
              {workspaceConfig?.recommendedFramework 
                ? `${workspaceConfig.recommendedFramework.name} • ${workspaceConfig.recommendedFramework.confidence}% match`
                : selectedTemplate?.description || 'Select a template to begin'
              }
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="action-buttons">
            <button 
              className="action-btn secondary"
              onClick={() => setShowViralDNA(!showViralDNA)}
            >
              🧬 {showViralDNA ? 'Hide' : 'Show'} DNA Analysis
            </button>
            <button className="action-btn primary">
              {isAnalyzing ? 'Analyzing...' : '🚀 Publish Content'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
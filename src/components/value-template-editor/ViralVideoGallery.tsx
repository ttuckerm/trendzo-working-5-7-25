"use client"

import React, { useState, useEffect, useRef } from 'react'
 

interface ViralVideo {
  id: string
  title: string
  creator_name: string
  thumbnail_url: string
  view_count: number
  viral_score: number
  platform: 'tiktok' | 'instagram' | 'youtube'
  duration_seconds: number
}

interface Props {
  onVideoSelect: (video: ViralVideo) => void
  selectedVideo: ViralVideo | null
  isLoading: boolean
  sourceApi?: string
}

export const ViralVideoGallery: React.FC<Props> = ({ 
  onVideoSelect, 
  selectedVideo, 
  isLoading,
  sourceApi,
}) => {
  const [viralVideos, setViralVideos] = useState<ViralVideo[]>([])
  const [loading, setLoading] = useState(true)
  const cursorRef = useRef<HTMLDivElement>(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })

  // Fallback mock data based on HTML template structure
  const fallbackViralVideos: ViralVideo[] = [
    {
      id: 'viral-001',
      title: 'How I Built a 7-Figure Business in 6 Months',
      creator_name: 'EntrepreneurJoe',
      thumbnail_url: '',
      view_count: 2400000,
      viral_score: 94,
      platform: 'tiktok',
      duration_seconds: 32
    },
    {
      id: 'viral-002', 
      title: 'This Morning Routine Changed My Life',
      creator_name: 'MotivationMaria',
      thumbnail_url: '',
      view_count: 1800000,
      viral_score: 87,
      platform: 'tiktok',
      duration_seconds: 28
    },
    {
      id: 'viral-003',
      title: 'Secret Productivity Hack Nobody Talks About',
      creator_name: 'ProductivityPro', 
      thumbnail_url: '',
      view_count: 3100000,
      viral_score: 91,
      platform: 'tiktok',
      duration_seconds: 35
    },
    {
      id: 'viral-004',
      title: 'POV: You Just Discovered the Perfect Recipe',
      creator_name: 'ChefCreative',
      thumbnail_url: '',
      view_count: 1200000,
      viral_score: 83,
      platform: 'instagram',
      duration_seconds: 24
    },
    {
      id: 'viral-005',
      title: 'The Psychology Trick That Makes People Listen',
      creator_name: 'PsychHacker',
      thumbnail_url: '',
      view_count: 2900000,
      viral_score: 96,
      platform: 'tiktok',
      duration_seconds: 41
    },
    {
      id: 'viral-006',
      title: 'Before vs After: 30 Days of This Habit',
      creator_name: 'TransformationTina',
      thumbnail_url: '',
      view_count: 1600000,
      viral_score: 79,
      platform: 'tiktok',
      duration_seconds: 26
    }
  ]

  // Load viral videos from API with fallback
  useEffect(() => {
    const loadViralVideos = async () => {
      try {
        const api = sourceApi || '/api/value-template-editor/viral-videos'
        const response = await fetch(api)
        const data = await response.json()

        // Case 1: { success: true, data: ViralVideo[] }
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setViralVideos(data.data)
          return
        }

        // Case 2: Array from gallery endpoints
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ViralVideo[] = data.map((v: any) => ({
            id: String(v.id),
            title: v.title || v.caption || 'Untitled',
            creator_name: v.creator_name || 'Unknown',
            thumbnail_url: v.thumbnail_url || '',
            view_count: v.stats?.views ?? v.views ?? 0,
            viral_score: Math.round((v.viral_score ?? 0.85) * (v.viral_score <= 1 ? 100 : 1)),
            platform: (v.platform || 'tiktok') as 'tiktok' | 'instagram' | 'youtube',
            duration_seconds: v.duration_sec ?? v.duration_seconds ?? 0,
          }))
          setViralVideos(mapped)
          return
        }

        // Fallback
        setViralVideos(fallbackViralVideos)
      } catch (error) {
        console.error('Failed to load viral videos, using fallback data:', error)
        // Use fallback data if API fails completely
        setViralVideos(fallbackViralVideos)
      } finally {
        setLoading(false)
      }
    }

    loadViralVideos()
  }, [sourceApi])

  // Custom cursor animation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }

    const animateCursor = () => {
      const dx = mousePos.current.x - cursorPos.current.x
      const dy = mousePos.current.y - cursorPos.current.y
      
      cursorPos.current.x += dx * 0.1
      cursorPos.current.y += dy * 0.1
      
      if (cursorRef.current) {
        cursorRef.current.style.left = cursorPos.current.x + 'px'
        cursorRef.current.style.top = cursorPos.current.y + 'px'
      }
      
      requestAnimationFrame(animateCursor)
    }

    document.addEventListener('mousemove', handleMouseMove)
    animateCursor()

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M'
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K'
    }
    return views.toString()
  }

  // Generate different gradient colors for each video card (like HTML template)
  const getGradientForVideo = (videoId: string, index: number): string => {
    const gradients = [
      'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)', // Purple to Pink
      'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', // Red to Orange  
      'linear-gradient(135deg, #48dbfb 0%, #0abde3 100%)', // Light Blue to Blue
      'linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%)', // Light Green to Green
      'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)', // Pink to Dark Pink
      'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', // Yellow to Orange
    ]
    return gradients[index % gradients.length]
  }

  const handleVideoSelect = (video: ViralVideo) => {
    onVideoSelect(video)
  }

  const handleCursorEnter = () => {
    if (cursorRef.current) {
      cursorRef.current.classList.add('hover')
    }
  }

  const handleCursorLeave = () => {
    if (cursorRef.current) {
      cursorRef.current.classList.remove('hover')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="viral-gallery-loading">
        <div className="loading-dots">
          <div className="loading-dot" style={{ '--i': 0 } as React.CSSProperties}></div>
          <div className="loading-dot" style={{ '--i': 1 } as React.CSSProperties}></div>
          <div className="loading-dot" style={{ '--i': 2 } as React.CSSProperties}></div>
        </div>
        <style jsx>{`
          .viral-gallery-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
          }
          .loading-dots {
            display: flex;
            gap: 8px;
          }
          .loading-dot {
            width: 12px;
            height: 12px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border-radius: 50%;
            animation: loading-bounce 1.5s ease-in-out infinite;
            animation-delay: calc(var(--i) * 0.2s);
          }
          @keyframes loading-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="viral-video-gallery">
      {/* Custom cursor */}
      <div ref={cursorRef} className="cursor" />

      {/* Ambient background */}
      <div className="ambient-bg" />

      {/* Floating orbs */}
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />

      {/* Header */}
      <div className="gallery-header">
        <div className="logo">Viral DNA™</div>
        {/* <div className="trending-badge">
          <div className="live-indicator" />
          <span>{viralVideos.length} Viral Templates Available</span>
        </div> */}
        
      </div>

      {/* Template feed */}
      <div className="template-feed">
        <div className="feed-grid">
          {viralVideos.map((video, index) => (
            <article 
              key={video.id}
              className={`template-card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              onMouseEnter={handleCursorEnter}
              onMouseLeave={handleCursorLeave}
            >
              
              
              {/* Viral DNA indicator */}
              <div className="viral-dna">
                <div className="dna-dot" style={{ '--i': 0 } as React.CSSProperties} />
                <div className="dna-dot" style={{ '--i': 1 } as React.CSSProperties} />
                <div className="dna-dot" style={{ '--i': 2 } as React.CSSProperties} />
              </div>
              
              {/* Video preview */}
              <div className="video-preview">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={`${video.title} preview`}
                    className="video-placeholder"
                  />
                ) : (
                  <div 
                    className="video-placeholder-gradient"
                    style={{
                      background: getGradientForVideo(video.id, index)
                    }}
                  >
                    <span className="video-title-overlay">{video.title}</span>
                  </div>
                )}
                <div className="play-overlay">
                  <div className="play-button">▶️</div>
                </div>
              </div>
              
              {/* Template info */}
              <div className="template-info">
                <div className="template-stats">
                  <div className="stat">
                    <span className="stat-icon">👁️</span>
                    <span className="stat-number">{formatViews(video.view_count)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">❤️</span>
                    <span className="stat-number">{formatViews(Math.floor(video.view_count * 0.15))}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-number">{video.viral_score}%</span>
                  </div>
                </div>
                
                <h3 className="template-title">{video.title}</h3>
                <p className="template-description">
                  Created by {video.creator_name} • {video.platform.toUpperCase()} • {video.duration_seconds}s
                </p>
                
                <div className="trending-sound">
                  <span className="sound-icon">🎵</span>
                  <span>Viral Success Pattern Identified</span>
                </div>
                
                <button 
                  className="use-template"
                  onClick={() => handleVideoSelect(video)}
                  onMouseEnter={handleCursorEnter}
                  onMouseLeave={handleCursorLeave}
                >
                  Create with this template ✨
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .viral-video-gallery {
          position: relative;
          background: #000;
          color: #fff;
          min-height: 600px;
          overflow: hidden;
          cursor: none;
        }

        /* Custom cursor */
        .cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle, rgba(123, 97, 255, 0.8) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transform: translate(-50%, -50%);
          transition: transform 0.1s ease-out;
          mix-blend-mode: screen;
        }

        .cursor.hover {
          transform: translate(-50%, -50%) scale(2);
          background: radial-gradient(circle, rgba(255, 97, 166, 0.8) 0%, transparent 70%);
        }

        /* Background ambient */
        .ambient-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(123, 97, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(255, 97, 166, 0.05) 0%, transparent 50%);
          animation: ambient-shift 20s ease-in-out infinite;
          z-index: -1;
        }

        @keyframes ambient-shift {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
        }

        /* Floating orbs */
        .floating-orb {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          pointer-events: none;
          animation: float-orb 20s ease-in-out infinite;
        }

        .orb-1 {
          left: 10%;
          top: 20%;
          background: radial-gradient(circle, rgba(123, 97, 255, 0.2) 0%, transparent 70%);
        }

        .orb-2 {
          right: 10%;
          bottom: 20%;
          background: radial-gradient(circle, rgba(255, 97, 166, 0.2) 0%, transparent 70%);
          animation-duration: 25s;
          animation-delay: -5s;
        }

        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.2); }
          66% { transform: translate(-30px, 30px) scale(0.8); }
        }

        /* Header */
        .gallery-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
          backdrop-filter: blur(20px);
        }

        .logo {
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: logo-pulse 3s ease-in-out infinite;
        }

        @keyframes logo-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .trending-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          font-size: 14px;
          animation: badge-glow 2s ease-in-out infinite;
        }

        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(123, 97, 255, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 97, 166, 0.4); }
        }

        .live-indicator {
          width: 8px;
          height: 8px;
          background: #ff4458;
          border-radius: 50%;
          animation: live-pulse 1s ease-out infinite;
        }

        @keyframes live-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }

        /* Template feed */
        .template-feed {
          padding: 20px 32px;
        }

        .feed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 32px;
          animation: feed-load 0.8s ease-out;
        }

        @keyframes feed-load {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Template card */
        .template-card {
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          transform-style: preserve-3d;
          animation: card-appear 0.6s ease-out backwards;
        }

        .template-card.selected {
          border-color: rgba(123, 97, 255, 0.5);
          box-shadow: 0 0 30px rgba(123, 97, 255, 0.4);
        }

        @keyframes card-appear {
          from { opacity: 0; transform: translateY(30px) rotateX(-10deg); }
          to { opacity: 1; transform: translateY(0) rotateX(0); }
        }

        .template-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(123, 97, 255, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .template-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(123, 97, 255, 0.3);
          box-shadow: 
            0 20px 40px rgba(123, 97, 255, 0.3),
            0 0 80px rgba(123, 97, 255, 0.2);
        }

        .template-card:hover::before {
          opacity: 1;
        }

        /* Video preview */
        .video-preview {
          position: relative;
          width: 100%;
          height: 400px;
          background: #000;
          overflow: hidden;
        }

        .video-placeholder, .video-placeholder-gradient {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .video-placeholder-gradient {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-title-overlay {
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .template-card:hover .video-placeholder,
        .template-card:hover .video-placeholder-gradient {
          transform: scale(1.1);
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          opacity: 1;
          transition: opacity 0.3s;
        }

        .template-card:hover .play-overlay {
          opacity: 0;
        }

        .play-button {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.3s;
        }

        .play-button:hover {
          transform: scale(1.1);
          background: rgba(123, 97, 255, 0.3);
        }

        /* Viral DNA indicator */
        .viral-dna {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 6px;
          z-index: 10;
        }

        .dna-dot {
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
          border-radius: 50%;
          animation: dna-pulse 2s ease-in-out infinite;
          animation-delay: calc(var(--i) * 0.2s);
        }

        @keyframes dna-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 1; }
        }

        /* Template info */
        .template-info {
          padding: 20px;
        }

        .template-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .stat-icon {
          font-size: 16px;
        }

        .stat-number {
          font-weight: 600;
          background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .template-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 6px;
          transition: color 0.3s;
        }

        .template-card:hover .template-title {
          background: linear-gradient(135deg, #fff 0%, #7b61ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .template-description {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
        }

        /* Trending sound */
        .trending-sound {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 12px 0;
          padding: 6px 12px;
          background: rgba(123, 97, 255, 0.1);
          border: 1px solid rgba(123, 97, 255, 0.2);
          border-radius: 100px;
          font-size: 12px;
          transition: all 0.3s;
        }

        .trending-sound:hover {
          background: rgba(123, 97, 255, 0.2);
          border-color: rgba(123, 97, 255, 0.4);
        }

        .sound-icon {
          font-size: 14px;
          animation: sound-wave 1s ease-in-out infinite;
        }

        @keyframes sound-wave {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        /* Use template button */
        .use-template {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          opacity: 0;
          transform: translateY(10px);
        }

        .template-card:hover .use-template {
          opacity: 1;
          transform: translateY(0);
        }

        .use-template:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .feed-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .gallery-header {
            padding: 16px 20px;
          }
          .template-feed {
            padding: 16px 20px;
          }
          .viral-video-gallery {
            cursor: auto;
          }
          .cursor {
            display: none;
          }
        }

        

        .starter-ribbon {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 12;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
} 
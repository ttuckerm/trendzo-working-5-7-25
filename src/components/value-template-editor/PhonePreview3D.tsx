"use client"

import React, { useState, useEffect } from 'react'
import { Play, Heart, MessageCircle, Share, Bookmark, Volume2 } from 'lucide-react'

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

interface UserContent {
  script: string
  style: string
  hook: string
}

interface ViralPrediction {
  viral_score: number
  confidence: number
  predicted_views: number
  estimated_engagement_rate: number
  suggestions: string[]
  breakdown: {
    hook_score: number
    content_score: number
    timing_score: number
    platform_fit_score: number
  }
}

interface Props {
  userContent: UserContent
  selectedVideo: ViralVideo | null
  viralPrediction: ViralPrediction | null
}

export const PhonePreview3D: React.FC<Props> = ({
  userContent,
  selectedVideo,
  viralPrediction
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showOverlay, setShowOverlay] = useState(true)

  const platform = selectedVideo?.platform || 'tiktok'
  const duration = selectedVideo?.duration_seconds || 30

  // Auto-play simulation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      setShowOverlay(false)
    }
  }

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M'
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K'
    }
    return views.toString()
  }

  const getLikes = (): string => {
    if (!viralPrediction) return '0'
    const predictedLikes = Math.floor(viralPrediction.predicted_views * viralPrediction.estimated_engagement_rate * 0.7)
    return formatViews(predictedLikes)
  }

  const getComments = (): string => {
    if (!viralPrediction) return '0'
    const predictedComments = Math.floor(viralPrediction.predicted_views * viralPrediction.estimated_engagement_rate * 0.1)
    return formatViews(predictedComments)
  }

  const getShares = (): string => {
    if (!viralPrediction) return '0'
    const predictedShares = Math.floor(viralPrediction.predicted_views * viralPrediction.estimated_engagement_rate * 0.05)
    return formatViews(predictedShares)
  }

  const getPlatformColors = () => {
    switch (platform) {
      case 'tiktok':
        return {
          primary: '#fe2c55',
          secondary: '#25f4ee',
          background: '#000'
        }
      case 'instagram':
        return {
          primary: '#e4405f',
          secondary: '#f77737',
          background: '#000'
        }
      case 'youtube':
        return {
          primary: '#ff0000',
          secondary: '#282828',
          background: '#0f0f0f'
        }
      default:
        return {
          primary: '#fe2c55',
          secondary: '#25f4ee',
          background: '#000'
        }
    }
  }

  const colors = getPlatformColors()

  return (
    <div className="phone-preview-3d">
      <div className="phone-container">
        {/* Phone frame */}
        <div className="phone-frame">
          {/* Screen */}
          <div className="phone-screen">
            {/* Video content area */}
            <div className="video-content" style={{ backgroundColor: colors.background }}>
              {/* Background gradient based on style */}
              <div 
                className="content-background"
                style={{
                  background: userContent.style.includes('gradient') 
                    ? 'linear-gradient(135deg, #7b61ff, #ff61a6)'
                    : userContent.style.includes('dark')
                    ? '#1a1a1a'
                    : '#000'
                }}
              />

              {/* Hook text overlay */}
              {userContent.hook && (
                <div className="hook-overlay">
                  <div className="hook-text">
                    {userContent.hook}
                  </div>
                </div>
              )}

              {/* Script content */}
              {userContent.script && (
                <div className="script-content">
                  <p>{userContent.script}</p>
                </div>
              )}

              {/* Play button overlay */}
              {showOverlay && !isPlaying && (
                <div className="play-overlay" onClick={togglePlay}>
                  <div className="play-button">
                    <Play className="play-icon" fill="white" />
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Platform UI elements */}
              <div className="platform-ui">
                {/* Top bar */}
                <div className="top-bar">
                  <div className="user-info">
                    <div className="avatar">
                      {selectedVideo?.creator_name?.charAt(0) || 'U'}
                    </div>
                    <div className="username">
                      @{selectedVideo?.creator_name?.toLowerCase().replace(/\s+/g, '') || 'creator'}
                    </div>
                  </div>
                  <Volume2 className="volume-icon" />
                </div>

                {/* Side actions */}
                <div className="side-actions">
                  <div className="action-button">
                    <Heart className="action-icon" />
                    <span className="action-count">{getLikes()}</span>
                  </div>
                  
                  <div className="action-button">
                    <MessageCircle className="action-icon" />
                    <span className="action-count">{getComments()}</span>
                  </div>
                  
                  <div className="action-button">
                    <Share className="action-icon" />
                    <span className="action-count">{getShares()}</span>
                  </div>
                  
                  <div className="action-button">
                    <Bookmark className="action-icon" />
                  </div>
                </div>

                {/* Bottom info */}
                <div className="bottom-info">
                  <div className="video-title">
                    {selectedVideo?.title || 'Viral Video'}
                  </div>
                  {viralPrediction && (
                    <div className="viral-prediction-badge">
                      🔥 {viralPrediction.viral_score}% Viral Score
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Phone details */}
          <div className="phone-details">
            <div className="camera-notch" />
            <div className="speaker" />
          </div>
        </div>

        {/* Platform indicator */}
        <div className="platform-indicator">
          <div className="platform-badge" style={{ backgroundColor: colors.primary }}>
            {platform.toUpperCase()}
          </div>
        </div>

        {/* 3D shadow */}
        <div className="phone-shadow" />
      </div>

      {/* Preview stats */}
      {viralPrediction && (
        <div className="preview-stats">
          <div className="stat-item">
            <span className="stat-label">Predicted Views</span>
            <span className="stat-value">{formatViews(viralPrediction.predicted_views)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Engagement Rate</span>
            <span className="stat-value">{(viralPrediction.estimated_engagement_rate * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Confidence</span>
            <span className="stat-value">{viralPrediction.confidence}%</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .phone-preview-3d {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(17, 17, 17, 0.9) 100%);
          border-radius: 16px;
          min-height: 600px;
          position: relative;
        }

        .phone-container {
          position: relative;
          transform-style: preserve-3d;
          animation: phoneFloat 6s ease-in-out infinite;
        }

        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0px) rotateY(-5deg); }
          50% { transform: translateY(-10px) rotateY(5deg); }
        }

        .phone-frame {
          width: 280px;
          height: 560px;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          border-radius: 32px;
          padding: 12px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3);
          position: relative;
          transform: perspective(1000px) rotateY(-10deg) rotateX(5deg);
          transition: transform 0.6s ease;
        }

        .phone-frame:hover {
          transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
        }

        .phone-screen {
          width: 100%;
          height: 100%;
          background: #000;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
        }

        .video-content {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .content-background {
          position: absolute;
          inset: 0;
          opacity: 0.8;
        }

        .hook-overlay {
          position: absolute;
          top: 100px;
          left: 20px;
          right: 20px;
          z-index: 2;
        }

        .hook-text {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .script-content {
          position: absolute;
          bottom: 120px;
          left: 20px;
          right: 80px;
          z-index: 2;
        }

        .script-content p {
          color: white;
          font-size: 14px;
          line-height: 1.4;
          background: rgba(0, 0, 0, 0.5);
          padding: 12px;
          border-radius: 8px;
          backdrop-filter: blur(5px);
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          cursor: pointer;
          z-index: 3;
        }

        .play-button {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .play-button:hover {
          transform: scale(1.1);
          background: white;
        }

        .play-icon {
          width: 32px;
          height: 32px;
          margin-left: 4px;
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.3);
          z-index: 4;
        }

        .progress-fill {
          height: 100%;
          background: ${colors.primary};
          transition: width 0.1s linear;
        }

        .platform-ui {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }

        .top-bar {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: ${colors.primary};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .username {
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .volume-icon {
          width: 20px;
          height: 20px;
          color: white;
        }

        .side-actions {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .action-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          color: white;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }

        .action-count {
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .bottom-info {
          position: absolute;
          bottom: 60px;
          left: 20px;
          right: 80px;
        }

        .video-title {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .viral-prediction-badge {
          background: linear-gradient(135deg, #7b61ff, #ff61a6);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .phone-details {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
        }

        .camera-notch {
          width: 60px;
          height: 24px;
          background: #000;
          border-radius: 12px;
          margin: 0 auto 4px;
        }

        .speaker {
          width: 40px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          margin: 0 auto;
        }

        .platform-indicator {
          position: absolute;
          top: -20px;
          right: -20px;
        }

        .platform-badge {
          padding: 6px 12px;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .phone-shadow {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 40px;
          background: radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: shadowPulse 6s ease-in-out infinite;
        }

        @keyframes shadowPulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.1); }
        }

        .preview-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 32px;
          width: 100%;
          max-width: 280px;
        }

        .stat-item {
          text-align: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: ${colors.primary};
        }

        @media (max-width: 768px) {
          .phone-frame {
            width: 240px;
            height: 480px;
            transform: perspective(800px) rotateY(-5deg) rotateX(2deg);
          }
          
          .phone-frame:hover {
            transform: perspective(800px) rotateY(0deg) rotateX(0deg);
          }
          
          .preview-stats {
            grid-template-columns: 1fr;
            max-width: 240px;
          }
        }
      `}</style>
    </div>
  )
} 
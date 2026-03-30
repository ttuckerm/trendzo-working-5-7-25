"use client"

import React, { useState, useEffect } from 'react'
import { TrendingUp, Zap, Target, Eye, Heart, Brain, Clock, Sparkles } from 'lucide-react'

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
  prediction: ViralPrediction | null
  isAnalyzing: boolean
  selectedVideo: ViralVideo | null
}

export const ViralScoreDisplay: React.FC<Props> = ({ 
  prediction, 
  isAnalyzing, 
  selectedVideo 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [animatedBreakdown, setAnimatedBreakdown] = useState({
    hook_score: 0,
    content_score: 0,
    timing_score: 0,
    platform_fit_score: 0
  })

  // Animate score changes
  useEffect(() => {
    if (prediction) {
      const targetScore = prediction.viral_score
      const targetBreakdown = prediction.breakdown
      
      let startTime: number
      const duration = 1500 // 1.5 seconds

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        
        // Easing function for smooth animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
        const easedProgress = easeOutCubic(progress)
        
        setAnimatedScore(Math.round(targetScore * easedProgress))
        setAnimatedBreakdown({
          hook_score: Math.round(targetBreakdown.hook_score * easedProgress),
          content_score: Math.round(targetBreakdown.content_score * easedProgress),
          timing_score: Math.round(targetBreakdown.timing_score * easedProgress),
          platform_fit_score: Math.round(targetBreakdown.platform_fit_score * easedProgress)
        })

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    } else {
      setAnimatedScore(0)
      setAnimatedBreakdown({
        hook_score: 0,
        content_score: 0,
        timing_score: 0,
        platform_fit_score: 0
      })
    }
  }, [prediction])

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M'
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K'
    }
    return views.toString()
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981' // Green
    if (score >= 70) return '#f59e0b' // Yellow
    if (score >= 50) return '#f97316' // Orange
    return '#ef4444' // Red
  }

  const getScoreGradient = (score: number): string => {
    if (score >= 90) return 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    if (score >= 70) return 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
    if (score >= 50) return 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
    return 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
  }

  if (isAnalyzing) {
    return (
      <div className="viral-score-display analyzing">
        <div className="analyzing-header">
          <Brain className="analyzing-icon" />
          <span>Analyzing Viral Potential...</span>
        </div>
        
        <div className="analyzing-animation">
          <div className="pulse-rings">
            <div className="pulse-ring ring-1" />
            <div className="pulse-ring ring-2" />
            <div className="pulse-ring ring-3" />
          </div>
          <div className="center-logo">🧬</div>
        </div>

        <div className="analyzing-steps">
          <div className="step active">
            <Sparkles className="step-icon" />
            <span>Scanning viral patterns...</span>
          </div>
          <div className="step">
            <Target className="step-icon" />
            <span>Calculating engagement potential...</span>
          </div>
          <div className="step">
            <TrendingUp className="step-icon" />
            <span>Generating predictions...</span>
          </div>
        </div>

        <style jsx>{`
          .viral-score-display.analyzing {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 32px;
            background: linear-gradient(135deg, rgba(123, 97, 255, 0.05) 0%, rgba(255, 97, 166, 0.05) 100%);
            border: 1px solid rgba(123, 97, 255, 0.2);
            border-radius: 16px;
            min-height: 400px;
            justify-content: center;
          }

          .analyzing-header {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 600;
            color: #7b61ff;
            margin-bottom: 32px;
          }

          .analyzing-icon {
            animation: brain-pulse 2s ease-in-out infinite;
          }

          @keyframes brain-pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 1; }
          }

          .analyzing-animation {
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 32px;
          }

          .pulse-rings {
            position: absolute;
            inset: 0;
          }

          .pulse-ring {
            position: absolute;
            inset: 0;
            border: 2px solid rgba(123, 97, 255, 0.3);
            border-radius: 50%;
            animation: pulse-expand 2s ease-out infinite;
          }

          .ring-1 { animation-delay: 0s; }
          .ring-2 { animation-delay: 0.5s; }
          .ring-3 { animation-delay: 1s; }

          @keyframes pulse-expand {
            0% {
              transform: scale(0.5);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }

          .center-logo {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            animation: logo-rotate 3s linear infinite;
          }

          @keyframes logo-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .analyzing-steps {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            max-width: 300px;
          }

          .step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            transition: all 0.3s;
            opacity: 0.5;
          }

          .step.active {
            opacity: 1;
            background: rgba(123, 97, 255, 0.1);
            border-color: rgba(123, 97, 255, 0.3);
          }

          .step-icon {
            width: 16px;
            height: 16px;
          }
        `}</style>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className="viral-score-display empty">
        <div className="empty-state">
          <Target className="empty-icon" />
          <h3>Ready for Viral Analysis</h3>
          <p>Select a viral video and start creating content to see real-time predictions</p>
        </div>

        <style jsx>{`
          .viral-score-display.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 24px;
            min-height: 400px;
            background: rgba(255, 255, 255, 0.02);
            border: 2px dashed rgba(255, 255, 255, 0.1);
            border-radius: 16px;
          }

          .empty-state {
            text-align: center;
            max-width: 280px;
          }

          .empty-icon {
            width: 48px;
            height: 48px;
            color: rgba(255, 255, 255, 0.4);
            margin: 0 auto 16px;
          }

          .empty-state h3 {
            font-size: 20px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
          }

          .empty-state p {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="viral-score-display">
      {/* Main viral score */}
      <div className="main-score">
        <div className="score-circle">
          <svg className="score-ring" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(animatedScore / 100) * 283} 283`}
              transform="rotate(-90 50 50)"
              className="score-progress"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7b61ff" />
                <stop offset="100%" stopColor="#ff61a6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="score-content">
            <div className="score-number">{animatedScore}%</div>
            <div className="score-label">Viral Score</div>
          </div>
        </div>
        
        <div className="confidence-indicator">
          <Zap className="confidence-icon" />
          <span>{prediction.confidence}% Confidence</span>
        </div>
      </div>

      {/* Prediction metrics */}
      <div className="prediction-metrics">
        <div className="metric">
          <Eye className="metric-icon views" />
          <div className="metric-content">
            <div className="metric-value">{formatViews(prediction.predicted_views)}</div>
            <div className="metric-label">Predicted Views</div>
          </div>
        </div>
        
        <div className="metric">
          <Heart className="metric-icon engagement" />
          <div className="metric-content">
            <div className="metric-value">{(prediction.estimated_engagement_rate * 100).toFixed(1)}%</div>
            <div className="metric-label">Engagement Rate</div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="score-breakdown">
        <h4 className="breakdown-title">Performance Breakdown</h4>
        
        <div className="breakdown-items">
          <div className="breakdown-item">
            <div className="breakdown-header">
              <Sparkles className="breakdown-icon" />
              <span>Hook Impact</span>
              <span className="breakdown-score">{animatedBreakdown.hook_score}%</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill"
                style={{ 
                  width: `${animatedBreakdown.hook_score}%`,
                  background: getScoreGradient(animatedBreakdown.hook_score)
                }}
              />
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <Brain className="breakdown-icon" />
              <span>Content Quality</span>
              <span className="breakdown-score">{animatedBreakdown.content_score}%</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill"
                style={{ 
                  width: `${animatedBreakdown.content_score}%`,
                  background: getScoreGradient(animatedBreakdown.content_score)
                }}
              />
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <Clock className="breakdown-icon" />
              <span>Timing Optimization</span>
              <span className="breakdown-score">{animatedBreakdown.timing_score}%</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill"
                style={{ 
                  width: `${animatedBreakdown.timing_score}%`,
                  background: getScoreGradient(animatedBreakdown.timing_score)
                }}
              />
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <Target className="breakdown-icon" />
              <span>Platform Fit</span>
              <span className="breakdown-score">{animatedBreakdown.platform_fit_score}%</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill"
                style={{ 
                  width: `${animatedBreakdown.platform_fit_score}%`,
                  background: getScoreGradient(animatedBreakdown.platform_fit_score)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI suggestions */}
      {prediction.suggestions && prediction.suggestions.length > 0 && (
        <div className="ai-suggestions">
          <h4 className="suggestions-title">💡 AI Optimization Tips</h4>
          <div className="suggestions-list">
            {prediction.suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <TrendingUp className="suggestion-icon" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .viral-score-display {
          padding: 24px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(17, 17, 17, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: white;
        }

        .main-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }

        .score-circle {
          position: relative;
          width: 160px;
          height: 160px;
          margin-bottom: 16px;
        }

        .score-ring {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .score-progress {
          transition: stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .score-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-number {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .score-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(123, 97, 255, 0.1);
          border: 1px solid rgba(123, 97, 255, 0.3);
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
        }

        .confidence-icon {
          width: 16px;
          height: 16px;
          color: #7b61ff;
        }

        .prediction-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .metric-icon {
          width: 24px;
          height: 24px;
        }

        .metric-icon.views {
          color: #3b82f6;
        }

        .metric-icon.engagement {
          color: #ef4444;
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .metric-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .score-breakdown {
          margin-bottom: 24px;
        }

        .breakdown-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: rgba(255, 255, 255, 0.9);
        }

        .breakdown-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .breakdown-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .breakdown-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .breakdown-icon {
          width: 16px;
          height: 16px;
          color: rgba(255, 255, 255, 0.7);
        }

        .breakdown-score {
          margin-left: auto;
          font-weight: 600;
          color: #7b61ff;
        }

        .breakdown-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .breakdown-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ai-suggestions {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 20px;
        }

        .suggestions-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: rgba(255, 255, 255, 0.9);
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.4;
        }

        .suggestion-icon {
          width: 14px;
          height: 14px;
          color: #10b981;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
} 
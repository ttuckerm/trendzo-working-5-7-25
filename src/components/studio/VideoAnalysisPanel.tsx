'use client';

import { useState } from 'react';
import { StudioVideo } from '@/app/admin/(studio)/studio/page';

interface VideoAnalysisPanelProps {
  videos: StudioVideo[];
  isLoading: boolean;
  error: string | null;
}

// Helper function to format view counts
const formatViews = (views: number | null | undefined): string => {
  if (views === null || views === undefined) {
    return '0';
  }
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

// Helper function to determine score badge color
const getScoreClass = (score: number): string => {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
};

export default function VideoAnalysisPanel({ videos, isLoading, error }: VideoAnalysisPanelProps) {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  console.log('VideoAnalysisPanel rendering with:', { videos: videos?.length, isLoading, error });

  if (isLoading) {
    return (
      <div className="video-analysis">
        <div className="analysis-header">
          <h2 className="analysis-title">Video Content Analysis</h2>
        </div>
        
        <div className="video-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="video-card">
              <div className="video-thumbnail">
                <div className="video-placeholder">
                  Loading video analysis...
                </div>
              </div>
              <div className="video-content">
                <h3 className="video-title">Loading...</h3>
                <p className="video-creator">@Loading</p>
                <div className="video-stats">
                  <span>👁️ ---</span>
                  <span>❤️ ---</span>
                  <span>💬 ---</span>
                  <span>📤 ---</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-analysis">
        <div className="analysis-header">
          <h2 className="analysis-title">Video Content Analysis</h2>
        </div>
        
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: '#ff6b6b', marginBottom: '16px' }}>Failed to load videos</h3>
          <p style={{ color: '#888', marginBottom: '20px' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="video-analysis">
        <div className="analysis-header">
          <h2 className="analysis-title">Video Content Analysis</h2>
        </div>
        
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: '#888', marginBottom: '16px' }}>No videos found</h3>
          <p style={{ color: '#666' }}>Your Apify scraper may not have run yet, or no videos matched the current filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-analysis">
      <div className="analysis-header">
        <h2 className="analysis-title">Video Content Analysis</h2>
      </div>
      
      <div className="video-grid">
        {videos.map((video) => {
          const isHovering = hoveredVideo === video.id;
          const hasVideoPreview = video.video_preview_url;
          
          return (
            <div 
              key={video.id}
              className="video-card"
              onMouseEnter={() => setHoveredVideo(video.id)}
              onMouseLeave={() => setHoveredVideo(null)}
            >
              <div className="video-thumbnail">
                {hasVideoPreview && isHovering ? (
                  <video
                    src={video.video_preview_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="video-preview"
                  />
                ) : video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url}
                    alt={video.title}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'video-placeholder';
                      placeholder.textContent = 'Video content analysis in progress...';
                      (e.target as HTMLImageElement).parentNode?.appendChild(placeholder);
                    }}
                  />
                ) : (
                  <div className="video-placeholder">
                    Video content analysis in progress...
                  </div>
                )}
                
                {/* Video overlay with play button */}
                <div className="video-overlay">
                  <div className="play-button">▶</div>
                </div>
                
                {/* Score badge */}
                <div className={`score-badge ${getScoreClass(video.engagement_score)}`}>
                  {Math.round(video.engagement_score)}%
                </div>
              </div>
              
              <div className="video-content">
                <h3 className="video-title">{video.title}</h3>
                <p className="video-creator">@{video.creator}</p>
                
                <div className="video-stats">
                  <span>👁️ {formatViews(video.view_count)}</span>
                  <span>❤️ {formatViews(video.like_count)}</span>
                  <span>💬 {formatViews(video.comment_count)}</span>
                  <span>📤 {formatViews(video.share_count)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
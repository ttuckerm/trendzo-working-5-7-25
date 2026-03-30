'use client';

import React, { useState, useRef } from 'react';
import type { Video } from '@/types/video';
import '@/styles/studio-v2.css'; // Import the new styles

// Define the props for the component
interface StudioCardProps {
  video: Video;
}

export const StudioCard: React.FC<StudioCardProps> = ({ video }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    videoRef.current?.pause();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };
  
  const getTag = () => {
    if (video.isTrendingAudio) return <div className="studiocard-tag">🎵 Trending Audio</div>;
    if (video.isHighSaves) return <div className="studiocard-tag" style={{backgroundColor: '#4A90E2'}}>📈 High Saves</div>;
    if (video.isAuthentic) return <div className="studiocard-tag" style={{backgroundColor: '#F5A623'}}>🌟 Authentic</div>;
    return null;
  };

  return (
    <div
      className="studiocard-tile"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Backgrounds: Image for non-hover, Video for hover */}
      <div 
        className="studiocard-background" 
        style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
      />
      <video
        ref={videoRef}
        className="studiocard-video"
        src={video.videoUrl}
        loop
        muted
        playsInline
      />
      <div className="studiocard-overlay" />

      {/* === CONTENT VISIBLE ON LOAD (Bottom) === */}
      <div className="studiocard-content-bottom">
        <h3 className="studiocard-title">{video.title}</h3>
        {getTag()}
      </div>

      {/* === CONTENT VISIBLE ON HOVER === */}
      <div className="studiocard-hover-content">
        {/* Top hover info */}
        <div className="studiocard-top-info">
          <div className="studiocard-music-icon">🎵</div>
          <div className="studiocard-score">{video.predictionScore}%</div>
        </div>

        {/* Bottom hover info */}
        <div className="studiocard-bottom-hover-info">
            <h4 className="studiocard-video-title-hover">{video.title}</h4>
            <div className="studiocard-creator-info">
                <span>@{video.creator}</span>
            </div>
            <div className="studiocard-stats">
                <span>👁️ {Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.views)}</span>
                <span>❤️ {Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.likes)}</span>
                <span>💬 {Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.comments)}</span>
                <span>🔗 Share</span>
            </div>
        </div>
      </div>
    </div>
  );
};
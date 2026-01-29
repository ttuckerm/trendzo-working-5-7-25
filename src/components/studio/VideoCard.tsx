'use client';

import { useState } from 'react';
import { StudioVideo } from '@/app/admin/(studio)/studio/page'; // Import the type from the page for consistency

interface VideoCardProps {
  prediction: StudioVideo; // Use the consistent type
}

export default function VideoCard({ prediction }: VideoCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  // Helper function to format view counts, now robust against null/undefined
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

  const hasVideoPreview = prediction.video_preview_url;
  const isViral = (prediction as any)?.label === 'viral' || ((prediction as any)?.probability ?? 0) >= 0.5;

  return (
    <div 
      className="video-card"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="video-thumbnail">
        {isViral && (
          <div title="This video is outperforming almost all videos from creators like you on this platform and is taking off fast." className="viral-badge">Viral • Beating 95% of similar videos</div>
        )}
        {hasVideoPreview && isHovering ? (
          <video
            src={prediction.video_preview_url}
            autoPlay
            loop
            muted
            playsInline
            className="video-preview"
          />
        ) : (
          <img 
            src={prediction.thumbnail_url || undefined} // Use thumbnail_url
            alt={prediction.title}
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMTExIi8+CjxwYXRoIGQ9Ik0xNDAgOTBMMTcwIDEwNUwxNzAgNzVMMTQwIDkwWiIgZmlsbD0iIzMzMyIvPgo8L3N2Zz4K';
            }}
          />
        )}
        <div className="video-overlay">
          <div className="play-button">▶</div>
        </div>
        <div className={`score-badge ${getScoreClass(prediction.engagement_score)}`}>
          {prediction.engagement_score}%
        </div>
      </div>

      <div className="video-info">
        <h3 className="video-title">{prediction.title}</h3>
        <p className="video-creator">@{prediction.creator}</p>
        
        <div className="video-stats">
          <div className="stat" title="Views">
            <span>👁️</span>
            <span>{formatViews(prediction.view_count)}</span>
          </div>
          <div className="stat" title="Likes">
            <span>❤️</span>
            <span>{formatViews(prediction.like_count)}</span>
          </div>
          <div className="stat" title="Comments">
            <span>💬</span>
            <span>{formatViews(prediction.comment_count)}</span>
          </div>
          <div className="stat" title="Shares">
            <span>🔄</span>
            <span>{formatViews(prediction.share_count)}</span>
          </div>
        </div>
        
        {/* You can add tags back if they are in your database schema */}
        {/* <div className="video-tags">
          {prediction.tags?.slice(0, 2).map((tag, index) => (
            <span key={index} className="tag">#{tag}</span>
          ))}
        </div> */}
      </div>

      {/* Basic styles - ideally move to a dedicated CSS file */}
      <style jsx>{`
        .video-card {
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid #333;
          display: flex;
          flex-direction: column;
        }
        .video-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        }
        .video-thumbnail {
          position: relative;
          width: 100%;
          height: 180px;
          background-color: #000;
          overflow: hidden;
        }
        .video-thumbnail img, .video-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .video-card:hover .video-thumbnail img {
            transform: scale(1.05);
        }
        .video-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .video-card:hover .video-overlay { opacity: 1; }
        .play-button {
          width: 48px; height: 48px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: #000;
          backdrop-filter: blur(4px);
        }
        .score-badge {
          position: absolute; top: 12px; right: 12px;
          padding: 4px 8px; border-radius: 16px;
          font-size: 12px; font-weight: 600;
          color: white;
          backdrop-filter: blur(5px);
        }
        .viral-badge {
          position: absolute; top: 12px; left: 12px; z-index: 2;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
          box-shadow: 0 2px 8px rgba(34,197,94,0.4);
        }
        .score-high { background: linear-gradient(45deg, #00ff88, #00cc6a); }
        .score-medium { background: linear-gradient(45deg, #ffd93d, #ff9500); }
        .score-low { background: linear-gradient(45deg, #ff6b6b, #cc5555); }
        .video-info { padding: 16px; flex-grow: 1; }
        .video-title {
          font-size: 14px; font-weight: 600; color: #fff;
          margin: 0 0 4px 0; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; text-overflow: ellipsis;
        }
        .video-creator {
          font-size: 12px; color: #aaa;
          margin-bottom: 12px;
        }
        .video-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 12px;
          color: #ddd;
        }
        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .video-tags {
          margin-top: 12px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tag {
          font-size: 11px;
          background: #333;
          padding: 3px 6px;
          border-radius: 4px;
          color: #aaa;
        }
      `}</style>
    </div>
  );
}
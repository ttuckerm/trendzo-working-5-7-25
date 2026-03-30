"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export interface VideoCardStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface VideoCardItem {
  id: string;
  title: string;
  creator_name?: string;
  thumbnail_url: string;
  platform: "tiktok" | "instagram" | "youtube";
  duration_seconds: number;
  viral_score: number;
  stats: VideoCardStats;
}

interface Props {
  item: VideoCardItem;
  selected?: boolean;
  gradient?: string;
  onSelect?: (item: VideoCardItem) => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  starterRibbon?: boolean;
}

const formatViews = (views: number): string => {
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1) + "M";
  if (views >= 1_000) return (views / 1_000).toFixed(1) + "K";
  return String(views);
};

export default function VideoCard({ item, selected, gradient, onSelect, onHoverEnter, onHoverLeave, starterRibbon = false }: Props) {
  return (
    <article
      className={`template-card ${selected ? "selected" : ""}`}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      onClick={() => onSelect?.(item)}
    >
      {starterRibbon && (
        <div className="absolute top-3 left-3 z-20" data-testid={`starter-ribbon-${item.id}`} aria-label="Starter Pack">
          <Badge variant="secondary">STARTER PACK</Badge>
        </div>
      )}
      <div className="viral-dna">
        <div className="dna-dot" style={{ "--i": 0 } as React.CSSProperties} />
        <div className="dna-dot" style={{ "--i": 1 } as React.CSSProperties} />
        <div className="dna-dot" style={{ "--i": 2 } as React.CSSProperties} />
      </div>

      <div className="video-preview">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={`${item.title} preview`} className="video-placeholder" />
        ) : (
          <div className="video-placeholder-gradient" style={{ background: gradient }}>
            <span className="video-title-overlay">{item.title}</span>
          </div>
        )}
        <div className="play-overlay">
          <div className="play-button">▶️</div>
        </div>
      </div>

      <div className="template-info">
        <div className="template-stats">
          <div className="stat">
            <span className="stat-icon">👁️</span>
            <span className="stat-number">{formatViews(item.stats.views)}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">❤️</span>
            <span className="stat-number">{formatViews(item.stats.likes)}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">🔥</span>
            <span className="stat-number">{item.viral_score}%</span>
          </div>
        </div>

        <h3 className="template-title">{item.title}</h3>
        <p className="template-description">
          {item.creator_name ? `Created by ${item.creator_name} • ` : ""}
          {item.platform.toUpperCase()} • {item.duration_seconds}s
        </p>

        <div className="trending-sound">
          <span className="sound-icon">🎵</span>
          <span>Viral Success Pattern Identified</span>
        </div>

        <button className="use-template">Create with this template ✨</button>
      </div>

      <style jsx>{`
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
        .template-card:hover { transform: translateY(-8px) scale(1.02); border-color: rgba(123,97,255,0.3); box-shadow: 0 20px 40px rgba(123,97,255,0.3), 0 0 80px rgba(123,97,255,0.2); }
        .template-card:hover::before { opacity: 1; }
        .video-preview { position: relative; width: 100%; height: 400px; background: #000; overflow: hidden; }
        .video-placeholder, .video-placeholder-gradient { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .video-placeholder-gradient { display: flex; align-items: center; justify-content: center; }
        .video-title-overlay { font-size: 20px; font-weight: 600; text-align: center; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .template-card:hover .video-placeholder, .template-card:hover .video-placeholder-gradient { transform: scale(1.1); }
        .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); opacity: 1; transition: opacity 0.3s; }
        .template-card:hover .play-overlay { opacity: 0; }
        .play-button { width: 60px; height: 60px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.3s; }
        .play-button:hover { transform: scale(1.1); background: rgba(123,97,255,0.3); }
        .viral-dna { position: absolute; top: 16px; right: 16px; display: flex; gap: 6px; z-index: 10; }
        .dna-dot { width: 10px; height: 10px; background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%); border-radius: 50%; animation: dna-pulse 2s ease-in-out infinite; animation-delay: calc(var(--i) * 0.2s); }
        @keyframes dna-pulse { 0%,100%{ transform: scale(1); opacity: 0.6;} 50%{ transform: scale(1.5); opacity: 1;} }
        .template-info { padding: 20px; }
        .template-stats { display: flex; gap: 20px; margin-bottom: 12px; }
        .stat { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.8); }
        .stat-number { font-weight: 600; background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .template-title { font-size: 18px; font-weight: 600; margin-bottom: 6px; transition: color 0.3s; }
        .template-card:hover .template-title { background: linear-gradient(135deg, #fff 0%, #7b61ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .template-description { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.4; }
        .trending-sound { display: flex; align-items: center; gap: 6px; margin: 12px 0; padding: 6px 12px; background: rgba(123,97,255,0.1); border: 1px solid rgba(123,97,255,0.2); border-radius: 100px; font-size: 12px; transition: all 0.3s; }
        .trending-sound:hover { background: rgba(123,97,255,0.2); border-color: rgba(123,97,255,0.4); }
        .sound-icon { font-size: 14px; animation: sound-wave 1s ease-in-out infinite; }
        @keyframes sound-wave { 0%,100%{ transform: scale(1);} 50%{ transform: scale(1.2);} }
        .use-template { width: 100%; padding: 12px; background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%); border: none; border-radius: 12px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; opacity: 0; transform: translateY(10px); }
        .template-card:hover .use-template { opacity: 1; transform: translateY(0); }
        @media (max-width: 768px) { .video-preview { height: 260px; } }
      `}</style>
    </article>
  );
}



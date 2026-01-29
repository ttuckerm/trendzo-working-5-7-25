'use client';

import Link from 'next/link';

interface StudioControlsProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  platform: string;
  setPlatform: (value: string) => void;
  onRefresh: () => void;
  onQuickPredict: () => void;
}

export default function StudioControls({
  sortBy,
  setSortBy,
  platform,
  setPlatform,
  onRefresh,
  onQuickPredict
}: StudioControlsProps) {
  return (
    <div className="controls-bar">
      <div className="filter-controls">
        <select 
          className="filter-dropdown"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="created_at">Most Recent</option>
          <option value="engagement_score">Highest Score</option>
          <option value="view_count">Most Views</option>
          <option value="like_count">Most Likes</option>
        </select>
        
        <select 
          className="filter-dropdown"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="all">All Platforms</option>
          <option value="TikTok">TikTok</option>
          <option value="Instagram">Instagram</option>
          <option value="YouTube">YouTube</option>
        </select>
      </div>
      
      <div className="action-buttons">
        <Link href="/admin/viral-recipe-book" className="btn-recipe-book">
          📚 View Full Recipe Book
        </Link>
        
        <button className="btn-refresh" onClick={onRefresh}>
          🔄 Refresh
        </button>
        
        <button className="btn-quick-predict" onClick={onQuickPredict}>
          Quick Predict
        </button>
      </div>
    </div>
  );
}
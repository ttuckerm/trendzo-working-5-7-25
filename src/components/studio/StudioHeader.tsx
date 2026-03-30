'use client';

import { useState } from 'react';

interface StudioHeaderProps {
  title?: string;
  subtitle?: string;
  showStats?: boolean;
}

export default function StudioHeader({ 
  title = "Proving Grounds", 
  subtitle = "AI-Predicted Viral Content",
  showStats = true 
}: StudioHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock stats - these would come from real API in production
  const stats = {
    predictions: 247,
    accuracy: 94.2,
    trending: 12
  };

  return (
    <header className="studio-header">
      <div className="header-left">
        <div>
          <div className="header-title">{title}</div>
          <div className="header-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="header-center">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="Search predictions, creators, trends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="header-right">
        {showStats && (
          <div className="header-stats">
            <div className="stat-item">
              <div className="stat-value">{stats.predictions}</div>
              <div className="stat-label">Predictions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.trending}</div>
              <div className="stat-label">Trending</div>
            </div>
          </div>
        )}
        
        <div className="user-profile">
          A
        </div>
      </div>
    </header>
  );
}
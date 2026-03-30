'use client';

interface StudioHeaderV2Props {
  stats?: {
    predictions: number;
    accuracy: number;
    trending: number;
  };
}

export default function StudioHeaderV2({ stats }: StudioHeaderV2Props) {
  const defaultStats = {
    predictions: 247,
    accuracy: 94.2,
    trending: 12
  };

  const displayStats = stats || defaultStats;

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">Proving Grounds</h1>
        <p className="page-subtitle">AI-Predicted Viral Content</p>
      </div>
      
      <div className="header-stats">
        <div className="stat-item">
          <div className="stat-number predictions">{displayStats.predictions}</div>
          <div className="stat-label">Predictions</div>
        </div>
        <div className="stat-item">
          <div className="stat-number accuracy">{displayStats.accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-item">
          <div className="stat-number trending">{displayStats.trending}</div>
          <div className="stat-label">Trending</div>
        </div>
      </div>

      <div className="profile-section">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search predictions, creators, trends..."
          />
        </div>
        <div className="profile-avatar">A</div>
      </div>
    </header>
  );
}
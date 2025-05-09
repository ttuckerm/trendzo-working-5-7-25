"use client";
import './styles.css';

export default function PlainPage() {
  return (
    <div>
      <div className="container">
        <h1>Trendzo Dashboard</h1>
        <p>This is a simplified version of the dashboard</p>
        
        <h2>Statistics</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Templates Created</div>
            <div className="stat-value">12</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Views</div>
            <div className="stat-value">8.5K</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Trends</div>
            <div className="stat-value">24</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Performance Score</div>
            <div className="stat-value">85%</div>
          </div>
        </div>
        
        <h2>Recent Templates</h2>
        <ul className="template-list">
          <li>Product Showcase</li>
          <li>Dance Challenge</li>
          <li>Tutorial Format</li>
          <li>Trend Reaction</li>
          <li>Story Time Format</li>
        </ul>
      </div>
    </div>
  )
} 
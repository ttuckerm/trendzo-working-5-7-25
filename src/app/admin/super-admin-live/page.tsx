'use client';

import React, { useState, useEffect } from 'react';
import { ViralFeed } from '@/components/ViralFeed';
import './super-admin-live.css';

interface SystemOverview {
  totalProcessed: number;
  healthy: number;
  warning: number;
  critical: number;
  accuracy: number;
}

interface ModuleHealth {
  name: string;
  status: string;
  processed: number;
  uptime: string;
  health: 'healthy' | 'warning' | 'critical';
}

interface TrendingTemplate {
  id: string;
  name: string;
  type: string;
  viralScore: number;
  category: string;
  elements: any;
}

interface DashboardData {
  systemOverview: SystemOverview;
  moduleHealth: ModuleHealth[];
  trendingTemplates: TrendingTemplate[];
  recipeBook: {
    totalRecipes: number;
    hotRecipes: number;
    coolingRecipes: number;
    newRecipes: number;
  };
  validationMetrics: {
    totalValidations: number;
    accurateValidations: number;
    accuracy: number;
    lastValidation: string;
  };
  lastUpdated: string;
}

export default function SuperAdminLive() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'command' | 'studio' | 'engine' | 'settings'>('command');
  const [studioTab, setStudioTab] = useState<'proving' | 'armory'>('proving');
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/super-admin/dashboard-data');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Run Template Discovery Engine
  const runTemplateDiscovery = async () => {
    try {
      setIsRunningDiscovery(true);
      const response = await fetch('/api/admin/super-admin/template-discovery', {
        method: 'POST'
      });
      const result = await response.json();
      setDiscoveryResults(result);
      
      // Refresh dashboard data to show updated templates
      setTimeout(() => {
        const refreshResponse = fetch('/api/admin/super-admin/dashboard-data')
          .then(res => res.json())
          .then(data => setDashboardData(data));
      }, 2000);
      
    } catch (error) {
      console.error('Template discovery failed:', error);
    } finally {
      setIsRunningDiscovery(false);
    }
  };

  // Quick Predict function
  const runQuickPredict = async () => {
    const videoUrl = prompt('Enter TikTok video URL:');
    if (!videoUrl) return;

    try {
      const response = await fetch('/api/admin/super-admin/quick-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl,
          title: 'Quick Prediction Test',
          creator: 'Test Creator'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Viral Prediction: ${result.viralPrediction.probability}% probability\nConfidence: ${result.viralPrediction.confidence}%\nCategory: ${result.viralPrediction.category}`);
      } else {
        alert('Prediction failed: ' + result.message);
      }
    } catch (error) {
      console.error('Quick predict failed:', error);
      alert('Prediction failed');
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading Real System Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Master Navigation */}
      <nav className="master-nav">
        <div className="logo-container">
          <div className="logo">TZ</div>
        </div>
        
        <div className="nav-items">
          <div 
            className={`nav-item ${currentView === 'command' ? 'active' : ''}`}
            onClick={() => setCurrentView('command')}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">COMMAND CENTER</span>
          </div>
          
          <div 
            className={`nav-item ${currentView === 'studio' ? 'active' : ''}`}
            onClick={() => setCurrentView('studio')}
          >
            <span className="nav-icon">🎬</span>
            <span className="nav-label">THE STUDIO</span>
          </div>
          
          <div 
            className={`nav-item ${currentView === 'engine' ? 'active' : ''}`}
            onClick={() => setCurrentView('engine')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">ENGINE ROOM</span>
          </div>
          
          <div 
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <span className="nav-icon">🔧</span>
            <span className="nav-label">SETTINGS</span>
          </div>
        </div>
      </nav>

      {/* Global Header */}
      <header className="global-header">
        <div className="header-left">
          <h1 className="page-title">
            {currentView === 'command' && 'Command Center'}
            {currentView === 'studio' && 'The Studio'}
            {currentView === 'engine' && 'Engine Room'}
            {currentView === 'settings' && 'Settings'}
          </h1>
        </div>
        
        <div className="header-right">
          <div className="global-search">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Search videos, templates, analytics..." />
          </div>
          
          <div className="notifications">
            <span>🔔</span>
            <span className="notification-dot"></span>
          </div>
          
          <div className="user-profile">
            <span>Admin User</span>
            <div className="user-avatar"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Command Center View */}
        {currentView === 'command' && (
          <div className="command-center-container">
            <div className="content-container">
              {/* Live System Metrics */}
              {dashboardData && (
                <>
                <div className="live-metrics-section">
                  <h2 className="section-title">🔴 LIVE System Metrics</h2>
                  
                  {/* System Overview Cards */}
                  <div className="system-overview">
                    <div className="overview-card">
                      <div className="overview-number">{dashboardData.systemOverview.totalProcessed.toLocaleString()}</div>
                      <div className="overview-label">Total Processed</div>
                      <div className="real-data-badge">REAL DATA</div>
                    </div>
                    <div className="overview-card">
                      <div className="overview-number healthy">{dashboardData.systemOverview.healthy}</div>
                      <div className="overview-label">Healthy</div>
                      <div className="real-data-badge">LIVE</div>
                    </div>
                    <div className="overview-card">
                      <div className="overview-number warning">{dashboardData.systemOverview.warning}</div>
                      <div className="overview-label">Warning</div>
                      <div className="real-data-badge">LIVE</div>
                    </div>
                    <div className="overview-card">
                      <div className="overview-number critical">{dashboardData.systemOverview.critical}</div>
                      <div className="overview-label">Critical</div>
                      <div className="real-data-badge">LIVE</div>
                    </div>
                  </div>

                  {/* Validation Accuracy */}
                  <div className="accuracy-display">
                    <h3>🎯 Prediction Accuracy</h3>
                    <div className="accuracy-score">
                      {dashboardData.validationMetrics.accuracy.toFixed(1)}%
                    </div>
                    <div className="accuracy-details">
                      {dashboardData.validationMetrics.accurateValidations}/{dashboardData.validationMetrics.totalValidations} predictions correct
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="section-title">✅ Proof Tiles</h3>
                  <ProofTiles />
                </div>
                </>
              )}

              {/* Live Action Buttons */}
              <div className="live-actions">
                <button 
                  className="action-btn primary"
                  onClick={runQuickPredict}
                >
                  🔮 Quick Predict
                </button>
                
                <button 
                  className="action-btn secondary"
                  onClick={runTemplateDiscovery}
                  disabled={isRunningDiscovery}
                >
                  {isRunningDiscovery ? '🔄 Discovering...' : '🔬 Run Template Discovery'}
                </button>
              </div>

              {/* Discovery Results */}
              {discoveryResults && (
                <div className="discovery-results">
                  <h3>🔬 Discovery Results</h3>
                  <div className="results-grid">
                    <div className="result-card">
                      <div className="result-label">Templates Discovered</div>
                      <div className="result-value">{discoveryResults.templatesDiscovered}</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">Processing Time</div>
                      <div className="result-value">{discoveryResults.processingTime}</div>
                    </div>
                    <div className="result-card">
                      <div className="result-label">Patterns Analyzed</div>
                      <div className="result-value">{discoveryResults.patternsAnalyzed}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Unified Viral Feed (mock or live) */}
              <div className="mt-6">
                <h3 className="section-title">📈 Unified Viral Feed</h3>
                <ViralFeed limit={15} />
              </div>
            </div>
          </div>
        )}

        {/* Studio View */}
        {currentView === 'studio' && dashboardData && (
          <div className="studio-container">
            <div className="studio-header">
              <nav className="studio-nav">
                <div 
                  className={`studio-nav-item ${studioTab === 'proving' ? 'active' : ''}`}
                  onClick={() => setStudioTab('proving')}
                >
                  The Proving Grounds
                </div>
                <div 
                  className={`studio-nav-item ${studioTab === 'armory' ? 'active' : ''}`}
                  onClick={() => setStudioTab('armory')}
                >
                  The Armory
                </div>
              </nav>
            </div>

            {studioTab === 'proving' && (
              <div className="proving-grounds-content">
                {/* Real Module Health Grid */}
                <div className="modules-grid">
                  {dashboardData.moduleHealth.map((module, index) => (
                    <div key={index} className="module-card">
                      <div className="module-header">
                        <h3 className="module-name">{module.name}</h3>
                        <div className={`module-status status-${module.health}`}>
                          {module.health === 'healthy' ? '✓' : module.health === 'warning' ? '⚠' : '✗'}
                        </div>
                      </div>
                      <div className="module-metrics">
                        <div className="metric-item">
                          <span className="metric-label">Processed</span>
                          <span className="metric-value metric-processed">{module.processed.toLocaleString()}</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Uptime</span>
                          <span className="metric-value metric-uptime">{module.uptime}</span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill progress-${module.health}`} 
                          style={{ width: module.uptime }}
                        ></div>
                      </div>
                      <div className="real-data-indicator">REAL DATA</div>
                    </div>
                  ))}
                </div>

                {/* Real Template Gallery */}
                <div className="template-gallery-section">
                  <h2 className="section-title">📚 Live Template Gallery</h2>
                  <div className="template-grid">
                    {dashboardData.trendingTemplates.map((template, index) => (
                      <div key={template.id} className="template-tile">
                        <div className="tile-background"></div>
                        <div className="tile-overlay"></div>
                        <div className="tile-stats">
                          <span className="viral-score">{template.viralScore}%</span>
                        </div>
                        <div className="tile-content">
                          <h4 className="tile-title">{template.name}</h4>
                          <span className="tile-tag">{template.category}</span>
                        </div>
                        <div className="real-data-indicator">LIVE</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other views */}
        {currentView === 'engine' && (
          <div className="engine-room-container">
            <div className="content-container">
              <div className="empty-state">
                <div className="empty-icon">⚙️</div>
                <div className="empty-title">Engine Room</div>
                <div className="empty-desc">Technical infrastructure and system operations</div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div className="settings-container">
            <div className="content-container">
              <div className="empty-state">
                <div className="empty-icon">⚙️</div>
                <div className="empty-title">Settings</div>
                <div className="empty-desc">System configuration and preferences</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Data Source Indicator */}
      <div className="data-source-indicator">
        <div className="indicator-content">
          <span className="indicator-icon">🔴</span>
          <span className="indicator-text">LIVE DATA FROM REAL SYSTEMS</span>
          <span className="last-updated">
            Updated: {dashboardData ? new Date(dashboardData.lastUpdated).toLocaleTimeString() : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
} 

function Tile({ title, target, value, passed, updated_at }:{ title:string; target:string; value:string; passed:boolean; updated_at:string }){
  return (
    <div className={`p-3 rounded border ${passed? 'border-green-600 bg-green-950/30' : 'border-red-600 bg-red-950/30'}`}>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">Target: {target} • {new Date(updated_at).toLocaleString()}</div>
    </div>
  )
}

function ProofTiles(){
  const [tiles, setTiles] = React.useState<any[]>([])
  React.useEffect(()=>{ (async()=>{
    try{
      const r = await fetch('/api/admin/proof-tiles', { cache:'no-store' })
      if (r.ok) setTiles((await r.json()).tiles||[])
    }catch{}
  })() },[])
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {tiles.map((t:any) => <Tile key={t.objective_id} title={t.title} target={t.target} value={t.value} passed={!!t.passed} updated_at={t.updated_at} />)}
    </div>
  )
}
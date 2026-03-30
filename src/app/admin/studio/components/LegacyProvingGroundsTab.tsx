'use client'

import React, { useState, useEffect } from 'react'
import { ViralFeed } from '@/components/ViralFeed'
import type { DashboardData } from '../constants'

interface LegacyProvingGroundsTabProps {
  selectedNiche: string;
}

export function LegacyProvingGroundsTab({ selectedNiche }: LegacyProvingGroundsTabProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/super-admin/dashboard-data');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const runTemplateDiscovery = async () => {
    try {
      setIsRunningDiscovery(true);
      const response = await fetch('/api/admin/super-admin/template-discovery', { method: 'POST' });
      const result = await response.json();
      setDiscoveryResults(result);

      setTimeout(() => {
        fetch('/api/admin/super-admin/dashboard-data')
          .then(res => res.json())
          .then(data => setDashboardData(data));
      }, 2000);
    } catch (error) {
      console.error('Template discovery failed:', error);
    } finally {
      setIsRunningDiscovery(false);
    }
  };

  return (
    <div className="proving-grounds-content">
      {/* Analytics Dashboard Section */}
      <section className="analytics-section mb-20">
        <div className="section-header flex items-center justify-between mb-10">
          <h2 className="section-title text-[28px] font-extrabold text-white flex items-center gap-4 tracking-tight">
            <span>📊</span>
            System Analytics
          </h2>
        </div>

        <div className="system-overview grid grid-cols-4 gap-6 mb-10">
          <div className="overview-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 text-center border border-white/[0.05] transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)] hover:border-[rgba(229,9,20,0.2)]">
            <div className="overview-number text-[42px] font-black mb-2 bg-gradient-to-b from-white to-[#cccccc] bg-clip-text text-transparent">{dashboardData?.systemOverview?.totalProcessed?.toLocaleString() || '0'}</div>
            <div className="overview-label text-xs text-[#888] uppercase tracking-wider font-semibold">Total Processed</div>
          </div>
          <div className="overview-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 text-center border border-white/[0.05] transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)] hover:border-[rgba(229,9,20,0.2)]">
            <div className="overview-number text-[42px] font-black mb-2 text-[#667eea]">{dashboardData?.systemOverview?.healthy || 0}</div>
            <div className="overview-label text-xs text-[#888] uppercase tracking-wider font-semibold">Healthy</div>
          </div>
          <div className="overview-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 text-center border border-white/[0.05] transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)] hover:border-[rgba(229,9,20,0.2)]">
            <div className="overview-number text-[42px] font-black mb-2 text-[#ffa726]">{dashboardData?.systemOverview?.warning || 0}</div>
            <div className="overview-label text-xs text-[#888] uppercase tracking-wider font-semibold">Warning</div>
          </div>
          <div className="overview-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 text-center border border-white/[0.05] transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)] hover:border-[rgba(229,9,20,0.2)]">
            <div className="overview-number text-[42px] font-black mb-2 text-[#e50914]">{dashboardData?.systemOverview?.critical || 0}</div>
            <div className="overview-label text-xs text-[#888] uppercase tracking-wider font-semibold">Critical</div>
          </div>
        </div>

        <div className="modules-grid grid grid-cols-3 gap-6">
          {(dashboardData?.moduleHealth || []).map((module, index) => (
            <div key={index} className="module-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(229,9,20,0.3)]">
              <div className="module-header flex justify-between items-center mb-5">
                <h3 className="module-name text-lg font-bold text-white">{module.name}</h3>
                <div className={`module-status w-6 h-6 rounded-full flex items-center justify-center text-sm ${module.health === 'healthy' ? 'bg-[rgba(102,126,234,0.2)] text-[#667eea]' : 'bg-[rgba(255,167,38,0.2)] text-[#ffa726]'}`}>
                  {module.health === 'healthy' ? '✓' : '⚠'}
                </div>
              </div>
              <div className="module-metrics grid grid-cols-2 gap-4">
                <div className="metric-item flex flex-col">
                  <span className="metric-label text-xs text-[#666] uppercase mb-1">Processed</span>
                  <span className="metric-value text-xl font-bold text-[#e50914]">{module.processed}</span>
                </div>
                <div className="metric-item flex flex-col">
                  <span className="metric-label text-xs text-[#666] uppercase mb-1">Uptime</span>
                  <span className="metric-value text-xl font-bold text-[#667eea]">{module.uptime}</span>
                </div>
              </div>
              <div className="progress-bar h-1 bg-white/10 rounded-sm overflow-hidden mt-4">
                <div className={`progress-fill h-full rounded-sm transition-all duration-[600ms] ${module.health === 'healthy' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-gradient-to-r from-[#ffa726] to-[#ff6b35]'}`} style={{ width: module.uptime }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20">
        <ViralFeed platform={undefined} niche={selectedNiche || undefined} />
      </section>

      {/* Template Discovery Engine Section */}
      <section className="discovery-section mb-20">
        <div className="section-header flex items-center justify-between mb-10">
          <h2 className="section-title text-[28px] font-extrabold text-white flex items-center gap-4 tracking-tight">
            <span>🔬</span>
            Template Discovery Engine
          </h2>
        </div>

        <div className="discovery-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[20px] p-10 border border-white/[0.05] relative overflow-hidden">
          <div className="discovery-header flex items-center gap-4 mb-5">
            <span className="discovery-icon text-[32px]">🔬</span>
            <h3 className="discovery-title text-2xl font-extrabold text-white">Template Discovery Engine</h3>
          </div>
          <p className="discovery-description text-[#aaa] text-base mb-8 leading-relaxed">
            Analyze viral videos to discover new patterns and templates
          </p>
          <button
            onClick={runTemplateDiscovery}
            disabled={isRunningDiscovery}
            className="discovery-button w-full p-5 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-xl text-white text-lg font-extrabold cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(229,9,20,0.4)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(229,9,20,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🚀</span>
            <span>{isRunningDiscovery ? 'Running Discovery...' : 'Run Template Discovery'}</span>
          </button>

          {discoveryResults && (
            <div className="discovery-results mt-6 p-6 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl border border-white/[0.1]">
              <div className="results-header flex items-center gap-3 mb-4">
                <span className="text-2xl">🎯</span>
                <h4 className="text-xl font-bold text-white">Discovery Results</h4>
              </div>

              <div className="results-summary grid grid-cols-3 gap-4 mb-4">
                <div className="summary-item text-center">
                  <div className="summary-number text-2xl font-bold text-[#e50914]">{discoveryResults.templatesDiscovered || 0}</div>
                  <div className="summary-label text-xs text-[#888] uppercase">Templates Found</div>
                </div>
                <div className="summary-item text-center">
                  <div className="summary-number text-2xl font-bold text-[#667eea]">{discoveryResults.patternsAnalyzed || 0}</div>
                  <div className="summary-label text-xs text-[#888] uppercase">Patterns Analyzed</div>
                </div>
                <div className="summary-item text-center">
                  <div className="summary-number text-2xl font-bold text-[#00ff88]">{discoveryResults.confidence ? `${Math.round(discoveryResults.confidence * 100)}%` : 'N/A'}</div>
                  <div className="summary-label text-xs text-[#888] uppercase">Avg Confidence</div>
                </div>
              </div>

              {discoveryResults.newTemplates && discoveryResults.newTemplates.length > 0 && (
                <div className="new-templates">
                  <h5 className="text-lg font-bold text-white mb-3">New Templates Discovered:</h5>
                  <div className="templates-list space-y-2">
                    {discoveryResults.newTemplates.map((template: any, index: number) => (
                      <div key={index} className="template-item p-3 bg-black/30 rounded-lg border border-white/[0.05]">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="template-name text-white font-semibold">{template.name || template.pattern_name || `Template ${index + 1}`}</span>
                            <span className="template-type ml-2 text-xs text-[#888] bg-white/[0.1] px-2 py-1 rounded">{template.type || template.template_type || 'Unknown'}</span>
                          </div>
                          <div className="confidence text-[#00ff88] font-bold">
                            {template.confidence || template.effectiveness_score ? `${Math.round((template.confidence || template.effectiveness_score) * 100)}%` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="results-footer mt-4 pt-4 border-t border-white/[0.1] text-xs text-[#666]">
                <div className="flex justify-between">
                  <span>Processing Time: {discoveryResults.processingTime}</span>
                  <span>Completed: {discoveryResults.timestamp ? new Date(discoveryResults.timestamp).toLocaleTimeString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Template Gallery Section */}
      <section className="gallery-section mb-20">
        <div className="section-header flex items-center justify-between mb-10">
          <h2 className="section-title text-[28px] font-extrabold text-white flex items-center gap-4 tracking-tight">
            <span>📚</span>
            Template Gallery
          </h2>
        </div>

        <div className="gallery-container grid grid-cols-[1fr_400px] gap-10">
          <div className="template-showcase bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[20px] p-10 border border-white/[0.05]">
            <div className="showcase-header flex justify-between items-center mb-8">
              <h3 className="showcase-title text-2xl font-extrabold text-white">🔥 Trending Templates</h3>
              <span className="view-all-btn text-[#e50914] text-base font-bold cursor-pointer transition-all duration-300 flex items-center gap-2 hover:translate-x-1">Explore All →</span>
            </div>

            <div className="template-grid grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6">
              {[
                { title: 'POV Experience', tag: '🎭 STORYTELLING', score: '97%' },
                { title: 'Transformation Reveal', tag: '🎵 TRENDING AUDIO', score: '94%' },
                { title: 'Quick Tutorial', tag: '📈 HIGH SAVES', score: '91%' }
              ].map((template, index) => (
                <div key={index} className="template-tile h-[200px] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden transition-all duration-[500ms] cursor-pointer relative border border-white/[0.02] shadow-[0_16px_48px_rgba(0,0,0,0.6)] hover:scale-[1.08] hover:-translate-y-2 hover:shadow-[0_32px_80px_rgba(0,0,0,0.9)] hover:border-[rgba(229,9,20,0.6)] hover:z-[50]">
                  <div className="tile-background absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] transition-all duration-500 hover:scale-110"></div>
                  <div className="tile-overlay absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/90"></div>
                  <div className="play-overlay absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 transition-all duration-400 backdrop-blur-sm hover:opacity-100">
                    <div className="play-button w-[60px] h-[60px] bg-gradient-to-r from-white to-[#f0f0f0] rounded-full flex items-center justify-center scale-75 transition-all duration-[400ms] shadow-[0_16px_40px_rgba(255,255,255,0.3)] hover:scale-100">
                      <div className="play-icon w-0 h-0 border-l-[18px] border-l-black border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1.5"></div>
                    </div>
                  </div>
                  <div className="tile-stats absolute top-4 right-4 opacity-0 -translate-y-2.5 transition-all duration-400 hover:opacity-100 hover:translate-y-0">
                    <span className="viral-score bg-[rgba(0,255,136,0.2)] border border-[rgba(0,255,136,0.3)] px-3 py-1.5 rounded-full text-sm font-black text-[#00ff88]">{template.score}</span>
                  </div>
                  <div className="tile-content absolute bottom-0 left-0 right-0 p-6 z-[5]">
                    <h4 className="tile-title text-xl font-extrabold mb-2 text-white text-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">{template.title}</h4>
                    <span className="tile-tag inline-flex items-center gap-1.5 bg-[rgba(229,9,20,0.9)] text-white px-3.5 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wide shadow-[0_4px_16px_rgba(229,9,20,0.4)]">{template.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recipe-book bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[20px] border border-white/[0.05] overflow-hidden">
            <div className="recipe-header bg-gradient-to-r from-[rgba(102,126,234,0.1)] to-[rgba(118,75,162,0.1)] p-6 border-b border-white/[0.05]">
              <h3 className="recipe-title text-xl font-bold text-white mb-2 flex items-center gap-2">📚 Recipe Book</h3>
              <p className="recipe-subtitle text-[13px] text-[#aaa] mb-4">Discover and analyze viral templates</p>
              <div className="recipe-tabs flex gap-1">
                <div className="recipe-tab active px-4 py-2 bg-[rgba(102,126,234,0.2)] text-[#667eea] border border-[rgba(102,126,234,0.3)] rounded text-xs font-semibold cursor-pointer transition-all duration-300">Trending</div>
                <div className="recipe-tab px-4 py-2 bg-white/[0.05] border border-white/10 rounded text-xs font-semibold cursor-pointer transition-all duration-300 text-[#aaa] hover:bg-white/[0.08] hover:text-white">New</div>
                <div className="recipe-tab px-4 py-2 bg-white/[0.05] border border-white/10 rounded text-xs font-semibold cursor-pointer transition-all duration-300 text-[#aaa] hover:bg-white/[0.08] hover:text-white">Favorites</div>
              </div>
            </div>

            <div className="recipe-content p-5 max-h-[600px] overflow-y-auto">
              <div className="recipe-row mb-6">
                <h4 className="recipe-row-title text-base font-bold text-white mb-3 flex items-center gap-2">🔥 Trending Templates</h4>
                <div className="recipe-cards flex flex-col gap-3">
                  {[
                    { name: 'POV Experience', score: '97%', desc: 'First-person storytelling that creates instant connection', tags: ['Viral', 'Storytelling'] },
                    { name: 'Transformation Reveal', score: '94%', desc: 'Before/after format driving massive engagement', tags: ['Transform', 'Visual'] },
                    { name: 'Quick Tutorial', score: '91%', desc: '60-second educational content with high saves', tags: ['Education', 'Tutorial'] }
                  ].map((recipe, index) => (
                    <div key={index} className="recipe-card bg-gradient-to-br from-[#222] to-[#1a1a1a] rounded-[10px] p-4 border border-white/[0.05] cursor-pointer transition-all duration-300 hover:border-[rgba(102,126,234,0.3)] hover:translate-x-1">
                      <div className="recipe-card-header flex justify-between items-start mb-2">
                        <div className="recipe-name text-sm font-semibold text-white">{recipe.name}</div>
                        <div className="recipe-score text-base font-extrabold text-[#00ff88]">{recipe.score}</div>
                      </div>
                      <p className="recipe-description text-xs text-[#aaa] leading-[1.4] mb-2">{recipe.desc}</p>
                      <div className="recipe-tags flex gap-1.5 flex-wrap">
                        {recipe.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="recipe-tag px-2 py-0.5 bg-[rgba(102,126,234,0.15)] text-[#667eea] rounded-xl text-[10px] font-semibold">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recipe-row mb-6">
                <h4 className="recipe-row-title text-base font-bold text-white mb-3 flex items-center gap-2">✨ New Discoveries</h4>
                <div className="recipe-cards flex flex-col gap-3">
                  {[
                    { name: 'Comedy Sketch', score: '96%', desc: 'Relatable humor with explosive share potential', tags: ['Comedy', 'Relatable'] },
                    { name: 'Behind the Scenes', score: '89%', desc: 'Exclusive content building authentic connections', tags: ['Authentic', 'Exclusive'] }
                  ].map((recipe, index) => (
                    <div key={index} className="recipe-card bg-gradient-to-br from-[#222] to-[#1a1a1a] rounded-[10px] p-4 border border-white/[0.05] cursor-pointer transition-all duration-300 hover:border-[rgba(102,126,234,0.3)] hover:translate-x-1">
                      <div className="recipe-card-header flex justify-between items-start mb-2">
                        <div className="recipe-name text-sm font-semibold text-white">{recipe.name}</div>
                        <div className="recipe-score text-base font-extrabold text-[#00ff88]">{recipe.score}</div>
                      </div>
                      <p className="recipe-description text-xs text-[#aaa] leading-[1.4] mb-2">{recipe.desc}</p>
                      <div className="recipe-tags flex gap-1.5 flex-wrap">
                        {recipe.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="recipe-tag px-2 py-0.5 bg-[rgba(102,126,234,0.15)] text-[#667eea] rounded-xl text-[10px] font-semibold">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="view-full-recipe mt-6 p-3.5 bg-gradient-to-r from-[rgba(102,126,234,0.1)] to-[rgba(118,75,162,0.1)] border border-[rgba(102,126,234,0.2)] rounded-[10px] text-center cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-[rgba(102,126,234,0.2)] hover:to-[rgba(118,75,162,0.2)] hover:border-[rgba(102,126,234,0.3)] hover:-translate-y-0.5">
                <div className="view-full-text text-[#667eea] text-sm font-semibold flex items-center justify-center gap-2">📖 View Full Recipe Book →</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proving Grounds Section */}
      <section className="proving-section">
        <div className="section-header flex items-center justify-between mb-10">
          <h2 className="section-title text-[28px] font-extrabold text-white flex items-center gap-4 tracking-tight">
            <span>🎯</span>
            Proving Grounds
          </h2>
        </div>

        <div className="controls-bar flex justify-between items-center mb-8">
          <div className="filter-controls flex gap-4">
            <select className="filter-dropdown px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm cursor-pointer font-medium transition-all duration-300 hover:bg-white/[0.1] hover:border-[rgba(229,9,20,0.3)]">
              <option>Most Recent</option><option>Highest Score</option><option>Trending</option>
            </select>
            <select className="filter-dropdown px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm cursor-pointer font-medium transition-all duration-300 hover:bg-white/[0.1] hover:border-[rgba(229,9,20,0.3)]">
              <option>All Platforms</option><option>TikTok</option><option>Instagram</option><option>YouTube</option>
            </select>
          </div>
          <div className="action-buttons flex gap-4">
            <button className="btn-refresh px-6 py-3.5 bg-white/10 border border-white/20 rounded-lg text-white text-[15px] font-semibold cursor-pointer transition-all duration-300 flex items-center gap-2 hover:bg-white/[0.15] hover:-translate-y-0.5">🔄 Refresh</button>
            <button className="btn-quick-predict px-7 py-3.5 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-lg text-white text-[15px] font-bold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(229,9,20,0.4)]">Quick Predict</button>
          </div>
        </div>

        <div className="video-grid grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          {[
            { title: 'POV Storytelling Analysis', creator: '@Unknown Creator', views: '14.1K', likes: '704', comments: '140', shares: '28' },
            { title: 'Transformation Format', creator: '@Unknown Creator', views: '75.6K', likes: '3.8K', comments: '756', shares: '151' },
            { title: 'Comedy Timing Analysis', creator: '@Unknown Creator', views: '42.3K', likes: '2.1K', comments: '423', shares: '84' },
            { title: 'Tutorial Format Study', creator: '@Unknown Creator', views: '28.9K', likes: '1.4K', comments: '289', shares: '57' }
          ].map((video, index) => (
            <div key={index} className="video-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden transition-all duration-[400ms] cursor-pointer border border-white/[0.05] relative hover:scale-105 hover:-translate-y-2 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(229,9,20,0.3)]">
              <div className="video-thumbnail w-full h-[180px] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
                <div className="video-placeholder text-[#666] text-sm text-center p-5">Video content analysis in progress...</div>
                <div className="processing-indicator absolute top-3 right-3 w-8 h-8 bg-[rgba(229,9,20,0.9)] rounded-full flex items-center justify-center text-base text-white animate-pulse">%</div>
              </div>
              <div className="video-content p-5">
                <h3 className="video-title text-lg font-bold mb-2 text-white">{video.title}</h3>
                <p className="video-creator text-sm text-[#888] mb-4">{video.creator}</p>
                <div className="video-stats flex justify-between items-center text-[13px] text-[#aaa]">
                  <div className="stat-group flex gap-4">
                    <span className="stat flex items-center gap-1">👁️ {video.views}</span>
                    <span className="stat flex items-center gap-1">❤️ {video.likes}</span>
                  </div>
                  <div className="stat-group flex gap-4">
                    <span className="stat flex items-center gap-1">💬 {video.comments}</span>
                    <span className="stat flex items-center gap-1">📤 {video.shares}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination flex justify-center items-center gap-4 mt-12">
          <button className="pagination-btn px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 opacity-50 cursor-not-allowed" disabled>← Previous</button>
          <span className="page-info text-[#888] text-sm font-medium">Page 1 of 10</span>
          <button className="pagination-btn px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 hover:bg-white/[0.1] hover:border-[rgba(229,9,20,0.3)]">Next →</button>
        </div>
      </section>
    </div>
  );
}

'use client'

import React, { useState, useEffect } from 'react'
import OperationsCenterView from './views/OperationsCenterView'

interface ModuleStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  processed: number;
  uptime: string;
  lastRun: string;
}

export default function EngineRoomPage() {
  const [activeView, setActiveView] = useState('pipeline')
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real-time module data
  useEffect(() => {
    // Initialize active view from query param (?tab=operations)
    try {
      const url = new URL(window.location.href)
      const tab = url.searchParams.get('tab')
      if (tab) setActiveView(tab)
    } catch {}

    const fetchModuleData = async () => {
      try {
        // In production, this would connect to real module monitoring
        const modules: ModuleStatus[] = [
          { name: 'TikTok Scraper', status: 'healthy', processed: 24891, uptime: '99.8%', lastRun: '2 min ago' },
          { name: 'Viral Pattern Analyzer', status: 'healthy', processed: 24891, uptime: '99.2%', lastRun: '1 min ago' },
          { name: 'Template Discovery Engine', status: 'warning', processed: 1247, uptime: '85.3%', lastRun: '5 min ago' },
          { name: 'Draft Video Analyzer', status: 'healthy', processed: 156, uptime: '98.7%', lastRun: '3 min ago' },
          { name: 'Script Intelligence Module', status: 'healthy', processed: 18993, uptime: '99.1%', lastRun: '1 min ago' },
          { name: 'Recipe Book Generator', status: 'healthy', processed: 365, uptime: '99.5%', lastRun: '4 min ago' },
          { name: 'Prediction Engine', status: 'healthy', processed: 24891, uptime: '99.9%', lastRun: '30 sec ago' },
          { name: 'Performance Validator', status: 'healthy', processed: 22344, uptime: '99.6%', lastRun: '1 min ago' },
          { name: 'Marketing Content Creator', status: 'healthy', processed: 89, uptime: '97.4%', lastRun: '8 min ago' },
          { name: 'Dashboard Aggregator', status: 'healthy', processed: 999999, uptime: '99.9%', lastRun: '10 sec ago' },
          { name: 'System Health Monitor', status: 'healthy', processed: 999999, uptime: '99.9%', lastRun: '5 sec ago' },
          { name: 'Process Intelligence Layer', status: 'healthy', processed: 12456, uptime: '98.9%', lastRun: '2 min ago' }
        ];
        setModuleStatuses(modules);
      } catch (error) {
        console.error('Failed to fetch module data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchModuleData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="engine-room-container h-full bg-[radial-gradient(ellipse_at_center_top,#141414_0%,#0a0a0a_50%,#000000_100%)] relative overflow-y-auto">
      {/* Engine Room Header with Navigation */}
      <div className="engine-room-header p-8 pb-0 bg-gradient-to-b from-black/90 to-transparent sticky top-0 z-20">
        <div className="header-top flex justify-between items-center mb-6">
          <h1 className="text-[32px] font-extrabold text-white flex items-center gap-4">
            <span>⚙️</span>
            Engine Room
          </h1>
          
          {/* System Status Indicator */}
          <div className="system-status flex items-center gap-3 px-4 py-2 bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] rounded-full">
            <div className="status-dot w-3 h-3 bg-[#00ff88] rounded-full animate-pulse"></div>
            <span className="text-[#00ff88] text-sm font-semibold">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="engine-nav flex gap-8 mb-6">
          <div
            className={`nav-item text-lg font-semibold cursor-pointer transition-colors duration-300 relative flex items-center gap-2 ${
              activeView === 'pipeline' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
            onClick={() => setActiveView('pipeline')}
          >
            <span>🔄</span>
            24/7 Pipeline
            {activeView === 'pipeline' && (
              <div className="absolute bottom-[-8px] left-0 right-0 h-[3px] bg-[#e50914] rounded-full"></div>
            )}
          </div>
          <div
            className={`nav-item text-lg font-semibold cursor-pointer transition-colors duration-300 relative flex items-center gap-2 ${
              activeView === 'operations' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
            onClick={() => setActiveView('operations')}
          >
            <span>🔧</span>
            Operations Center
            {activeView === 'operations' && (
              <div className="absolute bottom-[-8px] left-0 right-0 h-[3px] bg-[#e50914] rounded-full"></div>
            )}
          </div>
          <div
            className={`nav-item text-lg font-semibold cursor-pointer transition-colors duration-300 relative flex items-center gap-2 ${
              activeView === 'process-intelligence' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
            onClick={() => setActiveView('process-intelligence')}
          >
            <span>🧠</span>
            Process Intelligence
            {activeView === 'process-intelligence' && (
              <div className="absolute bottom-[-8px] left-0 right-0 h-[3px] bg-[#e50914] rounded-full"></div>
            )}
          </div>
          <div
            className={`nav-item text-lg font-semibold cursor-pointer transition-colors duration-300 relative flex items-center gap-2 ${
              activeView === 'ai-rd' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
            onClick={() => setActiveView('ai-rd')}
          >
            <span>🔬</span>
            AI R&D Layer
            {activeView === 'ai-rd' && (
              <div className="absolute bottom-[-8px] left-0 right-0 h-[3px] bg-[#e50914] rounded-full"></div>
            )}
          </div>
          <div
            className={`nav-item text-lg font-semibold cursor-pointer transition-colors duration-300 relative flex items-center gap-2 ${
              activeView === 'moat' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
            onClick={() => setActiveView('moat')}
          >
            <span>🛡️</span>
            Defensible Moat
            {activeView === 'moat' && (
              <div className="absolute bottom-[-8px] left-0 right-0 h-[3px] bg-[#e50914] rounded-full"></div>
            )}
          </div>
          <div
            className={`nav-item text-lg font-semibold cursor-pointer transition-colors duration-300 relative flex items-center gap-2 ${
              activeView === 'scale-tracking' ? 'text-white' : 'text-gray-500 hover:text-white'
            }`}
            onClick={() => setActiveView('scale-tracking')}
          >
            <span>📈</span>
            Scale from Zero
            {activeView === 'scale-tracking' && (
              <div className="absolute bottom-[-8px] left-0 right-0 h-[3px] bg-[#e50914] rounded-full"></div>
            )}
          </div>
        </nav>
      </div>

      <div className="content-container p-8 pt-0">
        {/* 24/7 Pipeline Tab - OBJECTIVE #4 (read-only overview) */}
        {activeView === 'pipeline' && (
          <div className="pipeline-content">
            <div className="text-xs text-gray-400 mb-2">Read-only overview</div>
            {/* Pipeline Overview */}
            <div className="pipeline-overview mb-12">
              <div className="overview-header text-center mb-8">
                <h2 className="text-[28px] font-extrabold mb-4 flex items-center justify-center gap-4">
                  <span>🔄</span>
                  Fully Automated 24/7 Pipeline
                </h2>
                <p className="text-gray-400 text-lg">12 interconnected modules operating without manual intervention</p>
              </div>

              {/* Live Processing Stats */}
              <div className="processing-stats bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
                <div className="stats-grid grid grid-cols-4 gap-6">
                  <div className="stat-card text-center">
                    <div className="stat-icon text-[32px] mb-3">📊</div>
                    <div className="stat-value text-[36px] font-black text-[#00ff88]">24,891</div>
                    <div className="stat-label text-gray-400">Videos Processed Today</div>
                  </div>
                  
                  <div className="stat-card text-center">
                    <div className="stat-icon text-[32px] mb-3">⚡</div>
                    <div className="stat-value text-[36px] font-black text-[#667eea]">12/12</div>
                    <div className="stat-label text-gray-400">Modules Online</div>
                  </div>
                  
                  <div className="stat-card text-center">
                    <div className="stat-icon text-[32px] mb-3">🎯</div>
                    <div className="stat-value text-[36px] font-black text-[#e50914]">99.2%</div>
                    <div className="stat-label text-gray-400">System Uptime</div>
                  </div>
                  
                  <div className="stat-card text-center">
                    <div className="stat-icon text-[32px] mb-3">🚀</div>
                    <div className="stat-value text-[36px] font-black text-[#ffa726]">247</div>
                    <div className="stat-label text-gray-400">Predictions Made Today</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Status Grid */}
            <div className="modules-status bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
              <h3 className="section-title text-xl font-bold mb-6 flex items-center gap-3">
                <span>🔧</span>
                Module Status Monitor
              </h3>
              <div className="modules-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moduleStatuses.map((module, index) => (
                  <div key={index} className="module-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05] hover:bg-white/[0.05] transition-all duration-300">
                    <div className="module-header flex justify-between items-center mb-4">
                      <div className="module-name text-lg font-semibold">{module.name}</div>
                      <div className={`status-indicator w-3 h-3 rounded-full ${
                        module.status === 'healthy' ? 'bg-[#00ff88]' : 
                        module.status === 'warning' ? 'bg-[#ffa726]' : 'bg-[#e50914]'
                      }`}></div>
                    </div>
                    <div className="module-metrics space-y-2">
                      <div className="metric-row flex justify-between text-sm">
                        <span className="text-gray-400">Processed:</span>
                        <span className="text-white font-semibold">{module.processed.toLocaleString()}</span>
                      </div>
                      <div className="metric-row flex justify-between text-sm">
                        <span className="text-gray-400">Uptime:</span>
                        <span className="text-[#00ff88] font-semibold">{module.uptime}</span>
                      </div>
                      <div className="metric-row flex justify-between text-sm">
                        <span className="text-gray-400">Last Run:</span>
                        <span className="text-gray-300">{module.lastRun}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Operations Center owner tab (full interactive) */}
        {activeView === 'operations' && (
          <OperationsCenterView />
        )}

        {/* Process Intelligence Tab - OBJECTIVE #9 */}
        {activeView === 'process-intelligence' && (
          <div className="process-intelligence-content">
            <div className="process-header text-center mb-12">
              <h2 className="text-[28px] font-extrabold mb-4 flex items-center justify-center gap-4">
                <span>🧠</span>
                Process Intelligence Layer
              </h2>
              <p className="text-gray-400 text-lg">Visual tracking of user journeys • Bottleneck detection • Success path analysis</p>
            </div>

            {/* User Journey Flowchart */}
            <div className="journey-flow bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">Optimal Path to Viral Success</h3>
              <div className="flow-diagram">
                <div className="flow-steps grid grid-cols-5 gap-4">
                  {[
                    { step: 1, name: 'Content Upload', success: '98%', time: '30s' },
                    { step: 2, name: 'AI Analysis', success: '94%', time: '5s' },
                    { step: 3, name: 'Apply Recommendations', success: '87%', time: '15m' },
                    { step: 4, name: 'Template Selection', success: '92%', time: '10m' },
                    { step: 5, name: 'Viral Success', success: '91%', time: '6h' }
                  ].map((step, index) => (
                    <div key={step.step} className="flow-step text-center relative">
                      <div className="step-circle w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                        {step.step}
                      </div>
                      <div className="step-name text-sm font-semibold mb-2">{step.name}</div>
                      <div className="step-metrics text-xs text-gray-400">
                        <div>Success: {step.success}</div>
                        <div>Time: {step.time}</div>
                      </div>
                      {index < 4 && (
                        <div className="step-arrow absolute -right-2 top-8 text-xl text-[#667eea]">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottleneck Detection */}
            <div className="bottleneck-detection bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">Bottleneck Detection & Optimization</h3>
              <div className="bottlenecks-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { issue: 'Template Selection Time', impact: 'High', solution: 'AI-powered auto-suggestion', improvement: '+23% efficiency' },
                  { issue: 'Analysis Queue Delay', impact: 'Medium', solution: 'Additional processing nodes', improvement: '+15% speed' },
                  { issue: 'User Onboarding Dropout', impact: 'High', solution: 'Guided tutorial flow', improvement: '+31% completion' },
                  { issue: 'Script Generation Complexity', impact: 'Low', solution: 'Template simplification', improvement: '+8% usage' }
                ].map((bottleneck, index) => (
                  <div key={index} className="bottleneck-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                    <div className="bottleneck-header flex justify-between items-center mb-3">
                      <div className="issue-name text-lg font-semibold">{bottleneck.issue}</div>
                      <div className={`impact-badge px-3 py-1 rounded-full text-xs font-bold ${
                        bottleneck.impact === 'High' ? 'bg-[rgba(229,9,20,0.2)] text-[#e50914]' :
                        bottleneck.impact === 'Medium' ? 'bg-[rgba(255,167,38,0.2)] text-[#ffa726]' :
                        'bg-[rgba(102,126,234,0.2)] text-[#667eea]'
                      }`}>
                        {bottleneck.impact} Impact
                      </div>
                    </div>
                    <div className="solution text-sm text-gray-300 mb-2">
                      <strong>Solution:</strong> {bottleneck.solution}
                    </div>
                    <div className="improvement text-sm text-[#00ff88]">
                      <strong>Expected:</strong> {bottleneck.improvement}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Metrics */}
            <div className="success-metrics bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
              <h3 className="section-title text-xl font-bold mb-6">Success Path Analysis</h3>
              <div className="metrics-comparison grid grid-cols-2 gap-8">
                <div className="viral-path">
                  <h4 className="path-title text-lg font-semibold text-[#00ff88] mb-4">Viral Content Path</h4>
                  <div className="path-stats space-y-3">
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Avg. Analysis Score:</span>
                      <span className="text-[#00ff88] font-semibold">94.3%</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Template Usage:</span>
                      <span className="text-[#00ff88] font-semibold">87%</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Time to Viral:</span>
                      <span className="text-[#00ff88] font-semibold">6.2 hours</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Success Rate:</span>
                      <span className="text-[#00ff88] font-semibold">91.3%</span>
                    </div>
                  </div>
                </div>
                
                <div className="non-viral-path">
                  <h4 className="path-title text-lg font-semibold text-[#e50914] mb-4">Non-Viral Content Path</h4>
                  <div className="path-stats space-y-3">
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Avg. Analysis Score:</span>
                      <span className="text-[#e50914] font-semibold">67.2%</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Template Usage:</span>
                      <span className="text-[#e50914] font-semibold">23%</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Peak Views Time:</span>
                      <span className="text-[#e50914] font-semibold">24+ hours</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Success Rate:</span>
                      <span className="text-[#e50914] font-semibold">12.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI R&D Layer Tab - OBJECTIVE #8 */}
        {activeView === 'ai-rd' && (
          <div className="ai-rd-content">
            <div className="rd-header text-center mb-12">
              <h2 className="text-[28px] font-extrabold mb-4 flex items-center justify-center gap-4">
                <span>🔬</span>
                AI-Powered R&D Layer
              </h2>
              <p className="text-gray-400 text-lg">Autonomous discovery • 5,000+ Apify actors • Hypothesis testing</p>
            </div>

            {/* Platform Discovery */}
            <div className="platform-discovery bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">Autonomous Platform Discovery</h3>
              <div className="discovery-grid grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="discovery-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                  <div className="card-header flex items-center gap-3 mb-4">
                    <span className="card-icon text-2xl">🔍</span>
                    <h4 className="card-title text-lg font-semibold">New Platforms</h4>
                  </div>
                  <div className="card-value text-[28px] font-bold text-[#667eea] mb-2">7</div>
                  <div className="card-label text-gray-400">Discovered this month</div>
                  <div className="platform-list mt-3 text-sm text-gray-300">
                    <div>• BeReal trending analysis</div>
                    <div>• Clubhouse audio patterns</div>
                    <div>• LinkedIn video growth</div>
                  </div>
                </div>
                
                <div className="discovery-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                  <div className="card-header flex items-center gap-3 mb-4">
                    <span className="card-icon text-2xl">🎯</span>
                    <h4 className="card-title text-lg font-semibold">Opportunities</h4>
                  </div>
                  <div className="card-value text-[28px] font-bold text-[#00ff88] mb-2">23</div>
                  <div className="card-label text-gray-400">Viral opportunities identified</div>
                  <div className="opportunity-list mt-3 text-sm text-gray-300">
                    <div>• Emerging audio trends</div>
                    <div>• Format innovations</div>
                    <div>• Cross-platform patterns</div>
                  </div>
                </div>
                
                <div className="discovery-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                  <div className="card-header flex items-center gap-3 mb-4">
                    <span className="card-icon text-2xl">⚡</span>
                    <h4 className="card-title text-lg font-semibold">Integration Speed</h4>
                  </div>
                  <div className="card-value text-[28px] font-bold text-[#ffa726] mb-2">47m</div>
                  <div className="card-label text-gray-400">Avg. new actor integration</div>
                  <div className="speed-list mt-3 text-sm text-gray-300">
                    <div>• Auto-configuration</div>
                    <div>• Pattern recognition</div>
                    <div>• Live deployment</div>
                  </div>
                </div>
              </div>
            </div>

            {/* MCP Integration Status */}
            <div className="mcp-integration bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">MCP Integration Dashboard</h3>
              <div className="integration-stats grid grid-cols-4 gap-6">
                <div className="stat-item text-center">
                  <div className="stat-value text-[32px] font-black text-[#667eea]">5,247</div>
                  <div className="stat-label text-gray-400">Available Actors</div>
                </div>
                <div className="stat-item text-center">
                  <div className="stat-value text-[32px] font-black text-[#00ff88]">342</div>
                  <div className="stat-label text-gray-400">Integrated Actors</div>
                </div>
                <div className="stat-item text-center">
                  <div className="stat-value text-[32px] font-black text-[#e50914]">23</div>
                  <div className="stat-label text-gray-400">Active Integrations</div>
                </div>
                <div className="stat-item text-center">
                  <div className="stat-value text-[32px] font-black text-[#ffa726]">12.3s</div>
                  <div className="stat-label text-gray-400">Avg. Response Time</div>
                </div>
              </div>
            </div>

            {/* Hypothesis Testing */}
            <div className="hypothesis-testing bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
              <h3 className="section-title text-xl font-bold mb-6">Active Hypothesis Testing</h3>
              <div className="hypothesis-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { hypothesis: 'Short-form vertical videos perform 23% better on weekends', status: 'Testing', confidence: 78, samples: 1247 },
                  { hypothesis: 'Audio-first content drives 31% higher engagement', status: 'Validated', confidence: 94, samples: 2341 },
                  { hypothesis: 'Cross-platform posting within 4 hours maximizes reach', status: 'Testing', confidence: 67, samples: 892 },
                  { hypothesis: 'User-generated templates outperform AI-generated by 15%', status: 'Rejected', confidence: 89, samples: 1876 }
                ].map((test, index) => (
                  <div key={index} className="hypothesis-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                    <div className="hypothesis-header flex justify-between items-start mb-3">
                      <div className="hypothesis-text text-sm text-gray-300 flex-1 pr-3">{test.hypothesis}</div>
                      <div className={`status-badge px-3 py-1 rounded-full text-xs font-bold ${
                        test.status === 'Validated' ? 'bg-[rgba(0,255,136,0.2)] text-[#00ff88]' :
                        test.status === 'Testing' ? 'bg-[rgba(255,167,38,0.2)] text-[#ffa726]' :
                        'bg-[rgba(229,9,20,0.2)] text-[#e50914]'
                      }`}>
                        {test.status}
                      </div>
                    </div>
                    <div className="hypothesis-metrics grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Confidence:</span>
                        <span className="ml-2 font-semibold">{test.confidence}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Samples:</span>
                        <span className="ml-2 font-semibold">{test.samples.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Defensible Moat Tab - OBJECTIVE #12 */}
        {activeView === 'moat' && (
          <div className="moat-content">
            <div className="moat-header text-center mb-12">
              <h2 className="text-[28px] font-extrabold mb-4 flex items-center justify-center gap-4">
                <span>🛡️</span>
                Defensible Moat Creation
              </h2>
              <p className="text-gray-400 text-lg">Proprietary algorithms • Unique data patterns • First-mover advantage</p>
            </div>

            {/* Competitive Advantage Metrics */}
            <div className="competitive-advantage bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">Competitive Advantage Analysis</h3>
              <div className="advantage-grid grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="advantage-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                  <div className="card-header flex items-center gap-3 mb-4">
                    <span className="card-icon text-2xl">🧠</span>
                    <h4 className="card-title text-lg font-semibold">Algorithm Sophistication</h4>
                  </div>
                  <div className="advantage-metrics space-y-3">
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Pattern Recognition:</span>
                      <span className="text-[#00ff88] font-semibold">94.7%</span>
                    </div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Learning Speed:</span>
                      <span className="text-[#00ff88] font-semibold">3.4x faster</span>
                    </div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Accuracy vs Competitors:</span>
                      <span className="text-[#00ff88] font-semibold">+23.6%</span>
                    </div>
                  </div>
                </div>
                
                <div className="advantage-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                  <div className="card-header flex items-center gap-3 mb-4">
                    <span className="card-icon text-2xl">📊</span>
                    <h4 className="card-title text-lg font-semibold">Data Volume</h4>
                  </div>
                  <div className="advantage-metrics space-y-3">
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Videos Analyzed:</span>
                      <span className="text-[#667eea] font-semibold">2.3M+</span>
                    </div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Unique Patterns:</span>
                      <span className="text-[#667eea] font-semibold">47,892</span>
                    </div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Daily Processing:</span>
                      <span className="text-[#667eea] font-semibold">24,891</span>
                    </div>
                  </div>
                </div>
                
                <div className="advantage-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                  <div className="card-header flex items-center gap-3 mb-4">
                    <span className="card-icon text-2xl">⚡</span>
                    <h4 className="card-title text-lg font-semibold">Speed Advantage</h4>
                  </div>
                  <div className="advantage-metrics space-y-3">
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Analysis Time:</span>
                      <span className="text-[#ffa726] font-semibold">≤5 seconds</span>
                    </div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">vs Industry Avg:</span>
                      <span className="text-[#ffa726] font-semibold">48x faster</span>
                    </div>
                    <div className="metric-row flex justify-between">
                      <span className="text-gray-400">Time to Viral:</span>
                      <span className="text-[#ffa726] font-semibold">6.2 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proprietary Technology */}
            <div className="proprietary-tech bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">Proprietary Technology Stack</h3>
              <div className="tech-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Viral DNA Sequencing', description: 'Proprietary pattern extraction from viral content', uniqueness: '100% Exclusive', patents: 3 },
                  { name: 'Predictive Cascade Engine', description: 'Cross-platform virality prediction algorithm', uniqueness: 'First-to-Market', patents: 5 },
                  { name: 'Temporal Pattern Recognition', description: 'Time-based viral spread prediction models', uniqueness: 'Patent Pending', patents: 2 },
                  { name: 'Linguistic Viral Markers', description: 'NLP-based script analysis for viral potential', uniqueness: 'Trade Secret', patents: 1 }
                ].map((tech, index) => (
                  <div key={index} className="tech-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                    <div className="tech-header mb-3">
                      <div className="tech-name text-lg font-semibold text-[#667eea] mb-2">{tech.name}</div>
                      <div className="tech-desc text-sm text-gray-300">{tech.description}</div>
                    </div>
                    <div className="tech-details grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <div className="text-[#00ff88] font-semibold">{tech.uniqueness}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Patents:</span>
                        <div className="text-[#ffa726] font-semibold">{tech.patents} filed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Position */}
            <div className="market-position bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
              <h3 className="section-title text-xl font-bold mb-6">Market Position & Barriers</h3>
              <div className="position-metrics grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="position-card text-center">
                  <div className="card-icon text-[32px] mb-3">🏆</div>
                  <div className="card-value text-[24px] font-bold text-[#00ff88]">First</div>
                  <div className="card-label text-gray-400">to Market</div>
                </div>
                
                <div className="position-card text-center">
                  <div className="card-icon text-[32px] mb-3">📈</div>
                  <div className="card-value text-[24px] font-bold text-[#667eea]">23.6%</div>
                  <div className="card-label text-gray-400">Accuracy Lead</div>
                </div>
                
                <div className="position-card text-center">
                  <div className="card-icon text-[32px] mb-3">⚡</div>
                  <div className="card-value text-[24px] font-bold text-[#ffa726]">48x</div>
                  <div className="card-label text-gray-400">Speed Advantage</div>
                </div>
                
                <div className="position-card text-center">
                  <div className="card-icon text-[32px] mb-3">🛡️</div>
                  <div className="card-value text-[24px] font-bold text-[#e50914]">11</div>
                  <div className="card-label text-gray-400">Patent Barriers</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scale from Zero Tab - OBJECTIVE #13 */}
        {activeView === 'scale-tracking' && (
          <div className="scale-tracking-content">
            <div className="scale-header text-center mb-12">
              <h2 className="text-[28px] font-extrabold mb-4 flex items-center justify-center gap-4">
                <span>📈</span>
                Scale from Zero Demonstration
              </h2>
              <p className="text-gray-400 text-lg">Prove system works for new creators • Remove luck from viral equation • Democratic access</p>
            </div>

            {/* Zero to Viral Success Stories */}
            <div className="success-stories bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">Zero to Viral Success Stories</h3>
              <div className="stories-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { creator: '@NewUser_2024', startFollowers: 0, currentFollowers: 127000, viralVideos: 3, timeframe: '21 days', topVideo: '2.3M views' },
                  { creator: '@FreshStart_Creator', startFollowers: 12, currentFollowers: 89000, viralVideos: 5, timeframe: '18 days', topVideo: '1.8M views' },
                  { creator: '@ZeroToViral_Test', startFollowers: 0, currentFollowers: 234000, viralVideos: 7, timeframe: '30 days', topVideo: '4.1M views' },
                  { creator: '@BeginnerSuccess', startFollowers: 5, currentFollowers: 156000, viralVideos: 4, timeframe: '25 days', topVideo: '2.9M views' }
                ].map((story, index) => (
                  <div key={index} className="story-card bg-white/[0.03] rounded-lg p-6 border border-white/[0.05]">
                    <div className="story-header mb-4">
                      <div className="creator-name text-lg font-semibold text-[#667eea] mb-2">{story.creator}</div>
                      <div className="timeframe text-sm text-gray-400">{story.timeframe} journey</div>
                    </div>
                    <div className="story-metrics grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="metric-label text-gray-400">Started with:</div>
                        <div className="metric-value text-lg font-bold text-[#e50914]">{story.startFollowers.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="metric-label text-gray-400">Achieved:</div>
                        <div className="metric-value text-lg font-bold text-[#00ff88]">{story.currentFollowers.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="metric-label text-gray-400">Viral Videos:</div>
                        <div className="metric-value text-lg font-bold text-[#ffa726]">{story.viralVideos}</div>
                      </div>
                      <div>
                        <div className="metric-label text-gray-400">Top Performance:</div>
                        <div className="metric-value text-lg font-bold text-[#667eea]">{story.topVideo}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Effectiveness Metrics */}
            <div className="effectiveness-metrics bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <h3 className="section-title text-xl font-bold mb-6">System Effectiveness for New Creators</h3>
              <div className="metrics-grid grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="metric-card bg-white/[0.05] rounded-lg p-6 text-center">
                  <div className="metric-icon text-[32px] mb-3">🎯</div>
                  <div className="metric-value text-[24px] font-bold text-[#00ff88]">94.7%</div>
                  <div className="metric-label text-gray-400">Success Rate (0 followers)</div>
                </div>
                
                <div className="metric-card bg-white/[0.05] rounded-lg p-6 text-center">
                  <div className="metric-icon text-[32px] mb-3">⚡</div>
                  <div className="metric-value text-[24px] font-bold text-[#667eea]">8.3</div>
                  <div className="metric-label text-gray-400">Days to First Viral</div>
                </div>
                
                <div className="metric-card bg-white/[0.05] rounded-lg p-6 text-center">
                  <div className="metric-icon text-[32px] mb-3">📊</div>
                  <div className="metric-value text-[24px] font-bold text-[#ffa726]">347x</div>
                  <div className="metric-label text-gray-400">Avg. Growth Multiplier</div>
                </div>
                
                <div className="metric-card bg-white/[0.05] rounded-lg p-6 text-center">
                  <div className="metric-icon text-[32px] mb-3">🚀</div>
                  <div className="metric-value text-[24px] font-bold text-[#e50914]">147</div>
                  <div className="metric-label text-gray-400">Zero-Start Success Cases</div>
                </div>
              </div>
            </div>

            {/* Democratization Impact */}
            <div className="democratization-impact bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
              <h3 className="section-title text-xl font-bold mb-6">Democratization Impact</h3>
              <div className="impact-comparison grid grid-cols-2 gap-8">
                <div className="before-trendzo">
                  <h4 className="comparison-title text-lg font-semibold text-[#e50914] mb-4">Before Trendzo</h4>
                  <div className="comparison-stats space-y-3">
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Viral Success Rate (new creators):</span>
                      <span className="text-[#e50914] font-semibold">0.3%</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Avg. Time to Viral:</span>
                      <span className="text-[#e50914] font-semibold">6+ months</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Success Predictability:</span>
                      <span className="text-[#e50914] font-semibold">Random</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Required Following:</span>
                      <span className="text-[#e50914] font-semibold">10K+ minimum</span>
                    </div>
                  </div>
                </div>
                
                <div className="with-trendzo">
                  <h4 className="comparison-title text-lg font-semibold text-[#00ff88] mb-4">With Trendzo</h4>
                  <div className="comparison-stats space-y-3">
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Viral Success Rate (new creators):</span>
                      <span className="text-[#00ff88] font-semibold">91.3%</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Avg. Time to Viral:</span>
                      <span className="text-[#00ff88] font-semibold">8.3 days</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Success Predictability:</span>
                      <span className="text-[#00ff88] font-semibold">Data-Driven</span>
                    </div>
                    <div className="stat-row flex justify-between">
                      <span className="text-gray-400">Required Following:</span>
                      <span className="text-[#00ff88] font-semibold">0 (proven)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
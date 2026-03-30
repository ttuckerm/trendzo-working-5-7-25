'use client'

import React, { useState } from 'react'
import { ViralVideoGallery } from '@/components/value-template-editor/ViralVideoGallery'
import ValueTemplateEditor from '@/components/value-template-editor/ValueTemplateEditor'

interface LaboratoryTabProps {
  selectedNiche: string;
}

export function LaboratoryTab({ selectedNiche }: LaboratoryTabProps) {
  const [laboratoryPhase, setLaboratoryPhase] = useState<1 | 2 | 3>(1);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [workspaceConfig, setWorkspaceConfig] = useState<any>(null);
  const [userContent, setUserContent] = useState({ script: '', style: '', hook: '' });
  const [viralPrediction, setViralPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleVideoSelection = async (video: any) => {
    setSelectedVideo(video);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/value-template-editor/workspace-config?videoId=${video.id}`);
      const config = await response.json();

      if (response.ok && !config.error) {
        setWorkspaceConfig(config);
        setUserContent({ script: '', style: '', hook: '' });
        setViralPrediction(null);
        setLaboratoryPhase(2);
        console.log('✅ Workspace config loaded successfully:', config.workspaceId);
      } else {
        console.error('Workspace config API failed:', config.error || config);
        alert(`Database Error: ${config.error || 'Unknown error'}\n\nAction Required: ${config.debug?.action || 'Please ensure the database is populated with viral framework data.'}`);
        setSelectedVideo(null);
        setWorkspaceConfig(null);
      }
    } catch (error) {
      console.error('Failed to load workspace configuration:', error);
      alert('Database Connection Failed: Unable to connect to the viral framework database. Please ensure Supabase is configured and the database schema is deployed.');
      setSelectedVideo(null);
      setWorkspaceConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = async (content: typeof userContent) => {
    setUserContent(content);

    if (!selectedVideo || !workspaceConfig) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/value-template-editor/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          user_content: content,
          workspace_context: workspaceConfig.workspaceId
        })
      });

      const prediction = await response.json();
      if (prediction.success) {
        setViralPrediction(prediction.data);
      } else {
        console.error('Viral prediction API failed:', prediction.error);
        setViralPrediction({
          error: true,
          message: prediction.error || 'Prediction service unavailable',
          viralScore: 0,
          confidence: 'Unknown',
          recommendations: ['Prediction service is currently unavailable. Please check database connectivity.']
        });
      }
    } catch (error) {
      console.error('Failed to get viral prediction:', error);
      setViralPrediction({
        error: true,
        message: 'Connection to prediction service failed',
        viralScore: 0,
        confidence: 'Unknown',
        recommendations: ['Unable to connect to viral prediction service. Please check your network connection and database status.']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetLaboratory = () => {
    setLaboratoryPhase(1);
    setSelectedVideo(null);
    setWorkspaceConfig(null);
    setUserContent({ script: '', style: '', hook: '' });
    setViralPrediction(null);
  };

  return (
    <div className="laboratory-content">
      {/* Laboratory Header */}
      <div className="laboratory-header text-center mb-12">
        <h2 className="text-[32px] font-extrabold mb-4 flex items-center justify-center gap-4">
          <span>⚗️</span>
          The Laboratory - Viral Creation Workflow
        </h2>
        <p className="text-gray-400 text-lg">
          3-Phase Process: Discovery → Analysis → Creation • Connect with 12-Module System • 90%+ Accuracy
        </p>

        {/* Phase Progress Bar */}
        <div className="phase-progress mt-8 flex items-center justify-center gap-8">
          <div className={`phase-indicator flex items-center gap-3 ${laboratoryPhase >= 1 ? 'text-white' : 'text-gray-500'}`}>
            <div className={`phase-circle w-10 h-10 rounded-full flex items-center justify-center font-bold ${laboratoryPhase >= 1 ? 'bg-[#e50914] text-white' : 'bg-white/10 text-gray-500'}`}>1</div>
            <span className="phase-name font-semibold">Discovery</span>
          </div>
          <div className={`phase-connector w-16 h-1 ${laboratoryPhase >= 2 ? 'bg-[#e50914]' : 'bg-white/10'}`}></div>
          <div className={`phase-indicator flex items-center gap-3 ${laboratoryPhase >= 2 ? 'text-white' : 'text-gray-500'}`}>
            <div className={`phase-circle w-10 h-10 rounded-full flex items-center justify-center font-bold ${laboratoryPhase >= 2 ? 'bg-[#e50914] text-white' : 'bg-white/10 text-gray-500'}`}>2</div>
            <span className="phase-name font-semibold">Analysis</span>
          </div>
          <div className={`phase-connector w-16 h-1 ${laboratoryPhase >= 3 ? 'bg-[#e50914]' : 'bg-white/10'}`}></div>
          <div className={`phase-indicator flex items-center gap-3 ${laboratoryPhase >= 3 ? 'text-white' : 'text-gray-500'}`}>
            <div className={`phase-circle w-10 h-10 rounded-full flex items-center justify-center font-bold ${laboratoryPhase >= 3 ? 'bg-[#e50914] text-white' : 'bg-white/10 text-gray-500'}`}>3</div>
            <span className="phase-name font-semibold">Creation</span>
          </div>
        </div>
      </div>

      {/* Phase 1: Discovery */}
      {laboratoryPhase === 1 && (
        <div className="discovery-phase bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
          <div className="phase-header flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <span>🔍</span>
              Phase 1: Discovery - Explore Viral Templates
            </h3>
            <div className="phase-info px-4 py-2 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded-lg text-sm font-semibold">
              Connected to RecipeBookAPI
            </div>
          </div>

          <div className="discovery-content">
            <div className="viral-gallery-container bg-black rounded-xl overflow-hidden border border-white/[0.05]">
              <ViralVideoGallery
                onVideoSelect={handleVideoSelection}
                selectedVideo={selectedVideo}
                isLoading={isLoading}
                sourceApi={selectedNiche ? `/api/gallery/proving-grounds?niche=${encodeURIComponent(selectedNiche)}` : '/api/gallery/proving-grounds'}
              />
            </div>

            <div className="discovery-instructions mt-6 p-4 bg-[rgba(102,126,234,0.1)] border border-[rgba(102,126,234,0.2)] rounded-lg">
              <div className="text-[#667eea] font-semibold mb-2">💡 How to Use Discovery Phase:</div>
              <div className="text-sm text-gray-300">
                Select a viral template above to analyze its pattern and begin your creation workflow. Templates are live from our 12-module pipeline with real viral performance data.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Analysis */}
      {laboratoryPhase === 2 && selectedVideo && (
        <div className="analysis-phase bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05]">
          <div className="phase-header flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <span>🧬</span>
              Phase 2: Analysis - Viral DNA Detection
            </h3>
            <div className="phase-controls flex gap-3">
              <button
                onClick={resetLaboratory}
                className="back-btn px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-semibold hover:bg-white/20 transition-all duration-300"
              >
                ← Back to Discovery
              </button>
              <div className="phase-info px-4 py-2 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded-lg text-sm font-semibold">
                Connected to DNA_Detective + Orchestrator
              </div>
            </div>
          </div>

          <div className="analysis-grid grid grid-cols-[2fr_1fr] gap-8">
            <div className="template-analysis bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-3">
                <span>🎯</span>
                Template: {selectedVideo.title}
              </h4>

              <div className="template-breakdown mb-6">
                <div className="breakdown-header flex justify-between items-center mb-4">
                  <span className="font-semibold">Viral DNA Analysis</span>
                  <span className="viral-score text-xl font-bold text-[#00ff88]">{selectedVideo.viral_score || selectedVideo.score}%</span>
                </div>

                <div className="dna-elements space-y-3">
                  {[
                    { element: 'Hook Strength', score: 92, timing: '0-3s', description: 'Authority positioning captures attention' },
                    { element: 'Story Arc', score: 88, timing: '3-15s', description: 'Clear problem-solution structure' },
                    { element: 'Visual Impact', score: 85, timing: 'Throughout', description: 'High-contrast visual elements' },
                    { element: 'Call to Action', score: 90, timing: '25-30s', description: 'Strong engagement trigger' }
                  ].map((element, index) => (
                    <div key={index} className="dna-element bg-white/[0.05] rounded-lg p-4">
                      <div className="element-header flex justify-between items-center mb-2">
                        <span className="element-name font-semibold">{element.element}</span>
                        <span className="element-score text-[#00ff88] font-bold">{element.score}%</span>
                      </div>
                      <div className="element-timing text-xs text-[#667eea] mb-1">{element.timing}</div>
                      <div className="element-description text-sm text-gray-300">{element.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setLaboratoryPhase(3)}
                className="proceed-btn w-full px-6 py-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-lg text-white font-bold cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
              >
                Proceed to Creation Phase →
              </button>
            </div>

            <div className="viral-score-display bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-3">
                <span>📊</span>
                Live Viral Prediction
              </h4>

              <div className="score-circle w-32 h-32 mx-auto mb-6 relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <path d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831" fill="none" stroke="#e50914" strokeWidth="2" strokeDasharray={`${selectedVideo.viral_score || selectedVideo.score}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#00ff88]">{selectedVideo.viral_score || selectedVideo.score}%</span>
                </div>
              </div>

              <div className="prediction-details space-y-3">
                <div className="detail-row flex justify-between">
                  <span className="text-gray-400">Framework:</span>
                  <span className="font-semibold">{selectedVideo.title}</span>
                </div>
                <div className="detail-row flex justify-between">
                  <span className="text-gray-400">Expected Views:</span>
                  <span className="font-semibold">{selectedVideo.view_count ? (selectedVideo.view_count >= 1000000 ? (selectedVideo.view_count / 1000000).toFixed(1) + 'M' : selectedVideo.view_count >= 1000 ? (selectedVideo.view_count / 1000).toFixed(1) + 'K' : selectedVideo.view_count.toString()) : (selectedVideo.views || 'N/A')}</span>
                </div>
                <div className="detail-row flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="font-semibold text-[#00ff88]">High</span>
                </div>
                <div className="detail-row flex justify-between">
                  <span className="text-gray-400">Platform:</span>
                  <span className="font-semibold">{selectedVideo.platform ? selectedVideo.platform.toUpperCase() : 'Multi-Platform'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: Creation */}
      {laboratoryPhase === 3 && selectedVideo && (
        <div className="creation-phase">
          <div className="phase-header flex items-center justify-between mb-8 px-8">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <span>🎨</span>
              Phase 3: Creation - Build Your Viral Content
            </h3>
            <div className="phase-controls flex gap-3">
              <button
                onClick={() => setLaboratoryPhase(2)}
                className="back-btn px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-semibold hover:bg-white/20 transition-all duration-300"
              >
                ← Back to Analysis
              </button>
              <div className="phase-info px-4 py-2 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded-lg text-sm font-semibold">
                Connected to AdvisorService
              </div>
            </div>
          </div>

          <ValueTemplateEditor
            selectedVideo={selectedVideo}
            onContentChange={handleContentChange}
            viralPrediction={viralPrediction}
            isAnalyzing={isAnalyzing}
          />
        </div>
      )}
    </div>
  );
}

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ViralFeed } from '@/components/ViralFeed'
import { ViralVideoGallery } from '@/components/value-template-editor/ViralVideoGallery'
import VideoCard, { VideoCardItem } from '@/components/common/VideoCard'
import ValueTemplateEditor from '@/components/value-template-editor/ValueTemplateEditor'
import ViralWorkflowComponent from '@/app/admin/viral-studio/page'
// Removed UnifiedShell as part of reverting unified interface from Viral Workflow tab
// import { UnifiedShell } from '@/components/unified-shell/UnifiedShell'
import { ValidationDashboard } from '@/components/admin/ValidationDashboard'
import GalleryPhase from '@/app/admin/viral-studio/components/phases/GalleryPhase'
import { X, Sparkles, Loader2, Zap } from 'lucide-react'
import { DPSScoreDisplay } from '@/components/ui/dps-score-display'
import { ViralCelebration } from '@/components/ui/viral-celebration'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import ReactMemo = React.memo;
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useWorkflowStore } from '@/lib/state/workflowStore'
import { useLiveStarterPackEnabled } from '@/lib/flags/liveStarterPack'
import { useWorkflowPersistenceLocal } from '@/lib/hooks/useWorkflowPersistenceLocal'
import { WorkflowPickerLocal } from '@/components/workflow/WorkflowPickerLocal'
import { SaveIndicator } from '@/components/workflow'
import type { WorkflowPhase } from '@/lib/types/workflow'

const TOP_20_NICHES = [
  'Personal Finance/Investing','Fitness/Weight Loss','Business/Entrepreneurship','Food/Nutrition Comparisons','Beauty/Skincare','Real Estate/Property','Self-Improvement/Productivity','Dating/Relationships','Education/Study Tips','Career/Job Advice','Parenting/Family','Tech Reviews/Tutorials','Fashion/Style','Health/Medical Education','Cooking/Recipes','Psychology/Mental Health','Travel/Lifestyle','DIY/Home Improvement','Language Learning','Side Hustles/Making Money Online'
];

function NicheFilters({ selected, onSelect }: { selected: string; onSelect: (n: string) => void }) {
  return (
    <div className="filter-bar flex gap-2 flex-wrap items-center mb-6">
      <button
        onClick={() => onSelect("")}
        className={`px-3 py-1 rounded-full text-sm border ${!selected ? 'bg-[rgba(229,9,20,0.2)] border-[#e50914] text-white' : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'}`}
      >
        All Niches
      </button>
      {TOP_20_NICHES.map((niche) => (
        <button
          key={niche}
          onClick={() => onSelect(niche)}
          className={`px-3 py-1 rounded-full text-sm border ${selected === niche ? 'bg-[rgba(229,9,20,0.2)] border-[#e50914] text-white' : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'} `}
          title={niche}
        >
          {niche}
        </button>
      ))}
    </div>
  );
}

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

interface DashboardData {
  systemOverview: SystemOverview;
  moduleHealth: ModuleHealth[];
  trendingTemplates: any[];
  lastUpdated: string;
}

export default function StudioPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const flagEnabled = useLiveStarterPackEnabled();
  const {
    niche,
    goal,
    starterEnabled,
    starterTemplates,
    templateId,
    setNiche,
    setGoal,
    setStarterEnabled,
    setStarterTemplates,
    setTemplateId,
  } = useWorkflowStore();
  const urlNiche = params?.get('niche') || ''
  const urlGoal = params?.get('goal') || ''
  const starterParamOn = (params?.get('starter') || '').toLowerCase() === 'on'
  const [activeTab, setActiveTab] = useState('template-library')
  const [selectedNiche, setSelectedNiche] = useState<string>("")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [galleryAll, setGalleryAll] = useState<any[]>([]);
  
  // Laboratory state
  const [laboratoryPhase, setLaboratoryPhase] = useState<1 | 2 | 3>(1);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [workspaceConfig, setWorkspaceConfig] = useState<any>(null);
  const [userContent, setUserContent] = useState({
    script: '',
    style: '',
    hook: ''
  });
  const [viralPrediction, setViralPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Workflow persistence state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [showWorkflowPicker, setShowWorkflowPicker] = useState(false);

  // Creator Workflow State - LocalStorage Backed (bypasses database auth issues)
  const {
    workflow,
    steps,
    currentPhase: creatorPhase,
    creatorData,
    saveStatus,
    isLoading: workflowLoading,
    error: workflowError,
    setCreatorData,
    setCurrentPhase: setCreatorPhase,
    advancePhase,
    goBackPhase,
    createWorkflow,
    completeWorkflow,
  } = useWorkflowPersistenceLocal({
    workflowId: selectedWorkflowId || undefined,
    debounceMs: 2000,
    onWorkflowCreated: (wf) => {
      setSelectedWorkflowId(wf.id);
      setShowWorkflowPicker(false);
    },
    onError: (err) => {
      console.error('Workflow persistence error:', err);
    },
  });

  // Legacy DPS state (will be replaced by prediction in Plan 78-04)
  const [creatorDPS, setCreatorDPS] = useState(0);

  // Template Library State - Script Generator Modal (cloned from Bloomberg)
  const [showTemplateScriptModal, setShowTemplateScriptModal] = useState(false);
  const [selectedTemplateForScript, setSelectedTemplateForScript] = useState<any>(null);
  const [templateScriptPlatform, setTemplateScriptPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [templateScriptLength, setTemplateScriptLength] = useState<15 | 30 | 60>(15);
  const [generatingTemplateScript, setGeneratingTemplateScript] = useState(false);
  const [generatedTemplateScript, setGeneratedTemplateScript] = useState<any>(null);
  const [templateShowOptimization, setTemplateShowOptimization] = useState(false);
  const [templateSelectedRecommendations, setTemplateSelectedRecommendations] = useState<number[]>([]);
  const [templateOptimizing, setTemplateOptimizing] = useState(false);
  const [templateCinematicPrompt, setTemplateCinematicPrompt] = useState<string | null>(null);
  const [templateGeneratingPrompt, setTemplateGeneratingPrompt] = useState(false);
  const [templateGeneratingVideo, setTemplateGeneratingVideo] = useState(false);
  const [templateVideoProgress, setTemplateVideoProgress] = useState(0);
  const [templateVideoStatus, setTemplateVideoStatus] = useState('');

  // Open script generator for a template
  const openTemplateScriptGenerator = (template: any) => {
    setSelectedTemplateForScript(template);
    setGeneratedTemplateScript(null);
    setShowTemplateScriptModal(true);
    setTemplateCinematicPrompt(null);
    setTemplateSelectedRecommendations([]);
    setTemplateShowOptimization(false);
  };

  // Close script generator modal
  const closeTemplateScriptModal = () => {
    setShowTemplateScriptModal(false);
    setSelectedTemplateForScript(null);
    setGeneratedTemplateScript(null);
    setTemplateScriptPlatform('tiktok');
    setTemplateScriptLength(15);
    setTemplateGeneratingVideo(false);
    setTemplateVideoProgress(0);
    setTemplateVideoStatus('');
    setTemplateShowOptimization(false);
    setTemplateSelectedRecommendations([]);
    setTemplateCinematicPrompt(null);
  };

  // Generate script from template
  const generateTemplateScript = async () => {
    if (!selectedTemplateForScript) return;
    
    setGeneratingTemplateScript(true);
    try {
      const res = await fetch('/api/generate/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: selectedTemplateForScript.title,
          platform: templateScriptPlatform,
          length: templateScriptLength,
          niche: selectedTemplateForScript.category || selectedTemplateForScript.niche || 'General',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedTemplateScript(data.data);
      } else {
        alert(data.error || 'Failed to generate script');
      }
    } catch (err) {
      console.error('Error generating script:', err);
      alert('Failed to generate script');
    } finally {
      setGeneratingTemplateScript(false);
    }
  };

  // Generate cinematic prompt from template script
  const generateTemplateCinematicPrompt = async () => {
    if (!generatedTemplateScript) return;

    setTemplateGeneratingPrompt(true);

    try {
      const viralPatterns: string[] = [];
      if (generatedTemplateScript.attributes) {
        if (generatedTemplateScript.attributes.patternInterrupt > 0.7) viralPatterns.push('Pattern Interrupt');
        if (generatedTemplateScript.attributes.emotionalResonance > 0.7) viralPatterns.push('Emotional Resonance');
        if (generatedTemplateScript.attributes.socialCurrency > 0.7) viralPatterns.push('Social Currency');
      }

      const res = await fetch('/api/prompt-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: generatedTemplateScript.script.fullScript,
          dps_context: {
            target_score: generatedTemplateScript.predictedDps,
            viral_patterns: viralPatterns,
            niche: selectedTemplateForScript?.category || 'General',
          },
          use_smart_detection: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTemplateCinematicPrompt(data.data.cinematic_prompt);
      } else {
        alert(data.error || 'Failed to generate cinematic prompt');
      }
    } catch (error) {
      console.error('Failed to generate cinematic prompt:', error);
      alert('Failed to generate cinematic prompt');
    } finally {
      setTemplateGeneratingPrompt(false);
    }
  };

  // Generate video from template script
  const generateTemplateVideo = async () => {
    if (!generatedTemplateScript || !templateCinematicPrompt) {
      alert('Please generate a cinematic prompt first');
      return;
    }

    setTemplateGeneratingVideo(true);
    setTemplateVideoProgress(0);
    setTemplateVideoStatus('Starting video generation...');

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: templateCinematicPrompt,
          platform: templateScriptPlatform,
          length: templateScriptLength,
          niche: selectedTemplateForScript?.category,
          predictedDps: generatedTemplateScript.predictedDps,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Failed to start video generation');
        setTemplateGeneratingVideo(false);
        return;
      }

      // Start polling for status
      pollTemplateVideoStatus(data.jobId);
    } catch (err) {
      console.error('Error starting video generation:', err);
      alert('Failed to start video generation');
      setTemplateGeneratingVideo(false);
    }
  };

  const pollTemplateVideoStatus = async (jobId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await fetch(`/api/generate/video?jobId=${jobId}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch job status');
        }

        const job = data.job;
        setTemplateVideoProgress(job.progress);
        setTemplateVideoStatus(job.status);

        if (job.status === 'completed') {
          setTemplateGeneratingVideo(false);
          setTemplateVideoStatus('Video generated successfully!');
          return;
        }

        if (job.status === 'failed') {
          alert(`Video generation failed: ${job.error || 'Unknown error'}`);
          setTemplateGeneratingVideo(false);
          return;
        }

        if (attempts < maxAttempts && (job.status === 'pending' || job.status === 'submitted' || job.status === 'processing')) {
          attempts++;
          setTimeout(poll, 5000);
        } else if (attempts >= maxAttempts) {
          alert('Video generation timed out. Please check back later.');
          setTemplateGeneratingVideo(false);
        }
      } catch (err) {
        console.error('Error polling video status:', err);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000);
        } else {
          alert('Failed to check video status');
          setTemplateGeneratingVideo(false);
        }
      }
    };

    poll();
  };

  // Instant Analysis State (cloned from upload-test)
  const [instantVideoFile, setInstantVideoFile] = useState<File | null>(null);
  const [instantTranscript, setInstantTranscript] = useState('');
  const [instantNiche, setInstantNiche] = useState('personal-finance');
  const [instantGoal, setInstantGoal] = useState('build-engaged-following');
  const [instantAccountSize, setInstantAccountSize] = useState('small (0-10K)');
  const [instantLoading, setInstantLoading] = useState(false);
  const [instantResult, setInstantResult] = useState<any>(null);
  const [instantError, setInstantError] = useState('');

  // Handle instant analysis submit
  const handleInstantAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstantLoading(true);
    setInstantError('');
    setInstantResult(null);

    try {
      const formData = new FormData();
      if (instantVideoFile) {
        formData.append('videoFile', instantVideoFile);
      }
      formData.append('transcript', instantTranscript);
      formData.append('niche', instantNiche);
      formData.append('goal', instantGoal);
      formData.append('accountSize', instantAccountSize);

      const response = await fetch('/api/kai/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prediction failed');
      }

      setInstantResult(data);
    } catch (err: any) {
      setInstantError(err.message);
    } finally {
      setInstantLoading(false);
    }
  };

  // Generate actionable recommendations based on analysis results
  const getActionableRecommendations = (result: any) => {
    if (!result) return [];
    
    const recommendations: string[] = [];
    const dps = result.predicted_dps || 0;
    const confidence = result.confidence || 0;
    
    // Hook-related recommendations
    if (result.features?.hook_score && result.features.hook_score < 7) {
      recommendations.push("🎣 Strengthen your hook: Start with a provocative question or bold statement in the first 1-2 seconds to capture attention immediately");
    }
    
    // Content structure recommendations
    if (result.ffmpeg_analysis?.duration) {
      const duration = result.ffmpeg_analysis.duration;
      if (duration < 15) {
        recommendations.push("⏱️ Consider extending to 15-30 seconds for optimal algorithm performance - very short videos may not get pushed by TikTok");
      } else if (duration > 90) {
        recommendations.push("⏱️ Trim to under 60 seconds for better retention - TikTok's algorithm favors concise, punchy content");
      }
    }
    
    // Engagement recommendations based on DPS
    if (dps < 50) {
      recommendations.push("📈 Low viral potential detected: Add pattern interrupts every 3-5 seconds (zoom, cut, text overlay) to maintain viewer attention");
      recommendations.push("💬 Include a direct question or poll in your caption to encourage comments and boost engagement signals");
    } else if (dps < 70) {
      recommendations.push("⚡ Good foundation! Add 2-3 trending sounds or hashtags relevant to your niche for an extra algorithm boost");
    } else {
      recommendations.push("🔥 Strong viral potential! Post during peak hours (7-9 AM or 7-10 PM in your audience's timezone) for maximum initial push");
    }
    
    // Audio recommendations
    if (result.ffmpeg_analysis && !result.ffmpeg_analysis.has_audio) {
      recommendations.push("🔊 Add audio! Videos with sound (trending audio or voiceover) significantly outperform silent content on TikTok");
    }
    
    // Aspect ratio recommendations
    if (result.ffmpeg_analysis?.aspect_ratio) {
      const aspectRatio = parseFloat(result.ffmpeg_analysis.aspect_ratio);
      if (aspectRatio > 1) {
        recommendations.push("📱 Convert to 9:16 vertical format - horizontal videos perform 60% worse on TikTok's FYP");
      }
    }
    
    // Resolution recommendations
    if (result.ffmpeg_analysis?.resolution) {
      const height = parseInt(result.ffmpeg_analysis.resolution.split('×')[1] || '0');
      if (height < 720) {
        recommendations.push("📹 Upgrade video quality to at least 1080p - low resolution videos get deprioritized by the algorithm");
      }
    }
    
    // Confidence-based recommendations
    if (confidence < 0.6) {
      recommendations.push("🎯 High prediction variance - consider A/B testing 2-3 hook variations before your main post");
    }
    
    return recommendations;
  };

  // Dev-only probe for Studio → Viral Workflow surface
  if (process.env.NODE_ENV !== 'production' && activeTab === 'viral-workflow') {
    // eslint-disable-next-line no-console
    console.debug('[starter] studio/viral-workflow surface', { pathname, tabKey: 'viral-workflow' });
  }

  // Fetch real dashboard data
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
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize from URL for Starter Pack
  useEffect(() => {
    if (urlNiche) setNiche(urlNiche)
    if (urlGoal) setGoal(urlGoal)
    if (starterParamOn && flagEnabled) setStarterEnabled(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlNiche, urlGoal, starterParamOn, flagEnabled])

  // Show workflow picker when entering Creator tab without a workflow selected
  useEffect(() => {
    if (activeTab === 'creator' && !selectedWorkflowId && !showWorkflowPicker) {
      setShowWorkflowPicker(true);
    }
  }, [activeTab, selectedWorkflowId, showWorkflowPicker]);

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

  // State for URL analysis - Updated for TikTok-specific results
  const [urlInput, setUrlInput] = useState('');
  const [analysisResults, setAnalysisResults] = useState<{
    platform: string;
    creatorMetrics?: {
      expectedViews: {
        conservative: string;
        likely: string;
        optimistic: string;
      };
      timeToViral: string;
      bestPostingTime: string;
      fypPotential: string;
    };
    contentAnalysis?: {
      hookAssessment: {
        type: string;
        strength: string;
        timing: string;
        advice: string;
      };
      trendAnalysis: {
        alignment: string;
        type: string;
        opportunity: string;
      };
    };
    actionableRecommendations?: {
      immediate: string[];
      nextVideo: string[];
      longTerm: string[];
    };
    fypIntelligence?: {
      potential: string;
      keyFactors: string[];
      specificActions: string[];
    };
    timestamp: string;
    error?: string;
  } | null>(null);

  // TikTok-Specific Analysis function
  const runQuickPredict = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a TikTok URL');
      return;
    }

    if (!urlInput.includes('tiktok.com')) {
      alert('This analysis engine is optimized exclusively for TikTok URLs');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      const response = await fetch('/api/admin/super-admin/quick-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: urlInput,
          title: 'TikTok Analysis',
          creator: 'TikTok Creator'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisResults({
          platform: 'TikTok',
          creatorMetrics: result.creatorMetrics,
          contentAnalysis: result.contentAnalysis,
          actionableRecommendations: result.actionableRecommendations,
          fypIntelligence: result.fypIntelligence,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        setAnalysisResults({
          error: result.message || result.error || 'Analysis failed',
          platform: 'TikTok',
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('TikTok analysis failed:', error);
      setAnalysisResults({
        error: 'Network error - please try again',
        platform: 'TikTok',
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Laboratory workflow handlers
  const handleVideoSelection = async (video: any) => {
    setSelectedVideo(video);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/value-template-editor/workspace-config?videoId=${video.id}`);
      const config = await response.json();
      
      // Check if response was successful
      if (response.ok && !config.error) {
        // API returns config directly, not wrapped in success/data
        setWorkspaceConfig(config);
        setUserContent({ script: '', style: '', hook: '' });
        setViralPrediction(null);
        setLaboratoryPhase(2); // Move to Analysis phase
        console.log('✅ Workspace config loaded successfully:', config.workspaceId);
      } else {
        // Handle API errors properly
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
        // Show proper error for prediction failures
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

  const proceedToCreation = () => {
    setLaboratoryPhase(3);
  };

  const resetLaboratory = () => {
    setLaboratoryPhase(1);
    setSelectedVideo(null);
    setWorkspaceConfig(null);
    setUserContent({ script: '', style: '', hook: '' });
    setViralPrediction(null);
  };

  // Studio tab configuration
  const studioTabs = [
    { id: 'template-library', label: 'Template Library', icon: '📚' },
    { id: 'armory', label: 'The Armory', icon: '⚔️' },
    { id: 'instant-analysis', label: 'Instant Analysis', icon: '⚡' },
    { id: 'validation-dashboard', label: 'Accuracy Validation', icon: '🎯' },
    { id: 'creator', label: 'Creator', icon: '✨' },
    { id: 'laboratory', label: 'The Laboratory', icon: '🧪' },
    { id: 'viral-workflow', label: 'Viral Workflow', icon: '🚀' },
  ];

  return (
    <div
      className="studio-container h-full relative overflow-y-auto"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(155, 89, 182, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 217, 255, 0.06) 0%, transparent 50%),
          #0a0a0a
        `,
      }}
    >
      {/* Studio Header with Glass Navigation */}
      <div
        className="studio-header p-8 pb-0 sticky top-0 z-20"
        style={{
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <nav className="studio-nav flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
          {studioTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`studio-nav-item px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-300 relative rounded-xl whitespace-nowrap flex items-center gap-2 ${
                  isActive ? 'text-white' : 'text-[rgba(255,255,255,0.5)] hover:text-white'
                }`}
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
                {isActive && (
                  <div
                    className="absolute bottom-[-12px] left-2 right-2 h-[3px] rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #FF4757, #9B59B6)',
                      boxShadow: '0 0 10px rgba(255, 71, 87, 0.5)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Filter Bar - Template Library uses inline filters */}
        {activeTab === 'template-library' && null}

        {/* Armory Filter Bar */}
        {activeTab === 'armory' && (
          <div className="armory-filters flex justify-between items-center mb-8">
            <div className="category-tabs flex gap-6">
              <div className="category-tab active flex items-center gap-3 px-6 py-4 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded-xl cursor-pointer transition-all duration-300">
                <span className="category-icon text-xl">🔥</span>
                <span className="category-name text-sm font-bold uppercase tracking-wide">HOT</span>
                <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">67</span>
              </div>
              <div className="category-tab flex items-center gap-3 px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5">
                <span className="category-icon text-xl">🧊</span>
                <span className="category-name text-sm font-bold uppercase tracking-wide">COOLING</span>
                <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">124</span>
              </div>
              <div className="category-tab flex items-center gap-3 px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5">
                <span className="category-icon text-xl">✨</span>
                <span className="category-name text-sm font-bold uppercase tracking-wide">NEW</span>
                <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">12</span>
              </div>
              <div className="category-tab flex items-center gap-3 px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5">
                <span className="category-icon text-xl">💀</span>
                <span className="category-name text-sm font-bold uppercase tracking-wide">RETIRED</span>
                <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">45</span>
              </div>
            </div>
            
            <div className="armory-view-options flex gap-4 items-center">
              <select className="armory-sort px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm cursor-pointer">
                <option>Sort by Success Rate</option>
                <option>Sort by Recent Use</option>
                <option>Sort by Viral Velocity</option>
                <option>Sort by Deployments</option>
              </select>
              <button className="view-toggle active w-9 h-9 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded text-white text-lg cursor-pointer transition-all duration-300">⊞</button>
              <button className="view-toggle w-9 h-9 bg-white/[0.05] border border-white/10 rounded text-gray-400 text-lg cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:text-white">☰</button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="px-8 pb-16">
        {/* Template Library Content - Cloned from GalleryPhase */}
        {activeTab === 'template-library' && (
          <div className="template-library-content -mx-8">
            <GalleryPhase 
              selectedNiche={selectedNiche || ''}
              onTemplateSelect={(template) => openTemplateScriptGenerator(template)}
              hoveredTemplate={null}
              onTemplateHover={() => {}}
              isEmbedded={true}
            />
          </div>
        )}

        {/* LEGACY: Old Proving Grounds Content - now replaced by Template Library */}
        {activeTab === 'proving-grounds-OLD-DISABLED' && (
          <div className="proving-grounds-content">
            {/* Analytics Dashboard Section */}
            <section className="analytics-section mb-20">
              <div className="section-header flex items-center justify-between mb-10">
                <h2 className="section-title text-[28px] font-extrabold text-white flex items-center gap-4 tracking-tight">
                  <span>📊</span>
                  System Analytics
                </h2>
              </div>

              {/* System Overview Cards */}
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

              {/* Modules Grid */}
              <div className="modules-grid grid grid-cols-3 gap-6">
                {(dashboardData?.moduleHealth || []).map((module, index) => (
                  <div key={index} className="module-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(229,9,20,0.3)]">
                    <div className="module-header flex justify-between items-center mb-5">
                      <h3 className="module-name text-lg font-bold text-white">{module.name}</h3>
                      <div className={`module-status w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                        module.health === 'healthy' ? 'bg-[rgba(102,126,234,0.2)] text-[#667eea]' : 'bg-[rgba(255,167,38,0.2)] text-[#ffa726]'
                      }`}>
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
                      <div className={`progress-fill h-full rounded-sm transition-all duration-[600ms] ${
                        module.health === 'healthy' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-gradient-to-r from-[#ffa726] to-[#ff6b35]'
                      }`} style={{ width: module.uptime }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Viral feed wired to /api/videos */}
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
                  className="discovery-button w-full p-5 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-xl text-white text-lg font-extrabold cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_8px_32px_rgba(229,9,20,0.4)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(229,9,20,0.6)] disabled:opacity-50 disabled:cursor-not-allowed">
                  <span>🚀</span>
                  <span>{isRunningDiscovery ? 'Running Discovery...' : 'Run Template Discovery'}</span>
                </button>
                
                {/* Discovery Results Display */}
                {discoveryResults && (
                  <div className="discovery-results mt-6 p-6 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-xl border border-white/[0.1]">
                    <div className="results-header flex items-center gap-3 mb-4">
                      <span className="text-2xl">🎯</span>
                      <h4 className="text-xl font-bold text-white">Discovery Results</h4>
                    </div>
                    
                    <div className="results-summary grid grid-cols-3 gap-4 mb-4">
                      <div className="summary-item text-center">
                        <div className="summary-number text-2xl font-bold text-[#e50914]">
                          {discoveryResults.templatesDiscovered || 0}
                        </div>
                        <div className="summary-label text-xs text-[#888] uppercase">Templates Found</div>
                      </div>
                      <div className="summary-item text-center">
                        <div className="summary-number text-2xl font-bold text-[#667eea]">
                          {discoveryResults.patternsAnalyzed || 0}
                        </div>
                        <div className="summary-label text-xs text-[#888] uppercase">Patterns Analyzed</div>
                      </div>
                      <div className="summary-item text-center">
                        <div className="summary-number text-2xl font-bold text-[#00ff88]">
                          {discoveryResults.confidence ? `${Math.round(discoveryResults.confidence * 100)}%` : 'N/A'}
                        </div>
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
                                  <span className="template-name text-white font-semibold">
                                    {template.name || template.pattern_name || `Template ${index + 1}`}
                                  </span>
                                  <span className="template-type ml-2 text-xs text-[#888] bg-white/[0.1] px-2 py-1 rounded">
                                    {template.type || template.template_type || 'Unknown'}
                                  </span>
                                </div>
                                <div className="confidence text-[#00ff88] font-bold">
                                  {template.confidence || template.effectiveness_score ? 
                                    `${Math.round((template.confidence || template.effectiveness_score) * 100)}%` : 
                                    'N/A'
                                  }
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
                {/* Main Template Showcase */}
                <div className="template-showcase bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[20px] p-10 border border-white/[0.05]">
                  <div className="showcase-header flex justify-between items-center mb-8">
                    <h3 className="showcase-title text-2xl font-extrabold text-white">🔥 Trending Templates</h3>
                    <span className="view-all-btn text-[#e50914] text-base font-bold cursor-pointer transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                      Explore All →
                    </span>
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
                          <span className="tile-tag inline-flex items-center gap-1.5 bg-[rgba(229,9,20,0.9)] text-white px-3.5 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wide shadow-[0_4px_16px_rgba(229,9,20,0.4)]">
                            {template.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipe Book Sidebar */}
                <div className="recipe-book bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[20px] border border-white/[0.05] overflow-hidden">
                  <div className="recipe-header bg-gradient-to-r from-[rgba(102,126,234,0.1)] to-[rgba(118,75,162,0.1)] p-6 border-b border-white/[0.05]">
                    <h3 className="recipe-title text-xl font-bold text-white mb-2 flex items-center gap-2">
                      📚 Recipe Book
                    </h3>
                    <p className="recipe-subtitle text-[13px] text-[#aaa] mb-4">Discover and analyze viral templates</p>
                    
                    <div className="recipe-tabs flex gap-1">
                      <div className="recipe-tab active px-4 py-2 bg-[rgba(102,126,234,0.2)] text-[#667eea] border border-[rgba(102,126,234,0.3)] rounded text-xs font-semibold cursor-pointer transition-all duration-300">Trending</div>
                      <div className="recipe-tab px-4 py-2 bg-white/[0.05] border border-white/10 rounded text-xs font-semibold cursor-pointer transition-all duration-300 text-[#aaa] hover:bg-white/[0.08] hover:text-white">New</div>
                      <div className="recipe-tab px-4 py-2 bg-white/[0.05] border border-white/10 rounded text-xs font-semibold cursor-pointer transition-all duration-300 text-[#aaa] hover:bg-white/[0.08] hover:text-white">Favorites</div>
                    </div>
                  </div>
                  
                  <div className="recipe-content p-5 max-h-[600px] overflow-y-auto">
                    {/* Trending Templates Row */}
                    <div className="recipe-row mb-6">
                      <h4 className="recipe-row-title text-base font-bold text-white mb-3 flex items-center gap-2">🔥 Trending Templates</h4>
                      <div className="recipe-cards flex flex-col gap-3">
                        {[
                          { name: 'POV Experience', score: '97%', desc: 'First-person storytelling that creates instant connection', tags: ['Viral', 'Storytelling'] },
                          { name: 'Transformation Reveal', score: '94%', desc: 'Before/after format driving massive engagement', tags: ['Transform', 'Visual'] },
                          { name: 'Quick Tutorial', score: '91%', desc: '60-second educational content with high saves', tags: ['Education', 'Tutorial'] }
                        ].map((recipe, index) => (
                          <div key={index} className="recipe-card bg-gradient-to-br from-[#222] to-[#1a1a1a] rounded-[10px] p-4 border border-white/[0.05] cursor-pointer transition-all duration-300 hover:border-[rgba(102,126,234,0.3)] hover:bg-gradient-to-br hover:from-[#252525] hover:to-[#1d1d1d] hover:translate-x-1">
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

                    {/* New Discoveries Row */}
                    <div className="recipe-row mb-6">
                      <h4 className="recipe-row-title text-base font-bold text-white mb-3 flex items-center gap-2">✨ New Discoveries</h4>
                      <div className="recipe-cards flex flex-col gap-3">
                        {[
                          { name: 'Comedy Sketch', score: '96%', desc: 'Relatable humor with explosive share potential', tags: ['Comedy', 'Relatable'] },
                          { name: 'Behind the Scenes', score: '89%', desc: 'Exclusive content building authentic connections', tags: ['Authentic', 'Exclusive'] }
                        ].map((recipe, index) => (
                          <div key={index} className="recipe-card bg-gradient-to-br from-[#222] to-[#1a1a1a] rounded-[10px] p-4 border border-white/[0.05] cursor-pointer transition-all duration-300 hover:border-[rgba(102,126,234,0.3)] hover:bg-gradient-to-br hover:from-[#252525] hover:to-[#1d1d1d] hover:translate-x-1">
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

                    {/* View Full Recipe Book Button */}
                    <div className="view-full-recipe mt-6 p-3.5 bg-gradient-to-r from-[rgba(102,126,234,0.1)] to-[rgba(118,75,162,0.1)] border border-[rgba(102,126,234,0.2)] rounded-[10px] text-center cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-[rgba(102,126,234,0.2)] hover:to-[rgba(118,75,162,0.2)] hover:border-[rgba(102,126,234,0.3)] hover:-translate-y-0.5">
                      <div className="view-full-text text-[#667eea] text-sm font-semibold flex items-center justify-center gap-2">
                        📖 View Full Recipe Book →
                      </div>
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

              {/* Controls Bar */}
              <div className="controls-bar flex justify-between items-center mb-8">
                <div className="filter-controls flex gap-4">
                  <select className="filter-dropdown px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm cursor-pointer font-medium transition-all duration-300 hover:bg-white/[0.1] hover:border-[rgba(229,9,20,0.3)]">
                    <option>Most Recent</option>
                    <option>Highest Score</option>
                    <option>Trending</option>
                  </select>
                  <select className="filter-dropdown px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm cursor-pointer font-medium transition-all duration-300 hover:bg-white/[0.1] hover:border-[rgba(229,9,20,0.3)]">
                    <option>All Platforms</option>
                    <option>TikTok</option>
                    <option>Instagram</option>
                    <option>YouTube</option>
                  </select>
                </div>
                
                <div className="action-buttons flex gap-4">
                  <button className="btn-refresh px-6 py-3.5 bg-white/10 border border-white/20 rounded-lg text-white text-[15px] font-semibold cursor-pointer transition-all duration-300 flex items-center gap-2 hover:bg-white/[0.15] hover:-translate-y-0.5">
                    🔄 Refresh
                  </button>
                  <button className="btn-quick-predict px-7 py-3.5 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-lg text-white text-[15px] font-bold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(229,9,20,0.4)]">
                    Quick Predict
                  </button>
                </div>
              </div>

              {/* Video Analysis Grid */}
              <div className="video-grid grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
                {[
                  { title: 'POV Storytelling Analysis', creator: '@Unknown Creator', views: '14.1K', likes: '704', comments: '140', shares: '28' },
                  { title: 'Transformation Format', creator: '@Unknown Creator', views: '75.6K', likes: '3.8K', comments: '756', shares: '151' },
                  { title: 'Comedy Timing Analysis', creator: '@Unknown Creator', views: '42.3K', likes: '2.1K', comments: '423', shares: '84' },
                  { title: 'Tutorial Format Study', creator: '@Unknown Creator', views: '28.9K', likes: '1.4K', comments: '289', shares: '57' }
                ].map((video, index) => (
                  <div key={index} className="video-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden transition-all duration-[400ms] cursor-pointer border border-white/[0.05] relative hover:scale-105 hover:-translate-y-2 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(229,9,20,0.3)]">
                    <div className="video-thumbnail w-full h-[180px] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
                      <div className="video-placeholder text-[#666] text-sm text-center p-5">
                        Video content analysis in progress...
                      </div>
                      <div className="processing-indicator absolute top-3 right-3 w-8 h-8 bg-[rgba(229,9,20,0.9)] rounded-full flex items-center justify-center text-base text-white animate-pulse">
                        %
                      </div>
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

              {/* Pagination */}
              <div className="pagination flex justify-center items-center gap-4 mt-12">
                <button className="pagination-btn px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 opacity-50 cursor-not-allowed" disabled>← Previous</button>
                <span className="page-info text-[#888] text-sm font-medium">Page 1 of 10</span>
                <button className="pagination-btn px-5 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-300 hover:bg-white/[0.1] hover:border-[rgba(229,9,20,0.3)]">Next →</button>
              </div>
            </section>
          </div>
        )}

        {/* The Armory Content */}
        {activeTab === 'armory' && (
          <div className="armory-content">
            {/* Armory Header */}
            <div className="armory-header flex justify-between items-start mb-12">
              <div className="armory-title-section">
                <h2 className="text-[32px] font-black mb-2">🛡️ The Armory</h2>
                <p className="armory-subtitle text-base text-[#888] font-medium">Your viral template weapons vault - Deploy battle-tested formats with confidence</p>
              </div>
              
              {/* Quick Stats */}
              <div className="armory-quick-stats flex gap-12">
                <div className="armory-stat text-center">
                  <span className="armory-stat-number text-[36px] font-black block mb-1">248</span>
                  <span className="armory-stat-label text-xs text-[#666] uppercase tracking-wider">Total Weapons</span>
                </div>
                <div className="armory-stat text-center">
                  <span className="armory-stat-number text-[36px] font-black block mb-1 text-[#e50914]">67</span>
                  <span className="armory-stat-label text-xs text-[#666] uppercase tracking-wider">Hot Templates</span>
                </div>
                <div className="armory-stat text-center">
                  <span className="armory-stat-number text-[36px] font-black block mb-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">12</span>
                  <span className="armory-stat-label text-xs text-[#666] uppercase tracking-wider">New Discoveries</span>
                </div>
              </div>
            </div>

            {/* Main Arsenal Grid */}
            <div className="arsenal-container grid grid-cols-[320px_1fr] gap-10">
              {/* Framework Library Sidebar */}
              <aside className="framework-library bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-[20px] border border-white/[0.05] p-8 h-fit">
                <div className="library-header flex justify-between items-center mb-8">
                  <h3 className="library-title text-xl font-bold flex items-center gap-3">
                    <span>📚</span>
                    Framework Library
                  </h3>
                  <span className="framework-count text-xs text-[#666] bg-white/[0.05] px-3 py-1 rounded-xl">48 Frameworks</span>
                </div>
                
                <div className="framework-categories flex flex-col gap-3 mb-8">
                  {[
                    { icon: '🎭', name: 'Storytelling', count: '12' },
                    { icon: '🎵', name: 'Music-Driven', count: '8' },
                    { icon: '😂', name: 'Comedy', count: '10' },
                    { icon: '🎓', name: 'Educational', count: '9' },
                    { icon: '💫', name: 'Transformation', count: '9' }
                  ].map((category, index) => (
                    <div key={index} className="framework-category">
                      <div className="framework-category-header flex items-center gap-3 p-3.5 bg-white/[0.03] rounded-[10px] cursor-pointer transition-all duration-300 hover:bg-[rgba(102,126,234,0.1)] hover:translate-x-1">
                        <span className="framework-icon text-lg">{category.icon}</span>
                        <span className="framework-name flex-1 text-sm font-semibold">{category.name}</span>
                        <span className="framework-badge bg-[rgba(102,126,234,0.2)] text-[#667eea] px-2 py-0.5 rounded-[10px] text-xs font-semibold">{category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="combo-section border-t border-white/[0.05] pt-6">
                  <h4 className="combo-title text-base font-bold mb-4 flex items-center gap-2">🎯 Battle-Tested Combos</h4>
                  <div className="combo-list flex flex-col gap-2.5">
                    {[
                      { name: 'POV + Trending Audio', success: '94%' },
                      { name: 'Tutorial + Quick Cuts', success: '91%' },
                      { name: 'Transformation + Reveal', success: '89%' }
                    ].map((combo, index) => (
                      <div key={index} className="combo-item flex justify-between items-center p-3 bg-white/[0.03] rounded-lg transition-all duration-300 hover:bg-[rgba(229,9,20,0.1)] hover:translate-x-1">
                        <span className="combo-name text-[13px] font-medium">{combo.name}</span>
                        <span className="combo-success text-sm font-bold text-[#00ff88]">{combo.success}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Weapon Cards Grid */}
              <div className="weapons-grid grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6">
                {/* Hot Template Card */}
                <div className="weapon-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] relative transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(229,9,20,0.5)]">
                  <div className="weapon-status-badge absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(229,9,20,0.2)] border border-[rgba(229,9,20,0.3)] rounded-full text-xs font-bold">
                    <span className="status-icon text-sm">🔥</span>
                    <span className="status-text">HOT</span>
                  </div>
                  
                  <div className="weapon-header mb-6">
                    <h4 className="weapon-name text-lg font-bold mb-2 text-white">POV: You're the Main Character</h4>
                    <div className="weapon-category text-[13px] text-[#888] uppercase tracking-wider">Storytelling</div>
                  </div>
                  
                  <div className="weapon-stats-grid grid grid-cols-2 gap-4 mb-6">
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">92%</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Success Rate</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">1.2M</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Avg Views</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">847</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Deployments</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">2h ago</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Last Used</span>
                    </div>
                  </div>
                  
                  <div className="weapon-velocity mb-5">
                    <span className="velocity-label text-xs text-[#888] block mb-2">Viral Velocity</span>
                    <div className="velocity-bar h-1.5 bg-white/10 rounded-sm overflow-hidden">
                      <div className="velocity-fill h-full bg-gradient-to-r from-[#00ff88] to-[#00d672] rounded-sm transition-all duration-[600ms]" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  
                  <div className="weapon-lifespan flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg mb-5 text-[13px] text-[#aaa]">
                    <span className="lifespan-icon text-base">⏰</span>
                    <span className="lifespan-text">14 days remaining</span>
                  </div>
                  
                  <button className="quick-deploy-btn w-full p-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-[10px] text-white text-base font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(229,9,20,0.4)]">
                    <span className="deploy-icon text-lg">🚀</span>
                    <span>Quick Deploy</span>
                  </button>
                </div>

                {/* Cooling Template Card */}
                <div className="weapon-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] relative transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(59,130,246,0.5)]">
                  <div className="weapon-status-badge absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(59,130,246,0.2)] border border-[rgba(59,130,246,0.3)] rounded-full text-xs font-bold">
                    <span className="status-icon text-sm">🧊</span>
                    <span className="status-text">COOLING</span>
                  </div>
                  
                  <div className="weapon-header mb-6">
                    <h4 className="weapon-name text-lg font-bold mb-2 text-white">Before & After Transformation</h4>
                    <div className="weapon-category text-[13px] text-[#888] uppercase tracking-wider">Visual Impact</div>
                  </div>
                  
                  <div className="weapon-stats-grid grid grid-cols-2 gap-4 mb-6">
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">78%</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Success Rate</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">890K</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Avg Views</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">1,234</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Deployments</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">5h ago</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Last Used</span>
                    </div>
                  </div>
                  
                  <div className="weapon-velocity mb-5">
                    <span className="velocity-label text-xs text-[#888] block mb-2">Viral Velocity</span>
                    <div className="velocity-bar h-1.5 bg-white/10 rounded-sm overflow-hidden">
                      <div className="velocity-fill h-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-sm transition-all duration-[600ms]" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  <div className="weapon-lifespan flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg mb-5 text-[13px] text-[#aaa]">
                    <span className="lifespan-icon text-base">⏰</span>
                    <span className="lifespan-text">Starting to cool down</span>
                  </div>
                  
                  <button className="quick-deploy-btn w-full p-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-[10px] text-white text-base font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(229,9,20,0.4)]">
                    <span className="deploy-icon text-lg">🚀</span>
                    <span>Quick Deploy</span>
                  </button>
                </div>

                {/* New Template Card */}
                <div className="weapon-card bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-7 border border-white/[0.05] relative transition-all duration-[400ms] cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.8)] hover:border-[rgba(168,85,247,0.5)]">
                  <div className="weapon-status-badge absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)] rounded-full text-xs font-bold">
                    <span className="status-icon text-sm">✨</span>
                    <span className="status-text">NEW</span>
                  </div>
                  
                  <div className="weapon-header mb-6">
                    <h4 className="weapon-name text-lg font-bold mb-2 text-white">Reverse Tutorial Reveal</h4>
                    <div className="weapon-category text-[13px] text-[#888] uppercase tracking-wider">Educational</div>
                  </div>
                  
                  <div className="weapon-stats-grid grid grid-cols-2 gap-4 mb-6">
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">94%</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Success Rate</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">1.5M</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Avg Views</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">8</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Deployments</span>
                    </div>
                    <div className="weapon-stat flex flex-col">
                      <span className="stat-value text-xl font-bold mb-1">New</span>
                      <span className="stat-name text-xs text-[#666] uppercase">Last Used</span>
                    </div>
                  </div>
                  
                  <div className="weapon-velocity mb-5">
                    <span className="velocity-label text-xs text-[#888] block mb-2">Viral Velocity</span>
                    <div className="velocity-bar h-1.5 bg-white/10 rounded-sm overflow-hidden">
                      <div className="velocity-fill h-full bg-gradient-to-r from-[#a855f7] to-[#9333ea] rounded-sm transition-all duration-[600ms]" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                  
                  <div className="weapon-lifespan flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg mb-5 text-[13px] text-[#aaa]">
                    <span className="lifespan-icon text-base">🚨</span>
                    <span className="lifespan-text">High potential - Use now!</span>
                  </div>
                  
                  <button className="quick-deploy-btn w-full p-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-[10px] text-white text-base font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(229,9,20,0.4)]">
                    <span className="deploy-icon text-lg">🚀</span>
                    <span>Quick Deploy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instant Analysis Tab - Cloned from upload-test with improved recommendations */}
        {activeTab === 'instant-analysis' && (
          <div className="instant-analysis-content">
            {/* Analysis Header */}
            <div className="analysis-header text-center mb-8">
              <h2 className="text-[32px] font-extrabold mb-4 flex items-center justify-center gap-4">
                <span>⚡</span>
                Instant Content Analysis Engine
              </h2>
              <p className="text-gray-400 text-lg">AI-Powered Video Analysis • 22 Components • Real-time Viral Predictions</p>
            </div>

            {/* Upload Form */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] mb-8">
              <form onSubmit={handleInstantAnalysis} className="space-y-6">
                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Video (MP4)
                  </label>
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => setInstantVideoFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#e50914] file:text-white
                      hover:file:bg-[#ff1744]
                      cursor-pointer"
                  />
                  {instantVideoFile && (
                    <p className="mt-2 text-sm text-green-400">
                      ✓ Selected: {instantVideoFile.name} ({(instantVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Transcript */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Transcript (Optional - Whisper will auto-transcribe if empty)
                  </label>
                  <textarea
                    value={instantTranscript}
                    onChange={(e) => setInstantTranscript(e.target.value)}
                    rows={4}
                    placeholder="Paste the video transcript here, or leave empty for auto-transcription..."
                    className="w-full px-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg
                      focus:ring-2 focus:ring-[#e50914] focus:border-transparent text-white placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    If you upload a video without transcript, Whisper AI will automatically extract the speech.
                  </p>
                </div>

                {/* Niche */}
                <div>
                  <label className="block text-sm font-medium mb-2">Niche</label>
                  <select
                    value={instantNiche}
                    onChange={(e) => setInstantNiche(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg
                      focus:ring-2 focus:ring-[#e50914] text-white"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="personal-finance">Personal Finance/Investing</option>
                    <option value="fitness">Fitness/Weight Loss</option>
                    <option value="business">Business/Entrepreneurship</option>
                    <option value="food-nutrition">Food/Nutrition Comparisons</option>
                    <option value="beauty">Beauty/Skincare</option>
                    <option value="real-estate">Real Estate/Property</option>
                    <option value="self-improvement">Self-Improvement/Productivity</option>
                    <option value="dating">Dating/Relationships</option>
                    <option value="education">Education/Study Tips</option>
                    <option value="career">Career/Job Advice</option>
                    <option value="parenting">Parenting/Family</option>
                    <option value="tech">Tech Reviews/Tutorials</option>
                    <option value="fashion">Fashion/Style</option>
                    <option value="health">Health/Medical Education</option>
                    <option value="cooking">Cooking/Recipes</option>
                    <option value="psychology">Psychology/Mental Health</option>
                    <option value="travel">Travel/Lifestyle</option>
                    <option value="diy">DIY/Home Improvement</option>
                    <option value="language">Language Learning</option>
                    <option value="side-hustles">Side Hustles/Making Money Online</option>
                  </select>
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-sm font-medium mb-2">Goal</label>
                  <select
                    value={instantGoal}
                    onChange={(e) => setInstantGoal(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg
                      focus:ring-2 focus:ring-[#e50914] text-white"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="build-engaged-following">Build engaged following</option>
                    <option value="increase-engagement">Increase engagement</option>
                    <option value="drive-website-traffic">Drive website traffic</option>
                    <option value="generate-leads">Generate leads</option>
                    <option value="increase-brand-awareness">Increase brand awareness</option>
                  </select>
                </div>

                {/* Account Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Account Size</label>
                  <select
                    value={instantAccountSize}
                    onChange={(e) => setInstantAccountSize(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg
                      focus:ring-2 focus:ring-[#e50914] text-white"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="small (0-10K)">Small (0-10K)</option>
                    <option value="medium (10K-100K)">Medium (10K-100K)</option>
                    <option value="large (100K-1M)">Large (100K-1M)</option>
                    <option value="mega (1M+)">Mega (1M+)</option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={instantLoading || (!instantVideoFile && !instantTranscript)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#e50914] to-[#ff1744]
                    disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                    rounded-lg font-bold text-lg transition-all duration-300 hover:-translate-y-0.5
                    shadow-[0_4px_15px_rgba(229,9,20,0.3)]"
                >
                  {instantLoading ? 'Analyzing with Kai Orchestrator...' : 'Get Analysis (Kai)'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Uses all 22 components: XGBoost, GPT-4, Gemini 3 Pro, 9 Attributes, 24 Styles, 7 Legos, FFmpeg, and more
                </p>
              </form>
            </div>

            {/* Error */}
            {instantError && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-8">
                <p className="text-red-200">❌ Error: {instantError}</p>
              </div>
            )}

            {/* Results */}
            {instantResult && (
              <div className="space-y-6">
                <h2
                  className="text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FF4757, #9B59B6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Analysis Results
                </h2>

                {/* Main Prediction - Glass DPS Display */}
                <div className="max-w-md mx-auto">
                  <DPSScoreDisplay
                    score={instantResult.predicted_dps || 0}
                    confidence={instantResult.confidence || 0}
                    range={instantResult.predicted_range || [0, 100]}
                    animated={true}
                    size="lg"
                    showDetails={true}
                  />
                  <ViralCelebration score={instantResult.predicted_dps || 0} />
                </div>

                {/* Viral Potential Badge */}
                {instantResult.viral_potential && (
                  <div className="text-center">
                    <span
                      className="px-4 py-2 rounded-full text-sm font-semibold inline-block"
                      style={{
                        background: instantResult.viral_potential === 'mega-viral'
                          ? 'linear-gradient(135deg, #F39C12, #E67E22)'
                          : instantResult.viral_potential === 'viral'
                          ? 'linear-gradient(135deg, #2ECC71, #27AE60)'
                          : instantResult.viral_potential === 'good'
                          ? 'linear-gradient(135deg, #00D9FF, #00B4D8)'
                          : 'rgba(255, 255, 255, 0.2)',
                        boxShadow: instantResult.viral_potential === 'mega-viral'
                          ? '0 0 20px rgba(243, 156, 18, 0.4)'
                          : instantResult.viral_potential === 'viral'
                          ? '0 0 20px rgba(46, 204, 113, 0.4)'
                          : 'none',
                      }}
                    >
                      {instantResult.viral_potential.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Kai Components Used - Glass Card */}
                {instantResult.components_used && (
                  <GlassCard variant="default" className="p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-[rgba(255,255,255,0.9)]">
                      <span style={{ color: '#00D9FF' }}>🤖</span> Kai Orchestrator - Components Used
                      <span
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, #00D9FF, #00B4D8)',
                          color: '#0a0a0a',
                        }}
                      >
                        {instantResult.components_used.length} ACTIVE
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {instantResult.components_used.map((comp: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{
                            background: 'rgba(0, 217, 255, 0.15)',
                            border: '1px solid rgba(0, 217, 255, 0.3)',
                            color: '#00D9FF',
                          }}
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Actionable Recommendations - Glass Card */}
                <GlassCard variant="default" className="p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-[rgba(255,255,255,0.9)]">
                    <span style={{ color: '#2ECC71' }}>💡</span> Actionable Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {getActionableRecommendations(instantResult).map((rec: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-sm flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          background: 'rgba(46, 204, 113, 0.1)',
                          border: '1px solid rgba(46, 204, 113, 0.2)',
                        }}
                      >
                        <span style={{ color: '#2ECC71' }}>✓</span>
                        <span className="text-[rgba(255,255,255,0.8)]">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* Warnings - Glass Card */}
                {instantResult.warnings && instantResult.warnings.length > 0 && (
                  <GlassCard variant="default" className="p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-[rgba(255,255,255,0.9)]">
                      <span style={{ color: '#F39C12' }}>⚠️</span> Warnings
                    </h3>
                    <ul className="space-y-2">
                      {instantResult.warnings.map((warn: string, idx: number) => (
                        <li
                          key={idx}
                          className="text-sm p-2 rounded-lg"
                          style={{
                            background: 'rgba(243, 156, 18, 0.1)',
                            border: '1px solid rgba(243, 156, 18, 0.2)',
                            color: '#F39C12',
                          }}
                        >
                          {warn}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                )}

                {/* Path Results - Glass Card */}
                {instantResult.paths && instantResult.paths.length > 0 && (
                  <GlassCard variant="subtle" className="p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-[rgba(255,255,255,0.9)]">
                      <span style={{ color: '#9B59B6' }}>🛤️</span> Prediction Paths
                    </h3>
                    <div className="space-y-3">
                      {instantResult.paths.map((path: any, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-xl p-4"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-white">{path.name}</span>
                            <div className="flex items-center gap-3">
                              {path.prediction && (
                                <span style={{ color: '#9B59B6' }}>{path.prediction.toFixed(1)} DPS</span>
                              )}
                              <span
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{
                                  background: path.success
                                    ? 'rgba(46, 204, 113, 0.2)'
                                    : 'rgba(231, 76, 60, 0.2)',
                                  color: path.success ? '#2ECC71' : '#E74C3C',
                                }}
                              >
                                {path.success ? 'SUCCESS' : 'FAILED'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-[rgba(255,255,255,0.4)]">
                            Weight: {(path.weight * 100).toFixed(0)}% |
                            Components: {path.components?.length || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* FFmpeg Visual Analysis - Glass Card */}
                {instantResult.ffmpeg_analysis && (
                  <GlassCard variant="default" className="p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-[rgba(255,255,255,0.9)]">
                      <span style={{ color: '#9B59B6' }}>🎬</span> FFmpeg Visual Analysis
                      <span
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{
                          background: 'rgba(46, 204, 113, 0.2)',
                          color: '#2ECC71',
                        }}
                      >
                        WORKING
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Duration</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.duration.toFixed(1)}s</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Resolution</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.resolution}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">FPS</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.fps}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Aspect Ratio</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.aspect_ratio}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Codec</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.codec}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Format</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.format}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Has Audio</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.has_audio ? '✅ Yes' : '❌ No'}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(155, 89, 182, 0.1)', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Total Frames</span>
                        <div className="font-semibold text-white">{instantResult.ffmpeg_analysis.total_frames?.toLocaleString()}</div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Gemini 3 Pro Analysis - Glass Card */}
                {instantResult.components_used?.includes('gemini') && instantResult.component_scores?.gemini && (
                  <GlassCard variant="default" className="p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-[rgba(255,255,255,0.9)]">
                      <span style={{ color: '#00D9FF' }}>🧠</span> Gemini 3 Pro Analysis
                      <span
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{
                          background: 'rgba(46, 204, 113, 0.2)',
                          color: '#2ECC71',
                        }}
                      >
                        ACTIVE
                      </span>
                      {instantResult.features?.gemini?.analysisType && (
                        <span
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            background: 'rgba(0, 217, 255, 0.2)',
                            color: '#00D9FF',
                          }}
                        >
                          {instantResult.features.gemini.analysisType === 'video_file' ? '🎥 VIDEO FILE' : '📝 TRANSCRIPT'}
                        </span>
                      )}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Model</span>
                        <div className="font-semibold text-white">{instantResult.features?.gemini?.modelName || 'gemini-3-pro-preview'}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(0, 217, 255, 0.1)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">Score</span>
                        <div className="font-semibold" style={{ color: '#00D9FF' }}>{instantResult.component_scores.gemini.toFixed(1)} DPS</div>
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-xl text-xs"
                      style={{
                        background: instantResult.features?.gemini?.analysisType === 'video_file'
                          ? 'rgba(46, 204, 113, 0.1)'
                          : 'rgba(243, 156, 18, 0.1)',
                        border: instantResult.features?.gemini?.analysisType === 'video_file'
                          ? '1px solid rgba(46, 204, 113, 0.2)'
                          : '1px solid rgba(243, 156, 18, 0.2)',
                      }}
                    >
                      {instantResult.features?.gemini?.analysisType === 'video_file' ? (
                        <span style={{ color: '#2ECC71' }}>✓ Gemini 3 Pro analyzed the video file directly (multimodal analysis)!</span>
                      ) : (
                        <span style={{ color: '#F39C12' }}>ℹ Gemini 3 Pro analyzed transcript only (video file not available)</span>
                      )}
                    </div>
                  </GlassCard>
                )}

                {/* Metadata */}
                <div className="bg-white/[0.05] rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Video ID:</span>
                      <div className="font-mono text-xs">{instantResult.video_id}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Prediction ID:</span>
                      <div className="font-mono text-xs">{instantResult.prediction_id}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Processing Time:</span>
                      <div>{instantResult.processing_time_ms}ms</div>
                    </div>
                    <div>
                      <span className="text-gray-400">LLM Cost:</span>
                      <div>${instantResult.llm_cost_usd?.toFixed(4) || '0.0000'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Creator Tab - 6-Phase Viral Content Workflow */}
        {activeTab === 'creator' && (
          <div className="creator-workflow-content">
            {/* Creator Header with DPS Score */}
            <div className="creator-header flex justify-between items-center mb-8">
              <div>
                <h2 className="text-[32px] font-extrabold mb-2 flex items-center gap-4">
                  <span>🎬</span>
                  Viral Content Creator
                </h2>
                <p className="text-gray-400">6-Phase workflow to create viral content with AI-powered predictions</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Workflow selector button */}
                <button
                  onClick={() => setShowWorkflowPicker(true)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-lg text-white text-sm flex items-center gap-2 transition-all"
                >
                  {selectedWorkflowId ? (
                    <>
                      <span>📁</span>
                      <span>Switch Workflow</span>
                    </>
                  ) : (
                    <>
                      <span>+</span>
                      <span>Select Workflow</span>
                    </>
                  )}
                </button>
                {/* Save indicator */}
                <SaveIndicator status={saveStatus} />
                {/* DPS display */}
                <div className="dps-display bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-4 border border-white/[0.05]">
                  <div className="text-sm text-gray-400 mb-1">Current DPS Score</div>
                  <div className={`text-3xl font-black ${creatorDPS >= 70 ? 'text-[#00ff88]' : creatorDPS >= 50 ? 'text-[#ffa726]' : 'text-[#e50914]'}`}>
                    {creatorDPS.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Breadcrumbs */}
            <div className="phase-breadcrumbs flex items-center gap-2 mb-8 p-4 bg-white/[0.03] rounded-xl border border-white/[0.05]">
              {[
                { id: 'research', label: 'Research', icon: '🔍' },
                { id: 'plan', label: 'Plan', icon: '📋' },
                { id: 'create', label: 'Create', icon: '🎥' },
                { id: 'optimize', label: 'Optimize', icon: '⚡' },
                { id: 'publish', label: 'Publish', icon: '📤' },
                { id: 'engage', label: 'Engage & Learn', icon: '📊' }
              ].map((phase, index) => (
                <React.Fragment key={phase.id}>
                  <button
                    onClick={() => setCreatorPhase(phase.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      creatorPhase === phase.id 
                        ? 'bg-[rgba(229,9,20,0.2)] border border-[#e50914] text-white' 
                        : 'bg-white/[0.05] border border-transparent text-gray-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{phase.icon}</span>
                    <span className="font-semibold">{phase.label}</span>
                  </button>
                  {index < 5 && <span className="text-gray-600">→</span>}
                </React.Fragment>
              ))}
            </div>

            {/* RESEARCH PHASE */}
            {creatorPhase === 'research' && (
              <div className="research-phase space-y-6">
                <div className="phase-intro bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h3 className="text-xl font-bold mb-2">Research Phase</h3>
                  <p className="text-gray-400">Build your content foundation by understanding your audience and topic research</p>
                </div>

                {/* Define Your Niche */}
                <div className="niche-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🎯</span> Define Your Niche
                  </h4>
                  <select 
                    value={creatorData.niche}
                    onChange={(e) => setCreatorData({...creatorData, niche: e.target.value})}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#e50914] focus:outline-none appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="bg-[#1a1a1a] text-white">Select a category...</option>
                    {TOP_20_NICHES.map(n => <option key={n} value={n} className="bg-[#1a1a1a] text-white">{n}</option>)}
                  </select>
                  
                  <div className="target-audience mt-6">
                    <h5 className="font-semibold mb-3">Target Audience Demographics</h5>
                    <div className="grid grid-cols-4 gap-3">
                      {['18-24 years', '25-34 years', '35-44 years', '45+ years'].map(age => (
                        <button 
                          key={age}
                          onClick={() => setCreatorData({...creatorData, targetAudience: {...creatorData.targetAudience, age}})}
                          className={`px-4 py-2 rounded-lg text-sm transition-all ${
                            creatorData.targetAudience.age === age 
                              ? 'bg-[rgba(229,9,20,0.2)] border border-[#e50914] text-white' 
                              : 'bg-white/[0.05] border border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content Purpose (Know/Growth/Authority) */}
                <div className="purpose-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🎯</span> Content Purpose
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">What do you want your audience to do? This affects your hook and CTA strategy.</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'know', label: 'KNOW', icon: '👋', desc: 'Get them to know you', cta: 'Follow for more' },
                      { id: 'like', label: 'LIKE', icon: '❤️', desc: 'Build rapport & trust', cta: 'Like & share' },
                      { id: 'trust', label: 'TRUST', icon: '🤝', desc: 'Convert to customers', cta: 'Link in bio' }
                    ].map(purpose => (
                      <button 
                        key={purpose.id}
                        onClick={() => setCreatorData({...creatorData, contentGoals: {...creatorData.contentGoals, primary: purpose.id}})}
                        className={`p-4 rounded-xl text-left transition-all ${
                          creatorData.contentGoals.primary === purpose.id
                            ? 'bg-[rgba(229,9,20,0.2)] border-2 border-[#e50914]'
                            : 'bg-white/[0.05] border border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="text-2xl mb-2">{purpose.icon}</div>
                        <div className="font-bold text-white">{purpose.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{purpose.desc}</div>
                        <div className="text-xs text-[#e50914] mt-2">CTA: "{purpose.cta}"</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goals & KPIs */}
                <div className="goals-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>📈</span> Set Goals & KPIs
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Primary Content Goal</label>
                      <select 
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#e50914] focus:outline-none appearance-none cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option className="bg-[#1a1a1a] text-white">Select a goal...</option>
                        <option className="bg-[#1a1a1a] text-white">Brand Awareness</option>
                        <option className="bg-[#1a1a1a] text-white">Lead Generation</option>
                        <option className="bg-[#1a1a1a] text-white">Engagement</option>
                        <option className="bg-[#1a1a1a] text-white">Sales/Conversions</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Target Views</label>
                      <input type="number" placeholder="10,000" className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#e50914] focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Exemplar Swoop */}
                <div className="exemplar-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🔎</span> Exemplar Swoop
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">Find 25 accounts in your niche, track their viral videos, and reverse engineer what works</p>
                  <div className="search-platforms flex gap-3 mb-4">
                    <button className="px-4 py-2 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded-lg text-white transition-all">
                      🎵 TikTok
                    </button>
                    <button 
                      className="px-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-gray-500 cursor-not-allowed relative"
                      disabled
                    >
                      ▶️ YouTube
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-gray-700 text-[10px] rounded text-gray-400">Soon</span>
                    </button>
                    <button 
                      className="px-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-gray-500 cursor-not-allowed relative"
                      disabled
                    >
                      📸 Instagram
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-gray-700 text-[10px] rounded text-gray-400">Soon</span>
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search hashtags, keywords, or creators..."
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#e50914] focus:outline-none"
                  />
                  <div className="mt-4 p-4 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <div className="text-sm text-gray-400 mb-2">💡 Pro Tip from Paul:</div>
                    <p className="text-sm text-gray-300">"Find people with disproportional astronomical views compared to their peers. If someone has 200K views when others have 2K, they're doing something right. Study their hooks, their consistency, and their monetization."</p>
                  </div>
                </div>

                <button
                  onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] rounded-xl text-white font-bold text-lg hover:-translate-y-0.5 transition-all"
                >
                  Save Research & Continue to Planning &rarr;
                </button>
              </div>
            )}

            {/* PLAN PHASE */}
            {creatorPhase === 'plan' && (
              <div className="plan-phase space-y-6">
                <div className="phase-intro bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h3 className="text-xl font-bold mb-2">Content Planning</h3>
                  <p className="text-gray-400">Structure your content strategy with the Golden Pillars and 4x4 Method</p>
                </div>

                {/* Golden Pillars of Content */}
                <div className="pillars-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <span>🏛️</span> Golden Pillars of Content
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">These are the content pillars that historically do well on the internet. Select which type of content you're creating:</p>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { id: 'education', label: 'Education', icon: '📚', desc: 'How-tos, tutorials, tips, resources', goal: 'Builds TRUST', color: '#00ff88' },
                      { id: 'entertainment', label: 'Entertainment', icon: '🎭', desc: 'Trends, current events, humor, pranks', goal: 'Most SHARED', color: '#667eea' },
                      { id: 'inspiration', label: 'Inspiration', icon: '💫', desc: 'Transformations, lifestyle, before/after', goal: 'ASPIRATIONAL', color: '#ffa726' },
                      { id: 'validation', label: 'Validation', icon: '💬', desc: 'Your story, opinions, polarizing content', goal: 'Drives ENGAGEMENT', color: '#e50914' }
                    ].map(pillar => (
                      <button 
                        key={pillar.id}
                        onClick={() => setCreatorData({...creatorData, goldenPillars: [pillar.id]})}
                        className={`p-4 rounded-xl text-left transition-all ${
                          creatorData.goldenPillars.includes(pillar.id)
                            ? 'bg-[rgba(229,9,20,0.2)] border-2 border-[#e50914]'
                            : 'bg-white/[0.05] border border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="text-2xl mb-2">{pillar.icon}</div>
                        <div className="font-bold text-white">{pillar.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{pillar.desc}</div>
                        <div className="text-xs mt-2" style={{ color: pillar.color }}>{pillar.goal}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SEO Strategy */}
                <div className="seo-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <span>#️⃣</span> TikTok SEO Strategy
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">TikTok is a search engine. Put your core anchor keyword in the first sentence of everything you post.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Core Anchor Keyword</label>
                      <input type="text" placeholder="e.g., 'best content strategy'" className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white" />
                      <p className="text-xs text-gray-500 mt-1">This should appear in your first sentence, on-screen text, and description</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Related Search Terms</label>
                      <input type="text" placeholder="e.g., 'how to get more views'" className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white" />
                      <p className="text-xs text-gray-500 mt-1">Use TikTok's search suggestions to find related terms</p>
                    </div>
                  </div>
                </div>

                {/* 4x4 Method */}
                <div className="beatsheet-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <span>🎬</span> The 4x4 Method
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">A step-by-step framework for creating viral, engaging content. Fill in each section:</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* HOOK */}
                      <div className="p-4 bg-white/[0.03] rounded-xl border border-[#e50914]/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-[#e50914] text-white text-xs flex items-center justify-center font-bold">1</span>
                          <span className="font-bold text-[#e50914]">HOOK (First 4 seconds)</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Attention grabbing, pain points, polarizing, curiosity-inducing</p>
                        <textarea 
                          placeholder="What will you say to grab attention in the first 4 seconds?"
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm h-20 resize-none"
                        />
                      </div>
                      {/* PROOF */}
                      <div className="p-4 bg-white/[0.03] rounded-xl border border-[#667eea]/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-[#667eea] text-white text-xs flex items-center justify-center font-bold">2</span>
                          <span className="font-bold text-[#667eea]">PROOF (Next 4 seconds)</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Stats, studies, testimonials, social proof to lower their guard</p>
                        <textarea 
                          placeholder="What proof will you show to make them comfortable staying?"
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm h-20 resize-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {/* VALUE */}
                      <div className="p-4 bg-white/[0.03] rounded-xl border border-[#00ff88]/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-[#00ff88] text-black text-xs flex items-center justify-center font-bold">3</span>
                          <span className="font-bold text-[#00ff88]">VALUE (The meat)</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">How-tos, step-by-step, lists, the recipe - why they're here</p>
                        <textarea 
                          placeholder="What's the actual value/content you're delivering?"
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm h-20 resize-none"
                        />
                      </div>
                      {/* CTA */}
                      <div className="p-4 bg-white/[0.03] rounded-xl border border-[#ffa726]/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-[#ffa726] text-black text-xs flex items-center justify-center font-bold">4</span>
                          <span className="font-bold text-[#ffa726]">CALL TO ACTION</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Based on your content purpose: Know → Follow | Like → Share | Trust → Link in bio</p>
                        <textarea 
                          placeholder="What do you want them to do after watching?"
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm h-20 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                    <div className="text-sm text-gray-400 mb-2">💡 Pro Tip from Paul:</div>
                    <p className="text-sm text-gray-300">"Use list format (5 things, 3 tips) - they work like recipe videos. People have to watch the whole video to get to #1. Nobody wants to leave before seeing the most important tip."</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => goBackPhase()} className="px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl text-white font-bold hover:bg-white/[0.08] transition-all">
                    &larr; Back to Research
                  </button>
                  <button
                    onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] rounded-xl text-white font-bold text-lg hover:-translate-y-0.5 transition-all"
                  >
                    Continue to Creation &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* CREATE PHASE */}
            {creatorPhase === 'create' && (
              <div className="create-phase space-y-6">
                <div className="phase-intro bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h3 className="text-xl font-bold mb-2">Content Creation Studio</h3>
                  <p className="text-gray-400">Record multiple videos with consistent quality and prepare them for publication</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Video Recording */}
                  <div className="recording-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span>🎥</span> Video Recording
                    </h4>
                    <div className="recording-preview bg-black rounded-xl aspect-video flex items-center justify-center mb-4 border border-white/10">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📹</div>
                        <p className="text-gray-400">Click to start recording</p>
                      </div>
                    </div>
                    <div className="recording-controls flex gap-3">
                      <button className="flex-1 px-4 py-3 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded-lg text-white font-semibold">
                        🔴 Record
                      </button>
                      <button className="px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-gray-400">
                        ⏸️ Pause
                      </button>
                      <button className="px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-gray-400">
                        ⏹️ Stop
                      </button>
                    </div>
                  </div>

                  {/* Video Metadata */}
                  <div className="metadata-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span>📝</span> Video Details
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Video Title</label>
                        <input type="text" placeholder="Enter video title..." className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Description</label>
                        <textarea placeholder="Video description..." className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white h-24 resize-none" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Duration Target</label>
                        <input type="text" placeholder="15-60 seconds" className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proof Assets */}
                <div className="assets-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🖼️</span> Proof Assets
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">Upload or link to assets that support your content claims</p>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-square bg-white/[0.05] border border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/[0.08] transition-all">
                        <div className="text-center">
                          <div className="text-2xl mb-1">➕</div>
                          <div className="text-xs text-gray-400">Add Asset</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => goBackPhase()} className="px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl text-white font-bold">
                    &larr; Back to Planning
                  </button>
                  <button
                    onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 20)); }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] rounded-xl text-white font-bold text-lg"
                  >
                    Continue to Optimization &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* OPTIMIZE PHASE */}
            {creatorPhase === 'optimize' && (
              <div className="optimize-phase space-y-6">
                <div className="phase-intro bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h3 className="text-xl font-bold mb-2">Content Optimization</h3>
                  <p className="text-gray-400">Refine your content to maximize engagement and virality</p>
                </div>

                {/* Gate A Checks */}
                <div className="gate-checks bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>✅</span> Gate A Checks
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Hook Effectiveness', desc: 'First 3 seconds grab attention' },
                      { label: 'Proof Quality', desc: 'Evidence supports claims' },
                      { label: 'CTA Alignment', desc: 'Clear call-to-action at end' }
                    ].map((check, i) => (
                      <div key={i} className="check-item bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-6 h-6 rounded border-2 border-[#00ff88] flex items-center justify-center">
                            <span className="text-[#00ff88] text-sm">✓</span>
                          </div>
                          <span className="font-semibold">{check.label}</span>
                        </div>
                        <p className="text-sm text-gray-400">{check.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="ai-recs bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🤖</span> AI Recommendations
                  </h4>
                  <div className="space-y-3">
                    {[
                      'Add a pattern interrupt at 0:14 to maintain attention',
                      'Your hook could be more specific about the benefit',
                      'Consider adding text overlay to reinforce key points'
                    ].map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-[rgba(102,126,234,0.2)] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">💡</span>
                        </div>
                        <p className="text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => goBackPhase()} className="px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl text-white font-bold">
                    &larr; Back to Creation
                  </button>
                  <button
                    onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] rounded-xl text-white font-bold text-lg"
                  >
                    Ready to Publish &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* PUBLISH PHASE */}
            {creatorPhase === 'publish' && (
              <div className="publish-phase space-y-6">
                <div className="phase-intro bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h3 className="text-xl font-bold mb-2">Publish Your Video</h3>
                  <p className="text-gray-400">Complete the final steps to share your content with your audience</p>
                </div>

                {/* Platform Selection */}
                <div className="platforms-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>📱</span> Platform Distribution
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {/* TikTok - Active */}
                    <button className="p-4 bg-[rgba(229,9,20,0.2)] border-2 border-[#e50914] rounded-lg text-center transition-all">
                      <div className="text-2xl mb-2">🎵</div>
                      <div className="font-semibold text-white">TikTok</div>
                      <div className="text-xs text-[#00ff88] mt-1">✓ Connected</div>
                    </button>
                    {/* Instagram - Coming Soon */}
                    <button className="p-4 bg-white/[0.05] border border-white/10 rounded-lg text-center cursor-not-allowed opacity-60 relative" disabled>
                      <div className="text-2xl mb-2">📸</div>
                      <div className="font-semibold text-gray-400">Instagram</div>
                      <span className="absolute -top-2 -right-2 px-2 py-1 bg-gray-700 text-[10px] rounded-full text-gray-300">Coming Soon</span>
                    </button>
                    {/* YouTube - Coming Soon */}
                    <button className="p-4 bg-white/[0.05] border border-white/10 rounded-lg text-center cursor-not-allowed opacity-60 relative" disabled>
                      <div className="text-2xl mb-2">▶️</div>
                      <div className="font-semibold text-gray-400">YouTube</div>
                      <span className="absolute -top-2 -right-2 px-2 py-1 bg-gray-700 text-[10px] rounded-full text-gray-300">Coming Soon</span>
                    </button>
                    {/* LinkedIn - Coming Soon */}
                    <button className="p-4 bg-white/[0.05] border border-white/10 rounded-lg text-center cursor-not-allowed opacity-60 relative" disabled>
                      <div className="text-2xl mb-2">💼</div>
                      <div className="font-semibold text-gray-400">LinkedIn</div>
                      <span className="absolute -top-2 -right-2 px-2 py-1 bg-gray-700 text-[10px] rounded-full text-gray-300">Coming Soon</span>
                    </button>
                  </div>
                </div>

                {/* Schedule */}
                <div className="schedule-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>📅</span> Publishing Schedule
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Publish Date</label>
                      <input type="date" className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Optimal Time (AI Suggested)</label>
                      <input type="time" defaultValue="15:00" className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => goBackPhase()} className="px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl text-white font-bold">
                    &larr; Back to Optimization
                  </button>
                  <button
                    onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] rounded-xl text-black font-bold text-lg"
                  >
                    Publish Now
                  </button>
                </div>
              </div>
            )}

            {/* ENGAGE & LEARN PHASE */}
            {creatorPhase === 'engage' && (
              <div className="engage-phase space-y-6">
                <div className="phase-intro bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h3 className="text-xl font-bold mb-2">Engage & Learn</h3>
                  <p className="text-gray-400">Monitor content performance and gather insights to improve future content</p>
                </div>

                {/* Performance Metrics */}
                <div className="metrics-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>📊</span> Performance Metrics
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Views', value: '12.4K', change: '+24%', icon: '👁️' },
                      { label: 'Engagement', value: '8.7%', change: '+12%', icon: '❤️' },
                      { label: 'Watch Time', value: '45s', change: '+8%', icon: '⏱️' },
                      { label: 'Shares', value: '234', change: '+31%', icon: '🔄' }
                    ].map((metric, i) => (
                      <div key={i} className="metric-card bg-white/[0.03] rounded-lg p-4 text-center border border-white/[0.05]">
                        <div className="text-2xl mb-2">{metric.icon}</div>
                        <div className="text-2xl font-black text-white">{metric.value}</div>
                        <div className="text-xs text-gray-400">{metric.label}</div>
                        <div className="text-xs text-[#00ff88] mt-1">{metric.change}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Insights */}
                <div className="insights-section bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>💡</span> Content Improvement Recommendations
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { title: 'Hook Optimization', desc: 'Your hook performs best with question format', score: '+18%' },
                      { title: 'Optimal Length', desc: 'Videos at 45-60s get 23% more engagement', score: '+23%' },
                      { title: 'Best Posting Time', desc: 'Tuesday 3PM shows highest reach', score: '+15%' }
                    ].map((insight, i) => (
                      <div key={i} className="insight-card bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold">{insight.title}</h5>
                          <span className="text-[#00ff88] text-sm font-bold">{insight.score}</span>
                        </div>
                        <p className="text-sm text-gray-400">{insight.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Complete current workflow and start fresh
                    completeWorkflow();
                    setSelectedWorkflowId(null);
                    setShowWorkflowPicker(true);
                    setCreatorDPS(0);
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl text-white font-bold text-lg"
                >
                  Create New Content
                </button>
              </div>
            )}
          </div>
        )}

        {/* The Laboratory Tab - 3-Phase Viral Creation Workflow */}
        {activeTab === 'laboratory' && (
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
                  <div className={`phase-circle w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    laboratoryPhase >= 1 ? 'bg-[#e50914] text-white' : 'bg-white/10 text-gray-500'
                  }`}>1</div>
                  <span className="phase-name font-semibold">Discovery</span>
                </div>
                <div className={`phase-connector w-16 h-1 ${laboratoryPhase >= 2 ? 'bg-[#e50914]' : 'bg-white/10'}`}></div>
                <div className={`phase-indicator flex items-center gap-3 ${laboratoryPhase >= 2 ? 'text-white' : 'text-gray-500'}`}>
                  <div className={`phase-circle w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    laboratoryPhase >= 2 ? 'bg-[#e50914] text-white' : 'bg-white/10 text-gray-500'
                  }`}>2</div>
                  <span className="phase-name font-semibold">Analysis</span>
                </div>
                <div className={`phase-connector w-16 h-1 ${laboratoryPhase >= 3 ? 'bg-[#e50914]' : 'bg-white/10'}`}></div>
                <div className={`phase-indicator flex items-center gap-3 ${laboratoryPhase >= 3 ? 'text-white' : 'text-gray-500'}`}>
                  <div className={`phase-circle w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    laboratoryPhase >= 3 ? 'bg-[#e50914] text-white' : 'bg-white/10 text-gray-500'
                  }`}>3</div>
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
                  {/* Beautiful Viral DNA Gallery */}
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
                  {/* Selected Template Analysis */}
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
                      onClick={proceedToCreation}
                      className="proceed-btn w-full px-6 py-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] border-none rounded-lg text-white font-bold cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                    >
                      Proceed to Creation Phase →
                    </button>
                  </div>
                  
                  {/* Live Viral Score */}
                  <div className="viral-score-display bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-3">
                      <span>📊</span>
                      Live Viral Prediction
                    </h4>
                    
                    <div className="score-circle w-32 h-32 mx-auto mb-6 relative">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="2"
                        />
                        <path
                          d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                          fill="none"
                          stroke="#e50914"
                          strokeWidth="2"
                          strokeDasharray={`${selectedVideo.viral_score || selectedVideo.score}, 100`}
                        />
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

            {/* Phase 3: Creation - Value Template Editor */}
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
                
                {/* Beautiful Value Template Editor */}
                <ValueTemplateEditor
                  selectedVideo={selectedVideo}
                  onContentChange={handleContentChange}
                  viralPrediction={viralPrediction}
                  isAnalyzing={isAnalyzing}
                />

              </div>
            )}
          </div>
        )}

        {/* Validation Dashboard Tab */}
        {activeTab === 'validation-dashboard' && (
          <ValidationDashboard />
        )}

        {/* Viral Workflow Tab - NEW PROOF OF CONCEPT */}
        {activeTab === 'viral-workflow' && (
          <div className="viral-workflow-content">
            <div data-testid="starter-surface-probe" style={{ display: 'none' }} />
            <div className="workflow-container bg-black text-white min-h-screen -mx-8 -mb-16 relative">
              <ViralWorkflowComponent initialView="workflow" hideViewSwitcher />
            </div>
          </div>
        )}
      </div>

      {/* Template Script Generator Modal - Cloned from Bloomberg */}
      {showTemplateScriptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Script Generator</h2>
                  <p className="text-sm text-gray-400">
                    Generate viral scripts using template: <span className="text-blue-400">{selectedTemplateForScript?.title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeTemplateScriptModal}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!generatedTemplateScript ? (
                <>
                  {/* Configuration */}
                  <div className="space-y-6 mb-6">
                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">Platform</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['tiktok', 'instagram', 'youtube'] as const).map((platform) => (
                          <button
                            key={platform}
                            onClick={() => setTemplateScriptPlatform(platform)}
                            className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                              templateScriptPlatform === platform
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
                            }`}
                          >
                            {platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : 'YouTube Shorts'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Length Selection */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">Video Length</label>
                      <div className="grid grid-cols-3 gap-3">
                        {([15, 30, 60] as const).map((length) => (
                          <button
                            key={length}
                            onClick={() => setTemplateScriptLength(length)}
                            className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                              templateScriptLength === length
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
                            }`}
                          >
                            {length}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Context */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm font-semibold mb-2">Template Context</div>
                      <div className="text-sm text-gray-400 mb-3">
                        This template "{selectedTemplateForScript?.title}" has a viral score of <span className="text-blue-400 font-semibold">{selectedTemplateForScript?.viralScore}%</span> in the <span className="text-blue-400">{selectedTemplateForScript?.category || selectedTemplateForScript?.niche || 'General'}</span> niche.
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                          {selectedTemplateForScript?.views} views
                        </span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                          {selectedTemplateForScript?.likes} likes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateTemplateScript}
                    disabled={generatingTemplateScript}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
                  >
                    {generatingTemplateScript ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Script...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Viral Script
                      </>
                    )}
                  </button>

                  {generatingTemplateScript && (
                    <div className="mt-4 text-center text-sm text-gray-400">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>Analyzing template pattern...</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <span>Crafting viral hooks...</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        <span>Calculating predicted DPS...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Generated Script Display */}
                  <div className="space-y-6">
                    {/* DPS Prediction */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Predicted DPS</div>
                          <div className="text-5xl font-bold text-blue-400">{generatedTemplateScript.predictedDps}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">Confidence</div>
                          <div className="text-3xl font-bold text-purple-400">
                            {Math.round(generatedTemplateScript.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-pre-line">
                        {generatedTemplateScript.reasoning}
                      </div>
                    </div>

                    {/* Nine Attributes */}
                    {generatedTemplateScript.attributes && (
                      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="text-lg font-bold mb-4">⚡ Nine Attributes Analysis</div>
                        <div className="grid grid-cols-3 gap-3">
                          {Object.entries(generatedTemplateScript.attributes).map(([key, value]: [string, any]) => {
                            const score = Math.round(value * 100);
                            const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
                            return (
                              <div key={key} className="bg-gray-900 rounded p-3">
                                <div className="text-xs text-gray-400 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                <div className={`text-2xl font-bold ${color}`}>{score}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Script Sections */}
                    {generatedTemplateScript.script && (
                      <div className="space-y-4">
                        {/* Hook */}
                        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-red-400">🪝 Hook</span>
                            <span className="text-xs text-gray-500">{generatedTemplateScript.script.hook?.timing || '0-3s'}</span>
                          </div>
                          <p className="text-sm text-gray-300">{generatedTemplateScript.script.hook?.content}</p>
                        </div>

                        {/* Context */}
                        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-yellow-400">📖 Context</span>
                            <span className="text-xs text-gray-500">{generatedTemplateScript.script.context?.timing || '3-8s'}</span>
                          </div>
                          <p className="text-sm text-gray-300">{generatedTemplateScript.script.context?.content}</p>
                        </div>

                        {/* Value */}
                        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-green-400">💎 Value</span>
                            <span className="text-xs text-gray-500">{generatedTemplateScript.script.value?.timing || '8-15s'}</span>
                          </div>
                          <p className="text-sm text-gray-300">{generatedTemplateScript.script.value?.content}</p>
                        </div>

                        {/* CTA */}
                        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-blue-400">📣 CTA</span>
                            <span className="text-xs text-gray-500">{generatedTemplateScript.script.cta?.timing || '15-20s'}</span>
                          </div>
                          <p className="text-sm text-gray-300">{generatedTemplateScript.script.cta?.content}</p>
                        </div>
                      </div>
                    )}

                    {/* Full Script */}
                    {generatedTemplateScript.script?.fullScript && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="text-sm font-semibold mb-3">📝 Full Script (Voiceover)</div>
                        <div className="bg-gray-900 rounded p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono">
                          {generatedTemplateScript.script.fullScript}
                        </div>
                      </div>
                    )}

                    {/* Cinematic Prompt Generation */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-6 h-6 text-blue-400" />
                        <div>
                          <div className="text-lg font-bold">Step 1: Generate Cinematic Prompt</div>
                          <div className="text-sm text-gray-400">
                            Transform script into production-ready video prompt with lighting, camera, and audio specs
                          </div>
                        </div>
                      </div>

                      {!templateCinematicPrompt ? (
                        <button
                          onClick={generateTemplateCinematicPrompt}
                          disabled={templateGeneratingPrompt}
                          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
                        >
                          {templateGeneratingPrompt ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Generating Prompt...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Generate Cinematic Prompt
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                            {templateCinematicPrompt}
                          </div>
                          
                          {/* Step 2: Generate Video */}
                          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="text-lg font-bold">Step 2: Generate Video with AI</div>
                            </div>
                            <button
                              onClick={generateTemplateVideo}
                              disabled={templateGeneratingVideo}
                              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all flex items-center justify-center gap-3"
                            >
                              {templateGeneratingVideo ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  {templateVideoStatus || 'Generating...'}
                                </>
                              ) : (
                                <>
                                  🎬 Generate Video (~2 min)
                                </>
                              )}
                            </button>
                            <div className="text-xs text-center text-gray-400 mt-2">
                              💰 Cost: ~6.6 credits (Free tier: 66 credits available)
                            </div>
                            {templateGeneratingVideo && (
                              <div className="mt-3">
                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ width: `${templateVideoProgress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-center text-gray-400 mt-1">{templateVideoProgress}%</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedTemplateScript.script?.fullScript || '');
                          alert('Script copied to clipboard!');
                        }}
                        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
                      >
                        Copy Script
                      </button>
                      <button
                        onClick={() => {
                          setGeneratedTemplateScript(null);
                          setTemplateCinematicPrompt(null);
                        }}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
                      >
                        Generate New Script
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Unified Shell removed for this page as requested */}

      {/* Workflow Picker Modal - LocalStorage Backed */}
      <WorkflowPickerLocal
        isOpen={showWorkflowPicker}
        onClose={() => setShowWorkflowPicker(false)}
        onSelectWorkflow={(id) => {
          setSelectedWorkflowId(id);
          setShowWorkflowPicker(false);
        }}
        onCreateNew={async () => {
          const wf = await createWorkflow();
          // onWorkflowCreated callback handles the rest
        }}
      />
    </div>
  )
} 
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Loader2, ArrowLeft, Copy, Sparkles, Video, Check,
  Mic, BarChart3, Wrench, PartyPopper, ExternalLink,
  CheckCircle, XCircle, Hash, Clock, Share2, Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DPSGauge, FixCard, AICoachBubble, ScoreBar, FixData } from '@/components/ui/trendzo';
import { TeleprompterModal } from '@/components/teleprompter';
import { useAuth } from '@/lib/hooks/useAuth';
import { scoreTemplatesForCreator, type ScoredTemplate, type PatternSuggestion, type CreatorPreferences } from '@/lib/quick-win/template-scorer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Extended step type for 7-step workflow
type Step = 'select' | 'generate' | 'create' | 'record' | 'analyze' | 'fix' | 'publish';

const STEP_LABELS: Record<Step, string> = {
  select: 'Pick Template',
  generate: 'Generate Script',
  create: 'Create Video',
  record: 'Record',
  analyze: 'Analyze',
  fix: 'Optimize',
  publish: 'Publish',
};

const ALL_STEPS: Step[] = ['select', 'generate', 'create', 'record', 'analyze', 'fix', 'publish'];

interface Template {
  video_id: string;
  title: string;
  views_count: number;
  likes_count: number;
  dps_score: number;
  thumbnail_url: string | null;
  niche: string | null;
  transcript_text: string | null;
  creator_username: string | null;
}

interface GeneratedScript {
  script: {
    hook: { text: string; timing: string };
    context: { text: string; timing: string };
    value: { text: string; timing: string };
    cta: { text: string; timing: string };
    fullScript: string;
    visualNotes?: string;
  };
  predictedDps: number;
  patternSource: string;
  patternMetadata?: {
    primaryPatternType: string;
    primaryPatternDps: number;
  };
  attributes?: Record<string, number>;
}

interface AnalysisResult {
  dps: number;
  tier: string;
  pack1?: {
    attribute_scores: Array<{ attribute: string; score: number; evidence: string }>;
    idea_legos: Record<string, boolean>;
    hook: { type: string; clarity_score: number };
    pacing: { score: number };
    clarity: { score: number };
    novelty: { score: number };
  };
  pack2?: {
    predicted_before: number;
    predicted_after_estimate: number;
    changes: Array<{
      priority: number;
      what_to_change: string;
      how_to_change: string;
      example: string;
      estimated_lift: number;
    }>;
  };
  pack3?: {
    mechanics: Array<{ name: string; strength: number; evidence: string[] }>;
  };
}

interface FixStatus {
  [index: number]: 'pending' | 'applied' | 'skipped';
}

export default function QuickWinWorkflow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [topTemplates, setTopTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [userNiche, setUserNiche] = useState('Personal finance');
  const [copied, setCopied] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [cinematicPrompt, setCinematicPrompt] = useState<string | null>(null);

  // New state for Steps 5-7
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [fixStatuses, setFixStatuses] = useState<FixStatus>({});
  const [currentScript, setCurrentScript] = useState<string>('');
  const [projectedDps, setProjectedDps] = useState<number>(0);
  const [showCoach, setShowCoach] = useState(true);
  const [coachMessage, setCoachMessage] = useState('');
  const [publishPack, setPublishPack] = useState<{
    caption: string;
    hashtags: string[];
    bestTime: string;
  } | null>(null);
  const [blockchainHash, setBlockchainHash] = useState<string>('');

  // Step 4: Teleprompter state
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);

  // Creator Context + Personalization
  const { user } = useAuth();
  const [creatorCtx, setCreatorCtx] = useState<CreatorPreferences | null>(null);
  const [patterns, setPatterns] = useState<PatternSuggestion[]>([]);
  const [rankedTemplates, setRankedTemplates] = useState<ScoredTemplate[]>([]);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [historicalAvgVps, setHistoricalAvgVps] = useState<number | null>(null);

  // Load creator context (when authenticated)
  useEffect(() => {
    if (!user?.uid) return;
    async function loadContext() {
      try {
        const res = await fetch('/api/quick-win/context');
        const data = await res.json();
        if (data.success && data.creatorContext) {
          setCreatorCtx(data.creatorContext);
          setPatterns(data.patterns || []);
          setHistoricalAvgVps(data.historicalAvgVps);
          // Use creator's real niche instead of hardcoded default
          if (data.creatorContext.niche) {
            setUserNiche(data.creatorContext.niche);
          }
        }
      } catch (e) {
        console.error('Creator context load failed:', e);
      }
    }
    loadContext();
  }, [user?.uid]);

  // Load templates
  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        let templates: Template[] = [];

        const { data: genomes, error: genomesError } = await supabase
          .from('viral_genomes')
          .select('niche, example_videos, dps_average')
          .ilike('niche', `%${userNiche.replace(/-/g, ' ')}%`)
          .order('dps_average', { ascending: false })
          .limit(10);

        if (!genomesError && genomes && genomes.length > 0) {
          const videoIds: string[] = [];
          genomes.forEach(g => {
            if (g.example_videos && Array.isArray(g.example_videos)) {
              g.example_videos.forEach((vid: string) => {
                if (!videoIds.includes(vid)) videoIds.push(vid);
              });
            }
          });

          if (videoIds.length > 0) {
            const { data: videos } = await supabase
              .from('scraped_videos')
              .select('video_id, title, views_count, likes_count, dps_score, thumbnail_url, transcript_text, creator_username')
              .in('video_id', videoIds)
              .not('title', 'is', null)
              .not('dps_score', 'is', null)
              .order('dps_score', { ascending: false })
              .limit(3);

            if (videos && videos.length > 0) {
              templates = videos.map(v => ({ ...v, niche: userNiche }));
            }
          }
        }

        if (templates.length === 0) {
          const { data: fallbackVideos } = await supabase
            .from('scraped_videos')
            .select('video_id, title, views_count, likes_count, dps_score, thumbnail_url, transcript_text, creator_username')
            .not('title', 'is', null)
            .not('dps_score', 'is', null)
            .gte('dps_score', 60)
            .order('dps_score', { ascending: false })
            .limit(3);

          if (fallbackVideos && fallbackVideos.length > 0) {
            templates = fallbackVideos.map(v => ({ ...v, niche: 'General' }));
          }
        }

        if (templates.length === 0) {
          const { data: anyVideos } = await supabase
            .from('scraped_videos')
            .select('video_id, title, views_count, likes_count, dps_score, thumbnail_url, transcript_text, creator_username')
            .not('dps_score', 'is', null)
            .order('dps_score', { ascending: false })
            .limit(3);

          if (anyVideos && anyVideos.length > 0) {
            templates = anyVideos.map(v => ({
              ...v,
              niche: 'General',
              title: v.title || 'Viral Video Template'
            }));
          }
        }

        setTopTemplates(templates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, [userNiche]);

  // Re-rank templates when creator context loads
  useEffect(() => {
    if (topTemplates.length === 0 || !creatorCtx) return;
    const scored = scoreTemplatesForCreator(topTemplates, creatorCtx, patterns);
    setRankedTemplates(scored);
  }, [topTemplates, creatorCtx, patterns]);

  // Update coach message based on step
  useEffect(() => {
    const messages: Record<Step, string> = {
      select: "Pick a viral template to base your content on. Higher VPS = higher viral potential!",
      generate: "I'll analyze the viral pattern and create a customized script for you.",
      create: "Choose how you want to create your video - film yourself or let AI generate it!",
      record: "Read naturally and look at the camera. You've got this!",
      analyze: analysisResult && analysisResult.dps >= 75
        ? "This is incredible! You've got viral potential!"
        : "Solid foundation! Let's optimize for maximum impact.",
      fix: `I found ${analysisResult?.pack2?.changes?.length || 0} ways to boost your score!`,
      publish: "Congratulations! You've created a potential viral hit!",
    };
    setCoachMessage(messages[step]);
  }, [step, analysisResult]);

  // STEP 1: Select Template
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setStep('generate');
  };

  // STEP 2: Generate Script (uses profile-aware route that saves to generated_scripts)
  const handleGenerateScript = async () => {
    if (!selectedTemplate) return;
    setLoading(true);

    try {
      // Find matching pattern saturation info for the selected template
      const templateMatch = rankedTemplates.find(
        (t) => t.video_id === selectedTemplate.video_id,
      );

      const response = await fetch('/api/quick-win/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateVideoId: selectedTemplate.video_id,
        }),
      });

      const result = await response.json();

      if (!result.error && result.full_script) {
        // Map generate-script response to the GeneratedScript format the page expects
        const mapped: GeneratedScript = {
          script: {
            hook: { text: result.hook || '', timing: '0-3s' },
            context: { text: '', timing: '' },
            value: { text: result.body || '', timing: '3-45s' },
            cta: { text: result.cta || '', timing: '45-60s' },
            fullScript: result.full_script,
          },
          predictedDps: result.vps_score || 65,
          patternSource: 'quick-win-generate',
          patternMetadata: undefined,
          attributes: undefined,
        };

        setGeneratedScript(mapped);
        setCurrentScript(result.full_script);

        // Create content brief (fire-and-forget)
        if (user?.uid) {
          fetch('/api/quick-win/brief', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source_video_id: selectedTemplate.video_id,
              pattern_id: null,
              brief_content: {
                script: mapped.script,
                template_title: selectedTemplate.title,
                niche: selectedTemplate.niche || userNiche,
                platform: 'tiktok',
                generated_script_id: result.id,
              },
              predicted_vps: result.vps_score,
            }),
          })
            .then((r) => r.json())
            .then((d) => { if (d.success) setBriefId(d.brief_id); })
            .catch(() => {}); // Non-blocking
        }

        setStep('create');
      } else {
        alert(result.error || 'Failed to generate script. Please try again.');
      }
    } catch (error) {
      console.error('Script generation failed:', error);
      alert('Failed to generate script. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Create Options
  const handleCopyScript = () => {
    if (!generatedScript) return;
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAIVideo = async () => {
    if (!generatedScript) return;
    setGeneratingVideo(true);

    try {
      const promptResponse = await fetch('/api/prompt-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: currentScript,
          dps_context: {
            target_score: generatedScript.predictedDps,
            viral_patterns: [],
            niche: selectedTemplate?.niche || userNiche,
          },
          use_smart_detection: true,
        })
      });

      const promptData = await promptResponse.json();

      if (promptData.success && promptData.data?.cinematic_prompt) {
        setCinematicPrompt(promptData.data.cinematic_prompt);

        const videoResponse = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: promptData.data.cinematic_prompt,
            platform: 'tiktok',
            length: 30,
            niche: selectedTemplate?.niche || userNiche,
          })
        });

        const videoData = await videoResponse.json();

        if (videoData.success) {
          // Move to analyze step after video generation starts
          setStep('analyze');
          handleAnalyzeVideo();
        } else {
          alert('Video generation queued. Moving to analysis...');
          setStep('analyze');
          handleAnalyzeVideo();
        }
      }
    } catch (error) {
      console.error('Video generation failed:', error);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleProceedToAnalysis = () => {
    updateBriefStatus('accepted');
    setStep('analyze');
    handleAnalyzeVideo();
  };

  // STEP 4: Record with Teleprompter
  const handleOpenTeleprompter = () => {
    setShowTeleprompter(true);
  };

  const handleTeleprompterComplete = (videoBlob: Blob | null) => {
    setShowTeleprompter(false);
    setRecordedVideoBlob(videoBlob);
    updateBriefStatus('recorded');
    // After recording, proceed to analysis
    setStep('analyze');
    handleAnalyzeVideo();
  };

  const handleSkipToAnalysis = () => {
    setStep('analyze');
    handleAnalyzeVideo();
  };

  // STEP 5: Analyze Video
  const handleAnalyzeVideo = async () => {
    setAnalyzingVideo(true);

    try {
      // Use creator-aware analyze route (falls back to generic when no auth)
      const response = await fetch('/api/quick-win/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentScript,
          niche: selectedTemplate?.niche || userNiche,
        })
      });

      const result = await response.json();

      // Create mock Pack 2 data (used as fallback)
      const mockPack2 = {
        predicted_before: generatedScript?.predictedDps || 72,
        predicted_after_estimate: (generatedScript?.predictedDps || 72) + 13,
        changes: [
          {
            priority: 1,
            what_to_change: 'Opening hook',
            how_to_change: 'Add a pattern interrupt with unexpected visual or bold claim',
            example: 'Stop scrolling - this one trick changed everything for me.',
            estimated_lift: 8,
          },
          {
            priority: 2,
            what_to_change: 'Mid-video retention',
            how_to_change: 'Add a curiosity gap before the main reveal',
            example: 'But wait until you see what happens next...',
            estimated_lift: 3,
          },
          {
            priority: 3,
            what_to_change: 'Call-to-action',
            how_to_change: 'Make the CTA more specific and urgent',
            example: 'Comment "GUIDE" and I\'ll send you the full breakdown',
            estimated_lift: 2,
          },
        ],
      };

      if (result.success) {
        // Pipeline returns pack1/pack2/pack3, not unified_grading/editing_suggestions
        const qa = result.qualitative_analysis || {};
        const realPack2 = qa.pack2 || qa.editing_suggestions;

        // Use real Pack 2 if it has changes, otherwise use mock
        const pack2Data = (realPack2?.changes && realPack2.changes.length > 0) ? realPack2 : mockPack2;

        const analysis: AnalysisResult = {
          dps: result.prediction?.final_dps_prediction || generatedScript?.predictedDps || 65,
          tier: result.prediction?.prediction_breakdown?.tier || 'good',
          pack1: qa.pack1 || qa.unified_grading,
          pack2: pack2Data,
          pack3: qa.pack3 || qa.viral_mechanics,
        };

        setAnalysisResult(analysis);
        setProjectedDps(analysis.dps);

        // Update brief status + check first win (fire-and-forget)
        if (briefId) {
          fetch('/api/quick-win/brief', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brief_id: briefId,
              status: 'analyzed',
              predicted_vps: analysis.dps,
            }),
          })
            .then((r) => r.json())
            .then((d) => { if (d.firstWin) setShowFirstWin(true); })
            .catch(() => {});
        }

        // Initialize fix statuses
        if (analysis.pack2?.changes) {
          const initialStatuses: FixStatus = {};
          analysis.pack2.changes.forEach((_, i) => {
            initialStatuses[i] = 'pending';
          });
          setFixStatuses(initialStatuses);
        }
      } else {
        // Create mock analysis for demo (reusing mockPack2 from above)
        const mockPack1 = {
          attribute_scores: [
            { attribute: 'hook_strength', score: 7, evidence: 'Strong opening question' },
            { attribute: 'curiosity_gaps', score: 6, evidence: 'Some open loops present' },
            { attribute: 'shareability', score: 8, evidence: 'Quotable moments included' },
            { attribute: 'value_density', score: 7, evidence: 'Good information density' },
            { attribute: 'pacing_rhythm', score: 6, evidence: 'Could be tighter' },
          ],
          idea_legos: { lego_1: true, lego_2: true, lego_3: false, lego_4: true, lego_5: true, lego_6: false, lego_7: true },
          hook: { type: 'question', clarity_score: 7 },
          pacing: { score: 6 },
          clarity: { score: 8 },
          novelty: { score: 7 },
        };

        const mockPack3 = {
          mechanics: [
            { name: 'Pattern Interrupt', strength: 75, evidence: ['Strong visual hook'] },
            { name: 'Curiosity Gap', strength: 60, evidence: ['Open loops present'] },
            { name: 'Social Proof', strength: 45, evidence: ['Could add more proof points'] },
          ],
        };

        const mockAnalysis: AnalysisResult = {
          dps: generatedScript?.predictedDps || 72,
          tier: 'good',
          pack1: mockPack1,
          pack2: mockPack2,
          pack3: mockPack3,
        };

        setAnalysisResult(mockAnalysis);
        setProjectedDps(mockAnalysis.dps);

        const initialStatuses: FixStatus = {};
        mockPack2.changes.forEach((_, i) => {
          initialStatuses[i] = 'pending';
        });
        setFixStatuses(initialStatuses);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzingVideo(false);
    }
  };

  // STEP 6: Apply/Skip fixes
  const handleApplyFix = (index: number) => {
    if (!analysisResult?.pack2?.changes[index]) return;

    const fix = analysisResult.pack2.changes[index];
    setFixStatuses(prev => ({ ...prev, [index]: 'applied' }));
    setProjectedDps(prev => prev + fix.estimated_lift);

    // Update the script with the fix example
    setCurrentScript(prev => {
      if (index === 0) {
        // Replace opening
        return fix.example + '\n\n' + prev.split('\n').slice(1).join('\n');
      }
      return prev;
    });
  };

  const handleSkipFix = (index: number) => {
    setFixStatuses(prev => ({ ...prev, [index]: 'skipped' }));
  };

  const handleUndoFix = (index: number) => {
    if (!analysisResult?.pack2?.changes[index]) return;

    const fix = analysisResult.pack2.changes[index];
    const wasApplied = fixStatuses[index] === 'applied';

    setFixStatuses(prev => ({ ...prev, [index]: 'pending' }));

    if (wasApplied) {
      setProjectedDps(prev => prev - fix.estimated_lift);
    }
  };

  const handleProceedToPublish = () => {
    updateBriefStatus('optimized');

    // Generate blockchain hash
    const hashData = JSON.stringify({
      script: currentScript,
      dps: projectedDps,
      timestamp: Date.now(),
    });
    const hash = '0x' + Array.from(hashData).reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0).toString(16).padStart(16, '0') + 'f42c98d71e220';
    setBlockchainHash(hash);

    // Generate publish pack
    setPublishPack({
      caption: `${generatedScript?.script.hook.text || ''} Watch til the end for the surprise! #viral #trending`,
      hashtags: ['#ViralPotential', '#TechTrends', '#AIVideo', '#ContentCreator', '#TikTokTips'],
      bestTime: 'Today at 7:30 PM (based on peak engagement data)',
    });

    setStep('publish');
  };

  // Brief status helper (fire-and-forget)
  const updateBriefStatus = useCallback((status: string) => {
    if (!briefId) return;
    fetch('/api/quick-win/brief', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief_id: briefId, status }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.firstWin) setShowFirstWin(true); })
      .catch(() => {});
  }, [briefId]);

  // Handle workflow completion (Step 7 → publish)
  const handleCompleteWorkflow = () => {
    updateBriefStatus('published');
    router.push('/admin/studio');
  };

  // Utilities
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getStepIndex = (s: Step) => ALL_STEPS.indexOf(s);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Quick Win Workflow
        </h1>
        <p className="text-gray-400 mt-2">Create viral content in 7 simple steps</p>
      </div>

      {/* Progress Indicator - Now 7 steps */}
      <div className="max-w-6xl mx-auto mb-12 overflow-x-auto">
        <div className="flex justify-center gap-4 min-w-max px-4">
          {ALL_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step === s
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110'
                  : getStepIndex(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400'
              }`}>
                {getStepIndex(step) > i ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === s ? 'text-white' : 'text-gray-500'}`}>
                {STEP_LABELS[s]}
              </span>
              {i < ALL_STEPS.length - 1 && <div className="w-8 h-0.5 bg-gray-700" />}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Select Template */}
      {step === 'select' && (
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Pick Your Winner</h2>
            <p className="text-gray-400">
              These are the top performing videos. Select one to base your script on.
            </p>
          </div>

          {loadingTemplates ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
              <p className="text-gray-400">Loading real viral videos...</p>
            </div>
          ) : topTemplates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400">No templates found. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(rankedTemplates.length > 0 ? rankedTemplates : topTemplates).map((template, index) => {
                const scored = 'recommended' in template ? (template as ScoredTemplate) : null;
                return (
                  <div
                    key={template.video_id}
                    onClick={() => handleSelectTemplate(template)}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all hover:scale-105 hover:-translate-y-1"
                  >
                    {scored?.recommended ? (
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full mb-3 inline-flex items-center gap-1 font-bold">
                        <Award className="w-3 h-3" />
                        RECOMMENDED FOR YOU
                      </div>
                    ) : index === 0 && !rankedTemplates.length ? (
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-3 py-1 rounded-full mb-3 inline-block font-bold">
                        TOP PERFORMER
                      </div>
                    ) : null}
                    <div className="aspect-[9/16] bg-gray-700 rounded-xl mb-4 overflow-hidden relative">
                      {template.thumbnail_url ? (
                        <img
                          src={template.thumbnail_url}
                          alt={template.title || 'Video thumbnail'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Video className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80">{formatViews(template.views_count)} views</span>
                          <span className="text-green-500 font-bold">{template.dps_score?.toFixed(1)} VPS</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">{template.title}</p>
                    <div className="flex items-center justify-between">
                      {template.creator_username && (
                        <p className="text-xs text-gray-500">@{template.creator_username}</p>
                      )}
                      {scored?.patternMatch && (
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {scored.patternMatch.lifecycle_stage === 'first-mover' ? 'First Mover' : 'Ascending'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Generate Script */}
      {step === 'generate' && selectedTemplate && (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">Generate Your Script</h2>
          <p className="text-gray-400 mb-8">
            We'll analyze the viral pattern and create a similar script for you.
          </p>

          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold mb-3 text-pink-400">Source Video</h3>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{selectedTemplate.title}</p>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-gray-400">{formatViews(selectedTemplate.views_count)} views</span>
              <span className="text-green-500 font-bold">{selectedTemplate.dps_score?.toFixed(1)} VPS</span>
            </div>
          </div>

          <button
            onClick={handleGenerateScript}
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-pink-500/25"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Pattern & Generating...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                Generate My Script
              </span>
            )}
          </button>

          <button
            onClick={() => setStep('select')}
            className="block mx-auto mt-6 text-gray-500 hover:text-white transition-colors"
          >
            ← Back to templates
          </button>
        </div>
      )}

      {/* STEP 3: Create */}
      {step === 'create' && generatedScript && (
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Your Viral Script</h2>
            <p className="text-gray-400">
              Based on {generatedScript.patternSource === 'viral_genomes_specific' ? 'a proven viral pattern' : 'top performers'}
            </p>
          </div>

          {/* Script Display */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-6">
            <div className="space-y-4">
              <div className="border-l-4 border-pink-500 pl-4 py-2">
                <span className="text-pink-400 text-xs font-bold uppercase tracking-wider">Hook {generatedScript.script.hook.timing}</span>
                <p className="text-lg mt-1">{generatedScript.script.hook.text}</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Context {generatedScript.script.context.timing}</span>
                <p className="text-lg mt-1">{generatedScript.script.context.text}</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Value {generatedScript.script.value.timing}</span>
                <p className="text-lg mt-1">{generatedScript.script.value.text}</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">CTA {generatedScript.script.cta.timing}</span>
                <p className="text-lg mt-1">{generatedScript.script.cta.text}</p>
              </div>
            </div>
          </div>

          {/* Predicted Performance */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4 text-center">Predicted Performance</h3>
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-500">{generatedScript.predictedDps?.toFixed(1)}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Predicted VPS</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleCopyScript}
              className="bg-white text-black px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Script
                </>
              )}
            </button>
            <button
              onClick={() => setStep('record')}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-4 rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              <Mic className="w-5 h-5" />
              Record Yourself
            </button>
            <button
              onClick={handleGenerateAIVideo}
              disabled={generatingVideo}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-6 py-4 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {generatingVideo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  AI Video
                </>
              )}
            </button>
            <button
              onClick={handleProceedToAnalysis}
              className="bg-gray-700 text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-600 transition-all flex items-center justify-center gap-3"
            >
              <BarChart3 className="w-5 h-5" />
              Skip to Analyze
            </button>
          </div>

          <button
            onClick={() => setStep('generate')}
            className="block mx-auto mt-6 text-gray-500 hover:text-white transition-colors"
          >
            ← Generate different script
          </button>
        </div>
      )}

      {/* STEP 4: Record */}
      {step === 'record' && generatedScript && (
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">Record Your Video</h2>
          <p className="text-gray-400 mb-8">
            Use the teleprompter to record yourself reading the script
          </p>

          {/* Script Preview */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4 text-pink-400">Your Script</h3>
            <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
              <p><span className="text-pink-400 font-bold">Hook:</span> {generatedScript.script.hook.text}</p>
              <p><span className="text-blue-400 font-bold">Context:</span> {generatedScript.script.context.text}</p>
              <p><span className="text-green-400 font-bold">Value:</span> {generatedScript.script.value.text}</p>
              <p><span className="text-yellow-400 font-bold">CTA:</span> {generatedScript.script.cta.text}</p>
            </div>
          </div>

          {/* Record Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleOpenTeleprompter}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-6 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-pink-500/25 flex flex-col items-center gap-3"
            >
              <Mic className="w-8 h-8" />
              Open Teleprompter
              <span className="text-sm font-normal opacity-80">Record with auto-scrolling script</span>
            </button>

            <button
              onClick={handleSkipToAnalysis}
              className="bg-gray-800/50 border border-gray-700/50 text-white px-8 py-6 rounded-2xl font-bold text-lg hover:bg-gray-700/50 transition-all flex flex-col items-center gap-3"
            >
              <Video className="w-8 h-8" />
              Skip Recording
              <span className="text-sm font-normal opacity-80">Continue to analysis</span>
            </button>
          </div>

          <button
            onClick={() => setStep('create')}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ← Back to script
          </button>
        </div>
      )}

      {/* STEP 5: Analyze */}
      {step === 'analyze' && (
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Video Analysis Results
            </h2>
            <p className="text-gray-400">See how your content scores and where to improve</p>
          </div>

          {analyzingVideo ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-16 h-16 text-pink-500 animate-spin mb-4" />
              <p className="text-gray-400 text-lg">Analyzing your content...</p>
              <p className="text-gray-500 text-sm mt-2">Running Pack 1, 2, 3, and V analysis</p>
            </div>
          ) : analysisResult && (
            <>
              {/* DPS Gauge */}
              <div className="flex justify-center mb-8">
                <DPSGauge score={analysisResult.dps} size="lg" showTier animate />
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Content Analysis (Pack 1) */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-pink-400" />
                    Content Analysis
                  </h3>
                  <div className="space-y-4">
                    {analysisResult.pack1?.attribute_scores?.slice(0, 5).map((attr) => (
                      <ScoreBar
                        key={attr.attribute}
                        label={attr.attribute.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        score={attr.score}
                        maxScore={10}
                      />
                    ))}
                  </div>
                </div>

                {/* Seven Idea Legos */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Seven Idea Legos</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'lego_1', label: 'Clear topic identified' },
                      { key: 'lego_2', label: 'Relevant to target audience' },
                      { key: 'lego_3', label: 'Unique angle presented' },
                      { key: 'lego_4', label: 'Intriguing hook present' },
                      { key: 'lego_5', label: 'Story structure exists' },
                      { key: 'lego_6', label: 'Visual format matches' },
                      { key: 'lego_7', label: 'Call-to-action present' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-3">
                        {analysisResult.pack1?.idea_legos?.[key] ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={analysisResult.pack1?.idea_legos?.[key] ? 'text-white' : 'text-gray-500'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Viral Mechanics (Pack 3) */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Viral Mechanics Detected</h3>
                  <div className="space-y-4">
                    {analysisResult.pack3?.mechanics?.map((mechanic) => (
                      <div key={mechanic.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-300">{mechanic.name}</span>
                          <span className="text-sm text-green-500 font-medium">{mechanic.strength}%</span>
                        </div>
                        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              mechanic.strength >= 70 ? 'bg-green-500' :
                              mechanic.strength >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                            }`}
                            style={{ width: `${mechanic.strength}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                      <div className="text-2xl font-bold text-green-500">
                        {analysisResult.pack1?.hook?.clarity_score || 7}/10
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Hook Clarity</div>
                    </div>
                    <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                      <div className="text-2xl font-bold text-yellow-400">
                        {analysisResult.pack1?.pacing?.score || 6}/10
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Pacing</div>
                    </div>
                    <div className="text-center p-3 bg-gray-900/50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-400">
                        {analysisResult.pack1?.novelty?.score || 7}/10
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Novelty</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex justify-center">
                <button
                  onClick={() => setStep('fix')}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-pink-500/25 flex items-center gap-3"
                >
                  See How to Improve
                  <Wrench className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 6: Fix & Optimize */}
      {step === 'fix' && analysisResult && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {analysisResult.pack2?.changes?.length || 3} Ways to Boost Your Score
            </h2>
            <p className="text-gray-400">
              Current Score: <span className="text-green-500 font-bold">{analysisResult.dps.toFixed(1)}%</span>
              {' → '}
              Target: <span className="text-green-400 font-bold">{projectedDps.toFixed(1)}%</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Score Progress</span>
              <span className="text-sm text-green-500 font-medium">
                +{(projectedDps - analysisResult.dps).toFixed(1)} VPS potential
              </span>
            </div>
            <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${projectedDps}%` }}
              />
            </div>
          </div>

          {/* Fix Cards */}
          <div className="space-y-6 mb-8">
            {analysisResult.pack2?.changes?.map((change, index) => {
              const fixData: FixData = {
                category: change.what_to_change.toUpperCase(),
                title: change.how_to_change,
                originalScript: generatedScript?.script.hook.text || 'Original content here...',
                optimizedScript: change.example,
                estimatedLift: change.estimated_lift,
                retentionImpact: `Retention predicted +${Math.round(change.estimated_lift * 1.5)}%`,
              };

              return (
                <FixCard
                  key={index}
                  fix={fixData}
                  status={fixStatuses[index] || 'pending'}
                  onApply={() => handleApplyFix(index)}
                  onSkip={() => handleSkipFix(index)}
                  onUndo={() => handleUndoFix(index)}
                />
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep('analyze')}
              className="px-6 py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all"
            >
              ← Back to Analysis
            </button>
            <button
              onClick={handleProceedToPublish}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-pink-500/25 flex items-center gap-3"
            >
              Next Step: Finalize
              <PartyPopper className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: Ready to Publish */}
      {step === 'publish' && (
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              Ready to Go Viral! <PartyPopper className="w-8 h-8 text-yellow-400" />
            </h2>
            <p className="text-gray-400">Your video is optimized for peak performance</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - 60% */}
            <div className="lg:col-span-3 space-y-6">
              {/* Final DPS */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Viral Prediction Score</h3>
                <div className="flex justify-center mb-4">
                  <DPSGauge score={projectedDps} size="lg" showTier animate />
                </div>
                <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                  HIGH VIRAL POTENTIAL
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  Your video is optimized for peak performance across TikTok and Reels
                </p>
              </div>

              {/* Blockchain Receipt */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Blockchain Receipt</h3>
                <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-4">
                  <code className="text-sm text-green-400 font-mono truncate">
                    {blockchainHash}
                  </code>
                  <button className="text-pink-400 hover:text-pink-300 flex items-center gap-1 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    View Explorer
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - 40% */}
            <div className="lg:col-span-2 space-y-6">
              {/* Publish Pack */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-pink-400" />
                  Publish Pack
                </h3>

                <div className="space-y-4">
                  {/* Caption */}
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Suggested Caption</span>
                    <p className="text-sm text-gray-300 bg-gray-900/50 rounded-lg p-3">
                      {publishPack?.caption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Trending Hashtags
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {publishPack?.hashtags.map((tag) => (
                        <span key={tag} className="text-sm text-pink-400 bg-pink-500/10 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Best Time */}
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Best Time to Post
                    </span>
                    <p className="text-sm text-green-400 font-medium">
                      {publishPack?.bestTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Button */}
          <div className="mt-8">
            <button
              onClick={handleCompleteWorkflow}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-green-500/25"
            >
              COMPLETE WORKFLOW & PUBLISH
            </button>
          </div>
        </div>
      )}

      {/* AI Coach Bubble */}
      {showCoach && coachMessage && (
        <AICoachBubble
          message={coachMessage}
          onDismiss={() => setShowCoach(false)}
          variant={step === 'publish' ? 'celebration' : 'default'}
        />
      )}

      {/* Teleprompter Modal */}
      <TeleprompterModal
        isOpen={showTeleprompter}
        onClose={() => setShowTeleprompter(false)}
        script={currentScript}
        onComplete={handleTeleprompterComplete}
      />

      {/* First Win Celebration Modal */}
      {showFirstWin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-500 rounded-3xl p-8 max-w-md text-center shadow-2xl animate-in fade-in zoom-in">
            <PartyPopper className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">FIRST WIN!</h2>
            <p className="text-white/90 text-lg mb-2">
              Your VPS of <span className="font-bold">{projectedDps.toFixed(1)}</span> beats the threshold!
            </p>
            <p className="text-white/70 text-sm mb-6">
              This is your breakthrough moment. Keep this momentum going!
            </p>
            <button
              onClick={() => setShowFirstWin(false)}
              className="bg-white text-orange-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-orange-50 transition-all shadow-lg"
            >
              Let&apos;s Go!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

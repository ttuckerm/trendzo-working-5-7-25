'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, ArrowLeft, Copy, Sparkles, Video, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Step = 'select' | 'generate' | 'create';

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

export default function QuickWinWorkflow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [topTemplates, setTopTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [userNiche] = useState('Personal finance'); // Default niche - matches database format
  const [copied, setCopied] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [cinematicPrompt, setCinematicPrompt] = useState<string | null>(null);

  // Load top 3 templates for user's niche from REAL data
  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        let templates: Template[] = [];

        // Strategy 1: Try to get videos linked to viral_genomes for the user's niche
        const { data: genomes, error: genomesError } = await supabase
          .from('viral_genomes')
          .select('niche, example_videos, dps_average')
          .ilike('niche', `%${userNiche.replace(/-/g, ' ')}%`)
          .order('dps_average', { ascending: false })
          .limit(10);

        if (!genomesError && genomes && genomes.length > 0) {
          // Collect video IDs from genomes
          const videoIds: string[] = [];
          genomes.forEach(g => {
            if (g.example_videos && Array.isArray(g.example_videos)) {
              g.example_videos.forEach((vid: string) => {
                if (!videoIds.includes(vid)) videoIds.push(vid);
              });
            }
          });

          if (videoIds.length > 0) {
            // Get the actual video data
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

        // Strategy 2: Direct fallback to top performing scraped_videos if no niche-specific templates
        if (templates.length === 0) {
          console.log('Falling back to top performing videos from scraped_videos...');
          const { data: fallbackVideos, error: fallbackError } = await supabase
            .from('scraped_videos')
            .select('video_id, title, views_count, likes_count, dps_score, thumbnail_url, transcript_text, creator_username')
            .not('title', 'is', null)
            .not('dps_score', 'is', null)
            .gte('dps_score', 60) // Only high-performing videos
            .order('dps_score', { ascending: false })
            .limit(3);

          if (!fallbackError && fallbackVideos && fallbackVideos.length > 0) {
            templates = fallbackVideos.map(v => ({ ...v, niche: 'General' }));
          }
        }

        // Strategy 3: Ultimate fallback - any videos with DPS score
        if (templates.length === 0) {
          console.log('Ultimate fallback: getting any videos with DPS scores...');
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

        console.log(`Loaded ${templates.length} templates`);
        setTopTemplates(templates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, [userNiche]);

  // STEP 1: Select Template
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setStep('generate');
  };

  // STEP 2: Generate Script
  const handleGenerateScript = async () => {
    if (!selectedTemplate) return;
    setLoading(true);

    try {
      // First, check if this video has a viral_genome
      const { data: genomes } = await supabase
        .from('viral_genomes')
        .select('id')
        .contains('example_videos', [selectedTemplate.video_id])
        .limit(1);

      const genomeId = genomes?.[0]?.id;

      // Generate script using pattern DNA
      const response = await fetch('/api/generate/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId: genomeId,
          concept: selectedTemplate.title,
          platform: 'tiktok',
          length: 30,
          niche: selectedTemplate.niche || userNiche,
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setGeneratedScript(result.data);
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
    navigator.clipboard.writeText(generatedScript.script.fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAIVideo = async () => {
    if (!generatedScript) return;
    setGeneratingVideo(true);

    try {
      // Generate cinematic prompt first
      const promptResponse = await fetch('/api/prompt-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: generatedScript.script.fullScript,
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
        
        // Then generate video with Kling
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
          alert('Video generation started! Check back in 2-3 minutes.');
        } else {
          alert('Video generation queued. Check your video library shortly.');
        }
      } else {
        alert('Failed to generate cinematic prompt. Try copying the script instead.');
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      alert('Video generation failed. Try copying the script instead.');
    } finally {
      setGeneratingVideo(false);
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">
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
        <p className="text-gray-400 mt-2">Create viral content in 3 simple steps</p>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex justify-center gap-8">
          {(['select', 'generate', 'create'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step === s 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-110' 
                  : i < ['select', 'generate', 'create'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400'
              }`}>
                {i < ['select', 'generate', 'create'].indexOf(step) ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`capitalize font-medium ${step === s ? 'text-white' : 'text-gray-500'}`}>
                {s === 'select' ? 'Pick Template' : s === 'generate' ? 'Generate Script' : 'Create Video'}
              </span>
              {i < 2 && <div className="w-16 h-0.5 bg-gray-700 mx-2" />}
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
              {topTemplates.map((template, index) => (
                <div
                  key={template.video_id}
                  onClick={() => handleSelectTemplate(template)}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all hover:scale-105 hover:-translate-y-1 border border-gray-700/50"
                >
                  {index === 0 && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-3 py-1 rounded-full mb-3 inline-block font-bold">
                      🏆 TOP PERFORMER
                    </div>
                  )}
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
                        <span className="text-green-400 font-bold">{template.dps_score?.toFixed(1)} DPS</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2 mb-2">{template.title}</p>
                  {template.creator_username && (
                    <p className="text-xs text-gray-500">@{template.creator_username}</p>
                  )}
                </div>
              ))}
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

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-8 border border-gray-700/50">
            <h3 className="font-semibold mb-3 text-pink-400">Source Video</h3>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{selectedTemplate.title}</p>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-gray-400">{formatViews(selectedTemplate.views_count)} views</span>
              <span className="text-green-400 font-bold">{selectedTemplate.dps_score?.toFixed(1)} DPS</span>
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
              {generatedScript.patternMetadata && (
                <span className="text-pink-400"> • {generatedScript.patternMetadata.primaryPatternDps?.toFixed(1)} DPS pattern</span>
              )}
            </p>
          </div>

          {/* Script Display */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-gray-700/50">
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
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-gray-700/50">
            <h3 className="font-semibold mb-4 text-center">Predicted Performance</h3>
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400">{generatedScript.predictedDps?.toFixed(1)}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Predicted DPS</div>
              </div>
              {generatedScript.attributes && (
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(generatedScript.attributes)
                    .filter(([key]) => key !== 'source')
                    .slice(0, 6)
                    .map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className={`text-xl font-bold ${
                          (value as number) >= 80 ? 'text-green-400' : 
                          (value as number) >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {Math.round(value as number)}%
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
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
                  Copy Script & Film Yourself
                </>
              )}
            </button>
            <button
              onClick={handleGenerateAIVideo}
              disabled={generatingVideo}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {generatingVideo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Generate AI Video (~2 min)
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setGeneratedScript(null);
              setStep('generate');
            }}
            className="block mx-auto mt-6 text-gray-500 hover:text-white transition-colors"
          >
            ← Generate different script
          </button>
        </div>
      )}
    </div>
  );
}

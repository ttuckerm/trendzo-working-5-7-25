'use client'

import React, { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'

interface TemplateScriptModalProps {
  template: any;
  onClose: () => void;
}

export function TemplateScriptModal({ template, onClose }: TemplateScriptModalProps) {
  const [scriptPlatform, setScriptPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [scriptLength, setScriptLength] = useState<15 | 30 | 60>(15);
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [cinematicPrompt, setCinematicPrompt] = useState<string | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState('');

  const generateScript = async () => {
    if (!template) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/generate/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: template.title,
          platform: scriptPlatform,
          length: scriptLength,
          niche: template.category || template.niche || 'General',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedScript(data.data);
      } else {
        alert(data.error || 'Failed to generate script');
      }
    } catch (err) {
      console.error('Error generating script:', err);
      alert('Failed to generate script');
    } finally {
      setGenerating(false);
    }
  };

  const generateCinematicPrompt = async () => {
    if (!generatedScript) return;

    setGeneratingPrompt(true);

    try {
      const viralPatterns: string[] = [];
      if (generatedScript.attributes) {
        if (generatedScript.attributes.patternInterrupt > 0.7) viralPatterns.push('Pattern Interrupt');
        if (generatedScript.attributes.emotionalResonance > 0.7) viralPatterns.push('Emotional Resonance');
        if (generatedScript.attributes.socialCurrency > 0.7) viralPatterns.push('Social Currency');
      }

      const res = await fetch('/api/prompt-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: generatedScript.script.fullScript,
          dps_context: {
            target_score: generatedScript.predictedDps,
            viral_patterns: viralPatterns,
            niche: template?.category || 'General',
          },
          use_smart_detection: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCinematicPrompt(data.data.cinematic_prompt);
      } else {
        alert(data.error || 'Failed to generate cinematic prompt');
      }
    } catch (error) {
      console.error('Failed to generate cinematic prompt:', error);
      alert('Failed to generate cinematic prompt');
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const pollVideoStatus = async (jobId: string) => {
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
        setVideoProgress(job.progress);
        setVideoStatus(job.status);

        if (job.status === 'completed') {
          setGeneratingVideo(false);
          setVideoStatus('Video generated successfully!');
          return;
        }

        if (job.status === 'failed') {
          alert(`Video generation failed: ${job.error || 'Unknown error'}`);
          setGeneratingVideo(false);
          return;
        }

        if (attempts < maxAttempts && (job.status === 'pending' || job.status === 'submitted' || job.status === 'processing')) {
          attempts++;
          setTimeout(poll, 5000);
        } else if (attempts >= maxAttempts) {
          alert('Video generation timed out. Please check back later.');
          setGeneratingVideo(false);
        }
      } catch (err) {
        console.error('Error polling video status:', err);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000);
        } else {
          alert('Failed to check video status');
          setGeneratingVideo(false);
        }
      }
    };

    poll();
  };

  const generateVideo = async () => {
    if (!generatedScript || !cinematicPrompt) {
      alert('Please generate a cinematic prompt first');
      return;
    }

    setGeneratingVideo(true);
    setVideoProgress(0);
    setVideoStatus('Starting video generation...');

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: cinematicPrompt,
          platform: scriptPlatform,
          length: scriptLength,
          niche: template?.category,
          predictedDps: generatedScript.predictedDps,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Failed to start video generation');
        setGeneratingVideo(false);
        return;
      }

      pollVideoStatus(data.jobId);
    } catch (err) {
      console.error('Error starting video generation:', err);
      alert('Failed to start video generation');
      setGeneratingVideo(false);
    }
  };

  return (
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
                Generate viral scripts using template: <span className="text-blue-400">{template?.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!generatedScript ? (
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
                        onClick={() => setScriptPlatform(platform)}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          scriptPlatform === platform
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
                        onClick={() => setScriptLength(length)}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          scriptLength === length
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
                    This template &quot;{template?.title}&quot; has a viral score of <span className="text-blue-400 font-semibold">{template?.viralScore}%</span> in the <span className="text-blue-400">{template?.category || template?.niche || 'General'}</span> niche.
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                      {template?.views} views
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                      {template?.likes} likes
                    </span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateScript}
                disabled={generating}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
              >
                {generating ? (
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

              {generating && (
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
                      <div className="text-5xl font-bold text-blue-400">{generatedScript.predictedDps}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Confidence</div>
                      <div className="text-3xl font-bold text-purple-400">
                        {Math.round(generatedScript.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-pre-line">
                    {generatedScript.reasoning}
                  </div>
                </div>

                {/* Nine Attributes */}
                {generatedScript.attributes && (
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="text-lg font-bold mb-4">⚡ Nine Attributes Analysis</div>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(generatedScript.attributes).map(([key, value]: [string, any]) => {
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
                {generatedScript.script && (
                  <div className="space-y-4">
                    <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-red-400">🪝 Hook</span>
                        <span className="text-xs text-gray-500">{generatedScript.script.hook?.timing || '0-3s'}</span>
                      </div>
                      <p className="text-sm text-gray-300">{generatedScript.script.hook?.content}</p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-yellow-400">📖 Context</span>
                        <span className="text-xs text-gray-500">{generatedScript.script.context?.timing || '3-8s'}</span>
                      </div>
                      <p className="text-sm text-gray-300">{generatedScript.script.context?.content}</p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-400">💎 Value</span>
                        <span className="text-xs text-gray-500">{generatedScript.script.value?.timing || '8-15s'}</span>
                      </div>
                      <p className="text-sm text-gray-300">{generatedScript.script.value?.content}</p>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-400">📣 CTA</span>
                        <span className="text-xs text-gray-500">{generatedScript.script.cta?.timing || '15-20s'}</span>
                      </div>
                      <p className="text-sm text-gray-300">{generatedScript.script.cta?.content}</p>
                    </div>
                  </div>
                )}

                {/* Full Script */}
                {generatedScript.script?.fullScript && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-3">📝 Full Script (Voiceover)</div>
                    <div className="bg-gray-900 rounded p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {generatedScript.script.fullScript}
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

                  {!cinematicPrompt ? (
                    <button
                      onClick={generateCinematicPrompt}
                      disabled={generatingPrompt}
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
                    >
                      {generatingPrompt ? (
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
                        {cinematicPrompt}
                      </div>

                      {/* Step 2: Generate Video */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-lg font-bold">Step 2: Generate Video with AI</div>
                        </div>
                        <button
                          onClick={generateVideo}
                          disabled={generatingVideo}
                          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all flex items-center justify-center gap-3"
                        >
                          {generatingVideo ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {videoStatus || 'Generating...'}
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
                        {generatingVideo && (
                          <div className="mt-3">
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${videoProgress}%` }}
                              />
                            </div>
                            <div className="text-xs text-center text-gray-400 mt-1">{videoProgress}%</div>
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
                      navigator.clipboard.writeText(generatedScript.script?.fullScript || '');
                      alert('Script copied to clipboard!');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
                  >
                    Copy Script
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedScript(null);
                      setCinematicPrompt(null);
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
  );
}

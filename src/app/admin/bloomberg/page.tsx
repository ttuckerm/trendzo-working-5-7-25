'use client';

import { TrendingUp, Zap, Video, Clock, Eye, Flame, X, BarChart, Activity, Sparkles, Loader2, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Pattern {
  id?: string;
  pattern: string;
  dps: number;
  change: string;
  velocity: 'Fast' | 'Accelerating' | 'Explosive' | 'Steady' | 'Declining';
  niche: string;
  confidence: number;
  count: number;
  source?: string;
  sourceVideoId?: string;
}

interface WatchlistItem {
  id: string;
  niche: string;
  avgDps: number;
  change: string;
  videoCount: number;
}

interface VideoFeed {
  id: string;
  videoId: string;
  url: string;
  title: string;
  thumbnail: string | null;
  creator: string;
  niche: string;
  views: number;
  likes: number;
  dps: number;
  timeAgo: string;
}

interface PlatformWeather {
  name: string;
  multiplier: string;
  status: 'Generous' | 'Normal' | 'Harsh';
  description: string;
}

interface AlgorithmWeather {
  platforms: PlatformWeather[];
  sentiment: {
    value: number;
    label: string;
  };
  avgDps: number;
}

interface MarketStats {
  viralThreshold: {
    value: number;
    change: string;
    description: string;
  };
  activePatterns: {
    value: number;
    newToday: number;
    description: string;
  };
  viralVelocity: {
    value: number;
    change: string;
    description: string;
    trend: string;
  };
  marketActivity: {
    value: number;
    total: number;
    peakNiche: string;
    description: string;
  };
}

export default function BloombergTerminal() {
  const router = useRouter();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [patternsMetadata, setPatternsMetadata] = useState<{ source?: string; totalAnalyzed?: number } | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [showAddNiche, setShowAddNiche] = useState(false);
  const [newNiche, setNewNiche] = useState('');
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);
  const [nichesLoading, setNichesLoading] = useState(false);
  const [feed, setFeed] = useState<VideoFeed[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [weather, setWeather] = useState<AlgorithmWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Script generation state
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [scriptPlatform, setScriptPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [scriptLength, setScriptLength] = useState<15 | 30 | 60>(15);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);

  // Video generation state
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Optimization state
  const [showOptimization, setShowOptimization] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<number[]>([]);
  const [optimizing, setOptimizing] = useState(false);

  // Prompt generation state
  const [cinematicPrompt, setCinematicPrompt] = useState<string>('');
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  // Direct Video Idea Mode (bypasses pattern selection)
  const [showDirectPromptModal, setShowDirectPromptModal] = useState(false);
  const [directVideoIdea, setDirectVideoIdea] = useState('');
  const [directPromptResult, setDirectPromptResult] = useState<any>(null);
  const [generatingDirectPrompt, setGeneratingDirectPrompt] = useState(false);
  const [directPromptConstraints, setDirectPromptConstraints] = useState({
    no_dialogue: false,
    specific_style: '',
    genre_override: '',
  });

  // Mini Apps state
  const [recommendedApps, setRecommendedApps] = useState<any[]>([]);
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const [topApps, setTopApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Thumbnail recovery state
  const [resolvedThumbnails, setResolvedThumbnails] = useState<Record<string, string>>({});

  const resolveThumbnail = async (videoId: string, force = false) => {
    if (resolvedThumbnails[videoId] && !force) return;

    try {
      const response = await fetch(`/api/thumbnails/resolve?video_id=${videoId}&force=${force}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.thumbnail_url) {
          setResolvedThumbnails(prev => ({
            ...prev,
            [videoId]: data.thumbnail_url
          }));
        }
      }
    } catch (err) {
      console.log(`Failed to resolve thumbnail for ${videoId}:`, err);
    }
  };

  useEffect(() => {
    // Fetch all data
    fetchPatterns();
    fetchWatchlist();
    fetchFeed();
    fetchWeather();
    fetchMarketStats();
    fetchAvailableNiches();
    fetchInstalledApps();
    fetchTopApps();
  }, []);

  const fetchPatterns = () => {
    fetch('/api/bloomberg/patterns')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPatterns(data.patterns);
          setPatternsMetadata(data.metadata || null);
        }
      })
      .catch(err => console.error('Failed to fetch patterns:', err))
      .finally(() => setPatternsLoading(false));
  };

  const fetchWatchlist = () => {
    fetch('/api/bloomberg/watchlist?creatorId=default_user')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWatchlist(data.items);
        }
      })
      .catch(err => console.error('Failed to fetch watchlist:', err))
      .finally(() => setWatchlistLoading(false));
  };

  const fetchFeed = () => {
    fetch('/api/bloomberg/feed?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeed(data.feed);
        }
      })
      .catch(err => console.error('Failed to fetch feed:', err))
      .finally(() => setFeedLoading(false));
  };

  const fetchWeather = () => {
    fetch('/api/bloomberg/weather')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWeather(data.weather);
        }
      })
      .catch(err => console.error('Failed to fetch weather:', err))
      .finally(() => setWeatherLoading(false));
  };

  const fetchMarketStats = () => {
    fetch('/api/bloomberg/market-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMarketStats(data.stats);
        }
      })
      .catch(err => console.error('Failed to fetch market stats:', err))
      .finally(() => setStatsLoading(false));
  };

  const fetchAvailableNiches = () => {
    setNichesLoading(true);
    fetch('/api/bloomberg/available-niches')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableNiches(data.niches);
        }
      })
      .catch(err => console.error('Failed to fetch available niches:', err))
      .finally(() => setNichesLoading(false));
  };

  const addToWatchlist = async () => {
    if (!newNiche.trim()) return;

    try {
      const res = await fetch('/api/bloomberg/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: newNiche, creatorId: 'default_user' })
      });

      const data = await res.json();

      if (data.success) {
        setNewNiche('');
        setShowAddNiche(false);
        fetchWatchlist();
      } else {
        alert(data.error || 'Failed to add niche');
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      alert('Failed to add niche');
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      const res = await fetch(`/api/bloomberg/watchlist?id=${id}&creatorId=default_user`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        fetchWatchlist();
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  // Fetch recommended mini apps based on niche
  const fetchRecommendedApps = async (niche: string | undefined) => {
    if (!niche) {
      setRecommendedApps([]);
      return;
    }

    setAppsLoading(true);
    try {
      const res = await fetch(`/api/bloomberg/marketplace/recommended?niche=${encodeURIComponent(niche)}`);
      const data = await res.json();

      if (data.success) {
        setRecommendedApps(data.apps || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommended apps:', err);
      // Fallback: fetch all active apps and filter by category
      try {
        const res = await fetch('/api/bloomberg/marketplace?status=active&limit=3');
        const data = await res.json();
        if (data.success) {
          setRecommendedApps(data.apps || []);
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }
    } finally {
      setAppsLoading(false);
    }
  };

  // Fetch installed apps for the current user
  const fetchInstalledApps = async () => {
    const userId = 'default_user';
    try {
      const res = await fetch(`/api/bloomberg/marketplace/installed?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setInstalledApps(data.apps || []);
      }
    } catch (err) {
      console.error('Failed to fetch installed apps:', err);
    }
  };

  // Fetch top apps for the sidebar
  const fetchTopApps = async () => {
    try {
      const res = await fetch('/api/bloomberg/marketplace?status=active&limit=3');
      const data = await res.json();

      if (data.success) {
        setTopApps(data.apps || []);
      }
    } catch (err) {
      console.error('Failed to fetch top apps:', err);
    }
  };

  // Fetch recommended apps when modal opens with a niche
  useEffect(() => {
    if (showScriptModal && selectedPattern?.niche) {
      fetchRecommendedApps(selectedPattern.niche);
    }
  }, [showScriptModal, selectedPattern?.niche]);

  const openScriptGenerator = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    setGeneratedScript(null);
    setShowScriptModal(true);
  };

  const generateScript = async () => {
    if (!selectedPattern) return;

    setGeneratingScript(true);
    try {
      const res = await fetch('/api/generate/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: selectedPattern.pattern,
          platform: scriptPlatform,
          length: scriptLength,
          niche: selectedPattern.niche,
          patternId: selectedPattern.id, // Pass pattern ID for real DNA lookup
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedScript(data.data);
        console.log('[Script Gen] Pattern metadata:', data.data.patternMetadata);
      } else {
        alert(data.error || 'Failed to generate script');
      }
    } catch (err) {
      console.error('Error generating script:', err);
      alert('Failed to generate script');
    } finally {
      setGeneratingScript(false);
    }
  };

  const closeScriptModal = () => {
    setShowScriptModal(false);
    setSelectedPattern(null);
    setGeneratedScript(null);
    setScriptPlatform('tiktok');
    setScriptLength(15);
    setGeneratingVideo(false);
    setVideoJobId(null);
    setVideoStatus('');
    setVideoProgress(0);
    setGeneratedVideoUrl(null);
    setShowOptimization(false);
    setSelectedRecommendations([]);
  };

  const applyOptimizations = async () => {
    if (!generatedScript || selectedRecommendations.length === 0) return;

    setOptimizing(true);

    try {
      const selectedRecs = selectedRecommendations.map(idx => generatedScript.recommendations[idx]);

      const res = await fetch('/api/generate/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalScript: generatedScript.script,
          selectedRecommendations: selectedRecs,
          platform: scriptPlatform,
          length: scriptLength,
          niche: selectedPattern?.niche || 'General',
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Calculate improved DPS based on applied optimizations
        const previousDps = generatedScript.predictedDps;
        const selectedRecs = selectedRecommendations.map(idx => generatedScript.recommendations[idx]);
        
        // Calculate DPS boost from selected recommendations
        let dpsBoost = 0;
        for (const rec of selectedRecs) {
          const impactMatch = rec.impact.match(/\+(\d+\.?\d*)/);
          if (impactMatch) {
            dpsBoost += parseFloat(impactMatch[1]);
          }
        }

        // Update attributes based on recommendations
        const newAttributes = { ...generatedScript.attributes };
        for (const rec of selectedRecs) {
          if (newAttributes[rec.attribute] !== undefined) {
            newAttributes[rec.attribute] = Math.min(rec.target, 1.0);
          }
        }

        // Calculate new DPS (capped at 100)
        const newDps = Math.min(previousDps + dpsBoost, 100);

        // Filter out applied recommendations
        const remainingRecommendations = generatedScript.recommendations.filter(
          (_: any, idx: number) => !selectedRecommendations.includes(idx)
        );

        // Update with optimized content and improved scores
        setGeneratedScript({
          ...generatedScript,
          script: data.data.optimizedScript,
          predictedDps: Math.round(newDps * 10) / 10,
          confidence: Math.min(generatedScript.confidence + 0.02, 0.99),
          attributes: newAttributes,
          recommendations: remainingRecommendations,
        });

        setShowOptimization(false);
        setSelectedRecommendations([]);
        alert(`Script optimized! DPS: ${previousDps} → ${Math.round(newDps * 10) / 10} (+${dpsBoost.toFixed(1)})`);
      } else {
        alert(data.error || 'Failed to optimize script');
      }
    } catch (error) {
      console.error('Failed to optimize script:', error);
      alert('Failed to optimize script');
    } finally {
      setOptimizing(false);
    }
  };

  const generateCinematicPrompt = async () => {
    if (!generatedScript) return;

    setGeneratingPrompt(true);
    setShowPromptGenerator(true);

    try {
      // Extract viral patterns from Nine Attributes
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
            niche: selectedPattern?.niche || 'General',
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

  const generateVideo = async () => {
    if (!generatedScript || !cinematicPrompt) {
      alert('Please generate a cinematic prompt first');
      return;
    }

    setGeneratingVideo(true);
    setVideoProgress(0);
    setVideoStatus('Starting video generation...');

    try {
      // Start video generation job with cinematic prompt
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: cinematicPrompt, // Use cinematic prompt instead of raw script
          platform: scriptPlatform,
          length: scriptLength,
          niche: selectedPattern?.niche,
          predictedDps: generatedScript.predictedDps,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        // Handle fallback case when Kling API is not configured
        if (data.fallback) {
          setVideoStatus('API not configured');
          setGeneratingVideo(false);
          // Show a more user-friendly message
          alert(`${data.message}\n\nYou can copy the cinematic prompt above and use it with:\n• Runway ML\n• Sora\n• Kling AI\n• Pika Labs`);
          return;
        }
        alert(data.error || 'Failed to start video generation');
        setGeneratingVideo(false);
        return;
      }

      const jobId = data.jobId;
      setVideoJobId(jobId);
      setVideoStatus('Video generation started...');

      // Start polling for completion
      pollVideoStatus(jobId);

    } catch (err) {
      console.error('Error starting video generation:', err);
      alert('Failed to start video generation');
      setGeneratingVideo(false);
    }
  };

  // Generate cinematic prompt directly from user's video idea
  const generateDirectCinematicPrompt = async () => {
    if (!directVideoIdea.trim()) {
      alert('Please enter a video idea or concept');
      return;
    }

    setGeneratingDirectPrompt(true);

    try {
      const res = await fetch('/api/prompt-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: directVideoIdea.trim(),
          constraints: {
            no_dialogue: directPromptConstraints.no_dialogue,
            specific_style: directPromptConstraints.specific_style || undefined,
            genre_override: directPromptConstraints.genre_override || undefined,
          },
          use_smart_detection: true, // Use GPT-4o-mini for smart genre detection
        }),
      });

      const data = await res.json();

      if (data.success) {
        setDirectPromptResult(data.data);
      } else {
        alert(data.error || 'Failed to generate cinematic prompt');
      }
    } catch (error) {
      console.error('Failed to generate direct prompt:', error);
      alert('Failed to generate cinematic prompt');
    } finally {
      setGeneratingDirectPrompt(false);
    }
  };

  const closeDirectPromptModal = () => {
    setShowDirectPromptModal(false);
    setDirectVideoIdea('');
    setDirectPromptResult(null);
    setDirectPromptConstraints({
      no_dialogue: false,
      specific_style: '',
      genre_override: '',
    });
  };

  const pollVideoStatus = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes max (every 5 seconds)
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
          setGeneratedVideoUrl(job.videoUrl);
          setGeneratingVideo(false);
          setVideoStatus('Video generated successfully!');
          return;
        }

        if (job.status === 'failed') {
          alert(`Video generation failed: ${job.error || 'Unknown error'}`);
          setGeneratingVideo(false);
          return;
        }

        // Continue polling if still processing
        if (attempts < maxAttempts && (job.status === 'pending' || job.status === 'submitted' || job.status === 'processing')) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bloomberg Terminal</h1>
            <p className="text-gray-400">Market-wide viral intelligence dashboard</p>
          </div>
          <button
            onClick={() => router.push('/admin/creators')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <BarChart className="w-5 h-5" />
            View Creators
          </button>
        </div>

        {/* Market Intelligence Stats - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Platform Viral Threshold */}
          <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-850 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Platform Viral Threshold</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : `${marketStats?.viralThreshold.value || 72.3} DPS`}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              {marketStats?.viralThreshold.description || 'Videos need 72+ to go viral today'}
            </p>
            <p className={`text-sm font-semibold ${
              marketStats?.viralThreshold.change.startsWith('+') ? 'text-red-400' : 'text-green-400'
            }`}>
              {marketStats?.viralThreshold.change || '+12%'} vs last week
            </p>
          </div>

          {/* Active Patterns */}
          <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-850 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Patterns</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : marketStats?.activePatterns.value || 147}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              {marketStats?.activePatterns.description || 'Trending patterns detected'}
            </p>
            <p className="text-green-400 text-sm font-semibold">
              {marketStats?.activePatterns.newToday || 23} new today
            </p>
          </div>

          {/* Viral Velocity */}
          <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-850 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Viral Velocity</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : `${marketStats?.viralVelocity.value || 6.2} hrs`}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              {marketStats?.viralVelocity.description || 'Avg time to viral status'}
            </p>
            <p className={`text-sm font-semibold ${
              marketStats?.viralVelocity.trend === 'faster' ? 'text-green-400' : 'text-red-400'
            }`}>
              {marketStats?.viralVelocity.change || '↓18%'} ({marketStats?.viralVelocity.trend || 'faster'} than usual)
            </p>
          </div>

          {/* Market Activity */}
          <div className="bg-gray-900 rounded-xl p-6 hover:bg-gray-850 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Market Activity</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : marketStats?.marketActivity.value.toLocaleString() || '8,453'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              {marketStats?.marketActivity.description || 'Videos analyzed today'}
            </p>
            <p className="text-blue-400 text-sm font-semibold">
              Peak: {marketStats?.marketActivity.peakNiche || 'Fitness'} niche
            </p>
          </div>
        </div>

        {/* Main Grid: Left (70%) + Right Sidebar (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trending Patterns */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Flame className="w-6 h-6 text-orange-400" />
                  Breaking Out Right Now
                </h2>
                <div className="flex items-center gap-3">
                  {patternsMetadata?.source === 'viral_genomes' && (
                    <span className="text-green-400 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Real data from {patternsMetadata.totalAnalyzed} analyzed videos
                    </span>
                  )}
                  {patternsMetadata?.source === 'scraped_videos_fallback' && (
                    <span className="text-yellow-400 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      Fallback data
                    </span>
                  )}
                  {patternsMetadata?.source === 'no_data' && (
                    <span className="text-red-400 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      No data - run extraction
                    </span>
                  )}
                  <span className="text-gray-400 text-sm">Updated just now</span>
                </div>
              </div>

              <div className="space-y-3">
                {patternsLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-700 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                        </div>
                        <div className="h-8 bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))
                ) : patterns.length > 0 ? (
                  patterns.map((pattern, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold text-lg">{pattern.pattern}</div>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                              {pattern.niche}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`font-semibold ${pattern.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                              {pattern.change}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              pattern.velocity === 'Explosive' ? 'bg-red-500/20 text-red-300' :
                              pattern.velocity === 'Accelerating' ? 'bg-orange-500/20 text-orange-300' :
                              pattern.velocity === 'Fast' ? 'bg-yellow-500/20 text-yellow-300' :
                              pattern.velocity === 'Steady' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {pattern.velocity}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {Math.round(pattern.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <div className="text-3xl font-bold text-blue-400">{pattern.dps}</div>
                            <div className="text-xs text-gray-400">Avg DPS</div>
                          </div>
                          <button
                            onClick={() => openScriptGenerator(pattern)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Flame className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-1">No trending patterns detected yet</p>
                    <p className="text-sm">Add more videos to discover patterns</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Video Feed */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Eye className="w-6 h-6 text-blue-400" />
                  Going Viral Right Now
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400 text-sm">Live across platform</span>
                </div>
              </div>

              <div className="space-y-3">
                {feedLoading ? (
                  [1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-gray-700 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : feed.length > 0 ? (
                  feed.map((video) => (
                    <div key={video.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {(video.thumbnail || resolvedThumbnails[video.id]) ? (
                            <img 
                              src={resolvedThumbnails[video.id] || video.thumbnail} 
                              alt={video.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(`Image failed for ${video.id}, resolving...`);
                                resolveThumbnail(video.id, true);
                              }}
                            />
                          ) : (
                            <Video className="w-8 h-8 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold mb-1 line-clamp-2">{video.title}</div>
                          <div className="text-sm text-gray-400 mb-2">
                            @{video.creator} • {video.niche} • {video.timeAgo}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{video.views.toLocaleString()} views</span>
                            <span>•</span>
                            <span>{video.likes.toLocaleString()} likes</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-400">{video.dps.toFixed(1)}</div>
                          <div className="text-xs text-gray-400 mb-2">DPS</div>
                          <button
                            onClick={() => {
                              setSelectedPattern({
                                pattern: video.title,
                                dps: video.dps,
                                niche: video.niche,
                                change: '+0%',
                                velocity: 'Fast' as const,
                                confidence: 0.9,
                                count: 1
                              });
                              setShowScriptModal(true);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Generate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-1">No viral videos yet</p>
                    <p className="text-sm">Videos will appear here as they go viral across the platform</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Algorithm Weather */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <Zap className="w-6 h-6 text-yellow-400" />
                Algorithm Weather
              </h2>

              {weatherLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                      <div className="h-5 bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : weather ? (
                <>
                  <div className="space-y-3 mb-6">
                    {weather.platforms.map((platform, i) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{platform.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            platform.status === 'Generous' ? 'bg-green-500/20 text-green-300' :
                            platform.status === 'Harsh' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {platform.status}
                          </span>
                        </div>
                        <div className="text-2xl font-bold mb-1">{platform.multiplier}</div>
                        <div className="text-xs text-gray-400">{platform.description}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">Market Sentiment</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-2 transition-all"
                          style={{ width: `${weather.sentiment.value}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold">{weather.sentiment.label}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Unable to load weather data</p>
                </div>
              )}
            </div>

            {/* Watchlist */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Watchlist</h2>
                <button
                  onClick={() => setShowAddNiche(!showAddNiche)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
                >
                  + Add
                </button>
              </div>

              {showAddNiche && (
                <div className="mb-4 space-y-2">
                  {nichesLoading ? (
                    <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
                      Loading niches...
                    </div>
                  ) : availableNiches.length > 0 ? (
                    <select
                      value={newNiche}
                      onChange={(e) => setNewNiche(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
                    >
                      <option value="">Select a niche...</option>
                      {availableNiches.map((niche) => (
                        <option key={niche} value={niche}>
                          {niche}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
                      No niches available. Add creators with niches first.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={addToWatchlist}
                      disabled={!newNiche || nichesLoading}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddNiche(false);
                        setNewNiche('');
                      }}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {watchlistLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-3 animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : watchlist.length > 0 ? (
                <div className="space-y-2">
                  {watchlist.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold">{item.niche}</div>
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-semibold">{item.avgDps}</span>
                          <span className="text-gray-400">DPS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${item.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                            {item.change}
                          </span>
                          <span className="text-gray-500 text-xs">·</span>
                          <span className="text-gray-400 text-xs">{item.videoCount} videos</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-400 mb-3">No niches in watchlist</div>
                  <button
                    onClick={() => setShowAddNiche(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Add Niche
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {/* NEW: Create from Your Idea */}
                <button
                  onClick={() => setShowDirectPromptModal(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg font-semibold transition-colors text-left flex items-center justify-between"
                >
                  <span>✨ Create Video from Idea</span>
                  <Sparkles className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/admin/upload-test')}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-left flex items-center justify-between"
                >
                  <span>Analyze New Video</span>
                  <Video className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/admin/creators')}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left flex items-center justify-between"
                >
                  <span>View All Creators</span>
                  <TrendingUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/admin/bloomberg/marketplace')}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-left flex items-center justify-between"
                >
                  <span>🏪 Mini App Store</span>
                  <Store className="w-5 h-5" />
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors text-left flex items-center justify-between">
                  <span>Export Report</span>
                  <BarChart className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top Mini Apps */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🏆 Top Mini Apps</h2>
                <button
                  onClick={() => router.push('/admin/bloomberg/marketplace')}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View All
                </button>
              </div>
              {topApps.length > 0 ? (
                <div className="space-y-3">
                  {topApps.slice(0, 3).map((app: any, index: number) => (
                    <div
                      key={app.id}
                      className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => router.push(`/admin/bloomberg/marketplace?app=${app.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="text-2xl mb-1">{app.icon || '📦'}</div>
                          <div className="text-xs text-gray-500">#{index + 1}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 truncate">{app.name}</h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                            {app.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-purple-400 font-semibold">
                              ${app.price}/mo
                            </span>
                            <div className="flex items-center gap-2 text-gray-500">
                              <span>⭐ {app.rating || 4.5}</span>
                              <span>•</span>
                              <span>{app.install_count || 0} installs</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Store className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-400 mb-3">Browse mini apps to enhance your workflow</div>
                  <button
                    onClick={() => router.push('/admin/bloomberg/marketplace')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Explore Marketplace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Video Idea to Cinematic Prompt Modal */}
      {showDirectPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Cinematic Prompt Generator</h2>
                  <p className="text-sm text-gray-400">
                    Transform any video idea into a production-ready Sora/Runway prompt
                  </p>
                </div>
              </div>
              <button
                onClick={closeDirectPromptModal}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!directPromptResult ? (
                <div className="space-y-6">
                  {/* Video Idea Input */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Describe Your Video Idea
                    </label>
                    <textarea
                      value={directVideoIdea}
                      onChange={(e) => setDirectVideoIdea(e.target.value)}
                      placeholder="Example: A dramatic slow-motion shot of a lone figure walking through a neon-lit Tokyo alley at night during rain. The camera follows from behind, revealing reflections in puddles..."
                      className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Be as descriptive as possible. Include mood, setting, camera movements, lighting, and any specific visual elements.
                    </p>
                  </div>

                  {/* Constraints */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Genre Override */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Genre (Optional)</label>
                      <select
                        value={directPromptConstraints.genre_override}
                        onChange={(e) => setDirectPromptConstraints({
                          ...directPromptConstraints,
                          genre_override: e.target.value
                        })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">Auto-detect</option>
                        <option value="horror">Horror</option>
                        <option value="action">Action</option>
                        <option value="sci-fi">Sci-Fi</option>
                        <option value="romance">Romance</option>
                        <option value="documentary">Documentary</option>
                        <option value="comedy">Comedy</option>
                        <option value="drama">Drama</option>
                        <option value="thriller">Thriller</option>
                      </select>
                    </div>

                    {/* Style */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Visual Style (Optional)</label>
                      <input
                        type="text"
                        value={directPromptConstraints.specific_style}
                        onChange={(e) => setDirectPromptConstraints({
                          ...directPromptConstraints,
                          specific_style: e.target.value
                        })}
                        placeholder="e.g., hand-drawn, anime, cyberpunk"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* No Dialogue Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="no-dialogue"
                      checked={directPromptConstraints.no_dialogue}
                      onChange={(e) => setDirectPromptConstraints({
                        ...directPromptConstraints,
                        no_dialogue: e.target.checked
                      })}
                      className="w-5 h-5 bg-gray-800 border border-gray-700 rounded"
                    />
                    <label htmlFor="no-dialogue" className="text-sm">
                      No dialogue (cinematic visuals only)
                    </label>
                  </div>

                  {/* Example Prompts */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-3">💡 Example Ideas</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Hyper-realistic drone shot of a person standing on a cliff edge at sunset',
                        'Noir-style detective walking through foggy streets with neon signs',
                        'Epic fantasy battle scene with dragons and armies clashing',
                        'Peaceful Japanese garden with cherry blossoms falling slowly'
                      ].map((example, i) => (
                        <button
                          key={i}
                          onClick={() => setDirectVideoIdea(example)}
                          className="text-left text-xs text-gray-400 hover:text-white p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          "{example}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateDirectCinematicPrompt}
                    disabled={!directVideoIdea.trim() || generatingDirectPrompt}
                    className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
                  >
                    {generatingDirectPrompt ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Cinematic Prompt...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Cinematic Prompt
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Reasoning/Analysis */}
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-sm font-semibold text-cyan-400">🎬 AI Analysis</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Detected Genre</div>
                        <div className="font-semibold capitalize">{directPromptResult.reasoning?.detected_genre || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Mood</div>
                        <div className="font-semibold capitalize">{directPromptResult.reasoning?.detected_mood || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Expected DPS Impact</div>
                        <div className="font-semibold text-blue-400">{directPromptResult.dps_alignment?.expected_impact || 60}+</div>
                      </div>
                    </div>
                    {directPromptResult.reasoning?.smart_analysis && (
                      <div className="mt-4 text-xs text-gray-400 border-t border-gray-700 pt-4">
                        {directPromptResult.reasoning.smart_analysis}
                      </div>
                    )}
                  </div>

                  {/* The Cinematic Prompt */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-bold">✨ Production-Ready Cinematic Prompt</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(directPromptResult.cinematic_prompt);
                          alert('Copied to clipboard! Paste this into Sora, Runway, or Kling AI.');
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy Prompt
                      </button>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-700">
                      {directPromptResult.cinematic_prompt}
                    </div>
                  </div>

                  {/* Structured Data Preview */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-3">📋 Prompt Structure</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-gray-800 rounded p-2">
                        <div className="text-gray-500">Lighting</div>
                        <div className="text-gray-300 truncate">{directPromptResult.structured_data?.lighting?.substring(0, 30)}...</div>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <div className="text-gray-500">Camera</div>
                        <div className="text-gray-300 truncate">{directPromptResult.structured_data?.camera?.substring(0, 30)}...</div>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <div className="text-gray-500">Visual Style</div>
                        <div className="text-gray-300 truncate">{directPromptResult.structured_data?.visual_taste?.substring(0, 30)}...</div>
                      </div>
                      <div className="bg-gray-800 rounded p-2">
                        <div className="text-gray-500">BGM</div>
                        <div className="text-gray-300 truncate">{directPromptResult.structured_data?.bgm?.substring(0, 30)}...</div>
                      </div>
                    </div>
                  </div>

                  {/* Viral Elements Detected */}
                  {directPromptResult.dps_alignment?.predicted_elements?.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
                      <div className="text-sm font-semibold mb-2">🔥 Viral Elements Detected</div>
                      <div className="flex flex-wrap gap-2">
                        {directPromptResult.dps_alignment.predicted_elements.map((element: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usage Instructions */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-sm font-semibold text-blue-400 mb-2">📱 How to Use This Prompt</div>
                    <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Copy the cinematic prompt above</li>
                      <li>Go to <span className="text-white">Sora</span>, <span className="text-white">Runway ML</span>, <span className="text-white">Kling AI</span>, or <span className="text-white">Pika Labs</span></li>
                      <li>Paste the prompt in the video generation input</li>
                      <li>Generate your video!</li>
                    </ol>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDirectPromptResult(null)}
                      className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                    >
                      ← Modify Idea
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(directPromptResult.cinematic_prompt);
                        alert('Copied! Ready to paste into your AI video tool.');
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-colors"
                    >
                      Copy & Create Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Script Generation Modal */}
      {showScriptModal && (
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
                    Generate viral scripts using trending pattern: <span className="text-blue-400">{selectedPattern?.pattern}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeScriptModal}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Enhanced Step Indicator */}
              <div className="mb-8 bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  {/* Step 1: Configure */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 transition-all ${
                      !generatedScript 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {generatedScript ? '✓' : '1'}
                    </div>
                    <span className={`text-xs font-semibold ${!generatedScript ? 'text-blue-400' : 'text-green-400'}`}>Configure</span>
                  </div>
                  
                  {/* Connector 1-2 */}
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${generatedScript ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                  
                  {/* Step 2: Script */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 transition-all ${
                      generatedScript && !cinematicPrompt 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                        : cinematicPrompt
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-500'
                    }`}>
                      {cinematicPrompt ? '✓' : '2'}
                    </div>
                    <span className={`text-xs font-semibold ${
                      generatedScript && !cinematicPrompt ? 'text-blue-400' : cinematicPrompt ? 'text-green-400' : 'text-gray-500'
                    }`}>Script + Prompt</span>
                  </div>
                  
                  {/* Connector 2-3 */}
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${cinematicPrompt ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                  
                  {/* Step 3: Create */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 transition-all ${
                      cinematicPrompt
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-700 text-gray-500'
                    }`}>
                      {generatedVideoUrl ? '✓' : '3'}
                    </div>
                    <span className={`text-xs font-semibold ${cinematicPrompt ? 'text-purple-400' : 'text-gray-500'}`}>Create Video</span>
                  </div>
                </div>
                
                {/* Current Step Description */}
                <div className="text-center mt-4 text-sm text-gray-400">
                  {!generatedScript && 'Configure your video settings to get started'}
                  {generatedScript && !cinematicPrompt && '✨ Script ready! Generate cinematic prompt to continue'}
                  {cinematicPrompt && !generatedVideoUrl && '🎬 Ready to create your AI video!'}
                  {generatedVideoUrl && '✅ Video generated successfully!'}
                </div>
              </div>

              {!generatedScript ? (
                <>
                  {/* Configuration */}
                  <div className="space-y-6 mb-6">
                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm font-semibold mb-3">Platform</label>
                      <div className="grid grid-cols-3 gap-3">
                        {/* TikTok - Active */}
                        <button
                          onClick={() => setScriptPlatform('tiktok')}
                          className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                            scriptPlatform === 'tiktok'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
                          }`}
                        >
                          TikTok
                        </button>
                        {/* Instagram - Coming Soon */}
                        <button
                          disabled
                          className="px-4 py-3 rounded-lg font-semibold bg-gray-800/50 text-gray-600 cursor-not-allowed relative"
                        >
                          Instagram
                          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded-full">Soon</span>
                        </button>
                        {/* YouTube Shorts - Coming Soon */}
                        <button
                          disabled
                          className="px-4 py-3 rounded-lg font-semibold bg-gray-800/50 text-gray-600 cursor-not-allowed relative"
                        >
                          YT Shorts
                          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded-full">Soon</span>
                        </button>
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

                    {/* Pattern Context */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm font-semibold mb-2">Pattern Context</div>
                      <div className="text-sm text-gray-400 mb-3">
                        This trending pattern has an average DPS of <span className="text-blue-400 font-semibold">{selectedPattern?.dps}</span> and is currently {selectedPattern?.velocity.toLowerCase()} in the <span className="text-blue-400">{selectedPattern?.niche}</span> niche.
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                          {selectedPattern?.count} videos
                        </span>
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                          {selectedPattern?.change} trending
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateScript}
                    disabled={generatingScript}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
                  >
                    {generatingScript ? (
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

                  {generatingScript && (
                    <div className="mt-4 text-center text-sm text-gray-400">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>Analyzing trending pattern...</span>
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
                      
                      {/* Pattern Source Indicator */}
                      {generatedScript.patternMetadata && (
                        <div className="mb-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            {generatedScript.patternMetadata.source?.includes('viral_genomes') ? (
                              <>
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-green-400 text-xs font-semibold">
                                  ✓ Generated from REAL Viral Pattern DNA
                                </span>
                              </>
                            ) : generatedScript.patternMetadata.source === 'scraped_videos_fallback' ? (
                              <>
                                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                <span className="text-yellow-400 text-xs font-semibold">
                                  ⚠️ Using scraped video examples (no patterns for this niche)
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                <span className="text-gray-400 text-xs font-semibold">
                                  Generated without pattern data
                                </span>
                              </>
                            )}
                          </div>
                          {generatedScript.patternMetadata.source?.includes('viral_genomes') && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-gray-400">
                                Pattern Type: <span className="text-white">{generatedScript.patternMetadata.primaryPatternType || 'N/A'}</span>
                              </div>
                              <div className="text-gray-400">
                                Source DPS: <span className="text-blue-400 font-semibold">{generatedScript.patternMetadata.primaryPatternDps?.toFixed(1) || 'N/A'}</span>
                              </div>
                              <div className="text-gray-400">
                                Patterns Used: <span className="text-white">{generatedScript.patternMetadata.patternsUsed || 0}</span>
                              </div>
                              <div className="text-gray-400">
                                Examples: <span className="text-white">{generatedScript.patternMetadata.exampleVideosUsed || 0}</span>
                              </div>
                              {generatedScript.patternMetadata.sourceVideoId && (
                                <div className="col-span-2 text-gray-400">
                                  Source Video: <span className="text-purple-400 font-mono">{generatedScript.patternMetadata.sourceVideoId.slice(-10)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400 whitespace-pre-line">
                        {generatedScript.reasoning}
                      </div>
                    </div>

                    {/* Nine Attributes & Optimization */}
                    {generatedScript.attributes && generatedScript.recommendations && generatedScript.recommendations.length > 0 && (
                      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-lg font-bold">⚡ Nine Attributes Analysis</div>
                          <button
                            onClick={() => setShowOptimization(!showOptimization)}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold text-sm transition-colors"
                          >
                            {showOptimization ? 'Hide' : 'Optimize Script'}
                          </button>
                        </div>

                        {/* Attributes Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
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

                        {/* Optimization Recommendations */}
                        {showOptimization && (
                          <div className="border-t border-gray-700 pt-4 space-y-3">
                            <div className="text-sm font-semibold mb-3">Select optimizations to apply:</div>
                            {generatedScript.recommendations.map((rec: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedRecommendations.includes(idx)
                                    ? 'bg-blue-500/20 border-blue-500'
                                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                }`}
                                onClick={() => {
                                  if (selectedRecommendations.includes(idx)) {
                                    setSelectedRecommendations(selectedRecommendations.filter(i => i !== idx));
                                  } else {
                                    setSelectedRecommendations([...selectedRecommendations, idx]);
                                  }
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedRecommendations.includes(idx)}
                                    onChange={() => {}}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-semibold text-sm capitalize">
                                        {rec.attribute.replace(/([A-Z])/g, ' $1').trim()}
                                      </div>
                                      <div className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                                        {rec.impact}
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-300 mb-2">{rec.suggestion}</div>
                                    <div className="text-xs text-gray-500 italic">{rec.example}</div>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Apply Button */}
                            <button
                              onClick={applyOptimizations}
                              disabled={selectedRecommendations.length === 0 || optimizing}
                              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
                            >
                              {optimizing ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Optimizing & Regenerating...
                                </span>
                              ) : (
                                `Apply ${selectedRecommendations.length} Optimization${selectedRecommendations.length !== 1 ? 's' : ''} & Regenerate`
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Script Sections */}
                    <div className="space-y-4">
                      {/* Hook */}
                      <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-red-400">🪝 {generatedScript.script.hook.section}</span>
                          <span className="text-xs text-gray-500">{generatedScript.script.hook.timing}</span>
                        </div>
                        <p className="text-sm text-gray-300">{generatedScript.script.hook.content}</p>
                      </div>

                      {/* Context */}
                      <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-yellow-400">📖 {generatedScript.script.context.section}</span>
                          <span className="text-xs text-gray-500">{generatedScript.script.context.timing}</span>
                        </div>
                        <p className="text-sm text-gray-300">{generatedScript.script.context.content}</p>
                      </div>

                      {/* Value */}
                      <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-green-400">💎 {generatedScript.script.value.section}</span>
                          <span className="text-xs text-gray-500">{generatedScript.script.value.timing}</span>
                        </div>
                        <p className="text-sm text-gray-300">{generatedScript.script.value.content}</p>
                      </div>

                      {/* CTA */}
                      <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-400">📣 {generatedScript.script.cta.section}</span>
                          <span className="text-xs text-gray-500">{generatedScript.script.cta.timing}</span>
                        </div>
                        <p className="text-sm text-gray-300">{generatedScript.script.cta.content}</p>
                      </div>
                    </div>

                    {/* Full Script */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">📝 Full Script (Voiceover)</div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedScript.script.fullScript);
                            alert('Script copied to clipboard!');
                          }}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Script
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono">
                        {generatedScript.script.fullScript}
                      </div>
                    </div>

                    {/* Quick Actions - Film Yourself Option */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-green-400">Ready to Film!</div>
                            <div className="text-xs text-gray-400">Copy the script above and start recording</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          ~{scriptLength}s video
                        </div>
                      </div>
                    </div>

                    {/* Cinematic Prompt Generation Section */}
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
                          <div className="bg-gray-900 rounded-lg p-4 border border-blue-500/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-semibold text-blue-400">✨ Production-Ready Prompt</div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(cinematicPrompt);
                                  alert('Copied to clipboard!');
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                            <div className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                              {cinematicPrompt}
                            </div>
                          </div>

                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <span className="text-lg">✅</span>
                              <span className="font-semibold">Prompt Ready!</span>
                              <span className="text-gray-400">Now proceed to video generation below</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setCinematicPrompt('');
                              setShowPromptGenerator(false);
                            }}
                            className="text-sm text-blue-400 hover:text-blue-300 underline"
                          >
                            Regenerate Prompt
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Video Generation Section */}
                    {!generatedVideoUrl && (
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-4">
                          <Video className="w-6 h-6 text-purple-400" />
                          <div>
                            <div className="text-lg font-bold">Step 2: Generate Video with AI</div>
                            <div className="text-sm text-gray-400">
                              {cinematicPrompt ? 'Use cinematic prompt with Kling AI' : 'Generate prompt first, then create video'}
                            </div>
                          </div>
                        </div>

                        {!generatingVideo ? (
                          <button
                            onClick={generateVideo}
                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
                          >
                            <Video className="w-5 h-5" />
                            Generate Video (~2 min)
                          </button>
                        ) : (
                          <div className="space-y-4">
                            {/* Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-400">{videoStatus}</span>
                                <span className="text-purple-400 font-semibold">{videoProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-3 transition-all duration-500"
                                  style={{ width: `${videoProgress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Status Messages */}
                            <div className="text-center text-sm text-gray-400">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                <span>This may take 2-3 minutes...</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 text-xs text-gray-500 text-center">
                          💰 Cost: ~6.6 credits (Free tier: 66 credits available)
                        </div>
                      </div>
                    )}

                    {/* Generated Video Display */}
                    {generatedVideoUrl && (
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/30">
                        <div className="flex items-center gap-3 mb-4">
                          <Video className="w-6 h-6 text-green-400" />
                          <div>
                            <div className="text-lg font-bold text-green-400">Video Generated Successfully! 🎉</div>
                            <div className="text-sm text-gray-400">Your AI-generated video is ready</div>
                          </div>
                        </div>

                        {/* Video Player */}
                        <div className="bg-black rounded-lg overflow-hidden mb-4">
                          <video
                            src={generatedVideoUrl}
                            controls
                            className="w-full"
                            style={{ maxHeight: '400px' }}
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>

                        {/* Video Actions */}
                        <div className="flex gap-3">
                          <a
                            href={generatedVideoUrl}
                            download
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-center"
                          >
                            Download Video
                          </a>
                          <button
                            onClick={() => {
                              setGeneratedVideoUrl(null);
                              setVideoProgress(0);
                            }}
                            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                          >
                            Generate Another
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedScript.script.fullScript);
                          alert('Script copied to clipboard!');
                        }}
                        className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        Copy Script
                      </button>
                      <button
                        onClick={() => setGeneratedScript(null)}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                      >
                        Generate New Script
                      </button>
                    </div>

                    {/* Browse Mini Apps CTA */}
                    <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Store className="w-6 h-6 text-purple-400" />
                          <div>
                            <h3 className="text-lg font-bold">Need Specialized Features?</h3>
                            <p className="text-sm text-gray-400">
                              Enhance your workflow with mini apps designed for {selectedPattern?.niche || 'your niche'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push('/admin/bloomberg/marketplace')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
                        >
                          Browse All Apps
                        </button>
                      </div>

                      {/* Recommended Apps */}
                      {appsLoading ? (
                        <div className="text-center py-4 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading recommended apps...
                        </div>
                      ) : recommendedApps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {recommendedApps.slice(0, 3).map((app: any) => (
                            <div
                              key={app.id}
                              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer"
                              onClick={() => router.push(`/admin/bloomberg/marketplace?app=${app.id}`)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-3xl">{app.icon || '📦'}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm mb-1 truncate">{app.name}</h4>
                                  <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                    {app.description}
                                  </p>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-purple-400 font-semibold">
                                      ${app.price}/mo
                                    </span>
                                    <span className="text-gray-500">
                                      ⭐ {app.rating || 4.5}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          No apps found for this niche yet. Check the full marketplace!
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

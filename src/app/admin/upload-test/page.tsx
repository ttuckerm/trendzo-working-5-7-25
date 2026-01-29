'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for fetching recent runs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type for recent prediction runs
interface RecentRun {
  run_id: string;
  video_id: string;
  status: string;
  predicted_dps_7d: number;
  predicted_tier_7d: string;
  confidence: number;
  latency_ms_total: number;
  transcription_source: string | null;
  transcription_confidence: number | null;
  transcription_latency_ms: number | null;
  transcription_skipped: boolean | null;
  transcription_skip_reason: string | null;
  pack1_meta: { source: string; provider: string; latency_ms: number } | null;
  pack2_meta: { source: string; provider: string; latency_ms: number } | null;
  created_at: string;
}

// Truck Loading Animation Component
const TruckLoader = () => (
  <div className="loader">
    <div className="truckWrapper">
      <div className="truckBody">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 198 93"
          className="trucksvg"
        >
          <path
            strokeWidth="3"
            stroke="#282828"
            fill="#F83D3D"
            d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
          ></path>
          <path
            strokeWidth="3"
            stroke="#282828"
            fill="#7D7C7C"
            d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
          ></path>
          <path
            strokeWidth="2"
            stroke="#282828"
            fill="#282828"
            d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
          ></path>
          <rect
            strokeWidth="2"
            stroke="#282828"
            fill="#FFFCAB"
            rx="1"
            height="7"
            width="5"
            y="63"
            x="187"
          ></rect>
          <rect
            strokeWidth="2"
            stroke="#282828"
            fill="#282828"
            rx="1"
            height="11"
            width="4"
            y="81"
            x="193"
          ></rect>
          <rect
            strokeWidth="3"
            stroke="#282828"
            fill="#DFDFDF"
            rx="2.5"
            height="90"
            width="121"
            y="1.5"
            x="6.5"
          ></rect>
          <rect
            strokeWidth="2"
            stroke="#282828"
            fill="#DFDFDF"
            rx="2"
            height="4"
            width="6"
            y="84"
            x="1"
          ></rect>
        </svg>
      </div>
      <div className="truckTires">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 30 30"
          className="tiresvg"
        >
          <circle
            strokeWidth="3"
            stroke="#282828"
            fill="#282828"
            r="13.5"
            cy="15"
            cx="15"
          ></circle>
          <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 30 30"
          className="tiresvg"
        >
          <circle
            strokeWidth="3"
            stroke="#282828"
            fill="#282828"
            r="13.5"
            cy="15"
            cx="15"
          ></circle>
          <circle fill="#DFDFDF" r="7" cy="15" cx="15"></circle>
        </svg>
      </div>
      <div className="road"></div>
      <svg
        xmlSpace="preserve"
        viewBox="0 0 453.459 453.459"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        xmlns="http://www.w3.org/2000/svg"
        id="Capa_1"
        version="1.1"
        fill="#000000"
        className="lampPost"
      >
        <path
          d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993
c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514
c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16
c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914
h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75
v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795
V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0z
M232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017
h78.747C231.693,100.736,232.77,106.162,232.77,111.694z"
        ></path>
      </svg>
    </div>
    <style jsx>{`
      .loader {
        width: fit-content;
        height: fit-content;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .truckWrapper {
        width: 200px;
        height: 100px;
        display: flex;
        flex-direction: column;
        position: relative;
        align-items: center;
        justify-content: flex-end;
        overflow-x: hidden;
      }
      .truckBody {
        width: 130px;
        height: fit-content;
        margin-bottom: 6px;
        animation: motion 1s linear infinite;
      }
      @keyframes motion {
        0% { transform: translateY(0px); }
        50% { transform: translateY(3px); }
        100% { transform: translateY(0px); }
      }
      .truckTires {
        width: 130px;
        height: fit-content;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0px 10px 0px 15px;
        position: absolute;
        bottom: 0;
      }
      .truckTires svg {
        width: 24px;
      }
      .road {
        width: 100%;
        height: 1.5px;
        background-color: #282828;
        position: relative;
        bottom: 0;
        align-self: flex-end;
        border-radius: 3px;
      }
      .road::before {
        content: "";
        position: absolute;
        width: 20px;
        height: 100%;
        background-color: #282828;
        right: -50%;
        border-radius: 3px;
        animation: roadAnimation 1.4s linear infinite;
        border-left: 10px solid white;
      }
      .road::after {
        content: "";
        position: absolute;
        width: 10px;
        height: 100%;
        background-color: #282828;
        right: -65%;
        border-radius: 3px;
        animation: roadAnimation 1.4s linear infinite;
        border-left: 4px solid white;
      }
      .lampPost {
        position: absolute;
        bottom: 0;
        right: -90%;
        height: 90px;
        animation: roadAnimation 1.4s linear infinite;
      }
      @keyframes roadAnimation {
        0% { transform: translateX(0px); }
        100% { transform: translateX(-350px); }
      }
    `}</style>
  </div>
);

// Utility for conditional class names
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// Pack Loading Skeleton - shows shimmer animation while pack is loading
function PackLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="h-5 w-16 bg-gray-700 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-4/5"></div>
      </div>
    </div>
  );
}

// Pack Error State - shows error with optional retry button
function PackErrorState({
  title,
  error,
  onRetry
}: {
  title: string;
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-red-200">{title}</h3>
        <span className="text-xs px-2 py-1 rounded bg-red-800 text-red-200">ERROR</span>
      </div>
      <p className="text-sm text-red-300 mb-3">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default function UploadTestPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [niche, setNiche] = useState('side_hustles'); // Default to XGBoost trained niche
  const [accountSize, setAccountSize] = useState('small (0-10K)');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [metricsError, setMetricsError] = useState(''); // Separate error for metrics section

  // Actual metrics state
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');
  const [comparison, setComparison] = useState<any>(null);

  // Recent runs state
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [showRecentRuns, setShowRecentRuns] = useState(false);

  // Fetch recent prediction runs
  const fetchRecentRuns = async () => {
    setLoadingRuns(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('prediction_runs')
        .select(`
          id,
          video_id,
          status,
          predicted_dps_7d,
          predicted_tier_7d,
          confidence,
          latency_ms_total,
          transcription_source,
          transcription_confidence,
          transcription_latency_ms,
          transcription_skipped,
          transcription_skip_reason,
          pack1_meta,
          pack2_meta,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error('Failed to fetch recent runs:', fetchError);
      } else {
        setRecentRuns((data || []).map((row: any) => ({
          run_id: row.id,
          video_id: row.video_id,
          status: row.status,
          predicted_dps_7d: row.predicted_dps_7d,
          predicted_tier_7d: row.predicted_tier_7d,
          confidence: row.confidence,
          latency_ms_total: row.latency_ms_total,
          transcription_source: row.transcription_source,
          transcription_confidence: row.transcription_confidence,
          transcription_latency_ms: row.transcription_latency_ms,
          transcription_skipped: row.transcription_skipped,
          transcription_skip_reason: row.transcription_skip_reason,
          pack1_meta: row.pack1_meta,
          pack2_meta: row.pack2_meta,
          created_at: row.created_at,
        })));
      }
    } catch (err) {
      console.error('Error fetching recent runs:', err);
    } finally {
      setLoadingRuns(false);
    }
  };

  // Fetch recent runs on mount and after each prediction
  useEffect(() => {
    if (showRecentRuns) {
      fetchRecentRuns();
    }
  }, [showRecentRuns]);

  // Refresh recent runs after a prediction completes
  useEffect(() => {
    if (result && showRecentRuns) {
      fetchRecentRuns();
    }
  }, [result]);

  const calculateDPS = (v: number, l: number, c: number, sh: number, sv: number): number => {
    if (v === 0) return 0;
    const engagementRate = (l + c + sh + sv) / v;
    let baseScore = 0;

    if (engagementRate >= 0.20) {
      baseScore = 80 + (engagementRate - 0.20) * 100;
    } else if (engagementRate >= 0.10) {
      baseScore = 60 + (engagementRate - 0.10) * 200;
    } else if (engagementRate >= 0.05) {
      baseScore = 40 + (engagementRate - 0.05) * 400;
    } else if (engagementRate >= 0.03) {
      baseScore = 30 + (engagementRate - 0.03) * 500;
    } else {
      baseScore = engagementRate * 1000;
    }

    let viewsMultiplier = 1.0;
    if (v >= 1000000) viewsMultiplier = 1.1;
    else if (v >= 100000) viewsMultiplier = 1.05;
    else if (v < 10000) viewsMultiplier = 0.95;

    return Math.max(0, Math.min(100, baseScore * viewsMultiplier));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setComparison(null);

    try {
      const formData = new FormData();
      if (videoFile) {
        formData.append('videoFile', videoFile);
      }
      formData.append('transcript', transcript);
      formData.append('niche', niche);
      formData.append('goal', 'engagement'); // Default goal (field removed from UI)
      formData.append('accountSize', accountSize);

      const response = await fetch('/api/kai/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prediction failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateActual = async () => {
    // Parse values - empty string becomes NaN
    const v = parseInt(views);
    const l = parseInt(likes);
    const c = parseInt(comments);
    const sh = parseInt(shares);
    const sv = parseInt(saves);

    // Validate: all fields must be filled (0 is valid, empty/NaN is not)
    // Also reject negative numbers
    if (isNaN(v) || isNaN(l) || isNaN(c) || isNaN(sh) || isNaN(sv)) {
      setMetricsError('Please enter all metric values');
      return;
    }
    
    if (v < 0 || l < 0 || c < 0 || sh < 0 || sv < 0) {
      setMetricsError('Values cannot be negative');
      return;
    }

    // Views must be at least 1 to calculate engagement rate
    if (v === 0) {
      setMetricsError('Views must be at least 1 to calculate engagement');
      return;
    }

    const actual = calculateDPS(v, l, c, sh, sv);
    const predicted = result.predicted_dps ?? result.prediction?.dps ?? 0;
    const err = predicted - actual;
    const errorPct = actual > 0 ? (Math.abs(err) / actual) * 100 : 0;
    
    // Handle predicted_range with fallback for backward compatibility
    const range = result.predicted_range ?? result.prediction?.range ?? [predicted - 10, predicted + 10];
    const withinRange = actual >= range[0] && actual <= range[1];

    setComparison({
      predicted,
      actual,
      error: err,
      errorPct,
      withinRange,
      views: v,
      likes: l,
      comments: c,
      shares: sh,
      saves: sv
    });

    setMetricsError(''); // Clear metrics error on success

    try {
      const learningResponse = await fetch('/api/learning/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction_id: result.prediction_id,
          video_id: result.video_id,
          actual_views: v,
          actual_likes: l,
          actual_comments: c,
          actual_shares: sh,
          actual_saves: sv,
          niche,
          account_size: accountSize
        })
      });

      const learningData = await learningResponse.json();

      if (learningData.success) {
        setComparison((prev: any) => ({
          ...prev,
          learningUpdated: true,
          componentsUpdated: learningData.components_updated,
          insights: learningData.insights
        }));
      }
    } catch (learningError: any) {
      console.warn('Learning update failed:', learningError.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Lab - Video Upload Test</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Video (MP4)
              </label>
              <input
                type="file"
                accept="video/mp4"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  cursor-pointer"
              />
              {videoFile && (
                <p className="mt-2 text-sm text-green-400">
                  Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Transcript (Optional - Whisper will auto-transcribe if empty)
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={6}
                placeholder="Paste the video transcript here, or leave empty for auto-transcription..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                If you upload a video without transcript, Whisper AI will automatically extract the speech.
              </p>
            </div>

            {/* Niche */}
            <div>
              <label className="block text-sm font-medium mb-2">Niche</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                  focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="🧠 XGBoost ML Trained Niches (Best Predictions)">
                  <option value="side_hustles">🎯 Side Hustles (XGBoost: 0.61 correlation)</option>
                  <option value="personal_finance">🎯 Personal Finance (XGBoost: 0.52 correlation)</option>
                </optgroup>
                <optgroup label="General Niches">
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
                </optgroup>
              </select>
              {(niche === 'side_hustles' || niche === 'personal_finance') && (
                <p className="text-xs text-green-400 mt-1">
                  ✅ Using XGBoost ML Trained Model - Best prediction accuracy!
                </p>
              )}
            </div>

            {/* Account Size */}
            <div>
              <label className="block text-sm font-medium mb-2">Account Size</label>
              <select
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                  focus:ring-2 focus:ring-blue-500"
              >
                <option value="small (0-10K)">Small (0-10K)</option>
                <option value="medium (10K-100K)">Medium (10K-100K)</option>
                <option value="large (100K-1M)">Large (100K-1M)</option>
                <option value="mega (1M+)">Mega (1M+)</option>
              </select>
            </div>

            {/* Submit */}
            {loading ? (
              <div className="w-full py-6 px-6 bg-gray-700 rounded-md flex flex-col items-center justify-center">
                <TruckLoader />
                <p className="text-sm text-gray-300 mt-2">Analyzing with Kai Orchestrator...</p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!videoFile}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700
                  disabled:bg-gray-600 disabled:cursor-not-allowed
                  rounded-md font-semibold transition-colors"
              >
                Get Prediction (Kai)
              </button>
            )}
            <p className="text-xs text-center text-gray-400 mt-2">
              Uses 23 components: XGBoost Virality ML, FFmpeg, GPT-4, 9 Attributes, 24 Styles, 7 Legos, Gemini, and more
            </p>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-8">
            <p className="text-red-200">Error: {error}</p>
          </div>
        )}

        {/* Loading Skeletons - Show while prediction is running */}
        {loading && !result && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Analyzing...</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PackLoadingSkeleton title="Pack 1: Unified Grading" />
              <PackLoadingSkeleton title="Pack 2: Editing Coach" />
              <PackLoadingSkeleton title="Pack 3: Viral Mechanics" />
              <PackLoadingSkeleton title="Pack V: Visual Rubric" />
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Prediction Results</h2>

            {/* Pipeline Steps Status */}
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Pipeline Steps
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Step 1: Uploaded */}
                <div className="flex items-center gap-2 bg-green-600/30 border border-green-500/50 rounded-full px-3 py-1">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">Uploaded</span>
                </div>
                <span className="text-gray-500">→</span>

                {/* Step 2: Transcribing */}
                <div className={`flex items-center gap-2 rounded-full px-3 py-1 ${
                  result.transcription_status
                    ? 'bg-green-600/30 border border-green-500/50'
                    : result.debug?.hasUserTranscript
                    ? 'bg-blue-600/30 border border-blue-500/50'
                    : 'bg-gray-600/30 border border-gray-500/50'
                }`}>
                  <span className={
                    result.transcription_status?.skipped
                      ? 'text-yellow-400'
                      : result.transcription_status || result.debug?.hasUserTranscript
                      ? 'text-green-400'
                      : 'text-gray-400'
                  }>
                    {result.transcription_status?.skipped ? '⚠' : result.transcription_status || result.debug?.hasUserTranscript ? '✓' : '○'}
                  </span>
                  <span className="text-sm">Transcribed</span>
                  {result.transcription_status && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      result.transcription_status.source === 'user_provided' ? 'bg-blue-600 text-white' :
                      result.transcription_status.source === 'whisper' ? 'bg-purple-600 text-white' :
                      result.transcription_status.source.startsWith('fallback') ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {result.transcription_status.source === 'user_provided' ? 'USER' :
                       result.transcription_status.source === 'whisper' ? 'WHISPER AI' :
                       result.transcription_status.source === 'fallback_title' ? 'TITLE' :
                       result.transcription_status.source === 'fallback_captions' ? 'CAPTIONS' :
                       result.transcription_status.source === 'none' ? 'SKIPPED' :
                       result.transcription_status.source.toUpperCase()}
                    </span>
                  )}
                  {!result.transcription_status && result.debug?.hasUserTranscript && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">USER</span>
                  )}
                </div>
                <span className="text-gray-500">→</span>

                {/* Step 3: Analyzing */}
                <div className="flex items-center gap-2 bg-green-600/30 border border-green-500/50 rounded-full px-3 py-1">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">Analyzed</span>
                  <span className="text-xs text-gray-400">
                    ({result.debug?.executedComponentCount || result.components_used?.length || 0} components)
                  </span>
                </div>
                <span className="text-gray-500">→</span>

                {/* Step 4: Done */}
                <div className="flex items-center gap-2 bg-green-600/30 border border-green-500/50 rounded-full px-3 py-1">
                  <span className="text-green-400">✓</span>
                  <span className="text-sm">Done</span>
                </div>
              </div>

              {/* Transcription Details */}
              {result.transcription_status && (
                <div className="mt-3 pt-3 border-t border-gray-600 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-gray-400">Source:</span>
                      <div className="font-semibold capitalize">{result.transcription_status.source?.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Confidence:</span>
                      <div className="font-semibold">{((result.transcription_status.confidence || 0) * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Processing:</span>
                      <div className="font-semibold">{result.transcription_status.processingTimeMs || 0}ms</div>
                    </div>
                    {result.transcription_status.fallbackComponents && (
                      <div>
                        <span className="text-gray-400">Fallback Used:</span>
                        <div className="font-semibold">{result.transcription_status.fallbackComponents.join(', ')}</div>
                      </div>
                    )}
                  </div>
                  {result.transcription_status.skipped && result.transcription_status.skippedReason && (
                    <div className="mt-2 text-yellow-400 text-xs">
                      ⚠️ Transcription skipped: {result.transcription_status.skippedReason}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Prediction */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {result.predicted_dps?.toFixed(1) || 'N/A'}
                </div>
                <div className="text-xl opacity-90">Predicted DPS</div>
                <div className="text-sm opacity-75 mt-2">
                  Range: [{result.predicted_range?.[0]?.toFixed(1)} - {result.predicted_range?.[1]?.toFixed(1)}]
                </div>
                <div className="text-sm opacity-75">
                  Confidence: {((result.confidence || 0) * 100).toFixed(0)}%
                </div>
                {result.viral_potential && (
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      result.viral_potential === 'mega-viral' ? 'bg-yellow-500 text-black' :
                      result.viral_potential === 'viral' ? 'bg-green-500 text-white' :
                      result.viral_potential === 'good' ? 'bg-blue-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {result.viral_potential.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Account Size Cohort Context */}
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cohort Context
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Account Size</div>
                  <div className="text-lg font-semibold text-white">{accountSize}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Cohort Performance</div>
                  <div className={`text-lg font-semibold ${
                    result.predicted_dps >= 70 ? 'text-green-400' :
                    result.predicted_dps >= 50 ? 'text-blue-400' :
                    result.predicted_dps >= 30 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {result.predicted_dps >= 70 ? 'Top 30% of Cohort' :
                     result.predicted_dps >= 50 ? 'Above Average' :
                     result.predicted_dps >= 30 ? 'Average' :
                     'Below Average'}
                  </div>
                </div>
              </div>
              
              {/* Calibration Adjustments */}
              {result.adjustments && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="text-sm font-medium text-gray-300 mb-2">Score Adjustments Applied:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Raw Score</div>
                      <div className="text-lg font-bold text-white">{result.adjustments.raw_score?.toFixed(1)}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Account Factor</div>
                      <div className={`text-lg font-bold ${
                        result.adjustments.account_factor > 1 ? 'text-green-400' :
                        result.adjustments.account_factor < 1 ? 'text-orange-400' :
                        'text-white'
                      }`}>
                        {result.adjustments.account_factor > 1 ? '+' : ''}
                        {((result.adjustments.account_factor - 1) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Final Score</div>
                      <div className="text-lg font-bold text-blue-400">{result.predicted_dps?.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Niche factor: {result.adjustments.niche_factor?.toFixed(2)} | 
                    Conservative: {result.adjustments.conservative_factor?.toFixed(2)} | 
                    Total: {(result.adjustments.total_factor * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400">
                  💡 <strong>DPS is relative to account size.</strong> A DPS of {result.predicted_dps?.toFixed(0)} for a {accountSize.split(' ')[0]} account 
                  means this video is predicted to {result.predicted_dps >= 50 ? 'outperform' : 'underperform'} typical content from similar-sized creators.
                  {accountSize.includes('small') && ' Small accounts receive a boost since fewer views are needed to go viral.'}
                  {accountSize.includes('large') && ' Large accounts receive a reduction since more views are expected.'}
                  {accountSize.includes('mega') && ' Mega accounts receive the largest reduction since massive views are expected.'}
                </div>
              </div>
            </div>

            {/* XGBoost Virality ML Prediction - PROMINENT */}
            {result.component_scores?.['xgboost-virality-ml'] !== undefined && (
              <div className="bg-gradient-to-br from-emerald-900/70 to-teal-900/70 border-2 border-emerald-400 rounded-lg p-6 mb-6 shadow-lg shadow-emerald-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  XGBoost Virality ML Prediction
                  <span className="text-xs bg-emerald-500 text-black px-2 py-1 rounded font-bold">TRAINED MODEL</span>
                </h3>
                
                {/* Main XGBoost DPS Score */}
                <div className="bg-black/30 rounded-xl p-6 mb-4">
                  <div className="text-center">
                    <div className="text-6xl font-black text-emerald-300 mb-2">
                      {result.component_scores['xgboost-virality-ml']?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xl text-emerald-200 font-semibold">
                      Predicted DPS (XGBoost ML)
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      Model trained on 3,126+ viral videos
                    </div>
                  </div>
                </div>

                {/* XGBoost Details from features */}
                {result.features?.['xgboost-virality-ml'] && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Confidence</div>
                      <div className="text-lg font-bold text-emerald-300">
                        {((result.features['xgboost-virality-ml'].confidence || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Niche</div>
                      <div className="text-lg font-bold text-white capitalize">
                        {result.features['xgboost-virality-ml'].niche?.replace('_', ' ') || niche}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Model Version</div>
                      <div className="text-lg font-bold text-white">
                        {result.features['xgboost-virality-ml'].model_version || '1.0.0'}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Features Used</div>
                      <div className="text-lg font-bold text-white">
                        {result.features['xgboost-virality-ml'].features_provided || '?'}/{result.features['xgboost-virality-ml'].features_total || 23}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Contributing Features */}
                {result.features?.['xgboost-virality-ml']?.top_contributing_features?.length > 0 && (
                  <div className="bg-black/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-emerald-200">Top Contributing Features</h4>
                    <div className="space-y-2">
                      {result.features['xgboost-virality-ml'].top_contributing_features.slice(0, 5).map((feature: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-black/20 rounded px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-mono text-sm">{idx + 1}.</span>
                            <span className="text-white">{feature.feature.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-300 text-sm">
                              {typeof feature.value === 'boolean' ? (feature.value ? '✓ Yes' : '✗ No') : feature.value}
                            </span>
                            <span className="text-emerald-400 font-semibold text-sm">
                              {(feature.importance * 100).toFixed(0)}% importance
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Features Warning */}
                {result.features?.['xgboost-virality-ml']?.missing_features?.length > 0 && (
                  <div className="mt-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3">
                    <div className="text-sm text-yellow-200">
                      ⚠️ Missing {result.features['xgboost-virality-ml'].missing_features.length} features (using defaults):
                      <span className="text-yellow-400 ml-2">
                        {result.features['xgboost-virality-ml'].missing_features.slice(0, 5).join(', ')}
                        {result.features['xgboost-virality-ml'].missing_features.length > 5 && '...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* XGBoost ML Not Available Warning */}
            {result.components_used && !result.components_used.includes('xgboost-virality-ml') && (niche === 'side_hustles' || niche === 'personal_finance') && (
              <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2 text-yellow-300">⚠️ XGBoost Virality ML Not Active</h3>
                <p className="text-sm text-yellow-200">
                  The XGBoost ML model requires FFmpeg features to predict. Make sure you uploaded a video file
                  and FFmpeg analysis completed successfully.
                </p>
              </div>
            )}

            {/* Kai Components Used */}
            {result.components_used && (
              <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Kai Orchestrator - Components Used
                  <span className="text-xs bg-cyan-600 px-2 py-1 rounded">{result.components_used.length} SCHEDULED</span>
                  {result.debug?.executedComponentCount !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.debug.executedComponentCount > 0 ? 'bg-green-600' : 'bg-red-600'
                    }`}>{result.debug.executedComponentCount} EXECUTED</span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.components_used.map((comp: string, idx: number) => {
                    const wasExecuted = result.debug?.executedComponentIds?.includes(comp);
                    return (
                      <span key={idx} className={`px-2 py-1 rounded text-xs ${
                        comp === 'xgboost-virality-ml'
                          ? 'bg-emerald-600 text-white font-bold'
                          : wasExecuted
                            ? 'bg-green-800/50 border border-green-500'
                            : 'bg-cyan-800/50'
                      }`}>
                        {comp}
                        {wasExecuted && <span className="ml-1">✓</span>}
                      </span>
                    );
                  })}
                </div>
                {/* Show any executed components not in scheduled list */}
                {result.debug?.executedComponentIds && result.debug.executedComponentIds.some(
                  (id: string) => !result.components_used.includes(id)
                ) && (
                  <div className="mt-2 pt-2 border-t border-cyan-700">
                    <span className="text-xs text-gray-400">Additional executed: </span>
                    {result.debug.executedComponentIds
                      .filter((id: string) => !result.components_used.includes(id))
                      .map((id: string, idx: number) => (
                        <span key={idx} className="text-xs bg-green-800/50 px-2 py-1 rounded mr-1">{id} ✓</span>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border border-yellow-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3">Warnings</h3>
                <ul className="space-y-2">
                  {result.warnings.map((warn: string, idx: number) => (
                    <li key={idx} className="text-sm text-yellow-200">{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Path Results */}
            {result.paths && result.paths.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3">Prediction Paths</h3>
                <div className="space-y-3">
                  {result.paths.map((path: any, idx: number) => (
                    <div key={idx} className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{path.name}</span>
                        <div className="flex items-center gap-3">
                          {path.prediction && (
                            <span className="text-blue-400">{path.prediction.toFixed(1)} DPS</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${path.success ? 'bg-green-600' : 'bg-red-600'}`}>
                            {path.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Weight: {(path.weight * 100).toFixed(0)}% |
                        Components: {path.components?.length || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {result.explanation && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Explanation</h3>
                <p className="text-gray-300">{result.explanation}</p>
              </div>
            )}

            {/* FFmpeg Visual Analysis */}
            {result.ffmpeg_analysis && (
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  FFmpeg Visual Analysis
                  <span className="text-xs bg-green-600 px-2 py-1 rounded">WORKING</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Duration:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.duration.toFixed(1)}s</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Resolution:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.resolution}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">FPS:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.fps}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Aspect Ratio:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.aspect_ratio}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Codec:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.codec}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Format:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.format}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Has Audio:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.has_audio ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Frames:</span>
                    <div className="font-semibold">{result.ffmpeg_analysis.total_frames?.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-black/30 rounded text-xs">
                  <span className="text-green-400">This proves FFmpeg extracted video metadata successfully!</span>
                </div>
              </div>
            )}

            {/* Gemini 3 Pro Analysis */}
            {result.components_used?.includes('gemini') && result.component_scores?.gemini && (
              <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Gemini 3 Pro Analysis
                  <span className="text-xs bg-green-600 px-2 py-1 rounded">ACTIVE</span>
                  {result.features?.gemini?.analysisType && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                      {result.features.gemini.analysisType === 'video_file' ? 'VIDEO FILE' : 'TRANSCRIPT'}
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-400">Model:</span>
                    <div className="font-semibold">{result.features?.gemini?.modelName || 'gemini-3-pro-preview'}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Score:</span>
                    <div className="font-semibold">{result.component_scores.gemini.toFixed(1)} DPS</div>
                  </div>
                  {result.features?.gemini?.visualEngagement && (
                    <div>
                      <span className="text-gray-400">Visual Engagement:</span>
                      <div className="font-semibold">{result.features.gemini.visualEngagement}/10</div>
                    </div>
                  )}
                  {result.features?.gemini?.audioQuality && (
                    <div>
                      <span className="text-gray-400">Audio Quality:</span>
                      <div className="font-semibold">{result.features.gemini.audioQuality}/10</div>
                    </div>
                  )}
                  {result.features?.gemini?.hookStrength && (
                    <div>
                      <span className="text-gray-400">Hook Strength:</span>
                      <div className="font-semibold">{result.features.gemini.hookStrength}/10</div>
                    </div>
                  )}
                  {result.features?.gemini?.emotionalAppeal && (
                    <div>
                      <span className="text-gray-400">Emotional Appeal:</span>
                      <div className="font-semibold">{result.features.gemini.emotionalAppeal}/10</div>
                    </div>
                  )}
                </div>
                <div className="mt-3 p-2 bg-black/30 rounded text-xs">
                  {result.features?.gemini?.analysisType === 'video_file' ? (
                    <span className="text-green-400">Gemini 3 Pro analyzed the video file directly (multimodal analysis)!</span>
                  ) : (
                    <span className="text-yellow-400">Gemini 3 Pro analyzed transcript only (video file not available)</span>
                  )}
                </div>
              </div>
            )}

            {/* Top Features */}
            {result.top_features && result.top_features.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-3">Top Features (From Transcript)</h3>
                <div className="space-y-2">
                  {result.top_features.slice(0, 5).map((feature: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm">{feature.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {feature.value?.toFixed(2)}
                        </span>
                        <span className="text-xs text-blue-400">
                          {(feature.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════
                PACK 1/2 RESULTS - Unified Grading Rubric + Editing Coach
                Added: 2026-01-14
                Updated: 2026-01-14 - Use qualitative_analysis with backward compat
            ═══════════════════════════════════════════════════════════════════════════ */}

            {/* Pack 1/2 Available - Show Panels */}
            {(() => {
              // Use qualitative_analysis with backward-compat fallback
              const pack1 = result.qualitative_analysis?.pack1 || result.unified_grading;
              const pack2 = result.qualitative_analysis?.pack2 || result.editing_suggestions;
              const pack3 = result.qualitative_analysis?.pack3;

              return (pack1 || pack2) ? (
              <div className="grid gap-4 md:grid-cols-2 mb-4">

                {/* Pack 1: Unified Grading Rubric */}
                {pack1 && (
                  <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-2 border-blue-400 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Pack 1: Unified Grading Rubric
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold">LLM RUBRIC</span>
                      {pack1._meta && (
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          pack1._meta.source === 'mock' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                          {pack1._meta.source.toUpperCase()} ({pack1._meta.provider})
                        </span>
                      )}
                    </h3>
                    
                    {/* Grader Confidence */}
                    {pack1.grader_confidence !== undefined && (
                      <div className="bg-black/30 rounded-lg p-3 mb-4 text-center">
                        <div className="text-sm text-gray-400">Grader Confidence</div>
                        <div className="text-2xl font-bold text-blue-300">
                          {(pack1.grader_confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Attribute Scores (9 attributes) */}
                    {pack1.attribute_scores && pack1.attribute_scores.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 text-blue-200">9 Attribute Scores</h4>
                        <div className="space-y-2">
                          {pack1.attribute_scores.map((attr: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-black/20 rounded px-3 py-2">
                              <span className="text-sm capitalize">{attr.attribute?.replace(/_/g, ' ')}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-400 h-2 rounded-full"
                                    style={{ width: `${(attr.score || 0) * 10}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-blue-300 w-6">{attr.score || 0}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Idea Legos (7 boolean flags) */}
                    {pack1.idea_legos && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 text-blue-200">7 Idea Legos</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                            const key = `lego_${num}`;
                            const present = (pack1.idea_legos as any)[key];
                            return (
                              <div
                                key={num}
                                className={`p-2 rounded text-center text-xs ${
                                  present
                                    ? 'bg-green-600/50 text-green-200 border border-green-400'
                                    : 'bg-gray-700/50 text-gray-400'
                                }`}
                              >
                                <div className="text-lg">{present ? '✓' : '○'}</div>
                                <div>Lego {num}</div>
                              </div>
                            );
                          })}
                        </div>
                        {pack1.idea_legos.notes && (
                          <p className="text-xs text-gray-400 mt-2 italic">{pack1.idea_legos.notes}</p>
                        )}
                      </div>
                    )}

                    {/* Hook Analysis */}
                    {pack1.hook && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 text-blue-200">Hook Analysis</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-black/20 rounded p-2">
                            <div className="text-gray-400 text-xs">Type</div>
                            <div className="font-semibold">{pack1.hook.type || 'N/A'}</div>
                          </div>
                          <div className="bg-black/20 rounded p-2">
                            <div className="text-gray-400 text-xs">Clarity Score</div>
                            <div className="font-semibold text-blue-300">{pack1.hook.clarity_score || 0}/10</div>
                          </div>
                        </div>
                        {pack1.hook.pattern && (
                          <div className="mt-2 bg-black/20 rounded p-2">
                            <div className="text-gray-400 text-xs">Pattern</div>
                            <div className="text-sm">{pack1.hook.pattern}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pacing / Clarity / Novelty */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-300">
                          {pack1.pacing?.score || '-'}
                        </div>
                        <div className="text-xs text-gray-400">Pacing</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-300">
                          {pack1.clarity?.score || '-'}
                        </div>
                        <div className="text-xs text-gray-400">Clarity</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-300">
                          {pack1.novelty?.score || '-'}
                        </div>
                        <div className="text-xs text-gray-400">Novelty</div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {pack1.warnings && pack1.warnings.length > 0 && (
                      <div className="mt-4 bg-yellow-900/30 border border-yellow-600/50 rounded p-2">
                        <div className="text-xs text-yellow-200">
                          ⚠️ {pack1.warnings.join(' • ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pack 2: Editing Coach */}
                {pack2 && (
                  <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-400 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="text-2xl">✨</span>
                      Pack 2: Editing Coach
                      <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded font-bold">AI COACH</span>
                      {pack2._meta && (
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          pack2._meta.source === 'mock' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                          {pack2._meta.source.toUpperCase()} ({pack2._meta.provider})
                        </span>
                      )}
                    </h3>

                    {/* Before/After DPS Comparison */}
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Current DPS</div>
                          <div className="text-2xl font-bold text-white">
                            {pack2.predicted_before?.toFixed(1) || '-'}
                          </div>
                        </div>
                        <div className="text-3xl text-purple-400">→</div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Potential DPS</div>
                          <div className="text-2xl font-bold text-purple-300">
                            {pack2.predicted_after_estimate?.toFixed(1) || '-'}
                          </div>
                        </div>
                      </div>
                      {pack2.predicted_before && pack2.predicted_after_estimate && (
                        <div className="text-center mt-2">
                          <span className="text-green-400 font-semibold">
                            +{(pack2.predicted_after_estimate - pack2.predicted_before).toFixed(1)} DPS potential lift
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Top 3 Suggestions */}
                    {pack2.changes && pack2.changes.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-purple-200">Top {Math.min(3, pack2.changes.length)} Improvement Suggestions</h4>
                        {pack2.changes.slice(0, 3).map((change: any, idx: number) => (
                          <div key={idx} className="bg-black/20 border border-purple-600/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                #{change.priority || idx + 1} Priority
                              </span>
                              <span className="text-sm font-semibold text-green-400">
                                +{change.estimated_lift?.toFixed(1) || '?'} DPS
                              </span>
                            </div>
                            <div className="font-medium text-white mb-1">
                              {change.what_to_change || change.target_field || 'Improvement'}
                            </div>
                            <p className="text-sm text-gray-300">
                              {change.how_to_change || change.suggestion || 'Apply suggested changes'}
                            </p>
                            {change.example && (
                              <div className="mt-2 p-2 bg-black/30 rounded text-sm italic text-gray-400">
                                "{change.example}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Coach Notes */}
                    {pack2.notes && (
                      <div className="mt-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3">
                        <div className="text-sm">
                          <strong className="text-yellow-200">Coach Notes:</strong>{' '}
                          <span className="text-gray-300">{pack2.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              ) : null;
            })()}

            {/* ═══════════════════════════════════════════════════════════════════════════
                PACK V RESULTS - Visual Rubric (NO transcript required)
                Added: 2026-01-15
                Shows even when Pack 1/2 are unavailable (silent videos)
            ═══════════════════════════════════════════════════════════════════════════ */}
            {result.qualitative_analysis?.packV && (
              <div className="bg-gradient-to-br from-orange-900/50 to-amber-900/50 border-2 border-orange-400 rounded-lg p-4 mb-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">👁️</span>
                  Pack V: Visual Rubric
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-bold">VISUAL ONLY</span>
                  {result.qualitative_analysis.packV._meta && (
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      result.qualitative_analysis.packV._meta.source === 'mock' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {result.qualitative_analysis.packV._meta.source.toUpperCase()} ({result.qualitative_analysis.packV._meta.provider})
                    </span>
                  )}
                  <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                    {result.qualitative_analysis.packV._meta?.latency_ms || 0}ms
                  </span>
                </h3>

                {/* Overall Visual Score */}
                <div className="bg-black/30 rounded-lg p-4 mb-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Overall Visual Score</div>
                  <div className="text-4xl font-bold text-orange-300">
                    {result.qualitative_analysis.packV.overall_visual_score}
                    <span className="text-lg text-gray-400">/100</span>
                  </div>
                </div>

                {/* Visual Scores Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {/* Visual Hook Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Visual Hook</span>
                      <span className="text-xl font-bold text-orange-300">
                        {result.qualitative_analysis.packV.visual_hook_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${result.qualitative_analysis.packV.visual_hook_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{result.qualitative_analysis.packV.visual_hook_score.evidence}</p>
                  </div>

                  {/* Pacing Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Pacing</span>
                      <span className="text-xl font-bold text-orange-300">
                        {result.qualitative_analysis.packV.pacing_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${result.qualitative_analysis.packV.pacing_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{result.qualitative_analysis.packV.pacing_score.evidence}</p>
                  </div>

                  {/* Pattern Interrupts Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Pattern Interrupts</span>
                      <span className="text-xl font-bold text-orange-300">
                        {result.qualitative_analysis.packV.pattern_interrupts_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${result.qualitative_analysis.packV.pattern_interrupts_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{result.qualitative_analysis.packV.pattern_interrupts_score.evidence}</p>
                  </div>

                  {/* Visual Clarity Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Visual Clarity</span>
                      <span className="text-xl font-bold text-orange-300">
                        {result.qualitative_analysis.packV.visual_clarity_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${result.qualitative_analysis.packV.visual_clarity_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{result.qualitative_analysis.packV.visual_clarity_score.evidence}</p>
                  </div>

                  {/* Style Fit Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Style Fit</span>
                      <span className="text-xl font-bold text-orange-300">
                        {result.qualitative_analysis.packV.style_fit_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${result.qualitative_analysis.packV.style_fit_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{result.qualitative_analysis.packV.style_fit_score.evidence}</p>
                  </div>
                </div>

                {/* Pack V Info Note */}
                <div className="bg-black/20 rounded p-2 text-center">
                  <span className="text-xs text-gray-400">
                    Pack V analyzes visual signals only - no transcript required. Runs even for silent videos.
                  </span>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════
                PACK 3 RESULTS - Viral Mechanics
                Added: 2026-01-17 (Phase 05 UI Polish)
                Shows viral mechanics detected with strength indicators
            ═══════════════════════════════════════════════════════════════════════════ */}
            {result.qualitative_analysis?.pack3 && 'mechanics' in result.qualitative_analysis.pack3 && (
              <div className="bg-gradient-to-br from-pink-900/50 to-rose-900/50 border-2 border-pink-400 rounded-lg p-4 mb-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 flex-wrap">
                  <span className="text-2xl">⚡</span>
                  Pack 3: Viral Mechanics
                  <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded font-bold">WHY IT WORKS</span>
                  {result.qualitative_analysis.pack3._meta && (
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      result.qualitative_analysis.pack3._meta.source === 'mock' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {result.qualitative_analysis.pack3._meta.source.toUpperCase()} ({result.qualitative_analysis.pack3._meta.provider})
                    </span>
                  )}
                  {result.qualitative_analysis.pack3._meta?.latency_ms !== undefined && (
                    <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                      {result.qualitative_analysis.pack3._meta.latency_ms}ms
                    </span>
                  )}
                </h3>

                {/* Limited Signal Mode Warning */}
                {result.qualitative_analysis.pack3.limited_signal_mode && (
                  <div className="bg-yellow-900/40 border border-yellow-600 rounded-lg p-3 mb-4">
                    <div className="text-yellow-200 font-semibold text-sm mb-1">⚠️ Limited Signal Mode</div>
                    <p className="text-yellow-300 text-xs">
                      Some signals were unavailable. Results may be less accurate.
                    </p>
                    {result.qualitative_analysis.pack3.missing_signals && result.qualitative_analysis.pack3.missing_signals.length > 0 && (
                      <p className="text-yellow-400 text-xs mt-1">
                        Missing: {result.qualitative_analysis.pack3.missing_signals.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Confidence Score */}
                <div className="bg-black/30 rounded-lg p-4 mb-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Analysis Confidence</div>
                  <div className="text-3xl font-bold text-pink-300">
                    {Math.round(result.qualitative_analysis.pack3.confidence * 100)}
                    <span className="text-lg text-gray-400">%</span>
                  </div>
                </div>

                {/* Viral Mechanics List */}
                {result.qualitative_analysis.pack3.mechanics && result.qualitative_analysis.pack3.mechanics.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h4 className="font-semibold text-pink-200">Detected Viral Mechanics</h4>
                    {result.qualitative_analysis.pack3.mechanics.map((mechanic: any, idx: number) => (
                      <div key={idx} className="bg-black/20 border border-pink-600/30 rounded-lg p-3">
                        {/* Mechanic Header with Strength */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">{mechanic.name}</span>
                          <span className={cn(
                            "text-sm font-bold px-2 py-1 rounded",
                            mechanic.strength >= 70 ? "bg-green-600 text-white" :
                            mechanic.strength >= 40 ? "bg-yellow-600 text-white" : "bg-red-600 text-white"
                          )}>
                            {mechanic.strength}/100
                          </span>
                        </div>

                        {/* Strength Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              mechanic.strength >= 70 ? "bg-green-500" :
                              mechanic.strength >= 40 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${mechanic.strength}%` }}
                          />
                        </div>

                        {/* Evidence */}
                        {mechanic.evidence && mechanic.evidence.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs text-gray-400 mb-1">Evidence:</div>
                            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                              {mechanic.evidence.map((e: string, eIdx: number) => (
                                <li key={eIdx}>{e}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Signals Used */}
                        {mechanic.signals_used && mechanic.signals_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mechanic.signals_used.map((signal: string, sIdx: number) => (
                              <span key={sIdx} className="text-xs bg-pink-900/50 text-pink-200 px-2 py-1 rounded">
                                {signal}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {result.qualitative_analysis.pack3.summary && (
                  <div className="bg-pink-900/30 border border-pink-600/50 rounded-lg p-3">
                    <div className="text-sm">
                      <strong className="text-pink-200">Summary:</strong>{' '}
                      <span className="text-gray-300">{result.qualitative_analysis.pack3.summary}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pack 3 Not Implemented Stub */}
            {result.qualitative_analysis?.pack3 && 'status' in result.qualitative_analysis.pack3 && result.qualitative_analysis.pack3.status === 'not_implemented' && (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-300">
                  <span>⚡</span> Pack 3: Viral Mechanics
                  <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">COMING SOON</span>
                </h3>
                <p className="text-sm text-gray-400">
                  {result.qualitative_analysis.pack3.notes || 'Viral Mechanics analysis planned for future release.'}
                </p>
              </div>
            )}

            {/* Pack 1/2 Not Available - Show Reason with Debug Info */}
            {result && !result.qualitative_analysis?.pack1 && !result.unified_grading && !result.qualitative_analysis?.pack2 && !result.editing_suggestions && (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-300">
                  <span>📊</span> Pack 1/2 Analysis Not Available
                </h3>
                <p className="text-sm text-gray-400">
                  {result.debug?.resolvedTranscriptLength === 0
                    ? `No speech detected in video. Transcription source: ${result.debug?.transcriptSource || 'none'}. Pack 1/2 requires at least 10 characters of transcript text.`
                    : result.debug?.resolvedTranscriptLength !== undefined && result.debug.resolvedTranscriptLength < 10
                    ? `Resolved transcript too short (${result.debug.resolvedTranscriptLength} chars). Minimum 10 characters required.`
                    : result.transcription_status?.skipped
                    ? `Transcription skipped: ${result.transcription_status.skippedReason || 'no_speech_detected'}. Pack 1/2 requires transcript text to analyze.`
                    : 'Pack 1/2 components did not return results. Check if unified-grading and editing-coach components are enabled.'}
                </p>

                {/* Debug Info Panel */}
                <div className="mt-3 pt-3 border-t border-gray-600 text-xs">
                  <div className="text-gray-500 font-semibold mb-2">Debug Info (for troubleshooting):</div>
                  <div className="grid grid-cols-2 gap-2 text-gray-500">
                    <div>User Transcript: {result.debug?.userTranscriptLength || 0} chars</div>
                    <div>Resolved Transcript: {result.debug?.resolvedTranscriptLength || 0} chars</div>
                    <div>Transcript Source: {result.debug?.transcriptSource || 'none'}</div>
                    <div>Confidence: {((result.debug?.transcriptConfidence || 0) * 100).toFixed(0)}%</div>
                  </div>
                  {result.debug?.resolvedTranscriptPreview && (
                    <div className="mt-2">
                      <div className="text-gray-500">Preview:</div>
                      <div className="text-gray-400 italic truncate">"{result.debug.resolvedTranscriptPreview}"</div>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Components used: {result.components_used?.join(', ') || 'none'}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Video ID:</span>
                  <div className="font-mono text-xs">{result.video_id}</div>
                </div>
                <div>
                  <span className="text-gray-400">Prediction ID:</span>
                  <div className="font-mono text-xs">{result.prediction_id}</div>
                </div>
                <div>
                  <span className="text-gray-400">Processing Time:</span>
                  <div>{result.processing_time_ms}ms</div>
                </div>
                <div>
                  <span className="text-gray-400">LLM Cost:</span>
                  <div>${result.llm_cost_usd?.toFixed(4) || '0.0000'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Prediction Hash:</span>
                  <div className="font-mono text-xs truncate">
                    {result.prediction_hash?.substring(0, 16)}...
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Frozen At:</span>
                  <div className="text-xs">
                    {new Date(result.frozen_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Actual Metrics Entry */}
            <div className="mt-6 p-6 bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-600 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Enter Actual Metrics (For Testing)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Since this is testing mode with already-posted videos, enter the actual metrics below:
              </p>

              {/* Inline error for metrics section */}
              {metricsError && (
                <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">⚠️ {metricsError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Views</label>
                  <input
                    type="number"
                    min="0"
                    value={views}
                    onChange={(e) => { setViews(e.target.value); setMetricsError(''); }}
                    placeholder="e.g., 1100000"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                      focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Likes</label>
                  <input
                    type="number"
                    min="0"
                    value={likes}
                    onChange={(e) => { setLikes(e.target.value); setMetricsError(''); }}
                    placeholder="e.g., 69100"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                      focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comments</label>
                  <input
                    type="number"
                    min="0"
                    value={comments}
                    onChange={(e) => { setComments(e.target.value); setMetricsError(''); }}
                    placeholder="e.g., 435"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                      focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Saves (Bookmarks)</label>
                  <input
                    type="number"
                    min="0"
                    value={saves}
                    onChange={(e) => { setSaves(e.target.value); setMetricsError(''); }}
                    placeholder="e.g., 58000"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                      focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Shares</label>
                  <input
                    type="number"
                    min="0"
                    value={shares}
                    onChange={(e) => { setShares(e.target.value); setMetricsError(''); }}
                    placeholder="e.g., 11600"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md
                      focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateActual}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700
                  rounded-md font-semibold transition-colors"
              >
                Calculate Actual DPS & Compare
              </button>
            </div>

            {/* Comparison Results */}
            {comparison && (
              <div className="mt-6 p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-600 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Prediction vs Actual Comparison</h3>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-600/30 rounded-lg p-4 border border-blue-500">
                    <div className="text-sm opacity-75 mb-1">PREDICTED DPS</div>
                    <div className="text-4xl font-bold">{comparison.predicted.toFixed(1)}</div>
                  </div>
                  <div className="bg-green-600/30 rounded-lg p-4 border border-green-500">
                    <div className="text-sm opacity-75 mb-1">ACTUAL DPS</div>
                    <div className="text-4xl font-bold">{comparison.actual.toFixed(1)}</div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Error:</span>
                      <div className="font-semibold text-lg">
                        {comparison.error > 0 ? '+' : ''}{comparison.error.toFixed(1)} DPS
                        ({comparison.errorPct.toFixed(1)}%)
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Within Range:</span>
                      <div className={`font-semibold text-lg ${comparison.withinRange ? 'text-green-400' : 'text-red-400'}`}>
                        {comparison.withinRange ? 'YES' : 'NO'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Views:</span>
                      <div className="font-semibold">{comparison.views.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Engagement Rate:</span>
                      <div className="font-semibold">
                        {((comparison.likes + comparison.comments + comparison.shares + comparison.saves) / comparison.views * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">What This Means:</h4>
                  <div className="space-y-2 text-sm">
                    {comparison.error > 10 && (
                      <p className="text-yellow-300">
                        <strong>Significant Over-Prediction:</strong> The model predicted {comparison.error.toFixed(1)} DPS higher than actual.
                        This suggests the model overestimated engagement potential for this type of content.
                      </p>
                    )}
                    {comparison.error < -10 && (
                      <p className="text-blue-300">
                        <strong>Under-Prediction (Good!):</strong> The video performed {Math.abs(comparison.error).toFixed(1)} DPS better than predicted!
                        The model was conservative, which is safer than over-promising.
                      </p>
                    )}
                    {Math.abs(comparison.error) <= 10 && (
                      <p className="text-green-300">
                        <strong>Accurate Prediction:</strong> The model was within 10 DPS ({comparison.errorPct.toFixed(1)}% error).
                        This is excellent accuracy for viral prediction.
                      </p>
                    )}

                    <p className="text-gray-300 mt-3">
                      <strong>Actual Performance:</strong> {comparison.views.toLocaleString()} views with {comparison.actual.toFixed(1)} DPS
                      ({comparison.actual >= 70 ? 'VIRAL' : comparison.actual >= 40 ? 'Good Performance' : 'Below Average'})
                    </p>

                    {!comparison.withinRange && result.predicted_range && (
                      <p className="text-red-300 mt-2">
                        The actual DPS fell <strong>outside</strong> the predicted confidence interval
                        [{result.predicted_range[0]?.toFixed(1) ?? '?'}-{result.predicted_range[1]?.toFixed(1) ?? '?'}].
                        This suggests the confidence range needs adjustment.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Prediction Runs Panel */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Recent Prediction Runs
            </h2>
            <button
              onClick={() => {
                setShowRecentRuns(!showRecentRuns);
                if (!showRecentRuns) fetchRecentRuns();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
            >
              {showRecentRuns ? 'Hide Runs' : 'Show Last 10 Runs'}
            </button>
          </div>

          {showRecentRuns && (
            <>
              {loadingRuns ? (
                <div className="text-center py-8 text-gray-400">
                  Loading recent runs...
                </div>
              ) : recentRuns.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No recent runs found. Run a prediction to see results here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left">
                        <th className="pb-3 text-gray-400 font-medium">Run ID</th>
                        <th className="pb-3 text-gray-400 font-medium">DPS</th>
                        <th className="pb-3 text-gray-400 font-medium">Transcript</th>
                        <th className="pb-3 text-gray-400 font-medium">Pack 1</th>
                        <th className="pb-3 text-gray-400 font-medium">Pack 2</th>
                        <th className="pb-3 text-gray-400 font-medium">Latency</th>
                        <th className="pb-3 text-gray-400 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRuns.map((run) => (
                        <tr key={run.run_id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="py-3">
                            <div className="font-mono text-xs text-gray-300 truncate max-w-[100px]" title={run.run_id}>
                              {run.run_id.substring(0, 12)}...
                            </div>
                            <div className={`text-xs ${run.status === 'completed' ? 'text-green-400' : run.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                              {run.status}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-bold text-white">
                              {run.predicted_dps_7d?.toFixed(1) || '-'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {run.predicted_tier_7d || '-'}
                            </div>
                          </td>
                          <td className="py-3">
                            {run.transcription_skipped ? (
                              <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                                SKIPPED
                              </span>
                            ) : (
                              <div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  run.transcription_source === 'user_provided' ? 'bg-blue-600 text-white' :
                                  run.transcription_source === 'whisper' ? 'bg-purple-600 text-white' :
                                  run.transcription_source?.startsWith('fallback') ? 'bg-yellow-600 text-white' :
                                  'bg-gray-600 text-gray-300'
                                }`}>
                                  {run.transcription_source?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                                </span>
                                {run.transcription_confidence !== null && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {(run.transcription_confidence * 100).toFixed(0)}% conf
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3">
                            {run.pack1_meta ? (
                              <div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  run.pack1_meta.source === 'mock' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                                }`}>
                                  {run.pack1_meta.source.toUpperCase()}
                                </span>
                                <div className="text-xs text-gray-400 mt-1">
                                  {run.pack1_meta.provider}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3">
                            {run.pack2_meta ? (
                              <div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  run.pack2_meta.source === 'mock' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                                }`}>
                                  {run.pack2_meta.source.toUpperCase()}
                                </span>
                                <div className="text-xs text-gray-400 mt-1">
                                  {run.pack2_meta.provider}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3 text-gray-300">
                            {run.latency_ms_total ? `${(run.latency_ms_total / 1000).toFixed(1)}s` : '-'}
                          </td>
                          <td className="py-3 text-xs text-gray-400">
                            {run.created_at ? new Date(run.created_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-600 text-white rounded">REAL</span>
                      <span className="text-gray-400">Live LLM call</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-yellow-600 text-white rounded">MOCK</span>
                      <span className="text-gray-400">Mock/fallback data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-600 text-white rounded">USER PROVIDED</span>
                      <span className="text-gray-400">User entered transcript</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-600 text-white rounded">WHISPER</span>
                      <span className="text-gray-400">Auto-transcribed</span>
                    </div>
                  </div>

                  {/* Refresh button */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={fetchRecentRuns}
                      disabled={loadingRuns}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-md text-sm transition-colors"
                    >
                      {loadingRuns ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

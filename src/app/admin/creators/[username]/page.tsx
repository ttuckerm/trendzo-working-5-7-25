'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CreatorProfile {
  id: string;
  tiktok_username: string;
  baseline_dps: number;
  baseline_engagement_rate: number;
  total_videos: number;
  avg_views: number;
  avg_likes: number;
  avg_comments: number;
  avg_shares: number;
  avg_saves: number;
  last_scraped_at: string | null;
  dps_percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

interface PredictionHistory {
  id: string;
  predicted_dps: number;
  relative_score: number;
  improvement_factor: number;
  percentile_rank: string;
  adjusted_dps: number;
  contextualized_message: string;
  created_at: string;
  video_title?: string;
}

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [predicting, setPredicting] = useState(false);

  // Upload form state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [niche, setNiche] = useState('side_hustles');
  const [goal, setGoal] = useState('build_engaged_following');
  const [accountSize, setAccountSize] = useState('medium');

  // Prediction result
  const [predictionResult, setPredictionResult] = useState<any>(null);

  useEffect(() => {
    loadCreatorData();
  }, [username]);

  const loadCreatorData = async () => {
    try {
      // Load profile
      const profileRes = await fetch(`/api/creator/onboard?username=${username}`);
      const profileData = await profileRes.json();

      if (profileData.success && profileData.exists) {
        setProfile(profileData.profile);
      }

      // Load prediction history
      const historyRes = await fetch(`/api/creator/predictions?username=${username}`);
      const historyData = await historyRes.json();

      if (historyData.success) {
        setPredictions(historyData.predictions || []);
      }
    } catch (error) {
      console.error('Failed to load creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleGetPrediction = async () => {
    if (!videoFile || !profile) return;

    setUploading(true);
    setPredicting(true);
    setPredictionResult(null);

    try {
      // Step 1: Upload video
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('transcript', transcript);
      formData.append('niche', niche);
      formData.append('goal', goal);
      formData.append('account_size', accountSize);
      formData.append('creator_username', username); // Link to creator

      const uploadRes = await fetch('/api/admin/predict', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();
      setUploading(false);

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      // Step 2: Get prediction with creator context
      const kaiPrediction = uploadData.prediction.predicted_dps;

      // Calculate creator context
      const { CreatorBaseline } = await import('@/lib/components/creator-baseline');
      const analysis = CreatorBaseline.analyze(kaiPrediction, profile);
      const adjustedDPS = CreatorBaseline.adjustPrediction(kaiPrediction, analysis);

      // Step 3: Save prediction with creator context
      await fetch('/api/creator/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_username: username,
          prediction_id: uploadData.prediction.prediction_id,
          video_id: uploadData.prediction.video_id,
          predicted_dps: kaiPrediction,
          relative_score: analysis.relativeScore,
          improvement_factor: analysis.improvementFactor,
          percentile_rank: analysis.percentileRank,
          adjusted_dps: adjustedDPS,
          contextualized_message: analysis.contextualizedPrediction
        })
      });

      setPredictionResult({
        ...uploadData.prediction,
        creator_context: {
          ...analysis,
          adjusted_dps: adjustedDPS
        }
      });

      // Reload prediction history
      loadCreatorData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading creator data...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
          <button
            onClick={() => router.push('/admin/creators')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
          >
            Back to Creators
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/creators')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to All Creators
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">@{profile.tiktok_username}</h1>
              <p className="text-gray-400">Creator Performance Baseline</p>
            </div>
            <button
              onClick={loadCreatorData}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
            >
              Refresh Baseline
            </button>
          </div>
        </div>

        {/* Baseline Metrics */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📊 Baseline Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-gray-400 text-sm mb-1">Baseline DPS</div>
              <div className="text-3xl font-bold text-blue-400">{profile.baseline_dps.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Total Videos</div>
              <div className="text-3xl font-bold">{profile.total_videos}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Avg Views</div>
              <div className="text-3xl font-bold">{Math.round(profile.avg_views).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Avg Likes</div>
              <div className="text-3xl font-bold">{Math.round(profile.avg_likes).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Avg Comments</div>
              <div className="text-3xl font-bold">{Math.round(profile.avg_comments).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Avg Shares</div>
              <div className="text-3xl font-bold">{Math.round(profile.avg_shares).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Avg Saves</div>
              <div className="text-3xl font-bold">{Math.round(profile.avg_saves).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Engagement Rate</div>
              <div className="text-3xl font-bold">{(profile.baseline_engagement_rate * 100).toFixed(2)}%</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="text-gray-400 text-sm mb-2">DPS Distribution (Percentiles)</div>
            <div className="flex gap-6">
              <span>25th: <span className="font-bold text-white">{profile.dps_percentiles.p25.toFixed(1)}</span></span>
              <span>50th: <span className="font-bold text-white">{profile.dps_percentiles.p50.toFixed(1)}</span></span>
              <span>75th: <span className="font-bold text-white">{profile.dps_percentiles.p75.toFixed(1)}</span></span>
              <span>90th: <span className="font-bold text-white">{profile.dps_percentiles.p90.toFixed(1)}</span></span>
            </div>
          </div>
        </div>

        {/* Upload & Predict Section */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🎯 Test New Content</h2>
          <p className="text-gray-400 mb-6">Upload a video to get a personalized prediction for @{profile.tiktok_username}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Video File (MP4)</label>
              <input
                type="file"
                accept="video/mp4"
                onChange={handleFileChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
              />
              {videoFile && (
                <div className="text-green-400 text-sm mt-2">
                  ✓ Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Transcript (Optional)</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste video transcript or leave empty for auto-transcription..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 h-32"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                >
                  <option value="side_hustles">Side Hustles</option>
                  <option value="finance">Finance</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                >
                  <option value="build_engaged_following">Build Engaged Following</option>
                  <option value="grow_audience">Grow Audience</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Account Size</label>
                <select
                  value={accountSize}
                  onChange={(e) => setAccountSize(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                >
                  <option value="small">Small (0-10K)</option>
                  <option value="medium">Medium (10K-100K)</option>
                  <option value="large">Large (100K-1M)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGetPrediction}
              disabled={!videoFile || uploading || predicting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-bold text-lg"
            >
              {uploading ? 'Uploading...' : predicting ? 'Getting Prediction...' : 'Get Personalized Prediction'}
            </button>
          </div>

          {/* Prediction Result */}
          {predictionResult && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-white mb-2">
                  {predictionResult.predicted_dps.toFixed(1)}
                </div>
                <div className="text-xl text-gray-300">Predicted DPS</div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold mb-3">📊 Creator Context for @{profile.tiktok_username}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Baseline:</span>
                    <span className="font-bold">{profile.baseline_dps.toFixed(1)} DPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Relative Score:</span>
                    <span className="font-bold text-blue-400">{predictionResult.creator_context.relativeScore}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Performance:</span>
                    <span className="font-bold">{predictionResult.creator_context.improvementFactor}x your average</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Percentile Rank:</span>
                    <span className="font-bold">{predictionResult.creator_context.percentileRank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Adjusted DPS:</span>
                    <span className="font-bold text-green-400">{predictionResult.creator_context.adjusted_dps.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/30 rounded-lg p-4 text-center">
                <div className="text-lg">
                  {predictionResult.creator_context.contextualizedPrediction}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prediction History */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">📈 Prediction History</h2>
          {predictions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No predictions yet. Upload a video above to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((pred, idx) => (
                <div key={pred.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">Video #{predictions.length - idx}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(pred.created_at).toLocaleDateString()} at {new Date(pred.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-400">{pred.predicted_dps.toFixed(1)} DPS</div>
                      <div className="text-sm text-gray-400">→ {pred.adjusted_dps.toFixed(1)} adjusted</div>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Relative Score:</span>
                      <span>{pred.relative_score}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Performance:</span>
                      <span>{pred.improvement_factor}x baseline</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rank:</span>
                      <span>{pred.percentile_rank}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-gray-900 rounded text-sm">
                    {pred.contextualized_message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

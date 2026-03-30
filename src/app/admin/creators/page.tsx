'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreatorProfile {
  id: string;
  tiktok_username: string;
  baseline_dps: number;
  total_videos: number;
  avg_views: number;
  last_scraped_at: string | null;
  analysis_status: string;
  dps_percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

export default function CreatorsDashboard() {
  const router = useRouter();
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [scrapeAll, setScrapeAll] = useState(false);
  const [scrapeLimit, setScrapeLimit] = useState(50);

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const res = await fetch('/api/creator/list');
      const data = await res.json();
      if (data.success) {
        setCreators(data.creators || []);
      }
    } catch (error) {
      console.error('Failed to load creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCreator = async () => {
    if (!newUsername.trim()) return;

    setScraping(true);
    setScrapeStatus('Starting scrape...');

    try {
      const res = await fetch('/api/creator/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiktok_username: newUsername,
          scrape_limit: scrapeAll ? 9999 : scrapeLimit, // 9999 = effectively all videos
          scrape_all: scrapeAll
        })
      });

      const data = await res.json();

      if (data.success) {
        setScrapeStatus(`✅ Scraped ${data.videos_analyzed} videos! Baseline: ${data.baseline_dps.toFixed(1)} DPS`);
        setTimeout(() => {
          setShowAddModal(false);
          setNewUsername('');
          setScrapeStatus('');
          loadCreators();
        }, 2000);
      } else {
        setScrapeStatus(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      setScrapeStatus(`❌ Error: ${error.message}`);
    } finally {
      setScraping(false);
    }
  };

  const handleRefreshBaseline = async (username: string) => {
    try {
      await fetch('/api/creator/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiktok_username: username, scrape_limit: 50 })
      });
      loadCreators();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading creators...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-gray-400">Manage creator baselines and personalized predictions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Creator
          </button>
        </div>

        {/* Creators List */}
        {creators.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-2">No Creators Yet</h2>
            <p className="text-gray-400 mb-6">Add your first creator to start building personalized predictions</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Add Your First Creator
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {creators.map((creator) => (
              <div
                key={creator.id}
                className="bg-gray-900 rounded-xl p-6 hover:bg-gray-850 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">@{creator.tiktok_username}</h2>
                    <div className="flex gap-6 text-gray-400 mb-4">
                      <span>
                        <span className="font-semibold text-blue-400">{creator.baseline_dps?.toFixed(1) || 'N/A'}</span> Baseline DPS
                      </span>
                      <span>
                        <span className="font-semibold text-white">{creator.total_videos || 0}</span> videos analyzed
                      </span>
                      <span>
                        <span className="font-semibold text-white">{Math.round(creator.avg_views || 0).toLocaleString()}</span> avg views
                      </span>
                      <span className="text-sm">
                        Last scraped: {getTimeSince(creator.last_scraped_at)}
                      </span>
                    </div>
                    {creator.analysis_status !== 'complete' && (
                      <div className="text-yellow-500 text-sm">
                        Status: {creator.analysis_status}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/admin/creators/${creator.tiktok_username}`)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleRefreshBaseline(creator.tiktok_username)}
                      className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Creator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Add New Creator</h2>
            <p className="text-gray-400 mb-6">
              Enter a TikTok username to scrape their channel and build a baseline
            </p>

            <input
              type="text"
              placeholder="e.g., sidehustlereview"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={scraping}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-blue-500"
            />

            {/* Scrape Options */}
            <div className="mb-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scrapeAll}
                  onChange={(e) => setScrapeAll(e.target.checked)}
                  disabled={scraping}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-600"
                />
                <span className="text-gray-300">
                  Scrape ALL videos <span className="text-gray-500 text-sm">(full channel history)</span>
                </span>
              </label>

              {!scrapeAll && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Video limit:</span>
                  <select
                    value={scrapeLimit}
                    onChange={(e) => setScrapeLimit(parseInt(e.target.value))}
                    disabled={scraping}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  >
                    <option value={25}>25 videos</option>
                    <option value={50}>50 videos</option>
                    <option value={100}>100 videos</option>
                    <option value={200}>200 videos</option>
                    <option value={500}>500 videos</option>
                  </select>
                </div>
              )}
            </div>

            {scrapeStatus && (
              <div className={`mb-4 p-3 rounded-lg ${scrapeStatus.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {scrapeStatus}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAddCreator}
                disabled={scraping || !newUsername.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold"
              >
                {scraping ? 'Scraping...' : 'Start Scrape'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewUsername('');
                  setScrapeStatus('');
                }}
                disabled={scraping}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

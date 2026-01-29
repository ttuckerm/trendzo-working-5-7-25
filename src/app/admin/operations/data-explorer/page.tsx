'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  History,
  Target,
  Eye,
  ExternalLink,
  Filter,
  Download,
  Flame,
  TrendingUp,
  FileText,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Hash,
  Calendar,
  Users
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Video {
  video_id: string;
  url: string;
  title: string;
  caption: string;
  creator_username: string;
  creator_nickname: string;
  creator_followers_count: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  duration_seconds: number;
  dps_score: number | null;
  dps_percentile: number | null;
  dps_classification: string | null;
  transcript_text: string | null;
  hashtags: string[];
  source: string;
  niche: string;
  scraped_at: string;
  upload_timestamp: string;
}

interface DataQuality {
  total: number;
  with_dps: number;
  with_transcript: number;
  with_classification: number;
  by_source: Record<string, number>;
  by_classification: Record<string, number>;
  missing_dps: number;
  missing_transcript: number;
  avg_dps: number;
  max_dps: number;
  min_dps: number;
}

interface DPSDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface TrainingReadiness {
  total_videos: number;
  with_dps_and_transcript: number;
  viral_percentage: number;
  has_minimum_samples: boolean;
  has_balanced_data: boolean;
  ready_for_training: boolean;
}

interface Filters {
  classification: string;
  source: string;
  hasTranscript: string;
  hasDPS: string;
  search: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        active 
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function StatCard({ 
  value, 
  label, 
  color = 'text-white',
  subValue
}: { 
  value: string | number; 
  label: string; 
  color?: string;
  subValue?: string;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  );
}

function Badge({ 
  children, 
  color 
}: { 
  children: React.ReactNode; 
  color: string;
}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {children}
    </span>
  );
}

function ProgressBar({ 
  value, 
  total, 
  color = 'bg-purple-500',
  label
}: { 
  value: number; 
  total: number; 
  color?: string;
  label: string;
}) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{value} / {total} ({percent.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DataExplorerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'browser' | 'quality' | 'history' | 'dps' | 'training'>('browser');
  const [videos, setVideos] = useState<Video[]>([]);
  const [quality, setQuality] = useState<DataQuality | null>(null);
  const [dpsDistribution, setDpsDistribution] = useState<DPSDistribution[]>([]);
  const [trainingReadiness, setTrainingReadiness] = useState<TrainingReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    classification: 'all',
    source: 'all',
    hasTranscript: 'all',
    hasDPS: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        classification: filters.classification,
        source: filters.source,
        hasTranscript: filters.hasTranscript,
        hasDPS: filters.hasDPS,
        search: filters.search
      });

      const [videosRes, qualityRes] = await Promise.all([
        fetch(`/api/data-explorer/videos?${params}`),
        fetch('/api/data-explorer/quality')
      ]);

      const videosData = await videosRes.json();
      const qualityData = await qualityRes.json();

      if (videosData.videos) {
        setVideos(videosData.videos);
        setPagination(prev => ({ ...prev, total: videosData.total || 0 }));
      }

      if (qualityData) {
        setQuality(qualityData);
        
        // Calculate DPS distribution
        if (qualityData.dps_histogram) {
          setDpsDistribution(qualityData.dps_histogram);
        }

        // Calculate training readiness
        setTrainingReadiness({
          total_videos: qualityData.total,
          with_dps_and_transcript: qualityData.with_dps_and_transcript || 0,
          viral_percentage: qualityData.viral_percentage || 0,
          has_minimum_samples: qualityData.total >= 500,
          has_balanced_data: qualityData.viral_percentage >= 10,
          ready_for_training: qualityData.total >= 500 && qualityData.viral_percentage >= 10
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  // Helper functions
  const getClassificationColor = (classification: string | null) => {
    const colors: Record<string, string> = {
      'mega-viral': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'viral': 'bg-green-500/20 text-green-400 border-green-500/50',
      'above-average': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'average': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      'below-average': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'poor': 'bg-red-500/20 text-red-400 border-red-500/50',
      'normal': 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };
    return colors[classification || ''] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render tabs
  const renderBrowserTab = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search by title, creator, or video ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.classification}
            onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value }))}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Classifications</option>
            <option value="mega-viral">Mega-Viral</option>
            <option value="viral">Viral</option>
            <option value="normal">Normal</option>
          </select>

          <select
            value={filters.hasTranscript}
            onChange={(e) => setFilters(prev => ({ ...prev, hasTranscript: e.target.value }))}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All (Transcript)</option>
            <option value="yes">Has Transcript</option>
            <option value="no">No Transcript</option>
          </select>

          <select
            value={filters.hasDPS}
            onChange={(e) => setFilters(prev => ({ ...prev, hasDPS: e.target.value }))}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All (DPS)</option>
            <option value="yes">Has DPS</option>
            <option value="no">Missing DPS</option>
          </select>
        </div>
      </div>

      {/* Video Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="text-left text-gray-400 text-sm font-medium p-4">Video</th>
                <th className="text-left text-gray-400 text-sm font-medium p-4">Creator</th>
                <th className="text-right text-gray-400 text-sm font-medium p-4">Views</th>
                <th className="text-right text-gray-400 text-sm font-medium p-4">Likes</th>
                <th className="text-center text-gray-400 text-sm font-medium p-4">DPS</th>
                <th className="text-center text-gray-400 text-sm font-medium p-4">Class</th>
                <th className="text-center text-gray-400 text-sm font-medium p-4">Transcript</th>
                <th className="text-center text-gray-400 text-sm font-medium p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2 className="animate-spin mx-auto text-purple-500" size={24} />
                    <p className="text-gray-400 mt-2">Loading videos...</p>
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No videos found matching your filters.
                  </td>
                </tr>
              ) : (
                videos.map((video) => (
                  <tr key={video.video_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4">
                      <div className="max-w-[250px]">
                        <p className="text-white text-sm truncate">
                          {video.title || video.caption?.slice(0, 50) || 'Untitled'}
                        </p>
                        <p className="text-gray-500 text-xs truncate font-mono">{video.video_id}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300 text-sm">@{video.creator_username}</td>
                    <td className="p-4 text-right text-gray-300 text-sm font-mono">
                      {formatNumber(video.views_count)}
                    </td>
                    <td className="p-4 text-right text-gray-300 text-sm font-mono">
                      {formatNumber(video.likes_count)}
                    </td>
                    <td className="p-4 text-center">
                      {video.dps_score !== null ? (
                        <span className={`font-bold font-mono ${
                          video.dps_score >= 70 ? 'text-green-400' :
                          video.dps_score >= 50 ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {video.dps_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-red-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {video.dps_classification ? (
                        <Badge color={getClassificationColor(video.dps_classification)}>
                          {video.dps_classification}
                        </Badge>
                      ) : (
                        <span className="text-red-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {video.transcript_text ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => window.open(video.url, '_blank')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Open on TikTok"
                        >
                          <ExternalLink size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Showing {Math.min(((pagination.page - 1) * pagination.limit) + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              disabled={pagination.page * pagination.limit >= pagination.total}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQualityTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Completeness */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Data Completeness</h3>
          <div className="space-y-4">
            <ProgressBar
              label="Has DPS Score"
              value={quality?.with_dps || 0}
              total={quality?.total || 0}
              color="bg-green-500"
            />
            <ProgressBar
              label="Has Transcript"
              value={quality?.with_transcript || 0}
              total={quality?.total || 0}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Has Classification"
              value={quality?.with_classification || 0}
              total={quality?.total || 0}
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Data Issues */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-yellow-400" size={18} />
            Data Issues
          </h3>
          <div className="space-y-3">
            {quality?.missing_dps && quality.missing_dps > 0 ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div>
                  <p className="text-yellow-400 font-medium">{quality.missing_dps} videos missing DPS</p>
                  <p className="text-yellow-400/70 text-sm">Need to run DPS calculation</p>
                </div>
                <button className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30">
                  Fix
                </button>
              </div>
            ) : null}
            
            {quality?.missing_transcript && quality.missing_transcript > 0 ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div>
                  <p className="text-orange-400 font-medium">{quality.missing_transcript} videos missing transcript</p>
                  <p className="text-orange-400/70 text-sm">Limited feature extraction possible</p>
                </div>
              </div>
            ) : null}

            {(!quality?.missing_dps || quality.missing_dps === 0) &&
             (!quality?.missing_transcript || quality.missing_transcript === 0) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle className="text-green-400" size={18} />
                <p className="text-green-400">All data quality checks passed!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* By Source */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Videos by Source</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(quality?.by_source || {}).map(([source, count]) => (
            <div key={source} className="p-4 rounded-lg bg-gray-800/50 text-center">
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-sm text-gray-400 truncate">{source || 'Unknown'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* By Classification */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Distribution by Classification</h3>
        <div className="space-y-3">
          {['mega-viral', 'viral', 'normal', 'unclassified'].map((classification) => {
            const count = quality?.by_classification?.[classification] || 0;
            const percent = quality?.total ? (count / quality.total) * 100 : 0;
            const colorClass = classification === 'mega-viral' ? 'bg-purple-500' :
                              classification === 'viral' ? 'bg-green-500' :
                              classification === 'normal' ? 'bg-gray-500' :
                              'bg-gray-600';

            return (
              <div key={classification} className="flex items-center gap-4">
                <div className="w-28">
                  <Badge color={getClassificationColor(classification === 'unclassified' ? null : classification)}>
                    {classification}
                  </Badge>
                </div>
                <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="w-24 text-right">
                  <span className="text-white font-medium">{count}</span>
                  <span className="text-gray-500 ml-1">({percent.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Scrape Job History</h3>
        <p className="text-gray-400 mb-4">
          Track all past scraping jobs with keywords used, dates, and results.
        </p>
        
        {/* This would be populated from actual scrape job history */}
        <div className="space-y-3">
          {quality?.by_source && Object.entries(quality.by_source).map(([source, count]) => (
            <div key={source} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Database size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{source}</p>
                  <p className="text-sm text-gray-500">Source identifier</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-500">videos</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Analysis Placeholder */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Keyword Usage Analysis</h3>
        <p className="text-gray-400 mb-4">
          Tracks which keywords have been used across all scrapes to prevent duplication.
        </p>
        <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
          <Hash size={32} className="mx-auto mb-2 opacity-50" />
          <p>Keyword tracking will appear here after scrape jobs complete</p>
        </div>
      </div>
    </div>
  );

  const renderDPSTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          value={quality?.avg_dps?.toFixed(1) || '—'}
          label="Average DPS Score"
          color="text-white"
        />
        <StatCard
          value={quality?.max_dps?.toFixed(1) || '—'}
          label="Highest DPS"
          color="text-green-400"
        />
        <StatCard
          value={quality?.min_dps?.toFixed(1) || '—'}
          label="Lowest DPS"
          color="text-red-400"
        />
      </div>

      {/* DPS Distribution */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">DPS Score Distribution</h3>
        
        {dpsDistribution.length > 0 ? (
          <div className="space-y-2">
            {dpsDistribution.map((item) => (
              <div key={item.range} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-400">{item.range}</div>
                <div className="flex-1 h-8 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="w-20 text-right">
                  <span className="text-white font-medium">{item.count}</span>
                  <span className="text-gray-500 text-sm ml-1">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p>DPS distribution will appear here once data is loaded</p>
            </div>
          </div>
        )}
      </div>

      {/* DPS by Classification */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Classification Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
            <Flame className="mx-auto text-purple-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-purple-400">
              {quality?.by_classification?.['mega-viral'] || 0}
            </p>
            <p className="text-sm text-gray-400">Mega-Viral</p>
            <p className="text-xs text-gray-500">DPS ≥ 85</p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <TrendingUp className="mx-auto text-green-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-green-400">
              {quality?.by_classification?.['viral'] || 0}
            </p>
            <p className="text-sm text-gray-400">Viral</p>
            <p className="text-xs text-gray-500">DPS 70-84</p>
          </div>
          <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg text-center">
            <Target className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-400">
              {quality?.by_classification?.['normal'] || 0}
            </p>
            <p className="text-sm text-gray-400">Normal</p>
            <p className="text-xs text-gray-500">DPS &lt; 70</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrainingTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Training Data Requirements</h3>
        <div className="space-y-4">
          {[
            {
              label: 'Videos with DPS + Transcript',
              required: 'Required for feature extraction',
              current: trainingReadiness?.with_dps_and_transcript || 0,
              target: 500,
              status: (trainingReadiness?.with_dps_and_transcript || 0) >= 500
            },
            {
              label: 'Balanced Classification',
              required: 'At least 10% viral content',
              current: trainingReadiness?.viral_percentage || 0,
              target: 10,
              unit: '%',
              status: (trainingReadiness?.viral_percentage || 0) >= 10
            },
            {
              label: 'Minimum Sample Size',
              required: 'At least 500 videos total',
              current: quality?.total || 0,
              target: 500,
              status: (quality?.total || 0) >= 500
            },
          ].map((check) => (
            <div key={check.label} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{check.label}</p>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    check.status 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {check.current}{check.unit || ''} / {check.target}{check.unit || ''}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{check.required}</p>
              </div>
              <div>
                {check.status ? (
                  <CheckCircle className="text-green-400" size={24} />
                ) : (
                  <AlertTriangle className="text-yellow-400" size={24} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ready for Training?</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {trainingReadiness?.ready_for_training ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="text-green-400" size={24} />
                <div>
                  <p className="text-green-400 font-medium">All requirements met!</p>
                  <p className="text-green-400/70 text-sm">You can start the training pipeline</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="text-yellow-400" size={24} />
                <div>
                  <p className="text-yellow-400 font-medium">Requirements not met</p>
                  <p className="text-yellow-400/70 text-sm">Complete the requirements above to enable training</p>
                </div>
              </div>
            )}
          </div>
          <button
            disabled={!trainingReadiness?.ready_for_training}
            onClick={() => router.push('/admin/operations/training/jobs')}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Play size={18} />
            Start Training Pipeline
          </button>
        </div>
      </div>

      {/* Training Data Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={quality?.total || 0}
          label="Total Videos"
          color="text-white"
        />
        <StatCard
          value={`${trainingReadiness?.viral_percentage?.toFixed(1) || 0}%`}
          label="Viral Percentage"
          color={trainingReadiness?.has_balanced_data ? 'text-green-400' : 'text-yellow-400'}
        />
        <StatCard
          value={quality?.with_dps || 0}
          label="With DPS Score"
          color="text-blue-400"
        />
        <StatCard
          value={quality?.with_transcript || 0}
          label="With Transcript"
          color="text-purple-400"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Explorer</h1>
            <p className="text-gray-400">Browse, verify, and analyze your scraped video data</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <StatCard value={quality?.total || 0} label="Total Videos" />
        <StatCard value={quality?.with_dps || 0} label="Has DPS Score" color="text-green-400" />
        <StatCard value={quality?.with_transcript || 0} label="Has Transcript" color="text-blue-400" />
        <StatCard
          value={(quality?.by_classification?.['mega-viral'] || 0) + (quality?.by_classification?.['viral'] || 0)}
          label="Viral Videos"
          color="text-purple-400"
        />
        <StatCard value={quality?.missing_dps || 0} label="Missing DPS" color="text-yellow-400" />
        <StatCard value={quality?.missing_transcript || 0} label="Missing Transcript" color="text-orange-400" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton
          active={activeTab === 'browser'}
          onClick={() => setActiveTab('browser')}
          icon={Database}
          label="Video Browser"
        />
        <TabButton
          active={activeTab === 'quality'}
          onClick={() => setActiveTab('quality')}
          icon={CheckCircle}
          label="Data Quality"
        />
        <TabButton
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          icon={History}
          label="Scrape History"
        />
        <TabButton
          active={activeTab === 'dps'}
          onClick={() => setActiveTab('dps')}
          icon={BarChart3}
          label="DPS Analysis"
        />
        <TabButton
          active={activeTab === 'training'}
          onClick={() => setActiveTab('training')}
          icon={Target}
          label="Training Readiness"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'browser' && renderBrowserTab()}
      {activeTab === 'quality' && renderQualityTab()}
      {activeTab === 'history' && renderHistoryTab()}
      {activeTab === 'dps' && renderDPSTab()}
      {activeTab === 'training' && renderTrainingTab()}

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Video Details</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Video ID</p>
                <p className="text-white font-mono text-sm">{selectedVideo.video_id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Title / Caption</p>
                <p className="text-white">{selectedVideo.title || selectedVideo.caption || 'No caption'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Creator</p>
                  <p className="text-white">@{selectedVideo.creator_username}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">DPS Score</p>
                  <p className={`font-bold ${
                    selectedVideo.dps_score && selectedVideo.dps_score >= 70 ? 'text-green-400' :
                    selectedVideo.dps_score && selectedVideo.dps_score >= 50 ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {selectedVideo.dps_score?.toFixed(2) || 'Not calculated'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Views', value: selectedVideo.views_count },
                  { label: 'Likes', value: selectedVideo.likes_count },
                  { label: 'Comments', value: selectedVideo.comments_count },
                  { label: 'Shares', value: selectedVideo.shares_count },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-lg bg-gray-800/50">
                    <p className="text-lg font-bold text-white">{formatNumber(stat.value)}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
              
              {selectedVideo.hashtags && selectedVideo.hashtags.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.hashtags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedVideo.transcript_text && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Transcript</p>
                  <div className="bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {selectedVideo.transcript_text}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-800">
                <button
                  onClick={() => window.open(selectedVideo.url, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                  View on TikTok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}













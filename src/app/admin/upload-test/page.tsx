'use client';

import { useState, useEffect, FormEvent, useCallback, DragEvent, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { VPSGauge } from '@/components/ui/trendzo/DPSGauge';
import { ScoreBar } from '@/components/ui/trendzo/ScoreBar';
import { Upload, Link2, Sparkles, ArrowRight, Zap, FileVideo, Database, ChevronDown, ChevronUp, Play, Files, Square, AlertCircle, CheckCircle2, Loader2, XCircle, Search, User, Hash } from 'lucide-react';
import { useAdminUserWithDevFallback } from '@/hooks/useAdminUser';
import type { TrainingIngestResponse, TrainingRunSummary, MetricCollectorResult, MetricScheduleRow } from '@/lib/training/training-ingest-types';
import { getActiveComponentCount, NICHE_REGISTRY, getNicheByKey } from '@/lib/prediction/system-registry';

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
  actual_dps: number | null;
  dps_v2_display_score: number | null;
  actual_views: number | null;
  created_at: string;
}

// Upload mode for 3-mode toggle (Prompt 1)
type UploadMode = 'manual' | 'auto-single' | 'auto-batch';

interface BatchQueueItem {
  id: string;
  url: string;
  status: 'queued' | 'scraping' | 'running' | 'done' | 'failed';
  runId?: string;
  predictedDps?: number;
  predictedTier?: string;
  scheduleCount?: number;
  error?: string;
  actualDps?: number;
  actualTier?: string;
  isMature?: boolean;
}

type ScrapeMethod = 'download' | 'apify';
type ScrapeInputMode = 'url' | 'keyword' | 'creator';

interface ScrapeSearchResult {
  id: string;
  url: string;
  text: string;
  authorName: string | null;
  duration: number | null;
  hashtags: string[];
  views: number | null;
  likes: number | null;
  thumbnail: string | null;
  createTime: string | null;
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

// ═══════════════════════════════════════════════════════════════════════════════
// Training Ingest Section (Phase 82) — Chairman-only, feature-flagged
// ═══════════════════════════════════════════════════════════════════════════════

const TRAINING_INGEST_FLAG = process.env.NEXT_PUBLIC_TRAINING_INGEST_ENABLED === 'true';
const METRIC_COLLECTOR_FLAG = process.env.NEXT_PUBLIC_METRIC_COLLECTOR_ENABLED === 'true';

/** CLEAN / NOT CLEAN pill badge */
function ContaminationBadge({ isClean }: { isClean: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
      isClean
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
    }`}>
      {isClean ? 'CLEAN' : 'NOT CLEAN'}
    </span>
  );
}

/** Expandable contamination proof inspector */
function ContaminationProofInspector({ proof }: { proof: { inputs_hash: string; pipeline_version: string; flags: string[]; generated_at: string } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="text-xs space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Proof:</span>
        <code className="text-emerald-300 font-mono text-[10px]">
          {expanded ? proof.inputs_hash : `${proof.inputs_hash.slice(0, 16)}...`}
        </code>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[9px] px-1 py-0.5 rounded border border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
        >
          {expanded ? 'Less' : 'More'}
        </button>
      </div>
      {expanded && (
        <div className="pl-2 border-l border-white/10 space-y-0.5 text-[10px]">
          <div><span className="text-gray-500">Version:</span> <span className="text-white">{proof.pipeline_version}</span></div>
          <div><span className="text-gray-500">Flags:</span> <span className="text-white">{proof.flags.join(', ') || 'none'}</span></div>
          <div><span className="text-gray-500">Generated:</span> <span className="text-gray-300">{new Date(proof.generated_at).toLocaleString()}</span></div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Full hash:</span>
            <code className="text-emerald-300 font-mono break-all">{proof.inputs_hash}</code>
          </div>
        </div>
      )}
    </div>
  );
}

/** Copy text to clipboard, show brief visual feedback */
function CopyableId({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-gray-400 text-xs shrink-0">{label}:</span>
      <code className="text-xs font-mono text-white truncate max-w-[140px]" title={value}>
        {value}
      </code>
      <button
        onClick={handleCopy}
        className="shrink-0 px-1.5 py-0.5 rounded text-[10px] border transition-all
          hover:bg-white/10 active:scale-95
          border-white/10 text-gray-400 hover:text-white"
        title="Copy full ID"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

/** Inline toast for status messages */
function InlineToast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`px-3 py-2 rounded-lg text-xs font-medium animate-pulse
      ${type === 'success' ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-red-900/40 text-red-300 border border-red-700/50'}`}
    >
      {message}
    </div>
  );
}

function TrainingIngestSection() {
  const { isChairman } = useAdminUserWithDevFallback();
  const [isOpen, setIsOpen] = useState(false);

  // Training ingest form state
  const [tiVideoFile, setTiVideoFile] = useState<File | null>(null);
  const [tiTranscript, setTiTranscript] = useState('');
  const [tiNiche, setTiNiche] = useState(NICHE_REGISTRY[0].key);
  const [tiAccountSize, setTiAccountSize] = useState('small (0-10K)');
  const [tiPlatformVideoId, setTiPlatformVideoId] = useState('');
  const [tiLoading, setTiLoading] = useState(false);
  const [tiResult, setTiResult] = useState<TrainingIngestResponse | null>(null);
  const [tiError, setTiError] = useState('');

  // Recent training runs
  const [trainingRuns, setTrainingRuns] = useState<TrainingRunSummary[]>([]);
  const [loadingTrainingRuns, setLoadingTrainingRuns] = useState(false);

  // Row expander state
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Attach inline state (per-row, scoped by attachRunId)
  const [attachRunId, setAttachRunId] = useState<string | null>(null);
  const [attachPlatformId, setAttachPlatformId] = useState('');
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Metric collector state (Phase 83)
  const [collectorRunning, setCollectorRunning] = useState(false);
  const [collectorResult, setCollectorResult] = useState<MetricCollectorResult | null>(null);

  if (!TRAINING_INGEST_FLAG || !isChairman) return null;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTrainingRuns = async () => {
    setLoadingTrainingRuns(true);
    try {
      const res = await fetch('/api/admin/prediction-runs?detail=true');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Failed to fetch training runs:', data.error || res.statusText);
        return;
      }
      const data = await res.json();
      setTrainingRuns(data);
    } catch (err) {
      console.error('Failed to fetch training runs:', err);
    } finally {
      setLoadingTrainingRuns(false);
    }
  };

  const handleRunCollector = async (runId?: string) => {
    setCollectorRunning(true);
    setCollectorResult(null);
    try {
      const res = await fetch('/api/admin/metric-collector/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, limit: 20 }),
      });
      let data: any;
      try { data = await res.json(); } catch { throw new Error(`Server ${res.status} (non-JSON)`); }
      if (!res.ok) throw new Error(data.error || `Failed: ${res.status}`);
      setCollectorResult(data);
      showToast(`Collector: ${data.succeeded} succeeded, ${data.failed} failed`, data.failed > 0 ? 'error' : 'success');
      fetchTrainingRuns();
    } catch (err: any) {
      showToast(err.message || String(err), 'error');
    } finally {
      setCollectorRunning(false);
    }
  };

  const handleTrainingIngest = async (e: FormEvent) => {
    e.preventDefault();
    if (!tiVideoFile) return;
    setTiLoading(true);
    setTiError('');
    setTiResult(null);

    try {
      const formData = new FormData();
      formData.append('videoFile', tiVideoFile);
      formData.append('transcript', tiTranscript);
      formData.append('niche', tiNiche);
      formData.append('goal', 'engagement');
      formData.append('accountSize', tiAccountSize);
      formData.append('platform', 'tiktok');
      if (tiPlatformVideoId.trim()) {
        formData.append('platformVideoId', tiPlatformVideoId.trim());
      }

      const res = await fetch('/api/admin/training-ingest', {
        method: 'POST',
        body: formData,
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status} ${res.statusText} (non-JSON response)`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Server returned ${res.status}: ${JSON.stringify(data)}`);
      }

      setTiResult(data);

      // Show schedule warning if present
      if (data.schedule_error) {
        showToast(`Ingest succeeded but schedules failed: ${data.schedule_error}`, 'error');
      }

      // Refresh runs list
      fetchTrainingRuns();
    } catch (err: any) {
      setTiError(err.message || String(err) || 'Unknown error occurred');
    } finally {
      setTiLoading(false);
    }
  };

  const handleAttachPlatformId = async () => {
    if (!attachRunId) return;
    const trimmed = attachPlatformId.trim();
    if (!trimmed) {
      setAttachError('Paste a TikTok URL first');
      return;
    }
    if (!trimmed.startsWith('http') || !trimmed.includes('/video/')) {
      setAttachError('Need a full TikTok URL (e.g. https://www.tiktok.com/@user/video/1234567890)');
      return;
    }
    setAttachLoading(true);
    setAttachError('');
    try {
      const res = await fetch(`/api/admin/prediction-runs/${attachRunId}/attach-platform-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'tiktok',
          platform_video_id: attachPlatformId.trim(),
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status} (non-JSON)`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Attach failed: ${res.status}`);
      }

      // Optimistically update local state so UI reflects immediately
      const attachedUrl = data.post_url || attachPlatformId.trim();
      const schedCount = data.schedule_count ?? data.updated_count ?? 0;
      setTrainingRuns(prev => prev.map(r =>
        r.run_id === attachRunId
          ? {
              ...r,
              source_meta: { ...(r.source_meta as any || {}), post_url: attachedUrl },
              schedules: {
                ...r.schedules,
                platform_video_id: attachedUrl,
                total: Math.max(r.schedules.total, schedCount),
                pending: r.schedules.total === 0 ? schedCount : r.schedules.pending,
              },
            }
          : r
      ));

      showToast(`Attached to ${data.updated_count} schedule(s)`, 'success');
      setAttachRunId(null);
      setAttachPlatformId('');
      fetchTrainingRuns();
    } catch (err: any) {
      setAttachError(err.message || String(err));
    } finally {
      setAttachLoading(false);
    }
  };

  const copyScheduleSQL = (runId: string) => {
    const sql = `SELECT id, check_type, status, scheduled_at, platform_video_id, actual_metrics, completed_at\nFROM metric_check_schedule\nWHERE prediction_run_id = '${runId}'\nORDER BY scheduled_at;`;
    navigator.clipboard.writeText(sql);
    showToast('SQL copied to clipboard', 'success');
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden">
      {/* Header / Toggle */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && trainingRuns.length === 0) fetchTrainingRuns();
        }}
        className="w-full px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-indigo-400" />
          <span className="text-lg font-semibold text-indigo-200">Training Ingest</span>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            CHAIRMAN
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-8 pb-8 space-y-6">
          {/* Toast */}
          {toast && <InlineToast message={toast.message} type={toast.type} />}

          <p className="text-sm text-gray-400">
            Upload videos to build training data. Predictions run blind (no scores shown).
            Metric collection scheduled at 4h, 24h, 48h, 7d.
          </p>

          {/* Ingest Form */}
          <form onSubmit={handleTrainingIngest} className="space-y-4">
            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-indigo-200">Video File</label>
              <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                ${tiVideoFile ? 'border-green-500/50 bg-green-500/5' : 'border-indigo-500/30 hover:border-indigo-500/50 bg-white/[0.02]'}`}
              >
                <input
                  type="file"
                  accept="video/mp4,video/*"
                  onChange={(e) => setTiVideoFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {tiVideoFile ? (
                  <div className="space-y-1">
                    <p className="text-green-400 font-medium">{tiVideoFile.name}</p>
                    <p className="text-xs text-gray-400">{(tiVideoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Click to select a video file (MP4)</p>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-sm font-medium mb-2 text-indigo-200">Transcript (optional)</label>
              <textarea
                value={tiTranscript}
                onChange={(e) => setTiTranscript(e.target.value)}
                rows={3}
                placeholder="Paste transcript or leave empty for Whisper auto-transcription..."
                className="w-full px-4 py-3 bg-white/[0.05] border border-indigo-500/20 rounded-xl
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>

            {/* Niche + Account Size row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-indigo-200">Niche</label>
                <select
                  value={tiNiche}
                  onChange={(e) => setTiNiche(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-indigo-500/20 rounded-xl
                    focus:ring-2 focus:ring-indigo-500 text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  {NICHE_REGISTRY.map(n => (
                    <option key={n.key} value={n.key}>{n.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-indigo-200">Account Size</label>
                <select
                  value={tiAccountSize}
                  onChange={(e) => setTiAccountSize(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-indigo-500/20 rounded-xl
                    focus:ring-2 focus:ring-indigo-500 text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="small (0-10K)">Small (0-10K)</option>
                  <option value="medium (10K-100K)">Medium (10K-100K)</option>
                  <option value="large (100K-1M)">Large (100K-1M)</option>
                  <option value="mega (1M+)">Mega (1M+)</option>
                </select>
              </div>
            </div>

            {/* Platform Video ID (optional) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-indigo-200">
                Platform Video ID (optional — can attach later)
              </label>
              <input
                type="text"
                value={tiPlatformVideoId}
                onChange={(e) => setTiPlatformVideoId(e.target.value)}
                placeholder="TikTok video ID or URL..."
                className="w-full px-4 py-3 bg-white/[0.05] border border-indigo-500/20 rounded-xl
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!tiVideoFile || tiLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600
                hover:from-indigo-500 hover:to-purple-500
                disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {tiLoading ? (
                <>
                  <span className="animate-spin">&#9696;</span>
                  Running blind ingest...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Ingest for Training
                </>
              )}
            </button>
          </form>

          {/* Ingest Error */}
          {tiError && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <p className="text-sm font-medium text-red-200 mb-1">Ingest failed</p>
              <p className="text-sm text-red-300 font-mono break-all">{tiError}</p>
            </div>
          )}

          {/* Ingest Result */}
          {tiResult && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-green-300 font-medium">Ingest successful</p>
                <ContaminationBadge isClean={!!tiResult.contamination_proof} />
              </div>
              <div className="space-y-1.5">
                <CopyableId label="Run ID" value={tiResult.run_id} />
                <CopyableId label="Video ID" value={tiResult.video_id} />
              </div>
              <div className="flex gap-4 text-xs text-gray-300">
                <div>Schedules: <span className="text-white font-medium">{tiResult.schedule_count}</span></div>
                <div>Platform ID: <span className="text-white font-medium">{tiResult.platform_video_id_attached ? 'Attached' : 'Not yet'}</span></div>
              </div>
              {tiResult.contamination_proof && (
                <ContaminationProofInspector proof={tiResult.contamination_proof} />
              )}
              {tiResult.schedule_error && (
                <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-2 mt-2">
                  <p className="text-xs text-yellow-300">Schedule warning: {tiResult.schedule_error}</p>
                </div>
              )}
              {/* Copy SQL helper */}
              <button
                onClick={() => copyScheduleSQL(tiResult.run_id)}
                className="text-[10px] px-2 py-1 rounded border border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
              >
                Copy SQL lookup
              </button>
            </div>
          )}

          {/* Modal removed — attach is now inline in expanded row */}

          {/* ─── Metric Collector (Phase 83) ──────────────────────────── */}
          {METRIC_COLLECTOR_FLAG && (
            <div className="border-t border-indigo-500/20 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-200">Metric Collector</span>
                </div>
                <button
                  onClick={() => handleRunCollector()}
                  disabled={collectorRunning}
                  className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 disabled:bg-gray-800
                    rounded-lg text-xs transition-colors text-emerald-200 flex items-center gap-1.5"
                >
                  {collectorRunning ? (
                    <><span className="animate-spin text-[10px]">&#9696;</span> Running...</>
                  ) : (
                    <><Play className="w-3 h-3" /> Run Collector Now</>
                  )}
                </button>
              </div>
              {collectorResult && (
                <div className="mt-2 bg-white/[0.03] border border-white/5 rounded-lg p-3 text-xs">
                  <div className="flex gap-4 text-gray-300">
                    <span>Processed: <span className="text-white font-medium">{collectorResult.processed}</span></span>
                    <span>Succeeded: <span className="text-green-400 font-medium">{collectorResult.succeeded}</span></span>
                    <span>Failed: <span className="text-red-400 font-medium">{collectorResult.failed}</span></span>
                    {collectorResult.skipped > 0 && <span>Skipped: <span className="text-gray-400">{collectorResult.skipped}</span></span>}
                  </div>
                  {collectorResult.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {collectorResult.details.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className={d.status === 'completed' ? 'text-green-400' : d.status === 'failed' ? 'text-red-400' : 'text-gray-500'}>
                            {d.status === 'completed' ? '\u2713' : d.status === 'failed' ? '\u2717' : '-'}
                          </span>
                          <span className="text-gray-400">{d.check_type}</span>
                          <span className="font-mono text-gray-500 truncate max-w-[120px]">{d.platform_video_id}</span>
                          {d.metrics && <span className="text-gray-300">{d.metrics.views} views</span>}
                          {d.error && <span className="text-red-400 truncate max-w-[200px]">{d.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Recent Training Runs ──────────────────────────────────── */}
          <div className="border-t border-indigo-500/20 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-indigo-200">Recent Training Runs</h3>
              <button
                onClick={fetchTrainingRuns}
                disabled={loadingTrainingRuns}
                className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 disabled:bg-gray-800 rounded-lg text-xs transition-colors text-indigo-200"
              >
                {loadingTrainingRuns ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {trainingRuns.length === 0 && !loadingTrainingRuns && (
              <p className="text-sm text-gray-500 text-center py-4">No training ingest runs yet.</p>
            )}

            {trainingRuns.length > 0 && (
              <div className="space-y-0">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_100px_130px_80px] gap-2 text-xs text-gray-400 border-b border-white/10 pb-2 px-1">
                  <div>Date / Niche</div>
                  <div>Platform ID</div>
                  <div>Schedules</div>
                  <div className="text-right">Actions</div>
                </div>

                {/* Table rows */}
                {trainingRuns.map((run) => {
                  const meta = run.source_meta as Record<string, any> | null;
                  const tiktokUrl = meta?.post_url || meta?.platform_url || run.schedules.platform_video_id || null;
                  return (
                  <div key={run.run_id} className="border-b border-white/5">
                    {/* Main row */}
                    <div
                      className="grid grid-cols-[1fr_100px_130px_80px] gap-2 items-center py-3 px-1
                        hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => setExpandedRunId(expandedRunId === run.run_id ? null : run.run_id)}
                    >
                      <div>
                        <div className="text-xs text-gray-300">
                          {new Date(run.created_at).toLocaleDateString()}{' '}
                          {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-500">{run.niche || 'no niche'}</div>
                      </div>
                      <div className="text-xs font-mono truncate">
                        {tiktokUrl
                          ? <span className="text-green-400" title={tiktokUrl}>{tiktokUrl.slice(0, 12)}...</span>
                          : <span className="text-yellow-500">No URL</span>
                        }
                      </div>
                      <div className="text-xs">
                        <span className="text-yellow-400">{run.schedules.pending}</span>
                        <span className="text-gray-600"> pend </span>
                        <span className="text-green-400">{run.schedules.completed}</span>
                        <span className="text-gray-600"> done </span>
                        <span className="text-gray-500">/ {run.schedules.total}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        {!tiktokUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRunId(run.run_id);
                              setAttachRunId(run.run_id);
                              setAttachPlatformId('');
                              setAttachError('');
                            }}
                            className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 rounded text-[10px] text-indigo-200 whitespace-nowrap"
                          >
                            Attach
                          </button>
                        )}
                        <span className="text-gray-600 text-xs">{expandedRunId === run.run_id ? '\u25B2' : '\u25BC'}</span>
                      </div>
                    </div>

                    {/* Expanded detail row */}
                    {expandedRunId === run.run_id && (
                      <div className="bg-white/[0.02] border-t border-white/5 px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <CopyableId label="Run ID" value={run.run_id} />
                          {run.contamination_lock != null && (
                            <ContaminationBadge isClean={run.contamination_lock === true} />
                          )}
                        </div>
                        <CopyableId label="Video ID" value={run.video_id} />
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 text-xs">Created:</span>
                          <span className="text-xs text-white">{new Date(run.created_at).toLocaleString()}</span>
                        </div>
                        {/* TikTok URL: display or inline attach */}
                        {tiktokUrl ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-gray-400 text-xs shrink-0">TikTok URL:</span>
                            <a
                              href={tiktokUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-indigo-300 hover:text-indigo-200 truncate max-w-[340px]"
                              title={tiktokUrl}
                            >
                              {tiktokUrl}
                            </a>
                            <button
                              onClick={() => { navigator.clipboard.writeText(tiktokUrl); showToast('URL copied', 'success'); }}
                              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                              Copy
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="text-gray-400 text-xs">TikTok URL:</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={attachRunId === run.run_id ? attachPlatformId : ''}
                                onChange={(e) => {
                                  setAttachRunId(run.run_id);
                                  setAttachPlatformId(e.target.value);
                                  setAttachError('');
                                }}
                                placeholder="https://www.tiktok.com/@user/video/..."
                                autoFocus
                                className="flex-1 px-3 py-1.5 bg-white/[0.05] border border-indigo-500/20 rounded-lg
                                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs text-white placeholder-gray-500 font-mono"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAttachPlatformId(); }}
                              />
                              <button
                                onClick={() => handleAttachPlatformId()}
                                disabled={attachRunId !== run.run_id || !attachPlatformId.trim() || attachLoading}
                                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700
                                  disabled:cursor-not-allowed rounded-lg font-medium transition-all whitespace-nowrap"
                              >
                                {attachLoading && attachRunId === run.run_id ? 'Saving...' : 'Attach'}
                              </button>
                            </div>
                            {attachError && attachRunId === run.run_id && (
                              <p className="text-xs text-red-400 font-mono break-all">{attachError}</p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-400">Schedules:</span>
                          <span className="text-yellow-400">{run.schedules.pending} pending</span>
                          <span className="text-green-400">{run.schedules.completed} completed</span>
                          <span className="text-red-400">{run.schedules.failed ?? (run.schedules.total - run.schedules.pending - run.schedules.completed)} failed</span>
                        </div>

                        {/* Contamination proof inspector */}
                        {run.contamination_proof && (
                          <ContaminationProofInspector proof={run.contamination_proof} />
                        )}

                        {/* Schedule detail rows (Phase 83) */}
                        {run.schedule_rows && run.schedule_rows.length > 0 && (
                          <div className="mt-2 border border-white/5 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-[60px_80px_1fr_100px] gap-1 text-[10px] text-gray-500 bg-white/[0.03] px-2 py-1 border-b border-white/5">
                              <div>Type</div>
                              <div>Status</div>
                              <div>Scheduled / Completed</div>
                              <div>Metrics</div>
                            </div>
                            {run.schedule_rows.map((sched: MetricScheduleRow) => (
                              <div key={sched.id} className="grid grid-cols-[60px_80px_1fr_100px] gap-1 text-[10px] px-2 py-1.5 border-b border-white/[0.03] hover:bg-white/[0.02]">
                                <div className="text-white font-medium">{sched.check_type}</div>
                                <div>
                                  <span className={
                                    sched.status === 'completed' ? 'text-green-400' :
                                    sched.status === 'failed' ? 'text-red-400' :
                                    sched.status === 'pending' ? 'text-yellow-400' :
                                    'text-gray-500'
                                  }>
                                    {sched.status}
                                  </span>
                                </div>
                                <div className="text-gray-400">
                                  {new Date(sched.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  {sched.completed_at && (
                                    <span className="text-gray-600"> {'\u2192'} {new Date(sched.completed_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
                                </div>
                                <div className="text-gray-300 truncate">
                                  {sched.actual_metrics && typeof sched.actual_metrics === 'object' ? (
                                    'error' in sched.actual_metrics
                                      ? <span className="text-red-400" title={String(sched.actual_metrics.error)}>err</span>
                                      : <span title={JSON.stringify(sched.actual_metrics)}>
                                          {(sched.actual_metrics as any).views != null
                                            ? `${(sched.actual_metrics as any).views} views`
                                            : 'data'}
                                        </span>
                                  ) : (
                                    <span className="text-gray-600">--</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => copyScheduleSQL(run.run_id)}
                            className="text-[10px] px-2 py-1 rounded border border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
                          >
                            Copy SQL
                          </button>
                          {/* Attach button removed — inline input above handles this */}
                          {METRIC_COLLECTOR_FLAG && tiktokUrl && run.schedules.pending > 0 && (
                            <button
                              onClick={() => handleRunCollector(run.run_id)}
                              disabled={collectorRunning}
                              className="text-[10px] px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 transition-all flex items-center gap-1"
                            >
                              <Play className="w-2.5 h-2.5" /> Collect Now
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function UploadTestPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [niche, setNiche] = useState('side-hustles'); // Default to XGBoost trained niche
  const [pipelineMode, setPipelineMode] = useState<'standard' | 'validation'>('standard');
  const [excludeLLMs, setExcludeLLMs] = useState(false);
  const [followerCount, setFollowerCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [metricsError, setMetricsError] = useState(''); // Separate error for metrics section

  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);

  // TikTok URL state
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [loadingTikTok, setLoadingTikTok] = useState(false);
  const [tiktokError, setTiktokError] = useState('');

  // Actual metrics state
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');
  const [actualFollowerCount, setActualFollowerCount] = useState('');
  const [comparison, setComparison] = useState<any>(null);

  // Pipeline Diagnostics panel state
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticJsonOpen, setDiagnosticJsonOpen] = useState(false);

  // Upload mode toggle (Prompt 1: Manual / Auto Single / Auto Batch)
  const [uploadMode, setUploadMode] = useState<UploadMode>('manual');

  // Scrape method toggle for auto modes (Direct Download vs Apify Scrape)
  const [scrapeMethod, setScrapeMethod] = useState<ScrapeMethod>('download');

  // Auto Single state (TikTok URL input)
  const [autoUrl, setAutoUrl] = useState('');
  const [autoNiche, setAutoNiche] = useState(NICHE_REGISTRY[0].key);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<{ runId: string; dps: number; tier: string; scheduleCount: number; scheduleError?: string; actualDps?: number; actualTier?: string; isMature?: boolean; videoAgeHours?: number } | null>(null);
  const [autoError, setAutoError] = useState('');

  // Scrape input mode for auto tabs (URL / Keyword / Creator)
  const [scrapeInputMode, setScrapeInputMode] = useState<ScrapeInputMode>('url');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScrapeSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Auto Batch state (TikTok URL list)
  const [batchUrlText, setBatchUrlText] = useState('');
  const [batchNiche, setBatchNiche] = useState(NICHE_REGISTRY[0].key);
  const [batchItems, setBatchItems] = useState<BatchQueueItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchAbortRef = useRef(false);

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
          actual_dps,
          dps_v2_display_score,
          actual_views,
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
          actual_dps: row.actual_dps,
          dps_v2_display_score: row.dps_v2_display_score,
          actual_views: row.actual_views,
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


  // DPS is computed server-side via the canonical DPS v2 module.
  // No local DPS calculation — /api/learning/update returns the v2 score.

  // Drag and drop handlers
  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'video/mp4' || file.type.startsWith('video/')) {
        setVideoFile(file);
        setTiktokUrl(''); // Clear TikTok URL when file is uploaded
      } else {
        setError('Please upload a video file (MP4 recommended)');
      }
    }
  }, []);

  // TikTok URL handler
  const handleTikTokAnalyze = async () => {
    if (!tiktokUrl.trim()) {
      setTiktokError('Please enter a TikTok URL');
      return;
    }

    // Validate TikTok URL
    const tiktokPattern = /(?:tiktok\.com|vm\.tiktok\.com)/i;
    if (!tiktokPattern.test(tiktokUrl)) {
      setTiktokError('Please enter a valid TikTok URL');
      return;
    }

    setLoadingTikTok(true);
    setTiktokError('');
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/kai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiktokUrl: tiktokUrl.trim(),
          niche,
          goal: 'engagement',
          mode: pipelineMode,
          excludeLLMsFromAggregate: excludeLLMs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'TikTok analysis failed');
      }

      setResult(data);
    } catch (err: any) {
      setTiktokError(err.message);
    } finally {
      setLoadingTikTok(false);
    }
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
      formData.append('niche', niche);
      formData.append('goal', 'engagement');
      formData.append('mode', pipelineMode);
      if (followerCount && parseInt(followerCount) > 0) {
        const fc = parseInt(followerCount);
        const band = fc >= 1_000_000 ? 'mega (1M+)' : fc >= 100_000 ? 'large (100K-1M)' : fc >= 10_000 ? 'medium (10K-100K)' : 'small (0-10K)';
        formData.append('accountSize', band);
        formData.append('followerCount', followerCount);
      }
      if (excludeLLMs) {
        formData.append('excludeLLMsFromAggregate', 'true');
      }

      const response = await fetch('/api/predict/v2', {
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

    setMetricsError('');

    // DPS is computed server-side via the canonical v2 module.
    // The /api/learning/update endpoint returns the v2 score in accuracy.actual_dps.
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
          ...(actualFollowerCount ? { follower_count: parseInt(actualFollowerCount) } : {})
        })
      });

      const learningData = await learningResponse.json();

      if (learningData.success) {
        const actual = learningData.accuracy.actual_dps_display ?? learningData.accuracy.actual_dps;
        const predicted = learningData.accuracy.predicted_dps ?? result.predicted_dps ?? result.prediction?.dps ?? 0;
        const err = predicted - actual;
        const errorPct = Math.abs(actual) > 0 ? (Math.abs(err) / Math.abs(actual)) * 100 : 0;
        const range = result.predicted_range ?? result.prediction?.range ?? [predicted - 10, predicted + 10];
        const withinRange = actual >= range[0] && actual <= range[1];

        setComparison({
          predicted,
          actual,
          actualTier: learningData.accuracy.actual_tier ?? null,
          error: err,
          errorPct,
          withinRange,
          views: v,
          likes: l,
          comments: c,
          shares: sh,
          saves: sv,
          learningUpdated: true,
          componentsUpdated: learningData.components_updated,
          insights: learningData.insights,
        });
      } else {
        setMetricsError(learningData.error || 'Failed to compute DPS');
      }
    } catch (learningError: any) {
      console.warn('Learning update failed:', learningError.message);
      setMetricsError('Failed to submit metrics to server');
    }
  };

  // ─── Auto Single handler (TikTok URL → predict → schedule) ──
  const validateTikTokUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) return false;
    return /tiktok\.com/i.test(trimmed);
  };

  const handleAutoSingle = async () => {
    const url = autoUrl.trim();
    if (!url) return;

    if (!validateTikTokUrl(url)) {
      setAutoError('Invalid URL. Must contain https://www.tiktok.com/ and /video/');
      return;
    }

    setAutoLoading(true);
    setAutoError('');
    setAutoResult(null);

    try {
      // Step 1: Download + predict via /api/kai/predict with tiktokUrl
      const formData = new FormData();
      formData.append('tiktokUrl', url);
      formData.append('niche', autoNiche);
      formData.append('goal', 'engagement');
      formData.append('mode', 'standard');
      const useApify = scrapeMethod === 'apify' || scrapeInputMode !== 'url';
      if (useApify) formData.append('scrapeMethod', 'apify');

      const predRes = await fetch('/api/kai/predict', { method: 'POST', body: formData });
      const predData = await predRes.json();
      if (!predRes.ok) throw new Error(predData.error || 'Prediction failed');

      const runId = predData.prediction_id || predData.run_id;
      if (!runId) throw new Error('No run_id returned from prediction');

      // Check if scrape-label already labeled this as a mature video
      const sl = predData.scrape_label;
      const isMature = sl?.isMature === true && sl?.labeled === true;

      // Step 2: Create metric schedules — SKIP for mature videos (already labeled)
      let scheduleCount = 0;
      if (isMature) {
        console.log(`[AutoSingle] Mature video (${sl.videoAgeHours}h old) — skipping metric scheduling, already labeled`);
      } else {
        try {
          const schedRes = await fetch('/api/admin/metric-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ run_id: runId, platform_video_id: url }),
          });
          if (schedRes.ok) {
            const schedData = await schedRes.json();
            scheduleCount = schedData.schedule_count || 0;
          } else {
            console.warn(`[AutoSingle] Metric schedule failed: ${schedRes.status}`);
          }
        } catch (schedErr: any) {
          console.warn(`[AutoSingle] Metric schedule error: ${schedErr?.message}`);
        }
      }

      setAutoResult({
        runId,
        dps: predData.predicted_dps_7d ?? predData.predicted_dps ?? 0,
        tier: predData.prediction?.tier ?? predData.predicted_tier_7d ?? '—',
        scheduleCount,
        scheduleError: !isMature && scheduleCount === 0 ? 'Scheduling failed — check METRIC_COLLECTOR_ENABLED env var' : undefined,
        actualDps: sl?.actual_dps,
        actualTier: sl?.actual_tier,
        isMature: sl?.isMature,
        videoAgeHours: sl?.videoAgeHours,
      });
    } catch (err: any) {
      setAutoError(err.message);
    } finally {
      setAutoLoading(false);
    }
  };

  // ─── Scrape Search handler (keyword / creator) ──────────
  const handleScrapeSearch = async (targetTab: 'single' | 'batch' = 'single') => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const mode = scrapeInputMode === 'keyword' ? 'keyword' : 'creator';
      const limit = targetTab === 'single' ? 10 : 20;
      const res = await fetch('/api/admin/scrape-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, query: searchQuery.trim(), limit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Search failed: ${res.status}`);

      if (data.results?.length > 0) {
        setSearchResults(data.results);

        if (targetTab === 'batch') {
          const items: BatchQueueItem[] = data.results
            .filter((r: ScrapeSearchResult) => r.url)
            .map((r: ScrapeSearchResult, i: number) => ({
              id: `search-${Date.now()}-${i}`,
              url: r.url,
              status: 'queued' as const,
            }));
          setBatchItems(items);
        }
      } else {
        setSearchError('No results found. Try a different search term.');
      }
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (result: ScrapeSearchResult) => {
    setAutoUrl(result.url);
    setAutoError('');
    setSearchResults([]);
  };

  // ─── Auto Batch handlers (URL list) ──────────────────────
  const handleParseBatchUrls = () => {
    const lines = batchUrlText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
    const valid = lines.filter(validateTikTokUrl).slice(0, 50);
    const items: BatchQueueItem[] = valid.map((url, i) => ({
      id: `batch-${Date.now()}-${i}`,
      url,
      status: 'queued' as const,
    }));
    setBatchItems(items);
    return items;
  };

  const handleAutoBatch = async () => {
    let items = batchItems;
    if (items.length === 0) {
      items = handleParseBatchUrls();
    }
    if (items.length < 2) return;

    setBatchRunning(true);
    batchAbortRef.current = false;

    // Reset all to queued
    setBatchItems(prev => prev.map(item => ({ ...item, status: 'queued' as const, runId: undefined, error: undefined, predictedDps: undefined, predictedTier: undefined, scheduleCount: undefined, actualDps: undefined, actualTier: undefined, isMature: undefined })));

    for (let i = 0; i < items.length; i++) {
      if (batchAbortRef.current) break;

      const item = items[i];

      setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: (scrapeMethod === 'apify' || scrapeInputMode !== 'url') ? 'scraping' as const : 'running' as const } : it));

      try {
        // Step 1: Predict via TikTok URL
        const formData = new FormData();
        formData.append('tiktokUrl', item.url);
        formData.append('niche', batchNiche);
        formData.append('goal', 'engagement');
        formData.append('mode', 'standard');
        const useApify = scrapeMethod === 'apify' || scrapeInputMode !== 'url';
        if (useApify) formData.append('scrapeMethod', 'apify');

        const predRes = await fetch('/api/kai/predict', { method: 'POST', body: formData });
        const predData = await predRes.json();
        if (!predRes.ok) throw new Error(predData.error || 'Prediction failed');

        const runId = predData.prediction_id || predData.run_id;
        if (!runId) throw new Error('No run_id returned');

        // Check if scrape-label already labeled this as a mature video
        const sl = predData.scrape_label;
        const batchMature = sl?.isMature === true && sl?.labeled === true;

        // Step 2: Schedule metrics — SKIP for mature videos (already labeled)
        let scheduleCount = 0;
        if (!batchMature) {
          try {
            const schedRes = await fetch('/api/admin/metric-schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ run_id: runId, platform_video_id: item.url }),
            });
            if (schedRes.ok) {
              const schedData = await schedRes.json();
              scheduleCount = schedData.schedule_count || 0;
            } else {
              console.warn(`[AutoBatch] Metric schedule failed for ${item.url}: ${schedRes.status}`);
            }
          } catch (schedErr: any) {
            console.warn(`[AutoBatch] Metric schedule error: ${schedErr?.message}`);
          }
        }

        setBatchItems(prev => prev.map((it, idx) => idx === i ? {
          ...it,
          status: 'done' as const,
          runId,
          predictedDps: predData.predicted_dps_7d ?? predData.predicted_dps ?? 0,
          predictedTier: predData.prediction?.tier ?? predData.predicted_tier_7d ?? '—',
          scheduleCount,
          actualDps: sl?.actual_dps,
          actualTier: sl?.actual_tier,
          isMature: sl?.isMature && sl?.labeled,
        } : it));
      } catch (err: any) {
        setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'failed' as const, error: err.message } : it));
      }
    }

    setBatchRunning(false);
  };

  const handleBatchAbort = () => {
    batchAbortRef.current = true;
  };

  const handleBatchClear = () => {
    if (batchRunning) return;
    setBatchItems([]);
  };

  return (
    <div
      className="min-h-screen text-white p-8"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(229, 9, 20, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(155, 89, 182, 0.06) 0%, transparent 50%),
          #0a0a0a
        `,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-3 flex items-center justify-center gap-3">
            <Zap className="w-10 h-10 text-[#e50914]" />
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Instant Content Analysis
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            AI-Powered Video Analysis • {getActiveComponentCount()} Components • Real-time Viral Predictions
          </p>
        </div>

        {/* ─── Mode Toggle (Prompt 1) ─────────────────────────── */}
        <div className="flex items-center justify-center gap-1 mb-6 bg-white/[0.04] rounded-xl p-1 max-w-md mx-auto border border-white/[0.06]">
          {([
            { key: 'manual' as const, label: 'Manual Single', icon: Upload },
            { key: 'auto-single' as const, label: 'Auto Single', icon: Zap },
            { key: 'auto-batch' as const, label: 'Auto Batch', icon: Files },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setUploadMode(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                uploadMode === key
                  ? 'bg-[#e50914] text-white shadow-lg shadow-[#e50914]/25'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ─── Manual Single (existing UI, hidden when not active) ─── */}
        <div style={{ display: uploadMode !== 'manual' ? 'none' : undefined }}>
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] shadow-2xl mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drag & Drop Video Upload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileVideo className="w-5 h-5 text-[#e50914]" />
                <label className="text-lg font-semibold">Upload Video</label>
              </div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${isDragActive
                    ? 'border-[#e50914] bg-[#e50914]/10'
                    : videoFile
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-white/20 hover:border-white/40 bg-white/[0.02]'
                  }
                `}
              >
                <input
                  type="file"
                  accept="video/mp4,video/*"
                  onChange={(e) => {
                    setVideoFile(e.target.files?.[0] || null);
                    setTiktokUrl('');
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {videoFile ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                      <FileVideo className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-green-400 font-medium">{videoFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoFile(null);
                      }}
                      className="text-xs text-gray-500 hover:text-white underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors
                      ${isDragActive ? 'bg-[#e50914]/20' : 'bg-white/[0.05]'}
                    `}>
                      <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-[#e50914]' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-gray-300 font-medium">
                        {isDragActive ? 'Drop your video here' : 'Drag & drop your video here'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        or click to browse • MP4 recommended
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript auto-extracted by Whisper from the uploaded video */}

            {/* Niche */}
            <div>
              <label className="block text-sm font-medium mb-2">Niche</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl
                  focus:ring-2 focus:ring-[#e50914] text-white"
                style={{ colorScheme: 'dark' }}
              >
                {NICHE_REGISTRY.map(n => (
                  <option key={n.key} value={n.key}>
                    {n.hasTrainedModel ? '🎯 ' : ''}{n.label}
                    {n.hasTrainedModel && n.xgboostCorrelation ? ` (XGBoost: ${n.xgboostCorrelation} correlation)` : ''}
                  </option>
                ))}
              </select>
              {getNicheByKey(niche)?.hasTrainedModel && (
                <p className="text-xs text-green-400 mt-1">
                  ✅ Using XGBoost ML Trained Model - Best prediction accuracy!
                </p>
              )}
            </div>

            {/* Follower Count (optional — enables creator-context prediction) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Follower Count <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                placeholder="e.g. 49600 — leave blank for content-only VPS"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl
                  focus:ring-2 focus:ring-[#e50914] text-white"
              />
              {followerCount && parseInt(followerCount) > 0 ? (
                <p className="text-xs text-cyan-400 mt-1">
                  Creator-context mode: VPS will factor in audience size (#{1} feature by importance)
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Content-only mode: VPS based purely on video quality
                </p>
              )}
            </div>

            {/* Pipeline Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Pipeline Mode</label>
              <select
                value={pipelineMode}
                onChange={(e) => setPipelineMode(e.target.value as any)}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl
                  focus:ring-2 focus:ring-[#e50914] text-white"
                style={{ colorScheme: 'dark' }}
              >
                <option value="standard">Standard</option>
                <option value="validation">Validation (deterministic)</option>
              </select>
              {pipelineMode === 'validation' && (
                <p className="text-xs text-yellow-400/80 mt-1.5">
                  Deterministic mode: temperature=0, fixed A/B variant. Use for repeatable QC comparisons.
                </p>
              )}
            </div>

            {/* Exclude LLMs from aggregate (only visible in validation mode) */}
            {pipelineMode === 'validation' && (
              <label className="flex items-start gap-3 p-3 bg-yellow-900/10 border border-yellow-800/30 rounded-xl cursor-pointer hover:bg-yellow-900/20 transition">
                <input
                  type="checkbox"
                  checked={excludeLLMs}
                  onChange={(e) => setExcludeLLMs(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-yellow-700 text-yellow-500 focus:ring-yellow-500 bg-transparent"
                />
                <div>
                  <span className="text-sm font-medium text-yellow-300">Exclude LLMs from VPS aggregate</span>
                  <p className="text-xs text-yellow-500/70 mt-0.5">
                    GPT-4, Gemini, Claude, Pack 1/2 still run (results stored), but their weight is zeroed in the final VPS.
                    Compare runs with/without to isolate LLM drift.
                  </p>
                </div>
              </label>
            )}

            {/* Submit */}
            {loading ? (
              <div className="w-full py-8 px-6 bg-white/[0.03] border border-white/10 rounded-xl flex flex-col items-center justify-center">
                <TruckLoader />
                <p className="text-sm text-gray-400 mt-4">Analyzing with Kai Orchestrator...</p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!videoFile}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#e50914] to-[#ff1744]
                  hover:from-[#ff1744] hover:to-[#e50914]
                  disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                  rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02]
                  shadow-[0_4px_15px_rgba(229,9,20,0.3)] flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Analyze Video
              </button>
            )}
            <p className="text-xs text-center text-gray-400 mt-2">
              Uses {getActiveComponentCount()} components: XGBoost Virality ML, FFmpeg, GPT-4o-mini, 9 Attributes, 24 Styles, 7 Legos, Gemini, and more
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
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#e50914]" />
              Analysis Results
            </h2>

            {/* Pipeline Steps Status */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6">
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

            {/* Main Prediction - VPS Gauge */}
            <div className="flex flex-col items-center mb-8">
              <VPSGauge
                score={result.predicted_dps || 0}
                confidence={result.confidence}
                size="lg"
                animated={true}
                showTier={true}
              />
              <div className="text-center mt-4 text-sm text-gray-400">
                Range: [{result.predicted_range?.[0]?.toFixed(1)} - {result.predicted_range?.[1]?.toFixed(1)}] VPS
              </div>
              {(result.xgboost_v7 || result.model_version) && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <Zap className="w-3 h-3" />
                  XGBoost {result.model_version || result.xgboost_v7?.model_version} — {result.features?.provided ?? result.xgboost_v7?.features_provided}/{result.features?.total ?? result.xgboost_v7?.features_total} features
                </div>
              )}
            </div>

            {/* VPS Context */}
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                VPS — Content Quality Score
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Niche</div>
                  <div className="text-lg font-semibold text-white">{niche}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">VPS Assessment</div>
                  <div className={`text-lg font-semibold ${
                    result.predicted_dps >= 70 ? 'text-green-400' :
                    result.predicted_dps >= 50 ? 'text-blue-400' :
                    result.predicted_dps >= 30 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {result.predicted_dps >= 70 ? 'Strong Content Quality' :
                     result.predicted_dps >= 50 ? 'Moderate Content Quality' :
                     result.predicted_dps >= 30 ? 'Below Average Content' :
                     'Low Content Quality'}
                  </div>
                </div>
              </div>

              {/* Feature Transparency (v2 response) */}
              {result.features?.provided != null && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="text-sm font-medium text-gray-300 mb-2">Model Details</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Features</div>
                      <div className="text-lg font-bold text-emerald-300">{result.features.provided}/{result.features.total}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Model</div>
                      <div className="text-lg font-bold text-white">XGBoost {result.model_version || 'v10'}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Latency</div>
                      <div className="text-lg font-bold text-blue-400">{result.latency_ms ? (result.latency_ms / 1000).toFixed(1) + 's' : '—'}</div>
                    </div>
                  </div>
                  {result.features.missing?.length > 0 && (
                    <div className="mt-3 bg-yellow-900/30 border border-yellow-600/50 rounded p-2">
                      <div className="text-xs text-yellow-200">
                        Missing {result.features.missing.length} features (using defaults):
                        <span className="text-yellow-400 font-mono ml-1">
                          {result.features.missing.slice(0, 5).join(', ')}
                          {result.features.missing.length > 5 && ` +${result.features.missing.length - 5} more`}
                        </span>
                      </div>
                    </div>
                  )}
                  {result.extraction_errors?.length > 0 && (
                    <div className="mt-2 text-xs text-orange-400">
                      Extraction warnings: {result.extraction_errors.slice(0, 3).join('; ')}
                    </div>
                  )}
                </div>
              )}

              {/* Legacy: Niche Calibration (v1 orchestrator response) */}
              {result.adjustments && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="text-sm font-medium text-gray-300 mb-2">Niche Calibration:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Raw Score</div>
                      <div className="text-lg font-bold text-white">{result.adjustments.raw_score?.toFixed(1)}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-2">
                      <div className="text-gray-400">Niche Factor</div>
                      <div className="text-lg font-bold text-blue-400">
                        {result.adjustments.niche_factor?.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400">
                  VPS measures content quality using XGBoost ML trained on viral video features.
                </div>
              </div>
            </div>

            {/* Legacy: XGBoost component panel (v1 orchestrator response only) */}
            {result.component_scores?.['xgboost-virality-ml'] !== undefined && (
              <div className="bg-gradient-to-br from-emerald-900/70 to-teal-900/70 border-2 border-emerald-400 rounded-lg p-6 mb-6 shadow-lg shadow-emerald-500/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  XGBoost Virality ML Prediction
                  <span className="text-xs bg-emerald-500 text-black px-2 py-1 rounded font-bold">TRAINED MODEL</span>
                </h3>
                <div className="bg-black/30 rounded-xl p-6 mb-4">
                  <div className="text-center">
                    <div className="text-6xl font-black text-emerald-300 mb-2">
                      {result.component_scores['xgboost-virality-ml']?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xl text-emerald-200 font-semibold">Predicted VPS (XGBoost ML)</div>
                  </div>
                </div>
              </div>
            )}

            {/* XGBoost ML Not Available Warning (legacy) */}
            {result.components_used && !result.components_used.includes('xgboost-virality-ml') && getNicheByKey(niche)?.hasTrainedModel && (
              <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2 text-yellow-300">XGBoost Virality ML Not Active</h3>
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
                            <span className="text-blue-400">{path.prediction.toFixed(1)} VPS</span>
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
                    <div className="font-semibold">{result.component_scores.gemini.toFixed(1)} VPS</div>
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

                    {/* Mock data warning - API key not configured */}
                    {pack1._meta?.source === 'mock' ? (
                      <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 text-center">
                        <div className="text-yellow-200 font-semibold mb-1">AI grading unavailable - API key not configured</div>
                        <div className="text-xs text-gray-400">Set GOOGLE_GEMINI_AI_API_KEY or GOOGLE_AI_API_KEY in .env.local to enable Pack 1 grading.</div>
                      </div>
                    ) : (<>

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
                            <ScoreBar
                              key={idx}
                              label={attr.attribute?.replace(/_/g, ' ') || `Attribute ${idx + 1}`}
                              score={(attr.score || 0) * 10}
                              maxScore={100}
                              showPercentage={false}
                              size="sm"
                            />
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

                    </>)}
                  </div>
                )}

                {/* Pack 2: Editing Coach */}
                {!pack2 && (result.debug?.pack2_error || result.debug?.pack2Error) && (
                  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-400/50 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <span className="text-xl">✨</span>
                      Pack 2: Editing Coach
                      <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold">ERROR</span>
                    </h3>
                    <p className="text-sm text-gray-400">{result.debug?.pack2_error || result.debug?.pack2Error}</p>
                  </div>
                )}
                {pack2 && (
                  <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-400 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="text-2xl">✨</span>
                      Pack 2: Editing Coach
                      <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded font-bold">{
                        pack2._meta?.provider === 'rule-based' || pack2._meta?.provider === 'rule-based-fallback'
                          ? 'QUICK TIPS' : 'AI COACH'
                      }</span>
                      {pack2._meta && (
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          pack2._meta.source === 'mock' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                          {pack2._meta.source.toUpperCase()} ({pack2._meta.provider})
                        </span>
                      )}
                    </h3>

                    {/* Before/After VPS Comparison */}
                    <div className="bg-black/30 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Current VPS</div>
                          <div className="text-2xl font-bold text-white">
                            {pack2.predicted_before?.toFixed(1) || '-'}
                          </div>
                        </div>
                        <div className="text-3xl text-purple-400">→</div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Potential VPS</div>
                          <div className="text-2xl font-bold text-purple-300">
                            {pack2.predicted_after_estimate?.toFixed(1) || '-'}
                          </div>
                        </div>
                      </div>
                      {pack2.predicted_before && pack2.predicted_after_estimate && (
                        <div className="text-center mt-2">
                          <span className="text-green-400 font-semibold">
                            +{(pack2.predicted_after_estimate - pack2.predicted_before).toFixed(1)} VPS potential lift
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
                                +{change.estimated_lift?.toFixed(1) || '?'} VPS
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

                    {/* Generate Improved Script CTA */}
                    <div className="mt-6 pt-4 border-t border-purple-500/30">
                      <button
                        onClick={() => {
                          // Encode Pack 2 data to pass to quick-win workflow
                          const pack2Data = encodeURIComponent(JSON.stringify({
                            changes: pack2.changes,
                            predicted_before: pack2.predicted_before,
                            predicted_after_estimate: pack2.predicted_after_estimate,
                            transcript: result.debug?.transcriptText,
                            video_id: result.video_id,
                            niche,
                          }));
                          window.location.href = `/sandbox/quick-win-workflow?pack2=${pack2Data}`;
                        }}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600
                          hover:from-purple-700 hover:to-pink-700
                          rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02]
                          shadow-[0_4px_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-3"
                      >
                        <Sparkles className="w-5 h-5" />
                        Generate Improved Script
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Apply AI coaching suggestions to create a viral-optimized script
                      </p>
                    </div>
                  </div>
                )}
              </div>
              ) : (
                <div className="bg-[#0f0f16] border border-[#1e1e2e] rounded-lg p-4 mb-4 text-center">
                  <div className="text-sm text-gray-500">Coaching insights not available for this run</div>
                  <div className="text-xs text-gray-600 mt-1">VPS v2 uses XGBoost-only scoring. Coaching panels require the full orchestrator pipeline.</div>
                </div>
              );
            })()}

            {/* ═══════════════════════════════════════════════════════════════════════════
                PACK V RESULTS - Visual Rubric (NO transcript required)
                Added: 2026-01-15
                Shows even when Pack 1/2 are unavailable (silent videos)
            ═══════════════════════════════════════════════════════════════════════════ */}
            {result.qualitative_analysis?.packV && (() => {
              const packV = result.qualitative_analysis.packV;
              const isStub = packV._meta?.source === 'mock' || (
                packV.overall_visual_score === 50 &&
                packV.visual_hook_score?.score === 5 &&
                packV.pacing_score?.score === 5 &&
                packV.pattern_interrupts_score?.score === 5 &&
                packV.visual_clarity_score?.score === 5 &&
                packV.style_fit_score?.score === 5
              );

              if (isStub) {
                return (
                  <div className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 border border-orange-400/40 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-orange-300/70">
                      <span className="text-xl">👁️</span>
                      Pack V: Visual Rubric
                    </h3>
                    <p className="text-sm text-gray-400">Upload a video to get visual quality analysis.</p>
                  </div>
                );
              }

              return (
              <div className="bg-gradient-to-br from-orange-900/50 to-amber-900/50 border-2 border-orange-400 rounded-lg p-4 mb-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">👁️</span>
                  Pack V: Visual Rubric
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-bold">VISUAL ONLY</span>
                  {packV._meta && (
                    <span className="text-xs px-2 py-1 rounded font-bold bg-green-600 text-white">
                      {packV._meta.source.toUpperCase()} ({packV._meta.provider})
                    </span>
                  )}
                  <span className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                    {packV._meta?.latency_ms || 0}ms
                  </span>
                </h3>

                {/* Overall Visual Score */}
                <div className="bg-black/30 rounded-lg p-4 mb-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Overall Visual Score</div>
                  <div className="text-4xl font-bold text-orange-300">
                    {packV.overall_visual_score}
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
                        {packV.visual_hook_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${packV.visual_hook_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{packV.visual_hook_score.evidence}</p>
                  </div>

                  {/* Pacing Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Pacing</span>
                      <span className="text-xl font-bold text-orange-300">
                        {packV.pacing_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${packV.pacing_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{packV.pacing_score.evidence}</p>
                  </div>

                  {/* Pattern Interrupts Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Pattern Interrupts</span>
                      <span className="text-xl font-bold text-orange-300">
                        {packV.pattern_interrupts_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${packV.pattern_interrupts_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{packV.pattern_interrupts_score.evidence}</p>
                  </div>

                  {/* Visual Clarity Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Visual Clarity</span>
                      <span className="text-xl font-bold text-orange-300">
                        {packV.visual_clarity_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${packV.visual_clarity_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{packV.visual_clarity_score.evidence}</p>
                  </div>

                  {/* Style Fit Score */}
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-orange-200">Style Fit</span>
                      <span className="text-xl font-bold text-orange-300">
                        {packV.style_fit_score.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${packV.style_fit_score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{packV.style_fit_score.evidence}</p>
                  </div>
                </div>

                {/* Pack V Info Note */}
                <div className="bg-black/20 rounded p-2 text-center">
                  <span className="text-xs text-gray-400">
                    Pack V analyzes visual signals only - no transcript required. Runs even for silent videos.
                  </span>
                </div>
              </div>
              );
            })()}

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
                  {result.debug?.pack1Error || result.debug?.pack1_error
                    ? `Pack 1 error: ${result.debug.pack1Error || result.debug.pack1_error}`
                    : result.debug?.resolvedTranscriptLength === 0
                    ? `No speech detected in video. Transcription source: ${result.debug?.transcriptSource || 'none'}. Pack 1/2 requires at least 10 characters of transcript text.`
                    : result.debug?.resolvedTranscriptLength !== undefined && result.debug.resolvedTranscriptLength < 10
                    ? `Resolved transcript too short (${result.debug.resolvedTranscriptLength} chars). Minimum 10 characters required.`
                    : result.transcription_status?.skipped
                    ? `Transcription skipped: ${result.transcription_status.skippedReason || 'no_speech_detected'}. Pack 1/2 requires transcript text to analyze.`
                    : 'Pack 1/2 components did not return results. Check server logs for component errors.'}
                </p>
                {result.debug?.pack2Error || result.debug?.pack2_error ? (
                  <p className="text-sm text-gray-400 mt-1">Pack 2 error: {result.debug.pack2Error || result.debug.pack2_error}</p>
                ) : null}

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

            {/* Pipeline Diagnostics Panel */}
            {result.component_diagnostics && result.component_diagnostics.length > 0 && (
              <div className="mt-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                <button
                  onClick={() => setDiagnosticOpen(!diagnosticOpen)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/70 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">&#9881;</span>
                    <h3 className="font-semibold">Pipeline Diagnostics</h3>
                    <span className="text-xs text-gray-500">({result.component_diagnostics.length} components)</span>
                  </div>
                  {diagnosticOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {diagnosticOpen && (() => {
                  const diag = result.component_diagnostics as any[];
                  const PHASE_2_COMPONENTS = new Set([
                    'hook-scorer', '24-styles', 'xgboost-virality-ml',
                    'visual-rubric', 'unified-grading', 'editing-coach', 'viral-mechanics'
                  ]);
                  const sorted = [...diag].sort((a, b) => {
                    const phaseA = PHASE_2_COMPONENTS.has(a.componentId) ? 2 : 1;
                    const phaseB = PHASE_2_COMPONENTS.has(b.componentId) ? 2 : 1;
                    if (phaseA !== phaseB) return phaseA - phaseB;
                    return (a.componentId || '').localeCompare(b.componentId || '');
                  });
                  const stylesEntry = diag.find((d: any) => d.componentId === '24-styles');
                  const audioEntry = diag.find((d: any) => d.componentId === 'audio-analyzer');
                  const hookEntry = diag.find((d: any) => d.componentId === 'hook-scorer' && d.success);
                  const patternEntry = diag.find((d: any) => d.componentId === 'pattern-extraction' && d.success);

                  return (
                    <div className="px-4 pb-4 space-y-4">
                      {/* A. Component Execution Table */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Component Execution</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500 border-b border-gray-600">
                                <th className="text-left py-1 px-2">Component</th>
                                <th className="text-center py-1 px-2">Phase</th>
                                <th className="text-center py-1 px-2">Status</th>
                                <th className="text-right py-1 px-2">Score</th>
                                <th className="text-right py-1 px-2">Confidence</th>
                                <th className="text-right py-1 px-2">Latency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sorted.map((c: any, i: number) => {
                                const phase = PHASE_2_COMPONENTS.has(c.componentId) ? 2 : 1;
                                const statusColor = c.skipped ? 'bg-gray-600 text-gray-300' : c.success ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200';
                                const statusText = c.skipped ? (c.skipReason || 'skipped') : c.success ? 'OK' : 'FAIL';
                                return (
                                  <tr key={i} className="border-b border-gray-700/50">
                                    <td className="py-1 px-2 font-mono">{c.componentId}</td>
                                    <td className="py-1 px-2 text-center">{phase}</td>
                                    <td className="py-1 px-2 text-center">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor}`}>{statusText}</span>
                                    </td>
                                    <td className="py-1 px-2 text-right">{c.prediction != null ? (typeof c.prediction === 'number' ? c.prediction.toFixed(1) : c.prediction) : '—'}</td>
                                    <td className="py-1 px-2 text-right">{c.confidence != null ? (c.confidence * 100).toFixed(0) + '%' : '—'}</td>
                                    <td className="py-1 px-2 text-right text-gray-400">{c.latency != null ? c.latency + 'ms' : '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* B. 24-Styles Detail */}
                      {stylesEntry && stylesEntry.features && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">24-Styles Classification</h4>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-medium">{stylesEntry.features.styleName || stylesEntry.features.style || '—'}</span>
                            {stylesEntry.features.classificationTier && (() => {
                              const tier = stylesEntry.features.classificationTier;
                              const tierColor = tier === 'DETERMINISTIC' ? 'bg-green-700 text-green-200' :
                                tier === 'LLM-REFINED' ? 'bg-blue-700 text-blue-200' :
                                tier === 'DETERMINISTIC-FALLBACK' ? 'bg-yellow-700 text-yellow-200' : 'bg-gray-600 text-gray-300';
                              return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${tierColor}`}>{tier}</span>;
                            })()}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div><span className="text-gray-500">Score:</span> {stylesEntry.prediction != null ? (typeof stylesEntry.prediction === 'number' ? stylesEntry.prediction.toFixed(2) : stylesEntry.prediction) : '—'}</div>
                            {stylesEntry.features.matchedSignals && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Matched Signals:</span>{' '}
                                <span className="text-gray-300">{Array.isArray(stylesEntry.features.matchedSignals) ? stylesEntry.features.matchedSignals.join(', ') : String(stylesEntry.features.matchedSignals)}</span>
                              </div>
                            )}
                            {stylesEntry.features.candidateScores && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Top Candidates:</span>{' '}
                                <span className="text-gray-300 font-mono">
                                  {(() => {
                                    const scores = stylesEntry.features.candidateScores;
                                    if (typeof scores === 'object' && !Array.isArray(scores)) {
                                      return Object.entries(scores)
                                        .sort(([,a]: any, [,b]: any) => b - a)
                                        .slice(0, 5)
                                        .map(([k, v]: any) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
                                        .join(' | ');
                                    }
                                    return JSON.stringify(scores);
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* C. Audio Analysis Detail */}
                      {audioEntry && audioEntry.features && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Audio Analysis</h4>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            {['musicRatio', 'speechRatio', 'energyLevel', 'silenceRatio', 'loudnessRange', 'pitchVariance', 'hookLoudness', 'pitchContourSlope'].map(key => (
                              <div key={key} className="bg-gray-700/60 rounded p-1.5">
                                <div className="text-gray-500 text-[10px]">{key}</div>
                                <div className="font-mono">{audioEntry.features[key] != null ? (typeof audioEntry.features[key] === 'number' ? audioEntry.features[key].toFixed(3) : audioEntry.features[key]) : '—'}</div>
                              </div>
                            ))}
                          </div>
                          {/* Speaking Rate sub-section */}
                          {(audioEntry.features.wpmMean != null || audioEntry.features.paceCategory) && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Speaking Rate</div>
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                {['wpmMean', 'wpmVariance', 'wpmAcceleration', 'paceCategory'].map(key => (
                                  <div key={key} className="bg-gray-700/60 rounded p-1.5">
                                    <div className="text-gray-500 text-[10px]">{key}</div>
                                    <div className="font-mono">{audioEntry.features[key] != null ? (typeof audioEntry.features[key] === 'number' ? audioEntry.features[key].toFixed(2) : audioEntry.features[key]) : '—'}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* E. Hook Scorer Detail */}
                      {hookEntry && hookEntry.features && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Hook Scorer</h4>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {hookEntry.features.hookType && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-700 text-purple-200">{hookEntry.features.hookType}</span>
                            )}
                            {hookEntry.features.hookCluster && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-700 text-indigo-200">{hookEntry.features.hookCluster}</span>
                            )}
                            {hookEntry.features.hookScore != null && (
                              <span className="text-sm font-mono">Fused: {typeof hookEntry.features.hookScore === 'number' ? hookEntry.features.hookScore.toFixed(2) : hookEntry.features.hookScore}</span>
                            )}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500 border-b border-gray-600">
                                <th className="text-left py-1 px-2">Channel</th>
                                <th className="text-right py-1 px-2">Score</th>
                                <th className="text-center py-1 px-2">Available</th>
                                <th className="text-left py-1 px-2">Key Metric</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { ch: 'Text', scoreKey: 'textScore', metricKey: 'hookType', metricLabel: 'hookType' },
                                { ch: 'Audio', scoreKey: 'audioScore', metricKey: 'hookLoudness', metricLabel: 'hookLoudness' },
                                { ch: 'Visual', scoreKey: 'visualScore', metricKey: 'hookSceneChanges', metricLabel: 'hookSceneChanges' },
                                { ch: 'Pace', scoreKey: 'paceScore', metricKey: 'hookWpm', metricLabel: 'hookWpm' },
                                { ch: 'Tone', scoreKey: 'toneScore', metricKey: null, metricLabel: 'energyLevel' },
                              ].map(({ ch, scoreKey, metricKey, metricLabel }) => {
                                const channelsUsed = Array.isArray(hookEntry.features.channelsUsed) ? hookEntry.features.channelsUsed : [];
                                const available = channelsUsed.includes(ch.toLowerCase());
                                const metricVal = metricKey ? hookEntry.features[metricKey] : (audioEntry?.features?.energyLevel ?? '—');
                                return (
                                  <tr key={ch} className="border-b border-gray-700/50">
                                    <td className="py-1 px-2">{ch}</td>
                                    <td className="py-1 px-2 text-right font-mono">{hookEntry.features[scoreKey] != null ? (typeof hookEntry.features[scoreKey] === 'number' ? hookEntry.features[scoreKey].toFixed(2) : hookEntry.features[scoreKey]) : '—'}</td>
                                    <td className="py-1 px-2 text-center">{available ? <span className="text-green-400">&#10003;</span> : <span className="text-gray-600">&#10007;</span>}</td>
                                    <td className="py-1 px-2 text-gray-400"><span className="text-gray-500 text-[10px]">{metricLabel}:</span> {metricVal != null ? (typeof metricVal === 'number' ? metricVal.toFixed(2) : String(metricVal)) : '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* F. Pattern Extraction Detail */}
                      {patternEntry && patternEntry.features && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Pattern Extraction</h4>
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">Patterns ({patternEntry.features.patternCount ?? '?'}):</span>{' '}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Array.isArray(patternEntry.features.patterns) && patternEntry.features.patterns.map((p: string, i: number) => (
                                <span key={i} className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-800 text-cyan-200">{p}</span>
                              ))}
                              {(!patternEntry.features.patterns || patternEntry.features.patterns.length === 0) && (
                                <span className="text-xs text-gray-500">none detected</span>
                              )}
                            </div>
                          </div>
                          {patternEntry.features.coOccurrenceBonuses && patternEntry.features.coOccurrenceBonuses.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-500">Co-occurrence Bonuses ({patternEntry.features.coOccurrenceBonus != null ? '+' + patternEntry.features.coOccurrenceBonus.toFixed(2) : ''}):</span>{' '}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {patternEntry.features.coOccurrenceBonuses.map((b: string, i: number) => (
                                  <span key={i} className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-orange-800 text-orange-200">{b}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {patternEntry.features.confidenceFactors && (
                            <div className="text-xs text-gray-400">
                              Confidence: pattern +{patternEntry.features.confidenceFactors.patternBonus?.toFixed(2) ?? '?'}, length +{patternEntry.features.confidenceFactors.lengthBonus?.toFixed(2) ?? '?'}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">Positional weights: hook+setup=1.0x, body=0.7x, CTA=0.5x (CTA pattern=1.0x)</div>
                          <div className="text-xs mt-1"><span className="text-gray-500">Final Score:</span> <span className="font-mono">{patternEntry.prediction != null ? (typeof patternEntry.prediction === 'number' ? patternEntry.prediction.toFixed(2) : patternEntry.prediction) : '—'}</span></div>
                        </div>
                      )}

                      {/* G. Raw JSON */}
                      <div>
                        <button
                          onClick={() => setDiagnosticJsonOpen(!diagnosticJsonOpen)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          {diagnosticJsonOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Raw Component JSON
                        </button>
                        {diagnosticJsonOpen && (
                          <pre className="mt-2 p-3 bg-gray-900 rounded text-[10px] text-gray-400 max-h-96 overflow-auto font-mono whitespace-pre-wrap">
                            {JSON.stringify(result.component_diagnostics, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

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
                <div>
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
                <div>
                  <label className="block text-sm font-medium mb-2">Follower Count</label>
                  <span className="block text-xs text-gray-400 -mt-1 mb-1">(at time of posting)</span>
                  <input
                    type="number"
                    min="0"
                    value={actualFollowerCount}
                    onChange={(e) => setActualFollowerCount(e.target.value)}
                    placeholder="e.g., 125000"
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
                Save Actual Results & Compare
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Saves to prediction_runs and feeds the learning loop (component reliability, Algorithm IQ)
              </p>
            </div>

            {/* Comparison Results */}
            {comparison && (
              <div className="mt-6 p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-600 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Prediction vs Actual Comparison</h3>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-600/30 rounded-lg p-4 border border-blue-500">
                    <div className="text-sm opacity-75 mb-1">PREDICTED VPS</div>
                    <div className="text-4xl font-bold">{comparison.predicted.toFixed(1)}</div>
                  </div>
                  <div className="bg-green-600/30 rounded-lg p-4 border border-green-500">
                    <div className="text-sm opacity-75 mb-1">ACTUAL VPS</div>
                    <div className="text-4xl font-bold">{comparison.actual.toFixed(1)}</div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Error:</span>
                      <div className="font-semibold text-lg">
                        {comparison.error > 0 ? '+' : ''}{comparison.error.toFixed(1)} VPS
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
                        <strong>Significant Over-Prediction:</strong> The model predicted {comparison.error.toFixed(1)} VPS higher than actual.
                        This suggests the model overestimated engagement potential for this type of content.
                      </p>
                    )}
                    {comparison.error < -10 && (
                      <p className="text-blue-300">
                        <strong>Under-Prediction (Good!):</strong> The video performed {Math.abs(comparison.error).toFixed(1)} VPS better than predicted!
                        The model was conservative, which is safer than over-promising.
                      </p>
                    )}
                    {Math.abs(comparison.error) <= 10 && (
                      <p className="text-green-300">
                        <strong>Accurate Prediction:</strong> The model was within 10 VPS ({comparison.errorPct.toFixed(1)}% error).
                        This is excellent accuracy for viral prediction.
                      </p>
                    )}

                    <p className="text-gray-300 mt-3">
                      <strong>Actual Performance:</strong> {comparison.views.toLocaleString()} views with {comparison.actual.toFixed(1)} VPS (actual)
                      {' '}
                      {(() => {
                        const tier = comparison.actualTier;
                        const colorMap: Record<string, string> = {
                          'mega-viral': '#2dd4a8',
                          'hyper-viral': '#2dd4a8',
                          'viral': '#f59e0b',
                          'above-average': 'inherit',
                          'average': 'inherit',
                          'below-average': '#e63946',
                          'poor': '#e63946',
                        };
                        const labelMap: Record<string, string> = {
                          'mega-viral': 'MEGA-VIRAL',
                          'hyper-viral': 'HYPER-VIRAL',
                          'viral': 'VIRAL',
                          'above-average': 'Above Average',
                          'average': 'Average',
                          'below-average': 'Below Average',
                          'poor': 'Poor',
                        };
                        const label = tier ? (labelMap[tier] ?? tier) : (
                          comparison.actual >= 99.9 ? 'MEGA-VIRAL' : comparison.actual >= 99.0 ? 'HYPER-VIRAL' : comparison.actual >= 95.0 ? 'VIRAL' : comparison.actual >= 80.0 ? 'Above Average' : comparison.actual >= 60.0 ? 'Average' : comparison.actual >= 40.0 ? 'Below Average' : 'Poor'
                        );
                        const color = tier ? (colorMap[tier] ?? 'inherit') : (
                          comparison.actual >= 99.0 ? '#2dd4a8' : comparison.actual >= 95.0 ? '#f59e0b' : comparison.actual >= 60.0 ? 'inherit' : '#e63946'
                        );
                        return <span style={{ color }}>({label})</span>;
                      })()}
                    </p>

                    {!comparison.withinRange && result.predicted_range && (
                      <p className="text-red-300 mt-2">
                        The actual score fell <strong>outside</strong> the predicted confidence interval
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
                        <th className="pb-3 text-gray-400 font-medium">VPS</th>
                        <th className="pb-3 text-gray-400 font-medium">Actual</th>
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
                            {(run.dps_v2_display_score ?? run.actual_dps) != null ? (
                              <div>
                                <div className="font-bold text-green-400">
                                  {(run.dps_v2_display_score ?? run.actual_dps)!.toFixed(1)}
                                </div>
                                {run.predicted_dps_7d != null && (
                                  <div className={`text-xs ${
                                    Math.abs(run.predicted_dps_7d - (run.dps_v2_display_score ?? run.actual_dps)!) <= 10
                                      ? 'text-green-500'
                                      : Math.abs(run.predicted_dps_7d - (run.dps_v2_display_score ?? run.actual_dps)!) <= 20
                                      ? 'text-yellow-500'
                                      : 'text-red-400'
                                  }`}>
                                    {run.predicted_dps_7d - (run.dps_v2_display_score ?? run.actual_dps)! > 0 ? '+' : ''}
                                    {(run.predicted_dps_7d - (run.dps_v2_display_score ?? run.actual_dps)!).toFixed(1)} err
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
                            )}
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
        </div>{/* end Manual Single wrapper */}

        {/* ─── Auto Single Panel ─────────────────── */}
        {uploadMode === 'auto-single' && (
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] shadow-2xl mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Link2 className="w-5 h-5 text-[#e50914]" />
              <h3 className="text-lg font-semibold">Auto Single</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30">
                FIND → PREDICT → SCHEDULE
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Find a video by URL, keyword search, or creator → scrapes via Apify → runs clean prediction → creates metric schedules (4h/24h/48h/7d).
            </p>

            <div className="space-y-4">
              {/* Scrape input mode toggle (URL / Keyword / Creator) */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                {([
                  { key: 'url' as const, label: 'URL', icon: Link2 },
                  { key: 'keyword' as const, label: 'Keyword', icon: Search },
                  { key: 'creator' as const, label: 'Creator', icon: User },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setScrapeInputMode(key); setSearchResults([]); setSearchError(''); setAutoError(''); }}
                    disabled={autoLoading || searchLoading}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      scrapeInputMode === key
                        ? 'bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Scrape method toggle (only for URL mode) */}
              {scrapeInputMode === 'url' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-xs text-gray-400">Method:</span>
                  <button
                    onClick={() => setScrapeMethod('download')}
                    disabled={autoLoading}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      scrapeMethod === 'download'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    Direct Download
                  </button>
                  <button
                    onClick={() => setScrapeMethod('apify')}
                    disabled={autoLoading}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      scrapeMethod === 'apify'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    Apify Scrape
                  </button>
                </div>
              )}

              {/* URL input (URL mode) */}
              {scrapeInputMode === 'url' && (
                <div>
                  <label className="block text-sm font-medium mb-2">TikTok Video URL</label>
                  <input
                    type="text"
                    value={autoUrl}
                    onChange={(e) => { setAutoUrl(e.target.value); setAutoError(''); }}
                    placeholder="https://www.tiktok.com/@username/video/1234567890123456789"
                    disabled={autoLoading}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl
                      focus:ring-2 focus:ring-[#e50914] focus:border-transparent text-white placeholder-gray-500
                      transition-all disabled:opacity-50"
                  />
                </div>
              )}

              {/* Search input (Keyword / Creator mode) */}
              {scrapeInputMode !== 'url' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {scrapeInputMode === 'keyword' ? 'Search Keyword' : 'Creator / Channel Name'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) handleScrapeSearch('single'); }}
                      placeholder={scrapeInputMode === 'keyword' ? 'side hustle, make money online...' : '@thekoerner, @maxtalkstech...'}
                      disabled={searchLoading || autoLoading}
                      className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl
                        focus:ring-2 focus:ring-[#e50914] focus:border-transparent text-white placeholder-gray-500
                        transition-all disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleScrapeSearch('single')}
                      disabled={!searchQuery.trim() || searchLoading}
                      className="px-5 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-500"
                    >
                      {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Search error */}
              {searchError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">{searchError}</p>
                </div>
              )}

              {/* Search results grid */}
              {searchResults.length > 0 && scrapeInputMode !== 'url' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{searchResults.length} results — click to select</span>
                    <button onClick={() => setSearchResults([])} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectSearchResult(r)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:bg-white/[0.04] ${
                          autoUrl === r.url
                            ? 'border-[#e50914]/50 bg-[#e50914]/5'
                            : 'border-white/[0.06] bg-white/[0.02]'
                        }`}
                      >
                        {r.thumbnail && (
                          <img src={r.thumbnail} alt="" className="w-16 h-20 object-cover rounded flex-shrink-0 bg-gray-800" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 line-clamp-2">{r.text || 'No description'}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                            {r.authorName && <span>@{r.authorName}</span>}
                            {r.views != null && <span>{(r.views / 1000).toFixed(0)}K views</span>}
                            {r.likes != null && <span>{(r.likes / 1000).toFixed(0)}K likes</span>}
                            {r.duration != null && <span>{r.duration}s</span>}
                          </div>
                          {r.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.hashtags.slice(0, 5).map(h => (
                                <span key={h} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">#{h}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {autoUrl === r.url && (
                          <CheckCircle2 className="w-5 h-5 text-[#e50914] flex-shrink-0 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                  {autoUrl && (
                    <p className="text-xs text-green-400 mt-2">Selected: {autoUrl.replace('https://www.tiktok.com/', '').slice(0, 60)}</p>
                  )}
                </div>
              )}

              {/* Niche */}
              <div>
                <label className="block text-sm font-medium mb-2">Niche</label>
                <select
                  value={autoNiche}
                  onChange={(e) => setAutoNiche(e.target.value)}
                  disabled={autoLoading}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl focus:ring-2 focus:ring-[#e50914] text-white disabled:opacity-50"
                  style={{ colorScheme: 'dark' }}
                >
                  {NICHE_REGISTRY.map(n => (
                    <option key={n.key} value={n.key}>
                      {n.hasTrainedModel ? '🎯 ' : ''}{n.label}
                      {n.hasTrainedModel && n.xgboostCorrelation ? ` (XGBoost: ${n.xgboostCorrelation} correlation)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Run button */}
              <button
                onClick={handleAutoSingle}
                disabled={!autoUrl.trim() || autoLoading}
                className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: autoUrl.trim() && !autoLoading ? 'linear-gradient(135deg, #e50914, #ff1744)' : undefined,
                  backgroundColor: !autoUrl.trim() || autoLoading ? '#333' : undefined,
                }}
              >
                {autoLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scraping &amp; predicting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {scrapeInputMode === 'url' ? 'Scrape + Predict' : `Predict Selected Video`}
                  </span>
                )}
              </button>

              {/* Loading animation */}
              {autoLoading && <TruckLoader />}

              {/* Error */}
              {autoError && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{autoError}</p>
                </div>
              )}

              {/* Result */}
              {autoResult && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-green-300">
                      {autoResult.isMature ? 'Prediction Complete + Labeled (Mature Video)' : 'Prediction Complete + Scheduled'}
                    </span>
                  </div>
                  <div className={`grid ${autoResult.actualDps != null ? 'grid-cols-4' : 'grid-cols-3'} gap-4 text-center`}>
                    <div>
                      <div className="text-2xl font-bold text-white">{autoResult.dps.toFixed(1)}</div>
                      <div className="text-xs text-gray-400 mt-1">Predicted VPS</div>
                    </div>
                    {autoResult.actualDps != null && (
                      <div>
                        <div className="text-2xl font-bold text-emerald-400">{autoResult.actualDps.toFixed(1)}</div>
                        <div className="text-xs text-gray-400 mt-1">Actual VPS</div>
                      </div>
                    )}
                    <div>
                      <div className="text-2xl font-bold text-white">{autoResult.actualTier || autoResult.tier}</div>
                      <div className="text-xs text-gray-400 mt-1">Tier</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {autoResult.isMature ? (
                          <span className="text-emerald-400 text-lg">Labeled</span>
                        ) : (
                          autoResult.scheduleCount
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{autoResult.isMature ? 'Status' : 'Schedules'}</div>
                    </div>
                  </div>
                  {autoResult.isMature && autoResult.videoAgeHours != null && (
                    <div className="mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-xs text-emerald-300">
                        Video is {autoResult.videoAgeHours.toFixed(0)}h old — labeled immediately with scraped metrics (labeling_mode: scrape_ingest)
                      </p>
                    </div>
                  )}
                  {autoResult.scheduleError && (
                    <div className="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-xs text-amber-300">{autoResult.scheduleError}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    Run ID: <code className="text-gray-400">{autoResult.runId}</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Auto Batch Panel ───────────── */}
        {uploadMode === 'auto-batch' && (
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-8 border border-white/[0.05] shadow-2xl mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Files className="w-5 h-5 text-[#e50914]" />
              <h3 className="text-lg font-semibold">Auto Batch</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30">
                SEARCH OR PASTE → BATCH PREDICT
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Search by keyword / creator or paste URLs → each video is scraped, predicted, and scheduled sequentially.
            </p>

            <div className="space-y-4">
              {/* Scrape input mode toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                {([
                  { key: 'url' as const, label: 'Paste URLs', icon: Link2 },
                  { key: 'keyword' as const, label: 'Keyword', icon: Search },
                  { key: 'creator' as const, label: 'Creator', icon: User },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setScrapeInputMode(key); setSearchResults([]); setSearchError(''); }}
                    disabled={batchRunning}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      scrapeInputMode === key
                        ? 'bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30'
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* URL textarea (URL mode) */}
              {scrapeInputMode === 'url' && (
                <div>
                  <label className="block text-sm font-medium mb-2">TikTok URLs (one per line)</label>
                  <textarea
                    value={batchUrlText}
                    onChange={(e) => setBatchUrlText(e.target.value)}
                    disabled={batchRunning}
                    rows={6}
                    placeholder={"https://www.tiktok.com/@user1/video/123...\nhttps://www.tiktok.com/@user2/video/456...\nhttps://www.tiktok.com/@user3/video/789..."}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl
                      focus:ring-2 focus:ring-[#e50914] focus:border-transparent text-white placeholder-gray-500
                      text-sm font-mono disabled:opacity-50"
                  />
                  {batchUrlText.trim() && !batchRunning && (
                    <p className="text-xs text-gray-500 mt-1">
                      {batchUrlText.split(/[\n,;]+/).filter(l => l.trim() && validateTikTokUrl(l.trim())).length} valid URLs detected
                    </p>
                  )}
                </div>
              )}

              {/* Search input (Keyword / Creator mode) */}
              {scrapeInputMode !== 'url' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {scrapeInputMode === 'keyword' ? 'Search Keyword' : 'Creator / Channel Name'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSearchError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) handleScrapeSearch('batch'); }}
                      placeholder={scrapeInputMode === 'keyword' ? 'side hustle, make money online...' : '@thekoerner, @maxtalkstech...'}
                      disabled={searchLoading || batchRunning}
                      className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl
                        focus:ring-2 focus:ring-[#e50914] focus:border-transparent text-white placeholder-gray-500
                        transition-all disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleScrapeSearch('batch')}
                      disabled={!searchQuery.trim() || searchLoading || batchRunning}
                      className="px-5 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-500"
                    >
                      {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                  {searchError && (
                    <div className="flex items-start gap-2 p-3 mt-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-300">{searchError}</p>
                    </div>
                  )}
                  {searchResults.length > 0 && batchItems.length > 0 && (
                    <p className="text-xs text-green-400 mt-2">
                      {batchItems.length} videos queued from search results — configure niche &amp; account size below, then click Run Batch.
                    </p>
                  )}
                </div>
              )}

              {/* Niche (all URLs) */}
              <div>
                <label className="block text-sm font-medium mb-2">Niche (all URLs)</label>
                <select
                  value={batchNiche}
                  onChange={(e) => setBatchNiche(e.target.value)}
                  disabled={batchRunning}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl focus:ring-2 focus:ring-[#e50914] text-white disabled:opacity-50"
                  style={{ colorScheme: 'dark' }}
                >
                  {NICHE_REGISTRY.map(n => (
                    <option key={n.key} value={n.key}>
                      {n.hasTrainedModel ? '🎯 ' : ''}{n.label}
                      {n.hasTrainedModel && n.xgboostCorrelation ? ` (XGBoost: ${n.xgboostCorrelation} correlation)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Queue table */}
              {batchItems.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/[0.03] text-gray-400 text-xs uppercase tracking-wider">
                        <th className="text-left py-2 px-3">#</th>
                        <th className="text-left py-2 px-3">URL</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Pred. VPS</th>
                        <th className="text-left py-2 px-3">Actual VPS</th>
                        <th className="text-left py-2 px-3">Tier</th>
                        <th className="text-left py-2 px-3">Sched.</th>
                        <th className="text-left py-2 px-3">Run ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchItems.map((item, idx) => (
                        <tr key={item.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-3 text-gray-200 max-w-[250px] truncate text-xs font-mono" title={item.url}>
                            {item.url.replace('https://www.tiktok.com/', '')}
                          </td>
                          <td className="py-2 px-3">
                            {item.status === 'queued' && (
                              <span className="text-xs px-2 py-1 rounded bg-gray-600/50 text-gray-300">Queued</span>
                            )}
                            {item.status === 'scraping' && (
                              <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 flex items-center gap-1 w-fit">
                                <Loader2 className="w-3 h-3 animate-spin" />Scraping
                              </span>
                            )}
                            {item.status === 'running' && (
                              <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 flex items-center gap-1 w-fit">
                                <Loader2 className="w-3 h-3 animate-spin" />Running
                              </span>
                            )}
                            {item.status === 'done' && (
                              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />Done
                              </span>
                            )}
                            {item.status === 'failed' && (
                              <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-300">{item.predictedDps != null ? item.predictedDps.toFixed(1) : '—'}</td>
                          <td className="py-2 px-3">{item.actualDps != null ? <span className="text-emerald-400 font-medium">{item.actualDps.toFixed(1)}</span> : <span className="text-gray-500">—</span>}</td>
                          <td className="py-2 px-3 text-gray-300">{item.actualTier || item.predictedTier || '—'}</td>
                          <td className="py-2 px-3 text-gray-300">{item.isMature ? <span className="text-emerald-400 text-xs">Labeled</span> : (item.scheduleCount != null ? item.scheduleCount : '—')}</td>
                          <td className="py-2 px-3 text-xs">
                            {item.runId ? (
                              <code className="text-gray-500">{item.runId.slice(0, 8)}…</code>
                            ) : item.error ? (
                              <span className="text-red-400" title={item.error}>{item.error.slice(0, 30)}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Progress bar */}
              {batchRunning && batchItems.length > 0 && (() => {
                const done = batchItems.filter(i => i.status === 'done' || i.status === 'failed').length;
                const pct = Math.round((done / batchItems.length) * 100);
                return (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{done} / {batchItems.length} processed</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#e50914] to-[#ff1744] transition-all duration-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Action buttons */}
              <div className="flex gap-3">
                {!batchRunning ? (
                  <button
                    onClick={handleAutoBatch}
                    disabled={!batchUrlText.trim() && batchItems.length < 2}
                    className="flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: (batchUrlText.trim() || batchItems.length >= 2) ? 'linear-gradient(135deg, #e50914, #ff1744)' : undefined,
                      backgroundColor: (!batchUrlText.trim() && batchItems.length < 2) ? '#333' : undefined,
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {scrapeInputMode === 'url' ? 'Run Batch' : `Run Batch (${batchItems.length} videos)`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleBatchAbort}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Square className="w-4 h-4" />
                      Stop Batch
                    </span>
                  </button>
                )}
                {!batchRunning && batchItems.length > 0 && (
                  <button
                    onClick={handleBatchClear}
                    className="px-6 py-3 rounded-xl font-medium text-gray-400 border border-white/10 hover:bg-white/[0.04] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Batch summary when done */}
              {!batchRunning && batchItems.length > 0 && batchItems.every(i => i.status === 'done' || i.status === 'failed') && (
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-gray-200">Batch Complete</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="text-xl font-bold text-green-400">{batchItems.filter(i => i.status === 'done').length}</div>
                      <div className="text-xs text-gray-500">Succeeded</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-red-400">{batchItems.filter(i => i.status === 'failed').length}</div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">
                        {batchItems.filter(i => i.scheduleCount != null).reduce((sum, i) => sum + (i.scheduleCount || 0), 0)}
                      </div>
                      <div className="text-xs text-gray-500">Schedules Created</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 82: Training Ingest Section (chairman-only, feature-flagged) */}
        <TrainingIngestSection />
      </div>
    </div>
  );
}

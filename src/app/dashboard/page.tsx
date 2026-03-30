'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Zap,
  FileText,
  LayoutTemplate,
  ScrollText,
  TrendingUp,
  Clock,
  Star,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Trophy,
  Target,
  Hash,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreatorProfile {
  id: string;
  user_id: string;
  niche_key: string | null;
  channel_handle: string | null;
  channel_data: Record<string, unknown> | null;
  onboarding_completed_at: string | null;
  onboarding_step: string;
  calibration_preferences: Record<string, unknown> | null;
  business_name: string | null;
  [key: string]: unknown;
}

interface ChannelInfo {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number | null;
  inferred_niche_key: string | null;
}

interface Script {
  id: string;
  script_text: string | null;
  vps_score: number | null;
  niche_key: string | null;
  created_at: string;
  status: string;
}

interface Brief {
  id: string;
  brief_content: Record<string, unknown>;
  status: string;
  predicted_vps: number | null;
  created_at: string;
}

interface PerformanceStats {
  totalScripts: number;
  avgVps: number | null;
  highestVps: number | null;
  totalPredictions: number;
}

type LoadState = 'loading' | 'no-auth' | 'no-profile' | 'ready';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function vpsColor(score: number | null): string {
  if (score == null) return 'text-white/40';
  if (score >= 70) return 'text-[#2ECC71]';
  if (score >= 50) return 'text-[#00D9FF]';
  if (score >= 30) return 'text-[#F39C12]';
  return 'text-[#FF4757]';
}

function vpsBgColor(score: number | null): string {
  if (score == null) return 'bg-white/5';
  if (score >= 70) return 'bg-[#2ECC71]/10';
  if (score >= 50) return 'bg-[#00D9FF]/10';
  if (score >= 30) return 'bg-[#F39C12]/10';
  return 'bg-[#FF4757]/10';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function extractHook(scriptText: string | null): string {
  if (!scriptText) return 'Untitled Script';
  // Take first line, truncate to 80 chars
  const firstLine = scriptText.split('\n').find((l) => l.trim()) || 'Untitled Script';
  return firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;
}

function nicheLabel(key: string | null): string {
  if (!key) return 'Not set';
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFollowers(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function CreatorDashboardPage() {
  const [state, setState] = useState<LoadState>('loading');
  const [userName, setUserName] = useState('Creator');
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    totalScripts: 0,
    avgVps: null,
    highestVps: null,
    totalPredictions: 0,
  });

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setState('no-auth');
      return;
    }

    // Get display name from profiles table or user metadata
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    setUserName(
      profileRow?.display_name || user.user_metadata?.name || 'Creator'
    );

    // 2. Load onboarding profile
    const { data: onboarding } = await supabase
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!onboarding || !onboarding.onboarding_completed_at) {
      setProfile(onboarding as CreatorProfile | null);
      setState('no-profile');
      return;
    }

    setProfile(onboarding as CreatorProfile);

    // 3. Load channel info
    const { data: ch } = await supabase
      .from('user_channels')
      .select('username, display_name, avatar_url, follower_count, inferred_niche_key')
      .eq('user_id', user.id)
      .eq('platform', 'tiktok')
      .maybeSingle();
    if (ch) setChannel(ch as ChannelInfo);

    // 4. Load scripts (most recent 10)
    const { data: scriptRows } = await supabase
      .from('generated_scripts')
      .select('id, script_text, vps_score, niche_key, created_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (scriptRows) setScripts(scriptRows as Script[]);

    // 5. Load active briefs
    const { data: briefRows } = await supabase
      .from('content_briefs')
      .select('id, brief_content, status, predicted_vps, created_at')
      .eq('user_id', user.id)
      .in('status', ['generated', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(5);
    if (briefRows) setBriefs(briefRows as Brief[]);

    // 6. Compute performance stats from all scripts
    const { data: allScripts } = await supabase
      .from('generated_scripts')
      .select('vps_score')
      .eq('user_id', user.id);

    if (allScripts && allScripts.length > 0) {
      const scores = allScripts
        .map((s: { vps_score: number | null }) => s.vps_score)
        .filter((v): v is number => v != null);
      setStats({
        totalScripts: allScripts.length,
        avgVps: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        highestVps: scores.length > 0 ? Math.max(...scores) : null,
        totalPredictions: scores.length,
      });
    }

    setState('ready');
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------------------------------------------------------------- */
  /*  Loading                                                          */
  /* ---------------------------------------------------------------- */
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-white/40 text-sm">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Not authenticated                                                */
  /* ---------------------------------------------------------------- */
  if (state === 'no-auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard variant="elevated" className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF4757] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-white/50 text-sm mb-6">
            Please sign in to access your creator dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#FF4757] hover:bg-[#FF4757]/80 text-white text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
        </GlassCard>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  No onboarding profile / incomplete onboarding                    */
  /* ---------------------------------------------------------------- */
  if (state === 'no-profile') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard variant="elevated" className="max-w-lg w-full p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9B59B6] to-[#00D9FF] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Welcome to Trendzo!</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Let&apos;s set up your creator profile so we can personalize your viral
            content strategy. It only takes a few minutes.
          </p>
          <Link
            href="/admin/viral-studio"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF4757] to-[#9B59B6] hover:opacity-90 text-white font-semibold transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Start Onboarding
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-xs mt-4">
            Takes about 5 minutes to complete
          </p>
        </GlassCard>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Full Dashboard                                                   */
  /* ---------------------------------------------------------------- */
  const niche = profile?.niche_key || channel?.inferred_niche_key || null;
  const handle = channel?.username || (profile?.channel_handle as string | null) || null;
  const displayName = channel?.display_name || userName;
  const creatorStage = (profile?.creator_stage as string | null) || null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ============================================================ */}
      {/* SECTION A: Creator Profile Header                            */}
      {/* ============================================================ */}
      <GlassCard variant="default" disableHoverEffects className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          {channel?.avatar_url ? (
            <img
              src={channel.avatar_url}
              alt={displayName}
              className="w-14 h-14 rounded-full border-2 border-white/10 object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF4757] to-[#9B59B6] flex items-center justify-center text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              Welcome back, {displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-white/50">
              {handle && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />@{handle}
                </span>
              )}
              {niche && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#9B59B6]/15 text-[#9B59B6] text-xs font-medium">
                  {nicheLabel(niche)}
                </span>
              )}
              {creatorStage && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00D9FF]/15 text-[#00D9FF] text-xs font-medium">
                  {nicheLabel(creatorStage)}
                </span>
              )}
              {channel?.follower_count != null && (
                <span className="text-white/40 text-xs">
                  {formatFollowers(channel.follower_count)} followers
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ============================================================ */}
      {/* SECTION B: Quick Actions Bar                                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/admin/workflows/quick-win" className="block">
          <GlassCard
            variant="interactive"
            className="p-4 flex items-center gap-3 h-full"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4757] to-[#FF4757]/60 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">Start Quick Win</div>
              <div className="text-xs text-white/40">Generate a viral script</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
          </GlassCard>
        </Link>

        <Link href="/admin/viral-studio" className="block">
          <GlassCard
            variant="interactive"
            className="p-4 flex items-center gap-3 h-full"
          >
            <div className="w-10 h-10 rounded-lg bg-[#9B59B6]/20 flex items-center justify-center flex-shrink-0">
              <LayoutTemplate className="w-5 h-5 text-[#9B59B6]" />
            </div>
            <div>
              <div className="text-sm font-semibold">View Templates</div>
              <div className="text-xs text-white/40">Browse viral templates</div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
          </GlassCard>
        </Link>

        <Link href="/dashboard/scripts" className="block">
          <GlassCard
            variant="interactive"
            className="p-4 flex items-center gap-3 h-full"
          >
            <div className="w-10 h-10 rounded-lg bg-[#00D9FF]/20 flex items-center justify-center flex-shrink-0">
              <ScrollText className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div>
              <div className="text-sm font-semibold">My Scripts</div>
              <div className="text-xs text-white/40">
                {stats.totalScripts > 0
                  ? `${stats.totalScripts} script${stats.totalScripts !== 1 ? 's' : ''}`
                  : 'View your scripts'}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
          </GlassCard>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* SECTION C: Active Briefs                                     */}
      {/* ============================================================ */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Active Briefs
        </h2>
        {briefs.length === 0 ? (
          <GlassCard variant="subtle" disableHoverEffects className="p-6 text-center">
            <FileText className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto">
              No active briefs yet. Your agency will push briefs when cultural
              moments align with your niche. In the meantime, start a Quick Win!
            </p>
            <Link
              href="/admin/workflows/quick-win"
              className="inline-flex items-center gap-1.5 mt-4 text-xs text-[#00D9FF] hover:text-[#00D9FF]/80 font-medium transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Start a Quick Win
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {briefs.map((brief) => {
              const title =
                (brief.brief_content?.title as string) ||
                (brief.brief_content?.hook as string) ||
                'Untitled Brief';
              return (
                <GlassCard
                  key={brief.id}
                  variant="interactive"
                  className="p-4 flex items-center gap-4"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#F39C12]/15 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-[#F39C12]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{title}</div>
                    <div className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{brief.status}</span>
                      {brief.predicted_vps != null && (
                        <span className={vpsColor(brief.predicted_vps)}>
                          VPS {brief.predicted_vps}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/30">
                    {formatDate(brief.created_at)}
                  </span>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION D: Script History                                    */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Recent Scripts
          </h2>
          {scripts.length > 0 && (
            <Link
              href="/dashboard/scripts"
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              View All →
            </Link>
          )}
        </div>
        {scripts.length === 0 ? (
          <GlassCard variant="subtle" disableHoverEffects className="p-6 text-center">
            <ScrollText className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              No scripts yet. Start your first Quick Win to generate a viral
              script!
            </p>
            <Link
              href="/admin/workflows/quick-win"
              className="inline-flex items-center gap-1.5 mt-4 text-xs text-[#00D9FF] hover:text-[#00D9FF]/80 font-medium transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate Your First Script
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {scripts.map((script) => (
              <GlassCard
                key={script.id}
                variant="default"
                disableHoverEffects
                className="p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg ${vpsBgColor(script.vps_score)} flex items-center justify-center flex-shrink-0`}
                  >
                    <span
                      className={`text-base font-bold ${vpsColor(script.vps_score)}`}
                    >
                      {script.vps_score != null
                        ? Math.round(script.vps_score)
                        : '—'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {extractHook(script.script_text)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                      {script.niche_key && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5">
                          {nicheLabel(script.niche_key)}
                        </span>
                      )}
                      <span className="capitalize">{script.status}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(script.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION E: Performance Summary                               */}
      {/* ============================================================ */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Performance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassCard variant="subtle" disableHoverEffects className="p-4 text-center">
            <ScrollText className="w-5 h-5 text-[#00D9FF] mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalScripts}</div>
            <div className="text-xs text-white/40 mt-1">Scripts Generated</div>
          </GlassCard>

          <GlassCard variant="subtle" disableHoverEffects className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-[#2ECC71] mx-auto mb-2" />
            <div className={`text-2xl font-bold ${vpsColor(stats.avgVps)}`}>
              {stats.avgVps != null ? stats.avgVps : '—'}
            </div>
            <div className="text-xs text-white/40 mt-1">Avg VPS Score</div>
          </GlassCard>

          <GlassCard variant="subtle" disableHoverEffects className="p-4 text-center">
            <Trophy className="w-5 h-5 text-[#F39C12] mx-auto mb-2" />
            <div className={`text-2xl font-bold ${vpsColor(stats.highestVps)}`}>
              {stats.highestVps != null ? stats.highestVps : '—'}
            </div>
            <div className="text-xs text-white/40 mt-1">Highest VPS</div>
          </GlassCard>

          <GlassCard variant="subtle" disableHoverEffects className="p-4 text-center">
            <Star className="w-5 h-5 text-[#9B59B6] mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalPredictions}</div>
            <div className="text-xs text-white/40 mt-1">Predictions Run</div>
          </GlassCard>
        </div>

        {stats.totalScripts === 0 && (
          <p className="text-center text-white/30 text-xs mt-3">
            Generate your first script to see your stats!
          </p>
        )}
      </div>
    </div>
  );
}

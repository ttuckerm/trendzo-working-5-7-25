'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { ScrollText, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

interface Script {
  id: string;
  script_text: string | null;
  vps_score: number | null;
  niche_key: string | null;
  created_at: string;
  status: string;
}

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
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function extractHook(text: string | null): string {
  if (!text) return 'Untitled Script';
  const line = text.split('\n').find((l) => l.trim()) || 'Untitled Script';
  return line.length > 100 ? line.slice(0, 97) + '...' : line;
}

function nicheLabel(key: string | null): string {
  if (!key) return '';
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('generated_scripts')
      .select('id, script_text, vps_score, niche_key, created_at, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setScripts(data as Script[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My Scripts</h1>
        <Link
          href="/admin/workflows/quick-win"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF4757] hover:bg-[#FF4757]/80 text-white text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          New Script
        </Link>
      </div>

      {scripts.length === 0 ? (
        <GlassCard variant="subtle" disableHoverEffects className="p-8 text-center">
          <ScrollText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm mb-4">
            You haven&apos;t generated any scripts yet.
          </p>
          <Link
            href="/admin/workflows/quick-win"
            className="inline-flex items-center gap-1.5 text-sm text-[#00D9FF] hover:text-[#00D9FF]/80 font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            Start your first Quick Win
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
                  <span className={`text-base font-bold ${vpsColor(script.vps_score)}`}>
                    {script.vps_score != null ? Math.round(script.vps_score) : '—'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{extractHook(script.script_text)}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                    {script.niche_key && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5">
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
                  {script.script_text && (
                    <p className="text-xs text-white/30 mt-2 line-clamp-2">
                      {script.script_text.slice(0, 200)}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

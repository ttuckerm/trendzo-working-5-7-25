"use client";

import Draggable from 'react-draggable';
import { useEffect, useState } from 'react';
import { useWindowsStore } from '@/lib/state/windowStore';
import { getRecipeBook } from '@/lib/fetchers';
import { RecipeTemplate, TemplateStatus } from '@/lib/types';
import { X, Minus, RotateCw, Clock, Search, ArrowUpDown, ExternalLink, Copy, BookOpen } from 'lucide-react';
import { GlassCard } from '@/components/ui/os/Card';
import { Pill } from '@/components/ui/os/Pill';
import { Tabs } from '@/components/ui/os/Tabs';
import { Button } from '@/components/ui/os/Button';
import { ProgressRing } from '@/components/ui/os/ProgressRing';
import clsx from 'clsx';
import { transitions } from '@/styles/motion';

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Auto-generated today • 6:00 AM';
  const d = new Date(iso);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `Auto-generated today • ${h12}:${minutes} ${ampm}`;
}

function useRecipeBook(status: TemplateStatus, q: string, sort: 'success' | 'uses' | 'trend') {
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [templates, setTemplates] = useState<RecipeTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRecipeBook({ status, q, sort });
      setGeneratedAt(data.generatedAt);
      setTemplates(data.templates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, sort]);

  return { generatedAt, templates, loading, refresh: fetchData };
}

export function RecipeBookWindow() {
  const state = useWindowsStore();
  const wnd = state.windows.recipeBook;
  const [activeTab, setActiveTab] = useState<TemplateStatus>('HOT');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'success' | 'uses' | 'trend'>('success');
  const { generatedAt, templates, loading, refresh } = useRecipeBook(activeTab, q, sort);

  if (!wnd.isOpen) return null;

  const onStart = () => state.bringToFront('recipeBook');
  const onDrag = (_e: any, data: any) => state.move('recipeBook', data.x, data.y);

  const onResize = (evt: React.MouseEvent<HTMLDivElement>) => {
    const startX = evt.clientX;
    const startY = evt.clientY;
    const startW = wnd.width;
    const startH = wnd.height;
    const onMove = (e: MouseEvent) => {
      const dw = Math.max(640, startW + (e.clientX - startX));
      const dh = Math.max(420, startH + (e.clientY - startY));
      state.resize('recipeBook', dw, dh);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const copyWinner = async (t: RecipeTemplate) => {
    const blueprint = {
      templateId: t.id,
      name: t.name,
      beats: [
        { t: 0.0, type: 'hook', note: '{first 1.2s hook text}' },
        { t: 1.2, type: 'pattern_interrupt', note: '{action}' },
        { t: 2.0, type: 'broll', note: '{cut to...}' },
        { t: 4.5, type: 'cta', note: '{soft CTA}' },
      ],
      scriptHints: t.keyPatterns.slice(0, 2),
    };
    await navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
  };

  // Avoid conditional hooks by not introducing hooks after early returns
  const cards = templates;

  return (
    <Draggable position={{ x: wnd.x, y: wnd.y }} onStart={onStart} onDrag={onDrag} handle=".rb-header">
      <div
        className="fixed"
        style={{ width: wnd.width, height: wnd.height, zIndex: wnd.z }}
        onMouseDown={() => state.bringToFront('recipeBook')}
      >
        <div className="flex h-full w-full flex-col overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="rbw-title"
          style={{
            ...transitions.medium,
            background: 'var(--panel-bg)',
            backdropFilter: `blur(var(--blur))`,
            WebkitBackdropFilter: `blur(var(--blur))`,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-chrome)'
          }}
        >
          {/* Header */}
          <div className="rb-header flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2" role="toolbar" aria-label="Window controls">
            <div className="flex items-center gap-2">
              <button className="h-3 w-3 rounded-full bg-rose-500" aria-label="Close window" onClick={() => state.close('recipeBook')} />
              <button className="h-3 w-3 rounded-full bg-amber-500" aria-label="Minimize window" onClick={() => state.close('recipeBook')} />
              <button className="h-3 w-3 rounded-full bg-emerald-500" aria-label="Bring window to front" onClick={() => state.bringToFront('recipeBook')} />
            </div>
            <div className="ml-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
              <h2 id="rbw-title" className="text-sm font-medium">🍳 Today’s Recipe Book</h2>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-zinc-300">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span>{formatTimestamp(generatedAt)}</span>
              <Button onClick={refresh} className="ml-2" aria-label="Refresh">
                <RotateCw className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <Tabs
              tabs={[
                { id: 'HOT', label: 'HOT' },
                { id: 'COOLING', label: 'COOLING' },
                { id: 'NEW', label: 'NEW' },
              ]}
              active={activeTab}
              onChange={(id) => setActiveTab(id as TemplateStatus)}
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                <Search className="h-4 w-4 text-zinc-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search templates"
                  className="w-56 bg-transparent text-sm text-white placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                <ArrowUpDown className="h-4 w-4 text-zinc-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-transparent text-sm text-white focus:outline-none"
                >
                  <option value="success" className="bg-zinc-900">Success rate</option>
                  <option value="uses" className="bg-zinc-900">Uses</option>
                  <option value="trend" className="bg-zinc-900">Trend</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {loading && <div className="text-sm text-zinc-400">Loading…</div>}
            {!loading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((t) => (
                  <GlassCard key={t.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-white/10">
                        <img src={t.previewThumb} alt="thumb" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate font-medium">{t.name}</div>
                          <div className="flex items-center gap-2">
                            <ProgressRing value={t.successRate} />
                            <span className="text-xs text-zinc-300">{t.successRate}%</span>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                          <span>Uses: {t.uses.toLocaleString()}</span>
                          <span
                            className={clsx(
                              'rounded-full px-2 py-0.5 text-xs',
                              t.trendDelta7d >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            )}
                          >
                            {t.trendDelta7d >= 0 ? '▲' : '▼'} {Math.abs(t.trendDelta7d)}%
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.keyPatterns.slice(0, 4).map((p, i) => (
                            <Pill key={i} label={p} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Button onClick={() => copyWinner(t)}>
                        <Copy className="h-4 w-4" /> Copy Winner
                      </Button>
                      <Button onClick={() => console.log('open-studio', t.id)}>
                        <BookOpen className="h-4 w-4" /> Open in Studio
                      </Button>
                      <Button onClick={() => console.log('view-examples', t.id)}>
                        <ExternalLink className="h-4 w-4" /> View Examples
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-2 text-center text-xs text-zinc-400">
            Templates auto-generated daily from the viral pool.
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={onResize}
            className="absolute bottom-1 right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-white/20 bg-white/20"
          />
        </div>
      </div>
    </Draggable>
  );
}



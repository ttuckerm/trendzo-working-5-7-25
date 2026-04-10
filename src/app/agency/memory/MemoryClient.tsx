'use client'

import { useState, useEffect, useCallback } from 'react'
import { Brain, Flame, Archive, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Search, Check, X, AlertTriangle } from 'lucide-react'

// ── Design tokens (from agency dashboard) ─────────────────────────────

const T = {
  bg: '#1c1c24',
  bgDeep: '#08080d',
  border: '#1e1e2e',
  cyan: '#00d4ff',
  gold: '#f4b942',
  textPrimary: '#e8e8f0',
  textSecondary: '#8888a0',
  textDim: '#55556a',
  raised: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
}

const TOKEN_BUDGET = 2000

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ── Types ─────────────────────────────────────────────────────────────

interface MemoryFact {
  id: number
  agency_id: string
  fact: string
  source: string
  tier: 'hot' | 'warm' | 'cold'
  confidence: number
  reference_count: number
  superseded_by: number | null
  created_at: string
  updated_at: string
}

// ── API helpers ───────────────────────────────────────────────────────

async function fetchMemory(agencyId: string): Promise<{ facts: MemoryFact[]; hot_token_usage: number }> {
  const res = await fetch(`/api/agency/memory?agency_id=${agencyId}`)
  if (!res.ok) throw new Error('Failed to fetch memory')
  return res.json()
}

async function createFact(agencyId: string, fact: string): Promise<{ fact?: MemoryFact; error?: string; current_tokens?: number; budget?: number }> {
  const res = await fetch('/api/agency/memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agency_id: agencyId, fact }),
  })
  return res.json()
}

async function updateFact(id: number, agencyId: string, updates: Partial<MemoryFact>): Promise<{ fact?: MemoryFact; error?: string; current_tokens?: number; budget?: number }> {
  const res = await fetch('/api/agency/memory', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, agency_id: agencyId, ...updates }),
  })
  return res.json()
}

async function deleteFact(id: number, agencyId: string): Promise<void> {
  await fetch('/api/agency/memory', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, agency_id: agencyId }),
  })
}

// ── Main component ────────────────────────────────────────────────────

export default function MemoryClient({ agencyId }: { agencyId: string }) {
  const [facts, setFacts] = useState<MemoryFact[]>([])
  const [hotTokens, setHotTokens] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const data = await fetchMemory(agencyId)
      setFacts(data.facts)
      setHotTokens(data.hot_token_usage)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [agencyId])

  useEffect(() => { reload() }, [reload])

  const hotFacts = facts.filter(f => f.tier === 'hot')
  const warmFacts = facts.filter(f => f.tier === 'warm')
  const coldFacts = facts.filter(f => f.tier === 'cold')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bgDeep }}>
        <p className="text-sm font-mono" style={{ color: T.textSecondary }}>Loading memory...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: T.bgDeep }}>
      <style>{`
        @keyframes neuFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page header */}
        <div style={{ animation: 'neuFadeUp 0.45s ease both' }}>
          <div className="flex items-center gap-3 mb-1">
            <Brain className="w-5 h-5" style={{ color: T.cyan }} />
            <h1 className="font-display text-xl font-bold" style={{ color: T.textPrimary }}>
              Agency Memory
            </h1>
          </div>
          <p className="text-sm" style={{ color: T.textSecondary }}>
            What Trendzo knows about your agency. Edit, add, or reorganize knowledge across tiers.
          </p>
        </div>

        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ background: '#f04a4d20', color: '#f04a4d', border: '1px solid #f04a4d40' }}>
            {error}
          </div>
        )}

        {/* HOT MEMORY */}
        <HotSection
          facts={hotFacts}
          tokens={hotTokens}
          agencyId={agencyId}
          onReload={reload}
        />

        {/* WARM MEMORY */}
        <WarmSection
          facts={warmFacts}
          agencyId={agencyId}
          onReload={reload}
        />

        {/* COLD MEMORY */}
        <ColdSection
          facts={coldFacts}
          agencyId={agencyId}
          onReload={reload}
        />
      </div>
    </div>
  )
}

// ── Hot Memory Section ────────────────────────────────────────────────

function HotSection({ facts, tokens, agencyId, onReload }: {
  facts: MemoryFact[]
  tokens: number
  agencyId: string
  onReload: () => Promise<void>
}) {
  const [newFact, setNewFact] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const pct = Math.min(100, (tokens / TOKEN_BUDGET) * 100)
  const barColor = pct > 90 ? '#f04a4d' : pct > 70 ? T.gold : T.cyan

  const handleAdd = async () => {
    if (!newFact.trim()) return
    setAdding(true)
    setAddError(null)
    const result = await createFact(agencyId, newFact.trim())
    if (result.error) {
      setAddError(result.error + (result.current_tokens ? ` (${result.current_tokens}/${result.budget} tokens used)` : ''))
    } else {
      setNewFact('')
    }
    await onReload()
    setAdding(false)
  }

  const newTokens = estimateTokens(newFact)
  const wouldExceed = tokens + newTokens > TOKEN_BUDGET && newFact.length > 0

  return (
    <SectionCard
      icon={<Flame className="w-4 h-4" />}
      iconColor={T.cyan}
      title="Active knowledge"
      subtitle="Injected into every AI interaction"
      count={facts.length}
      delay={0}
    >
      {/* Token bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: T.textDim }}>
            Token usage
          </span>
          <span className="text-[10px] font-mono" style={{ color: T.textSecondary }}>
            {tokens.toLocaleString()} / {TOKEN_BUDGET.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>

      {/* Fact cards */}
      {facts.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: T.textDim }}>
          No active knowledge yet. Add your first fact below.
        </p>
      )}
      <div className="space-y-2">
        {facts.map(f => (
          <FactCard key={f.id} fact={f} agencyId={agencyId} onReload={onReload} demoteLabel="Move to warm" demoteTier="warm" />
        ))}
      </div>

      {/* Add fact input */}
      <div className="mt-4 space-y-2">
        <div className="flex gap-2">
          <input
            value={newFact}
            onChange={e => { setNewFact(e.target.value); setAddError(null) }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a new fact about your agency..."
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: T.border, color: T.textPrimary, border: '1px solid transparent' }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newFact.trim()}
            className="rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-opacity disabled:opacity-40"
            style={{ background: T.cyan + '20', color: T.cyan, border: `1px solid ${T.cyan}40` }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
        {wouldExceed && (
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: T.gold }}>
            <AlertTriangle className="w-3 h-3" />
            Adding this would use {tokens + newTokens} / {TOKEN_BUDGET} tokens
          </div>
        )}
        {addError && (
          <div className="text-[11px]" style={{ color: '#f04a4d' }}>{addError}</div>
        )}
      </div>
    </SectionCard>
  )
}

// ── Warm Memory Section ───────────────────────────────────────────────

function WarmSection({ facts, agencyId, onReload }: {
  facts: MemoryFact[]
  agencyId: string
  onReload: () => Promise<void>
}) {
  return (
    <SectionCard
      icon={<Brain className="w-4 h-4" />}
      iconColor={T.gold}
      title="Background knowledge"
      subtitle="Available on demand, not auto-injected"
      count={facts.length}
      delay={1}
    >
      {facts.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: T.textDim }}>
          No background knowledge stored.
        </p>
      )}
      <div className="space-y-2">
        {facts.map(f => (
          <FactCard
            key={f.id}
            fact={f}
            agencyId={agencyId}
            onReload={onReload}
            promoteLabel="Promote to hot"
            promoteTier="hot"
            demoteLabel="Archive"
            demoteTier="cold"
          />
        ))}
      </div>
    </SectionCard>
  )
}

// ── Cold Memory Section ───────────────────────────────────────────────

function ColdSection({ facts, agencyId, onReload }: {
  facts: MemoryFact[]
  agencyId: string
  onReload: () => Promise<void>
}) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? facts.filter(f => f.fact.toLowerCase().includes(search.toLowerCase()))
    : facts

  return (
    <SectionCard
      icon={<Archive className="w-4 h-4" />}
      iconColor={T.textDim}
      title="Archive"
      subtitle="Searchable history — not auto-loaded"
      count={facts.length}
      delay={2}
    >
      {/* Search */}
      <div className="mb-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: T.border }}>
          <Search className="w-3.5 h-3.5" style={{ color: T.textDim }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search archived facts..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: T.textPrimary }}
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: T.textDim }}>
          {facts.length === 0 ? 'No archived facts.' : 'No results.'}
        </p>
      )}
      <div className="space-y-2">
        {filtered.slice(0, 50).map(f => (
          <FactCard
            key={f.id}
            fact={f}
            agencyId={agencyId}
            onReload={onReload}
            promoteLabel="Restore to warm"
            promoteTier="warm"
            showMeta
          />
        ))}
      </div>
      {filtered.length > 50 && (
        <p className="text-xs text-center mt-2" style={{ color: T.textDim }}>
          Showing 50 of {filtered.length} archived facts
        </p>
      )}
    </SectionCard>
  )
}

// ── Section card wrapper ──────────────────────────────────────────────

function SectionCard({ icon, iconColor, title, subtitle, count, delay, children }: {
  icon: React.ReactNode
  iconColor: string
  title: string
  subtitle: string
  count: number
  delay: number
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl p-5 overflow-hidden"
      style={{
        background: T.bg,
        boxShadow: T.raised,
        animation: 'neuFadeUp 0.45s ease both',
        animationDelay: `${delay * 80}ms`,
      }}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${iconColor}, transparent)` }} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ color: iconColor }}>{icon}</span>
            <h2 className="text-sm font-semibold" style={{ color: T.textPrimary }}>{title}</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md"
              style={{ background: iconColor + '15', color: iconColor, border: `1px solid ${iconColor}30` }}>
              {count}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: T.textDim }}>{subtitle}</p>
        </div>
      </div>

      {children}
    </div>
  )
}

// ── Fact card ─────────────────────────────────────────────────────────

function FactCard({ fact, agencyId, onReload, promoteLabel, promoteTier, demoteLabel, demoteTier, showMeta }: {
  fact: MemoryFact
  agencyId: string
  onReload: () => Promise<void>
  promoteLabel?: string
  promoteTier?: string
  demoteLabel?: string
  demoteTier?: string
  showMeta?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(fact.fact)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!editText.trim() || editText === fact.fact) { setEditing(false); return }
    setBusy(true)
    await updateFact(fact.id, agencyId, { fact: editText.trim() })
    await onReload()
    setEditing(false)
    setBusy(false)
  }

  const handleDelete = async () => {
    setBusy(true)
    await deleteFact(fact.id, agencyId)
    await onReload()
    setBusy(false)
  }

  const handleTierChange = async (newTier: string) => {
    setBusy(true)
    setCardError(null)
    const result = await updateFact(fact.id, agencyId, { tier: newTier as any })
    if (result.error) {
      setCardError(result.error)
    }
    await onReload()
    setBusy(false)
  }

  const date = new Date(fact.created_at)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div
      className="group rounded-xl px-4 py-3 transition-colors"
      style={{ background: T.border + '40', border: `1px solid ${T.border}` }}
    >
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: T.bg, color: T.textPrimary, border: `1px solid ${T.border}` }}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={busy} className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md" style={{ color: T.cyan }}>
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => { setEditing(false); setEditText(fact.fact) }} className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md" style={{ color: T.textDim }}>
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed" style={{ color: T.textPrimary + 'cc' }}>
            {fact.fact}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono" style={{ color: T.textDim }}>
                {fact.source.replace(/_/g, ' ')}
              </span>
              {showMeta && (
                <span className="text-[10px] font-mono" style={{ color: T.textDim }}>
                  {dateStr}
                </span>
              )}
              <span className="text-[10px] font-mono" style={{ color: T.textDim }}>
                conf {(fact.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Actions — visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {promoteLabel && promoteTier && (
                <button
                  onClick={() => handleTierChange(promoteTier)}
                  disabled={busy}
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-white/5"
                  style={{ color: T.cyan }}
                >
                  <ArrowUp className="w-3 h-3" /> {promoteLabel}
                </button>
              )}
              {demoteLabel && demoteTier && (
                <button
                  onClick={() => handleTierChange(demoteTier)}
                  disabled={busy}
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-white/5"
                  style={{ color: T.textDim }}
                >
                  <ArrowDown className="w-3 h-3" /> {demoteLabel}
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-white/5"
                style={{ color: T.textSecondary }}
              >
                <Pencil className="w-3 h-3" />
              </button>
              {confirming ? (
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ color: '#f04a4d' }}
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={() => { setConfirming(true); setTimeout(() => setConfirming(false), 3000) }}
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-white/5"
                  style={{ color: T.textDim }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {cardError && (
            <div className="text-[11px] mt-1" style={{ color: '#f04a4d' }}>{cardError}</div>
          )}
        </>
      )}
    </div>
  )
}

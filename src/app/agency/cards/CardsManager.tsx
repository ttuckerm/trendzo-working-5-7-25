'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'

interface CardData {
  id: string
  share_id: string
  creator_name: string
  creator_handle: string | null
  creator_niche: string
  vps_score: number | null
  follower_count: number | null
  trend_direction: string | null
  agency_name: string
  agent_enabled: boolean
  agent_system_prompt: string | null
  total_views: number
  total_shares: number
  total_agent_sessions: number
  total_leads: number
  is_active: boolean
  created_at: string
}

interface CardsManagerProps {
  cards: CardData[]
  agencyId: string
}

export default function CardsManager({ cards: initialCards, agencyId }: CardsManagerProps) {
  const [cards, setCards] = useState(initialCards)
  const [copied, setCopied] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Create card form state
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    creator_name: '',
    creator_handle: '',
    creator_niche: '',
    vps_score: '',
    follower_count: '',
    trend_direction: '',
  })

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const copyLink = useCallback((shareId: string) => {
    navigator.clipboard.writeText(`${baseUrl}/t/${shareId}`)
    setCopied(shareId)
    setTimeout(() => setCopied(null), 2000)
  }, [baseUrl])

  async function toggleActive(cardId: string, currentActive: boolean) {
    const res = await fetch(`/api/cards/${cards.find(c => c.id === cardId)?.share_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    })
    if (res.ok) {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, is_active: !currentActive } : c))
    }
  }

  async function savePrompt(cardId: string) {
    setSaving(true)
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    const res = await fetch(`/api/cards/${card.share_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_system_prompt: promptValue || null }),
    })
    if (res.ok) {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, agent_system_prompt: promptValue || null } : c))
      setEditingPrompt(null)
    }
    setSaving(false)
  }

  async function createCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/cards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vps_score: formData.vps_score ? parseFloat(formData.vps_score) : null,
          follower_count: formData.follower_count ? parseInt(formData.follower_count) : null,
          trend_direction: formData.trend_direction || null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ creator_name: '', creator_handle: '', creator_niche: '', vps_score: '', follower_count: '', trend_direction: '' })
        window.location.reload()
      }
    } finally {
      setCreating(false)
    }
  }

  const totalViews = cards.reduce((s, c) => s + c.total_views, 0)
  const totalLeads = cards.reduce((s, c) => s + c.total_leads, 0)
  const totalSessions = cards.reduce((s, c) => s + c.total_agent_sessions, 0)

  return (
    <div className="min-h-screen bg-[#1c1c24] text-white px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/agency"
              className="text-xs text-[#8888a0] hover:text-white transition mb-3 inline-flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Creator Cards</h1>
            <p className="text-sm text-[#8888a0] mt-1">Shareable cards with VPS scores and AI chat agents</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: '#f04a4d' }}
          >
            + Create Card
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Cards', value: cards.length },
            { label: 'Card Views', value: totalViews },
            { label: 'Agent Sessions', value: totalSessions },
            { label: 'Leads Captured', value: totalLeads },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: '#1c1c24', boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)' }}>
              <p className="text-2xl font-bold tabular-nums">{s.value.toLocaleString()}</p>
              <p className="text-xs text-[#8888a0] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Create card form */}
        {showForm && (
          <form onSubmit={createCard} className="rounded-xl p-6 mb-8" style={{ background: '#1c1c24', boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)' }}>
            <h3 className="text-sm font-semibold mb-4">New Creator Card</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                placeholder="Creator name *"
                required
                value={formData.creator_name}
                onChange={e => setFormData(p => ({ ...p, creator_name: e.target.value }))}
                className="px-4 py-3 rounded-lg bg-[#1c1c24] border-0 [box-shadow:inset_-3px_-3px_8px_rgba(255,255,255,0.04),inset_3px_3px_8px_rgba(0,0,0,0.6)] text-white text-sm outline-none focus:ring-1 focus:ring-[#f04a4d]/30"
              />
              <input
                placeholder="Handle (e.g. @priyacooks)"
                value={formData.creator_handle}
                onChange={e => setFormData(p => ({ ...p, creator_handle: e.target.value }))}
                className="px-4 py-3 rounded-lg bg-[#1c1c24] border-0 [box-shadow:inset_-3px_-3px_8px_rgba(255,255,255,0.04),inset_3px_3px_8px_rgba(0,0,0,0.6)] text-white text-sm outline-none focus:ring-1 focus:ring-[#f04a4d]/30"
              />
              <input
                placeholder="Niche (e.g. cooking) *"
                required
                value={formData.creator_niche}
                onChange={e => setFormData(p => ({ ...p, creator_niche: e.target.value }))}
                className="px-4 py-3 rounded-lg bg-[#1c1c24] border-0 [box-shadow:inset_-3px_-3px_8px_rgba(255,255,255,0.04),inset_3px_3px_8px_rgba(0,0,0,0.6)] text-white text-sm outline-none focus:ring-1 focus:ring-[#f04a4d]/30"
              />
              <input
                placeholder="VPS score (e.g. 78.5)"
                type="number"
                step="0.1"
                value={formData.vps_score}
                onChange={e => setFormData(p => ({ ...p, vps_score: e.target.value }))}
                className="px-4 py-3 rounded-lg bg-[#1c1c24] border-0 [box-shadow:inset_-3px_-3px_8px_rgba(255,255,255,0.04),inset_3px_3px_8px_rgba(0,0,0,0.6)] text-white text-sm outline-none focus:ring-1 focus:ring-[#f04a4d]/30"
              />
              <input
                placeholder="Follower count"
                type="number"
                value={formData.follower_count}
                onChange={e => setFormData(p => ({ ...p, follower_count: e.target.value }))}
                className="px-4 py-3 rounded-lg bg-[#1c1c24] border-0 [box-shadow:inset_-3px_-3px_8px_rgba(255,255,255,0.04),inset_3px_3px_8px_rgba(0,0,0,0.6)] text-white text-sm outline-none focus:ring-1 focus:ring-[#f04a4d]/30"
              />
              <select
                value={formData.trend_direction}
                onChange={e => setFormData(p => ({ ...p, trend_direction: e.target.value }))}
                className="px-4 py-3 rounded-lg bg-[#1c1c24] border-0 [box-shadow:inset_-3px_-3px_8px_rgba(255,255,255,0.04),inset_3px_3px_8px_rgba(0,0,0,0.6)] text-white text-sm outline-none focus:ring-1 focus:ring-[#f04a4d]/30"
              >
                <option value="">Trend direction</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="stable">Stable</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#f04a4d' }}
              >
                {creating ? 'Creating...' : 'Create Card'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg text-sm text-[#8888a0] hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Cards table */}
        {cards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#8888a0] text-sm">No cards yet. Create your first card to start sharing.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#8888a0] text-xs uppercase tracking-wider" style={{ background: '#1c1c24' }}>
                    <th className="px-4 py-3">Creator</th>
                    <th className="px-4 py-3">Niche</th>
                    <th className="px-4 py-3 text-right">VPS</th>
                    <th className="px-4 py-3 text-right">Views</th>
                    <th className="px-4 py-3 text-right">Sessions</th>
                    <th className="px-4 py-3 text-right">Leads</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr
                      key={card.id}
                      className="border-t transition hover:bg-[#1c1c24]"
                      style={{ borderColor: '#2a2a35', borderWidth: 0 }}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-white">{card.creator_name}</p>
                          {card.creator_handle && (
                            <p className="text-xs text-[#8888a0]">{card.creator_handle}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(163,116,52,0.12)', color: '#f04a4d' }}>
                          {card.creator_niche}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {card.vps_score != null ? Math.round(card.vps_score) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#8888a0]">{card.total_views}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#8888a0]">{card.total_agent_sessions}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#8888a0]">{card.total_leads}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(card.id, card.is_active)}
                          className="text-xs px-2 py-1 rounded-full transition"
                          style={{
                            background: card.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: card.is_active ? '#10b981' : '#ef4444',
                          }}
                        >
                          {card.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyLink(card.share_id)}
                            className="text-xs px-3 py-1.5 rounded-lg transition text-[#8888a0] hover:text-white"
                            style={{ boxShadow: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)' }}
                            title="Copy share link"
                          >
                            {copied === card.share_id ? 'Copied!' : 'Share'}
                          </button>
                          <a
                            href={`/t/${card.share_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg transition text-[#8888a0] hover:text-white"
                            style={{ boxShadow: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)' }}
                          >
                            Preview
                          </a>
                          <button
                            onClick={() => { setEditingPrompt(card.id); setPromptValue(card.agent_system_prompt || '') }}
                            className="text-xs px-3 py-1.5 rounded-lg transition text-[#8888a0] hover:text-white"
                            style={{ boxShadow: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)' }}
                            title="Edit agent prompt"
                          >
                            Prompt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prompt editor modal */}
        {editingPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-xl p-6" style={{ background: '#1c1c24', boxShadow: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)' }}>
              <h3 className="text-sm font-semibold mb-3">Edit Agent System Prompt</h3>
              <p className="text-xs text-[#8888a0] mb-4">
                Custom instructions for this card&apos;s AI agent. Leave empty for niche defaults.
              </p>
              <textarea
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-lg bg-[#1c1c24] border-0 [box-shadow:inset_-3px_-3px_8px_rgba(255,255,255,0.04),inset_3px_3px_8px_rgba(0,0,0,0.6)] text-white text-sm outline-none focus:ring-1 focus:ring-[#f04a4d]/30 resize-none"
                placeholder="e.g. Always recommend our agency's services when discussing growth strategies..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => savePrompt(editingPrompt)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#f04a4d' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingPrompt(null)}
                  className="px-5 py-2.5 rounded-lg text-sm text-[#8888a0] hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

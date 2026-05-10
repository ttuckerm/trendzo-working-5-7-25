'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, XCircle, Clock, Eye, TrendingUp,
  Filter, Zap, Globe, Tag, Calendar, Shield,
} from 'lucide-react'
export const dynamic = 'force-dynamic';

interface CulturalEvent {
  id: number
  niche: string
  event_title: string
  event_summary: string
  taxonomy_classification: {
    who?: string; what?: string; where?: string
    when?: string; why?: string; how?: string
  }
  velocity_score: number
  confidence: number
  decay_rate_estimate: number
  activated_niches: string[]
  source_trend_ids: number[]
  keywords: string[]
  status: 'detected' | 'approved' | 'rejected' | 'expired'
  auto_approved: boolean
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  expires_at: string | null
}

interface Counts {
  detected: number; approved: number; rejected: number; expired: number; total: number
}

export default function CulturalEventsReview() {
  const [events, setEvents] = useState<CulturalEvent[]>([])
  const [counts, setCounts] = useState<Counts>({ detected: 0, approved: 0, rejected: 0, expired: 0, total: 0 })
  const [filter, setFilter] = useState<string>('all')
  const [nicheFilter, setNicheFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    if (nicheFilter) params.set('niche', nicheFilter)
    try {
      const res = await fetch(`/api/admin/cultural-events?${params}`)
      const data = await res.json()
      setEvents(data.events || [])
      setCounts(data.counts || { detected: 0, approved: 0, rejected: 0, expired: 0, total: 0 })
    } catch {
      console.error('Failed to load events')
    }
    setLoading(false)
  }, [filter, nicheFilter])

  useEffect(() => { loadEvents() }, [loadEvents])

  const handleAction = async (id: number, status: 'approved' | 'rejected' | 'expired') => {
    setActionLoading(id)
    try {
      await fetch('/api/admin/cultural-events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, reviewed_by: 'chairman' }),
      })
      await loadEvents()
    } catch {
      console.error('Action failed')
    }
    setActionLoading(null)
  }

  const velocityColor = (v: number) => {
    if (v >= 0.8) return 'text-red-600 bg-red-50'
    if (v >= 0.6) return 'text-orange-600 bg-orange-50'
    if (v >= 0.4) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case 'detected': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-500'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const decayLabel = (d: number) => {
    if (d <= 0.1) return 'Evergreen'
    if (d <= 0.3) return 'Weeks'
    if (d <= 0.5) return 'Days'
    if (d <= 0.8) return 'Hours'
    return 'Expiring'
  }

  const niches = [...new Set(events.map(e => e.niche))].sort()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cultural Events Review</h1>
          <p className="text-gray-500 mt-1">Atlas Subsystem 4 — Approve, reject, or edit detected cultural events</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
            <div className="text-sm text-gray-500">Total Events</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-700">{counts.detected}</div>
            <div className="text-sm text-blue-600">Needs Review</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-700">{counts.approved}</div>
            <div className="text-sm text-green-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-700">{counts.rejected}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-500">{counts.expired}</div>
            <div className="text-sm text-gray-400">Expired</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {['all', 'detected', 'approved', 'rejected', 'expired'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {niches.length > 0 && (
            <select
              value={nicheFilter}
              onChange={e => setNicheFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white"
            >
              <option value="">All Niches</option>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No events found. Run the classification pipeline first.</div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div
                key={event.id}
                className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${
                  event.status === 'detected' ? 'border-blue-200' : 'border-gray-200'
                }`}
              >
                {/* Main Row */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(event.status)}`}>
                          {event.status}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                          {event.niche}
                        </span>
                        {event.auto_approved && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Auto
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${velocityColor(event.velocity_score)}`}>
                          <Zap className="w-3 h-3 inline mr-0.5" />
                          {(event.velocity_score * 100).toFixed(0)}% velocity
                        </span>
                        <span className="text-xs text-gray-400">
                          {decayLabel(event.decay_rate_estimate)} lifespan
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-900 text-lg">{event.event_title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{event.event_summary}</p>

                      {/* Keywords */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(event.keywords || []).slice(0, 8).map(k => (
                          <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {k}
                          </span>
                        ))}
                      </div>

                      {/* Activated Niches */}
                      {(event.activated_niches || []).length > 1 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            Also activates: {event.activated_niches.filter(n => n !== event.niche).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="View taxonomy"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {event.status === 'detected' && (
                        <>
                          <button
                            onClick={() => handleAction(event.id, 'approved')}
                            disabled={actionLoading === event.id}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(event.id, 'rejected')}
                            disabled={actionLoading === event.id}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {event.status === 'approved' && (
                        <button
                          onClick={() => handleAction(event.id, 'expired')}
                          disabled={actionLoading === event.id}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Clock className="w-4 h-4" />
                          Expire
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Taxonomy Detail */}
                {expandedId === event.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(['who', 'what', 'where', 'when', 'why', 'how'] as const).map(key => (
                        <div key={key}>
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{key}</div>
                          <div className="text-sm text-gray-700">
                            {event.taxonomy_classification?.[key] || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Confidence:</span>{' '}
                        <span className="font-medium">{(event.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Decay Rate:</span>{' '}
                        <span className="font-medium">{event.decay_rate_estimate.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expires:</span>{' '}
                        <span className="font-medium">
                          {event.expires_at
                            ? new Date(event.expires_at).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                    </div>
                    {event.reviewed_at && (
                      <div className="mt-2 text-xs text-gray-400">
                        Reviewed by {event.reviewed_by || 'unknown'} on {new Date(event.reviewed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

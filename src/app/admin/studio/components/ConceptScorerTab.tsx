'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { NICHE_REGISTRY } from '@/lib/prediction/system-registry'

// ============================================================================
// Types
// ============================================================================

interface QualityGateResponse {
  score: number
  hookRetention: number
  deliveryBaseline: number
  contentStructure: number
  productionFloor: number
  gateClassification: 'pass' | 'borderline' | 'fail'
}

interface DistributionPotentialResponse {
  score: number
  nicheSaturation: number
  trendAlignment: number
  shareProbability: number
  creatorMomentum: number
  audienceFit: number
}

interface ConceptScoreResponse {
  success: boolean
  concept_score_id: string | null
  concept_vps: number
  confidence_range: [number, number]
  diagnosis: {
    primary_limiting_factor: string
    suggestion: string
    projected_improvement: number
    strengths: string[]
    weaknesses: string[]
  }
  suggested_adjustments: Array<{
    adjustment_text: string
    projected_vps_delta: number
    rationale: string
  }>
  matched_pattern: {
    pattern_id: string
    pattern_name: string
    narrative_arc: string
  } | null
  pattern_saturation: {
    saturation_pct: number
    trend_direction: string
    lifecycle_stage: string
    opportunity_score: number
  } | null
  creator_fit: {
    hookStyleMatch: number
    toneMatch: number
    formatMatch: number
    nicheMatch: number
    overallFit: number
  } | null
  quality_gate: QualityGateResponse | null
  distribution_potential: DistributionPotentialResponse | null
  personalization: {
    active: boolean
    creatorStage: string | null
    hasCalibration: boolean
    hasChannel: boolean
  }
  latency_ms: number
}

interface ExpandResponse {
  success: boolean
  script: {
    hook: { section: string; timing: string; content: string }
    context: { section: string; timing: string; content: string }
    value: { section: string; timing: string; content: string }
    cta: { section: string; timing: string; content: string }
    fullScript: string
  }
  prediction: {
    run_id: string
    vps: number
    confidence: number
    tier: string
    components_used: string[]
  }
  brief_id: string | null
  latency_ms: number
}

interface HistoryItem {
  id: string
  concept_text: string
  niche_key: string
  concept_vps: number
  confidence_low: number
  confidence_high: number
  expanded_to_script: boolean
  created_at: string
}

// ============================================================================
// Component
// ============================================================================

export function ConceptScorerTab() {
  // Input state
  const [conceptText, setConceptText] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('')
  const [isScoring, setIsScoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Result state
  const [scoreResult, setScoreResult] = useState<ConceptScoreResponse | null>(null)

  // Expand state
  const [isExpanding, setIsExpanding] = useState(false)
  const [expandResult, setExpandResult] = useState<ExpandResponse | null>(null)

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load history on mount
  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/creator/concept-score')
      if (res.ok) {
        const data = await res.json()
        if (data.success) setHistory(data.history || [])
      }
    } catch {
      // Silent fail for history
    }
  }, [])

  const handleScore = async () => {
    if (!conceptText.trim() || conceptText.trim().length < 10) {
      setError('Please describe your concept in at least 10 characters')
      return
    }
    if (!selectedNiche) {
      setError('Please select a niche')
      return
    }

    setError(null)
    setIsScoring(true)
    setScoreResult(null)
    setExpandResult(null)

    try {
      const res = await fetch('/api/creator/concept-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_text: conceptText.trim(),
          niche: selectedNiche,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Scoring failed')
        return
      }

      setScoreResult(data)
      fetchHistory() // Refresh history
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsScoring(false)
    }
  }

  const handleExpand = async () => {
    if (!scoreResult?.concept_score_id) return

    setIsExpanding(true)
    setError(null)

    try {
      const res = await fetch('/api/creator/concept-score/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept_score_id: scoreResult.concept_score_id }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Script expansion failed')
        return
      }

      setExpandResult(data)
      fetchHistory()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsExpanding(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setConceptText(item.concept_text)
    setSelectedNiche(item.niche_key)
    setShowHistory(false)
    setScoreResult(null)
    setExpandResult(null)
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingTop: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #ff9500, #ff6b00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Concept Scorer</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Score video concepts before filming — wider range, less certainty</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 14px',
                color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer',
              }}
            >
              History ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 16, marginBottom: 24,
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>Recent Concepts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {history.map(item => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, padding: '10px 14px',
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>
                    {item.concept_text.length > 80 ? item.concept_text.substring(0, 80) + '...' : item.concept_text}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {item.niche_key} &middot; {new Date(item.created_at).toLocaleDateString()}
                    {item.expanded_to_script && ' \u2022 Expanded'}
                  </div>
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: item.concept_vps >= 70 ? '#00e96a' : item.concept_vps >= 50 ? '#f59e0b' : '#ef4444',
                }}>
                  {item.concept_vps?.toFixed(0) || '--'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 24, marginBottom: 24,
      }}>
        <textarea
          value={conceptText}
          onChange={e => setConceptText(e.target.value)}
          placeholder="Describe your video concept in 1-3 sentences...&#10;&#10;Example: &quot;Showing the 3 side hustles that replaced my 9-5 income in 6 months, starting from zero with no audience&quot;"
          style={{
            width: '100%', minHeight: 100, maxHeight: 200,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: 14,
            color: '#fff', fontSize: 14, lineHeight: 1.5,
            resize: 'vertical', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
          <select
            value={selectedNiche}
            onChange={e => setSelectedNiche(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 12px',
              color: selectedNiche ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 13,
            }}
          >
            <option value="">Select niche...</option>
            {NICHE_REGISTRY.map(n => (
              <option key={n.key} value={n.key}>{n.label}</option>
            ))}
          </select>
          <button
            onClick={handleScore}
            disabled={isScoring || !conceptText.trim() || !selectedNiche}
            style={{
              background: isScoring
                ? 'rgba(255,149,0,0.3)'
                : 'linear-gradient(135deg, #ff9500, #ff6b00)',
              border: 'none', borderRadius: 10,
              padding: '10px 24px',
              color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: isScoring ? 'wait' : 'pointer',
              opacity: (!conceptText.trim() || !selectedNiche) ? 0.4 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {isScoring ? 'Scoring...' : 'Score Concept'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'right' }}>
          {conceptText.length}/500
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 24,
          color: '#ef4444', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Score Results */}
      {scoreResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* VPS Score Card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* VPS Gauge */}
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div style={{
                  fontSize: 42, fontWeight: 800,
                  color: scoreResult.concept_vps >= 70 ? '#00e96a' : scoreResult.concept_vps >= 50 ? '#f59e0b' : '#ef4444',
                  lineHeight: 1,
                }}>
                  {scoreResult.concept_vps.toFixed(0)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  Concept VPS
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 600, marginTop: 4,
                  color: 'rgba(255,255,255,0.7)',
                }}>
                  {scoreResult.confidence_range[0].toFixed(0)}&ndash;{scoreResult.confidence_range[1].toFixed(0)} range
                </div>
              </div>

              {/* VPS Range Bar */}
              <div style={{ flex: 1 }}>
                <div style={{
                  height: 8, borderRadius: 4,
                  background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #00e96a 80%, #00e96a 100%)',
                  position: 'relative', marginBottom: 16,
                }}>
                  {/* Range indicator */}
                  <div style={{
                    position: 'absolute',
                    left: `${scoreResult.confidence_range[0]}%`,
                    width: `${scoreResult.confidence_range[1] - scoreResult.confidence_range[0]}%`,
                    top: -3, height: 14,
                    borderRadius: 7,
                    border: '2px solid #fff',
                    background: 'rgba(255,255,255,0.15)',
                  }} />
                  {/* VPS marker */}
                  <div style={{
                    position: 'absolute',
                    left: `${scoreResult.concept_vps}%`,
                    top: -6, width: 4, height: 20,
                    borderRadius: 2,
                    background: '#fff',
                    transform: 'translateX(-50%)',
                  }} />
                </div>

                {/* Pattern + Saturation */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {scoreResult.matched_pattern && (
                    <div style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 8, padding: '6px 12px',
                      fontSize: 12, color: 'rgba(255,255,255,0.7)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Pattern:</span>
                      <span style={{ fontWeight: 600 }}>{scoreResult.matched_pattern.pattern_name}</span>
                    </div>
                  )}
                  {scoreResult.pattern_saturation && (
                    <div style={{
                      background: lifecycleBg(scoreResult.pattern_saturation.lifecycle_stage),
                      borderRadius: 8, padding: '6px 12px',
                      fontSize: 12, fontWeight: 600,
                      color: lifecycleColor(scoreResult.pattern_saturation.lifecycle_stage),
                    }}>
                      {scoreResult.pattern_saturation.lifecycle_stage}
                      <span style={{ fontWeight: 400, marginLeft: 6, opacity: 0.7 }}>
                        ({scoreResult.pattern_saturation.saturation_pct.toFixed(0)}% sat.)
                      </span>
                    </div>
                  )}
                </div>

                {/* Personalization badge */}
                {scoreResult.personalization.active && (
                  <div style={{
                    fontSize: 11, color: 'rgba(255,149,0,0.7)', marginTop: 8,
                  }}>
                    Personalized for {scoreResult.personalization.creatorStage} creator
                    {scoreResult.personalization.hasChannel && ' (verified channel)'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Diagnosis Card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 20,
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: '0 0 12px' }}>
              Diagnosis
            </h4>
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 10, padding: 14, marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>
                Limiting Factor
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {scoreResult.diagnosis.primary_limiting_factor}
              </div>
            </div>
            <div style={{
              background: 'rgba(0,233,106,0.06)',
              border: '1px solid rgba(0,233,106,0.15)',
              borderRadius: 10, padding: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#00e96a', marginBottom: 4 }}>
                Suggestion (+{scoreResult.diagnosis.projected_improvement} VPS)
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                {scoreResult.diagnosis.suggestion}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#00e96a', marginBottom: 6 }}>Strengths</div>
                {scoreResult.diagnosis.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#00e96a' }}>+</span>
                    {s}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Weaknesses</div>
                {scoreResult.diagnosis.weaknesses.map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#ef4444' }}>-</span>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Adjustments */}
          {scoreResult.suggested_adjustments.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {scoreResult.suggested_adjustments.map((adj, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: 18,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                      Adjustment {i + 1}
                    </span>
                    <span style={{
                      background: 'rgba(0,233,106,0.12)',
                      color: '#00e96a', fontSize: 12, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 12,
                    }}>
                      +{adj.projected_vps_delta} VPS
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#fff', marginBottom: 8 }}>
                    {adj.adjustment_text}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {adj.rationale}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Creator Fit */}
          {scoreResult.creator_fit && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: 20,
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: '0 0 14px' }}>
                Creator Fit
                <span style={{
                  marginLeft: 10, fontSize: 16, fontWeight: 700,
                  color: scoreResult.creator_fit.overallFit >= 0.7 ? '#00e96a' : scoreResult.creator_fit.overallFit >= 0.5 ? '#f59e0b' : '#ef4444',
                }}>
                  {(scoreResult.creator_fit.overallFit * 100).toFixed(0)}%
                </span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Hook Style', value: scoreResult.creator_fit.hookStyleMatch },
                  { label: 'Tone Match', value: scoreResult.creator_fit.toneMatch },
                  { label: 'Format', value: scoreResult.creator_fit.formatMatch },
                  { label: 'Niche', value: scoreResult.creator_fit.nicheMatch },
                ].map(dim => (
                  <div key={dim.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{dim.label}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                        {(dim.value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${dim.value * 100}%`,
                        background: dim.value >= 0.7 ? '#00e96a' : dim.value >= 0.5 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-Mode Scores */}
          {(scoreResult.quality_gate || scoreResult.distribution_potential) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Mode 1: Quality Gate */}
              {scoreResult.quality_gate && (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${scoreResult.quality_gate.gateClassification === 'pass' ? 'rgba(0,233,106,0.2)' : scoreResult.quality_gate.gateClassification === 'borderline' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: scoreResult.quality_gate.gateClassification === 'pass' ? '#00e96a' : scoreResult.quality_gate.gateClassification === 'borderline' ? '#f59e0b' : '#ef4444',
                    }} />
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                      Quality Gate — {scoreResult.quality_gate.gateClassification.toUpperCase()}
                    </h4>
                    <span style={{
                      marginLeft: 'auto', fontSize: 18, fontWeight: 700,
                      color: scoreResult.quality_gate.gateClassification === 'pass' ? '#00e96a' : scoreResult.quality_gate.gateClassification === 'borderline' ? '#f59e0b' : '#ef4444',
                    }}>
                      {scoreResult.quality_gate.score.toFixed(0)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                    Will this pass TikTok&apos;s batch test?
                  </div>
                  {[
                    { label: 'Hook Retention', value: scoreResult.quality_gate.hookRetention },
                    { label: 'Delivery', value: scoreResult.quality_gate.deliveryBaseline },
                    { label: 'Content Structure', value: scoreResult.quality_gate.contentStructure },
                    { label: 'Production Floor', value: scoreResult.quality_gate.productionFloor },
                  ].map(dim => (
                    <div key={dim.label} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{dim.label}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{dim.value.toFixed(0)}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${dim.value}%`,
                          background: dim.value >= 70 ? '#00e96a' : dim.value >= 50 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 2: Distribution Potential */}
              {scoreResult.distribution_potential && (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#6366f1',
                    }} />
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                      Distribution Potential
                    </h4>
                    <span style={{
                      marginLeft: 'auto', fontSize: 18, fontWeight: 700,
                      color: scoreResult.distribution_potential.score >= 70 ? '#00e96a' : scoreResult.distribution_potential.score >= 50 ? '#f59e0b' : '#ef4444',
                    }}>
                      {scoreResult.distribution_potential.score.toFixed(0)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                    How far will it travel?
                  </div>
                  {[
                    { label: 'Niche Openness', value: scoreResult.distribution_potential.nicheSaturation },
                    { label: 'Trend Alignment', value: scoreResult.distribution_potential.trendAlignment },
                    { label: 'Share Probability', value: scoreResult.distribution_potential.shareProbability },
                    { label: 'Creator Momentum', value: scoreResult.distribution_potential.creatorMomentum },
                    { label: 'Audience Fit', value: scoreResult.distribution_potential.audienceFit },
                  ].map(dim => (
                    <div key={dim.label} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{dim.label}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{dim.value.toFixed(0)}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${dim.value}%`,
                          background: dim.value >= 70 ? '#00e96a' : dim.value >= 50 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expand to Full Script Button */}
          {!expandResult && (
            <button
              onClick={handleExpand}
              disabled={isExpanding || !scoreResult.concept_score_id}
              style={{
                width: '100%',
                background: isExpanding
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 14,
                padding: '16px 24px',
                color: '#fff', fontWeight: 700, fontSize: 15,
                cursor: isExpanding ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {isExpanding ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  </span>
                  Generating Script &amp; Running Full Pipeline...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Expand to Full Script (Tighter VPS)
                </>
              )}
            </button>
          )}

          {/* Expand Result */}
          {expandResult && (
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 16, padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                  Full Pipeline Result
                </h4>
                <div style={{
                  fontSize: 28, fontWeight: 800,
                  color: expandResult.prediction.vps >= 70 ? '#00e96a' : expandResult.prediction.vps >= 50 ? '#f59e0b' : '#ef4444',
                }}>
                  {expandResult.prediction.vps?.toFixed(1)} VPS
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '4px 12px',
                  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                }}>
                  {expandResult.prediction.tier}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                  {expandResult.prediction.components_used?.length || 0} components &middot; {(expandResult.latency_ms / 1000).toFixed(1)}s
                </div>
              </div>

              {/* Generated Script */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12, padding: 18, marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                  Generated Script
                </div>
                {['hook', 'context', 'value', 'cta'].map(section => {
                  const s = expandResult.script[section as keyof typeof expandResult.script]
                  if (!s || typeof s === 'string') return null
                  return (
                    <div key={section} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          background: sectionColor(section),
                          color: '#fff', padding: '2px 8px', borderRadius: 4,
                        }}>
                          {s.section}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.timing}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                        {s.content}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Comparison */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12,
                alignItems: 'center',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Concept Score</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                    {scoreResult.concept_vps.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {scoreResult.confidence_range[0].toFixed(0)}&ndash;{scoreResult.confidence_range[1].toFixed(0)} range
                  </div>
                </div>
                <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }}>&rarr;</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Full Pipeline</div>
                  <div style={{
                    fontSize: 22, fontWeight: 700,
                    color: expandResult.prediction.vps >= 70 ? '#00e96a' : expandResult.prediction.vps >= 50 ? '#f59e0b' : '#ef4444',
                  }}>
                    {expandResult.prediction.vps?.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    Confidence: {((expandResult.prediction.confidence || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Latency */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
            Scored in {(scoreResult.latency_ms / 1000).toFixed(1)}s
          </div>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function lifecycleColor(stage: string): string {
  switch (stage) {
    case 'first-mover': return '#00e96a'
    case 'ascending': return '#00b4d8'
    case 'stable': return '#f59e0b'
    case 'declining': return '#ef4444'
    default: return 'rgba(255,255,255,0.5)'
  }
}

function lifecycleBg(stage: string): string {
  switch (stage) {
    case 'first-mover': return 'rgba(0,233,106,0.12)'
    case 'ascending': return 'rgba(0,180,216,0.12)'
    case 'stable': return 'rgba(245,158,11,0.12)'
    case 'declining': return 'rgba(239,68,68,0.12)'
    default: return 'rgba(255,255,255,0.06)'
  }
}

function sectionColor(section: string): string {
  switch (section) {
    case 'hook': return '#ef4444'
    case 'context': return '#f59e0b'
    case 'value': return '#00b4d8'
    case 'cta': return '#8b5cf6'
    default: return '#666'
  }
}

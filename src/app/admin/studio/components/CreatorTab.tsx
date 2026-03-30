'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useWorkflowPersistenceLocal } from '@/lib/hooks/useWorkflowPersistenceLocal'
import { WorkflowPickerLocal } from '@/components/workflow/WorkflowPickerLocal'
import { SaveIndicator } from '@/components/workflow'
import type { WorkflowRun } from '@/lib/types/workflow'
import { CreatorResearchPhase } from './CreatorResearchPhase'

const PHASE_TABS = [
  { id: 'research', label: 'Research', icon: <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-research" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00d2ff"/><stop offset="100%" stopColor="#0066ff"/></linearGradient></defs><circle cx="14" cy="14" r="7.5" stroke="url(#g-research)" strokeWidth="2.2"/><path d="M19.5 19.5L26 26" stroke="url(#g-research)" strokeWidth="2.5" strokeLinecap="round"/><path d="M11 14h6M14 11v6" stroke="url(#g-research)" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'plan', label: 'Plan', icon: <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-plan" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs><rect x="5" y="4" width="22" height="24" rx="3" stroke="url(#g-plan)" strokeWidth="2"/><path d="M10 10h12M10 15h12M10 20h7" stroke="url(#g-plan)" strokeWidth="2" strokeLinecap="round"/><circle cx="22" cy="22" r="4.5" fill="#0d0d1a" stroke="url(#g-plan)" strokeWidth="1.8"/><path d="M20.5 22l1 1 2-2" stroke="url(#g-plan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'create', label: 'Create', icon: <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-create" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ff9500"/><stop offset="100%" stopColor="#ff2d55"/></linearGradient></defs><path d="M20 5l7 7-14 14H6v-7L20 5z" stroke="url(#g-create)" strokeWidth="2" strokeLinejoin="round"/><path d="M17 8l7 7" stroke="url(#g-create)" strokeWidth="2" strokeLinecap="round"/><path d="M6 25l3-3" stroke="url(#g-create)" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'optimize', label: 'Optimize', icon: <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-optimize" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00e96a"/><stop offset="100%" stopColor="#00b4d8"/></linearGradient></defs><path d="M16 5l2.5 7.5H26l-6.5 4.5 2.5 7.5L16 20l-6 4.5 2.5-7.5L6 12.5h7.5z" stroke="url(#g-optimize)" strokeWidth="2" strokeLinejoin="round"/></svg> },
  { id: 'publish', label: 'Publish', icon: <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-publish" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ff6b35"/><stop offset="100%" stopColor="#ff2d55"/></linearGradient></defs><path d="M16 26V6M16 6l-7 7M16 6l7 7" stroke="url(#g-publish)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 22v4h20v-4" stroke="url(#g-publish)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'engage', label: 'Engage & Learn', icon: <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-engage" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#ef4444"/></linearGradient></defs><path d="M6 20c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="url(#g-engage)" strokeWidth="2" strokeLinecap="round"/><path d="M6 20l-2 4h6l-1-4M26 20l2 4h-6l1-4" stroke="url(#g-engage)" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="16" cy="10" r="3" stroke="url(#g-engage)" strokeWidth="1.8"/></svg> }
];

export function CreatorTab() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [showWorkflowPicker, setShowWorkflowPicker] = useState(false);
  const [creatorDPS, setCreatorDPS] = useState(0);

  const handleWorkflowCreated = useCallback((wf: WorkflowRun) => {
    setSelectedWorkflowId(wf.id);
    setShowWorkflowPicker(false);
  }, []);

  const handleWorkflowError = useCallback((err: Error) => {
    console.error('Workflow persistence error:', err);
  }, []);

  const {
    currentPhase: creatorPhase,
    creatorData,
    saveStatus,
    setCreatorData,
    setCurrentPhase: setCreatorPhase,
    advancePhase,
    goBackPhase,
    createWorkflow,
    completeWorkflow,
  } = useWorkflowPersistenceLocal({
    workflowId: selectedWorkflowId || undefined,
    debounceMs: 2000,
    onWorkflowCreated: handleWorkflowCreated,
    onError: handleWorkflowError,
  });

  useEffect(() => {
    if (!selectedWorkflowId && !showWorkflowPicker) {
      setShowWorkflowPicker(true);
    }
  }, [selectedWorkflowId, showWorkflowPicker]);

  return (
    <div className="cr-page">
      {/* Creator Header */}
      <div className="cr-header">
        <div className="cr-header-left">
          <div className="cr-header-icon"><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-vcc" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ff6b35"/><stop offset="50%" stopColor="#ff2d55"/><stop offset="100%" stopColor="#bf5af2"/></linearGradient></defs><path d="M16 28c0 0-1.5-2.5-2-6-3.5-.5-6-2-6-2s2.5 0 4.5-1.5C11 15 11 11 13 8c1.5-2 3-3 3-3s1.5 1 3 3c2 3 2 7 .5 10.5 2 1.5 4.5 1.5 4.5 1.5s-2.5 1.5-6 2c-.5 3.5-2 6-2 6z" stroke="url(#g-vcc)" strokeWidth="2" strokeLinejoin="round"/><circle cx="16" cy="14" r="2.5" fill="url(#g-vcc)"/><path d="M10 6l-2-2M22 6l2-2M16 4V2" stroke="url(#g-vcc)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/></svg></div>
          <div>
            <h2 className="cr-title">Viral Content Creator</h2>
            <p className="cr-subtitle">6-Phase workflow to create viral content with AI-powered predictions</p>
          </div>
        </div>
        <div className="cr-header-right">
          <button onClick={() => setShowWorkflowPicker(true)} className="cr-switch-btn">
            {selectedWorkflowId ? (<><span><svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-switch" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs><path d="M6 10h16M18 6l4 4-4 4" stroke="url(#g-switch)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M26 22H10M14 18l-4 4 4 4" stroke="url(#g-switch)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span>Switch Workflow</span></>) : (<><span><svg width="16" height="16" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-switch" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs><path d="M6 10h16M18 6l4 4-4 4" stroke="url(#g-switch)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M26 22H10M14 18l-4 4 4 4" stroke="url(#g-switch)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span>Select Workflow</span></>)}
          </button>
          <SaveIndicator status={saveStatus} />
          <div className="cr-dps-widget">
            <div className="cr-dps-ring" />
            <div className="cr-dps-inner">
              <div className={`cr-dps-value ${creatorDPS >= 70 ? 'cr-dps-value-green' : creatorDPS >= 50 ? 'cr-dps-value-amber' : 'cr-dps-value-red'}`}>
                {creatorDPS.toFixed(1)}
              </div>
              <div className="cr-dps-label">DPS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="cr-phase-bar">
        {PHASE_TABS.map((phase, index) => (
          <React.Fragment key={phase.id}>
            <button
              onClick={() => setCreatorPhase(phase.id as any)}
              className={`cr-phase-tab ${creatorPhase === phase.id ? 'cr-phase-tab-active' : ''}`}
            >
              <span>{phase.icon}</span>
              <span>{phase.label}</span>
            </button>
            {index < 5 && <span className="cr-phase-arrow">›</span>}
          </React.Fragment>
        ))}
      </div>

      {/* RESEARCH PHASE */}
      {creatorPhase === 'research' && (
        <CreatorResearchPhase
          creatorData={creatorData}
          setCreatorData={setCreatorData}
          onAdvance={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
        />
      )}

      {/* PLAN PHASE */}
      {creatorPhase === 'plan' && (
        <div className="cr-phase-content">
          <div className="cr-phase-header">
            <h3 className="cr-section-title">Content Planning</h3>
            <p className="cr-section-desc">Structure your content strategy with the Golden Pillars and 4x4 Method</p>
          </div>

          {/* Golden Pillars */}
          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>🏛️</span> Golden Pillars of Content</h4>
            <p className="cr-section-desc">These are the content pillars that historically do well on the internet. Select which type of content you&apos;re creating:</p>
            <div className="cr-pillar-grid">
              {[
                { id: 'education', label: 'Education', icon: '📚', desc: 'How-tos, tutorials, tips, resources', goal: 'Builds TRUST', color: '#00ff88' },
                { id: 'entertainment', label: 'Entertainment', icon: '🎭', desc: 'Trends, current events, humor, pranks', goal: 'Most SHARED', color: '#667eea' },
                { id: 'inspiration', label: 'Inspiration', icon: '💫', desc: 'Transformations, lifestyle, before/after', goal: 'ASPIRATIONAL', color: '#ffa726' },
                { id: 'validation', label: 'Validation', icon: '💬', desc: 'Your story, opinions, polarizing content', goal: 'Drives ENGAGEMENT', color: '#e50914' }
              ].map(pillar => (
                <button
                  key={pillar.id}
                  onClick={() => setCreatorData({...creatorData, goldenPillars: [pillar.id]})}
                  className={`cr-pillar-card ${creatorData.goldenPillars.includes(pillar.id) ? 'cr-pillar-card-active' : ''}`}
                >
                  <div className="cr-pillar-emoji">{pillar.icon}</div>
                  <div className="cr-pillar-label">{pillar.label}</div>
                  <div className="cr-pillar-desc">{pillar.desc}</div>
                  <div className="cr-pillar-goal" style={{ color: pillar.color }}>{pillar.goal}</div>
                </button>
              ))}
            </div>
          </div>

          {/* SEO Strategy */}
          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>#️⃣</span> TikTok SEO Strategy</h4>
            <p className="cr-section-desc">TikTok is a search engine. Put your core anchor keyword in the first sentence of everything you post.</p>
            <div className="cr-goals-grid">
              <div>
                <label className="cr-label">Core Anchor Keyword</label>
                <input type="text" placeholder="e.g., 'best content strategy'" className="cr-input" />
                <p className="cr-hint">This should appear in your first sentence, on-screen text, and description</p>
              </div>
              <div>
                <label className="cr-label">Related Search Terms</label>
                <input type="text" placeholder="e.g., 'how to get more views'" className="cr-input" />
                <p className="cr-hint">Use TikTok&apos;s search suggestions to find related terms</p>
              </div>
            </div>
          </div>

          {/* 4x4 Method */}
          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>🎬</span> The 4x4 Method</h4>
            <p className="cr-section-desc">A step-by-step framework for creating viral, engaging content. Fill in each section:</p>
            <div className="cr-4x4-grid">
              <div className="cr-4x4-col">
                <div className="cr-4x4-card cr-4x4-card-hook">
                  <div className="cr-4x4-header">
                    <span className="cr-4x4-number cr-4x4-number-hook">1</span>
                    <span className="cr-4x4-step-label cr-4x4-step-label-hook">HOOK (First 4 seconds)</span>
                  </div>
                  <p className="cr-4x4-desc">Attention grabbing, pain points, polarizing, curiosity-inducing</p>
                  <textarea placeholder="What will you say to grab attention in the first 4 seconds?" className="cr-4x4-textarea" />
                </div>
                <div className="cr-4x4-card cr-4x4-card-proof">
                  <div className="cr-4x4-header">
                    <span className="cr-4x4-number cr-4x4-number-proof">2</span>
                    <span className="cr-4x4-step-label cr-4x4-step-label-proof">PROOF (Next 4 seconds)</span>
                  </div>
                  <p className="cr-4x4-desc">Stats, studies, testimonials, social proof to lower their guard</p>
                  <textarea placeholder="What proof will you show to make them comfortable staying?" className="cr-4x4-textarea" />
                </div>
              </div>
              <div className="cr-4x4-col">
                <div className="cr-4x4-card cr-4x4-card-value">
                  <div className="cr-4x4-header">
                    <span className="cr-4x4-number cr-4x4-number-value">3</span>
                    <span className="cr-4x4-step-label cr-4x4-step-label-value">VALUE (The meat)</span>
                  </div>
                  <p className="cr-4x4-desc">How-tos, step-by-step, lists, the recipe - why they&apos;re here</p>
                  <textarea placeholder="What's the actual value/content you're delivering?" className="cr-4x4-textarea" />
                </div>
                <div className="cr-4x4-card cr-4x4-card-cta">
                  <div className="cr-4x4-header">
                    <span className="cr-4x4-number cr-4x4-number-cta">4</span>
                    <span className="cr-4x4-step-label cr-4x4-step-label-cta">CALL TO ACTION</span>
                  </div>
                  <p className="cr-4x4-desc">Based on your content purpose: Know &rarr; Follow | Like &rarr; Share | Trust &rarr; Link in bio</p>
                  <textarea placeholder="What do you want them to do after watching?" className="cr-4x4-textarea" />
                </div>
              </div>
            </div>
            <div className="cr-pro-tip">
              <div className="cr-pro-tip-label">💡 Pro Tip from Paul:</div>
              <p className="cr-pro-tip-text">{"\u201CUse list format (5 things, 3 tips) \u2014 they work like recipe videos. People have to watch the whole video to get to #1. Nobody wants to leave before seeing the most important tip.\u201D"}</p>
            </div>
          </div>

          <div className="cr-nav-row">
            <button onClick={() => goBackPhase()} className="cr-back-btn">&larr; Back to Research</button>
            <button
              onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
              className="cr-cta-btn cr-nav-cta"
            >
              Continue to Creation &rarr;
            </button>
          </div>
        </div>
      )}

      {/* CREATE PHASE */}
      {creatorPhase === 'create' && (
        <div className="cr-phase-content">
          <div className="cr-phase-header">
            <h3 className="cr-section-title">Content Creation Studio</h3>
            <p className="cr-section-desc">Record multiple videos with consistent quality and prepare them for publication</p>
          </div>

          <div className="cr-two-col">
            <div className="cr-section-card">
              <h4 className="cr-section-title"><span>🎥</span> Video Recording</h4>
              <div className="cr-recording-preview">
                <div>
                  <div className="cr-recording-preview-icon">📹</div>
                  <p className="cr-recording-preview-text">Click to start recording</p>
                </div>
              </div>
              <div className="cr-rec-controls">
                <button className="cr-rec-btn cr-rec-btn-record">🔴 Record</button>
                <button className="cr-rec-btn">⏸️ Pause</button>
                <button className="cr-rec-btn">⏹️ Stop</button>
              </div>
            </div>

            <div className="cr-section-card">
              <h4 className="cr-section-title"><span>📝</span> Video Details</h4>
              <div className="cr-field-stack">
                <div>
                  <label className="cr-label">Video Title</label>
                  <input type="text" placeholder="Enter video title..." className="cr-input" />
                </div>
                <div>
                  <label className="cr-label">Description</label>
                  <textarea placeholder="Video description..." className="cr-textarea cr-textarea-tall" />
                </div>
                <div>
                  <label className="cr-label">Duration Target</label>
                  <input type="text" placeholder="15-60 seconds" className="cr-input" />
                </div>
              </div>
            </div>
          </div>

          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>🖼️</span> Proof Assets</h4>
            <p className="cr-section-desc">Upload or link to assets that support your content claims</p>
            <div className="cr-asset-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="cr-asset-slot">
                  <div>
                    <div className="cr-asset-icon">➕</div>
                    <div className="cr-asset-label">Add Asset</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cr-nav-row">
            <button onClick={() => goBackPhase()} className="cr-back-btn">&larr; Back to Planning</button>
            <button
              onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 20)); }}
              className="cr-cta-btn cr-nav-cta"
            >
              Continue to Optimization &rarr;
            </button>
          </div>
        </div>
      )}

      {/* OPTIMIZE PHASE */}
      {creatorPhase === 'optimize' && (
        <div className="cr-phase-content">
          <div className="cr-phase-header">
            <h3 className="cr-section-title">Content Optimization</h3>
            <p className="cr-section-desc">Refine your content to maximize engagement and virality</p>
          </div>

          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>✅</span> Gate A Checks</h4>
            <div className="cr-check-grid">
              {[
                { label: 'Hook Effectiveness', desc: 'First 3 seconds grab attention' },
                { label: 'Proof Quality', desc: 'Evidence supports claims' },
                { label: 'CTA Alignment', desc: 'Clear call-to-action at end' }
              ].map((check, i) => (
                <div key={i} className="cr-check-item">
                  <div className="cr-check-header">
                    <div className="cr-check-box">✓</div>
                    <span className="cr-check-label">{check.label}</span>
                  </div>
                  <p className="cr-check-desc">{check.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>🤖</span> AI Recommendations</h4>
            <div className="cr-rec-list">
              {[
                'Add a pattern interrupt at 0:14 to maintain attention',
                'Your hook could be more specific about the benefit',
                'Consider adding text overlay to reinforce key points'
              ].map((rec, i) => (
                <div key={i} className="cr-rec-item">
                  <div className="cr-rec-icon">💡</div>
                  <p className="cr-rec-text">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="cr-nav-row">
            <button onClick={() => goBackPhase()} className="cr-back-btn">&larr; Back to Creation</button>
            <button
              onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
              className="cr-cta-btn cr-nav-cta"
            >
              Ready to Publish &rarr;
            </button>
          </div>
        </div>
      )}

      {/* PUBLISH PHASE */}
      {creatorPhase === 'publish' && (
        <div className="cr-phase-content">
          <div className="cr-phase-header">
            <h3 className="cr-section-title">Publish Your Video</h3>
            <p className="cr-section-desc">Complete the final steps to share your content with your audience</p>
          </div>

          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>📱</span> Platform Distribution</h4>
            <div className="cr-dist-grid">
              <button className="cr-dist-card cr-dist-card-active">
                <div className="cr-dist-emoji">🎵</div>
                <div className="cr-dist-name-active">TikTok</div>
                <div className="cr-dist-status">✓ Connected</div>
              </button>
              <button className="cr-dist-card cr-dist-card-disabled" disabled>
                <div className="cr-dist-emoji">📸</div>
                <div className="cr-dist-name-disabled">Instagram</div>
                <span className="cr-dist-soon">Coming Soon</span>
              </button>
              <button className="cr-dist-card cr-dist-card-disabled" disabled>
                <div className="cr-dist-emoji">▶️</div>
                <div className="cr-dist-name-disabled">YouTube</div>
                <span className="cr-dist-soon">Coming Soon</span>
              </button>
              <button className="cr-dist-card cr-dist-card-disabled" disabled>
                <div className="cr-dist-emoji">💼</div>
                <div className="cr-dist-name-disabled">LinkedIn</div>
                <span className="cr-dist-soon">Coming Soon</span>
              </button>
            </div>
          </div>

          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>📅</span> Publishing Schedule</h4>
            <div className="cr-goals-grid">
              <div>
                <label className="cr-label">Publish Date</label>
                <input type="date" className="cr-input" />
              </div>
              <div>
                <label className="cr-label">Optimal Time (AI Suggested)</label>
                <input type="time" defaultValue="15:00" className="cr-input" />
              </div>
            </div>
          </div>

          <div className="cr-nav-row">
            <button onClick={() => goBackPhase()} className="cr-back-btn">&larr; Back to Optimization</button>
            <button
              onClick={async () => { await advancePhase(); setCreatorDPS(prev => Math.min(100, prev + 15)); }}
              className="cr-cta-btn cr-cta-publish cr-nav-cta"
            >
              Publish Now
            </button>
          </div>
        </div>
      )}

      {/* ENGAGE & LEARN PHASE */}
      {creatorPhase === 'engage' && (
        <div className="cr-phase-content">
          <div className="cr-phase-header">
            <h3 className="cr-section-title">Engage &amp; Learn</h3>
            <p className="cr-section-desc">Monitor content performance and gather insights to improve future content</p>
          </div>

          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>📊</span> Performance Metrics</h4>
            <div className="cr-metric-grid">
              {[
                { label: 'Views', value: '12.4K', change: '+24%', icon: '👁️' },
                { label: 'Engagement', value: '8.7%', change: '+12%', icon: '❤️' },
                { label: 'Watch Time', value: '45s', change: '+8%', icon: '⏱️' },
                { label: 'Shares', value: '234', change: '+31%', icon: '🔄' }
              ].map((metric, i) => (
                <div key={i} className="cr-metric-card">
                  <div className="cr-metric-emoji">{metric.icon}</div>
                  <div className="cr-metric-value">{metric.value}</div>
                  <div className="cr-metric-label">{metric.label}</div>
                  <div className="cr-metric-change">{metric.change}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="cr-section-card">
            <h4 className="cr-section-title"><span>💡</span> Content Improvement Recommendations</h4>
            <div className="cr-insight-grid">
              {[
                { title: 'Hook Optimization', desc: 'Your hook performs best with question format', score: '+18%' },
                { title: 'Optimal Length', desc: 'Videos at 45-60s get 23% more engagement', score: '+23%' },
                { title: 'Best Posting Time', desc: 'Tuesday 3PM shows highest reach', score: '+15%' }
              ].map((insight, i) => (
                <div key={i} className="cr-insight-card">
                  <div className="cr-insight-header">
                    <h5 className="cr-insight-title">{insight.title}</h5>
                    <span className="cr-insight-score">{insight.score}</span>
                  </div>
                  <p className="cr-insight-desc">{insight.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              completeWorkflow();
              setSelectedWorkflowId(null);
              setShowWorkflowPicker(true);
              setCreatorDPS(0);
            }}
            className="cr-cta-btn cr-cta-new"
          >
            Create New Content
          </button>
        </div>
      )}

      {/* Workflow Picker Modal */}
      <WorkflowPickerLocal
        isOpen={showWorkflowPicker}
        onClose={() => setShowWorkflowPicker(false)}
        onSelectWorkflow={(id) => {
          setSelectedWorkflowId(id);
          setShowWorkflowPicker(false);
        }}
        onCreateNew={async () => {
          await createWorkflow();
        }}
      />
    </div>
  );
}

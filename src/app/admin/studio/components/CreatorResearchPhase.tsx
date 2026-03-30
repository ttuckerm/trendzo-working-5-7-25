'use client'

import React from 'react'
import { TOP_20_NICHES } from '../constants'

interface CreatorResearchPhaseProps {
  creatorData: any;
  setCreatorData: (data: any) => void;
  onAdvance: () => void;
}

export function CreatorResearchPhase({ creatorData, setCreatorData, onAdvance }: CreatorResearchPhaseProps) {
  return (
    <div className="cr-phase-content">
      <div className="cr-phase-header">
        <h3 className="cr-section-title">Research Phase</h3>
        <p className="cr-section-desc">Build your content foundation by understanding your audience and topic research</p>
      </div>

      {/* Define Your Niche */}
      <div className="cr-section-card">
        <h4 className="cr-section-title"><span><svg width="20" height="20" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-niche" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00d2ff"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs><circle cx="16" cy="16" r="11" stroke="url(#g-niche)" strokeWidth="2"/><circle cx="16" cy="16" r="6.5" stroke="url(#g-niche)" strokeWidth="1.5" opacity="0.6"/><circle cx="16" cy="16" r="2.5" fill="url(#g-niche)"/><path d="M16 5v3M16 24v3M5 16h3M24 16h3" stroke="url(#g-niche)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/></svg></span> Define Your Niche</h4>
        <select
          value={creatorData.niche}
          onChange={(e) => setCreatorData({...creatorData, niche: e.target.value})}
          className="cr-select"
        >
          <option value="">Select a category...</option>
          {TOP_20_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div>
          <h5 className="cr-audience-label">Target Audience Demographics</h5>
          <div className="cr-demo-grid">
            {['18-24 years', '25-34 years', '35-44 years', '45+ years'].map(age => (
              <button
                key={age}
                onClick={() => setCreatorData({...creatorData, targetAudience: {...creatorData.targetAudience, age}})}
                className={`cr-demo-btn ${creatorData.targetAudience.age === age ? 'cr-demo-btn-active' : ''}`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Purpose */}
      <div className="cr-section-card">
        <h4 className="cr-section-title"><span><svg width="20" height="20" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-purpose" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#f472b6"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs><path d="M16 4C9.37 4 4 9.37 4 16c0 3.13 1.2 5.98 3.16 8.1L5 27l3.5-1.5A11.93 11.93 0 0016 28c6.63 0 12-5.37 12-12S22.63 4 16 4z" stroke="url(#g-purpose)" strokeWidth="2" strokeLinejoin="round"/><path d="M11 14c.55-2 2.24-3.5 5-3.5s4.5 1.5 4.5 3.5c0 2.5-2 3.5-4.5 3.5" stroke="url(#g-purpose)" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="21" r="1.2" fill="url(#g-purpose)"/></svg></span> Content Purpose</h4>
        <p className="cr-section-desc">What do you want your audience to do? This affects your hook and CTA strategy.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
          {/* KNOW */}
          <div className="klt-parent" onClick={() => setCreatorData({...creatorData, contentGoals: {...creatorData.contentGoals, primary: 'know'}})}>
            <div className={`klt-card klt-card-know ${creatorData.contentGoals.primary === 'know' ? 'klt-card-selected' : ''}`}>
              <div className="klt-logo">
                <span className="klt-circle klt-c1"></span><span className="klt-circle klt-c2"></span><span className="klt-circle klt-c3"></span><span className="klt-circle klt-c4"></span>
                <span className="klt-circle klt-c5">
                  <svg width="16" height="16" viewBox="0 0 36 36" fill="none"><path d="M18 6a9 9 0 110 18A9 9 0 0118 6z" stroke="#7a4500" strokeWidth="2"/><path d="M18 15v5M18 13v-1" stroke="#7a4500" strokeWidth="2.2" strokeLinecap="round"/><path d="M13 24h10" stroke="#7a4500" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </span>
              </div>
              <div className="klt-glass"></div>
              <div className="klt-content">
                <span className="klt-label">KNOW</span>
                <span className="klt-sublabel">Get them to know you</span>
                <span className="klt-cta">CTA: &ldquo;Follow for more&rdquo;</span>
              </div>
            </div>
          </div>
          {/* LIKE */}
          <div className="klt-parent" onClick={() => setCreatorData({...creatorData, contentGoals: {...creatorData.contentGoals, primary: 'like'}})}>
            <div className={`klt-card klt-card-like ${creatorData.contentGoals.primary === 'like' ? 'klt-card-selected' : ''}`}>
              <div className="klt-logo">
                <span className="klt-circle klt-c1"></span><span className="klt-circle klt-c2"></span><span className="klt-circle klt-c3"></span><span className="klt-circle klt-c4"></span>
                <span className="klt-circle klt-c5">
                  <svg width="16" height="16" viewBox="0 0 36 36" fill="none"><path d="M18 30s-12-8-12-16a7 7 0 0112-4.9A7 7 0 0130 14c0 8-12 16-12 16z" stroke="#7a0020" strokeWidth="2.2" strokeLinejoin="round"/></svg>
                </span>
              </div>
              <div className="klt-glass"></div>
              <div className="klt-content">
                <span className="klt-label">LIKE</span>
                <span className="klt-sublabel">Build rapport & trust</span>
                <span className="klt-cta">CTA: &ldquo;Like & share&rdquo;</span>
              </div>
            </div>
          </div>
          {/* TRUST */}
          <div className="klt-parent" onClick={() => setCreatorData({...creatorData, contentGoals: {...creatorData.contentGoals, primary: 'trust'}})}>
            <div className={`klt-card klt-card-trust ${creatorData.contentGoals.primary === 'trust' ? 'klt-card-selected' : ''}`}>
              <div className="klt-logo">
                <span className="klt-circle klt-c1"></span><span className="klt-circle klt-c2"></span><span className="klt-circle klt-c3"></span><span className="klt-circle klt-c4"></span>
                <span className="klt-circle klt-c5">
                  <svg width="16" height="16" viewBox="0 0 36 36" fill="none"><path d="M18 4l12 5v8c0 7-5.5 11.5-12 13C11.5 28.5 6 24 6 17V9z" stroke="#00562e" strokeWidth="2.2" strokeLinejoin="round"/><path d="M13 18l3.5 3.5L23 14" stroke="#00562e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </div>
              <div className="klt-glass"></div>
              <div className="klt-content">
                <span className="klt-label">TRUST</span>
                <span className="klt-sublabel">Convert to customers</span>
                <span className="klt-cta">CTA: &ldquo;Link in bio&rdquo;</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goals & KPIs */}
      <div className="cr-section-card">
        <h4 className="cr-section-title"><span><svg width="20" height="20" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-goals" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#fbbf24"/></linearGradient></defs><path d="M16 4l3 8.5H28l-7.5 5.5 3 8.5-7.5-5.5-7.5 5.5 3-8.5L4 12.5h9z" stroke="url(#g-goals)" strokeWidth="2" strokeLinejoin="round"/></svg></span> Set Goals &amp; KPIs</h4>
        <div className="cr-goals-grid">
          <div>
            <label className="cr-label">Primary Content Goal</label>
            <select className="cr-select">
              <option>Select a goal...</option>
              <option>Brand Awareness</option>
              <option>Lead Generation</option>
              <option>Engagement</option>
              <option>Sales/Conversions</option>
            </select>
          </div>
          <div>
            <label className="cr-label">Target Views</label>
            <input type="number" placeholder="10,000" className="cr-input" />
          </div>
        </div>
      </div>

      {/* Exemplar Swoop */}
      <div className="cr-section-card">
        <h4 className="cr-section-title"><span><svg width="20" height="20" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="g-swoop" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00e96a"/><stop offset="100%" stopColor="#0066ff"/></linearGradient></defs><path d="M6 26c4-8 10-12 18-10" stroke="url(#g-swoop)" strokeWidth="2.2" strokeLinecap="round"/><path d="M20 12l4 4-4 4" stroke="url(#g-swoop)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="12" r="4" stroke="url(#g-swoop)" strokeWidth="1.8"/><path d="M13 9.5l2-2" stroke="url(#g-swoop)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg></span> Exemplar Swoop</h4>
        <p className="cr-section-desc">Find 25 accounts in your niche, track their viral videos, and reverse engineer what works</p>
        <div className="cr-platform-row">
          <button className="cr-platform-btn cr-platform-btn-active">🎵 TikTok</button>
          <button className="cr-platform-btn cr-platform-btn-disabled" disabled>
            ▶️ YouTube
            <span className="cr-platform-soon">Soon</span>
          </button>
          <button className="cr-platform-btn cr-platform-btn-disabled" disabled>
            📸 Instagram
            <span className="cr-platform-soon">Soon</span>
          </button>
        </div>
        <input
          type="text"
          placeholder="Search hashtags, keywords, or creators..."
          className="cr-search"
        />
        <div className="cr-pro-tip">
          <div className="cr-pro-tip-label">💡 Pro Tip from Paul:</div>
          <p className="cr-pro-tip-text">{"\u201CFind people with disproportional astronomical views compared to their peers. If someone has 200K views when others have 2K, they\u2019re doing something right. Study their hooks, their consistency, and their monetization.\u201D"}</p>
        </div>
      </div>

      <button
        onClick={onAdvance}
        className="cr-cta-btn"
      >
        Save Research &amp; Continue to Planning &rarr;
      </button>
    </div>
  );
}

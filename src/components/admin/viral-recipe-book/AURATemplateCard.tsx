"use client"

import React from 'react'
import styles from './AURATemplateCard.module.css'

export interface AURATemplate {
  id: string
  state: 'HOT' | 'COOLING' | 'NEW' | 'STABLE'
  title: string
  description: string
  views: string
  likes: string
  viralScore: string
  sr: number
  uses: number
  examples: number
  lastSeen: string
  platformName: string
  duration: string
  hookTime: string
  signals: string[]
  brandSafe: boolean
  antiGaming: boolean
  reliability: string
  sound: string
  gradient: string
  // Optional visual assets and platforms
  thumbnailUrl?: string
  videoUrl?: string
  platforms?: string[]
  credits?: { analyze: number; generate: number; validate: number }
  trendDelta7d?: number
  trendDelta30d?: number
}

export function AURATemplateCard({ data, onView, onCopy, onGenerate, openOnCardClick = true }: { data: AURATemplate; onView?: (id: string) => void; onCopy?: (id: string) => void; onGenerate?: (id: string) => void; openOnCardClick?: boolean }) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const audioUrl = (data as any).audioUrl || '/sounds/sample.mp3'
  const stateClass = data.state === 'HOT' ? styles.stateHot : data.state === 'COOLING' ? styles.stateCooling : styles.stateNew
  const srColor = data.sr >= 90 ? '#4ade80' : data.sr >= 80 ? '#fbbf24' : '#f87171'
  return (
    <article
      className={styles.templateCard}
      data-id={data.id}
      onClick={() => { if (openOnCardClick !== false) onView?.(data.id) }}
      role="button"
      tabIndex={0}
      onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView?.(data.id) } }}
      aria-label={`View details for ${data.title}`}
    >
      <div className={`${styles.stateBadge} ${stateClass}`}>{data.state}</div>
      <div className={styles.viralDna}>
        <div className={styles.dnaDot} />
        <div className={styles.dnaDot} />
        <div className={styles.dnaDot} />
      </div>
      <div className={styles.viralRule}>z≥2 & pct≥95 (48h)</div>
      {/* Platform badges */}
      {Array.isArray(data.platforms) && data.platforms.length > 0 && (
        <div className={styles.platformBadges} aria-label="Supported platforms">
          {data.platforms.map((p, idx) => (
            <div key={idx} className={styles.platformBadge}>{p}</div>
          ))}
        </div>
      )}
      <div className={styles.videoPreview}>
        {/* If a video is available, render inline preview; else show placeholder */}
        {data.videoUrl ? (
          <video
            ref={videoRef}
            className={styles.videoElement}
            src={data.videoUrl}
            poster={data.thumbnailUrl}
            muted
            playsInline
            onClick={(e)=>{ e.stopPropagation(); const el = videoRef.current; if (!el) return; if (el.paused) { el.play(); setIsVideoPlaying(true) } else { el.pause(); setIsVideoPlaying(false) } }}
          />
        ) : (
          <div className={styles.videoPlaceholder} style={{ background: data.gradient }}>{data.title.split(' ').slice(0, 2).join(' ')}</div>
        )}
        <div className={styles.playOverlay} onClick={(e)=>{ e.stopPropagation(); if (videoRef.current) { if (videoRef.current.paused) { videoRef.current.play(); setIsVideoPlaying(true) } else { videoRef.current.pause(); setIsVideoPlaying(false) } } }}>
          <div className={styles.playButton} aria-pressed={isVideoPlaying}>▶️</div>
        </div>
      </div>
      <div className={styles.templateInfo}>
        <div className={styles.templateStats}>
          <div className={styles.stat}><span className={styles.statNumber}>{data.views}</span></div>
          <div className={styles.stat}><span className={styles.statNumber}>{data.likes}</span></div>
          <div className={styles.stat}><span className={styles.statNumber}>{data.viralScore}</span></div>
        </div>
        <h3 className={styles.templateTitle}>{data.title}</h3>
        <p className={styles.templateDescription}>{data.description}</p>
        {/* Trend indicators */}
        <div className={styles.trendIndicators} aria-label="Trend indicators">
          <div className={`${styles.trendChip} ${typeof data.trendDelta7d==='number' ? (data.trendDelta7d>0?styles.trendUp:(data.trendDelta7d<0?styles.trendDown:styles.trendStable)) : styles.trendStable}`}>
            {typeof data.trendDelta7d==='number' ? (data.trendDelta7d>0?'↗':(data.trendDelta7d<0?'↘':'→')) : '→'} {Math.abs(data.trendDelta7d ?? 0)}% 7d
          </div>
          <div className={`${styles.trendChip} ${typeof data.trendDelta30d==='number' ? (data.trendDelta30d>0?styles.trendUp:(data.trendDelta30d<0?styles.trendDown:styles.trendStable)) : styles.trendStable}`}>
            {typeof data.trendDelta30d==='number' ? (data.trendDelta30d>0?'↗':(data.trendDelta30d<0?'↘':'→')) : '→'} {Math.abs(data.trendDelta30d ?? 0)}% 30d
          </div>
        </div>
        {/* Trending Sound pill with audio control */}
        <button
          type="button"
          aria-pressed={isPlaying}
          className={`${styles.trendingSound} ${isPlaying ? styles.trendingActive : ''}`}
          onClick={(e)=>{
            e.stopPropagation()
            const el = audioRef.current
            if (!el) return
            if (isPlaying) { el.pause(); setIsPlaying(false) }
            else { el.play().then(()=> setIsPlaying(true)).catch(()=>{}) }
          }}
          onKeyDown={(e)=>{
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault(); (e.currentTarget as HTMLButtonElement).click()
            }
          }}
        >
          <span className={styles.soundIcon}>🎵</span>
          <span>Trending: "{data.sound}"</span>
        </button>
        <audio ref={audioRef} src={audioUrl} onEnded={()=> setIsPlaying(false)} preload="none" />
        {/* Credits info row */}
        {data.credits && (
          <div className={styles.creditsInfo} aria-label="Credits info">
            <div className={styles.creditsItem}><span>📊</span> Analyze: {data.credits.analyze}</div>
            <div className={styles.creditsItem}><span>✨</span> Generate: {data.credits.generate}</div>
            <div className={styles.creditsItem}><span>🔍</span> Validate: {data.credits.validate}</div>
          </div>
        )}
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>SR: <strong style={{ color: srColor }}>{data.sr}%</strong></div>
          <div className={styles.metaItem}>Uses: <strong>{data.uses.toLocaleString()}</strong></div>
          <div className={styles.metaItem}>Examples: <strong>{data.examples}</strong></div>
        </div>
        <div className={styles.metaRow}><div className={styles.metaItem}>{data.lastSeen}</div></div>
        <div className={styles.platformIndicator}>
          <span className={styles.platformLabel}>{data.platformName}:</span>
          <div className={styles.platformBarContainer}>
            <div className={styles.platformBar} style={{ width: `${Math.min(Math.max(data.sr, 0), 100)}%` }}>
              <div className={styles.platformArrows}>
                <div className={styles.platformArrow} />
                <div className={styles.platformArrow} />
              </div>
            </div>
          </div>
          <span className={styles.platformValue}>{data.sr}%</span>
        </div>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>{data.duration}</div>
          <div className={styles.metaItem}>Hook: {data.hookTime}</div>
        </div>
        <div className={styles.signalBadges}>
          {data.signals.map(s => (<span key={s} className={styles.signalBadge}>{s}</span>))}
        </div>
        <div className={styles.qualityRow}>
          <div className={`${styles.qualityCheck} ${styles.pass}`}>{data.brandSafe ? '✓' : '⚠'} Brand-safe</div>
          <div className={`${styles.qualityCheck} ${data.antiGaming ? styles.pass : styles.warn}`}>{data.antiGaming ? '✓' : '⚠'} Anti-gaming</div>
          <div className={`${styles.qualityCheck} ${styles.pass}`}>{data.reliability}</div>
        </div>
        <div className={styles.actions}>
          <button className={styles.viewBtn} onClick={(e)=>{ e.stopPropagation(); onView?.(data.id) }}>👁️ View Details</button>
          <button className={styles.copyBtn} onClick={(e)=>{ e.stopPropagation(); onCopy?.(data.id) }}>📋 Copy Winner</button>
        </div>
        <button className={styles.useTemplate} onClick={(e)=>{ e.stopPropagation(); onGenerate?.(data.id) }}>Generate Variant ✨</button>
      </div>
    </article>
  )
}



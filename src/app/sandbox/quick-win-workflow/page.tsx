"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './QuickWinWorkflow.module.css'

type StepKey = 'gallery' | 'script' | 'analysis' | 'create' | 'platform' | 'success'

// Canonical elements superset
type CanonicalElement =
  | 'Hook' | 'Problem' | 'Reveal'
  | 'Authority' | 'Benefit' | 'Steps'
  | 'Before' | 'After' | 'Proof' | 'CTA'
  | 'Numbers/List' | 'Myth' | 'Truth'
  | 'SocialProof' | 'Audience' | 'FrameworkTeaser'
  | 'Story' | 'Urgency'

type SuggestionsMap = Partial<Record<CanonicalElement, string[]>>

interface TemplateDef {
  id: string
  name: string
  niche: string
  goal: string
  successPct: number
  delta7dPct: string
  scriptFlow: { sequence: CanonicalElement[]; suggestions?: SuggestionsMap }
}

interface HookOption {
  text: string
  metrics: string[]
}

interface AudioOption {
  title: string
  artist: string
  tag?: string
}

export default function QuickWinWorkflowPage(): JSX.Element {
  const [currentStep, setCurrentStep] = useState<StepKey>('gallery')
  const [loading, setLoading] = useState<boolean>(false)
  const [coachMessage, setCoachMessage] = useState<string>(
    "Welcome! Choose a template from the Starter Pack to begin your 10-minute viral video creation."
  )
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [hooks, setHooks] = useState<HookOption[]>([])
  const [selectedHookIdx, setSelectedHookIdx] = useState<number | null>(null)
  const [selectedHook, setSelectedHook] = useState<string | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<AudioOption | null>(null)
  const [viralScore, setViralScore] = useState<number>(73)
  const [displayScore, setDisplayScore] = useState<number>(0)
  const [predictionToastVisible, setPredictionToastVisible] = useState<boolean>(false)
  const [readyToPost, setReadyToPost] = useState<boolean>(false)
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null)
  
  // AI vs Film creation choice
  const [creationMethod, setCreationMethod] = useState<'ai' | 'film' | null>(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)

  // Script Intelligence model/session
  const [templates] = useState<TemplateDef[]>(() => [
    {
      id: 'cta_forward_01',
      name: 'CTA Forward Momentum',
      niche: 'general',
      goal: 'Drive immediate action with fast benefit framing',
      successPct: 92,
      delta7dPct: '+9%'
      ,scriptFlow: {
        sequence: ['Hook','CTA','Benefit','Steps'],
        suggestions: {
          Hook: [
            'Stop scrolling — here’s how to 2x in 7 days',
            'You’re missing this 1 change (it’s easy)',
            'If you post, do this first'
          ],
          CTA: [
            'Follow for daily 10-second playbooks',
            'Save this and try it tonight',
            'Comment “YES” and I’ll DM the template'
          ],
          Benefit: [
            'Cut your edit time in half',
            'Double comments without changing your content',
            'Make viewers watch to the end'
          ],
          Steps: [
            'Do these 3 moves: hook, pattern break, proof',
            'Swap your first line to a question, then add urgency',
            'Use this timing: 0–3 hook, 3–7 benefit, 7–12 proof'
          ]
        }
      }
    }
  ])
  const [currentTemplateDef, setCurrentTemplateDef] = useState<TemplateDef | null>(null)
  const beatsSequence = currentTemplateDef?.scriptFlow.sequence || []
  const beatsAfterHook = beatsSequence.filter(b => b !== 'Hook')
  const [beatSelections, setBeatSelections] = useState<Record<string,string>>({})
  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(0) // index within beatsAfterHook
  const [hasChosenFirstNonHookBeat, setHasChosenFirstNonHookBeat] = useState<boolean>(false)
  const [hasGeneratedHooks, setHasGeneratedHooks] = useState<boolean>(false)
  const [beatSuggestionNonce, setBeatSuggestionNonce] = useState<number>(0)

  // Analysis micro-loader + drawer/modal
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const [receiptOpen, setReceiptOpen] = useState<boolean>(false)

  // Refs for scroll+glow behavior
  const nextTargetRef = useRef<HTMLElement | null>(null)
  const beatsRowRef = useRef<HTMLDivElement | null>(null)
  const beatSuggestionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const audioSectionRef = useRef<HTMLDivElement | null>(null)

  // Schedule rows
  const scheduleRows = useMemo(() => ([
    { platform: 'TikTok', time: 'Today 7:30 PM' },
    { platform: 'Instagram Reels', time: 'Tomorrow 12:00 PM' },
    { platform: 'YouTube Shorts', time: 'Tomorrow 6:00 PM' },
  ]), [])

  // Custom cursor refs
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cursorPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  const showLoading = useCallback(() => setLoading(true), [])
  const hideLoading = useCallback(() => setLoading(false), [])
  const showSection = useCallback((name: StepKey) => setCurrentStep(name), [])
  const showCoach = useCallback((msg: string) => setCoachMessage(msg), [])

  // Telemetry (console.log JSON)
  const emit = useCallback((event: string, payload?: any) => {
    const body = { event, templateId: currentTemplateDef?.id || selectedTemplate || undefined, ...(payload || {}) }
    try { console.log(JSON.stringify(body)) } catch { console.log(body) }
  }, [currentTemplateDef, selectedTemplate])

  // Animate cursor following
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX
      mousePos.current.y = e.clientY
    }
    document.addEventListener('mousemove', onMove)

    const animate = () => {
      const dx = mousePos.current.x - cursorPos.current.x
      const dy = mousePos.current.y - cursorPos.current.y
      cursorPos.current.x += dx * 0.1
      cursorPos.current.y += dy * 0.1
      if (cursorRef.current) {
        cursorRef.current.style.left = `${cursorPos.current.x}px`
        cursorRef.current.style.top = `${cursorPos.current.y}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    const hoverSelectors = 'button, .' + [
      'template-card',
      'hook-option',
      'audio-option',
    ].join(', .')

    const onOver = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(hoverSelectors)) {
        cursorRef.current?.classList.add(styles.hover)
      }
    }
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element)?.closest(hoverSelectors)) {
        cursorRef.current?.classList.remove(styles.hover)
      }
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Score animation when entering analysis
  useEffect(() => {
    if (currentStep !== 'analysis') return
    setDisplayScore(0)
    let active = true
    let n = 0
    const id = setInterval(() => {
      if (!active) return
      n += 2
      setDisplayScore((prev) => (prev >= viralScore ? viralScore : n))
      if (n >= viralScore) {
        clearInterval(id)
        showCoach('Apply the suggested fixes to boost your score, then schedule.')
        emit('analysis.completed', { score: viralScore })
      }
    }, 50)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [currentStep, viralScore, showCoach, emit])

  // Starter Pack templates
  const starterTemplates = useMemo(
    () => [
      {
        id: 'transformation',
        title: 'Transformation Reveal',
        subtitle:
          'The viral before/after format that gets millions of views with powerful emotional hooks',
        gradient: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
        recommended: true,
        stats: { success: 94, delta7: '+12%' },
      },
      {
        id: 'list',
        title: '5 Things List',
        subtitle:
          'Countdown format with text overlays that hooks viewers from second one',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
        recommended: false,
        stats: { success: 89, delta7: '+8%' },
      },
      {
        id: 'pov',
        title: 'POV Experience',
        subtitle:
          'First-person storytelling that creates instant connection and engagement',
        gradient: 'linear-gradient(135deg, #ffd93d 0%, #ff6bcb 100%)',
        recommended: false,
        stats: { success: 97, delta7: '+15%' },
      },
    ],
    []
  )

  const audioOptions: AudioOption[] = useMemo(
    () => [
      { title: 'Aesthetic', artist: 'Tollan Kim', tag: 'Trending' },
      { title: 'Oh No', artist: 'Capone (Remix)', tag: 'Viral' },
      { title: 'Running Up That Hill', artist: 'Kate Bush', tag: 'Classic' },
    ],
    []
  )

  const selectTemplate = (id: string) => {
    setSelectedTemplate(id)
    showLoading()
    setTimeout(() => {
      hideLoading()
      // Map visual card to our canonical template (seed CTA-forward)
      setCurrentTemplateDef(templates[0])
      showSection('script')
      showCoach('Generate 3 Hooks, pick one, then fill each beat.')
    }, 800)
  }

  const generateHooks = async () => {
    showLoading()
    try {
      const r = await fetch('/api/script/generate-hooks', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ template_id: currentTemplateDef?.id, niche: currentTemplateDef?.niche, goal: currentTemplateDef?.goal }) })
      const j = await r.json()
      const nextHooks: HookOption[] = (j?.hooks||[]).slice(0,3).map((t: string, i: number) => ({ text: t, metrics: [`Est. retention ${(Math.round((j?.retention_estimates?.[i]||0.85)*100))}%`] }))
      setHooks(nextHooks)
      setSelectedHook(null)
      setSelectedHookIdx(null)
      setHasGeneratedHooks(true)
      emit(hooks.length ? 'script.hooks_regenerated' : 'script.hooks_generated')
      showCoach('Perfect! Now select your favorite hook and fill in the beat timeline.')
    } catch {
      // fallback: no-op, keep previous behavior minimal
    } finally {
      hideLoading()
    }
  }

  const onSelectHook = (idx: number) => {
    const h = hooks[idx]
    setSelectedHookIdx(idx)
    setSelectedHook(h.text)
    // Mark Hook beat completed
    setBeatSelections((prev) => ({ ...prev, Hook: h.text }))
    // Activate next beat
    setActiveBeatIndex(0)
    const nextBeat = beatsAfterHook[0]
    showCoach(`Great—now pick your ${nextBeat}.`)
    emit('script.hook_selected', { choiceText: h.text })
    // Auto-scroll to beats suggestions
    setTimeout(() => {
      const el = beatSuggestionRefs.current[nextBeat]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add(styles.pulseHighlight)
        setTimeout(() => el.classList.remove(styles.pulseHighlight), 600)
      }
    }, 50)
  }

  const onSelectAudio = (opt: AudioOption) => {
    setSelectedAudio(opt)
    showCoach('Excellent! Your script is coming together. Ready to move to analysis?')
    emit('audio.selected', { choiceText: `${opt.title} • ${opt.artist}` })
  }

  const proceedToAnalysis = async () => {
    setIsAnalyzing(true)
    showSection('analysis')
    try {
      const beat_timeline = [{ element:'Hook', text: selectedHook||'' }, ...beatsAfterHook.map(e => ({ element:e, text: beatSelections[e]||'' }))]
      const r = await fetch('/api/analyze', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ beat_timeline }) })
      const j = await r.json()
      if (typeof j?.viral_score === 'number') setViralScore(Math.max(0, Math.min(100, Math.round(j.viral_score))))
    } catch {}
    setTimeout(() => setIsAnalyzing(false), 500)
  }

  const applyFixes = () => {
    showLoading()
    setTimeout(() => {
      hideLoading()
      // Mutate selected texts deterministically (e.g., add [+ urgency] to CTA)
      setBeatSelections((prev) => {
        const next = { ...prev }
        if (next['CTA'] && !/\[\+ urgency\]/.test(next['CTA'])) {
          next['CTA'] = `${next['CTA']} [+ urgency]`
        }
        return next
      })
      setViralScore(94)
      setReadyToPost(true)
      showCoach('Perfect! Your video is now optimized and ready to post. Let\'s schedule it across platforms.')
      emit('analysis.fixes_applied', { score: 94 })
    }, 800)
  }

  const openScheduleDrawer = () => {
    setDrawerOpen(true)
    setTimeout(() => {
      drawerRef.current?.focus()
    }, 0)
    emit('schedule.opened')
    showCoach("Here’s your optimized posting schedule. Add to calendar or export everything you need!")
  }

  const addToCalendar = async () => {
    try {
      const plan = scheduleRows.map(r => ({ platform: r.platform, when_local: r.time, reasons: [] }))
      const res = await fetch('/api/schedule/ics', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ plan }) })
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'schedule.ics'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {}
    emit('schedule.export_ics')
    showCoach('Calendar events created! You\'ll get reminders for each platform.')
  }

  const exportCaptions = async () => {
    try {
      const r = await fetch('/api/captions?niche=general&goal=quick-win')
      const j = await r.json()
      const content = ['Captions & Hashtags', '—', j?.caption || '', (j?.hashtags||[]).join(' ')].join('\n')
      const blob = new Blob([content], { type: 'text/plain' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'export.txt'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {}
    emit('schedule.export_captions')
    showCoach('Captions and hashtags exported! Everything is ready for posting.')
  }

  const onFinishPrediction = async () => {
    try { 
      const r = await fetch('/api/prediction', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ video_draft_id: currentTemplateDef?.id, inputs: { beats: beatSelections, audio: selectedAudio } }) })
      const j = await r.json(); if (j?.receipt_id) setLastReceiptId(String(j.receipt_id))
    } catch {}
    setPredictionToastVisible(true)
    emit('prediction.saved', { score: viralScore })
  }

  const openReceipt = () => {
    setReceiptOpen(true)
  }

  const closeReceipt = () => {
    setReceiptOpen(false)
    setPredictionToastVisible(false)
    showSection('success')
  }

  const onTeleprompterCTA = () => {
    emit('finish.teleprompter_cta')
  }

  // Derived states
  const completedBeatsCount = useMemo(() => Object.keys(beatSelections).filter(k => k !== 'Hook').length, [beatSelections])
  const audioUnlocked = !!beatSelections['Hook'] && completedBeatsCount >= 1

  // Beat suggestions (stubbed if no backend)
  const getBeatSuggestions = useCallback((beat: CanonicalElement): string[] => {
    const base = currentTemplateDef?.scriptFlow.suggestions?.[beat]
    if (base && base.length) return base.slice(0, 3)
    // simple stubs
    if (beat === 'Benefit') return ['Get results in days', 'Save hours weekly', 'Boost engagement fast']
    if (beat === 'Steps') return ['Do A, then B, then C', '3 quick moves to apply', 'Try this order: 1-2-3']
    if (beat === 'CTA') return ['Follow for more', 'Save this now', 'Comment “YES” for link']
    return ['Solid option A', 'Option B', 'Option C']
  }, [currentTemplateDef])

  const onSelectBeatSuggestion = (beat: CanonicalElement, text: string) => {
    setBeatSelections((prev) => ({ ...prev, [beat]: text }))
    if (!hasChosenFirstNonHookBeat) {
      setHasChosenFirstNonHookBeat(true)
      showCoach('Nice. Keep filling beats—then choose your audio.')
    }
    emit('script.beat_selected', { beat, choiceText: text })
    // advance to next beat or audio
    const nextIdx = beatsAfterHook.findIndex(b => b === beat) + 1
    const nextBeat = beatsAfterHook[nextIdx]
    setActiveBeatIndex(nextIdx)
    setTimeout(() => {
      if (nextBeat) {
        const el = beatSuggestionRefs.current[nextBeat]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add(styles.pulseHighlight)
          setTimeout(() => el.classList.remove(styles.pulseHighlight), 600)
        }
      } else if (audioSectionRef.current) {
        audioSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        audioSectionRef.current.classList.add(styles.pulseHighlight)
        setTimeout(() => audioSectionRef.current?.classList.remove(styles.pulseHighlight), 600)
      }
    }, 50)
  }

  return (
    <div className={styles.root}>
      {/* Custom cursor */}
      <div ref={cursorRef} className={styles.cursor} />

      {/* Ambient background */}
      <div className={styles.ambientBg} />

      {/* Floating orbs */}
      <div className={styles.floatingOrb} style={{ left: '10%', top: '20%' }} />
      <div className={styles.floatingOrbAlt} />

      <div className={styles.mainContainer}>
        {/* Header (persistent) */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>Viral Recipe Book™</div>
            <div className={styles.trendingBadge}>
              <div className={styles.liveDot} />
              <span>247 Templates Trending Now</span>
            </div>
          </div>
        </header>

        {/* Gallery Section */}
        {currentStep === 'gallery' && (
          <section className={styles.gallerySection}>
            <main className={styles.templateFeed}>
              <div className={styles.starterPackHeader}>
                <h1 className={styles.starterPackTitle}>Starter Pack</h1>
                <p className={styles.starterPackSubtitle}>
                  3 HOT templates curated for maximum viral potential
                </p>
              </div>

              <div className={styles.feedGrid}>
                {starterTemplates.map((t, i) => (
                  <article
                    key={t.id}
                    className={styles.templateCard}
                    style={{ animationDelay: `${(i + 1) * 0.1}s` as any }}
                    onClick={() => selectTemplate(t.id)}
                  >
                    <div className={styles.starterPackRibbon}>STARTER PACK</div>
                    {t.recommended && (
                      <div className={styles.recommendedPill}>RECOMMENDED</div>
                    )}
                    <div className={styles.videoPreview}>
                      <div
                        className={styles.videoPlaceholder}
                        style={{ background: t.gradient }}
                      >
                        {t.title}
                      </div>
                      <div className={styles.playButton}>▶️</div>
                    </div>
                    <div className={styles.templateInfo}>
                      <div className={styles.templateStats}>
                        <div className={styles.stat}>
                          <span>Success:</span>
                          <span className={styles.statNumber}>{t.stats.success}%</span>
                        </div>
                        <div className={styles.stat}>
                          <span>7-day Δ:</span>
                          <span className={styles.statNumber}>{t.stats.delta7}</span>
                        </div>
                      </div>
                      <h3 className={styles.templateTitle}>{t.title}</h3>
                      <p className={styles.templateDescription}>{t.subtitle}</p>
                      <button className={styles.useTemplateBtn}>Use this template</button>
                    </div>
                  </article>
                ))}
              </div>
            </main>
          </section>
        )}

        {/* Script Intelligence Section */}
        {currentStep === 'script' && (
          <section className={styles.scriptSection}>
            <div className={styles.scriptContainer}>
              {/* Live Preview Panel */}
              <div className={styles.livePreviewPanel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelIcon}>🎬</span>
                  <span>Live Preview</span>
                </div>
                <div className={styles.previewWindow} data-testid="live-preview">
                  <div className={styles.previewContent}>
                    <div
                      className={[
                        styles.previewHook,
                        selectedHook ? styles.visible : '',
                      ].join(' ')}
                    >
                      {selectedHook || 'Select a hook to see it here'}
                    </div>
                    {/* Render completed beats in order (excluding Hook) */}
                    {beatsAfterHook.map((b) => (
                      beatSelections[b] ? (
                        <div key={b} className={styles.previewBeatLine}>
                          <strong>{b}: </strong>{beatSelections[b]}
                        </div>
                      ) : null
                    ))}
                    <div className={styles.playButtonStatic}>▶️</div>
                  </div>
                  <div
                    className={[
                      styles.previewAudio,
                      selectedAudio ? styles.visible : '',
                    ].join(' ')}
                  >
                    <div className={styles.audioIcon}>🎵</div>
                    <div className={styles.audioInfo}>
                      <div className={styles.audioTitle}>
                        {selectedAudio ? selectedAudio.title : 'No audio selected'}
                      </div>
                      <div className={styles.audioArtist}>
                        {selectedAudio
                          ? `${selectedAudio.artist} • ${selectedAudio.tag || ''}`
                          : 'Choose from trending sounds'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Script Controls Panel */}
              <div className={styles.scriptControlsPanel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelIcon}>🎛️</span>
                  <span>Script Intelligence</span>
                </div>

                {/* Hook Generation */}
                <div className={[styles.scriptStep, styles.active].join(' ')}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepTitle}>
                      <span>🪝</span>
                      <span>Generate 3 Hooks</span>
                    </div>
                    <div className={styles.stepStatus}>{selectedHook ? 'Completed' : 'Active'}</div>
                  </div>
                  <div className={styles.hookOptions}>
                    {hooks.map((h, i) => (
                      <div
                        key={i}
                        className={[
                          styles.hookOption,
                          selectedHookIdx === i ? styles.selected : '',
                        ].join(' ')}
                        onClick={() => onSelectHook(i)}
                        data-testid={`hook-option-${i+1}`}
                      >
                        <div className={styles.hookText}>{h.text}</div>
                        <div className={styles.hookMetrics}>
                          {h.metrics.map((m, j) => (
                            <span key={j}>{m}</span>
                          ))}
                        </div>
                        {selectedHookIdx === i && (
                          <div data-testid="hook-selected" style={{ position:'absolute', top:8, right:8, fontSize:12, color:'#00ff88' }}>Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className={styles.generateBtn}
                    onClick={generateHooks}
                    data-testid="script-generate-hooks-btn"
                  >
                    {hasGeneratedHooks ? 'Regenerate new hook options' : 'Generate 3 Hooks'}
                  </button>
                </div>

                {/* Adaptive Beats Row */}
                <div className={styles.scriptStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepTitle}>
                      <span>⏱️</span>
                      <span>Fill beats from template</span>
                    </div>
                    <div className={styles.stepStatus}>
                      {selectedHook && beatsAfterHook.every(b => beatSelections[b]) ? 'Completed' : (selectedHook ? 'Active' : 'Pending')}
                    </div>
                  </div>
                  <div className={styles.beatsRow} data-testid="beats-row" ref={beatsRowRef}>
                    {beatsSequence.map((b) => {
                      const isDone = !!beatSelections[b]
                      const isActive = (b === 'Hook' && !beatSelections['Hook']) || (b !== 'Hook' && selectedHook && beatsAfterHook[activeBeatIndex] === b && !isDone)
                      return (
                        <div
                          key={b}
                          className={[
                            styles.chip,
                            isActive ? styles.chipActive : '',
                            isDone ? styles.chipDone : ''
                          ].join(' ')}
                          data-testid={`beat-chip-${b}${isActive?'-active':''}${isDone?'-done':''}`}
                        >{b}</div>
                      )
                    })}
                  </div>
                  {/* Suggestions for active beat (excluding Hook) */}
                  {selectedHook && beatsAfterHook.map((b, idx) => {
                    const isActive = idx === activeBeatIndex && !beatSelections[b]
                    const suggestions = getBeatSuggestions(b)
                    return (
                      <div key={b} ref={(el) => { beatSuggestionRefs.current[b] = el }} className={styles.beatSuggestionsWrap}>
                        {isActive && (
                          <div>
                            <div className={styles.suggestionsHeader}>
                              <div className={styles.suggestionsTitle}>Suggestions for {b}</div>
                              <button className={styles.regenerateLink} onClick={() => setBeatSuggestionNonce(x=>x+1)} data-testid={`beat-regenerate-${b}`}>Regenerate options</button>
                            </div>
                            <div className={styles.suggestions} data-testid={`beat-suggestions-${b}`}>
                              {suggestions.slice(0,3).map((s, i) => (
                                <div key={i} className={styles.suggestionItem} onClick={() => onSelectBeatSuggestion(b, s)} data-testid={`beat-suggestion-${b}-${i+1}`}>{s}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Audio Selection Step */}
                <div className={styles.scriptStep} ref={audioSectionRef}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepTitle}>
                      <span>🎵</span>
                      <span>Select trending audio</span>
                    </div>
                    <div className={styles.stepStatus}>{selectedAudio ? 'Completed' : (audioUnlocked ? 'Active' : 'Pending')}</div>
                  </div>
                  {!audioUnlocked && (
                    <div className={styles.audioLockedNote} data-testid="audio-locked">Complete Hook and at least one beat to unlock audio</div>
                  )}
                  <div className={[styles.audioCarousel, !audioUnlocked ? styles.disabled : ''].join(' ')}>
                    {audioOptions.map((a, idx) => (
                      <div
                        key={a.title}
                        className={[
                          styles.audioOption,
                          selectedAudio?.title === a.title ? styles.selected : '',
                        ].join(' ')}
                        onClick={() => audioUnlocked && onSelectAudio(a)}
                        data-testid={`audio-tile-${idx+1}`}
                      >
                        <div className={styles.audioName}>{a.title}</div>
                        <div className={styles.audioDetails}>
                          {a.artist} {a.tag ? `• ${a.tag}` : ''}
                        </div>
                        {selectedAudio?.title === a.title && (
                          <div className={styles.audioSelectedBadge} data-testid="audio-selected-badge">Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shot List Step */}
                <div className={styles.scriptStep}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepTitle}>
                      <span>📋</span>
                      <span>Create shot list</span>
                    </div>
                    <div className={styles.stepStatus}>Pending</div>
                  </div>
                  <div className={styles.outputButtons}>
                    <button className={styles.outputBtn} onClick={async()=>{
                      try{
                        const beat_timeline = [{ element:'Hook', text: selectedHook||'' }, ...beatsAfterHook.map(e => ({ element:e, text: beatSelections[e]||'' }))]
                        const r = await fetch('/api/script/exports', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ type:'teleprompter', beat_timeline }) })
                        const blob = await r.blob()
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'teleprompter.txt'; document.body.appendChild(a); a.click(); a.remove()
                      } catch {}
                    }}>📱 Teleprompter</button>
                    <button className={styles.outputBtn} onClick={async()=>{
                      try{
                        const beat_timeline = [{ element:'Hook', text: selectedHook||'' }, ...beatsAfterHook.map(e => ({ element:e, text: beatSelections[e]||'' }))]
                        const r = await fetch('/api/script/exports', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ type:'srt', beat_timeline }) })
                        const blob = await r.blob()
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'subtitles.srt'; document.body.appendChild(a); a.click(); a.remove()
                      } catch {}
                    }}>📄 SRT</button>
                    <button className={styles.outputBtn} onClick={async()=>{
                      try{
                        const beat_timeline = [{ element:'Hook', text: selectedHook||'' }, ...beatsAfterHook.map(e => ({ element:e, text: beatSelections[e]||'' }))]
                        const r = await fetch('/api/script/exports', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ type:'shotlist', beat_timeline }) })
                        const blob = await r.blob()
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'shotlist.txt'; document.body.appendChild(a); a.click(); a.remove()
                      } catch {}
                    }}>📋 Shot list</button>
                  </div>
                </div>

                <button className={styles.continueBtn} onClick={proceedToAnalysis} data-testid="continue-to-analysis">
                  CONTINUE TO ANALYSIS
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Analysis Section */}
        {currentStep === 'analysis' && (
          <section className={styles.analysisSection}>
            <div className={styles.analysisContainer}>
              <div className={styles.analysisHeader}>
                <h2 className={styles.analysisTitle}>Instant Analysis</h2>
                {isAnalyzing ? (
                  <div className={styles.microLoader}>Analyzing…</div>
                ) : (
                  <div className={styles.viralScore} data-testid="analysis-score">{displayScore}%</div>
                )}
                <p>Viral Score</p>
              </div>

              <div className={styles.fixesContainer}>
                <h3 style={{ marginBottom: 20 }}>3 Prioritized Fixes</h3>
                <div className={styles.fixItem} data-testid="fix-item-1">
                  <div className={styles.fixIcon}>⚡</div>
                  <div className={styles.fixContent}>
                    <div className={styles.fixTitle}>Strengthen hook timing</div>
                    <div className={styles.fixDescription}>
                      Move main hook 2 seconds earlier for better retention
                    </div>
                  </div>
                </div>
                <div className={styles.fixItem} data-testid="fix-item-2">
                  <div className={styles.fixIcon}>🎯</div>
                  <div className={styles.fixContent}>
                    <div className={styles.fixTitle}>Optimize CTA placement</div>
                    <div className={styles.fixDescription}>
                      Add secondary CTA at 15-second mark
                    </div>
                  </div>
                </div>
                <div className={styles.fixItem} data-testid="fix-item-3">
                  <div className={styles.fixIcon}>🔥</div>
                  <div className={styles.fixContent}>
                    <div className={styles.fixTitle}>Enhance emotional trigger</div>
                    <div className={styles.fixDescription}>
                      Add urgency words to increase engagement
                    </div>
                  </div>
                </div>
                <button className={styles.applyFixesBtn} onClick={applyFixes} data-testid="apply-fixes-btn">
                  Apply all fixes
                </button>
              </div>

              {readyToPost && (
                <div className={styles.readyBadge} data-testid="ready-to-post-badge">✅ Ready to Post</div>
              )}

              <button 
                className={styles.continueBtn} 
                onClick={() => {
                  showSection('create')
                  showCoach('Your script is optimized! Now choose how you want to create your video.')
                  emit('analysis.continue_to_create')
                }}
              >
                CONTINUE TO CREATE →
              </button>

              <button className={styles.finishBtn} onClick={onFinishPrediction}>
                SKIP TO PREDICTION
              </button>
            </div>
          </section>
        )}

        {/* Schedule Drawer */}
        {drawerOpen && (
          <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
            <div
              className={styles.drawer}
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-title"
              tabIndex={-1}
              ref={drawerRef}
              data-testid="schedule-drawer"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setDrawerOpen(false)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <div id="schedule-title" className={styles.drawerTitle}>Cross-Platform Schedule</div>
                <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)} aria-label="Close">✕</button>
              </div>
              <div className={styles.platformSchedule}>
                {scheduleRows.map((row) => (
                  <div key={row.platform} className={styles.platformItem} data-testid={`schedule-row-${row.platform}`}> 
                    <div className={[styles.platformIcon, row.platform.includes('TikTok')?styles.tiktok: row.platform.includes('Instagram')?styles.instagram: styles.youtube].join(' ')}>📅</div>
                    <div className={styles.platformInfo}>
                      <div className={styles.platformName}>{row.platform}</div>
                      <div className={styles.platformTime}>{row.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.exportButtons}>
                <button className={styles.exportBtn} onClick={addToCalendar} data-testid="btn-ics">Add to calendar (ICS)</button>
                <button className={styles.exportBtn} onClick={exportCaptions} data-testid="btn-export-captions">Export captions/hashtags</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Section - AI or Film Choice */}
        {currentStep === 'create' && (
          <section className={styles.analysisSection}>
            <div className={styles.analysisContainer}>
              <h2 className={styles.analysisTitle}>How Would You Like to Create?</h2>
              <p style={{ color: '#888', marginBottom: '2rem', textAlign: 'center' }}>
                Your script is ready with a {viralScore}% viral potential. Choose your creation method:
              </p>

              {!creationMethod && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                  {/* AI Generation Option */}
                  <button
                    onClick={() => setCreationMethod('ai')}
                    style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, rgba(147,51,234,0.2) 0%, rgba(236,72,153,0.2) 100%)',
                      border: '2px solid rgba(147,51,234,0.5)',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
                    <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Generate with AI
                    </h3>
                    <p style={{ color: '#aaa', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      Create a professional video in 2 minutes using AI avatars and voices
                    </p>
                    <ul style={{ color: '#888', fontSize: '0.75rem', listStyle: 'none', padding: 0 }}>
                      <li style={{ marginBottom: '0.25rem' }}>✓ No filming required</li>
                      <li style={{ marginBottom: '0.25rem' }}>✓ Multiple style options</li>
                      <li style={{ marginBottom: '0.25rem' }}>✓ ~6.6 Kling credits</li>
                    </ul>
                  </button>

                  {/* Film Yourself Option */}
                  <button
                    onClick={() => setCreationMethod('film')}
                    style={{
                      padding: '2rem',
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(6,182,212,0.2) 100%)',
                      border: '2px solid rgba(59,130,246,0.5)',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎬</div>
                    <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Film Yourself
                    </h3>
                    <p style={{ color: '#aaa', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      Use our teleprompter to record your authentic video
                    </p>
                    <ul style={{ color: '#888', fontSize: '0.75rem', listStyle: 'none', padding: 0 }}>
                      <li style={{ marginBottom: '0.25rem' }}>✓ Personal authenticity</li>
                      <li style={{ marginBottom: '0.25rem' }}>✓ Built-in teleprompter</li>
                      <li style={{ marginBottom: '0.25rem' }}>✓ Free to create</li>
                    </ul>
                  </button>
                </div>
              )}

              {/* AI Generation Flow */}
              {creationMethod === 'ai' && !generatedVideoUrl && (
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                  <div style={{ 
                    background: 'rgba(147,51,234,0.1)', 
                    border: '1px solid rgba(147,51,234,0.3)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>AI Video Generation</h3>
                    <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      We'll generate a professional video using your optimized script
                    </p>
                    
                    {!isGeneratingVideo ? (
                      <button
                        onClick={() => {
                          setIsGeneratingVideo(true)
                          showCoach('Generating your AI video... This usually takes about 2 minutes.')
                          // Simulate AI generation
                          setTimeout(() => {
                            setIsGeneratingVideo(false)
                            setGeneratedVideoUrl('/placeholder-video.mp4')
                            showCoach('Your AI video is ready! Review it below.')
                            emit('create.ai_generated')
                          }, 3000)
                        }}
                        style={{
                          padding: '1rem 2rem',
                          background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        🎬 Generate Video (~6.6 credits)
                      </button>
                    ) : (
                      <div>
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          border: '3px solid rgba(147,51,234,0.3)',
                          borderTopColor: '#9333ea',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 1rem'
                        }} />
                        <p style={{ color: '#9333ea' }}>Generating your video...</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setCreationMethod(null)}
                    style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ← Choose different method
                  </button>
                </div>
              )}

              {/* Generated Video Preview */}
              {creationMethod === 'ai' && generatedVideoUrl && (
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                  <div style={{ 
                    background: '#111',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                    aspectRatio: '9/16',
                    maxHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(147,51,234,0.3)'
                  }}>
                    <div style={{ textAlign: 'center', color: '#666' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</div>
                      <p>AI Generated Video Preview</p>
                      <p style={{ fontSize: '0.75rem' }}>(Video player placeholder)</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        setGeneratedVideoUrl(null)
                        setIsGeneratingVideo(false)
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Regenerate
                    </button>
                    <button
                      onClick={() => {
                        showSection('platform')
                        showCoach('Video created! Now let\'s schedule it across platforms.')
                        emit('create.video_approved')
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Approve & Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Film Yourself Flow */}
              {creationMethod === 'film' && (
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                  <div style={{ 
                    background: 'rgba(59,130,246,0.1)', 
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Ready to Film</h3>
                    <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      Your script is loaded into the teleprompter. Click below to start recording.
                    </p>
                    
                    {/* Script Preview */}
                    <div style={{ 
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      textAlign: 'left',
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}>
                      <p style={{ color: '#fff', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        "{selectedHook || 'Your hook will appear here...'}"
                      </p>
                      {beatsAfterHook.map((beat, idx) => (
                        <p key={beat} style={{ color: '#aaa', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                          <strong>{beat}:</strong> {beatSelections[beat] || '...'}
                        </p>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => {
                        showSection('platform')
                        showCoach('Great! After filming, schedule your video across platforms.')
                        emit('create.teleprompter_started')
                      }}
                      style={{
                        padding: '1rem 2rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      📹 Open Teleprompter
                    </button>
                  </div>
                  <button 
                    onClick={() => setCreationMethod(null)}
                    style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ← Choose different method
                  </button>
                </div>
              )}

              {/* Back button when no method selected */}
              {!creationMethod && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button 
                    onClick={() => showSection('analysis')}
                    style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ← Back to Analysis
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Platform/Schedule Section */}
        {currentStep === 'platform' && (
          <section className={styles.analysisSection}>
            <div className={styles.analysisContainer}>
              <h2 className={styles.analysisTitle}>Schedule Your Video</h2>
              <p style={{ color: '#888', marginBottom: '2rem', textAlign: 'center' }}>
                Your video is ready! Schedule it across platforms for maximum reach.
              </p>
              <div className={styles.platformSchedule} style={{ maxWidth: '500px', margin: '0 auto' }}>
                {scheduleRows.map((row) => (
                  <div key={row.platform} className={styles.platformItem} data-testid={`schedule-row-${row.platform}`}> 
                    <div className={[styles.platformIcon, row.platform.includes('TikTok')?styles.tiktok: row.platform.includes('Instagram')?styles.instagram: styles.youtube].join(' ')}>📅</div>
                    <div className={styles.platformInfo}>
                      <div className={styles.platformName}>{row.platform}</div>
                      <div className={styles.platformTime}>{row.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.exportButtons} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                <button className={styles.exportBtn} onClick={addToCalendar} data-testid="btn-ics">Add to calendar (ICS)</button>
                <button className={styles.exportBtn} onClick={exportCaptions} data-testid="btn-export-captions">Export captions/hashtags</button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={() => {
                    showSection('success')
                    showCoach('Congratulations! Your viral video journey is complete.')
                    emit('workflow.completed')
                  }}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ✓ Complete Workflow
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Success Section */}
        {currentStep === 'success' && (
          <section className={styles.successSection}>
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>🎉</div>
              <h2 className={styles.analysisTitle}>Workflow Complete!</h2>
              <p className={styles.successSubtitle}>
                Your viral video is scheduled and ready to go
              </p>
              <button className={styles.teleprompterBtn} data-testid="btn-next-teleprompter" onClick={onTeleprompterCTA}>Create Another Video</button>
            </div>
            <div className={styles.finishScreenMarker} data-testid="finish-screen" />
          </section>
        )}

        {/* Coach Bubble */}
        {!!coachMessage && (
          <div className={[styles.coachBubble, styles.visible].join(' ')}>
            <div className={styles.coachHeader}>
              <div className={styles.coachAvatar}>🤖</div>
              <div className={styles.coachName}>AI Coach</div>
            </div>
            <div className={styles.coachMessage}>{coachMessage}</div>
          </div>
        )}

        {/* Prediction Toast */}
        <div
          className={[
            styles.predictionToast,
            predictionToastVisible ? styles.visible : '',
          ].join(' ')}
          data-testid="prediction-toast"
        >
          <h4 className={styles.predictionHeader}>Prediction Saved ✅</h4>
          <p className={styles.predictionText}>We\'ll verify your results in 48h</p>
          <button className={styles.predictionBtn} onClick={() => { if (lastReceiptId) { (window as any).location.href = `/prediction/${lastReceiptId}` } else { openReceipt() } }} data-testid="prediction-receipt-link">See my Prediction Receipt</button>
        </div>

        {/* Prediction Receipt Modal */}
        {receiptOpen && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={closeReceipt}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} data-testid="prediction-receipt-modal">
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>Prediction Receipt</div>
                <button className={styles.drawerClose} onClick={closeReceipt} aria-label="Close">✕</button>
              </div>
              <div className={styles.modalBody}>
                <div><strong>Template ID:</strong> {currentTemplateDef?.id}</div>
                <div style={{ marginTop: 10 }}>
                  <strong>Beats:</strong>
                  <ol className={styles.receiptList}>
                    {beatsSequence.map((b) => (
                      <li key={b}><strong>{b}:</strong> {beatSelections[b] || (b==='Hook'? selectedHook: '')}</li>
                    ))}
                  </ol>
                </div>
                <div style={{ marginTop: 10 }}>
                  <strong>Audio:</strong> {selectedAudio ? `${selectedAudio.title} • ${selectedAudio.artist}` : 'None'}
                </div>
                <div style={{ marginTop: 10 }}>
                  <strong>Viral Score:</strong> {viralScore}
                </div>
                <div style={{ marginTop: 10 }}>
                  <strong>Schedule:</strong>
                  <ul className={styles.receiptList}>
                    {scheduleRows.map(r => (
                      <li key={r.platform}>{r.platform} — {r.time}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.continueBtn} onClick={closeReceipt}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        <div className={[styles.loadingOverlay, loading ? styles.active : ''].join(' ')}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    </div>
  )
}



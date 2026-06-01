'use client'

// "Step Off The Wheel" — optional mini-game mounted as a child of
// HamsterLoader via the render prop.
//
// Visual architecture: hybrid Canvas + DOM SVG.
//   • Canvas: background gradient, parallax silhouettes (far + mid), ground,
//     hamster, score. These benefit from raster compositing and they don't
//     have discrete sprite identities.
//   • DOM SVG layer: obstacles, collectibles, ground decorations. Each is an
//     absolutely-positioned wrapper containing an inline SVG with idle
//     animations driven by CSS keyframes on sub-elements. The rAF loop
//     updates each wrapper's transform imperatively (translate3d only) so
//     React reconciliation only happens when sprite membership changes
//     (spawn / collection / cull) — a few times per second.
//
// The render-prop contract from HamsterLoader is preserved: this component
// receives { isAssessmentReady, assessmentData } and owns the end-modal
// hand-off. The loader's default auto-route is suppressed by FreedomOSTool
// passing a no-op onAssessmentReady.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { AssessmentReadyData } from '@/lib/assessment/types'
import { PlayButton } from './PlayButton'
import { Sprite } from './sprites'
import {
  type Entity,
  type EntityKind,
  type GameState,
  createGameState,
  freeze,
  jump,
  render,
  tick,
} from './gameEngine'
import styles from './StepOffGame.module.css'
import './StepOffGame.global.css'

interface Props {
  isAssessmentReady: boolean
  assessmentData: AssessmentReadyData | null
}

type Mode = 'idle' | 'playing' | 'ready'

const PLAY_BUTTON_DELAY_MS = 3000

// Lightweight descriptor shipped into React state. Excludes positional fields
// (x/y) — those live in the ref and are written to the DOM imperatively.
interface EntityDescriptor {
  id: number
  kind: EntityKind
  type: string
  width: number
  height: number
  animDelayMs: number
  collected: boolean
}

function toDescriptor(e: Entity): EntityDescriptor {
  return {
    id: e.id,
    kind: e.kind,
    type: e.type,
    width: e.width,
    height: e.height,
    animDelayMs: e.animDelayMs,
    collected: !!e.collected,
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StepOffGame({ isAssessmentReady, assessmentData }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('idle')
  const [showPlayButton, setShowPlayButton] = useState(false)
  const [endScore, setEndScore] = useState(0)
  const [gameWasOpened, setGameWasOpened] = useState(false)
  const [entities, setEntities] = useState<EntityDescriptor[]>([])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const spriteLayerRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<GameState | null>(null)
  const entityDomMap = useRef<Map<number, HTMLElement>>(new Map())
  const navigatedRef = useRef(false)

  // ── 3s play-button reveal ──
  useEffect(() => {
    const t = window.setTimeout(() => setShowPlayButton(true), PLAY_BUTTON_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  // ── Assessment ready → freeze + show modal ──
  useEffect(() => {
    if (!isAssessmentReady) return
    if (mode === 'ready') return
    const state = stateRef.current
    if (state) {
      setEndScore(state.score)
      freeze(state)
    } else {
      setEndScore(0)
    }
    setMode('ready')
  }, [isAssessmentReady, mode])

  // ── Canvas + rAF loop. Runs once the game opens and stays alive through
  //    'ready' so the frozen scene keeps rendering under the modal. ──
  useEffect(() => {
    if (!gameWasOpened) return

    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    let cssWidth = wrap.clientWidth
    let cssHeight = wrap.clientHeight

    const resize = () => {
      cssWidth = wrap.clientWidth
      cssHeight = wrap.clientHeight
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null
    ro?.observe(wrap)

    if (!stateRef.current) {
      stateRef.current = createGameState(performance.now(), prefersReducedMotion())
    }

    let rafId = 0
    let lastTime = performance.now()

    const loop = (now: number) => {
      // Tab hidden ⇒ skip work but keep the rAF chain. Reset lastTime so dt
      // doesn't include the hidden duration when we resume.
      if (document.hidden) {
        lastTime = now
        rafId = requestAnimationFrame(loop)
        return
      }
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      const state = stateRef.current!
      const result = tick(state, dt, now, cssWidth, cssHeight)
      render(state, ctx, cssWidth, cssHeight, now)

      // Imperative transform updates for every visible sprite — runs every
      // frame, no React work. Collectibles get a small sin-wave Y bob folded
      // in here (a CSS animation on transform would be clobbered by the JS
      // write each frame).
      for (const e of state.entities) {
        const el = entityDomMap.current.get(e.id)
        if (!el) continue
        let y = e.y
        if (e.kind === 'collectible' && !e.collected) {
          y += Math.sin((now + e.animDelayMs) * 0.005) * 3
        }
        el.style.transform = `translate3d(${e.x}px, ${y}px, 0)`
      }

      // Membership / collection state changed ⇒ re-sync React.
      if (result.membershipChanged) {
        setEntities(state.entities.map(toDescriptor))
      }

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      ro?.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [gameWasOpened])

  // ── Input handlers ──
  useEffect(() => {
    if (mode !== 'playing') return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        e.preventDefault()
        const state = stateRef.current
        if (state) jump(state)
      }
    }
    window.addEventListener('keydown', onKeyDown)

    const wrap = wrapRef.current
    const onPointer = (e: PointerEvent) => {
      e.preventDefault()
      const state = stateRef.current
      if (state) jump(state)
    }
    // Attach to the wrap (canvas + sprite layer) so a tap anywhere registers.
    wrap?.addEventListener('pointerdown', onPointer, { passive: false })

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      wrap?.removeEventListener('pointerdown', onPointer)
    }
  }, [mode])

  const handleEnterGame = useCallback(() => {
    setGameWasOpened(true)
    setMode('playing')
  }, [])

  const handleViewPlan = useCallback(() => {
    if (navigatedRef.current) return
    if (!assessmentData) return
    navigatedRef.current = true
    router.push(`/assessment/${assessmentData.shareUrlId}`)
  }, [assessmentData, router])

  const gameActive = gameWasOpened || mode === 'ready'

  return (
    <div
      className={styles.container}
      data-game-active={gameActive ? 'true' : undefined}
    >
      {mode === 'idle' && (
        <div
          className={`${styles.playButtonSlot} ${showPlayButton ? styles.visible : ''}`}
        >
          <PlayButton onClick={handleEnterGame} />
        </div>
      )}

      {gameWasOpened && (
        <div
          ref={wrapRef}
          className={`${styles.canvasWrap} ${styles.visible}`}
        >
          <canvas
            ref={canvasRef}
            aria-label="Step Off The Wheel mini-game"
            role="img"
          />
          <div ref={spriteLayerRef} className={styles.spriteLayer}>
            {entities.map(e => (
              <div
                key={e.id}
                data-entity-id={e.id}
                className={
                  styles.sprite +
                  (e.collected ? ' ' + styles.collected : '') +
                  ' ' + getKindClass(e.kind)
                }
                style={{
                  width: `${e.width}px`,
                  height: `${e.height}px`,
                  // CSS variable propagates into the inline-SVG sub-elements
                  // so their idle animations get a per-instance phase offset.
                  // Negative delay starts the animation mid-cycle.
                  ['--fos-anim-delay' as string]: `-${e.animDelayMs}ms`,
                } as CSSProperties}
                ref={el => {
                  if (el) {
                    entityDomMap.current.set(e.id, el)
                    // Apply the current world position immediately so the
                    // sprite doesn't flash at (0,0) for one frame between
                    // React commit and the next rAF tick.
                    const ent = stateRef.current?.entities.find(x => x.id === e.id)
                    if (ent) {
                      el.style.transform = `translate3d(${ent.x}px, ${ent.y}px, 0)`
                    }
                  } else {
                    entityDomMap.current.delete(e.id)
                  }
                }}
              >
                <Sprite type={e.type} kind={e.kind} />
              </div>
            ))}
          </div>
          <div className={styles.controlsHint}>SPACE / ↑ / TAP TO JUMP</div>

          {mode === 'ready' && (
            <EndModal score={endScore} onViewPlan={handleViewPlan} />
          )}
        </div>
      )}

      {!gameWasOpened && mode === 'ready' && (
        <EndModal score={endScore} onViewPlan={handleViewPlan} />
      )}
    </div>
  )
}

function getKindClass(kind: EntityKind): string {
  if (kind === 'collectible') return styles.collectibleSprite
  if (kind === 'decoration') return styles.decorationSprite
  return styles.obstacleSprite
}

function EndModal({
  score,
  onViewPlan,
}: {
  score: number
  onViewPlan: () => void
}) {
  return (
    <div className={styles.endBackdrop} role="dialog" aria-modal="true">
      <div className={styles.endModal}>
        <h2 className={styles.endHeadline}>Your escape plan is ready.</h2>
        <p className={styles.endSubhead}>
          Time to step off the hamster wheel for real.
        </p>
        <p className={styles.endScore}>Obstacles cleared: {score}</p>
        <button type="button" className={styles.endCta} onClick={onViewPlan}>
          View My Plan <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}

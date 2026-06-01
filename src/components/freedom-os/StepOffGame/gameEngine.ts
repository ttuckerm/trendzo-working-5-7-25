// Game engine — pure-functions over a state object. Holds three entity
// streams (obstacles, collectibles, decorations) plus the hamster physics,
// world-scroll accumulator, and parallax offsets. Canvas drawing here is
// limited to the things that read better as raster (background gradient,
// parallax silhouettes, ground line, hamster, score) — entity sprites are
// rendered as DOM SVGs by StepOffGame.tsx and positioned via imperative
// transform updates each frame.

import {
  COLLECTIBLE_SPECS,
  DECORATION_SPECS,
  OBSTACLE_SPECS,
  type CollectibleType,
  type DecorationType,
  type ObstacleType,
  pickRandomCollectibleType,
  pickRandomDecorationType,
  pickRandomObstacleType,
} from './obstacles'

// Layout constants (fractions of canvas size so everything stays responsive).
const GROUND_Y_FRAC = 0.82
const HAMSTER_X_FRAC = 0.18
const HAMSTER_WIDTH = 36
const HAMSTER_HEIGHT = 26

// Physics
const GRAVITY = 2200
const JUMP_VELOCITY = -640

// World scroll
const BASE_SPEED = 200
const SPEED_RAMP_FACTOR = 1.10
const SPEED_RAMP_INTERVAL_S = 15
const SPEED_CAP_MULT = 2.2

// Parallax multipliers (relative to current world speed).
const PARALLAX_FAR = 0.20
const PARALLAX_MID = 0.50

// Spawn cadences (gaps as fractions of canvas width for responsive feel).
const OBSTACLE_GAP_FRAC_MIN = 0.55
const OBSTACLE_GAP_FRAC_MAX = 0.95

// One collectible per 8–12 obstacles, biased to be reachable mid-gap.
const COLLECTIBLE_MIN_OBSTACLES = 8
const COLLECTIBLE_MAX_OBSTACLES = 12

// Decorations spawn on a time interval, not a count, so the ground feels
// lived-in even when obstacle cadence is bunched.
const DECORATION_MIN_GAP_S = 1.2
const DECORATION_MAX_GAP_S = 2.6

// Collectible height above the ground line — chosen so a single jump from
// directly underneath cleanly intercepts the collectible. Max jump apex with
// current physics is ~93 px; we sit at 78 px so there's a slight tolerance
// either side.
const COLLECTIBLE_HEIGHT_ABOVE_GROUND = 78

// Shake on collision
const SHAKE_DURATION_MS = 280

// Score pulse window when a collectible bonus lands
const SCORE_PULSE_DURATION_MS = 700

// Collected sprite stays in the list briefly for the sparkle/fade animation
// before being culled.
export const COLLECTED_FADE_MS = 420

export type EntityKind = 'obstacle' | 'collectible' | 'decoration'

export interface Entity {
  id: number
  kind: EntityKind
  type: ObstacleType | CollectibleType | DecorationType
  x: number
  y: number
  width: number
  height: number
  spawnedAt: number
  animDelayMs: number
  // obstacles
  scored?: boolean
  // collectibles
  collected?: boolean
  collectedAt?: number
}

export interface TickResult {
  membershipChanged: boolean
  bonusCollected: number | null   // points added, or null
}

export interface GameState {
  hamsterOffsetY: number
  hamsterVy: number
  jumping: boolean

  entities: Entity[]
  nextEntityId: number

  // Counters for spawn cadence
  obstaclesSinceLastCollectible: number
  nextCollectibleAfter: number     // recompute on each spawn
  lastObstacleType: ObstacleType | null
  lastCollectibleType: CollectibleType | null
  lastDecorationType: DecorationType | null
  nextDecorationDueAt: number      // performance.now() target

  score: number
  scorePulseUntil: number
  startedAt: number

  worldOffset: number              // cumulative px scrolled

  shakeUntil: number
  reducedMotion: boolean
  frozen: boolean
}

export function createGameState(now: number, reducedMotion: boolean): GameState {
  return {
    hamsterOffsetY: 0,
    hamsterVy: 0,
    jumping: false,
    entities: [],
    nextEntityId: 1,
    obstaclesSinceLastCollectible: 0,
    nextCollectibleAfter: randInt(COLLECTIBLE_MIN_OBSTACLES, COLLECTIBLE_MAX_OBSTACLES),
    lastObstacleType: null,
    lastCollectibleType: null,
    lastDecorationType: null,
    nextDecorationDueAt: now + randFloat(DECORATION_MIN_GAP_S, DECORATION_MAX_GAP_S) * 1000,
    score: 0,
    scorePulseUntil: 0,
    startedAt: now,
    worldOffset: 0,
    shakeUntil: 0,
    reducedMotion,
    frozen: false,
  }
}

export function jump(state: GameState) {
  if (state.frozen) return
  if (state.hamsterOffsetY >= -0.5 && !state.jumping) {
    state.hamsterVy = JUMP_VELOCITY
    state.jumping = true
  }
}

export function freeze(state: GameState) {
  state.frozen = true
}

function currentSpeed(state: GameState, now: number): number {
  const elapsedS = (now - state.startedAt) / 1000
  const steps = Math.floor(elapsedS / SPEED_RAMP_INTERVAL_S)
  const mult = Math.min(Math.pow(SPEED_RAMP_FACTOR, steps), SPEED_CAP_MULT)
  return BASE_SPEED * mult
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}
function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function spawnObstacle(state: GameState, width: number, height: number, now: number): Entity {
  const type = pickRandomObstacleType(state.lastObstacleType)
  state.lastObstacleType = type
  const spec = OBSTACLE_SPECS[type]
  const groundY = height * GROUND_Y_FRAC
  const entity: Entity = {
    id: state.nextEntityId++,
    kind: 'obstacle',
    type,
    x: width + 10,
    y: groundY - spec.height,
    width: spec.width,
    height: spec.height,
    spawnedAt: now,
    animDelayMs: Math.floor(Math.random() * 1200),
  }
  state.entities.push(entity)
  state.obstaclesSinceLastCollectible++
  return entity
}

function spawnCollectible(state: GameState, width: number, height: number, now: number, atX: number) {
  const type = pickRandomCollectibleType(state.lastCollectibleType)
  state.lastCollectibleType = type
  const spec = COLLECTIBLE_SPECS[type]
  const groundY = height * GROUND_Y_FRAC
  state.entities.push({
    id: state.nextEntityId++,
    kind: 'collectible',
    type,
    x: atX,
    y: groundY - COLLECTIBLE_HEIGHT_ABOVE_GROUND - spec.height / 2,
    width: spec.width,
    height: spec.height,
    spawnedAt: now,
    animDelayMs: Math.floor(Math.random() * 1200),
  })
  state.obstaclesSinceLastCollectible = 0
  state.nextCollectibleAfter = randInt(COLLECTIBLE_MIN_OBSTACLES, COLLECTIBLE_MAX_OBSTACLES)
}

function spawnDecoration(state: GameState, width: number, height: number, now: number) {
  const type = pickRandomDecorationType(state.lastDecorationType)
  state.lastDecorationType = type
  const spec = DECORATION_SPECS[type]
  const groundY = height * GROUND_Y_FRAC
  state.entities.push({
    id: state.nextEntityId++,
    kind: 'decoration',
    type,
    x: width + 8,
    y: groundY - spec.height + 1,   // sit just on the ground line
    width: spec.width,
    height: spec.height,
    spawnedAt: now,
    animDelayMs: Math.floor(Math.random() * 1600),
  })
  state.nextDecorationDueAt = now + randFloat(DECORATION_MIN_GAP_S, DECORATION_MAX_GAP_S) * 1000
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function tick(
  state: GameState,
  dt: number,
  now: number,
  width: number,
  height: number,
): TickResult {
  let membershipChanged = false
  let bonusCollected: number | null = null
  if (state.frozen) return { membershipChanged, bonusCollected }

  // Physics
  state.hamsterVy += GRAVITY * dt
  state.hamsterOffsetY += state.hamsterVy * dt
  if (state.hamsterOffsetY >= 0) {
    state.hamsterOffsetY = 0
    state.hamsterVy = 0
    state.jumping = false
  }

  const speed = currentSpeed(state, now)
  const scrollPx = speed * dt
  state.worldOffset += scrollPx

  // Scroll every entity by its kind-specific speed (obstacles/collectibles/
  // decorations all run at 1× — only the canvas-drawn parallax is fractional).
  for (const e of state.entities) {
    e.x -= scrollPx
  }

  // ── Spawn: obstacle ──
  const lastObstacle = lastOfKind(state.entities, 'obstacle')
  const lastObstacleEdge = lastObstacle ? lastObstacle.x + lastObstacle.width : -Infinity
  const desiredObstacleGap = width * (
    OBSTACLE_GAP_FRAC_MIN + Math.random() * (OBSTACLE_GAP_FRAC_MAX - OBSTACLE_GAP_FRAC_MIN)
  )
  if (width - lastObstacleEdge >= desiredObstacleGap) {
    const spawned = spawnObstacle(state, width, height, now)
    membershipChanged = true

    // After obstacle spawn, decide whether to drop a collectible mid-gap.
    if (state.obstaclesSinceLastCollectible >= state.nextCollectibleAfter) {
      // Place between this new obstacle and the previous, at the midpoint.
      const prevEdge = lastObstacleEdge === -Infinity ? width : lastObstacleEdge
      const midX = (prevEdge + spawned.x) / 2
      // Only spawn if there's at least a comfortable horizontal slot.
      if (spawned.x - prevEdge > width * 0.35) {
        spawnCollectible(state, width, height, now, midX)
      }
    }
  }

  // ── Spawn: decoration (time-based) ──
  if (now >= state.nextDecorationDueAt) {
    // Don't spawn a decoration directly under an obstacle near the right edge —
    // it'd look glued to the obstacle. Skip this tick if too close.
    const lastObstacleX = lastObstacle ? lastObstacle.x : -Infinity
    if (Math.abs(width - lastObstacleX) > 40) {
      spawnDecoration(state, width, height, now)
      membershipChanged = true
    } else {
      // Defer slightly.
      state.nextDecorationDueAt = now + 200
    }
  }

  // ── Score obstacles as they pass the hamster ──
  const hamsterX = width * HAMSTER_X_FRAC
  for (const e of state.entities) {
    if (e.kind === 'obstacle' && !e.scored && (e.x + e.width) < hamsterX) {
      e.scored = true
      state.score++
    }
  }

  // ── Collision detection ──
  const groundY = height * GROUND_Y_FRAC
  const hamHitX = hamsterX + 4
  const hamHitW = HAMSTER_WIDTH - 8
  const hamHitY = groundY - HAMSTER_HEIGHT + state.hamsterOffsetY + 3
  const hamHitH = HAMSTER_HEIGHT - 6
  for (const e of state.entities) {
    if (e.kind === 'obstacle') {
      if (rectsOverlap(hamHitX, hamHitY, hamHitW, hamHitH, e.x, e.y, e.width, e.height)) {
        if (state.shakeUntil < now - 60) {
          state.shakeUntil = now + SHAKE_DURATION_MS
        }
      }
    } else if (e.kind === 'collectible' && !e.collected) {
      if (rectsOverlap(hamHitX, hamHitY, hamHitW, hamHitH, e.x, e.y, e.width, e.height)) {
        e.collected = true
        e.collectedAt = now
        const bonus = COLLECTIBLE_SPECS[e.type as CollectibleType].bonus
        state.score += bonus
        state.scorePulseUntil = now + SCORE_PULSE_DURATION_MS
        bonusCollected = bonus
      }
    }
  }

  // ── Cull off-screen / fully-faded entities ──
  const before = state.entities.length
  state.entities = state.entities.filter(e => {
    if (e.collected && e.collectedAt && (now - e.collectedAt) > COLLECTED_FADE_MS) return false
    if (e.x + e.width < -80) return false
    return true
  })
  if (state.entities.length !== before) membershipChanged = true

  return { membershipChanged, bonusCollected }
}

function lastOfKind(entities: Entity[], kind: EntityKind): Entity | null {
  for (let i = entities.length - 1; i >= 0; i--) {
    if (entities[i].kind === kind) return entities[i]
  }
  return null
}

// ── Canvas rendering: bg, parallax silhouettes, ground line, hamster, score.
//    Sprite entities are NOT drawn here — they're DOM elements managed by
//    StepOffGame.tsx. ─────────────────────────────────────────────────────
export function render(
  state: GameState,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number,
) {
  let shakeX = 0
  let shakeY = 0
  if (!state.reducedMotion && state.shakeUntil > now) {
    const remaining = (state.shakeUntil - now) / SHAKE_DURATION_MS
    const amp = 4 * remaining
    shakeX = (Math.random() - 0.5) * amp * 2
    shakeY = (Math.random() - 0.5) * amp * 2
  }

  ctx.save()
  ctx.translate(shakeX, shakeY)

  // Background gradient — slowly tints toward a deeper crimson over 60s, then
  // back, so the world feels like it's transitioning rather than static.
  const fadeT = Math.min((now - state.startedAt) / 60000, 1)
  const bg = ctx.createLinearGradient(0, 0, 0, height)
  const topR = Math.round(8 + fadeT * 22)
  const topG = Math.round(8 + fadeT * 6)
  const topB = Math.round(13 + fadeT * 10)
  bg.addColorStop(0, `rgb(${topR},${topG},${topB})`)
  bg.addColorStop(1, '#08080d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // Far parallax: city silhouette
  drawFarParallax(ctx, width, height, state.worldOffset)

  // Mid parallax: office furniture silhouette
  drawMidParallax(ctx, width, height, state.worldOffset)

  // Ground line + texture
  const groundY = height * GROUND_Y_FRAC
  ctx.fillStyle = '#1c1c24'
  ctx.fillRect(0, groundY, width, 2)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fillRect(0, groundY + 2, width, 1)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, groundY + 3, width, 4)

  // Hamster
  const hamX = width * HAMSTER_X_FRAC
  const hamY = groundY - HAMSTER_HEIGHT + state.hamsterOffsetY
  drawHamster(ctx, hamX, hamY, now, state)

  ctx.restore()

  // Score (top-right). Pulse gold when a collectible bonus landed.
  const isPulsing = state.scorePulseUntil > now
  const pulsePhase = isPulsing
    ? 1 - (state.scorePulseUntil - now) / SCORE_PULSE_DURATION_MS
    : 1
  const pulseScale = isPulsing ? 1 + (1 - Math.abs(pulsePhase * 2 - 1)) * 0.3 : 1
  const scoreFont = `700 ${Math.round(18 * pulseScale)}px "JetBrains Mono", ui-monospace, Menlo, monospace`
  const scoreText = String(state.score).padStart(3, '0')
  ctx.save()
  ctx.font = scoreFont
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillText(scoreText, width - 11, 13)
  // Foreground (brighter while pulsing)
  ctx.fillStyle = isPulsing ? '#fff5b0' : '#ffd700'
  ctx.fillText(scoreText, width - 12, 12)
  ctx.restore()
}

// ── Parallax: far city silhouette ─────────────────────────────────────────
const FAR_TILE_WIDTH = 220
function drawFarParallax(ctx: CanvasRenderingContext2D, width: number, height: number, worldOffset: number) {
  const offset = (worldOffset * PARALLAX_FAR) % FAR_TILE_WIDTH
  const baseY = height * GROUND_Y_FRAC
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#1c1c24'
  const startTile = -1
  const endTile = Math.ceil(width / FAR_TILE_WIDTH) + 1
  for (let t = startTile; t < endTile; t++) {
    const baseX = t * FAR_TILE_WIDTH - offset
    drawFarTile(ctx, baseX, baseY)
  }
  ctx.restore()
}
// One repeating city tile — five buildings with varied heights and tiny
// window lights for character.
function drawFarTile(ctx: CanvasRenderingContext2D, x: number, baseY: number) {
  const buildings = [
    { dx: 0,   w: 38, h: 88, hasAntenna: true },
    { dx: 42,  w: 28, h: 64, hasAntenna: false },
    { dx: 75,  w: 46, h: 110, hasAntenna: true },
    { dx: 126, w: 30, h: 74, hasAntenna: false },
    { dx: 162, w: 50, h: 96, hasAntenna: true },
  ]
  for (const b of buildings) {
    const bx = x + b.dx
    const by = baseY - b.h
    ctx.fillRect(bx, by, b.w, b.h)
    if (b.hasAntenna) {
      ctx.fillRect(bx + b.w / 2 - 1, by - 8, 2, 8)
    }
    // Window dots (slightly lighter than the silhouette)
    ctx.save()
    ctx.fillStyle = 'rgba(255, 200, 200, 0.20)'
    for (let row = 0; row < Math.floor(b.h / 14); row++) {
      for (let col = 0; col < Math.floor(b.w / 10); col++) {
        if ((row * 7 + col * 13 + b.dx) % 5 < 2) {
          ctx.fillRect(bx + 3 + col * 10, by + 6 + row * 14, 2, 3)
        }
      }
    }
    ctx.restore()
  }
}

// ── Parallax: mid office furniture silhouette ─────────────────────────────
const MID_TILE_WIDTH = 180
function drawMidParallax(ctx: CanvasRenderingContext2D, width: number, height: number, worldOffset: number) {
  const offset = (worldOffset * PARALLAX_MID) % MID_TILE_WIDTH
  const baseY = height * GROUND_Y_FRAC
  ctx.save()
  ctx.globalAlpha = 0.28
  ctx.fillStyle = '#252530'
  const startTile = -1
  const endTile = Math.ceil(width / MID_TILE_WIDTH) + 1
  for (let t = startTile; t < endTile; t++) {
    const baseX = t * MID_TILE_WIDTH - offset
    drawMidTile(ctx, baseX, baseY)
  }
  ctx.restore()
}
function drawMidTile(ctx: CanvasRenderingContext2D, x: number, baseY: number) {
  // Desk 1 with monitor
  ctx.fillRect(x + 5, baseY - 18, 50, 4)        // desk top
  ctx.fillRect(x + 8, baseY - 14, 3, 14)        // leg
  ctx.fillRect(x + 49, baseY - 14, 3, 14)       // leg
  ctx.fillRect(x + 22, baseY - 38, 18, 20)      // monitor
  ctx.fillRect(x + 28, baseY - 18, 6, 4)        // stand
  // Chair
  ctx.fillRect(x + 60, baseY - 26, 4, 18)       // back
  ctx.fillRect(x + 60, baseY - 14, 14, 4)       // seat
  ctx.fillRect(x + 66, baseY - 10, 2, 10)       // post
  // Desk 2 (taller monitor)
  ctx.fillRect(x + 90, baseY - 20, 56, 4)
  ctx.fillRect(x + 93, baseY - 16, 3, 16)
  ctx.fillRect(x + 140, baseY - 16, 3, 16)
  ctx.fillRect(x + 108, baseY - 44, 22, 24)
  ctx.fillRect(x + 117, baseY - 20, 4, 4)
  // Lonely office plant
  ctx.fillRect(x + 158, baseY - 12, 10, 12)
  ctx.fillRect(x + 161, baseY - 22, 4, 12)
}

// ── Hamster ──────────────────────────────────────────────────────────────
function drawHamster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  now: number,
  state: GameState,
) {
  ctx.save()
  ctx.translate(x, y)

  const runPhase = state.reducedMotion || state.frozen ? 0 : Math.sin(now * 0.024)

  // Tail
  ctx.fillStyle = 'hsl(0, 90%, 85%)'
  ctx.beginPath()
  ctx.ellipse(2, 16, 4, 2.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Back limbs
  ctx.strokeStyle = 'hsl(30, 90%, 60%)'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (state.jumping) {
    ctx.moveTo(13, 22); ctx.lineTo(11, 25)
  } else {
    ctx.moveTo(13, 22); ctx.lineTo(13 + runPhase * 3.2, 26)
  }
  ctx.stroke()

  // Body
  ctx.fillStyle = 'hsl(30, 90%, 90%)'
  ctx.beginPath()
  ctx.ellipse(18, 15, 14, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  // Back shading
  ctx.fillStyle = 'hsl(30, 90%, 70%)'
  ctx.beginPath()
  ctx.ellipse(18, 10, 13, 4.5, 0, Math.PI, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.fillStyle = 'hsl(30, 90%, 60%)'
  ctx.beginPath()
  ctx.ellipse(30, 13, 6.5, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ear
  ctx.fillStyle = 'hsl(0, 90%, 85%)'
  ctx.beginPath()
  ctx.arc(28, 8, 2.3, 0, Math.PI * 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(32, 12, 1.1, 0, Math.PI * 2)
  ctx.fill()

  // Nose
  ctx.fillStyle = 'hsl(0, 90%, 75%)'
  ctx.beginPath()
  ctx.arc(35, 14, 1, 0, Math.PI * 2)
  ctx.fill()

  // Front legs
  ctx.strokeStyle = 'hsl(30, 90%, 60%)'
  ctx.lineWidth = 2.4
  ctx.beginPath()
  if (state.jumping) {
    ctx.moveTo(24, 22); ctx.lineTo(26, 25)
  } else {
    ctx.moveTo(24, 22); ctx.lineTo(24 - runPhase * 3.2, 26)
  }
  ctx.stroke()

  ctx.restore()
}

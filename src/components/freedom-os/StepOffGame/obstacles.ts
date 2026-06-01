// Entity registry — sizes, type sets, and spawn-helper functions for the
// three sprite kinds (obstacles, collectibles, decorations). The actual SVG
// visuals live in sprites.tsx; the canvas-rendered background lives in
// gameEngine.ts. Keeping the registry separate so both consumers reference
// the same source of truth for hitbox sizes.

export const OBSTACLE_TYPES = [
  'invoice', 'laptop', 'books', 'inbox', 'calendar', 'coffee',
] as const
export type ObstacleType = typeof OBSTACLE_TYPES[number]

export const COLLECTIBLE_TYPES = ['coin', 'bulb'] as const
export type CollectibleType = typeof COLLECTIBLE_TYPES[number]

export const DECORATION_TYPES = [
  'paperclip', 'paperball', 'pen', 'sticky',
] as const
export type DecorationType = typeof DECORATION_TYPES[number]

// Logical sprite sizes in CSS pixels. The DOM wrapper uses these as
// width/height, and the SVG viewBox matches so vectors scale cleanly.
export const OBSTACLE_SPECS: Record<ObstacleType, { width: number; height: number }> = {
  invoice:  { width: 30, height: 36 },
  laptop:   { width: 40, height: 28 },
  books:    { width: 32, height: 38 },
  inbox:    { width: 42, height: 32 },
  calendar: { width: 32, height: 34 },
  coffee:   { width: 26, height: 36 },
}

export const COLLECTIBLE_SPECS: Record<CollectibleType, {
  width: number; height: number; bonus: number
}> = {
  coin: { width: 24, height: 24, bonus: 3 },
  bulb: { width: 22, height: 28, bonus: 5 },
}

export const DECORATION_SPECS: Record<DecorationType, { width: number; height: number }> = {
  paperclip: { width: 14, height: 8 },
  paperball: { width: 12, height: 10 },
  pen:       { width: 18, height: 4 },
  sticky:    { width: 14, height: 14 },
}

function pickFromPool<T>(pool: readonly T[], last: T | null): T {
  const candidates = last ? pool.filter(t => t !== last) : [...pool]
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function pickRandomObstacleType(last: ObstacleType | null): ObstacleType {
  return pickFromPool(OBSTACLE_TYPES, last)
}

export function pickRandomCollectibleType(last: CollectibleType | null): CollectibleType {
  return pickFromPool(COLLECTIBLE_TYPES, last)
}

export function pickRandomDecorationType(last: DecorationType | null): DecorationType {
  return pickFromPool(DECORATION_TYPES, last)
}

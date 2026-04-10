// ── Agency Dashboard Design Tokens ───────────────────────────────────

export const T = {
  bg: '#1c1c24',
  bgCard: '#0f0f16',
  bgGlass: 'rgba(15, 15, 22, 0.6)',
  bgGlassHover: 'rgba(15, 15, 22, 0.8)',
  bgDeep: '#08080d',
  bgElevated: '#151520',
  border: '#1e1e2e',
  borderActive: '#2a2a3e',
  blur: 'blur(16px)',

  accent: '#f04a4d',
  cyan: '#00d4ff',
  green: '#2dd4a8',
  amber: '#f4b942',
  violet: '#7b2ff7',
  crimson: '#e63946',
  gold: '#f4b942',

  textPrimary: '#e8e8f0',
  textSecondary: '#8888a0',
  textDim: '#55556a',

  raised: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
  raisedLg: '-6px -6px 14px rgba(255,255,255,0.05), 6px 6px 14px rgba(0,0,0,0.65)',
  inset: 'inset -3px -3px 8px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.6)',
  pillShadow: '-2px -2px 6px rgba(255,255,255,0.05), 2px 2px 6px rgba(0,0,0,0.55)',
  navShadow: '0 4px 12px rgba(0,0,0,0.5)',
  cardShadow: '0 2px 12px rgba(0,0,0,0.4)',
  glowCyan: '0 0 20px rgba(0,212,255,0.15)',
  glowCrimson: '0 0 20px rgba(230,57,70,0.15)',
  glowGold: '0 0 20px rgba(244,185,66,0.15)',
} as const;

export const stagger = (i: number, base = 0) => ({
  animation: 'neuFadeUp 0.45s ease both',
  animationDelay: `${base + i * 60}ms`,
});

export const ANIMATION_CSS = `
@keyframes neuFadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

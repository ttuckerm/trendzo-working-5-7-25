export const ryosVars = {
  panelBg: '--panel-bg',
  blur: '--blur',
  radiusXl: '--radius-xl',
  shadowChrome: '--shadow-chrome',
  shimmer: '--shimmer',
  motionFast: '--motion-fast',
  motionMedium: '--motion-medium',
  motionSlow: '--motion-slow',
  motionEaseOut: '--motion-ease-out',
  motionEaseIn: '--motion-ease-in',
  motionEaseInOut: '--motion-ease-in-out',
};

/**
 * Returns a set of CSS variables for the ryos-parity skin.
 * Attach to a container element via style prop or a CSS class.
 */
export function ryosParityVars(): React.CSSProperties {
  return {
    [ryosVars.panelBg]: 'rgba(16,16,20,0.6)',
    [ryosVars.blur]: '16px',
    [ryosVars.radiusXl]: '16px',
    [ryosVars.shadowChrome]: '0 20px 40px rgba(0,0,0,0.4)',
    [ryosVars.shimmer]: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
    // Motion scale (parity skin)
    [ryosVars.motionFast]: '100ms',
    [ryosVars.motionMedium]: '160ms',
    [ryosVars.motionSlow]: '200ms',
    [ryosVars.motionEaseOut]: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    [ryosVars.motionEaseIn]: 'ease-in',
    [ryosVars.motionEaseInOut]: 'ease-in-out',
  } as React.CSSProperties;
}

export function defaultVars(): React.CSSProperties {
  return {
    [ryosVars.panelBg]: 'rgba(24,24,28,0.5)',
    [ryosVars.blur]: '10px',
    [ryosVars.radiusXl]: '12px',
    [ryosVars.shadowChrome]: '0 16px 32px rgba(0,0,0,0.35)',
    [ryosVars.shimmer]: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    // Motion scale (default skin)
    [ryosVars.motionFast]: '120ms',
    [ryosVars.motionMedium]: '180ms',
    [ryosVars.motionSlow]: '220ms',
    [ryosVars.motionEaseOut]: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    [ryosVars.motionEaseIn]: 'ease-in',
    [ryosVars.motionEaseInOut]: 'ease-in-out',
  } as React.CSSProperties;
}



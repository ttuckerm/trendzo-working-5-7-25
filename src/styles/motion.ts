import type { CSSProperties } from 'react';
export const durations = {
  xfast: 80,
  fast: 100,
  medium: 160,
  mediumPlus: 180,
  slow: 200,
  dock: 130,
  context: 140,
};

export const easings = {
  easeOut: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeIn: 'ease-in',
  easeInOut: 'ease-in-out',
};

export type TransitionSpec = { ms: number; easing?: string };

export function transition(spec: TransitionSpec): CSSProperties {
  const easing = spec.easing || easings.easeOut;
  const ms = spec.ms;
  return {
    transition: `transform ${ms}ms ${easing}, opacity ${ms}ms ${easing}`,
    willChange: 'transform, opacity',
  } as CSSProperties;
}

export const transitions = {
  fast: transition({ ms: durations.fast }),
  medium: transition({ ms: durations.medium }),
  slow: transition({ ms: durations.slow, easing: easings.easeInOut }),
};



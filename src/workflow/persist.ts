const NAMESPACE = 'tz.workflow.v1';

function keyFor(subKey: string): string {
  return `${NAMESPACE}:${subKey}`;
}

export function load<T>(subKey: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(keyFor(subKey));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(subKey: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(subKey), JSON.stringify(value));
  } catch {
    // swallow
  }
}

export const persistVersion = 1 as const;



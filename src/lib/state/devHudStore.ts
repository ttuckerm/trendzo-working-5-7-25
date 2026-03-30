import { create } from 'zustand';

type PerfHudState = {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  toggle: () => void;
};

function readInitialVisible(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem('perfHudVisible');
    if (v === null) return true; // default to visible in dev
    return v === '1';
  } catch {
    return true;
  }
}

function persistVisible(next: boolean) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('perfHudVisible', next ? '1' : '0');
  } catch {}
}

export const usePerfHudStore = create<PerfHudState>((set, get) => ({
  isVisible: readInitialVisible(),
  setVisible: (visible: boolean) => {
    persistVisible(visible);
    set({ isVisible: visible });
  },
  toggle: () => {
    const next = !get().isVisible;
    persistVisible(next);
    set({ isVisible: next });
  }
}));



"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { soundManager } from './SoundManager';

function subscribe(callback: () => void) {
  return soundManager.subscribe(callback);
}

// Use a stable snapshot reference from SoundManager to avoid rerender feedback loops
function getSnapshot() {
  return soundManager.getSnapshot();
}

export function useSound() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => { /* ensure construction */ }, [state]);
  // Expose stable function references to avoid effects re-firing on each render
  const setEnabled = useCallback((b: boolean) => { void soundManager.setEnabled(b); }, []);
  const setVolume = useCallback((v: number) => { soundManager.setVolume(v); }, []);
  const loadPack = useCallback((id: string) => { void soundManager.loadPack(id); }, []);
  const play = useCallback((key: string) => { void soundManager.play(key); }, []);

  return useMemo(() => ({
    enabled: state.enabled as boolean,
    volume: (state.volume as number) ?? 0.6,
    pack: (state.pack as string | null) ?? null,
    setEnabled,
    setVolume,
    loadPack,
    play,
    manager: soundManager,
  }), [state.enabled, state.volume, state.pack, setEnabled, setVolume, loadPack, play]);
}



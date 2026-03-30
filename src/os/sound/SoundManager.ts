"use client";

// Web Audio powered, brand-safe UI sound manager
// - Pluggable packs loaded from /public/sounds/{pack}/manifest.json
// - LRU buffer cache
// - Throttle repeat events (>=120ms)
// - Max 4 concurrent voices
// - Silently no-op on any error or missing file

type Manifest = Record<string, string>;

type Subscriber = () => void;

function now() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()); }

// Flag: turn all canvas sounds OFF unless explicitly enabled via env
const SOUNDS_ENABLED = (process.env.NEXT_PUBLIC_CANVAS_SOUNDS || 'off') === 'on';

type Snapshot = { enabled: boolean; volume: number; pack: string | null };

// No-op, stable manager used when sounds are disabled
class NoopSoundManager {
  private snapshot: Snapshot = { enabled: false, volume: 0.6, pack: null };
  subscribe(_fn: () => void) { return () => {}; }
  getSnapshot(): Snapshot { return this.snapshot; }
  // The following APIs are stable no-ops to avoid triggering effects or WebAudio
  async setEnabled(_b: boolean): Promise<void> { /* no-op */ }
  setVolume(_v: number): void { /* no-op */ }
  async loadPack(_id: string): Promise<void> { /* no-op */ }
  async play(_key: string): Promise<void> { /* no-op */ }
}

export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private enabled: boolean = false;
  private volume: number = 0.6;
  private packId: string | null = null;
  // Cached snapshot for useSyncExternalStore; must be referentially stable
  private snapshot: { enabled: boolean; volume: number; pack: string | null } = { enabled: false, volume: 0.6, pack: null };
  private manifest: Manifest = {};
  private bufferCache: Map<string, AudioBuffer | 'missing'> = new Map();
  private lruOrder: string[] = [];
  private maxCache = 24;
  private maxVoices = 4;
  private voices: Array<{ node: AudioBufferSourceNode; startedAt: number } | null> = [];
  private lastPlayed: Map<string, number> = new Map();
  private minInterval = 120; // ms per key
  private subscribers: Set<Subscriber> = new Set();
  private preloaded: boolean = false;

  constructor() {
    try {
      const rawEnabled = typeof window !== 'undefined' ? localStorage.getItem('trendzo.sound.enabled') : null;
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.enabled = rawEnabled != null ? rawEnabled === '1' : !prefersReduced;
      const rawVol = typeof window !== 'undefined' ? localStorage.getItem('trendzo.sound.volume') : null;
      this.volume = rawVol != null ? Math.max(0, Math.min(1, parseFloat(rawVol))) : 0.6;
      const savedPack = typeof window !== 'undefined' ? localStorage.getItem('trendzo.sound.pack') : null;
      this.packId = savedPack || 'trendzo-default';
      this.snapshot = { enabled: this.enabled, volume: this.volume, pack: this.packId };
    } catch {}
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private emit() {
    // Update snapshot so consumers get a stable reference unless state actually changed
    this.snapshot = { enabled: this.enabled, volume: this.volume, pack: this.packId };
    for (const fn of this.subscribers) try { fn(); } catch {}
  }

  private ensureContext(): void {
    if (this.audioCtx) return;
    try {
      // @ts-ignore - latencyHint is supported widely
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' });
      this.gain = this.audioCtx.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.audioCtx.destination);
    } catch {
      this.audioCtx = null;
      this.gain = null;
    }
  }

  async ensureActivated(): Promise<void> {
    this.ensureContext();
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      try { await this.audioCtx.resume(); } catch {}
    }
  }

  isEnabled(): boolean { return this.enabled; }

  async setEnabled(next: boolean): Promise<void> {
    this.enabled = !!next;
    try { localStorage.setItem('trendzo.sound.enabled', this.enabled ? '1' : '0'); } catch {}
    if (this.enabled) await this.ensureActivated();
    this.emit();
  }

  setVolume(v: number): void {
    const clamped = Math.max(0, Math.min(1, v));
    this.volume = clamped;
    try { localStorage.setItem('trendzo.sound.volume', String(clamped)); } catch {}
    try { if (this.gain) this.gain.gain.value = clamped; } catch {}
    this.emit();
  }

  getVolume(): number { return this.volume; }

  getPackId(): string | null { return this.packId; }

  getSnapshot(): { enabled: boolean; volume: number; pack: string | null } {
    return this.snapshot;
  }

  async loadPack(id: string): Promise<void> {
    this.packId = id;
    try { localStorage.setItem('trendzo.sound.pack', id); } catch {}
    this.preloaded = false;
    this.manifest = {};
    // Notify subscribers about pack change
    this.emit();
    // Fetch manifest, but do not throw on failure
    try {
      const res = await fetch(`/sounds/${encodeURIComponent(id)}/manifest.json`, { cache: 'force-cache' });
      if (!res.ok) return;
      const json = await res.json();
      if (json && typeof json === 'object') {
        this.manifest = json as Manifest;
      }
    } catch {}
    // Start a background preload without blocking animations
    const preload = async () => {
      const keys = Object.keys(this.manifest);
      for (const k of keys) {
        if (!this.enabled) break;
        try { await this.fetchBuffer(k); } catch {}
      }
      this.preloaded = true;
    };
    try {
      // Use idle time if available
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(preload) : setTimeout(preload, 0);
    } catch { setTimeout(preload, 0); }
  }

  private evictLRUIfNeeded() {
    while (this.lruOrder.length > this.maxCache) {
      const oldest = this.lruOrder.shift();
      if (oldest) this.bufferCache.delete(oldest);
    }
  }

  private async fetchBuffer(key: string): Promise<AudioBuffer | null> {
    const hit = this.bufferCache.get(key);
    if (hit && hit !== 'missing') return hit;
    if (hit === 'missing') return null;
    const file = this.manifest[key];
    const pack = this.packId || 'trendzo-default';
    if (!file) { this.bufferCache.set(key, 'missing'); return null; }
    this.ensureContext();
    if (!this.audioCtx) { this.bufferCache.set(key, 'missing'); return null; }
    try {
      const url = `/sounds/${encodeURIComponent(pack)}/${encodeURIComponent(file)}`;
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) { this.bufferCache.set(key, 'missing'); return null; }
      const arr = await res.arrayBuffer();
      const buf = await this.audioCtx.decodeAudioData(arr.slice(0));
      this.bufferCache.set(key, buf);
      this.lruOrder = this.lruOrder.filter((k) => k !== key);
      this.lruOrder.push(key);
      this.evictLRUIfNeeded();
      return buf;
    } catch {
      this.bufferCache.set(key, 'missing');
      return null;
    }
  }

  private startVoice(buffer: AudioBuffer): void {
    if (!this.audioCtx || !this.gain) return;
    // Enforce voice limit
    if (this.voices.filter(Boolean).length >= this.maxVoices) {
      const first = this.voices.shift();
      try { first && first.node.stop(0); } catch {}
    }
    const src = this.audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.gain);
    const v = { node: src, startedAt: now() };
    this.voices.push(v);
    const onEnded = () => {
      src.removeEventListener('ended', onEnded as any);
      const idx = this.voices.indexOf(v);
      if (idx >= 0) this.voices.splice(idx, 1);
    };
    src.addEventListener('ended', onEnded as any);
    try { src.start(0); } catch {}
  }

  async play(key: string): Promise<void> {
    if (!this.enabled) return;
    // Throttle per key
    const last = this.lastPlayed.get(key) || 0;
    const t = now();
    if (t - last < this.minInterval) return;
    this.lastPlayed.set(key, t);
    await this.ensureActivated();
    const buf = await this.fetchBuffer(key);
    if (!buf) return;
    this.startVoice(buf);
  }
}

// Export a manager instance honoring the kill-switch
export const soundManager: any = SOUNDS_ENABLED ? new SoundManager() : new NoopSoundManager();

// Expose a safe global for ad-hoc triggers without imports
try { (window as any).__play_ui_sound = (key: string) => { try { soundManager.play(key); } catch {} }; } catch {}




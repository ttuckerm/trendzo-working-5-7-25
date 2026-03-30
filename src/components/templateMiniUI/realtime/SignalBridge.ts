// Realtime Signal Bridge (stub)
// Swappable adapter: in-memory EventTarget for now; replace with Supabase later.

export type BridgeEvent = {
  type: string;
  payload?: any;
};

export interface RealtimeAdapter {
  connect(templateId: string): void;
  disconnect(): void;
  broadcast(evt: BridgeEvent & { tookMs?: number }): void;
  subscribe(handler: (evt: BridgeEvent) => void): () => void;
}

class EventTargetAdapter implements RealtimeAdapter {
  private et = new EventTarget();
  private channel = 'miniui-bridge';
  private templateId: string | null = null;

  connect(templateId: string) {
    this.templateId = templateId;
  }
  disconnect() {
    this.templateId = null;
  }
  broadcast(evt: BridgeEvent & { tookMs?: number }) {
    const detail = { ...evt, templateId: this.templateId };
    this.et.dispatchEvent(new CustomEvent(this.channel, { detail }));
  }
  subscribe(handler: (evt: BridgeEvent) => void): () => void {
    const listener = (e: Event) => {
      const ce = e as CustomEvent;
      handler(ce.detail as BridgeEvent);
    };
    this.et.addEventListener(this.channel, listener as EventListener);
    return () => this.et.removeEventListener(this.channel, listener as EventListener);
  }
}

export class SignalBridge implements RealtimeAdapter {
  private adapter: RealtimeAdapter;

  constructor(adapter?: RealtimeAdapter) {
    // Default to EventTarget adapter; TODO: swap with Supabase adapter here.
    this.adapter = adapter || new EventTargetAdapter();
  }
  connect(templateId: string) { this.adapter.connect(templateId); }
  disconnect() { this.adapter.disconnect(); }
  broadcast(evt: BridgeEvent) { this.adapter.broadcast(evt); }
  subscribe(handler: (evt: BridgeEvent) => void) { return this.adapter.subscribe(handler); }
}

// Singleton instance for app usage
export const signalBridge = new SignalBridge();

// TODO: Supabase adapter interface (keep contained to this file)
export interface SupabaseRealtimeClient {
  channel(name: string): {
    on: (type: string, filter: any, cb: (payload: any) => void) => any
    subscribe: () => Promise<{ status: string }>
    send: (opts: { type: string; event: string; payload: any }) => Promise<void>
    unsubscribe: () => Promise<void>
  }
}



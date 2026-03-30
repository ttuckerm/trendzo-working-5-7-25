// Server-safe event bus replacing client WebSocket usage in server code
import { EventEmitter } from 'events';

class ServerEventBus extends EventEmitter {
  emitEvent(type: string, data: any) {
    this.emit(type, { type, data, timestamp: new Date().toISOString() })
  }
  subscribe(type: string, handler: (payload: any) => void) {
    this.on(type, handler)
    return () => this.off(type, handler)
  }
}

export const serverEventBus = new ServerEventBus()

// Client-safe hook shim for components expecting useWebSocket
// Provides a stable interface without opening real sockets in SSR/Edge
export function useWebSocket(topic: string): { isConnected: boolean; lastMessage: any } {
  // minimal client-state via no-op; components can poll via effects/fetch
  return { isConnected: false, lastMessage: null }
}

export default serverEventBus
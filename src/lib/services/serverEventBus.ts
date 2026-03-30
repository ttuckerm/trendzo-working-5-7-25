export type BusHandler<T = any> = (msg: T) => void

class ServerEventBus {
  private topics = new Map<string, Set<BusHandler>>()
  subscribe(topic: string, fn: BusHandler) {
    if (!this.topics.has(topic)) this.topics.set(topic, new Set())
    this.topics.get(topic)!.add(fn)
    return () => { this.topics.get(topic)?.delete(fn) }
  }
  publish(topic: string, payload: any) {
    const subs = this.topics.get(topic)
    if (!subs) return
    subs.forEach(handler => { try { handler(payload) } catch {} })
  }
}

export const eventBus: ServerEventBus = (globalThis as any).__vl_bus || ((globalThis as any).__vl_bus = new ServerEventBus())

export default eventBus










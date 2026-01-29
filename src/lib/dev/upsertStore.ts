type UpsertItem = any

class DevUpsertStore {
  private store: Map<string, UpsertItem> = new Map()

  upsert(key: string, value: UpsertItem) {
    this.store.set(key, value)
  }

  list(limit = 10) {
    const items = Array.from(this.store.values())
    return { count: items.length, items: items.slice(0, limit) }
  }

  reset() {
    this.store.clear()
  }
}

export const devUpsertStore = new DevUpsertStore()



import { chooseSnapshotAtHorizon } from '@/lib/validation/actuals_join'

describe('chooseSnapshotAtHorizon', () => {
  test('picks latest snapshot <= horizon', () => {
    const base = '2025-09-01T00:00:00.000Z'
    const snaps = [
      { captured_at: '2025-09-01T20:00:00.000Z', views: 200 },
      { captured_at: '2025-09-02T00:00:00.000Z', views: 240 }, // = 24h
      { captured_at: '2025-09-03T00:00:00.000Z', views: 480 }  // = 48h
    ]
    const s = chooseSnapshotAtHorizon(snaps as any, base, 48)
    expect(s?.views).toBe(480)
  })

  test('returns null when all snapshots are after horizon', () => {
    const base = '2025-09-01T00:00:00.000Z'
    const snaps = [{ captured_at: '2025-09-04T00:00:00.000Z', views: 900 }]
    const s = chooseSnapshotAtHorizon(snaps as any, base, 48)
    expect(s).toBeNull()
  })
})




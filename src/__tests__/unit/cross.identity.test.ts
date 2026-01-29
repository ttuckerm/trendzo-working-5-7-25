import { normalizeHandle, videoSignature, isSameVideo } from '@/lib/cross/identity'

const mk = (over: any = {}) => ({
  id: 'x', platform: 'tiktok', platformVideoId: 'vid', creatorId: 'c', niche: 'n', publishTs: new Date().toISOString(), durationSec: 20, caption: 'Do this now: fastest way to grow', audio: { id: 'aud-1' }, metrics: [{ window:'48h', views:100, likes:10, comments:1, shares:1, saves:0 }], vitVersion: '1.0.0', ...over
})

describe('cross.identity', () => {
  it('normalizes handles', () => {
    expect(normalizeHandle('@User.Name')).toBe('username')
    expect(normalizeHandle('USER_name')).toBe('username')
  })
  it('computes stable signatures', () => {
    const v = mk()
    const sig = videoSignature(v as any)
    expect(sig.durationBucket).toBe('short')
    expect(sig.audioSig).toContain('aud:')
  })
  it('matches similar videos', () => {
    const a = mk({ caption: 'Do this now fastest way to grow', audio: { id: 'aud-1' }, durationSec: 19 })
    const b = mk({ caption: 'Fastest way to grow, do this now!', audio: { id: 'aud-1' }, durationSec: 20 })
    expect(isSameVideo(a as any, b as any)).toBeTruthy()
  })
})



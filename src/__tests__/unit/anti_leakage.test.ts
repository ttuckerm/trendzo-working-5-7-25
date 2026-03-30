import { makeTimeSplit, assertNoCreatorOverlap, nearDuplicateHash, assertNoNearDupes, forbidFutureFeatures } from '@/lib/validation/anti_leakage'

describe('anti_leakage helpers', () => {
  test('makeTimeSplit rejects rows after cutoff', () => {
    const cutoff = new Date('2025-09-01T00:00:00.000Z').toISOString()
    const keep = makeTimeSplit(cutoff)
    expect(keep({ event_time: '2025-08-31T23:59:59.000Z' })).toBe(true)
    expect(keep({ event_time: '2025-09-01T00:00:00.000Z' })).toBe(true)
    expect(keep({ event_time: '2025-09-01T00:00:00.001Z' })).toBe(false)
  })

  test('assertNoCreatorOverlap throws on overlap', () => {
    expect(() => assertNoCreatorOverlap(['a','b'], ['c','d'])).not.toThrow()
    expect(() => assertNoCreatorOverlap(['a','b'], ['b','d'])).toThrow(/creator overlap/i)
  })

  test('nearDuplicateHash stable on normalized caption and frame hash', () => {
    const h1 = nearDuplicateHash({ caption: 'Hello,  World!', frameHash: 'abc' })
    const h2 = nearDuplicateHash({ caption: 'hello world', frameHash: 'abc' })
    expect(h1).toBe(h2)
  })

  test('assertNoNearDupes throws on duplicate hash across splits', () => {
    const h = nearDuplicateHash({ caption: 'same text' })
    expect(() => assertNoNearDupes([h], ['x'])).not.toThrow()
    expect(() => assertNoNearDupes([h], [h])).toThrow(/near-duplicate/i)
  })

  test('forbidFutureFeatures throws for 72h metric under 48h horizon', () => {
    const base = '2025-09-01T00:00:00.000Z'
    const ok48 = new Date(Date.parse(base) + 48*3600*1000).toISOString()
    const bad72 = new Date(Date.parse(base) + 72*3600*1000).toISOString()
    expect(() => forbidFutureFeatures({ event_time: base, feature_48h: ok48 }, 48)).not.toThrow()
    expect(() => forbidFutureFeatures({ event_time: base, feature_72h: bad72 }, 48)).toThrow(/future features/i)
  })
})




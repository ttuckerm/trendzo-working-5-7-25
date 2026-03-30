import { describe, it, expect } from 'vitest'
import { sanitizePathSegment } from '../../lib/storage/object_store'

describe('path sanitizer', () => {
  it('rejects traversal and absolute paths', () => {
    expect(()=> sanitizePathSegment('../evil')).toThrow()
    expect(()=> sanitizePathSegment('/abs')).toThrow()
    expect(()=> sanitizePathSegment('\\abs')).toThrow()
  })
  it('allows safe characters and normalizes', () => {
    const s = sanitizePathSegment('models/file_1-Ok.json')
    expect(s).toBe('models/file_1-Ok.json')
  })
})



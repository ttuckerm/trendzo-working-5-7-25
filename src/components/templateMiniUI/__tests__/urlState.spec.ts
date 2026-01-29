import { describe, it, expect } from '@jest/globals';
import { fromHash, toHash, type UrlState } from '@/components/templateMiniUI/router/urlState';

describe('urlState round-trip', () => {
  it('reader panel with template/variant', () => {
    const state: UrlState = { mode: 'reader', panel: 'dashboard', templateId: 't123', variantId: 'v9' };
    const hash = toHash(state);
    expect(hash).toBe('#dashboard?t=t123&v=v9');
    const back = fromHash(hash);
    expect(back).toEqual({ mode: 'reader', panel: 'dashboard', templateId: 't123', variantId: 'v9' });
  });

  it('editor mode with only templateId', () => {
    const state: UrlState = { mode: 'editor', panel: null, templateId: 'abc', variantId: null };
    const hash = toHash(state);
    expect(hash).toBe('#editor?t=abc');
    const back = fromHash(hash);
    expect(back).toEqual({ mode: 'editor', panel: null, templateId: 'abc', variantId: null });
  });

  it('invalid panel normalizes to reader', () => {
    const back = fromHash('#unknown?t=x&v=y');
    expect(back).toEqual({ mode: 'reader', panel: null, templateId: 'x', variantId: 'y' });
  });
});



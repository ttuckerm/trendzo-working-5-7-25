import { describe, it, expect } from '@jest/globals';
import { ValidationEngine } from '@/components/templateMiniUI/validation/ValidationEngine';

function baseSlots() {
  return {
    hook: '',
    onScreenText: 'Hello {brand}',
    captions: '',
    hashtags: [],
    shotList: [],
    thumbnailBrief: '',
    first3sCue: '',
  };
}

describe('ValidationEngine - fixes reduce findings', () => {
  it('applying fixes reduces the number of issues', async () => {
    const engine = new ValidationEngine();
    const start = { slots: baseSlots() };
    const issues = await engine.run(start);
    expect(issues.length).toBeGreaterThan(0);

    // Apply all available fixes sequentially
    let curr = start.slots;
    for (const iss of issues) {
      if (iss.fix) {
        curr = iss.fix.apply(curr);
      }
    }
    const after = await engine.run({ slots: curr });
    expect(after.length).toBeLessThan(issues.length);
  });
});



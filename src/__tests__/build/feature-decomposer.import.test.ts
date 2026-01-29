/**
 * Failing test documenting a build-time import/type bug for fluent-ffmpeg & statics.
 * Expectation: Importing featureDecomposer at module scope should not require Node binaries or types.
 */

jest.mock('fluent-ffmpeg', () => {
  // Export minimal shape used by the module without touching binaries
  const fn: any = (..._args: any[]) => ({
    output: () => fn,
    outputOptions: () => fn,
    addOption: () => fn,
    audioChannels: () => fn,
    audioFrequency: () => fn,
    audioCodec: () => fn,
    format: () => fn,
    on: () => fn,
    run: () => undefined,
  });
  fn.setFfmpegPath = () => {};
  fn.setFfprobePath = () => {};
  fn.ffprobe = (_path: string, cb: (err: any, meta: any) => void) => cb(null, { format: { duration: 1 } });
  return fn;
}, { virtual: true });

jest.mock('ffmpeg-static', () => 'ffmpeg', { virtual: true });
jest.mock('ffprobe-static', () => ({ path: 'ffprobe' }), { virtual: true });

describe('featureDecomposer module import', () => {
  test('does not throw at import time (should FAIL if types/binaries leak)', async () => {
    let threw = false;
    try {
      await import('@/lib/services/featureDecomposer');
    } catch (err) {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});







































































































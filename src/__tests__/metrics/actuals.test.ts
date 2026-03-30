import { joinActualsLast48h } from '@/lib/metrics';

describe('PR4: 48-hour actuals join', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('Test A: no provider → mock=true, matched 0/1', async () => {
    // Ensure no provider is mocked
    const result = await joinActualsLast48h([{ id: 'a' }]);
    expect(result).toEqual({ matched: 0, total: 1, mock: true, byId: {} });
  });

  test('Test B: provider exists → matched 1/2, mock=false', async () => {
    jest.resetModules();
    const path = require('path');
    const abs = path.resolve(process.cwd(), 'src/lib/data/actuals');
    const factory = () => {
      const getActualsSince = async (sinceMs: number) => {
        const now = Date.now();
        return [
          { id: 'a', ts: now - (1 * 60 * 60 * 1000), value: 10 },
          { id: 'b', ts: now - (2 * 60 * 60 * 1000), value: 20 },
        ];
      };
      return { __esModule: true, getActualsSince, default: { getActualsSince } } as any;
    };
    jest.doMock(abs, factory as any, { virtual: true });
    const { joinActualsLast48h } = await import('@/lib/metrics');
    const result = await joinActualsLast48h([{ id: 'a' }, { id: 'c' }]);
    expect(result.matched).toBe(1);
    expect(result.total).toBe(2);
    expect(result.mock).toBe(false);
    expect(result.byId).toHaveProperty('a');
    expect(result.byId).toHaveProperty('b');
  });
});




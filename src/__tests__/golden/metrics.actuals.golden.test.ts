import { joinActualsLast48h } from '@/lib/metrics/actuals';

describe('PR4 golden: actuals join', () => {
  it('stays stable for fixed input', async () => {
    process.env.NEXT_PUBLIC_SHOW_ACTUALS = 'true';
    const { input, expected } = require('./metrics.actuals.golden.json');
    const { total, matched, mock } = await joinActualsLast48h(input);
    expect({ total, matched, mock }).toEqual(expected);
  });
});




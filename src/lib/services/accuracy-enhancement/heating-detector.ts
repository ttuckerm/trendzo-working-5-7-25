export interface HourlyMetrics {
  hour: number;      // hours since upload
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface HeatingResult { suspected: boolean; reason: string; }

export function detectHeatingAnomaly(series: HourlyMetrics[]): HeatingResult {
  if (!series || series.length < 3) return { suspected: false, reason: 'insufficient_data' };

  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const secondPrev = series[series.length - 3];

  const viewSpike = prev.views > 0 ? last.views / prev.views : Infinity;
  const engagementNow = last.likes + last.comments + last.shares;
  const engRatio = last.views > 0 ? engagementNow / last.views : 0;
  const spikeHeated = viewSpike >= 5 && engRatio <= 0.015;

  const prevSpike = secondPrev && secondPrev.views > 0 ? prev.views / secondPrev.views : 1;
  const multiSpike = prevSpike >= 3 && engRatio <= 0.010;

  if (spikeHeated || multiSpike) {
    return { suspected: true, reason: spikeHeated ? '5x_view_spike_low_eng' : 'multi_spike_low_eng' };
  }
  return { suspected: false, reason: 'normal' };
}











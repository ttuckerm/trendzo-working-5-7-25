'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Analytics</h1>
      <GlassCard variant="subtle" disableHoverEffects className="p-8 text-center">
        <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm mb-1">Analytics coming soon</p>
        <p className="text-white/30 text-xs">
          Track your content performance, VPS accuracy, and growth trends.
        </p>
      </GlassCard>
    </div>
  );
}

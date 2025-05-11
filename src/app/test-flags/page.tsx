'use client';

import { useEffect, useState } from 'react';
import { featureFlags } from '@/lib/utils/featureFlags';

export default function TestFlags() {
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlags() {
      try {
        await featureFlags.initialize();
        
        setFlags({
          maintenance_mode: featureFlags.isMaintenanceMode(),
          show_new_feature: featureFlags.isNewFeatureEnabled(),
          max_daily_prompts: featureFlags.getMaxDailyPrompts(),
          enable_analytics: featureFlags.isAnalyticsEnabled(),
          using_supabase: process.env.NEXT_PUBLIC_USE_SUPABASE === 'true',
          actual_use_supabase: process.env.NEXT_PUBLIC_USE_SUPABASE,
          actual_supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flags');
      } finally {
        setLoading(false);
      }
    }

    loadFlags();
  }, []);

  if (loading) return <div>Loading flags...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Feature Flags Test</h1>
      <div className="space-y-2">
        <p><strong>Using Supabase:</strong> {flags.using_supabase ? 'Yes' : 'No'}</p>
        <p><strong>Maintenance Mode:</strong> {flags.maintenance_mode ? 'Yes' : 'No'}</p>
        <p><strong>Show New Feature:</strong> {flags.show_new_feature ? 'Yes' : 'No'}</p>
        <p><strong>Max Daily Prompts:</strong> {flags.max_daily_prompts}</p>
        <p><strong>Analytics Enabled:</strong> {flags.enable_analytics ? 'Yes' : 'No'}</p>
        <hr />
        <p><strong>Actual USE_SUPABASE value:</strong> {flags.actual_use_supabase}</p>
        <p><strong>Actual SUPABASE_URL:</strong> {flags.actual_supabase_url}</p>
      </div>
    </div>
  );
}
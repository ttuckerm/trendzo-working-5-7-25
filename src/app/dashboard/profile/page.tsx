'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Profile</h1>
      <GlassCard variant="subtle" disableHoverEffects className="p-8 text-center">
        <User className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm mb-1">Profile settings coming soon</p>
        <p className="text-white/30 text-xs">
          Manage your creator profile, niche preferences, and account settings.
        </p>
      </GlassCard>
    </div>
  );
}

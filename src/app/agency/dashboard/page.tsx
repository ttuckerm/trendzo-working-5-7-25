import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAgencyId } from '@/lib/auth/agency-utils';
import {
  getAgencyStats,
  getAgencyCreatorsList,
  getAgencyBriefs,
  getAgencyInvites,
  getCoachingInsights,
  type AgencyCreator,
  type AgencyAlert,
} from '@/lib/dashboard/queries';
import DashboardClient from './DashboardClient';
export const dynamic = 'force-dynamic';

function deriveAlerts(creators: AgencyCreator[]): AgencyAlert[] {
  const alerts: AgencyAlert[] = [];
  const now = new Date().toISOString();
  const inactive = creators.filter(c => c.status === 'inactive');
  if (inactive.length > 0) {
    alerts.push({ id: 'alert-inactive', severity: 'warning', message: `${inactive.length} creator${inactive.length > 1 ? 's' : ''} inactive`, detail: inactive.map(c => c.name).join(', '), timestamp: now });
  }
  const lowVPS = creators.filter(c => c.latestVPS > 0 && c.latestVPS < 40);
  if (lowVPS.length > 0) {
    alerts.push({ id: 'alert-low-vps', severity: 'critical', message: `${lowVPS.length} creator${lowVPS.length > 1 ? 's' : ''} below VPS 40`, detail: lowVPS.map(c => `${c.name} (${c.latestVPS})`).join(', '), timestamp: now });
  }
  const noContent = creators.filter(c => c.scriptCount === 0 && c.status === 'active');
  if (noContent.length > 0) {
    alerts.push({ id: 'alert-no-content', severity: 'info', message: `${noContent.length} active creator${noContent.length > 1 ? 's' : ''} with no scripts`, detail: 'Consider generating briefs for these creators', timestamp: now });
  }
  if (alerts.length === 0) {
    alerts.push({ id: 'alert-all-good', severity: 'info', message: 'All systems nominal', detail: 'No issues detected across your roster', timestamp: now });
  }
  return alerts;
}

export default async function AgencyDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let agencyId: string | null = null;
  if (user) {
    agencyId = await getUserAgencyId(user.id);
  }

  if (!user || !agencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080d' }}>
        <div className="text-center">
          <h1 className="font-display text-2xl text-[#e8e8f0] mb-2">No Agency Found</h1>
          <p className="text-sm text-[#8888a0]">Sign in with an account linked to an agency.</p>
        </div>
      </div>
    );
  }

  const [stats, creators, briefs, invites] = await Promise.all([
    getAgencyStats(agencyId),
    getAgencyCreatorsList(agencyId),
    getAgencyBriefs(agencyId),
    getAgencyInvites(agencyId),
  ]);
  const alerts = deriveAlerts(creators);

  const insights = getCoachingInsights(creators);

  return (
    <DashboardClient
      stats={stats}
      creators={creators}
      alerts={alerts}
      briefs={briefs}
      insights={insights}
      invites={invites}
    />
  );
}

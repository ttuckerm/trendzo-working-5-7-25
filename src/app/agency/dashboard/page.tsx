import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAgencyId } from '@/lib/auth/agency-utils';
import {
  getAgencyStats,
  getAgencyCreatorsList,
  getAgencyBriefs,
  getCoachingInsights,
  type AgencyCreator,
  type AgencyAlert,
} from '@/lib/dashboard/queries';
import DashboardClient from './DashboardClient';

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
  // #region agent log
  const _t0 = Date.now(); const _dl = (loc: string, msg: string, data?: any) => fetch('http://127.0.0.1:7620/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'082614'},body:JSON.stringify({sessionId:'082614',location:loc,message:msg,data:{...data,elapsed:Date.now()-_t0},timestamp:Date.now(),hypothesisId:'H-B-dash'})}).catch(()=>{});
  await _dl('dash:start','Dashboard render started');
  // #endregion
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  // #region agent log
  await _dl('dash:auth','getUser done',{hasUser:!!user});
  // #endregion

  let agencyId: string | null = null;
  if (user) {
    agencyId = await getUserAgencyId(user.id);
  }
  // #region agent log
  await _dl('dash:agencyId','getUserAgencyId done',{agencyId});
  // #endregion

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

  // #region agent log
  await _dl('dash:pre-queries','about to run queries');
  // #endregion
  // Run stats, creators, and briefs in parallel (alerts + insights are derived from creators — no extra DB call)
  const [stats, creators, briefs] = await Promise.all([
    getAgencyStats(agencyId),
    getAgencyCreatorsList(agencyId),
    getAgencyBriefs(agencyId),
  ]);
  // Derive alerts from already-fetched creators (avoids getAgencyAlerts calling getAgencyCreatorsList again)
  const alerts = deriveAlerts(creators);
  // #region agent log
  await _dl('dash:queries-done','queries complete',{creators:creators.length,briefs:briefs.length,alerts:alerts.length});
  // #endregion

  const insights = getCoachingInsights(creators);

  // #region agent log
  await _dl('dash:done','Dashboard SSR complete');
  // #endregion
  return (
    <DashboardClient
      stats={stats}
      creators={creators}
      alerts={alerts}
      briefs={briefs}
      insights={insights}
    />
  );
}

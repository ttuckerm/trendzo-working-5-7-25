export type TemplateEventType =
  | 'open'
  | 'variant'
  | 'apply_fix'
  | 'export'
  | 'publish'
  | 'outcome'
  | 'preview_started'
  | 'preview_completed'
  | 'preview_canceled'
  | 'preview_failed'
  | 'validation_started'
  | 'validation_completed'
  | 'fix_applied'
  | 'panel_opened'
  | 'panel_closed';

export interface TemplateEvent {
  event_type: TemplateEventType;
  template_id: string;
  variant_id?: string | null;
  user_id?: string | null;
  platform?: string | null;
  cohort_snapshot?: any;
  metrics_payload?: any;
  ts?: string;
}

export async function logTemplateEvent(evt: TemplateEvent): Promise<void> {
  const row = { ...evt, ts: evt.ts || new Date().toISOString() };
  try {
    await fetch('/api/telemetry/template-event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(row),
      keepalive: true,
    });
  } catch (e) {
    // sandbox best-effort
    console.warn('Telemetry emit failed', e);
  }
}

export async function logTokenUsage(params: { template_id: string; user_id?: string; tokens: number; phase: string; platform?: string }) {
  try {
    await fetch('/api/telemetry/template-event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event_type: 'outcome',
        template_id: params.template_id,
        user_id: params.user_id || null,
        platform: params.platform || null,
        metrics_payload: { type: 'token_usage', tokens: params.tokens, phase: params.phase },
        ts: new Date().toISOString(),
      }),
      keepalive: true,
    });
  } catch (e) {
    console.warn('logTokenUsage failed', e);
  }
}



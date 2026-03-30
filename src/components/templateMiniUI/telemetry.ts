export type TelemetryEvent =
  | { type: 'preview_started'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'preview_completed'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'preview_canceled'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'preview_failed'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'validation_started'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'validation_completed'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'fix_applied'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'ab_variant_created'; templateId: string; variantId: string; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'ab_variant_activated'; templateId: string; variantId: string; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'ab_variant_deleted'; templateId: string; variantId: string; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'panel_opened'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string }
  | { type: 'panel_closed'; templateId: string; variantId?: string | null; tookMs?: number; errorCode?: string | null; ts?: string };

export async function emitTelemetry(evt: TelemetryEvent): Promise<void> {
  const row = { ...evt, ts: evt.ts || new Date().toISOString() };
  try {
    await fetch('/api/telemetry/template-event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(row),
      keepalive: true,
    });
  } catch (e) {
    console.warn('emitTelemetry failed', e);
  }
}


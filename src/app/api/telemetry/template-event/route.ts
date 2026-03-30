import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const BaseEvent = z.object({
  templateId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  tookMs: z.number().int().nonnegative().optional(),
  errorCode: z.string().optional(),
  ts: z.string().datetime().optional(),
});

const TelemetrySchema = z.discriminatedUnion('type', [
  BaseEvent.extend({ type: z.literal('preview_started') }),
  BaseEvent.extend({ type: z.literal('preview_completed') }),
  BaseEvent.extend({ type: z.literal('preview_canceled') }),
  BaseEvent.extend({ type: z.literal('preview_failed') }),
  BaseEvent.extend({ type: z.literal('validation_started') }),
  BaseEvent.extend({ type: z.literal('validation_completed') }),
  BaseEvent.extend({ type: z.literal('fix_applied') }),
  BaseEvent.extend({ type: z.literal('ab_variant_created'), variantId: z.string().min(1) }),
  BaseEvent.extend({ type: z.literal('ab_variant_activated'), variantId: z.string().min(1) }),
  BaseEvent.extend({ type: z.literal('ab_variant_deleted'), variantId: z.string().min(1) }),
  BaseEvent.extend({ type: z.literal('panel_opened') }),
  BaseEvent.extend({ type: z.literal('panel_closed') }),
]);

// Single implementation: sandbox logs to console.
// If/when Supabase is needed, add it here without duplicating exports.
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = TelemetrySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'bad_request', details: parsed.error.issues }, { status: 400 });
    }
    // For sandbox: log only; real implementation can persist
    console.log('[TelemetryEvent]', parsed.data);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}



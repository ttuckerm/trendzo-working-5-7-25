import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TRAINING_V2_ENABLED } from '@/lib/training/feature-availability-matrix';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!
  );

  // ─── Gate 3: Contamination audit check (v2 only) ───────────────────
  if (TRAINING_V2_ENABLED()) {
    const { data: model, error: fetchErr } = await supabase
      .from('model_versions')
      .select('id, contamination_audit_id')
      .eq('id', id)
      .single();

    if (fetchErr || !model) {
      return NextResponse.json(
        { error: fetchErr?.message || 'Model not found' },
        { status: 404 },
      );
    }

    if (!model.contamination_audit_id) {
      return NextResponse.json(
        {
          error: 'Deploy blocked: model has no contamination audit. Train with TRAINING_V2_ENABLED=true to generate an audit.',
          gate: 'contamination_audit',
        },
        { status: 403 },
      );
    }

    // Verify the audit passed
    const { data: audit } = await supabase
      .from('contamination_audit_log')
      .select('passed')
      .eq('id', model.contamination_audit_id)
      .single();

    if (!audit || !audit.passed) {
      return NextResponse.json(
        {
          error: 'Deploy blocked: contamination audit did NOT pass. Contaminated features must be removed before deployment.',
          gate: 'contamination_audit',
        },
        { status: 403 },
      );
    }
  }

  // ─── Auto-deprecate previous active model ──────────────────────────
  await supabase
    .from('model_versions')
    .update({ status: 'deprecated', deprecated_at: new Date().toISOString() })
    .eq('status', 'active');

  // ─── Promote this model ────────────────────────────────────────────
  const { data, error } = await supabase
    .from('model_versions')
    .update({ status: 'active', is_production: true, promoted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, model: data });
}

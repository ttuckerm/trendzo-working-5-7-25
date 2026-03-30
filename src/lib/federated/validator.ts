export function validateDeltaPayload(body: any, maxKeys = 5000): { ok: boolean; reason?: string } {
  if (!body || typeof body !== 'object') return { ok: false, reason: 'bad_body' }
  const raw = JSON.stringify(body||{}).toLowerCase()
  // Reject raw text/media/transcripts
  if (raw.includes('transcript') || raw.includes('raw') || raw.includes('video') || raw.length > 5_000_000) {
    return { ok: false, reason: 'privacy_violation' }
  }
  if (!body.roundId || !body.modelVersion) return { ok: false, reason: 'missing_ids' }
  const d = body.delta || body.weights_delta
  if (!d || typeof d !== 'object') return { ok: false, reason: 'missing_delta' }
  const keys = Object.keys(d)
  if (!keys.length || keys.length > maxKeys) return { ok: false, reason: 'delta_size' }
  for (const k of keys) { const v = d[k]; if (typeof v !== 'number' || !isFinite(v)) return { ok:false, reason: 'delta_type' } }
  const n = Number(body.nExamples || body.n_examples || 0)
  if (!Number.isFinite(n) || n <= 0) return { ok:false, reason: 'n_examples' }
  const g = Number(body.gradNorm || body.grad_norm || 0)
  if (!Number.isFinite(g) || g < 0) return { ok:false, reason: 'grad_norm' }
  return { ok: true }
}



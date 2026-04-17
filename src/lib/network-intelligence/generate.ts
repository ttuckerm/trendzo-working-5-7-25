/**
 * Prompt 44 — Network intelligence orchestrator.
 *
 * Ties together: analyzer (stats) → phraser (LLM/template) → DB writes.
 *
 * Idempotency: each run gets a fresh generation_run_id. Older insights
 * are NOT deleted; they expire via expires_at (default 30 days). The
 * UI shows only the most recent run per (insight_type, niche_scope)
 * pair — that filter lives in the API route, not here.
 */

import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { runAnalyzer, type StatFinding } from './analyzer'
import { phraseFinding } from './phraser'
import {
  loadAgencyNameIndex,
  scanForIdentityLeak,
  passesKAnonymity,
} from './anonymization'

export interface GenerateResult {
  run_id: string
  skipped: boolean
  skipped_reasons: string[]
  written_count: number
  findings_examined: number
  anonymization_rejections: number
  k_anonymity_rejections: number
  global: {
    active_agency_count: number
    niches_scanned: number
    runs_examined: number
  }
}

const DEFAULT_TTL_DAYS = 30

export async function generateNetworkInsights(
  db: SupabaseClient,
): Promise<GenerateResult> {
  const runId = randomUUID()
  const analysis = await runAnalyzer(db)

  if (analysis.findings.length === 0) {
    return {
      run_id: runId,
      skipped: analysis.global.active_agency_count < 30,
      skipped_reasons: analysis.skipped_reasons,
      written_count: 0,
      findings_examined: 0,
      anonymization_rejections: 0,
      k_anonymity_rejections: 0,
      global: analysis.global,
    }
  }

  const nameIndex = await loadAgencyNameIndex(db)
  let anonRejects = 0
  let kRejects = 0
  let written = 0

  for (const finding of analysis.findings) {
    if (!passesKAnonymity(finding.supporting_agency_count)) {
      kRejects++
      continue
    }

    // Phrase the finding. The phraser returns a template-safe fallback
    // if the LLM fails or is disabled.
    let phrased = await phraseFinding(finding)

    // Second pass: scan the final text for agency-name leaks. If the
    // LLM happened to output a real agency name, reject it and fall
    // back to the template.
    const leak = scanForIdentityLeak(phrased.text, nameIndex)
    if (leak) {
      anonRejects++
      // Regenerate via template — guaranteed not to leak because the
      // template only uses statistical numbers + niche names.
      const { text } = templatePhraseForFinding(finding)
      // Template still needs to pass the same leak scan (niche could
      // theoretically match an agency name substring).
      const templateLeak = scanForIdentityLeak(text, nameIndex)
      if (templateLeak) {
        // Give up on this finding entirely rather than publish unsafe text.
        continue
      }
      phrased = { text, model: null, fallback_reason: `identity_leak:${leak}` }
    }

    const expiresAt = new Date(Date.now() + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await db.from('network_insights').insert({
      insight_type: finding.type,
      insight_text: phrased.text,
      statistical_payload: finding.payload,
      confidence_score: finding.confidence,
      supporting_agency_count: finding.supporting_agency_count,
      supporting_run_count: finding.supporting_run_count,
      niche_scope: finding.niche_scope,
      generation_run_id: runId,
      llm_model: phrased.model,
      expires_at: expiresAt,
    })
    if (!error) written++
  }

  return {
    run_id: runId,
    skipped: false,
    skipped_reasons: analysis.skipped_reasons,
    written_count: written,
    findings_examined: analysis.findings.length,
    anonymization_rejections: anonRejects,
    k_anonymity_rejections: kRejects,
    global: analysis.global,
  }
}

// Local helper to get template-only text without invoking the LLM path.
function templatePhraseForFinding(f: StatFinding): { text: string } {
  const s = f.template_slots
  switch (f.type) {
    case 'timing_optimization':
      return {
        text:
          `In the "${s.niche}" niche, posts scheduled around hours ${s.top_hours_utc} (UTC) ` +
          `show ${s.uplift_pct}% higher VPS than the niche average ` +
          `(Spearman ρ=${s.rho}, n=${s.n}, agencies=${s.agency_count}).`,
      }
    case 'format_effectiveness':
      return {
        text:
          `In the "${s.niche}" niche, ${s.best_bucket}-form videos outperform other lengths ` +
          `by ${s.uplift_pct}% on average ` +
          `(Welch t=${s.t}, n=${s.n}, agencies=${s.agency_count}).`,
      }
    case 'retention_correlation':
      return {
        text:
          `In the "${s.niche}" niche, ${s.direction} ` +
          `(Spearman ρ=${s.rho}, n=${s.n}, agencies=${s.agency_count}).`,
      }
    case 'posting_frequency':
      return {
        text:
          `In the "${s.niche}" niche, VPS peaks around ${s.peak_freq} posts per creator per week, ` +
          `with diminishing returns beyond that frequency ` +
          `(quadratic R²=${s.r2}, n=${s.n}, agencies=${s.agency_count}).`,
      }
    default:
      return { text: `Finding for ${f.niche_scope}` }
  }
}

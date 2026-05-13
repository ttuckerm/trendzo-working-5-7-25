import fs from 'node:fs';

const r = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-11.json', 'utf8'));

const nodes = [];
const edges = [];

const getName = (p) => p.split('/').pop();

const meta = {
  'docs/screenshots/audio-screen-shots': {
    type: 'file',
    summary: 'Empty placeholder file in the audio-screenshots asset folder; no content extracted.',
    tags: ['placeholder', 'assets', 'screenshots', 'empty'],
    complexity: 'simple'
  },
  'docs/adaptation.md': {
    type: 'document',
    summary: 'Describes the Adaptation System for detecting platform algorithm shifts via PSI/ECE/drift signals and auto-recalibrating thresholds, weights, and Weather status with a changelog and rollback path.',
    tags: ['documentation', 'adaptation', 'drift-detection', 'calibration', 'changelog'],
    complexity: 'simple'
  },
  'docs/affiliates.md': {
    type: 'document',
    summary: 'Lists referral and affiliate database tables (affiliate_account, referral_link, payout) and the API endpoints plus operations-center UI surface that drive them.',
    tags: ['documentation', 'affiliates', 'referrals', 'api-reference'],
    complexity: 'simple'
  },
  'docs/API_PACK_RESPONSES.md': {
    type: 'document',
    summary: 'Reference describing the response shape of every analysis Pack (Unified Grading Rubric, Editing Coach, etc.) and the shared _meta envelope used by the prediction pipeline.',
    tags: ['documentation', 'api-reference', 'prediction', 'packs', 'schema'],
    complexity: 'complex'
  },
  'docs/APIFY_DEPLOYMENT_CHECKLIST.md': {
    type: 'document',
    summary: 'Step-by-step deployment checklist for the Apify TikTok scraping pipeline covering database setup, environment variables, edge function deployment, and testing phases.',
    tags: ['documentation', 'deployment', 'apify', 'tiktok', 'checklist'],
    complexity: 'complex'
  },
  'docs/APIFY_WEBHOOK_SETUP.md': {
    type: 'document',
    summary: 'Configuration guide for wiring Apify TikTok actor webhooks into Supabase edge functions, including required environment variables and credential retrieval procedures.',
    tags: ['documentation', 'webhook', 'apify', 'supabase', 'configuration'],
    complexity: 'complex'
  },
  'docs/apis.md': {
    type: 'document',
    summary: 'Catalog of HTTP API endpoints exposed by the platform across analyze, validation, video listing, metrics, learning, and admin pipeline control surfaces.',
    tags: ['documentation', 'api-reference', 'endpoints', 'rest'],
    complexity: 'simple'
  },
  'docs/ARCHITECTURAL-LIMITATION-ffmpeg.md': {
    type: 'document',
    summary: 'Root-cause analysis of ffmpeg integration limitations in the current system flow, with options including real-time video download and alternative architectures.',
    tags: ['documentation', 'architecture', 'ffmpeg', 'limitation', 'design-doc'],
    complexity: 'complex'
  },
  'docs/audio system implementation plan.md': {
    type: 'document',
    summary: 'Multi-phase implementation plan for a unified audio system covering codebase audit, user journey mapping, architecture, and core integration framework rollout.',
    tags: ['documentation', 'audio', 'implementation-plan', 'roadmap'],
    complexity: 'moderate'
  },
  'docs/backups.md': {
    type: 'document',
    summary: 'Short specification for backup and restore tooling (CLI scripts, nightly scheduling, and a Jobs-tab status indicator).',
    tags: ['documentation', 'backups', 'operations', 'scripts'],
    complexity: 'simple'
  },
  'docs/beat-sync-usage.md': {
    type: 'document',
    summary: 'User guide for the Beat Sync Controller UI, walking through how to add audio to a template and access the beat-sync editor step by step.',
    tags: ['documentation', 'user-guide', 'beat-sync', 'audio'],
    complexity: 'simple'
  },
  'docs/beehiiv-nurture-setup.md': {
    type: 'document',
    summary: 'Step-by-step Beehiiv setup guide for three nurture-sequence segments (Agency Operator, Business Builder, Side Hustle Seeker) with creation procedures and prerequisites.',
    tags: ['documentation', 'marketing', 'beehiiv', 'email-automation', 'setup-guide'],
    complexity: 'moderate'
  },
  'docs/billing.md': {
    type: 'document',
    summary: 'Reference for the billing and plans surface: Stripe webhook, customer portal, status endpoint, supporting tables, plan gating and 402 quota responses.',
    tags: ['documentation', 'billing', 'stripe', 'quotas', 'api-reference'],
    complexity: 'simple'
  },
  'docs/BMAD-Database-Change-Protocol.md': {
    type: 'document',
    summary: 'BMAD methodology document defining a systematic database change protocol with audit phase, constraint and dependency analysis, and data impact assessment to prevent operational errors.',
    tags: ['documentation', 'database', 'protocol', 'bmad', 'operations'],
    complexity: 'moderate'
  },
  'docs/bmad-implementation-summary.md': {
    type: 'document',
    summary: 'Summary of BMAD methodology integration into the platform, covering error prevention strategies, database components, and algorithm integration deliverables.',
    tags: ['documentation', 'bmad', 'methodology', 'summary', 'operations'],
    complexity: 'moderate'
  },
  'docs/bugs-sla.md': {
    type: 'document',
    summary: 'Defines the Bug SLA Engine targets (P1/P2 response and resolve windows) plus the summary API endpoint and operations-center quality tab widget that surface them.',
    tags: ['documentation', 'bugs', 'sla', 'operations', 'quality'],
    complexity: 'simple'
  },
  'docs/BUSINESS_STRUCTURE_TEMPLATE.md': {
    type: 'document',
    summary: 'Large business-structure template covering the operational and strategic scaffolding for the Trendzo platform across multiple sections.',
    tags: ['documentation', 'business', 'template', 'strategy'],
    complexity: 'complex'
  },
  'docs/CALIBRATOR_EVAL_REPORT.md': {
    type: 'document',
    summary: 'Evaluation report comparing calibrator performance on silent/no-speech vs speech video groups, including guardrail effectiveness analysis.',
    tags: ['documentation', 'evaluation', 'calibration', 'report', 'prediction'],
    complexity: 'moderate'
  },
  'docs/claude-skills-briefing.md': {
    type: 'document',
    summary: 'Briefing document describing the CleanCopy/Trendzo platform overview, tech stack, and six core features for downstream Claude skill agents.',
    tags: ['documentation', 'briefing', 'platform-overview', 'features', 'tech-stack'],
    complexity: 'complex'
  },
  'docs/coach.md': {
    type: 'document',
    summary: 'Describes the Counterfactual Coach system: suggestion types, uplift scoring via scoreDraft, safety gating, suggest/apply APIs, Coach Studio UI, and proof tile criteria.',
    tags: ['documentation', 'coach', 'suggestions', 'uplift', 'api-reference'],
    complexity: 'simple'
  },
  'docs/COMMERCE.md': {
    type: 'document',
    summary: 'Notes on commerce attribution and conversion lift: tracking pixel, SDK, data shape, attribution model, and lift calculation methodology.',
    tags: ['documentation', 'commerce', 'attribution', 'conversion', 'analytics'],
    complexity: 'simple'
  },
  'docs/COMPONENT_DEEP_ANALYSIS.md': {
    type: 'document',
    summary: 'Exhaustive component deep-analysis and remediation tracker covering categories, new architecture context (VPS + briefs), and remediation strategy decisions for every prediction component.',
    tags: ['documentation', 'components', 'remediation', 'audit', 'architecture'],
    complexity: 'complex'
  },
  'docs/COMPONENT_RUBRIC_AUDIT.md': {
    type: 'document',
    summary: 'Audit of all active prediction components (pattern, quantitative, qualitative) with a status legend and per-component rubric evaluation.',
    tags: ['documentation', 'audit', 'components', 'rubric', 'prediction'],
    complexity: 'moderate'
  },
  'docs/CREATOR_BASELINE_ANALYSIS.md': {
    type: 'document',
    summary: 'Detailed analysis of creator-baseline computation for the side-hustles niche, including methodology for per-video deviation metrics and comparison approaches.',
    tags: ['documentation', 'creator-baseline', 'analysis', 'side-hustles', 'methodology'],
    complexity: 'complex'
  },
  'docs/cross_intel.md': {
    type: 'document',
    summary: 'Specifies the Cross-Platform Intelligence system that tracks TikTok to Instagram to YouTube cascades, computes lag metrics, predicts cross-platform virality, and exposes UI and proof tile.',
    tags: ['documentation', 'cross-platform', 'cascades', 'prediction', 'intelligence'],
    complexity: 'moderate'
  }
};

for (const f of r.results) {
  const m = meta[f.path];
  if (!m) {
    console.error('NO META FOR', f.path);
    process.exit(1);
  }
  const idPrefix = m.type === 'document' ? 'document' : 'file';
  nodes.push({
    id: idPrefix + ':' + f.path,
    type: m.type,
    name: getName(f.path),
    filePath: f.path,
    summary: m.summary,
    tags: m.tags,
    complexity: m.complexity
  });
}

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-11.json', JSON.stringify(out, null, 2));
console.log('nodes:', nodes.length, 'edges:', edges.length);

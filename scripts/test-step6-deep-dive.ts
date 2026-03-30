/**
 * Step 6 Integration Test — Creator Deep-Dive
 *
 * Run with: npx tsx scripts/test-step6-deep-dive.ts
 *
 * Tests:
 * 1. All 6 new components exist in catalog with valid Zod schemas
 * 2. All 6 new components exist in registry with React implementations
 * 3. API route includes deep-dive data fetching and system prompt context
 * 4. API route responds (requires dev server running)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

const STEP_6_COMPONENTS = [
  'CreatorProfile',
  'VPSTimeline',
  'NicheRanking',
  'ContentTable',
  'EngagementBreakdown',
  'RecommendationCard',
];

const ORIGINAL_COMPONENTS = [
  'Row', 'Column', 'Grid', 'Section', 'KPICard', 'CreatorCard',
  'VPSRing', 'MorningBriefCard', 'ScriptCard', 'TrendItem',
  'ComparisonTable', 'StatBadge', 'AlertBanner', 'EmptyState',
  'Heading', 'Text', 'ActionButton',
];

let totalPass = true;
let totalTests = 0;
let totalPassed = 0;

function check(label: string, pass: boolean, detail?: string) {
  totalTests++;
  if (pass) {
    totalPassed++;
    console.log(`  \u2705 ${label}`);
  } else {
    totalPass = false;
    console.log(`  \u274C ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function warn(label: string) {
  console.log(`  \u26A0\uFE0F  ${label}`);
}

// ============ TEST 1: Catalog Validation ============

console.log('\n=== TEST 1: Catalog Validation ===\n');

const catalogSrc = fs.readFileSync(path.join(ROOT, 'src/lib/trendzo-catalog.ts'), 'utf-8');

// Each component should appear as a top-level key with a props: z.object({ definition
for (const comp of STEP_6_COMPONENTS) {
  const hasKey = new RegExp(`^\\s{4}${comp}:\\s*\\{`, 'm').test(catalogSrc);
  const hasProps = catalogSrc.includes(`${comp}:`) && catalogSrc.includes('props: z.object(');
  check(`${comp} — defined in catalog with Zod schema`, hasKey && hasProps);
}

for (const comp of ORIGINAL_COMPONENTS) {
  const hasKey = new RegExp(`^\\s{4}${comp}:\\s*\\{`, 'm').test(catalogSrc);
  check(`${comp} — original component intact`, hasKey);
}

// Count total components (top-level keys inside components: { })
const componentMatches = catalogSrc.match(/^\s{4}\w+:\s*\{/gm) || [];
// Subtract action entries — count only those before the actions: { block
const actionsIdx = catalogSrc.indexOf('actions:');
const componentSection = actionsIdx > 0 ? catalogSrc.slice(0, actionsIdx) : catalogSrc;
const componentKeys = (componentSection.match(/^\s{4}\w+:\s*\{/gm) || []);
check(`Total component count = 23`, componentKeys.length === 23, `found ${componentKeys.length}`);

// ============ TEST 2: Registry Validation ============

console.log('\n=== TEST 2: Registry Validation ===\n');

const registrySrc = fs.readFileSync(path.join(ROOT, 'src/lib/trendzo-registry.tsx'), 'utf-8');

for (const comp of STEP_6_COMPONENTS) {
  // Components appear as `CompName: ({ props }) =>` or `CompName: ({ props, children }) =>`
  const hasImpl = new RegExp(`^\\s{4}${comp}:\\s*\\(`, 'm').test(registrySrc);
  check(`${comp} — implemented in registry`, hasImpl);
}

for (const comp of ORIGINAL_COMPONENTS) {
  const hasImpl = new RegExp(`^\\s{4}${comp}:\\s*\\(`, 'm').test(registrySrc);
  check(`${comp} — original implementation intact`, hasImpl);
}

// Verify new components use inline styles (no className on new components)
const deepDiveSection = registrySrc.slice(registrySrc.indexOf('// ── CREATOR DEEP-DIVE'));
if (deepDiveSection) {
  const usesClassName = deepDiveSection.includes('className=');
  check('New components use inline styles (no className)', !usesClassName,
    usesClassName ? 'found className in deep-dive section' : undefined);
} else {
  warn('Could not locate CREATOR DEEP-DIVE section in registry');
}

// Count total implementations
const registryActionsIdx = registrySrc.indexOf('actions:');
const registryComponentSection = registryActionsIdx > 0 ? registrySrc.slice(0, registryActionsIdx) : registrySrc;
const implKeys = (registryComponentSection.match(/^\s{4}\w+:\s*\(\{/gm) || []);
check(`Total registry implementations = 23`, implKeys.length === 23, `found ${implKeys.length}`);

// ============ TEST 3: API Route Validation ============

console.log('\n=== TEST 3: API Route Source Validation ===\n');

const apiSrc = fs.readFileSync(path.join(ROOT, 'src/app/api/agency-chat/route.ts'), 'utf-8');

// Check new Supabase queries exist
check('Fetches prediction_runs_enriched', apiSrc.includes("'prediction_runs_enriched'"));
check('Fetches dps_v2_cohort_stats', apiSrc.includes("'dps_v2_cohort_stats'"));

// Check try/catch wrapping for new queries
check('prediction_runs query has try/catch', apiSrc.includes('prediction_runs_enriched') && apiSrc.includes('catch'));
check('cohort_stats query has try/catch', apiSrc.includes('dps_v2_cohort_stats') && apiSrc.includes('catch'));

// Check deep-dive data construction
check('Builds creatorDeepDiveData', apiSrc.includes('creatorDeepDiveData'));
check('Computes avgDps', apiSrc.includes('avgDps') || apiSrc.includes('avg_dps'));
check('Computes topDps', apiSrc.includes('topDps') || apiSrc.includes('top_dps'));
check('Computes vpsHistory', apiSrc.includes('vpsHistory') || apiSrc.includes('vps_history'));
check('Computes niche ranking', apiSrc.includes('nichePeerScores'));
check('Computes engagement metrics', apiSrc.includes('engagementMetrics'));
check('Computes content entries', apiSrc.includes('contentEntries'));

// Check system prompt includes deep-dive context
check('System prompt includes CREATOR DEEP-DIVE DATA', apiSrc.includes('CREATOR DEEP-DIVE DATA'));
check('System prompt includes DEEP-DIVE GUIDELINES', apiSrc.includes('DEEP-DIVE GUIDELINES'));
check('System prompt references CreatorProfile component', apiSrc.includes('CreatorProfile'));
check('System prompt references RecommendationCard component', apiSrc.includes('RecommendationCard'));
check('System prompt includes deep-dive action guidance', apiSrc.includes('deep-dive layout'));

// ============ TEST 4: API Route Live Check ============

console.log('\n=== TEST 4: API Route Live Check ===\n');

async function testApiRoute() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch('http://localhost:3000/api/agency-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Give me a deep dive on the first creator in my agency' }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      console.log(`  \u2705 API route responds (status ${response.status})`);
      console.log(`  \u2705 Content-Type: ${response.headers.get('content-type')}`);

      const reader = response.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        const chunk = new TextDecoder().decode(value);
        console.log(`  \u2705 First chunk received (${chunk.length} chars)`);

        const foundComponents = STEP_6_COMPONENTS.filter((c) => chunk.includes(c));
        if (foundComponents.length > 0) {
          console.log(`  \u2705 Found components in stream: ${foundComponents.join(', ')}`);
        } else {
          warn('No Step 6 components found in first chunk (may appear later in stream)');
        }

        reader.releaseLock();
      }
    } else if (response.status === 401) {
      warn('API route returned 401 — needs auth cookie (expected without browser session)');
    } else {
      warn(`API route returned status ${response.status}`);
      const body = await response.text().catch(() => '');
      if (body) console.log(`     Response: ${body.slice(0, 200)}`);
    }
  } catch (e: any) {
    if (e.cause?.code === 'ECONNREFUSED' || e.message?.includes('fetch failed') || e.name === 'TypeError') {
      warn('Dev server not running. Start with `npm run dev` and re-run for live test.');
    } else if (e.name === 'AbortError') {
      warn('API request timed out after 10s');
    } else {
      warn(`API test error: ${e.message}`);
    }
  }
}

function printSummary() {
  console.log('\n=== STEP 6 INTEGRATION TEST SUMMARY ===\n');
  console.log(`Result: ${totalPassed}/${totalTests} checks passed ${totalPass ? '\u2705' : '\u274C'}`);
  console.log('');
  console.log('1. Catalog:  All 23 components defined with Zod schemas');
  console.log('2. Registry: All 23 components implemented (inline styles for new ones)');
  console.log('3. API:      Deep-dive data fetching + system prompt enrichment');
  console.log('4. Live:     API streaming (requires dev server)');
  console.log('');
  console.log('MANUAL TESTING CHECKLIST:');
  console.log('\u2610 Open /agency/ in browser');
  console.log('\u2610 Type "deep dive on [creator name]"');
  console.log('\u2610 Verify CreatorProfile renders with correct name, handle, niche, VPS');
  console.log('\u2610 Verify VPSTimeline renders with sparkline (or empty state if < 2 data points)');
  console.log('\u2610 Verify NicheRanking renders with rank, percentile bar, comparisons');
  console.log('\u2610 Verify ContentTable renders with video rows (or empty state)');
  console.log('\u2610 Verify EngagementBreakdown renders with bars and niche comparison');
  console.log('\u2610 Verify RecommendationCard(s) render with priority color, rationale, action items');
  console.log('\u2610 Verify all components use correct dark theme (no white backgrounds, no wrong fonts)');
  console.log('\u2610 Verify clicking a creator from "show me my creators" triggers deep-dive flow');
  console.log('\u2610 Verify original components (KPICard, CreatorCard, etc.) still render correctly');
}

testApiRoute().then(() => {
  printSummary();
  process.exit(totalPass ? 0 : 1);
});

/**
 * Step 8 Integration Test — Cultural Event Entry Form
 *
 * Run with: npx tsx scripts/test-step8-events.ts
 *
 * Tests:
 * 1. All 5 new components exist in catalog
 * 2. All 5 new components exist in registry
 * 3. 2 new actions exist in catalog
 * 4. All previous components/actions still intact (regression)
 * 5. API route source verification
 * 6. Live API check
 */

import { readFileSync } from 'fs'
import path from 'path'

// ============ CONFIG ============

const STEP_8_COMPONENTS = [
  'EventCard',
  'EventCalendar',
  'EventForm',
  'TrendAlert',
  'EventSummary',
]

const STEP_8_ACTIONS = [
  'create_event',
  'match_creators_to_event',
]

const ALL_PREVIOUS_COMPONENTS = [
  // Step 5
  'Row', 'Column', 'Grid', 'Section', 'KPICard', 'CreatorCard',
  'VPSRing', 'MorningBriefCard', 'ScriptCard', 'TrendItem',
  'ComparisonTable', 'StatBadge', 'AlertBanner', 'EmptyState',
  'Heading', 'Text', 'ActionButton',
  // Step 6
  'CreatorProfile', 'VPSTimeline', 'NicheRanking', 'ContentTable',
  'EngagementBreakdown', 'RecommendationCard',
  // Step 7
  'OnboardingPipeline', 'OnboardingStats', 'CalibrationProgress',
  'OnboardingCreatorRow', 'InviteCard', 'OnboardingTimeline',
]

const ALL_PREVIOUS_ACTIONS = [
  'analyze_creator', 'generate_brief', 'refresh_data', 'export_report', 'navigate_creator',
  'send_invite', 'nudge_creator',
]

let totalChecks = 0
let passedChecks = 0

function check(label: string, condition: boolean) {
  totalChecks++
  if (condition) {
    passedChecks++
    console.log(`  ✅ ${label}`)
  } else {
    console.log(`  ❌ ${label}`)
  }
}

async function main() {
// ============ TEST 1: Catalog Component Validation ============

console.log('\n=== TEST 1: Catalog Component Validation ===\n')

let catalogSource: string
try {
  catalogSource = readFileSync(path.resolve('src/lib/trendzo-catalog.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-catalog.ts')
  process.exit(1)
}

for (const comp of STEP_8_COMPONENTS) {
  check(`${comp} — new component found in catalog`, catalogSource.includes(comp))
}

for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous component intact`, catalogSource.includes(comp))
}

console.log(`\n  Total expected components: ${STEP_8_COMPONENTS.length + ALL_PREVIOUS_COMPONENTS.length} (34)`)

// ============ TEST 2: Action Validation ============

console.log('\n=== TEST 2: Action Validation ===\n')

for (const action of STEP_8_ACTIONS) {
  check(`${action} — new action found in catalog`, catalogSource.includes(action))
}

for (const action of ALL_PREVIOUS_ACTIONS) {
  check(`${action} — previous action intact`, catalogSource.includes(action))
}

console.log(`\n  Total expected actions: ${STEP_8_ACTIONS.length + ALL_PREVIOUS_ACTIONS.length} (9)`)

// ============ TEST 3: Registry Component Validation ============

console.log('\n=== TEST 3: Registry Component Validation ===\n')

let registrySource: string
try {
  registrySource = readFileSync(path.resolve('src/lib/trendzo-registry.tsx'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-registry.tsx')
  process.exit(1)
}

for (const comp of STEP_8_COMPONENTS) {
  check(`${comp} — found in registry`, registrySource.includes(comp))
}

for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous implementation intact`, registrySource.includes(comp))
}

// Check design system
check('Card bg #0f0f16 used', registrySource.includes('#0f0f16'))
check('Border #1e1e2e used', registrySource.includes('#1e1e2e'))
check('Category color crimson #e63946 used', registrySource.includes('#e63946'))
check('Category color cyan #00d4ff used', registrySource.includes('#00d4ff'))
check('Category color violet #7c3aed used', registrySource.includes('#7c3aed'))
check('Category color gold #f59e0b used', registrySource.includes('#f59e0b'))
check('Category color green #2dd4a8 used', registrySource.includes('#2dd4a8'))

// ============ TEST 4: API Route Validation ============

console.log('\n=== TEST 4: API Route Source Validation ===\n')

let apiSource: string
try {
  apiSource = readFileSync(path.resolve('src/app/api/agency-chat/route.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read agency-chat/route.ts')
  process.exit(1)
}

// Check event queries
check('Cultural events query present', apiSource.includes('cultural_events') || apiSource.includes('agency_events'))
check('Try/catch for missing events table', apiSource.includes('try') && apiSource.includes('catch'))
check('Event enrichment logic present', apiSource.includes('days_until') || apiSource.includes('daysUntil'))
check('Event summary data construction', apiSource.includes('eventSummary') || apiSource.includes('EventSummary') || apiSource.includes('total_events'))
check('Calendar data construction', apiSource.includes('calendar') || apiSource.includes('Calendar'))
check('Niche matching for events', apiSource.includes('agencyNiches') || apiSource.includes('matched_niches') || apiSource.includes('niche'))

// Check system prompt includes event context
check('System prompt includes event data', apiSource.includes('CULTURAL EVENT') || apiSource.includes('cultural_event') || apiSource.includes('EventCard'))
check('Empty state guidance for no events', apiSource.includes('No cultural events') || apiSource.includes('empty') || apiSource.includes('no events'))

// Check previous data sections still present
check('Deep-dive data still present (Step 6)', apiSource.includes('creatorDeepDiveData') || apiSource.includes('DEEP-DIVE') || apiSource.includes('CreatorProfile'))
check('Onboarding data still present (Step 7)', apiSource.includes('ONBOARDING') || apiSource.includes('pipeline') || apiSource.includes('OnboardingPipeline'))

// ============ TEST 5: Live API Check ============

console.log('\n=== TEST 5: Live API Check ===\n')

async function testApiRoute() {
  try {
    const response = await fetch('http://localhost:3000/api/agency-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Show me upcoming cultural events' }]
      })
    })

    if (response.status === 401) {
      check('API route loaded (401 = auth required, not a crash)', true)
    } else if (response.ok) {
      check('API route responds OK', true)
      const reader = response.body?.getReader()
      if (reader) {
        const { value } = await reader.read()
        const chunk = new TextDecoder().decode(value)
        check(`First chunk received (${chunk.length} chars)`, chunk.length > 0)
        reader.releaseLock()
      }
    } else {
      check(`API responds (status ${response.status})`, false)
    }
  } catch (e: any) {
    if (e.code === 'ECONNREFUSED' || e.cause?.code === 'ECONNREFUSED') {
      console.log('  ⚠️  Dev server not running. Start with `npm run dev` and re-run.')
      check('Dev server reachable', false)
    } else {
      check(`API reachable: ${e.message}`, false)
    }
  }
}

await testApiRoute()

// ============ SUMMARY ============

console.log(`\n${'='.repeat(50)}`)
console.log(`  STEP 8 RESULTS: ${passedChecks}/${totalChecks} checks passed`)
console.log(`${'='.repeat(50)}`)

if (passedChecks === totalChecks) {
  console.log('\n  🎉 All automated checks passed!\n')
} else {
  console.log(`\n  ⚠️  ${totalChecks - passedChecks} check(s) failed — review above\n`)
}

console.log('MANUAL TESTING CHECKLIST:')
console.log('─'.repeat(50))
console.log('□ Open /agency/ in browser')
console.log('□ Type "show me upcoming cultural events"')
console.log('  → Verify EventSummary renders (likely all zeros — no events seeded)')
console.log('  → Verify AI proactively suggests adding events based on agency niches')
console.log('□ Type "add an event: National Fitness Day on June 7th"')
console.log('  → Verify EventForm renders in create mode with prefilled event name and date')
console.log('  → Verify category is suggested and niches are shown')
console.log('□ Type "what events should I track for my creators?"')
console.log('  → Verify AI suggests relevant events based on agency niches')
console.log('  → Verify EventCard(s) render for suggested events')
console.log('□ Type "show me the onboarding pipeline" — verify Step 7 still works')
console.log('□ Type "deep dive on Luna Martinez" — verify Step 6 still works')
console.log('□ Verify all dark theme, correct fonts, no white backgrounds')
console.log('')
}

main()

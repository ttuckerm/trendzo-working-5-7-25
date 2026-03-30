/**
 * Step 10 Integration Test — Batch Brief Generation
 *
 * Run with: npx tsx scripts/test-step10-batch.ts
 *
 * Tests:
 * 1. All 5 new components in catalog
 * 2. All 5 new components in registry
 * 3. 2 new actions in catalog
 * 4. All previous components/actions intact (regression)
 * 5. API route source verification
 * 6. Live API check
 */

import { readFileSync } from 'fs'
import path from 'path'

// ============ CONFIG ============

const STEP_10_COMPONENTS = [
  'BriefGrid',
  'BriefEditor',
  'BatchProgress',
  'CreatorBriefAssignment',
  'BatchSummary',
]

const STEP_10_ACTIONS = [
  'generate_batch_briefs',
  'approve_brief',
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
  // Step 8
  'EventCard', 'EventCalendar', 'EventForm', 'TrendAlert', 'EventSummary',
  // Step 9
  'EventBrief', 'CreatorMatch', 'PushStatus', 'BriefPreview', 'PushConfirmation',
]

const ALL_PREVIOUS_ACTIONS = [
  'analyze_creator', 'generate_brief', 'refresh_data', 'export_report', 'navigate_creator',
  'send_invite', 'nudge_creator',
  'create_event', 'match_creators_to_event',
  'push_brief_to_creators', 'check_push_status',
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

// ============ TEST 1: Catalog ============

console.log('\n=== TEST 1: Catalog Component Validation ===\n')

let catalogSource: string
try {
  catalogSource = readFileSync(path.resolve('src/lib/trendzo-catalog.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-catalog.ts')
  process.exit(1)
}

for (const comp of STEP_10_COMPONENTS) {
  check(`${comp} — new component in catalog`, catalogSource.includes(comp))
}
for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous component intact`, catalogSource.includes(comp))
}
console.log(`\n  Total expected components: ${STEP_10_COMPONENTS.length + ALL_PREVIOUS_COMPONENTS.length} (44)`)

// ============ TEST 2: Actions ============

console.log('\n=== TEST 2: Action Validation ===\n')

for (const action of STEP_10_ACTIONS) {
  check(`${action} — new action in catalog`, catalogSource.includes(action))
}
for (const action of ALL_PREVIOUS_ACTIONS) {
  check(`${action} — previous action intact`, catalogSource.includes(action))
}
console.log(`\n  Total expected actions: ${STEP_10_ACTIONS.length + ALL_PREVIOUS_ACTIONS.length} (13)`)

// ============ TEST 3: Registry ============

console.log('\n=== TEST 3: Registry Component Validation ===\n')

let registrySource: string
try {
  registrySource = readFileSync(path.resolve('src/lib/trendzo-registry.tsx'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-registry.tsx')
  process.exit(1)
}

for (const comp of STEP_10_COMPONENTS) {
  check(`${comp} — found in registry`, registrySource.includes(comp))
}
for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous implementation intact`, registrySource.includes(comp))
}

// Design system
check('Card bg #0f0f16 present', registrySource.includes('#0f0f16'))
check('Border #1e1e2e present', registrySource.includes('#1e1e2e'))
check('Green #2dd4a8 present', registrySource.includes('#2dd4a8'))
check('Gold #f59e0b present', registrySource.includes('#f59e0b'))
check('Violet #7c3aed present', registrySource.includes('#7c3aed'))
check('Crimson #e63946 present', registrySource.includes('#e63946'))
check('Cyan #00d4ff present', registrySource.includes('#00d4ff'))

// ============ TEST 4: API Route ============

console.log('\n=== TEST 4: API Route Source Validation ===\n')

let apiSource: string
try {
  apiSource = readFileSync(path.resolve('src/app/api/agency-chat/route.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read agency-chat/route.ts')
  process.exit(1)
}

check('Batch aggregation logic present', apiSource.includes('batchAggregation') || apiSource.includes('BatchSummary') || apiSource.includes('batch'))
check('Assignment matrix logic present', apiSource.includes('assignmentMatrix') || apiSource.includes('CreatorBriefAssignment') || apiSource.includes('assignment'))
check('Coverage gaps logic present', apiSource.includes('coverageGaps') || apiSource.includes('coverage') || apiSource.includes('missing_niches'))
check('System prompt includes batch data', apiSource.includes('BATCH') || apiSource.includes('batch') || apiSource.includes('BriefGrid'))
check('Previous push data intact', apiSource.includes('PUSH') || apiSource.includes('EventBrief') || apiSource.includes('push'))
check('Previous event data intact', apiSource.includes('CULTURAL EVENT') || apiSource.includes('EventCard'))
check('Previous onboarding data intact', apiSource.includes('ONBOARDING') || apiSource.includes('OnboardingPipeline'))
check('Previous deep-dive data intact', apiSource.includes('DEEP-DIVE') || apiSource.includes('CreatorProfile') || apiSource.includes('creatorDeepDiveData'))

// ============ TEST 5: Live API ============

console.log('\n=== TEST 5: Live API Check ===\n')

async function testApiRoute() {
  try {
    const response = await fetch('http://localhost:3000/api/agency-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Generate briefs for all upcoming events' }]
      })
    })

    if (response.status === 401) {
      check('API route loaded (401 = auth required)', true)
    } else if (response.ok) {
      check('API route responds OK', true)
    } else {
      check(`API responds (status ${response.status})`, false)
    }
  } catch (e: any) {
    if (e.code === 'ECONNREFUSED' || e.cause?.code === 'ECONNREFUSED') {
      console.log('  ⚠️  Dev server not running.')
      check('Dev server reachable', false)
    } else {
      check(`API reachable: ${e.message}`, false)
    }
  }
}

testApiRoute().catch(() => {}).then(() => {
  // ============ SUMMARY ============

  console.log(`\n${'='.repeat(50)}`)
  console.log(`  STEP 10 RESULTS: ${passedChecks}/${totalChecks} checks passed`)
  console.log(`${'='.repeat(50)}`)

  if (passedChecks === totalChecks) {
    console.log('\n  🎉 All automated checks passed!\n')
  } else {
    console.log(`\n  ⚠️  ${totalChecks - passedChecks} check(s) failed — review above\n`)
  }

  console.log('MANUAL TESTING CHECKLIST:')
  console.log('─'.repeat(50))
  console.log('□ Open /agency/ in browser')
  console.log('□ Type "generate briefs for all upcoming events"')
  console.log('  → Verify AI explains no events exist yet (or generates briefs if events were added)')
  console.log('  → If briefs generated: verify BriefGrid renders as card grid')
  console.log('□ Type "show me the brief dashboard"')
  console.log('  → Verify BriefGrid + CreatorBriefAssignment matrix render (or empty states)')
  console.log('□ Type "show me who is assigned to what"')
  console.log('  → Verify CreatorBriefAssignment matrix renders')
  console.log('□ Type "push a brief about summer fitness to Luna Martinez" — verify Step 9 still works')
  console.log('□ Type "show me upcoming cultural events" — verify Step 8 still works')
  console.log('□ Type "deep dive on Priya Sharma" — verify Step 6 still works')
  console.log('□ Verify all dark theme, correct fonts, no regressions')
  console.log('')
})

/**
 * Step 9 Integration Test — Event → Agency Push
 *
 * Run with: npx tsx scripts/test-step9-push.ts
 *
 * Tests:
 * 1. All 5 new components exist in catalog
 * 2. All 5 new components exist in registry
 * 3. 2 new actions exist in catalog
 * 4. All previous components/actions intact (regression)
 * 5. API route source verification
 * 6. Live API check
 */

import { readFileSync } from 'fs'
import path from 'path'

// ============ CONFIG ============

const STEP_9_COMPONENTS = [
  'EventBrief',
  'CreatorMatch',
  'PushStatus',
  'BriefPreview',
  'PushConfirmation',
]

const STEP_9_ACTIONS = [
  'push_brief_to_creators',
  'check_push_status',
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
]

const ALL_PREVIOUS_ACTIONS = [
  'analyze_creator', 'generate_brief', 'refresh_data', 'export_report', 'navigate_creator',
  'send_invite', 'nudge_creator',
  'create_event', 'match_creators_to_event',
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

// ============ TEST 1: Catalog Component Validation ============

console.log('\n=== TEST 1: Catalog Component Validation ===\n')

let catalogSource: string
try {
  catalogSource = readFileSync(path.resolve('src/lib/trendzo-catalog.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-catalog.ts')
  process.exit(1)
}

for (const comp of STEP_9_COMPONENTS) {
  check(`${comp} — new component in catalog`, catalogSource.includes(comp))
}
for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous component intact`, catalogSource.includes(comp))
}
console.log(`\n  Total expected components: ${STEP_9_COMPONENTS.length + ALL_PREVIOUS_COMPONENTS.length} (39)`)

// ============ TEST 2: Action Validation ============

console.log('\n=== TEST 2: Action Validation ===\n')

for (const action of STEP_9_ACTIONS) {
  check(`${action} — new action in catalog`, catalogSource.includes(action))
}
for (const action of ALL_PREVIOUS_ACTIONS) {
  check(`${action} — previous action intact`, catalogSource.includes(action))
}
console.log(`\n  Total expected actions: ${STEP_9_ACTIONS.length + ALL_PREVIOUS_ACTIONS.length} (11)`)

// ============ TEST 3: Registry Validation ============

console.log('\n=== TEST 3: Registry Component Validation ===\n')

let registrySource: string
try {
  registrySource = readFileSync(path.resolve('src/lib/trendzo-registry.tsx'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-registry.tsx')
  process.exit(1)
}

for (const comp of STEP_9_COMPONENTS) {
  check(`${comp} — found in registry`, registrySource.includes(comp))
}
for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous implementation intact`, registrySource.includes(comp))
}

// Design system checks
check('No Tailwind classes', !registrySource.match(/className=["'].*(?:flex |grid |bg-|text-|p-\d|m-\d|rounded-)/))
check('Priority colors present (crimson)', registrySource.includes('#e63946'))
check('Push status color (violet)', registrySource.includes('#7c3aed'))
check('Push status color (gold)', registrySource.includes('#f59e0b'))
check('Push status color (green)', registrySource.includes('#2dd4a8'))

// ============ TEST 4: API Route Validation ============

console.log('\n=== TEST 4: API Route Source Validation ===\n')

let apiSource: string
try {
  apiSource = readFileSync(path.resolve('src/app/api/agency-chat/route.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read agency-chat/route.ts')
  process.exit(1)
}

check('Content briefs query present', apiSource.includes('content_briefs') || apiSource.includes('contentBriefs'))
check('Brief assignments query present', apiSource.includes('brief_assignments') || apiSource.includes('briefAssignments') || apiSource.includes('content_brief_creators'))
check('Brief enrichment logic', apiSource.includes('enrichedBriefs') || apiSource.includes('brief_title') || apiSource.includes('EventBrief'))
check('Creator-event match context', apiSource.includes('creatorEventMatch') || apiSource.includes('CreatorMatch') || apiSource.includes('fit_score'))
check('Try/catch for missing tables', apiSource.includes('try') && apiSource.includes('catch'))
check('System prompt includes push data', apiSource.includes('PUSH') || apiSource.includes('push') || apiSource.includes('EventBrief'))
check('Previous deep-dive data intact', apiSource.includes('creatorDeepDiveData') || apiSource.includes('DEEP-DIVE') || apiSource.includes('CreatorProfile'))
check('Previous onboarding data intact', apiSource.includes('ONBOARDING') || apiSource.includes('OnboardingPipeline'))
check('Previous event data intact', apiSource.includes('CULTURAL EVENT') || apiSource.includes('EventCard'))

// ============ TEST 5: Live API Check ============

;(async () => {
  console.log('\n=== TEST 5: Live API Check ===\n')

  try {
    const response = await fetch('http://localhost:3000/api/agency-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Push a brief about National Fitness Day to my fitness creators' }]
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
      console.log('  ⚠️  Dev server not running — skipping live check')
    } else {
      check(`API reachable: ${e.message}`, false)
    }
  }

  // ============ SUMMARY ============

  console.log(`\n${'='.repeat(50)}`)
  console.log(`  STEP 9 RESULTS: ${passedChecks}/${totalChecks} checks passed`)
  console.log(`${'='.repeat(50)}`)

  if (passedChecks === totalChecks) {
    console.log('\n  🎉 All automated checks passed!\n')
  } else {
    console.log(`\n  ⚠️  ${totalChecks - passedChecks} check(s) failed — review above\n`)
  }

  console.log('MANUAL TESTING CHECKLIST:')
  console.log('─'.repeat(50))
  console.log('□ Open /agency/ in browser')
  console.log('□ Type "push a brief about summer fitness trends to Luna Martinez"')
  console.log('  → Verify CreatorMatch card renders with fit score and reasons')
  console.log('  → Verify EventBrief renders with talking points and content angle')
  console.log('  → Verify PushConfirmation card renders with "Confirm & Push" button')
  console.log('□ Type "show me all my content briefs"')
  console.log('  → Verify BriefPreview cards render (or empty state if no briefs)')
  console.log('□ Type "what is the status of my pushes?"')
  console.log('  → Verify PushStatus renders (or empty state)')
  console.log('□ Type "show me upcoming cultural events" — verify Step 8 still works')
  console.log('□ Type "show me the onboarding pipeline" — verify Step 7 still works')
  console.log('□ Type "deep dive on Marcus Lee" — verify Step 6 still works')
  console.log('□ Verify all dark theme, correct fonts, no regressions')
  console.log('')
})()

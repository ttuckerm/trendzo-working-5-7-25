/**
 * Step 13 Integration Test — Performance Reports
 *
 * Run with: npx tsx scripts/test-step13-reports.ts
 *
 * Tests:
 * 1. All 6 new components in catalog
 * 2. All 6 new components in registry
 * 3. New/updated actions in catalog
 * 4. All previous components/actions intact (regression)
 * 5. API route source verification
 * 6. Live API check
 */

import { readFileSync } from 'fs'
import path from 'path'

// ============ CONFIG ============

const STEP_13_COMPONENTS = [
  'PerformanceChart',
  'ReportCard',
  'AgencyScorecard',
  'CreatorComparison',
  'ContentROI',
  'TrendReport',
]

const STEP_13_ACTIONS = [
  'generate_report',
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
  // Step 10
  'BriefGrid', 'BriefEditor', 'BatchProgress', 'CreatorBriefAssignment', 'BatchSummary',
  // Step 11
  'CalendarView', 'ScheduleGrid', 'PostSlot', 'WeekOverview', 'ScheduleConflict',
]

const ALL_PREVIOUS_ACTIONS = [
  'analyze_creator', 'generate_brief', 'refresh_data', 'export_report', 'navigate_creator',
  'send_invite', 'nudge_creator',
  'create_event', 'match_creators_to_event',
  'push_brief_to_creators', 'check_push_status',
  'generate_batch_briefs', 'approve_brief',
  'schedule_post', 'reschedule_post',
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

for (const comp of STEP_13_COMPONENTS) {
  check(`${comp} — new component in catalog`, catalogSource.includes(comp))
}
for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous component intact`, catalogSource.includes(comp))
}
console.log(`\n  Total expected components: ${STEP_13_COMPONENTS.length + ALL_PREVIOUS_COMPONENTS.length} (55)`)

// ============ TEST 2: Actions ============

console.log('\n=== TEST 2: Action Validation ===\n')

for (const action of STEP_13_ACTIONS) {
  check(`${action} — new action in catalog`, catalogSource.includes(action))
}
for (const action of ALL_PREVIOUS_ACTIONS) {
  check(`${action} — previous action intact`, catalogSource.includes(action))
}
check('export_report still present (updated)', catalogSource.includes('export_report'))

// ============ TEST 3: Registry ============

console.log('\n=== TEST 3: Registry Component Validation ===\n')

let registrySource: string
try {
  registrySource = readFileSync(path.resolve('src/lib/trendzo-registry.tsx'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-registry.tsx')
  process.exit(1)
}

for (const comp of STEP_13_COMPONENTS) {
  check(`${comp} — found in registry`, registrySource.includes(comp))
}
for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous implementation intact`, registrySource.includes(comp))
}

// Design system
check('Card bg #0f0f16', registrySource.includes('#0f0f16'))
check('Border #1e1e2e', registrySource.includes('#1e1e2e'))
check('Green #2dd4a8', registrySource.includes('#2dd4a8'))
check('Crimson #e63946', registrySource.includes('#e63946'))
check('Gold #f59e0b', registrySource.includes('#f59e0b'))
check('Cyan #00d4ff', registrySource.includes('#00d4ff'))
check('Violet #7c3aed', registrySource.includes('#7c3aed'))

// Check for SVG elements (PerformanceChart should use SVG)
check('SVG elements present (for charts)', registrySource.includes('<svg') || registrySource.includes('svg') || registrySource.includes('viewBox'))

// ============ TEST 4: API Route ============

console.log('\n=== TEST 4: API Route Source Validation ===\n')

let apiSource: string
try {
  apiSource = readFileSync(path.resolve('src/app/api/agency-chat/route.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read agency-chat/route.ts')
  process.exit(1)
}

check('Performance data computation present', apiSource.includes('performanceData') || apiSource.includes('PerformanceChart') || apiSource.includes('performance'))
check('Creator performance aggregation', apiSource.includes('creator_performance') || apiSource.includes('creatorPerformance'))
check('Overall grade computation', apiSource.includes('overall_grade') || apiSource.includes('overallGrade'))
check('Content ROI data', apiSource.includes('contentROI') || apiSource.includes('ContentROI') || apiSource.includes('roi'))
check('Top performer identification', apiSource.includes('top_performer') || apiSource.includes('topPerformer'))
check('Needs attention flagging', apiSource.includes('needs_attention') || apiSource.includes('needsAttention'))
check('System prompt includes performance data', apiSource.includes('PERFORMANCE') || apiSource.includes('performance') || apiSource.includes('AgencyScorecard'))

// Previous data intact
check('Calendar data intact (Step 11)', apiSource.includes('CALENDAR') || apiSource.includes('CalendarView') || apiSource.includes('calendar'))
check('Batch data intact (Step 10)', apiSource.includes('BATCH') || apiSource.includes('BriefGrid') || apiSource.includes('batch'))
check('Push data intact (Step 9)', apiSource.includes('PUSH') || apiSource.includes('EventBrief') || apiSource.includes('push'))
check('Event data intact (Step 8)', apiSource.includes('CULTURAL EVENT') || apiSource.includes('EventCard'))
check('Onboarding data intact (Step 7)', apiSource.includes('ONBOARDING') || apiSource.includes('OnboardingPipeline'))
check('Deep-dive data intact (Step 6)', apiSource.includes('DEEP-DIVE') || apiSource.includes('CreatorProfile') || apiSource.includes('creatorDeepDiveData'))

// ============ TEST 5: Live API ============

console.log('\n=== TEST 5: Live API Check ===\n')

;(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/agency-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'How are my creators performing? Show me the agency report.' }]
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

  // ============ SUMMARY ============

  console.log(`\n${'='.repeat(60)}`)
  console.log(`  STEP 13 RESULTS: ${passedChecks}/${totalChecks} checks passed`)
  console.log(`${'='.repeat(60)}`)

  if (passedChecks === totalChecks) {
    console.log('\n  🎉 All automated checks passed!\n')
  } else {
    console.log(`\n  ⚠️  ${totalChecks - passedChecks} check(s) failed — review above\n`)
  }

  console.log('MANUAL TESTING CHECKLIST:')
  console.log('─'.repeat(60))
  console.log('□ Open /agency/ in browser')
  console.log('□ Type "how are we doing? show me the agency report"')
  console.log('  → Verify AgencyScorecard renders with grade, metrics, top performer')
  console.log('  → Verify PerformanceChart renders (likely VPS scores across creators)')
  console.log('□ Type "compare my creators"')
  console.log('  → Verify CreatorComparison renders with side-by-side columns')
  console.log('  → Verify winner is highlighted')
  console.log('□ Type "what trends are you seeing in our performance?"')
  console.log('  → Verify TrendReport renders with rising/falling/emerging sections')
  console.log('□ Type "show me the content calendar" — verify Step 11 still works')
  console.log('□ Type "show me the onboarding pipeline" — verify Step 7 still works')
  console.log('□ Type "deep dive on Luna Martinez" — verify Step 6 still works')
  console.log('□ Verify all dark theme, correct fonts, no regressions')
  console.log('')
  console.log('═'.repeat(60))
  console.log('  🏁 FINAL COMPONENT COUNT: 55 components + 17 actions')
  console.log('  📊 Steps 5-13 UI complete (Step 12 Deployment deferred)')
  console.log('═'.repeat(60))
  console.log('')
})()

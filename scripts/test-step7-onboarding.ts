/**
 * Step 7 Integration Test — Onboarding Management
 *
 * Run with: npx tsx scripts/test-step7-onboarding.ts
 *
 * Tests:
 * 1. All 6 new components exist in catalog
 * 2. All 6 new components exist in registry
 * 3. 2 new actions exist in catalog
 * 4. All previous components still intact (regression check)
 * 5. API route source verification
 */

import { readFileSync } from 'fs'
import path from 'path'

// ============ CONFIG ============

const STEP_7_COMPONENTS = [
  'OnboardingPipeline',
  'OnboardingStats',
  'CalibrationProgress',
  'OnboardingCreatorRow',
  'InviteCard',
  'OnboardingTimeline',
]

const STEP_7_ACTIONS = [
  'send_invite',
  'nudge_creator',
]

const ALL_PREVIOUS_COMPONENTS = [
  // Step 5 originals
  'Row', 'Column', 'Grid', 'Section', 'KPICard', 'CreatorCard',
  'VPSRing', 'MorningBriefCard', 'ScriptCard', 'TrendItem',
  'ComparisonTable', 'StatBadge', 'AlertBanner', 'EmptyState',
  'Heading', 'Text', 'ActionButton',
  // Step 6
  'CreatorProfile', 'VPSTimeline', 'NicheRanking', 'ContentTable',
  'EngagementBreakdown', 'RecommendationCard',
]

const PREVIOUS_ACTIONS = [
  'analyze_creator', 'generate_brief', 'refresh_data', 'export_report', 'navigate_creator',
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

for (const comp of STEP_7_COMPONENTS) {
  check(`${comp} — found in catalog`, catalogSource.includes(comp))
}

for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous component intact`, catalogSource.includes(comp))
}

const totalCatalogComponents = STEP_7_COMPONENTS.length + ALL_PREVIOUS_COMPONENTS.length
console.log(`\n  Total expected components: ${totalCatalogComponents} (29)`)

// ============ TEST 2: Action Validation ============

console.log('\n=== TEST 2: Action Validation ===\n')

for (const action of STEP_7_ACTIONS) {
  check(`${action} — new action found in catalog`, catalogSource.includes(action))
}

for (const action of PREVIOUS_ACTIONS) {
  check(`${action} — previous action intact`, catalogSource.includes(action))
}

const totalActions = STEP_7_ACTIONS.length + PREVIOUS_ACTIONS.length
console.log(`\n  Total expected actions: ${totalActions} (7)`)

// ============ TEST 3: Registry Validation ============

console.log('\n=== TEST 3: Registry Component Validation ===\n')

let registrySource: string
try {
  registrySource = readFileSync(path.resolve('src/lib/trendzo-registry.tsx'), 'utf-8')
} catch {
  console.log('❌ Could not read trendzo-registry.tsx')
  process.exit(1)
}

for (const comp of STEP_7_COMPONENTS) {
  check(`${comp} — found in registry`, registrySource.includes(comp))
}

for (const comp of ALL_PREVIOUS_COMPONENTS) {
  check(`${comp} — previous implementation intact`, registrySource.includes(comp))
}

// Check design system colors are present
check('Card bg #0f0f16 used', registrySource.includes('#0f0f16'))
check('Border color #1e1e2e used', registrySource.includes('#1e1e2e'))
check('Green accent #2dd4a8 used', registrySource.includes('#2dd4a8'))
check('Violet accent #7c3aed used', registrySource.includes('#7c3aed'))
check('Gold accent #f59e0b used', registrySource.includes('#f59e0b'))
check('Crimson accent #e63946 used', registrySource.includes('#e63946'))
check('Cyan accent #00d4ff used', registrySource.includes('#00d4ff'))

// ============ TEST 4: API Route Validation ============

console.log('\n=== TEST 4: API Route Source Validation ===\n')

let apiSource: string
try {
  apiSource = readFileSync(path.resolve('src/app/api/agency-chat/route.ts'), 'utf-8')
} catch {
  console.log('❌ Could not read agency-chat/route.ts')
  process.exit(1)
}

// Check onboarding queries exist
check('Supabase query for onboarding_profiles present', apiSource.includes('onboarding_profiles') || apiSource.includes('onboardingDetails'))
check('Pipeline stage logic present', apiSource.includes('determineStage') || apiSource.includes('pipeline') || apiSource.includes('PIPELINE_STAGES'))
check('Calibration data construction present', apiSource.includes('calibration') || apiSource.includes('CalibrationProgress'))
check('Onboarding stats computation present', apiSource.includes('completion_rate') || apiSource.includes('onboardingStats'))
check('Onboarding timeline data present', apiSource.includes('onboardingTimeline') || apiSource.includes('OnboardingTimeline'))

// Check system prompt includes onboarding context
check('System prompt includes onboarding data context', apiSource.includes('ONBOARDING') || apiSource.includes('onboarding'))
check('System prompt includes pipeline data', apiSource.includes('pipeline') || apiSource.includes('Pipeline'))

// Check existing deep-dive data still present
check('Deep-dive data still present (Step 6)', apiSource.includes('creatorDeepDiveData') || apiSource.includes('DEEP-DIVE') || apiSource.includes('deep_dive') || apiSource.includes('CreatorProfile'))

// Check try/catch for missing tables
check('Error handling for missing tables', apiSource.includes('try') && apiSource.includes('catch'))

// ============ TEST 5: Live API Check ============

console.log('\n=== TEST 5: Live API Check ===\n')

async function testApiRoute() {
  try {
    const response = await fetch('http://localhost:3000/api/agency-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Show me the onboarding pipeline status' }]
      })
    })

    if (response.status === 401) {
      check('API route loaded (401 = auth required, not a crash)', true)
      console.log('  ℹ️  Auth required — test manually in browser')
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
      check(`API route responds (status ${response.status})`, false)
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
}

main()

// ============ SUMMARY ============

console.log(`\n${'='.repeat(50)}`)
console.log(`  STEP 7 RESULTS: ${passedChecks}/${totalChecks} checks passed`)
console.log(`${'='.repeat(50)}`)

if (passedChecks === totalChecks) {
  console.log('\n  🎉 All automated checks passed!\n')
} else {
  console.log(`\n  ⚠️  ${totalChecks - passedChecks} check(s) failed — review above\n`)
}

console.log('MANUAL TESTING CHECKLIST:')
console.log('─'.repeat(50))
console.log('□ Open /agency/ in browser')
console.log('□ Type "show me the onboarding pipeline"')
console.log('  → Verify OnboardingStats renders with funnel numbers')
console.log('  → Verify OnboardingPipeline renders with stages and creator chips')
console.log('□ Type "how is Priya Sharma\'s onboarding going?"')
console.log('  → Verify CalibrationProgress renders with step list and completion ring')
console.log('  → Verify OnboardingTimeline renders with event nodes')
console.log('□ Type "list all creators currently onboarding"')
console.log('  → Verify OnboardingCreatorRow renders for each creator in compact rows')
console.log('□ Type "show me pending invites"')
console.log('  → Verify InviteCard renders (or AI explains no separate invite data)')
console.log('□ Verify all components use dark theme (no white backgrounds)')
console.log('□ Verify all fonts match design system (Playfair/DM Sans/JetBrains Mono)')
console.log('□ Type "deep dive on Jake Chen" — verify Step 6 components still work')
console.log('□ Type "show me my creators" — verify Step 5 CreatorCards still work')
console.log('')

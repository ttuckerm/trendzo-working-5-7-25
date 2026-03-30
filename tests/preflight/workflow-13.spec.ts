import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

const items = [
  { route: '/admin/pipeline', anchor: '#overview', dom: "[data-testid='ingestion-status']", apis: ['/api/pipeline/health'] },
  { route: '/admin/viral-recipe-book', anchor: '#discovery', dom: "[data-testid='template-leaderboard']", apis: ['/api/recipes/summary'] },
  { route: '/admin/prediction-validation', anchor: '#instant', dom: "[data-testid='instant-analyzer']", apis: ['/api/analysis/instant?sample=1'] },
  { route: '/admin/prediction-validation', anchor: '#accuracy', dom: "[data-testid='accuracy-dashboard']", apis: ['/api/validation/summary'] },
  { route: '/admin/prediction-validation', anchor: '#learning', dom: "[data-testid='accuracy-trend-chart']", apis: ['/api/validation/trend'] },
  { route: '/admin/viral-recipe-book', anchor: '#scripts', dom: "[data-testid='script-patterns']", apis: ['/api/scripts/patterns'] },
  { route: '/admin/operations-center', anchor: '#algo-adaptation', dom: "[data-testid='algo-change-detector']", apis: ['/api/adaptation/status'] },
  { route: '/admin/pipeline', anchor: '#cross-platform', dom: "[data-testid='cross-platform-panel']", apis: ['/api/cross/summary'] },
  { route: '/admin/operations-center', anchor: '#rd-layer', dom: "[data-testid='rd-mcp-panel']", apis: ['/api/rd/discoveries'] },
  { route: '/admin/operations-center', anchor: '#process-intel', dom: "[data-testid='process-journeys']", apis: ['/api/process/journeys'] },
  { route: '/admin/operations-center', anchor: '#marketing-inception', dom: "[data-testid='marketing-inception']", apis: ['/api/marketing/summary'] },
  { route: '/admin/operations-center', anchor: '#moat', dom: "[data-testid='moat-insights']", apis: ['/api/moat/benchmarks'] },
  { route: '/admin/operations-center', anchor: '#scale-zero', dom: "[data-testid='scale-zero-panel']", apis: ['/api/scale/status'] },
]

test('Workflow 13-step objectives pass', async ({ page, request }) => {
  for (const it of items) {
    await page.goto(`${BASE_URL}${it.route}?qa=1${it.anchor}`)
    await expect(page.locator(it.dom)).toBeVisible()
    for (const api of it.apis) {
      const res = api.includes('?') ? await request.post(`${BASE_URL}${api}`) : await request.get(`${BASE_URL}${api}`)
      expect(res.ok()).toBeTruthy()
    }
  }
})




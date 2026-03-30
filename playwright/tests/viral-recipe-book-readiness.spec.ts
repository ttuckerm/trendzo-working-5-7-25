import { test, expect } from '@playwright/test'

test('Readiness panel ops buttons emit banner and log', async ({ page, request }) => {
  const root = `${process.env.PW_BASE_URL || 'http://localhost:3000'}`
  // seed first to ensure endpoints respond
  await request.post(`${root}/api/discovery/qa-seed`, { headers: { 'x-user-id': 'local-admin' } })

  await page.goto('/admin/viral-recipe-book')
  await page.getByTestId('discovery-readiness-pill').click()
  await expect(page.getByTestId('discovery-readiness-panel')).toBeVisible()

  // QA Seed
  const qa = page.getByTestId('ops-btn-qa-seed')
  await qa.click()
  await expect(qa).toBeDisabled()
  await expect(page.getByTestId('top-banner')).toBeVisible()

  // Recompute
  const re = page.getByTestId('ops-btn-recompute')
  await re.click()
  await expect(page.getByTestId('top-banner')).toBeVisible()
})



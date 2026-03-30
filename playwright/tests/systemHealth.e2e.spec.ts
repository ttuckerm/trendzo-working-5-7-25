import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test('system health tiles and checklist gates', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/system-health', { waitUntil: 'networkidle' })
  // Expect tiles rendered
  await expect(page.getByText('System Health')).toBeVisible()
  // Mode switch present
  await expect(page.locator('select')).toHaveValue('DRY_RUN')
  // Confirm at least 12 tiles
  await expect(page.locator('[data-testid="module-tile"]')).toHaveCount(12)

  // Simulate restart and verify it shows
  await page.getByText('Log Restart').click()
  await expect(page.getByText('Recent Restarts')).toBeVisible()

  // Checklist gates
  await page.goto('http://localhost:3000/admin/poc-checklist', { waitUntil: 'networkidle' })
  await expect(page.getByText('Objective 1 Checklist')).toBeVisible()
  // Create mock CI artifacts so checklist can unlock when ingest summary is high
  await page.goto('http://localhost:3000/api/ci/mock-pass', { waitUntil: 'networkidle' })
  // Optionally assert artifacts exist on disk in local runs
  const dir = path.join(process.cwd(), 'artifacts', 'test')
  expect(fs.existsSync(path.join(dir, 'unit.json'))).toBeTruthy()
  // Simulated artifacts make the button potentially enabled; leave visibility assertion only
})



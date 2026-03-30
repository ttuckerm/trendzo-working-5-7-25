import { test, expect } from '@playwright/test'

test.describe('Engine Room — Operations Center Ops buttons', () => {
  test('QA seed, recompute, warm examples show banner and log', async ({ page }) => {
    const root = `${process.env.PW_BASE_URL || 'http://localhost:3000'}`

    await page.goto('/admin/engine-room?tab=operations')

    // QA Seed
    const qaBtn = page.getByTestId('ops-btn-qa-seed')
    await expect(qaBtn).toBeVisible()
    await qaBtn.click()
    await expect(qaBtn).toBeDisabled()
    await expect(page.getByTestId('top-banner')).toBeVisible()
    await expect(page.getByTestId('top-banner')).toContainText('✅ Done (Audit #')

    // Recompute
    const recomputeBtn = page.getByTestId('ops-btn-recompute')
    await recomputeBtn.click()
    await expect(recomputeBtn).toBeDisabled()
    await expect(page.getByTestId('top-banner')).toBeVisible()

    // Warm Examples
    const warmBtn = page.getByTestId('ops-btn-warm-examples')
    await warmBtn.click()
    await expect(warmBtn).toBeDisabled()
    await expect(page.getByTestId('top-banner')).toBeVisible()

    // Debug Drawer should contain POST rows with audit ids
    await page.getByRole('button', { name: 'Debug Drawer' }).click()
    const row = page.getByText('/api/admin/pipeline/actions/qa-seed', { exact: false })
    await expect(row).toBeVisible()
  })
})



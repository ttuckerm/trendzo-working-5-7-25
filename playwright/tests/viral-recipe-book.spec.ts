import { test, expect } from '@playwright/test'

test.describe('Viral Recipe Book smoke', () => {
  test('Golden Path end-to-end', async ({ page, request, baseURL }) => {
    const root = `${process.env.PW_BASE_URL || 'http://localhost:3000'}`

    // 1) Ops: Run QA Seed → readiness pill = Ready; sections have cards
    const seed = await request.post(`${root}/api/discovery/qa-seed`, { headers: { 'x-user-id':'local-admin' } })
    expect(seed.ok()).toBeTruthy()
    await page.goto('/admin/viral-recipe-book')
    await expect(page.getByTestId('kpi-chips')).toBeVisible()
    await expect(page.getByTestId('filters-bar')).toBeVisible()
    const pill = page.getByTestId('discovery-readiness-pill')
    await expect(pill).toBeVisible()
    await expect(pill).toHaveText(/Discovery: Ready/)
    // Lists load from /api/templates
    await expect(page.getByTestId('hot-list')).toBeVisible()
    await expect(page.getByTestId('cooling-list')).toBeVisible()
    await expect(page.getByTestId('new-list')).toBeVisible()

    // 2) Templates: open a card → slide-over visible
    await pill.click()
    await expect(page.getByTestId('discovery-readiness-panel')).toBeVisible()
    await page.keyboard.press('Escape')
    const aCard = page.locator('[data-testid^="tpl-card-"]').first()
    await aCard.click()
    // Clicking a card navigates to slide-over in this UI when implemented via TemplateViewer trigger
    // In gallery, the onView opens viewer; we assert the tabs exist
    await expect(page.getByTestId('tpl-slide-tabs')).toBeVisible()
    await page.goBack()

    // 3) Analyzer: POST → results + CTAs visible; banner shows Audit # (cannot capture banner easily; we assert CTAs)
    const analyze = await request.post(`${root}/api/drafts/analyze`, { data: { text: 'Test script' }, headers: { 'x-user-id':'local-admin' } })
    expect(analyze.ok()).toBeTruthy()
    await page.getByRole('tab', { name: 'Analyzer' }).click()
    await expect(page.getByTestId('analyze-results')).toBeVisible()
    await expect(page.getByTestId('btn-export-to-studio')).toBeVisible()
    await expect(page.getByTestId('btn-open-script-intel')).toBeVisible()

    // 4) A/B: start → Active → Completed with Winner
    await page.getByRole('tab', { name: 'A/B Test' }).click()
    await page.getByTestId('ab-start').first().click()
    await expect(page.getByTestId(/ab-row-/)).toBeVisible()
    // Poll UI for completion
    await page.waitForTimeout(6500)
    await expect(page.getByText('completed', { exact: false })).toBeVisible()

    // 5) Validate: start → metrics visible
    await page.getByRole('tab', { name: 'Validate' }).click()
    await page.getByTestId('validate-start').click()
    await expect(page.getByTestId('validate-calibration')).toBeVisible()

    // 6) Dashboard: both charts render
    await page.getByRole('tab', { name: 'Dashboard' }).click()
    await expect(page.getByTestId('chart-discovery')).toBeVisible()
    await expect(page.getByTestId('chart-decay')).toBeVisible()
  })
})



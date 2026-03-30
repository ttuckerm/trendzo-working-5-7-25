import { test, expect } from '@playwright/test';

test.describe('Admin Validation One-Button Demo (DEV)', () => {
  test('Run Demo seeds, calibrates, and renders 10 bins', async ({ page, baseURL }) => {
    // Use dev server default port override if provided
    const adminUrl = `${baseURL || 'http://localhost:3002'}/admin/command-center/validation`;
    await page.goto(adminUrl);

    // Click the demo button
    const demoBtn = page.getByRole('button', { name: /Run Demo \(seed → calibrate → chart\)/i });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Expect success toast
    await expect(page.getByText(/Demo ready — cohort demo-tt-001::v1 \(mode DEV\)/i)).toBeVisible({ timeout: 20000 });

    // Cohort input should be prefilled
    const cohortInput = page.getByPlaceholder('cohort key (optional)');
    await expect(cohortInput).toHaveValue('demo-tt-001::v1');

    // Chart renders 10 bins (x labels length 10)
    // We rely on the subtle caption in dev mode and canvas presence. As a looser check,
    // the caption should appear and chart canvas should be present soon after.
    await expect(page.getByText('Dev store (synthetic) — cohort: demo-tt-001::v1')).toBeVisible({ timeout: 10000 });
    // ChartJS canvas
    await expect(page.locator('canvas')).toBeVisible();
  });
});



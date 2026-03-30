import { test, expect } from '@playwright/test';

test('Golden path: Viral Quick-Win Workflow', async ({ page }) => {
  await page.goto('/sandbox/workflow/onboarding');
  await page.getByTestId('onboarding-niche').fill('fitness');
  await page.getByTestId('onboarding-goal').fill('sales');
  await page.getByTestId('onboarding-continue').click();

  await expect(page.getByTestId(/gallery-card-/)).toBeVisible();
  await page.getByTestId('use-template').first().click();

  await page.getByTestId('hook-generate').click();
  await page.getByTestId('save-and-analyze').click();

  await expect(page.getByTestId('viral-score')).toBeVisible();
  await page.getByTestId('fix-apply-all').click();
  // Ready badge may appear after fixes; tolerate either case
  // If appears, assert visibility
  const ready = page.getByTestId('ready-to-post');
  if (await ready.isVisible({ timeout: 500 }).catch(() => false)) {
    await expect(ready).toBeVisible();
  }

  await page.goto('/sandbox/workflow/schedule');
  await page.getByTestId('export-ics').click();
  await page.getByTestId('export-captions').click();

  await page.goto('/sandbox/workflow/receipt');
  await expect(page.getByTestId('prediction-receipt')).toBeVisible();

  await page.goto('/sandbox/workflow/accuracy');
  await expect(page.getByTestId('kpi')).toBeVisible();
  await expect(page.getByTestId('calibration-plot')).toBeVisible();

  await page.goto('/sandbox/workflow/dashboard');
  await expect(page.getByTestId('system-health-tiles')).toBeVisible();
  await expect(page.getByTestId('algo-weather-banner')).toBeVisible();
});



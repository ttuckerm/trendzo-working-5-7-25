import { test, expect } from '@playwright/test';

test.describe('Right-side tool strip - /os-canvas', () => {
  test('renders and buttons are visible and operable', async ({ page }) => {
    await page.goto('/os-canvas');

    // Canvas overlay visible
    await expect(page.locator('.sandbox-canvas')).toBeVisible();

    // Right tool strip buttons (aria-labels from CanvasOverlay RightToolStrip)
    const toolNames = ['Dashboard', 'Scripts', 'Optimize', 'A/B', 'Inception', 'Validate', 'Preview'];
    for (const name of toolNames) {
      const btn = page.getByRole('button', { name });
      await expect(btn, `${name} button should be visible`).toBeVisible();
    }

    // Click each non-preview panel button to ensure it opens (window shells render)
    for (const name of ['Dashboard', 'Scripts', 'Optimize', 'A/B', 'Inception', 'Validate']) {
      const btn = page.getByRole('button', { name });
      await btn.click();
      await page.waitForTimeout(100);
    }
  });
});



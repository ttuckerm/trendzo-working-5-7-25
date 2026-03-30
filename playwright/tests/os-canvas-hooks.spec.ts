import { test, expect } from '@playwright/test';

test.describe('os-canvas hook order stability', () => {
  test('toggle mode and panels repeatedly without red error overlay', async ({ page }) => {
    await page.goto('/os-canvas');
    // Wait for canvas UI to appear
    await expect(page.locator('.sandbox-canvas')).toBeVisible();
    // Ensure top bar present
    await expect(page.getByRole('button', { name: 'Back to Grid' })).toBeVisible();

    // Toggle mode a few times with keyboard 'e'
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('e');
      await page.waitForTimeout(150);
    }

    // Open/close multiple panels via right tool strip buttons
    const panels = ['Dashboard', 'Scripts', 'Optimize', 'A/B', 'Inception', 'Validate'];
    for (const name of panels) {
      const btn = page.getByRole('button', { name });
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(120);
    }

    // Ensure no React error overlay is present
    const redErrorOverlay = page.locator('text=/Rendered more hooks than during the previous render/i');
    await expect(redErrorOverlay).toHaveCount(0);

    // Ensure CPU calm enough (heuristic: page still responsive and can click Sound settings)
    await page.getByRole('button', { name: 'Sound settings' }).click();
    await expect(page.getByText('Sound')).toBeVisible();
  });
});



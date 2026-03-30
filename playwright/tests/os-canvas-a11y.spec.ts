import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('A11y - /os-canvas', () => {
  test('has no critical accessibility violations', async ({ page }) => {
    await page.goto('/os-canvas');
    // Ensure base UI is rendered
    await expect(page.getByRole('button', { name: 'Recipe Book' })).toBeVisible();

    // Open the Recipe Book window to validate dialog semantics
    await page.getByRole('button', { name: 'Recipe Book' }).click();
    await expect(page.getByRole('dialog', { name: /today’s recipe book/i })).toBeVisible();

    // Run axe against the page
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    const critical = results.violations.filter(v => (v.impact || '').toLowerCase() === 'critical');
    if (critical.length > 0) {
      console.error('Critical a11y violations:', critical.map(v => ({ id: v.id, description: v.description, nodes: v.nodes.length })));
    }
    expect(critical.length).toBe(0);
  });
});



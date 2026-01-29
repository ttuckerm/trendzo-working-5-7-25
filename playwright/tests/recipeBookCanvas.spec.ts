import { test, expect } from '@playwright/test';

test.describe('Canvas OS - Recipe Book', () => {
  test('open window, switch tabs, search', async ({ page }) => {
    await page.goto('/os-canvas');
    // Dock renders
    const dock = page.locator('button[aria-label="Recipe Book"]');
    await expect(dock).toBeVisible();
    // Open window
    await dock.click();
    await expect(page.getByText("Today’s Recipe Book")).toBeVisible();
    // Switch tabs
    await page.getByRole('button', { name: 'COOLING' }).click();
    await page.getByRole('button', { name: 'NEW' }).click();
    // Search
    await page.getByPlaceholder('Search templates').fill('Listicle');
    // Expect some cards visible
    const cards = page.locator('button:has-text("Copy Winner")');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});



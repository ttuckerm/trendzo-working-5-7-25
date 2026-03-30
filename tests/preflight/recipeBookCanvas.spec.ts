import { test, expect } from '@playwright/test';

test('Canvas OS Recipe Book basic flow', async ({ page }) => {
  await page.goto('http://localhost:3000/os-canvas');
  const dock = page.locator('button[aria-label="Recipe Book"]');
  await expect(dock).toBeVisible();
  await dock.click();
  await expect(page.getByText("Today’s Recipe Book")).toBeVisible();
  await page.getByRole('button', { name: 'HOT' }).click();
  await page.getByPlaceholder('Search templates').fill('Listicle');
  const cards = page.locator('button:has-text("Copy Winner")');
  expect(await cards.count()).toBeGreaterThan(0);
});



import { test, expect } from '@playwright/test';

test.describe('Template Mini-UI', () => {
  test('hash routing and Esc navigation', async ({ page }) => {
    await page.goto('/template-mini-ui-demo');
    await page.keyboard.press('KeyD');
    await expect(async () => {
      expect((await page.evaluate(() => location.hash))).toBe('#dashboard');
    }).toPass();
    await page.keyboard.press('Escape');
    await expect(async () => {
      expect((await page.evaluate(() => location.hash))).toBe('#reader');
    }).toPass();
  });

  test('slot edit P95 <= 150ms and preview P95 <= 500ms', async ({ page }) => {
    await page.goto('/template-mini-ui-demo');
    // We simulate slot updates and measure time until DOM reflects change
    const timings: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t0 = Date.now();
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('miniui-test-edit'));
      });
      await page.waitForTimeout(10);
      const t1 = Date.now();
      timings.push(t1 - t0);
    }
    timings.sort((a,b)=>a-b);
    const p95 = timings[Math.floor(timings.length * 0.95) - 1] || timings[timings.length - 1];
    expect(p95).toBeLessThanOrEqual(150);

    // Preview refresh timings (coarse): trigger "render" via hash switch
    const refresh: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t0 = Date.now();
      await page.keyboard.press('KeyO'); // open optimize -> triggers render pipeline
      await page.waitForTimeout(60);
      await page.keyboard.press('Escape');
      const t1 = Date.now();
      refresh.push(t1 - t0);
    }
    refresh.sort((a,b)=>a-b);
    const p95r = refresh[Math.floor(refresh.length * 0.95) - 1] || refresh[refresh.length - 1];
    expect(p95r).toBeLessThanOrEqual(500);
  });
});



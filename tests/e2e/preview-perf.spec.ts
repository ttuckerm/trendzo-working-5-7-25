import { test, expect, Page } from '@playwright/test';

// Performance thresholds as specified in requirements
const SLOT_EDIT_P95_THRESHOLD = 150; // ms
const FULL_REFRESH_P95_THRESHOLD = 500; // ms

test.describe('Template Mini-UI Preview Performance', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable Template Mini-UI feature flag
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('NEXT_PUBLIC_FEATURE_TEMPLATE_MINI_UI', 'true');
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('slot edit performance meets P95 ≤150ms requirement', async () => {
    // Navigate to a page with Template Mini-UI
    await page.goto('/template-mini-ui-demo', { waitUntil: 'networkidle' });
    
    // Wait for component to be ready
    await page.waitForSelector('[data-testid="template-mini-ui"]', { timeout: 10000 });
    
    const measurements: number[] = [];
    const targetMeasurements = 20; // Enough for P95 calculation

    for (let i = 0; i < targetMeasurements; i++) {
      // Measure single slot edit performance
      const startTime = await page.evaluate(() => performance.now());
      
      // Trigger a single slot edit (hook field)
      await page.fill('[data-testid="hook-input"]', `Test hook content ${i}`);
      
      // Wait for preview to complete rendering
      await page.waitForFunction(() => {
        const preview = document.querySelector('[data-testid="preview-area"]');
        return preview && !preview.classList.contains('rendering');
      }, { timeout: 500 });
      
      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;
      
      measurements.push(duration);
      
      // Small delay between measurements
      await page.waitForTimeout(50);
    }

    // Calculate P95
    measurements.sort((a, b) => a - b);
    const p95Index = Math.ceil(measurements.length * 0.95) - 1;
    const p95Duration = measurements[p95Index];

    console.log(`Slot edit performance - P95: ${p95Duration.toFixed(2)}ms`);
    console.log(`Measurements: ${measurements.map(m => m.toFixed(2)).join(', ')}`);

    expect(p95Duration).toBeLessThanOrEqual(SLOT_EDIT_P95_THRESHOLD);
  });

  test('full refresh performance meets P95 ≤500ms requirement', async () => {
    await page.goto('/template-mini-ui-demo', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="template-mini-ui"]', { timeout: 10000 });
    
    const measurements: number[] = [];
    const targetMeasurements = 15; // Slightly fewer for full refresh tests

    for (let i = 0; i < targetMeasurements; i++) {
      const startTime = await page.evaluate(() => performance.now());
      
      // Trigger full refresh by updating multiple slots simultaneously
      await page.evaluate((iteration) => {
        // Simulate bulk update that triggers full refresh
        const event = new CustomEvent('template-bulk-update', {
          detail: {
            slots: {
              hook: `Full refresh hook ${iteration}`,
              onScreenText: `On screen text ${iteration}`,
              captions: `Captions content ${iteration}`,
              hashtags: [`#test${iteration}`, `#performance${iteration}`],
              first3sCue: `First 3s cue ${iteration}`,
              thumbnailBrief: `Thumbnail brief ${iteration}`,
              shotList: [`Shot 1 ${iteration}`, `Shot 2 ${iteration}`]
            }
          }
        });
        document.dispatchEvent(event);
      }, i);
      
      // Wait for full preview refresh to complete
      await page.waitForFunction(() => {
        const preview = document.querySelector('[data-testid="preview-area"]');
        const isNotRendering = preview && !preview.classList.contains('rendering');
        const hasContent = preview && preview.textContent?.includes('Full refresh hook');
        return isNotRendering && hasContent;
      }, { timeout: 1000 });
      
      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;
      
      measurements.push(duration);
      
      // Longer delay between full refresh measurements
      await page.waitForTimeout(100);
    }

    // Calculate P95
    measurements.sort((a, b) => a - b);
    const p95Index = Math.ceil(measurements.length * 0.95) - 1;
    const p95Duration = measurements[p95Index];

    console.log(`Full refresh performance - P95: ${p95Duration.toFixed(2)}ms`);
    console.log(`Measurements: ${measurements.map(m => m.toFixed(2)).join(', ')}`);

    expect(p95Duration).toBeLessThanOrEqual(FULL_REFRESH_P95_THRESHOLD);
  });

  test('skeleton loading appears within 250ms threshold', async () => {
    await page.goto('/template-mini-ui-demo', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="template-mini-ui"]');
    
    // Trigger a slow operation that should show skeleton
    const startTime = await page.evaluate(() => performance.now());
    
    await page.evaluate(() => {
      // Trigger an operation that takes longer than 250ms
      const event = new CustomEvent('template-slow-operation', {
        detail: { simulateDelay: 300 }
      });
      document.dispatchEvent(event);
    });
    
    // Wait for skeleton to appear
    await page.waitForSelector('[data-testid="preview-skeleton"]', { timeout: 300 });
    
    const skeletonAppearTime = await page.evaluate(() => performance.now());
    const skeletonDelay = skeletonAppearTime - startTime;
    
    console.log(`Skeleton appeared after: ${skeletonDelay.toFixed(2)}ms`);
    
    // Should appear within 250ms threshold
    expect(skeletonDelay).toBeLessThanOrEqual(250);
  });

  test('cancel tokens work correctly for interrupted renders', async () => {
    await page.goto('/template-mini-ui-demo', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="template-mini-ui"]');
    
    // Start a slow render
    await page.evaluate(() => {
      const event = new CustomEvent('template-slow-render', {
        detail: { duration: 400 }
      });
      document.dispatchEvent(event);
    });
    
    // Wait a bit, then interrupt with a new render
    await page.waitForTimeout(100);
    
    const interruptTime = await page.evaluate(() => performance.now());
    
    // Interrupt with faster operation
    await page.fill('[data-testid="hook-input"]', 'Interrupting render');
    
    // Should complete quickly due to cancellation
    await page.waitForFunction(() => {
      const preview = document.querySelector('[data-testid="preview-area"]');
      return preview && !preview.classList.contains('rendering');
    }, { timeout: 200 });
    
    const completeTime = await page.evaluate(() => performance.now());
    const totalTime = completeTime - interruptTime;
    
    console.log(`Interrupted render completed in: ${totalTime.toFixed(2)}ms`);
    
    // Should complete much faster than the original 400ms slow render
    expect(totalTime).toBeLessThan(300);
  });

  test('performance metrics are tracked correctly', async () => {
    await page.goto('/template-mini-ui-demo', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="template-mini-ui"]');
    
    // Check if performance stats are available in dev mode
    const perfStats = await page.evaluate(() => {
      // Access performance stats from the component
      const component = document.querySelector('[data-testid="template-mini-ui"]');
      return (component as any)?._performanceStats || null;
    });
    
    if (perfStats) {
      expect(perfStats).toHaveProperty('slotEditP95');
      expect(perfStats).toHaveProperty('fullRefreshP95');
      expect(typeof perfStats.slotEditP95).toBe('number');
      expect(typeof perfStats.fullRefreshP95).toBe('number');
    }
  });

  test('render target specification works correctly', async () => {
    await page.goto('/template-mini-ui-demo', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="template-mini-ui"]');
    
    // Test targeted rendering for individual slots
    const targets = ['hook', 'onScreenText', 'captions', 'hashtags', 'shotList', 'thumbnailBrief', 'first3sCue'];
    
    for (const target of targets) {
      const startTime = await page.evaluate((targetSlot) => {
        const event = new CustomEvent('template-target-render', {
          detail: { target: targetSlot }
        });
        document.dispatchEvent(event);
        return performance.now();
      }, target);
      
      // Wait for targeted render to complete
      await page.waitForFunction((targetSlot) => {
        const renderStatus = document.querySelector('[data-testid="render-status"]');
        return renderStatus && !renderStatus.textContent?.includes(`Rendering: ${targetSlot}`);
      }, target, { timeout: 200 });
      
      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;
      
      console.log(`Target ${target} render: ${duration.toFixed(2)}ms`);
      
      // Targeted renders should be faster than full renders
      expect(duration).toBeLessThan(200);
    }
  });

  test('memory usage stays stable during extended use', async () => {
    await page.goto('/template-mini-ui-demo', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="template-mini-ui"]');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform many operations
    for (let i = 0; i < 50; i++) {
      await page.fill('[data-testid="hook-input"]', `Memory test ${i}`);
      await page.waitForTimeout(20);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
      
      console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
      
      // Memory should not increase by more than 50% during extended use
      expect(memoryIncreasePercent).toBeLessThan(50);
    }
  });
});


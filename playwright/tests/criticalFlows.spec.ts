import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// --- Helper Functions (Optional, but can be useful) ---
async function loginAsDeveloper(page: any) {
  await page.goto(`${BASE_URL}/auth/bypass-auth`);
  await page.getByRole('button', { name: 'Enter Dashboard (Dev Mode)' }).click();
  // Wait for navigation to the dashboard or a known element on the dashboard
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
}

// --- Test Suites ---

test.describe('Mission-critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup for user journey tests, e.g., starting from homepage
    // For most tests here, we'll use the dev bypass login
    await loginAsDeveloper(page);
  });

  // 1. Onboarding & Gated Access (Covered by loginAsDeveloper for now)
  // More specific tests can be added if you have distinct Free/Premium/Platinum flows to check visually

  // 2. Core Creation Loop
  test('User Journey 2.1: Template Library Loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard-view/template-library`);
    // Look for a general indicator that the library page has loaded, 
    // e.g., a heading or a container for template cards.
    await expect(page.getByRole('heading', { name: 'Template Library' })).toBeVisible({ timeout: 10000 });
    // Add a check for at least one template card if possible, once editor is fixed
    // await expect(page.locator('.template-card-class')).toHaveCountGreaterThan(0);
  });

  test('User Journey 2.2: Template Editor Loads', async ({ page }) => {
    let unhandledError: Error | null = null;
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message); // Log the error message for debugging
      // Check specifically for the type error related to 'type' property
      if (error.name === 'TypeError' && error.message.includes("Cannot read properties of undefined (reading 'type')")) {
        unhandledError = error;
      }
      // It might be useful to capture other TypeErrors too, if they are relevant
      // else if (error.name === 'TypeError') {
      // unhandledError = error; // Broader TypeError catching
      // }
    });

    // This test assumes we can navigate to an editor page, even if it's for a new template
    // Or, if your flow requires selecting a template first:
    await page.goto(`${BASE_URL}/dashboard-view/template-library`);
    await expect(page.getByRole('heading', { name: 'Template Library' })).toBeVisible();
    // TODO: Once template cards are functional and selectable, click one.
    // For now, let's assume a direct navigation or a way to open a new template editor.
    // Example: await page.getByText('Create New Template').click();
    await page.goto(`${BASE_URL}/dashboard-view/template-editor`); // Adjust if ID is needed, e.g., /template-editor/new
    await expect(page.getByRole('heading', { name: 'Template Editor' })).toBeVisible({ timeout: 10000 });
    
    // Check for a key element in the editor, e.g., the canvas
    // The main canvas area within EditorCanvas.tsx is a div with classes 'relative', 'bg-white', 'shadow-lg'
    // and it contains the actual canvasRef div.
    const editorCanvasContainer = page.locator('div.relative.bg-white.shadow-lg');
    await expect(editorCanvasContainer).toBeVisible({ timeout: 10000 }); // Increased timeout for canvas rendering

    // Assert that the specific TypeError did not occur
    // Adding a small delay to ensure any async errors have a chance to propagate
    await page.waitForTimeout(500); 
    expect(unhandledError).toBeNull();
  });

  // test('User Journey 2.3: Save/Preview Template', async ({ page }) => {
  //   await page.goto(`${BASE_URL}/dashboard-view/template-editor`); // or a specific template id
  //   await expect(page.getByRole('heading', { name: 'Template Editor' })).toBeVisible();
  //   // TODO: Interact with editor (e.g., add element, change color)
  //   // await page.locator('#color-picker').fill('#FF0000');
  //   await page.getByRole('button', { name: 'Save' }).click();
  //   // TODO: Assert that a save confirmation appears or state changes
  //   // await expect(page.getByText('Template saved!')).toBeVisible();
  //   // TODO: Test preview if a distinct preview mode/button exists
  // });

  // 3. Trend-to-Schedule Loop
  test('User Journey 3.1: Trend Predictions UI Loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard-view/trend-predictions`);
    await expect(page.getByRole('heading', { name: 'Trend Predictions' })).toBeVisible({ timeout: 10000 });
    // TODO: Check for elements that indicate trends are displayed
  });

  test('User Journey 3.2: Template Remix UI Loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard-view/remix`); // Assuming a general remix page or a way to start a remix
    await expect(page.getByRole('heading', { name: 'Remix Templates' })).toBeVisible({ timeout: 10000 }); // Adjust heading as needed
    // TODO: Check for key remix UI elements
  });

  // test('User Journey 3.3: Content Calendar UI Loads', async ({ page }) => {
  //   // This test will be relevant once the Content Calendar is built
  //   await page.goto(`${BASE_URL}/dashboard-view/content-calendar`);
  //   await expect(page.getByRole('heading', { name: 'Content Calendar' })).toBeVisible({ timeout: 10000 });
  // });
});

test.describe('Mission-critical Super Admin Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Admin login - assuming it's the same dev bypass for now, 
    // or a different mechanism if you have one.
    await loginAsDeveloper(page); // Or replace with actual admin login
    await page.goto(`${BASE_URL}/admin`); // Navigate to the admin root
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 10000 }); // Or your admin dashboard's main heading
  });

  // 4. Admin Journey 1: Access Admin Panel (Covered by beforeEach)

  // test('Admin Journey 2: Feature Toggle UI Loads & Interacts', async ({ page }) => {
  //   // This test depends on a specific Feature Management UI being present
  //   await page.goto(`${BASE_URL}/admin/settings/feature-flags`); // Adjust path as needed
  //   await expect(page.getByRole('heading', { name: 'Feature Flags' })).toBeVisible();
  //   // TODO: Find a specific toggle, click it, and verify a change (either in UI or mock an API call effect)
  //   // const exampleToggle = page.getByLabel('Enable Beta Feature X');
  //   // const initialChecked = await exampleToggle.isChecked();
  //   // await exampleToggle.setChecked(!initialChecked);
  //   // await expect(exampleToggle).toBeChecked(!initialChecked);
  // });

  // test('Admin Journey 3: Check Expert Input / System Health UI Loads', async ({ page }) => {
  //   await page.goto(`${BASE_URL}/admin/system/health`); // Adjust path
  //   await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible();
    // TODO: Check for specific elements like CPU usage, Service Status, etc.
    // await expect(page.getByText('API Server')).toBeVisible();

    // TODO: Navigate to expert input UI if it's separate and check it
    // await page.goto(`${BASE_URL}/admin/expert-insights`);
    // await expect(page.getByRole('heading', { name: 'Expert Insights' })).toBeVisible();
  // });
});

test.describe('Phase 5 Objectives 21–30', () => {
  test('Anchors and APIs present', async ({ page, request }) => {
    // 21 Billing & Plans
    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#billing`)
    await expect(page.locator("[data-testid='billing-status']")).toBeVisible()
    const billing = await request.get(`${BASE_URL}/api/billing/status`)
    expect(billing.ok()).toBeTruthy()
    const planJson = await billing.json()
    expect(planJson.plan).toBeTruthy()

    // 22 Usage Metering
    await expect(page.locator("[data-testid='usage-counters']")).toBeVisible()
    const usage = await request.get(`${BASE_URL}/api/billing/usage`)
    expect(usage.headers()['x-usage-month']).toBeDefined()

    // 24 Webhooks & OpenAPI
    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#developers`)
    await expect(page.locator("[data-testid='webhooks-table']")).toBeVisible()
    await expect(page.locator("[data-testid='openapi-link']")).toBeVisible()
    const oas = await request.get(`${BASE_URL}/api/openapi.json`)
    expect(oas.ok()).toBeTruthy()

    // 26 Model Registry
    const act = await request.get(`${BASE_URL}/api/models/active`)
    expect(act.ok()).toBeTruthy()

    // 27 Experiments panel
    await page.goto(`${BASE_URL}/admin/prediction-validation?qa=1#experiments`)
    await expect(page.locator("[data-testid='experiment-panel']")).toBeVisible()

    // 28 Shadow toggle present
    await expect(page.locator("[data-testid='shadow-toggle']")).toBeVisible()

    // 30 Exports buttons visible under developers
    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#developers`)
    await expect(page.locator("[data-testid='export-buttons']")).toBeVisible()

    // 23 Invites & Onboarding
    const inv = await request.post(`${BASE_URL}/api/invites`, { data: { email: 'qa@example.com', role: 'admin', tenant_id: 'demo' } })
    expect(inv.ok()).toBeTruthy()
    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#onboarding`)
    await expect(page.locator("[data-testid='onboarding-checklist']")).toBeVisible()

    // 28 Shadow divergence count
    const div = await request.get(`${BASE_URL}/api/admin/shadow/divergence_count`)
    const divJ = await div.json()
    expect(divJ.count).toBeGreaterThan(0)
  })
})

test.describe('Phase 6 Objectives 31–40', () => {
  test('SLOs, Chaos, Resilience, Security, GA Gate hooks', async ({ page, request }) => {
    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#slos`)
    await expect(page.locator("[data-testid='slo-cards']")).toBeVisible()
    const ops = await request.get(`${BASE_URL}/api/ops/metrics`)
    const opsJ = await ops.json()
    expect(opsJ.windows['1h'].p95_ms).toBeDefined()

    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#chaos`)
    await expect(page.locator("[data-testid='chaos-toggle']")).toBeVisible()
    const chaos = await request.get(`${BASE_URL}/api/ops/chaos/status`)
    const chaosJ = await chaos.json()
    expect(chaosJ.active).toBeFalsy()

    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#resilience`)
    await expect(page.locator("[data-testid='region-health']")).toBeVisible()
    const dr = await request.get(`${BASE_URL}/api/ops/dr/status`)
    const drJ = await dr.json()
    expect(drJ.rpo_minutes).toBeGreaterThanOrEqual(0)

    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#security`)
    await expect(page.locator("[data-testid='zap-report-link']")).toBeVisible()

    await page.goto(`${BASE_URL}/admin/operations-center?qa=1#ga-gate`)
    await expect(page.locator("[data-testid='ga-gate-panel']")).toBeVisible()
    const gate = await request.get(`${BASE_URL}/api/ga/last-run`)
    const gateJ = await gate.json()
    expect(['PASS','FAIL']).toContain(gateJ.status)
  })
})

test.describe('Phase 7 Objectives 41–50', () => {
  test('Operations Center objectives present and APIs respond', async ({ page, request }) => {
    const items = [
      { route: '/operations-center?qa=1#incidents', selector: "[data-testid='incidents-table']", apis: ['/api/oncall/now'] },
      { route: '/operations-center?qa=1#quality', selector: "[data-testid='bug-sla']", apis: ['/api/bugs/sla/summary'] },
      { route: '/operations-center?qa=1#voc', selector: "[data-testid='voc-panel']", apis: ['/api/feedback/summary'] },
      { route: '/operations-center?qa=1#docs', selector: "[data-testid='docs-index']", apis: ['/api/docs/index'] },
      { route: '/operations-center?qa=1#developers', selector: "[data-testid='integrations-zapier-make']", apis: ['/api/integrations/zapier/test','/api/integrations/make/test'] },
      { route: '/operations-center?qa=1#affiliates', selector: "[data-testid='affiliate-panel']", apis: ['/api/affiliates/payouts'] },
      { route: '/operations-center?qa=1#growth', selector: "[data-testid='growth-analytics']", apis: ['/api/growth/summary'] },
      { route: '/operations-center?qa=1#warehouse', selector: "[data-testid='warehouse-status']", apis: ['/api/warehouse/manifest'] },
      { route: '/operations-center?qa=1#release', selector: "[data-testid='release-notes']", apis: ['/api/release/notes/latest'] }
    ]
    for (const it of items) {
      await page.goto(`${BASE_URL}${it.route}`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector(it.selector)
      for (const api of it.apis) {
        const res = await request.get(`${BASE_URL}${api}`)
        expect(res.ok()).toBeTruthy()
      }
    }
  })
})
// --- Additional Test Ideas (to be fleshed out later) ---

// test.describe('Form Submissions', () => {
//   test('Contact form submission', async ({ page }) => {
//     // ...
//   });
// });

// test.describe('API Route Checks (Basic)', () => {
//   test('GET /api/ping should return 200 and pong', async ({ request }) => {
//     const response = await request.get(`${BASE_URL}/api/ping`);
//     expect(response.ok()).toBeTruthy();
//     expect(await response.json()).toEqual(expect.objectContaining({ message: 'pong' }));
//   });
// }); 
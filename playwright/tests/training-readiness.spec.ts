/**
 * Training Readiness – Label & Reprocess E2E tests
 *
 * Precondition: the DB must contain at least one not-ready run with
 *   - Missing actual_dps  → enables "Label now"
 *   - Missing raw_result / components or wrong status → enables "Reprocess"
 *
 * These tests verify that after a label or reprocess action the summary
 * cards update consistently and the "last synced" timestamp refreshes.
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const TRAINING_URL = `${BASE_URL}/admin/operations/training`;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsDeveloper(page: Page) {
  await page.goto(`${BASE_URL}/auth/bypass-auth`);
  await page.getByRole('button', { name: 'Enter Dashboard (Dev Mode)' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
    timeout: 10_000,
  });
}

async function navigateToReadinessTab(page: Page) {
  await page.goto(TRAINING_URL);
  await page.getByRole('button', { name: 'Training Readiness' }).click();
  // Wait for summary cards to render — "Total Runs" card is always present
  await expect(page.getByText('Total Runs')).toBeVisible({ timeout: 15_000 });
}

/** Read the numeric value displayed next to a ReadinessCard label. */
async function cardValue(page: Page, label: string): Promise<number> {
  // Each card renders: <span class="text-xs text-gray-500">{label}</span>
  // followed by <p class="text-xl font-semibold ...">value</p>
  // Both live inside the same parent <div>.
  const card = page.locator('div', { has: page.getByText(label, { exact: true }) });
  const valueEl = card.locator('p.text-xl');
  const raw = await valueEl.first().innerText();
  return parseInt(raw.replace(/,/g, ''), 10) || 0;
}

/** Capture the three numbers we care about. */
async function snapshot(page: Page) {
  const [totalRuns, trainingReady, missingActualDps] = await Promise.all([
    cardValue(page, 'Total Runs'),
    cardValue(page, 'Training Ready'),
    cardValue(page, 'Missing actual_dps'),
  ]);
  return { totalRuns, trainingReady, missingActualDps };
}

/** Return the current "synced ..." timestamp text, or null. */
async function syncedText(page: Page): Promise<string | null> {
  const el = page.locator('span', { hasText: /^synced / });
  if ((await el.count()) === 0) return null;
  return el.first().innerText();
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Training Readiness – Label & Reprocess', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDeveloper(page);
  });

  test('labeling a not-ready run updates cards + synced timestamp', async ({
    page,
  }) => {
    await navigateToReadinessTab(page);

    // 1. Capture "before" snapshot
    const before = await snapshot(page);
    const syncBefore = await syncedText(page);

    // There must be at least one "Label now" button visible
    const labelBtn = page.getByRole('button', { name: 'Label now' }).first();
    await expect(labelBtn).toBeVisible({ timeout: 10_000 });

    // 2. Open the label drawer
    await labelBtn.click();
    await expect(page.getByText('Label Actual DPS')).toBeVisible();

    // 3. Fill in minimal engagement metrics (views is required)
    const viewsInput = page
      .locator('div', { has: page.getByText('Views', { exact: true }) })
      .locator('input[type="number"]');
    await viewsInput.fill('50000');

    const likesInput = page
      .locator('div', { has: page.getByText('Likes', { exact: true }) })
      .locator('input[type="number"]');
    await likesInput.fill('2500');

    const commentsInput = page
      .locator('div', { has: page.getByText('Comments', { exact: true }) })
      .locator('input[type="number"]');
    await commentsInput.fill('150');

    // 4. Submit
    await page
      .getByRole('button', { name: /Calculate.*Save/i })
      .click();

    // Wait for success indicator
    await expect(page.getByText('Labeled successfully')).toBeVisible({
      timeout: 15_000,
    });

    // 5. Wait for drawer to auto-close + refetch to complete
    //    The drawer auto-closes after 1.2s, then refetches both APIs.
    await expect(page.getByText('Label Actual DPS')).not.toBeVisible({
      timeout: 10_000,
    });

    // Give refetch time to round-trip and React to re-render cards
    await page.waitForTimeout(3_000);

    // 6. Capture "after" snapshot
    const after = await snapshot(page);

    // ── Assertions ───────────────────────────────────────────────────────

    // Total runs should NOT change (labeling doesn't create or delete runs)
    expect(after.totalRuns).toBe(before.totalRuns);

    // Training Ready should go up by at least 1
    expect(after.trainingReady).toBeGreaterThanOrEqual(
      before.trainingReady + 1,
    );

    // Missing actual_dps should go down by at least 1
    expect(after.missingActualDps).toBeLessThanOrEqual(
      before.missingActualDps - 1,
    );

    // Consistency: total = ready + not-ready-gap (not-ready rows shown)
    const notReadyHeader = page.locator('span', {
      hasText: /Not-Ready Runs \(\d+\)/,
    });
    if ((await notReadyHeader.count()) > 0) {
      const headerText = await notReadyHeader.first().innerText();
      const tableCount = parseInt(
        headerText.match(/\((\d+)\)/)?.[1] ?? '0',
        10,
      );
      // Table count should equal total - ready (capped at 50)
      const expectedGap = Math.min(
        after.totalRuns - after.trainingReady,
        50,
      );
      expect(tableCount).toBe(expectedGap);
    }

    // "synced" timestamp must have changed (or appeared for the first time)
    const syncAfter = await syncedText(page);
    expect(syncAfter).not.toBeNull();
    if (syncBefore) {
      expect(syncAfter).not.toBe(syncBefore);
    }
  });

  test('reprocessing a not-ready run updates cards + synced timestamp', async ({
    page,
  }) => {
    await navigateToReadinessTab(page);

    // 1. Capture "before" snapshot
    const before = await snapshot(page);
    const syncBefore = await syncedText(page);

    // There must be at least one "Reprocess" button visible
    const reprocessBtn = page
      .getByRole('button', { name: 'Reprocess' })
      .first();
    await expect(reprocessBtn).toBeVisible({ timeout: 10_000 });

    // 2. Click Reprocess
    await reprocessBtn.click();

    // Should see a "Running…" or "Queuing…" indicator appear
    await expect(
      page.getByText(/Running…|Queuing…/).first(),
    ).toBeVisible({ timeout: 10_000 });

    // 3. Wait for completion — poll shows "Fixed" then cleans up after 1.5s
    //    The reprocess polls every 3s; total budget ~60s for a pipeline re-run.
    await expect(page.getByText('Fixed').first()).toBeVisible({
      timeout: 60_000,
    });

    // 4. Wait for post-completion refetch (1.5s delay + round-trip)
    await page.waitForTimeout(5_000);

    // 5. Capture "after" snapshot
    const after = await snapshot(page);

    // ── Assertions ───────────────────────────────────────────────────────

    // Total runs stays the same or increases by 1 (rerun creates a new run)
    expect(after.totalRuns).toBeGreaterThanOrEqual(before.totalRuns);

    // Training Ready should go up (the fix strategies make the run ready)
    expect(after.trainingReady).toBeGreaterThanOrEqual(
      before.trainingReady + 1,
    );

    // "synced" timestamp must have changed
    const syncAfter = await syncedText(page);
    expect(syncAfter).not.toBeNull();
    if (syncBefore) {
      expect(syncAfter).not.toBe(syncBefore);
    }
  });
});

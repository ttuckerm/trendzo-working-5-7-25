// src/components/tests/critical-journeys.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  // Journey 1: Onboarding & Gated Access
  test('1. User completes onboarding and sees correct features', async ({ page }) => {
    // Navigate to sign up
    await page.click('text=Sign up');
    
    // Fill sign up form (placeholder selectors)
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Verify we're redirected to dashboard with correct features
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="feature-badge"]')).toBeVisible();
  });

  // Journey 2: Core Creation Loop
  test('2. User creates content from template', async ({ page }) => {
    // Go to template library
    await page.click('text=Templates');
    await expect(page).toHaveURL('/templates');
    
    // Click on a template
    await page.click('[data-testid="template-card"]:first-child');
    
    // Verify editor opens
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();
    
    // Make a change and save
    await page.fill('[data-testid="template-title"]', 'My Template');
    await page.click('text=Save');
    
    // Verify save confirmation
    await expect(page.locator('text=Saved successfully')).toBeVisible();
  });

  // Journey 3: Trend-to-Schedule Loop
  test('3. User acts on trend prediction', async ({ page }) => {
    // Navigate to trends
    await page.click('text=Trends');
    
    // Click on trend alert
    await page.click('[data-testid="trend-alert"]:first-child');
    
    // Click remix
    await page.click('text=Remix');
    
    // Add to calendar
    await page.click('text=Add to Calendar');
    
    // Verify calendar event created
    await expect(page.locator('[data-testid="calendar-event"]')).toBeVisible();
  });
});

test.describe('Critical Admin Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/admin');
  });

  // Journey 4: Feature Orchestration
  test('4. Admin toggles feature and it reflects for users', async ({ page, context }) => {
    // Toggle a feature
    await page.click('[data-testid="feature-toggle-trend-prediction"]');
    
    // Open user view in new page
    const userPage = await context.newPage();
    await userPage.goto('http://localhost:3000');
    
    // Verify feature is enabled/disabled for user
    await expect(userPage.locator('[data-testid="trend-prediction-feature"]')).toBeVisible();
  });

  // Journey 5: Expert Insight Injection
  test('5. Admin injects insights via AI Brain', async ({ page }) => {
    // Navigate to AI Brain
    await page.click('text=AI Brain');
    
    // Enter insight
    await page.fill('[data-testid="ai-brain-input"]', 'Increase trend threshold to 0.9');
    await page.click('text=Submit');
    
    // Verify preview updates
    await expect(page.locator('[data-testid="preview-pane"]')).toContainText('0.9');
    
    // Verify audit log
    await expect(page.locator('[data-testid="audit-log"]')).toContainText('threshold updated');
  });

  // Journey 6: System Health & Rollback
  test('6. Admin monitors health and can rollback', async ({ page }) => {
    // Go to health dashboard
    await page.click('text=System Health');
    
    // Simulate error (this would need backend support)
    await page.click('[data-testid="simulate-error"]');
    
    // Verify error appears
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
    
    // Click rollback
    await page.click('text=Rollback');
    
    // Verify rollback success
    await expect(page.locator('text=Rollback successful')).toBeVisible();
  });
});
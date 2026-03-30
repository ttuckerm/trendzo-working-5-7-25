import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test('Partner Kit panel and endpoints', async ({ page, request }) => {
  await page.goto(`${BASE_URL}/admin/operations-center?qa=1#developers`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator("[data-testid='partner-kit']")).toBeVisible()
  await expect(page.locator("[data-testid='download-partner-kit']")).toBeVisible()
  await expect(page.locator("[data-testid='sheets-pack']")).toBeVisible()

  const kit = await request.get(`${BASE_URL}/api/partners/kit`)
  expect(kit.ok()).toBeTruthy()
  expect((await kit.body()).byteLength).toBeGreaterThan(0)

  const sheets = await request.get(`${BASE_URL}/api/partners/sheets/download`)
  expect(sheets.ok()).toBeTruthy()
  expect((await sheets.body()).byteLength).toBeGreaterThan(0)

  const zap = await request.post(`${BASE_URL}/api/integrations/zapier/test`)
  expect(zap.ok()).toBeTruthy()
  const make = await request.post(`${BASE_URL}/api/integrations/make/test`, { data: { hello: 'world' } })
  expect(make.ok()).toBeTruthy()
  expect(make.headers()['x-tz-signature']).toBeTruthy()

  const catalog = await request.get(`${BASE_URL}/api/integrations/zapier/catalog`)
  const catJson = await catalog.json()
  expect(Array.isArray(catJson.templates)).toBeTruthy()
  expect(catJson.templates.length).toBeGreaterThanOrEqual(6)
})




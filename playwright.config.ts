import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  use: {
    headless: true,
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3002',
  },
  webServer: {
    command: 'npm run dev',
    url: process.env.PW_BASE_URL || 'http://localhost:3002',
    reuseExistingServer: true,
    env: { NEXT_PUBLIC_SANDBOX_CANVAS: 'true' },
    timeout: 180000,
  },
});

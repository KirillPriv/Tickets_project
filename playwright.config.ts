import { defineConfig } from '@playwright/test'
import path from 'node:path'

const evidenceDirectory = process.env.EVENTFLOW_EVIDENCE_DIR ?? path.resolve('../_artifacts/evidence/S02')
const checkoutTests = ['booking.spec.ts', 'validation.s02.spec.ts', 'responsive.s02.spec.ts']

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: '.cache/browser-results',
  reporter: [['list'], ['json', { outputFile: path.join(evidenceDirectory, 'browser-results.json') }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    locale: 'ru-RU',
    launchOptions: process.env.EVENTFLOW_CHROMIUM_PATH ? { executablePath: process.env.EVENTFLOW_CHROMIUM_PATH } : {},
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', testMatch: checkoutTests, use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-360', testMatch: checkoutTests, use: { viewport: { width: 360, height: 800 }, isMobile: true, deviceScaleFactor: 1, hasTouch: true } },
    { name: 'mobile-390', testMatch: 'responsive.s02.spec.ts', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'tablet-768', testMatch: 'responsive.s02.spec.ts', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'zoom-200', testMatch: 'zoom.s02.spec.ts' },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})

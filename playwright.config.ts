import { defineConfig } from '@playwright/test'
import path from 'node:path'

const evidenceDirectory = process.env.EVENTFLOW_EVIDENCE_DIR ?? path.resolve('../_artifacts/evidence/S01')

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
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 }, isMobile: true, deviceScaleFactor: 1, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})

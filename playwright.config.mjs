// E2E tests: Chromium and WebKit (closest to iPhone Safari), iPhone SE / standard / Pro Max in landscape, touch on.
import { defineConfig } from '@playwright/test';
import os from 'node:os';

const PHONES = [
  { name: 'se', viewport: { width: 667, height: 375 } },
  { name: 'std', viewport: { width: 844, height: 390 } },
  { name: 'max', viewport: { width: 932, height: 430 } }
];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : Math.max(1, Math.min(3, Math.floor(os.cpus().length / 2))),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4173/CELL/',
    hasTouch: true,
    isMobile: true,
    userAgent: UA,
    deviceScaleFactor: 2,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    trace: 'retain-on-failure'
  },
  projects: ['chromium', 'webkit'].flatMap(browserName => PHONES.map(p => ({
    name: `${browserName}-${p.name}`,
    use: { browserName, viewport: p.viewport, ...(browserName === 'chromium' ? { launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } } : {}) }
  }))),
  webServer: { command: 'node tests/server.mjs', url: 'http://localhost:4173/CELL/', reuseExistingServer: !process.env.CI }
});

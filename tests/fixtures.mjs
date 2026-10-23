// Shared fixtures: every test fails on any console error/warning, uncaught exception or unhandled rejection.
import { test as base, expect } from '@playwright/test';

// noise that does not come from the app
const IGNORE = [/fonts\.(googleapis|gstatic)\.com/, /Failed to load resource.*fonts/, /net::ERR_INTERNET_DISCONNECTED/, /ERR_NAME_NOT_RESOLVED/];

export const test = base.extend({
  issues: async ({}, use) => { await use([]); },
  page: async ({ page, issues }, use) => {
    // the casual clock's web fonts come from Google Fonts; stub them so tests never depend on the network
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    page.on('pageerror', e => issues.push(`pageerror: ${e.message}`));
    page.on('console', m => {
      if (m.type() !== 'error' && m.type() !== 'warning') return;
      const t = m.text();
      if (IGNORE.some(r => r.test(t) || r.test(m.location().url || ''))) return;
      issues.push(`console.${m.type()}: ${t}`);
    });
    await page.addInitScript(() => {
      window.__rejections = [];
      addEventListener('unhandledrejection', e => window.__rejections.push(String(e.reason && e.reason.message || e.reason)));
    });
    await use(page);
    const rej = await page.evaluate(() => window.__rejections || []).catch(() => []);
    issues.push(...rej.map(r => `unhandledrejection: ${r}`));
    expect(issues, 'console errors / warnings / exceptions').toEqual([]);
  }
});
export { expect };

/** open the app with optional pre-seeded localStorage, skipping the first-run tour unless asked */
export async function openApp(page, { storage = {}, tour = false, path = './' } = {}) {
  await page.addInitScript(([s, tour]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    if (!tour && !('cell:onboarded' in s)) localStorage.setItem('cell:onboarded', 'true');
  }, [storage, tour]);
  await page.goto(path);
  await expect(page.locator('#enter')).toBeVisible();
}

export async function enter(page) {
  await page.locator('#enter').tap();
  await expect(page.locator('#boot')).toHaveCount(0, { timeout: 3000 });
}

export async function openWin(page, id) {
  await page.locator(`#dock [data-w="${id}"]`).tap();
  const win = page.locator(`.win.open[data-win="${id}"]`);
  await expect(win).toBeVisible();
  return win;
}

export async function closeWin(page, id) {
  await page.locator(`.win.open[data-win="${id}"] .win-h .x:not(.pinb)`).tap();
  await expect(page.locator(`.win[data-win="${id}"]`)).toBeHidden();
}

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

/** open the app with optional pre-seeded localStorage, skipping the first-run tour unless asked.
 *  The controls' auto-hide is off unless a test is about it (autohide: true): on a slow machine the controls could
 *  step aside between finding a button and tapping it, which tests nothing but timing. */
export async function openApp(page, { storage = {}, tour = false, path = './', autohide = false } = {}) {
  await page.addInitScript(([s, tour, autohide]) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    if (!tour && !('cell:onboarded' in s)) localStorage.setItem('cell:onboarded', 'true');
    if (!autohide) { let p = {}; try { p = JSON.parse(localStorage.getItem('cell:prefs') || '{}') || {}; } catch (e) {} if (p.autohide === undefined) { p.autohide = false; localStorage.setItem('cell:prefs', JSON.stringify(p)); } }
  }, [storage, tour, autohide]);
  await page.goto(path);
  await expect(page.locator('#enter')).toBeVisible();
}

export async function enter(page) {
  await page.locator('#enter').tap();
  await expect(page.locator('#boot')).toHaveCount(0, { timeout: 3000 });
}

/** wait until a sheet has finished springing open, so taps land where they are aimed */
export async function settled(page, win) {
  await expect(win).toBeVisible();
  await page.waitForFunction(el => el && el.getAnimations().length === 0 && getComputedStyle(el).opacity === '1' && ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(el).transform), await win.elementHandle());
}

/** the controls step aside at rest; a touch on the room brings them back (that touch presses nothing) */
export async function reveal(page) {
  const resting = () => page.evaluate(() => document.body.classList.contains('rest'));
  if (await resting()) {
    const vp = page.viewportSize();
    await page.mouse.move(Math.round(vp.width / 2), Math.round(vp.height / 2));
    await page.mouse.move(Math.round(vp.width / 2) + 6, Math.round(vp.height / 2) + 4);
    // a touch screen may not report mouse moves: a touch on an empty spot of the room wakes them instead
    if (await resting() && await page.evaluate(() => matchMedia('(pointer:coarse)').matches)) await page.touchscreen.tap(Math.round(vp.width * 0.5), Math.round(vp.height * 0.6));
  }
  await expect(page.locator('#bottom')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/\brest\b/);
}

/** tap a control in the bar; on a slow machine the bar may step aside between finding the button and tapping it,
 *  so it is brought back and tapped again */
export async function tapBar(page, loc) {
  for (let i = 0; ; i++) {
    await reveal(page);
    try { await loc.tap({ timeout: 3000 }); return; } catch (e) { if (i >= 4) throw e; }
  }
}

export async function tapTool(page, id) {
  await reveal(page);
  const btn = page.locator(`#dock [data-w="${id}"]`);
  if (await btn.isVisible()) await tapBar(page, btn);
  else {
    // narrow screens fold the less-used tools under "more"
    await tapBar(page, page.locator('#dock [data-more]'));
    await page.locator(`#dockMore [data-w="${id}"]`).tap();
  }
}

export async function openWin(page, id) {
  await tapTool(page, id);
  const win = page.locator(`.win.open[data-win="${id}"]`);
  await settled(page, win);
  return win;
}

export async function openModes(page) {
  await tapBar(page, page.locator('#brand'));
  const win = page.locator('.win.open[data-win="modes"]');
  await settled(page, win);
  return win;
}

/** rooms are picked in the "部屋と過ごし方" sheet */
export async function pickScene(page, s) {
  const win = page.locator('.win.open[data-win="modes"]');
  if (!(await win.isVisible())) await openModes(page);
  await win.locator(`.sc[data-s="${s}"]`).tap();
  await expect(page.locator('body')).toHaveAttribute('data-scene', s);
}

/** an item of the ⋯ (display and more) menu */
export async function menuItem(page, id) {
  await tapBar(page, page.locator('#btnMore'));
  await page.locator(`#morePop #${id}`).tap();
}

export async function closeWin(page, id) {
  await page.locator(`.win.open[data-win="${id}"] .win-h .x:not(.pinb)`).tap();
  await expect(page.locator(`.win[data-win="${id}"]`)).toBeHidden();
}

// Main-thread responsiveness during animations: windows, scene changes and modes must not block for long.
// (Frame pacing itself depends on the GPU; CI renders in software, so only long tasks are asserted here.)
import { test, expect, openApp, enter } from './fixtures.mjs';

test('no long main-thread blocks while opening sheets, switching scenes and applying a mode', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Long Tasks API is Chromium-only');
  await page.addInitScript(() => {
    window.__lt = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true });
  });
  await openApp(page);
  await enter(page);
  await page.waitForTimeout(2500); // boot-time thumbnail rendering is done by now
  await page.evaluate(() => { window.__lt = []; });
  for (const w of ['tasks', 'timer', 'log']) { await page.locator(`#dock [data-w="${w}"]`).tap(); await page.waitForTimeout(350); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  for (const s of ['camp', 'cafe', 'engawa', 'base', 'onsen', 'sea', 'orbit', 'drive']) { await page.locator(`.sc[data-s="${s}"]`).tap(); await page.waitForTimeout(450); }
  await page.locator('#brand').tap();
  await page.locator('.mode-c[data-mode="reading"]').tap();
  await page.waitForTimeout(900);
  const lt = await page.evaluate(() => window.__lt);
  console.log('long tasks (ms):', lt.map(Math.round));
  expect(Math.max(0, ...lt)).toBeLessThan(250);
});

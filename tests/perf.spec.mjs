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
  // baseline: the same page doing nothing for a few seconds (on a loaded or software-rendered machine every frame can be a "long task")
  await page.evaluate(() => { window.__lt = []; });
  await page.waitForTimeout(3000);
  const idle = await page.evaluate(() => window.__lt.slice());
  await page.evaluate(() => { window.__lt = []; });
  for (const w of ['tasks', 'timer', 'log']) { await page.locator(`#dock [data-w="${w}"]`).tap(); await page.waitForTimeout(350); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  for (const s of ['camp', 'cafe', 'engawa', 'base', 'onsen', 'sea', 'orbit', 'drive']) { await page.locator(`.sc[data-s="${s}"]`).tap(); await page.waitForTimeout(450); }
  await page.locator('#brand').tap();
  await page.locator('.mode-c[data-mode="reading"]').tap();
  await page.waitForTimeout(900);
  const lt = await page.evaluate(() => window.__lt);
  const worstIdle = Math.max(0, ...idle), worst = Math.max(0, ...lt);
  console.log(`long tasks: idle worst ${Math.round(worstIdle)}ms, during interactions worst ${Math.round(worst)}ms (${lt.length} tasks)`);
  // interactions may not block the main thread much longer than an idle frame does on the same machine
  expect(worst).toBeLessThan(Math.max(250, worstIdle + 200));
});

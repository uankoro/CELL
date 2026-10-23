// Long sessions: music + ambience + timers for a long (simulated) time must not grow memory, DOM or timers without bound.
import { test, expect, openApp, enter, openWin } from './fixtures.mjs';

test.describe('long-running session', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'heap metrics need the Chromium DevTools protocol');

  test('2 minutes of continuous real use (~90 cycles through every window and scene): heap and DOM stay flat', async ({ page }) => {
    test.setTimeout(240_000);
    await openApp(page);
    await enter(page);
    const cdp = await page.context().newCDPSession(page);
    const sample = async () => { await cdp.send('HeapProfiler.collectGarbage'); const { usedSize } = await cdp.send('Runtime.getHeapUsage'); const dom = await page.evaluate(() => document.getElementsByTagName('*').length); return { heap: usedSize, dom }; };
    // turn on ambience and a running pomodoro, then exercise the UI in a loop
    let win = await openWin(page, 'mixer');
    await win.locator('input[data-k="amb:rain"]').fill('70');
    win = await openWin(page, 'timer');
    await win.locator('[data-a="go"]').tap();
    await page.keyboard.press('Escape');
    const cycle = async i => {
      for (const id of ['tasks', 'calendar', 'log', 'mixer']) { await page.keyboard.press({ tasks: 'l', calendar: 'k', log: 'g', mixer: 'm' }[id]); await page.waitForTimeout(120); await page.keyboard.press('Escape'); }
      await page.keyboard.press(String(1 + (i % 8)));
      await page.waitForTimeout(250);
    };
    for (let i = 0; i < 6; i++) await cycle(i);
    const base = await sample();
    // keep the app busy for 2 minutes of real time (audio scheduler, 4 Hz timer loop, 20 Hz ambience, rAF scene)
    const t0 = Date.now();
    let i = 0;
    while (Date.now() - t0 < 120_000) await cycle(i++);
    const end = await sample();
    const growMB = (end.heap - base.heap) / 1048576;
    console.log(`heap ${Math.round(base.heap / 1048576)}MB → ${Math.round(end.heap / 1048576)}MB, DOM ${base.dom} → ${end.dom}, cycles ${i}`);
    expect(growMB).toBeLessThan(12);
    expect(Math.abs(end.dom - base.dom)).toBeLessThan(60);
    // the music scheduler must not pile up intervals
    expect(await page.evaluate(() => document.querySelectorAll('.toast').length)).toBeLessThan(6);
  });

  test('a 25-minute pomodoro completes on a fast-forwarded clock and is recorded', async ({ page }) => {
    await page.clock.install();
    await openApp(page);
    await enter(page);
    const win = await openWin(page, 'timer');
    await win.locator('[data-a="go"]').tap();
    for (let m = 0; m < 26; m++) await page.clock.fastForward('01:00');
    await page.clock.runFor(1000);
    const st = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cell:stats') || '{}'))[0]);
    expect(st).toMatchObject({ focus: 25, pomos: 1 });
    // the timer moved on to the break
    await expect(page.locator('.win.open[data-win="timer"] [data-ph]')).toContainText(/小休憩|Short Break/);
  });

  test('sleep mode: 30-minute sleep timer stops music and ambience on a fast-forwarded clock', async ({ page }) => {
    await page.clock.install();
    await openApp(page);
    await enter(page);
    await page.locator('#brand').tap();
    await page.locator('.mode-c[data-mode="sleep"]').tap();
    await page.clock.runFor(1000);
    await expect(page.locator('#night')).toBeVisible();
    for (let m = 0; m < 31; m++) await page.clock.fastForward('01:00');
    await page.clock.runFor(2000);
    await expect(page.locator('#night [data-ns]')).not.toContainText(/あと|left/);
    expect(await page.evaluate(() => document.querySelector('#play').getAttribute('aria-label'))).toMatch(/再生|Play/);
    await expect(page.locator('#night')).toBeVisible();
  });
});

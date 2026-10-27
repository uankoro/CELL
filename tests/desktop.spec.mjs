// CELL on a desk: a second monitor all day (landscape and portrait), a laptop, a small window, 4K. Mouse, no touch.
import { test, expect, openApp, enter } from './fixtures.mjs';

const DESKS = [
  { name: 'monitor 1920×1080', viewport: { width: 1920, height: 1080 } },
  { name: 'portrait monitor 1080×1920', viewport: { width: 1080, height: 1920 } },
  { name: 'laptop 1366×768', viewport: { width: 1366, height: 768 } },
  { name: 'small window 720×480', viewport: { width: 720, height: 480 } },
  { name: 'narrow window 480×800', viewport: { width: 480, height: 800 } },
  { name: '4K 2560×1440', viewport: { width: 2560, height: 1440 } }
];

// the desk layouts are the same in every phone project; run them once per browser
test.beforeEach(async ({}, info) => { test.skip(!info.project.name.endsWith('-std'), 'desk sizes run once per browser'); });
test.use({ hasTouch: false, isMobile: false, deviceScaleFactor: 1 });

for (const d of DESKS) {
  test.describe(d.name, () => {
    test.use({ viewport: d.viewport });

    test('fits: no scroll, nothing off screen or overlapping, no rotate guide', async ({ page }) => {
      await openApp(page, { storage: { 'cell:tasks': [{ id: 't1', text: '企画書の見直し', pri: 0, due: '', done: false, created: 1, pomos: 0 }], 'cell:pinned': '"t1"' } });
      await page.locator('#enter').click();
      await expect(page.locator('#boot')).toHaveCount(0);
      await expect(page.locator('#rotate')).toBeHidden();
      const r = await page.evaluate(() => {
        const box = s => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
        const se = document.scrollingElement;
        return { sw: se.scrollWidth, sh: se.scrollHeight, W: innerWidth, H: innerHeight, brand: box('#brand'), status: box('#status'), clock: box('#clock'), glance: box('#glance'), player: box('#player'), dock: box('#dock') };
      });
      expect(r.sw).toBeLessThanOrEqual(r.W);
      expect(r.sh).toBeLessThanOrEqual(r.H);
      for (const k of ['brand', 'status', 'clock', 'player', 'dock']) {
        expect(r[k].l, k).toBeGreaterThanOrEqual(0);
        expect(r[k].r, k).toBeLessThanOrEqual(r.W + 0.5);
        expect(r[k].t, k).toBeGreaterThanOrEqual(0);
        expect(r[k].b, k).toBeLessThanOrEqual(r.H + 0.5);
      }
      const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      expect(hit(r.brand, r.clock), 'brand × clock').toBe(false);
      expect(hit(r.status, r.clock), 'buttons × clock').toBe(false);
      expect(hit(r.player, r.dock), 'player × tools').toBe(false);
      await expect(page.locator('#nowTask')).toContainText('企画書の見直し');
    });

    test('Life fits: three columns (one on a tall window), nothing off screen', async ({ page }) => {
      await openApp(page, { storage: { 'cell:life': { habits: [{ id: 'h1', name: 'ストレッチ', per: 'day', target: 1 }], chores: [{ id: 'c1', name: '燃えるゴミ', kind: 'gomi', rule: { t: 'week', days: [0, 1, 2, 3, 4, 5, 6] } }] } } });
      await page.locator('#enterLife').click();
      await expect(page.locator('#life')).toBeVisible();
      const r = await page.evaluate(() => {
        const se = document.scrollingElement, cols = [...document.querySelectorAll('.lf-col')].map(c => c.getBoundingClientRect());
        return { sw: se.scrollWidth, W: innerWidth, H: innerHeight, cols: cols.map(b => ({ l: b.left, r: b.right, t: b.top })), top: document.querySelector('.lf-top').getBoundingClientRect().right };
      });
      expect(r.sw).toBeLessThanOrEqual(r.W);
      expect(r.top).toBeLessThanOrEqual(r.W + 0.5);
      for (const c of r.cols) { expect(c.l).toBeGreaterThanOrEqual(0); expect(c.r).toBeLessThanOrEqual(r.W + 0.5); }
      const sameRow = r.cols.every(c => Math.abs(c.t - r.cols[0].t) < 2);
      expect(sameRow).toBe(r.W > r.H);
    });

    test('mouse: moving reveals, resting hides the controls and the cursor', async ({ page }) => {
      await openApp(page, { autohide: true });
      await page.locator('#enter').click();
      await expect(page.locator('body')).toHaveClass(/\brest\b/, { timeout: 12000 });
      expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('none');
      await page.mouse.move(200, 200);
      await page.mouse.move(240, 220);
      await expect(page.locator('body')).not.toHaveClass(/\brest\b/);
      await expect(page.locator('#dock')).toBeVisible();
      // resting the pointer on the tools keeps them
      await page.locator('#dock [data-w="timer"]').hover();
      await page.waitForTimeout(5000);
      await expect(page.locator('body')).not.toHaveClass(/\brest\b/);
    });
  });
}

test.describe('desk size details', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('the clock is larger on a big monitor than in a small window', async ({ page }) => {
    await openApp(page);
    await page.locator('#enter').click();
    const big = await page.locator('#clock').boundingBox();
    await page.setViewportSize({ width: 720, height: 480 });
    // the clock is refitted shortly after a resize
    await expect.poll(async () => (await page.locator('#clock').boundingBox()).width * 1.6, { timeout: 8000 }).toBeLessThan(big.width);
  });

  test('all eight tools sit in the dock on a wide screen; keyboard shortcuts show in tooltips', async ({ page }) => {
    await openApp(page);
    await page.locator('#enter').click();
    await expect(page.locator('#dock [data-w]')).toHaveCount(8);
    for (const id of ['timer', 'calendar', 'reminders', 'tasks', 'mixer', 'memo', 'log', 'breath']) await expect(page.locator(`#dock [data-w="${id}"]`)).toBeVisible();
    await expect(page.locator('#dock [data-more]')).toBeHidden();
    await expect(page.locator('#dock [data-w="timer"]')).toHaveAttribute('data-key', 'T');
  });

  test('the ⋯ menu offers the mini window where the browser supports it, and keyboard shortcuts', async ({ page, browserName }) => {
    await openApp(page);
    await page.locator('#enter').click();
    await page.locator('#btnMore').click();
    await expect(page.locator('#btnHelp')).toBeVisible();
    const pip = await page.evaluate(() => 'documentPictureInPicture' in window);
    if (pip) await expect(page.locator('#btnPip')).toBeVisible();
    else await expect(page.locator('#btnPip')).toBeHidden();
    await page.locator('#btnHelp').click();
    await expect(page.locator('#help')).toBeVisible();
  });
});

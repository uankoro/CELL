// Regressions for bugs found by the independent reviews (each one reproduced before it was fixed).
import { test, expect, openApp, enter, openWin, openModes } from './fixtures.mjs';

test.beforeEach(async ({ page }) => { await openApp(page); await enter(page); });

test('importing a backup keeps the backup’s casual alarms and settings (the casual clock must not write its old state back)', async ({ page }) => {
  await page.locator('#btnType').tap();
  await expect(page.locator('#casual')).toBeVisible();
  await page.frameLocator('#casual').locator('[data-type="chill"]').tap();
  const backup = JSON.stringify({ app: 'CELL', v: 3, data: {
    'cell:tasks': JSON.stringify([{ id: 'x1', text: '移した先のタスク', pri: 0, due: '', done: false, created: 1, pomos: 0 }]),
    'suikyo-clock-v1': JSON.stringify({ rev: 9, tasks: [], alarms: [{ id: 'al9', time: '06:30', label: '読み込んだアラーム', days: [], on: true }], prefs: { mode: 'pop', h12: false, sec: true } })
  } });
  const win = await openWin(page, 'log');
  await win.locator('[data-a="imp"]').tap();
  await win.locator('[data-imp] textarea').fill(backup);
  await win.locator('[data-a="doimp"]').tap();
  await win.locator('[data-a="doimp"]').tap();
  await page.waitForEvent('load');
  const casual = await page.evaluate(() => JSON.parse(localStorage.getItem('suikyo-clock-v1')));
  expect(casual.alarms.map(a => a.label)).toEqual(['読み込んだアラーム']);
  expect(casual.prefs.mode).toBe('pop');
  expect(await page.evaluate(() => localStorage.getItem('cell:tasks'))).toContain('移した先のタスク');
});

test('sticky-note sizes survive adding another note and a resize', async ({ page }) => {
  const win = await openWin(page, 'memo');
  await win.locator('[data-a="blank"]').tap();
  await win.locator('[data-a="blank"]').tap();
  await page.keyboard.press('Escape');
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.width - 20, height: vp.height });
  await page.waitForTimeout(500);
  await page.setViewportSize(vp);
  await page.waitForTimeout(500);
  const sizes = await page.evaluate(() => JSON.parse(localStorage.getItem('cell:stickies')).map(n => [n.w, n.h]));
  for (const [w, h] of sizes) { expect(w).toBeGreaterThanOrEqual(150); expect(h).toBeGreaterThanOrEqual(110); }
});

test('the tap that closes a context menu does not also press what is underneath', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  for (const t of ['上のタスク', '下のタスク']) { await win.locator('[data-in]').fill(t); await win.locator('[data-a="add"]').tap(); }
  const row = win.locator('.task', { hasText: '下のタスク' });
  await row.locator('.tx').click({ button: 'right' });
  await expect(page.locator('.menu')).toBeVisible();
  // a real finger: tap the screen where the other task's ✓ is (the menu's backdrop is on top of it)
  const b = await win.locator('.task', { hasText: '上のタスク' }).locator('[data-a="done"]').boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(400);
  await expect(page.locator('.menu')).toHaveCount(0);
  const tasks = await page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks')));
  expect(tasks.every(t => !t.done)).toBe(true);
});

test('tapping Undo twice restores the task only once', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('二度押し');
  await win.locator('[data-a="add"]').tap();
  await win.locator('.task', { hasText: '二度押し' }).locator('[data-a="del"]').tap();
  await page.locator('.toast', { hasText: /削除/ }).waitFor();
  await page.evaluate(() => { const b = [...document.querySelectorAll('.toast button')].find(x => /取り消す|Undo/.test(x.textContent)); b.click(); b.click(); });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks')).length)).toBe(1);
});

test('the Break mood’s 5-minute timer reports 5 minutes and resets to 5', async ({ page }) => {
  await openModes(page);
  await page.locator('.mode-c[data-mode="break"]').tap();
  const win = await openWin(page, 'timer');
  await expect(win.locator('[data-time]')).toHaveText(/0[45]:\d\d/);
  await win.locator('[data-a="reset"]').tap();
  await expect(win.locator('[data-time]')).toHaveText('05:00');
});

test('closing the night screen with Esc leaves the sleep mood (no stale highlight)', async ({ page }) => {
  await openModes(page);
  await page.locator('.mode-c[data-mode="sleep"]').tap();
  await expect(page.locator('#night')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#night')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('cell:mode'))).toBe('""');
});

test('a swipe still completes its action when animation frames stall (slow device, dropped frames)', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('止まった描画');
  await win.locator('[data-a="add"]').tap();
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  const b = await win.locator('.task', { hasText: '止まった描画' }).locator('.tx').boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + 20 * i, y);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks'))[0].done), { timeout: 3000 }).toBe(true);
});

test('a menu opened by a long press stays open when that finger lifts', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('長押しして離す');
  await win.locator('[data-a="add"]').tap();
  const b = await win.locator('.task', { hasText: '長押しして離す' }).locator('.tx').boundingBox();
  await page.mouse.move(b.x + 10, b.y + b.height / 2); await page.mouse.down();
  await expect(page.locator('.menu')).toBeVisible();
  await page.mouse.up();
  await page.waitForTimeout(300);
  await expect(page.locator('.menu')).toBeVisible();
});

// The room as the interface: controls rest, the glance line, the room card, menus, and the always-on care.
import { test, expect, openApp, enter, openWin, openModes, pickScene, menuItem, reveal } from './fixtures.mjs';

const rest = page => expect(page.locator('body')).toHaveClass(/\brest\b/, { timeout: 9000 });

test('controls step aside at rest; the touch that wakes them presses nothing', async ({ page }) => {
  await openApp(page);
  await enter(page);
  await rest(page);
  await expect(page.locator('#bottom')).toBeHidden();
  await expect(page.locator('#clock')).toBeVisible();
  // a finger lands exactly where the tasks button sits while it is hidden
  const b = await page.locator('#dock [data-w="tasks"]').boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('#bottom')).toBeVisible();
  await page.waitForTimeout(400);
  await expect(page.locator('.win.open')).toHaveCount(0);
  // the second tap is a real one
  await page.locator('#dock [data-w="tasks"]').tap();
  await expect(page.locator('.win.open[data-win="tasks"]')).toBeVisible();
});

test('nothing hides while a sheet is open, and the setting keeps the controls on screen', async ({ page }) => {
  await openApp(page);
  await enter(page);
  await openWin(page, 'timer');
  await page.waitForTimeout(6500);
  await expect(page.locator('body')).not.toHaveClass(/\brest\b/);
  await page.keyboard.press('Escape');
  await page.keyboard.press(',');
  const win = page.locator('.win.open[data-win="settings"]');
  await win.locator('[data-pref="autohide"]').tap();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(6500);
  await expect(page.locator('body')).not.toHaveClass(/\brest\b/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cell:prefs')).autohide)).toBe(false);
});

test('next up: a reminder within a day shows under the clock, a later one does not', async ({ page }) => {
  await openApp(page, { storage: { 'cell:reminders': [
    { id: 'a', text: '来週の予定', at: Date.now() + 3 * 86400e3, done: false },
    { id: 'b', text: '歯医者', at: Date.now() + 25 * 60e3, done: false }
  ] } });
  await enter(page);
  const n = page.locator('#nextUp');
  await expect(n).toBeVisible();
  await expect(n).toContainText('歯医者');
  await expect(n).toContainText(/あと2[45]分/);
  await n.tap();
  await expect(page.locator('.win.open[data-win="calendar"]')).toBeVisible();
});

test('no next up and no numbers when the day is empty', async ({ page }) => {
  await openApp(page);
  await enter(page);
  await expect(page.locator('#nextUp')).toBeHidden();
  await expect(page.locator('#nowTask')).toBeHidden();
  await expect(page.locator('#mini')).toBeHidden();
});

test('moving to a room shows its name and one line, once', async ({ page }) => {
  await openApp(page);
  await enter(page);
  await pickScene(page, 'onsen');
  const card = page.locator('#roomCard');
  await expect(card).toHaveClass(/\bon\b/);
  await expect(card).toContainText('雪見湯');
  await expect(card).toContainText('雪の夜');
  await expect(card).not.toHaveClass(/\bon\b/, { timeout: 6000 });
});

test('the ⋯ menu: clock only, settings, casual; it closes when you tap elsewhere', async ({ page }) => {
  await openApp(page);
  await enter(page);
  await reveal(page);
  await page.locator('#btnMore').tap();
  await expect(page.locator('#morePop')).toBeVisible();
  await expect(page.locator('#btnMore')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#clock').tap();
  await expect(page.locator('#morePop')).toBeHidden();
  await menuItem(page, 'btnSettings');
  await expect(page.locator('.win.open[data-win="settings"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await menuItem(page, 'btnZen');
  await expect(page.locator('body')).toHaveClass(/\bzen\b/);
});

test('the rooms live in the 部屋と過ごし方 sheet, drawn once and kept across re-renders', async ({ page }) => {
  await openApp(page);
  await enter(page);
  const win = await openModes(page);
  await expect(win.locator('.sc')).toHaveCount(8);
  await expect(win.locator('.sc .th canvas')).toHaveCount(8, { timeout: 8000 });
  await win.locator('.sc[data-s="sea"]').tap();
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'sea');
  await expect(win.locator('.sc[data-s="sea"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  const again = await openModes(page);
  await expect(again.locator('.sc .th canvas')).toHaveCount(8);
});

test('silent alerts: a timer ends with light at the edge, not a sound', async ({ page }) => {
  await page.clock.install();
  await openApp(page, { storage: { 'cell:prefs': { silent: true } } });
  await enter(page);
  const win = await openWin(page, 'timer');
  await win.locator('[data-m="custom"]').tap();
  await win.locator('[data-pre="3"]').tap();
  await win.locator('[data-a="go"]').tap();
  // jump to just before the end, then let it run through (later jumps would also dismiss the banner)
  await page.clock.fastForward('02:50');
  await page.clock.runFor(12000);
  await expect(page.locator('#cue')).toHaveCount(1);
  await expect(page.locator('#cue')).toHaveClass(/\bon\b/);
  await expect(page.locator('.toast', { hasText: /タイマー終了|Timer Done/ })).toBeVisible();
});

test('with sound on, a timer end does not light the edge', async ({ page }) => {
  await page.clock.install();
  await openApp(page);
  await enter(page);
  const win = await openWin(page, 'timer');
  await win.locator('[data-m="custom"]').tap();
  await win.locator('[data-pre="3"]').tap();
  await win.locator('[data-a="go"]').tap();
  // jump to just before the end, then let it run through (later jumps would also dismiss the banner)
  await page.clock.fastForward('02:50');
  await page.clock.runFor(12000);
  await expect(page.locator('.toast', { hasText: /タイマー終了|Timer Done/ })).toBeVisible();
  await expect(page.locator('#cue')).toHaveCount(0);
});

test('eye breaks every 20 minutes when turned on', async ({ page }) => {
  await page.clock.install();
  await openApp(page, { storage: { 'cell:prefs': { eyes: true } } });
  await enter(page);
  await page.clock.fastForward('19:45');
  const eye = page.locator('.toast', { hasText: /目を休めましょう|Rest your eyes/ });
  for (let i = 0; i < 8 && !(await eye.count()); i++) await page.clock.runFor(10000);
  await expect(eye).toBeVisible();
});

test('the clock drifts a few pixels over time (burn-in care) and the room dims late at night', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T23:30:00+09:00') });
  await openApp(page);
  await enter(page);
  await expect(page.locator('body')).toHaveClass(/\bnightdim\b/);
  for (let m = 0; m < 5; m++) await page.clock.fastForward('00:30');
  await page.clock.runFor(500);
  const d = await page.evaluate(() => [document.body.style.getPropertyValue('--dx'), document.body.style.getPropertyValue('--dy')].map(parseFloat));
  for (const v of d) { expect(Math.abs(v)).toBeLessThanOrEqual(6); }
  expect(d.some(v => v !== 0)).toBe(true);
});

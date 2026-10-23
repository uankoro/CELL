// Physical gestures: swipe rows, long-press menu, sheet flick-to-close, banner swipe.
import { test, expect, openApp, enter, openWin } from './fixtures.mjs';

async function drag(page, loc, dx, dy = 0, steps = 8) {
  const b = await loc.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) await page.mouse.move(x + dx * i / steps, y + dy * i / steps);
  await page.mouse.up();
}
async function addTask(page, win, text) {
  await win.locator('[data-in]').fill(text);
  await win.locator('[data-a="add"]').tap();
  await expect(win.locator('.task', { hasText: text })).toBeVisible();
}

test.beforeEach(async ({ page }) => { await openApp(page); await enter(page); });

test('swipe a task right to complete it', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  await addTask(page, win, 'スワイプで完了');
  await drag(page, win.locator('.task', { hasText: 'スワイプで完了' }).locator('.tx'), 160);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks'))[0].done)).toBe(true);
});

test('swipe a task left to delete it, then undo', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  await addTask(page, win, 'スワイプで削除');
  await drag(page, win.locator('.task', { hasText: 'スワイプで削除' }).locator('.tx'), -160);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks')).length)).toBe(0);
  await page.locator('.toast button', { hasText: /取り消す|Undo/ }).tap();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks')).length)).toBe(1);
  await expect(win.locator('.task', { hasText: 'スワイプで削除' })).toBeVisible();
});

test('a short drag springs back and does nothing', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  await addTask(page, win, '少しだけ動かす');
  await drag(page, win.locator('.task', { hasText: '少しだけ動かす' }).locator('.tx'), 40);
  await page.waitForTimeout(600);
  const t = await page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks'))[0]);
  expect(t.done).toBe(false);
  await expect(win.locator('.task', { hasText: '少しだけ動かす' })).toHaveCSS('transform', 'none');
});

test('long-press a task opens the context menu', async ({ page }) => {
  const win = await openWin(page, 'tasks');
  await addTask(page, win, '長押しのタスク');
  const tx = win.locator('.task', { hasText: '長押しのタスク' }).locator('.tx');
  const b = await tx.boundingBox();
  await page.mouse.move(b.x + 10, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
  const menu = page.locator('.menu');
  await expect(menu).toBeVisible();
  await menu.locator('button', { hasText: /いまやること|Set as Now/ }).tap();
  await expect(menu).toHaveCount(0);
  await expect(page.locator('#nowTask')).toContainText('長押しのタスク');
});

test('flick the sheet to the left to close it (phone landscape)', async ({ page }) => {
  const win = await openWin(page, 'memo');
  await drag(page, win.locator('.win-h b'), -220, 0, 6);
  await expect(page.locator('.win[data-win="memo"]')).toBeHidden();
  // and it opens normally again afterwards
  await openWin(page, 'memo');
  await expect(page.locator('.win.open[data-win="memo"]')).toHaveCSS('opacity', '1');
});

test('pulling the sheet the wrong way rubber-bands back', async ({ page }) => {
  const win = await openWin(page, 'memo');
  await drag(page, win.locator('.win-h b'), 200, 0, 6);
  await page.waitForTimeout(700);
  await expect(win).toBeVisible();
  await expect(win).toHaveCSS('transform', 'none');
});

test('swipe a banner up to dismiss it', async ({ page }) => {
  const win = await openWin(page, 'memo');
  await win.locator('[data-m]').fill('バナー');
  await win.locator('[data-a="stick"]').tap();
  const t = page.locator('.toast').first();
  await expect(t).toBeVisible();
  await drag(page, t, 0, -80, 5);
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 2000 });
});

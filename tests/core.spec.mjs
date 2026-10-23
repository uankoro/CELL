// Every feature that existed before the PWA work must keep working.
import { test, expect, openApp, enter, openWin, closeWin } from './fixtures.mjs';

const SCENES = ['drive', 'camp', 'cafe', 'engawa', 'base', 'onsen', 'sea', 'orbit'];

test.beforeEach(async ({ page }) => { await openApp(page); });

test('boot screen and entering the room', async ({ page }) => {
  await expect(page.locator('.b-sub')).toBeVisible();
  await enter(page);
  await expect(page.locator('#clock')).not.toBeEmpty();
  await expect(page.locator('#play')).toHaveAttribute('aria-label', /一時停止|Pause/);
});

test('all eight scenes switch, each with its own clock', async ({ page }) => {
  await enter(page);
  for (const s of SCENES) {
    await page.locator(`.sc[data-s="${s}"]`).tap();
    await expect(page.locator('body')).toHaveAttribute('data-scene', s);
    await expect(page.locator(`#clock.ck-${s}`)).not.toBeEmpty();
  }
  expect(await page.evaluate(() => localStorage.getItem('cell:scene'))).toBe('"orbit"');
});

test('every tool window opens and closes', async ({ page }) => {
  await enter(page);
  for (const id of ['timer', 'calendar', 'reminders', 'tasks', 'mixer', 'memo', 'log']) {
    await openWin(page, id);
    await closeWin(page, id);
  }
});

test('tasks: add, pin as "now", complete, delete', async ({ page }) => {
  await enter(page);
  const win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('原稿を書く');
  await win.locator('[data-a="add"]').tap();
  const row = win.locator('.task', { hasText: '原稿を書く' });
  await expect(row).toBeVisible();
  await row.locator('[data-a="pin"]').tap();
  await expect(page.locator('#nowTask')).toContainText('原稿を書く');
  await win.locator('.task', { hasText: '原稿を書く' }).locator('[data-a="done"]').tap();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks'))[0].done)).toBe(true);
  await expect(page.locator('#nowTask')).toBeHidden();
  await win.locator('[data-f="all"]').tap();
  await win.locator('.task', { hasText: '原稿を書く' }).locator('[data-a="del"]').tap();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks')).length)).toBe(0);
});

test('timer: pomodoro start/pause, custom timer, stopwatch', async ({ page }) => {
  await enter(page);
  const win = await openWin(page, 'timer');
  await win.locator('[data-a="go"]').tap();
  await expect(page.locator('#mini')).toBeVisible();
  await win.locator('[data-a="go"]').tap();
  await expect(win.locator('[data-ph]')).toContainText(/一時停止中|paused/i);
  await win.locator('[data-a="reset"]').tap();
  await win.locator('[data-m="custom"]').tap();
  await win.locator('[data-pre="3"]').tap();
  await expect(win.locator('[data-time]')).toHaveText('03:00');
  await win.locator('[data-m="stop"]').tap();
  await win.locator('[data-a="go"]').tap();
  await page.waitForTimeout(400);
  await win.locator('[data-a="lap"]').tap();
  await expect(win.locator('.laps div')).toHaveCount(1);
});

test('calendar: pick a day and add a plan (becomes a reminder)', async ({ page }) => {
  await enter(page);
  const win = await openWin(page, 'calendar');
  await win.locator('[data-a="next"]').tap();
  await win.locator('.cal .d:not(.out)').nth(10).tap();
  await win.locator('[data-tx]').fill('歯医者');
  await win.locator('[data-a="add"]').tap();
  await expect(win.locator('.it', { hasText: '歯医者' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cell:reminders')).length)).toBe(1);
});

test('reminders: quick add and delete', async ({ page }) => {
  await enter(page);
  const win = await openWin(page, 'reminders');
  await win.locator('[data-tx]').fill('洗濯物');
  await win.locator('[data-q="30"]').tap();
  await expect(win.locator('.it', { hasText: '洗濯物' })).toBeVisible();
  await win.locator('.it', { hasText: '洗濯物' }).locator('[data-a="del"]').tap();
  await expect(win.locator('.it', { hasText: '洗濯物' })).toHaveCount(0);
});

test('mixer: volume, ambience and sleep timer', async ({ page }) => {
  await enter(page);
  const win = await openWin(page, 'mixer');
  await win.locator('input[data-k="vol"]').fill('40');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cell:vol'))).toBe('0.4');
  await win.locator('input[data-k="amb:rain"]').fill('80');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cell:mix')).drive.rain)).toBe(0.8);
  await win.locator('[data-sl="15"]').tap();
  await expect(win.locator('[data-sleep]')).toContainText(/あと|left/);
  await win.locator('[data-sl="0"]').tap();
});

test('memo, sticky notes and the pinned widgets', async ({ page }) => {
  await enter(page);
  let win = await openWin(page, 'memo');
  await win.locator('[data-m]').fill('付箋の中身');
  await win.locator('[data-a="stick"]').tap();
  await expect(page.locator('.stk textarea')).toHaveValue('付箋の中身');
  await closeWin(page, 'memo');
  win = await openWin(page, 'calendar');
  await win.locator('.pinb').tap();
  await expect(page.locator('#pins [data-pw="cal"]')).toBeVisible();
  win = await openWin(page, 'tasks');
  await win.locator('.pinb').tap();
  await page.locator('#pins .pw-in').fill('貼り付けから追加');
  await page.locator('#pins .pw-in').press('Enter');
  await expect(page.locator('#pins .pw-list')).toContainText('貼り付けから追加');
  await page.reload();
  await enter(page);
  await expect(page.locator('.stk')).toHaveCount(1);
  await expect(page.locator('#pins [data-pw="cal"]')).toBeVisible();
});

test('music: play/pause, next track and the track list', async ({ page }) => {
  await enter(page);
  await page.locator('#play').tap();
  await expect(page.locator('#play')).toHaveAttribute('aria-label', /再生|Play/);
  await page.locator('#next').tap();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cell:track'))).toBe('1');
  await page.locator('#trackBtn').tap();
  await expect(page.locator('#tracklist')).toBeVisible();
  await page.locator('#tracklist [data-t="3"]').tap();
  await expect(page.locator('#tracklist')).toBeHidden();
  await expect(page.locator('#tTitle')).toHaveText(/風鈴のゆくえ|Where the Wind Chime Goes/);
});

test('FOCUS mode, zen mode, breathing and help', async ({ page }) => {
  await enter(page);
  await page.locator('#btnFocus').tap();
  await expect(page.locator('body')).toHaveClass(/\bfocus\b/);
  await page.locator('[data-fa="exit"]').tap();
  await expect(page.locator('body')).not.toHaveClass(/\bfocus\b/);
  await page.locator('#btnZen').tap();
  await expect(page.locator('body')).toHaveClass(/\bzen\b/);
  await page.locator('#stage').tap({ position: { x: 300, y: 200 } });
  await expect(page.locator('body')).not.toHaveClass(/\bzen\b/);
  await page.locator('#dock [data-w="breath"]').tap();
  await expect(page.locator('#breath')).toBeVisible();
  await page.locator('#brEnd').tap();
  await expect(page.locator('#breath')).toBeHidden();
  await page.keyboard.press('?');
  await expect(page.locator('#help')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help')).toBeHidden();
});

test('casual clock: switch, shared tasks, alarm add, back to chill', async ({ page }) => {
  await enter(page);
  const win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('共有タスク');
  await win.locator('[data-a="add"]').tap();
  await page.locator('#btnType').tap();
  await expect(page.locator('#casual')).toBeVisible();
  const fr = page.frameLocator('#casual');
  await expect(fr.locator('#tList')).toContainText('共有タスク');
  await fr.locator('#aAdd').tap();
  await expect(fr.locator('#aList .aitem')).toHaveCount(1);
  await fr.locator('[data-mode="kawaii"]').tap();
  await expect(fr.locator('body')).toHaveAttribute('data-mode', 'kawaii');
  await fr.locator('[data-type="chill"]').tap();
  await expect(page.locator('#casual')).toBeHidden();
  await expect(page.locator('#stats')).toContainText(/アラーム|Alarm/);
});

test('keyboard shortcuts still work', async ({ page }) => {
  await enter(page);
  await page.keyboard.press('3');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'cafe');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'engawa');
  await page.keyboard.press('t');
  await expect(page.locator('.win.open[data-win="timer"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.win[data-win="timer"]')).toBeHidden();
});

test('backup export → import round trip', async ({ page }) => {
  await enter(page);
  let win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('引っ越しテスト');
  await win.locator('[data-a="add"]').tap();
  await closeWin(page, 'tasks');
  const dump = await page.evaluate(() => {
    const data = { app: 'CELL', v: 3, data: {} };
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('cell:')) data.data[k] = localStorage.getItem(k); }
    return JSON.stringify(data);
  });
  await page.evaluate(() => localStorage.setItem('cell:tasks', '[]'));
  win = await openWin(page, 'log');
  await win.locator('[data-a="imp"]').tap();
  await win.locator('[data-imp] textarea').fill(dump);
  await win.locator('[data-a="doimp"]').tap();
  await win.locator('[data-a="doimp"]').tap();
  await page.waitForURL(/CELL/);
  await page.waitForLoadState('load');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('cell:tasks') || '')).toContain('引っ越しテスト');
});

test('layout fits the phone: no page scroll, no clipped bars, 44px targets', async ({ page }) => {
  await enter(page);
  const r = await page.evaluate(() => {
    const se = document.scrollingElement;
    const box = s => document.querySelector(s).getBoundingClientRect();
    const small = [];
    document.querySelectorAll('#ui button, .win button').forEach(el => {
      const b = el.getBoundingClientRect(); if (!b.width) return;
      const a = getComputedStyle(el, '::after'); const w = Math.max(b.width, a.position === 'absolute' ? parseFloat(a.width) || 0 : 0), h = Math.max(b.height, a.position === 'absolute' ? parseFloat(a.height) || 0 : 0);
      if (w < 43.5 || h < 43.5) small.push(`${el.id || el.className} ${Math.round(w)}x${Math.round(h)}`);
    });
    return { sw: se.scrollWidth, sh: se.scrollHeight, w: innerWidth, h: innerHeight, bottom: box('#bottom').bottom, top: box('#top').top, small };
  });
  expect(r.sw).toBeLessThanOrEqual(r.w);
  expect(r.sh).toBeLessThanOrEqual(r.h);
  expect(r.bottom).toBeLessThanOrEqual(r.h);
  expect(r.top).toBeGreaterThanOrEqual(0);
  expect(r.small).toEqual([]);
});

test('portrait shows the rotate guide and keeps state', async ({ page }) => {
  await enter(page);
  const win = await openWin(page, 'memo');
  await win.locator('[data-m]').fill('回転しても消えない');
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await expect(page.locator('#rotate')).toBeVisible();
  await page.setViewportSize(vp);
  await expect(page.locator('#rotate')).toBeHidden();
  await expect(page.locator('.win.open[data-win="memo"] [data-m]')).toHaveValue('回転しても消えない');
});

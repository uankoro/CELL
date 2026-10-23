// New in v2: modes, sleep darkness, settings, month records, first-run tour.
import { test, expect, openApp, enter, openWin, openModes } from './fixtures.mjs';

const k = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test.describe('modes (過ごし方)', () => {
  test.beforeEach(async ({ page }) => { await openApp(page); await enter(page); });

  test('the room name opens the modes sheet', async ({ page }) => {
    await openModes(page);
    await expect(page.locator('.win.open[data-win="modes"] .mode-c')).toHaveCount(8);
  });

  test('study → café scene, rainy track, FOCUS view, pomodoro', async ({ page }) => {
    await openModes(page);
    await page.locator('.mode-c[data-mode="study"]').tap();
    await expect(page.locator('body')).toHaveAttribute('data-scene', 'cafe');
    await expect(page.locator('body')).toHaveClass(/\bfocus\b/);
    await expect(page.locator('#hud')).toContainText(/勉強|Study/);
    expect(await page.evaluate(() => localStorage.getItem('cell:mode'))).toBe('"study"');
    // saved timer settings are untouched
    expect(await page.evaluate(() => localStorage.getItem('cell:tcfg'))).toBeNull();
  });

  test('break → campfire and a running 5-minute timer', async ({ page }) => {
    await openModes(page);
    await page.locator('.mode-c[data-mode="break"]').tap();
    await expect(page.locator('body')).toHaveAttribute('data-scene', 'camp');
    await expect(page.locator('#mini')).toContainText(/0[45]:\d\d/);
  });

  test('reading → zen, meditation → breathing', async ({ page }) => {
    await openModes(page);
    await page.locator('.mode-c[data-mode="reading"]').tap();
    await expect(page.locator('body')).toHaveClass(/\bzen\b/);
    await page.keyboard.press('p');
    await page.locator('.mode-c[data-mode="meditate"]').tap();
    await expect(page.locator('body')).not.toHaveClass(/\bzen\b/);
    await expect(page.locator('#breath')).toBeVisible();
  });

  test('kids → 15-minute focus with the big clock', async ({ page }) => {
    await openModes(page);
    await page.locator('.mode-c[data-mode="kids"]').tap();
    await expect(page.locator('body')).toHaveClass(/\bfocus\b/);
    await expect(page.locator('#focusBar [data-ft]')).toHaveText(/1[45]:\d\d/);
  });

  test('sleep → waves, music off, 30-minute sleep timer, darkness; wake up restores', async ({ page }) => {
    await openModes(page);
    await page.locator('.mode-c[data-mode="sleep"]').tap();
    await expect(page.locator('body')).toHaveAttribute('data-scene', 'sea');
    await expect(page.locator('#night')).toBeVisible();
    await expect(page.locator('#night [data-ns]')).toContainText(/2[89]:|30:00/);
    await expect(page.locator('#play')).toHaveAttribute('aria-label', /再生|Play/);
    await page.locator('#night').tap({ position: { x: 50, y: 50 } });
    await page.locator('[data-na="more"]').tap();
    await expect(page.locator('#night [data-ns]')).toContainText(/4[45]:/);
    await page.locator('[data-na="wake"]').tap();
    await expect(page.locator('#night')).toBeHidden();
  });
});

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => { await openApp(page); await enter(page); });

  test('text size changes the type scale and persists', async ({ page }) => {
    await page.keyboard.press(',');
    const win = page.locator('.win.open[data-win="settings"]');
    await win.locator('[data-set="ts"] [data-v="xl"]').tap();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ts').trim())).toBe('1.260');
    await page.reload();
    await enter(page);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ts').trim())).toBe('1.260');
  });

  test('switches: sounds, solid backgrounds, keep screen on', async ({ page }) => {
    await page.keyboard.press(',');
    const win = page.locator('.win.open[data-win="settings"]');
    await win.locator('[data-pref="solid"]').tap();
    await expect(page.locator('body')).toHaveClass(/\bsolid\b/);
    await win.locator('[data-pref="sound"]').tap();
    await win.locator('[data-pref="awake"]').tap();
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem('cell:prefs')));
    expect(p).toMatchObject({ solid: true, sound: false, awake: false });
  });
});

test('records: month view shows the heat map and totals', async ({ page }) => {
  const now = new Date();
  const stats = {};
  for (let d = 1; d <= Math.min(now.getDate(), 10); d++) stats[k(new Date(now.getFullYear(), now.getMonth(), d))] = { focus: d * 20, pomos: 1, tasks: 0 };
  await openApp(page, { storage: { 'cell:stats': stats } });
  await enter(page);
  const win = await openWin(page, 'log');
  await win.locator('[data-lv="month"]').tap();
  await expect(win.locator('.hd')).toHaveCount(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
  await expect(win.locator('.hd.l1, .hd.l2, .hd.l3, .hd.l4').first()).toBeVisible();
  const total = Object.values(stats).reduce((a, s) => a + s.focus, 0);
  await expect(win.locator('.msum')).toContainText(`${Math.floor(total / 60)}時間${total % 60}分`);
  await win.locator('[data-mn="-1"]').tap();
  await expect(win.locator('.cal-h b')).not.toHaveText(`${now.getFullYear()}年${now.getMonth() + 1}月`);
  await win.locator('[data-lv="week"]').tap();
  await expect(win.locator('.bars')).toBeVisible();
});

test.describe('first-run tour', () => {
  test('shows once for a new user, pages can be swiped, then never again', async ({ page }) => {
    await openApp(page, { tour: true });
    await enter(page);
    const tour = page.locator('#tour');
    await expect(tour).toBeVisible();
    await tour.locator('[data-t="next"]').tap();
    await expect(tour.locator('.tour-dots i').nth(1)).toHaveClass(/on/);
    await tour.locator('[data-t="next"]').tap();
    await expect(tour.locator('[data-t="next"]')).toHaveText(/はじめる|Get Started/);
    await tour.locator('[data-t="next"]').tap();
    await expect(tour).toBeHidden();
    await page.reload();
    await enter(page);
    await page.waitForTimeout(900);
    await expect(tour).toBeHidden();
  });

  test('can be skipped and replayed from settings', async ({ page }) => {
    await openApp(page, { tour: true });
    await enter(page);
    await page.locator('#tour [data-t="skip"]').tap();
    await expect(page.locator('#tour')).toBeHidden();
    await page.keyboard.press(',');
    await page.locator('.win.open [data-a="tour"]').tap();
    await expect(page.locator('#tour')).toBeVisible();
  });
});

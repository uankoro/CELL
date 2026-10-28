// The App Store build: inside the iOS shell (Capacitor) timers, reminders and casual alarms become iOS notifications
// while CELL is in the background (on screen it rings by itself, so nothing rings twice); haptics are real; keep-awake
// goes through the native plugin. A recording stand-in for Capacitor plays the iOS side here.
import { test, expect, openApp, enter, openWin } from './fixtures.mjs';

async function fakeNative(page) {
  await page.addInitScript(() => {
    const calls = window.__native = { scheduled: [], cancelled: [], haptics: [], awake: [], asked: 0 };
    let pending = [];
    window.__pending = () => pending.map(x => ({ id: x.id, at: +x.schedule.at, body: x.body }));
    // the app going to the background and back
    window.__bg = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__bg });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__bg ? 'hidden' : 'visible') });
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        LocalNotifications: {
          getPending: async () => ({ notifications: pending.map(x => ({ id: x.id })) }),
          cancel: async ({ notifications }) => { calls.cancelled.push(...notifications.map(n => n.id)); pending = pending.filter(p => !notifications.some(n => n.id === p.id)); },
          checkPermissions: async () => ({ display: calls.asked ? 'granted' : 'prompt' }),
          requestPermissions: async () => { calls.asked++; return { display: 'granted' }; },
          schedule: async ({ notifications }) => { pending.push(...notifications); calls.scheduled.push(notifications.length); }
        },
        Haptics: { impact: async o => { calls.haptics.push(o.style); }, notification: async o => { calls.haptics.push(o.type); } },
        KeepAwake: { keepAwake: async () => { calls.awake.push(true); }, allowSleep: async () => { calls.awake.push(false); } }
      }
    };
  });
}
const background = (page, on) => page.evaluate(v => { window.__bg = v; document.dispatchEvent(new Event('visibilitychange')); }, on);
const pending = page => page.evaluate(() => window.__pending());

test('a running timer is handed to iOS only while CELL is in the background', async ({ page }) => {
  await fakeNative(page);
  await openApp(page);
  await enter(page);
  const win = await openWin(page, 'timer');
  await win.locator('[data-a="go"]').tap();
  // on screen: permission is asked up front, but nothing is scheduled with iOS
  await expect.poll(() => page.evaluate(() => window.__native.asked)).toBe(1);
  await page.waitForTimeout(500);
  expect(await pending(page)).toEqual([]);
  // to the background: the timer's end is scheduled
  await background(page, true);
  await expect.poll(async () => (await pending(page)).find(n => n.id === 1)?.at || 0).toBeGreaterThan(Date.now() + 24 * 60e3);
  // back on screen: iOS lets go again
  await background(page, false);
  await expect.poll(async () => (await pending(page)).length).toBe(0);
  // paused, then backgrounded: nothing about the timer
  await win.locator('[data-a="go"]').tap();
  await background(page, true);
  await page.waitForTimeout(500);
  expect((await pending(page)).some(n => n.id === 1)).toBe(false);
  await background(page, false);
  // keep-awake went through the native plugin while the timer ran
  expect(await page.evaluate(() => window.__native.awake)).toContain(true);
});

test('reminders (daily ones for a week ahead) and casual alarms ring through iOS; done ones do not', async ({ page }) => {
  await fakeNative(page);
  const soon = Date.now() + 3600e3;
  await openApp(page, { storage: {
    'cell:reminders': [
      { id: 'old', text: '済んだ用事', at: soon, done: true },
      { id: 'd', text: '薬を飲む', at: soon, repeat: 'daily', done: false }
    ],
    'suikyo-clock-v1': JSON.stringify({ rev: 1, tasks: [], alarms: [{ id: 'al1', time: '06:30', label: '起床', days: [1, 2, 3, 4, 5], on: true }], prefs: { mode: 'future', h12: false, sec: true } })
  } });
  await enter(page);
  const win = await openWin(page, 'reminders');
  await win.locator('[data-tx]').fill('ゴミ出し');
  await win.locator('[data-q="30"]').tap();
  await background(page, true);
  await expect.poll(async () => (await pending(page)).map(n => n.body)).toContain('ゴミ出し');
  const p = await pending(page);
  expect(p.filter(n => n.body === '薬を飲む')).toHaveLength(7);
  expect(p.map(n => n.body)).not.toContain('済んだ用事');
  const wake = p.filter(n => n.body === '起床');
  expect(wake.length).toBeGreaterThanOrEqual(4);
  // the app runs on Japan time (playwright.config timezoneId)
  const wd = at => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Date(at).toLocaleString('en-US', { timeZone: 'Asia/Tokyo', weekday: 'short' }));
  for (const n of wake) expect([1, 2, 3, 4, 5]).toContain(wd(n.at));
  expect(new Set(p.map(n => n.id)).size).toBe(p.length);
  expect(p.length).toBeLessThanOrEqual(60);
});

test('deleting a reminder while the permission prompt is up never schedules it', async ({ page }) => {
  await fakeNative(page);
  await openApp(page);
  await enter(page);
  const win = await openWin(page, 'reminders');
  await win.locator('[data-tx]').fill('消す予定');
  await win.locator('[data-q="30"]').tap();
  await win.locator('.it', { hasText: '消す予定' }).locator('[data-a="del"]').tap();
  await background(page, true);
  await page.waitForTimeout(700);
  expect((await pending(page)).map(n => n.body)).not.toContain('消す予定');
});

test('completing a task gives a success haptic; deleting gives a firmer one', async ({ page }) => {
  await fakeNative(page);
  await openApp(page);
  await enter(page);
  const win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('手触り');
  await win.locator('[data-a="add"]').tap();
  await win.locator('.task', { hasText: '手触り' }).locator('[data-a="done"]').tap();
  await expect.poll(() => page.evaluate(() => window.__native.haptics)).toContain('SUCCESS');
  await win.locator('[data-f="all"]').tap();
  await win.locator('.task', { hasText: '手触り' }).locator('[data-a="del"]').tap();
  await expect.poll(() => page.evaluate(() => window.__native.haptics)).toContain('MEDIUM');
});

// The App Store build: inside the iOS shell (Capacitor) timers and reminders become iOS notifications, haptics are real,
// and keep-awake goes through the native plugin. A recording stand-in for Capacitor plays the iOS side here.
import { test, expect, openApp, enter, openWin } from './fixtures.mjs';

async function fakeNative(page) {
  await page.addInitScript(() => {
    const calls = window.__native = { scheduled: [], cancelled: [], haptics: [], awake: [] };
    let pending = [];
    window.__pending = () => pending.map(x => x.id);
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        LocalNotifications: {
          getPending: async () => ({ notifications: pending.map(x => ({ id: x.id })) }),
          cancel: async ({ notifications }) => { calls.cancelled.push(...notifications.map(n => n.id)); pending = pending.filter(p => !notifications.some(n => n.id === p.id)); },
          checkPermissions: async () => ({ display: 'granted' }),
          requestPermissions: async () => ({ display: 'granted' }),
          schedule: async ({ notifications }) => { pending.push(...notifications); calls.scheduled.push(notifications.map(n => ({ id: n.id, at: +n.schedule.at, title: n.title, body: n.body }))); }
        },
        Haptics: { impact: async o => { calls.haptics.push(o.style); }, notification: async o => { calls.haptics.push(o.type); } },
        KeepAwake: { keepAwake: async () => { calls.awake.push(true); }, allowSleep: async () => { calls.awake.push(false); } }
      }
    };
  });
}
const last = page => page.evaluate(() => window.__native.scheduled.at(-1) || []);

test('a running timer is handed to iOS for its end, and taken back when paused', async ({ page }) => {
  await fakeNative(page);
  await openApp(page);
  await enter(page);
  const win = await openWin(page, 'timer');
  await win.locator('[data-a="go"]').tap();
  await expect.poll(async () => (await last(page)).find(n => n.id === 1)?.title).toMatch(/集中|Focus/);
  const at = (await last(page)).find(n => n.id === 1).at;
  expect(Math.abs(at - (Date.now() + 25 * 60e3))).toBeLessThan(15000);
  await win.locator('[data-a="go"]').tap();
  await expect.poll(() => page.evaluate(() => window.__native.cancelled.includes(1))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__pending().includes(1))).toBe(false);
  // keep-awake went through the native plugin while the timer ran
  expect(await page.evaluate(() => window.__native.awake)).toContain(true);
});

test('reminders are scheduled with iOS; done ones are not', async ({ page }) => {
  await fakeNative(page);
  await openApp(page, { storage: { 'cell:reminders': [{ id: 'old', text: '済んだ用事', at: Date.now() + 3600e3, done: true }] } });
  await enter(page);
  const win = await openWin(page, 'reminders');
  await win.locator('[data-tx]').fill('ゴミ出し');
  await win.locator('[data-q="30"]').tap();
  await expect.poll(async () => (await last(page)).map(n => n.body)).toContain('ゴミ出し');
  expect((await last(page)).map(n => n.body)).not.toContain('済んだ用事');
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

// Data saved by the previous version (v1, before any schema marker) must survive the upgrade untouched.
import { test, expect, openApp, enter, openWin } from './fixtures.mjs';

const today = new Date();
const k = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const V1 = {
  'cell:scene': '"cafe"',
  'cell:track': '2',
  'cell:vol': '0.55',
  'cell:mix': JSON.stringify({ cafe: { rain: 0.7, cafe: 0.2 } }),
  'cell:tasks': JSON.stringify([
    { id: 'a1', text: '旧データのタスク', pri: 2, due: k(today), done: false, created: 1700000000000, pomos: 3 },
    { id: 'a2', text: '終わったタスク', pri: 0, due: '', done: true, created: 1700000000001, doneAt: 1700000500000, pomos: 0 }
  ]),
  'cell:pinned': '"a1"',
  'cell:reminders': JSON.stringify([{ id: 'r1', text: '旧リマインダー', at: Date.now() + 864e5, repeat: 'daily', done: false }]),
  'cell:memo': '"旧メモ"',
  'cell:stickies': JSON.stringify([{ id: 's1', text: '旧付箋', c: 2, x: 200, y: 120, w: 230, h: 190, r: 1 }]),
  'cell:stats': JSON.stringify({ [k(today)]: { focus: 50, pomos: 2, tasks: 1 } }),
  'cell:tcfg': JSON.stringify({ focus: 30, short: 5, long: 20, auto: true, custom: 12 }),
  'cell:goal': '180',
  'cell:pins': JSON.stringify({ cal: { on: true, x: 120, y: 100 }, tasks: { on: false, x: null, y: null } }),
  'cell:type': '"chill"',
  'suikyo-clock-v1': JSON.stringify({ rev: 5, tasks: [], alarms: [{ id: 'al1', time: '07:30', label: '起床', days: [1, 2, 3, 4, 5], on: true }], prefs: { mode: 'pop', h12: true, sec: false } })
};

test('v1 data loads untouched and is marked with the current schema', async ({ page }) => {
  await openApp(page, { storage: V1 });
  await enter(page);
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'cafe');
  await expect(page.locator('#tTitle')).toHaveText(/雨宿りのブレンド|Rainy Day Blend/);
  await expect(page.locator('#nowTask')).toContainText('旧データのタスク');
  await expect(page.locator('.stk textarea')).toHaveValue('旧付箋');
  await expect(page.locator('#pins [data-pw="cal"]')).toBeVisible();
  const win = await openWin(page, 'tasks');
  await expect(win.locator('.task', { hasText: '旧データのタスク' })).toBeVisible();
  const after = await page.evaluate(keys => Object.fromEntries(keys.map(x => [x, localStorage.getItem(x)])), Object.keys(V1));
  for (const key of Object.keys(V1)) expect(JSON.parse(after[key]), key).toEqual(JSON.parse(V1[key]));
  expect(await page.evaluate(() => localStorage.getItem('cell:schema'))).toBe('2');
  // returning users skip the first-run tour
  await expect(page.locator('#tour')).toBeHidden();
});

test('v1 casual data (alarms, mode) still shows in the casual clock', async ({ page }) => {
  await openApp(page, { storage: V1 });
  await enter(page);
  await page.locator('#btnType').tap();
  const fr = page.frameLocator('#casual');
  await expect(fr.locator('body')).toHaveAttribute('data-mode', 'pop');
  await expect(fr.locator('#aList')).toContainText('起床');
});

test('corrupted storage never prevents start-up', async ({ page }) => {
  await openApp(page, { storage: { 'cell:tasks': '{not json', 'cell:stats': '[]', 'cell:mix': 'null', 'cell:pins': '"x"', 'cell:stickies': '5' } });
  await enter(page);
  await expect(page.locator('#clock')).not.toBeEmpty();
  await openWin(page, 'tasks');
  await openWin(page, 'log');
});

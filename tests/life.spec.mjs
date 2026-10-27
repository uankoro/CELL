// ライフ: the third way to use CELL. Today at a glance (routines, reminders, alarms, medicine, tasks), the household's rhythm
// (garbage days, chores every N days, payments), the weather for going out, one-tap records, habits without streaks, and a look back.
import { test, expect, openApp, menuItem, reveal } from './fixtures.mjs';

// Wednesday 28 October 2026, 10:00 in Tokyo
const WED = new Date('2026-10-28T10:00:00+09:00');
const life = (o = {}) => ({ 'cell:life': Object.assign({ track: { mood: true, sleep: true, water: true }, waterGoal: 8, routines: [], habits: [], chores: [], meds: [] }, o) });

async function openLife(page, storage = {}) {
  await openApp(page, { storage });
  await page.locator('#enterLife').tap();
  await expect(page.locator('#life')).toBeVisible();
  await expect(page.locator('#boot')).toHaveCount(0);
}
const sheet = (page, id) => page.locator(`.win.open[data-win="${id}"]`);

/* a weather answer in Open-Meteo's shape: today and tomorrow, hourly for 48 hours */
function forecast({ rain = 70, max = 22, min = 14 } = {}) {
  const hours = Array.from({ length: 48 }, (_, i) => { const h = i % 24, d = i < 24 ? '2026-10-28' : '2026-10-29'; return `${d}T${String(h).padStart(2, '0')}:00`; });
  return { current: { temperature_2m: 18.2, weather_code: 61 },
    hourly: { time: hours, temperature_2m: hours.map(() => 17), precipitation_probability: hours.map(() => 40), weather_code: hours.map(() => 3) },
    daily: { time: ['2026-10-28', '2026-10-29'], weather_code: [61, 1], temperature_2m_max: [max, 20], temperature_2m_min: [min, 12], precipitation_probability_max: [rain, 10], uv_index_max: [3, 4] } };
}

test('Life opens from the start screen, the ⋯ menu and the H key, and is remembered', async ({ page }) => {
  await openLife(page);
  await expect(page.locator('.lf-sw [data-type="life"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveTitle(/ライフ/);
  // back to chill through the switcher
  await page.locator('.lf-sw [data-type="chill"]').tap();
  await expect(page.locator('#life')).toBeHidden();
  await expect(page.locator('#ui')).toBeVisible();
  // ⋯ → Life, then H → chill, H → Life again
  await menuItem(page, 'btnLife');
  await expect(page.locator('#life')).toBeVisible();
  await page.keyboard.press('h');
  await expect(page.locator('#life')).toBeHidden();
  await page.keyboard.press('h');
  await expect(page.locator('#life')).toBeVisible();
  // a reload comes back to Life without the start screen
  await page.reload();
  await expect(page.locator('#life')).toBeVisible();
  await expect(page.locator('#boot')).toHaveCount(0);
});

test('the casual clock can switch to Life, and Life to casual', async ({ page }) => {
  await openLife(page);
  await page.locator('.lf-sw [data-type="casual"]').tap();
  await expect(page.locator('#casual')).toBeVisible();
  await expect(page.locator('#life')).toBeHidden();
  const sw = page.frameLocator('#casual').locator('#typesw [data-type="life"]');
  await sw.tap();
  await expect(page.locator('#life')).toBeVisible();
  await expect(page.locator('#casual')).toBeHidden();
});

test('an empty day explains itself and offers a routine to start from', async ({ page }) => {
  await openLife(page);
  await expect(page.locator('[data-col="b"]')).toContainText('朝と夜の流れ');
  await page.locator('[data-col="b"] [data-a="tpl"]').first().tap();
  await expect(page.locator('[data-col="b"] .lf-it[data-kind="routine"]')).toContainText('朝のルーティン');
  await expect(page.locator('.lf-sky-set')).toBeVisible();
});

test('garbage on the 2nd and 4th Wednesday: shown today, tomorrow\'s shown as tomorrow; done and "not this time" stick', async ({ page }) => {
  await page.clock.install({ time: WED });
  await openLife(page, life({ chores: [
    { id: 'g1', name: '資源ゴミ', kind: 'gomi', rule: { t: 'nth', n: [2, 4], wd: 3 }, eve: '20:00', morn: '08:00' }, // 28 Oct = 4th Wednesday
    { id: 'g2', name: 'びん・缶', kind: 'gomi', rule: { t: 'nth', n: [1, 3], wd: 3 } }, // not today
    { id: 'g3', name: '燃えるゴミ', kind: 'gomi', rule: { t: 'week', days: [4] } } // Thursday = tomorrow
  ] }));
  const a = page.locator('[data-col="a"]');
  await expect(a.locator('[data-ch="g1"]')).toContainText('今日');
  await expect(a.locator('[data-ch="g2"]')).toHaveCount(0);
  await expect(a.locator('[data-ch="g3"]')).toContainText('明日');
  await a.locator('[data-ch="g1"] [data-a="chore"]').tap();
  await expect(a.locator('[data-ch="g1"]')).toHaveClass(/done/);
  await page.reload();
  await expect(page.locator('[data-col="a"] [data-ch="g1"]')).toHaveClass(/done/);
  // tomorrow's has no collection this time (long press → menu)
  await page.locator('[data-col="a"] [data-ch="g3"]').click({ button: 'right' });
  await page.locator('.menu button', { hasText: '今回はなし' }).click();
  await expect(page.locator('[data-col="a"] [data-ch="g3"]')).toHaveCount(0);
});

test('a chore every 7 days stays on today\'s list once overdue, and moves on when done', async ({ page }) => {
  await page.clock.install({ time: WED });
  await openLife(page, life({ chores: [{ id: 'h1', name: 'シーツを洗う', kind: 'home', rule: { t: 'every', n: 7, from: '2026-10-19' }, last: '2026-10-19' }] }));
  const row = page.locator('[data-col="a"] [data-ch="h1"]');
  await expect(row).toContainText('2日過ぎています');
  await row.locator('[data-a="chore"]').tap();
  await expect(row).toHaveClass(/done/);
  // the next one is a week from today
  await page.locator('[data-col="a"] [data-go="lchores"]').tap();
  await expect(sheet(page, 'lchores')).toContainText('7日ごと');
  await expect(sheet(page, 'lchores')).toContainText('次は 11/4');
});

test('setting up a garbage day from the sheet: the 2nd and 4th Wednesday, reminded the evening before', async ({ page }) => {
  await page.clock.install({ time: WED });
  await openLife(page);
  await page.locator('[data-col="a"] [data-go="lchores"]').tap();
  const s = sheet(page, 'lchores');
  await s.locator('[data-a="gomi"]', { hasText: '資源ゴミ' }).tap();
  await s.locator('[data-f="rt"]').selectOption('nth');
  await expect(s.locator('[data-nth="2"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(s.locator('[data-nth="4"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(s).toContainText('次は 今日');
  await s.locator('[data-nwd="3"]').tap();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('cell:life')).chores[0]);
  expect(saved).toMatchObject({ name: '資源ゴミ', kind: 'gomi', rule: { t: 'nth', wd: 3 }, eve: '20:00' });
  expect(saved.rule.n.sort()).toEqual([2, 4]);
});

test('the evening before garbage day, CELL says so (in any mode)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-28T19:59:00+09:00') });
  await openLife(page, life({ chores: [{ id: 'g3', name: '燃えるゴミ', kind: 'gomi', rule: { t: 'week', days: [4] }, eve: '20:00' }] }));
  await page.locator('.lf-sw [data-type="chill"]').tap();
  await page.clock.fastForward('01:30');
  const t = page.locator('.toast', { hasText: '明日のくらし' });
  await expect(t).toBeVisible();
  await expect(t).toContainText('燃えるゴミ');
});

test('a routine, one step at a time: the water step logs a glass, and the routine is ticked off today', async ({ page }) => {
  await page.clock.install({ time: WED });
  await openLife(page, life({ routines: [{ id: 'r1', name: '朝のルーティン', time: '07:00', days: [], notify: true, steps: [
    { id: 's1', text: '起きたら水を一杯', min: 1, act: 'water' }, { id: 's2', text: '身支度', min: 10, act: '' }] }] }));
  await page.locator('[data-a="run"][data-id="r1"]').tap();
  const run = page.locator('#lfRun');
  await expect(run).toBeVisible();
  await expect(run.locator('[data-rt]')).toHaveText('起きたら水を一杯');
  await expect(run.locator('[data-rm] b')).toHaveText('01:00');
  await run.locator('[data-ra="act"]').tap();
  await expect(run.locator('[data-rt]')).toHaveText('身支度');
  await expect(run.locator('[data-rx]')).toContainText('これで最後です');
  await run.locator('[data-ra="next"]').tap();
  await expect(run).toBeHidden();
  await expect(page.locator('.toast', { hasText: 'おつかれさまでした' })).toBeVisible();
  await expect(page.locator('.lf-it[data-kind="routine"]')).toHaveClass(/done/);
  await expect(page.locator('.lf-wa')).toContainText('水 1杯');
});

test('Escape leaves a routine without ticking it off', async ({ page }) => {
  await openLife(page, life({ routines: [{ id: 'r1', name: '夜', time: '', days: [], steps: [{ id: 's1', text: '準備', min: 0, act: '' }] }] }));
  await page.locator('[data-a="run"]').tap();
  await expect(page.locator('#lfRun')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#lfRun')).toBeHidden();
  await expect(page.locator('.lf-it[data-kind="routine"]')).not.toHaveClass(/done/);
});

test('today in order of time: routines, reminders, medicine and tasks due today, with a line at now', async ({ page }) => {
  await page.clock.install({ time: WED });
  const at = (h, m) => new Date(`2026-10-28T${h}:${m}:00+09:00`).getTime();
  await openLife(page, Object.assign(life({ routines: [{ id: 'r1', name: '朝', time: '07:00', days: [], steps: [{ id: 's', text: 'x', min: 0 }] }], meds: [{ id: 'm1', name: 'ビタミンD', times: ['08:00', '20:00'] }] }), {
    'cell:reminders': [{ id: 'x1', text: '歯医者', at: at('15', '30'), repeat: 'none', done: false }],
    'cell:tasks': [{ id: 't1', text: '企画書', pri: 0, due: '2026-10-28', done: false, created: 1, pomos: 0 }, { id: 't2', text: '来週の件', pri: 0, due: '2026-11-04', done: false, created: 1, pomos: 0 }] }));
  const rows = page.locator('[data-col="b"] .lf-it');
  await expect(rows.locator('time')).toHaveText(['7:00', '8:00', '15:30', '20:00', '']);
  await expect(page.locator('[data-col="b"]')).not.toContainText('来週の件');
  // the line for "now" (10:00) sits between 8:00 and 15:30
  const order = await page.evaluate(() => [...document.querySelectorAll('[data-col="b"] > *')].map(e => e.classList.contains('lf-nowline') ? 'NOW' : (e.querySelector('time') || {}).textContent).filter(Boolean));
  expect(order.slice(0, 4)).toEqual(['7:00', '8:00', 'NOW', '15:30']);
  await page.locator('[data-a="med"][data-t="08:00"]').tap();
  await expect(page.locator('[data-a="med"][data-t="08:00"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-a="task"][data-id="t1"]').tap();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cell:tasks')).find(t => t.id === 't1').done)).toBe(true);
});

test('mood, water and habits are one tap each and survive a reload; no streaks', async ({ page }) => {
  await page.clock.install({ time: WED });
  await openLife(page, life({ habits: [{ id: 'h1', name: 'ストレッチ', per: 'day', target: 1 }, { id: 'h2', name: '散歩', per: 'week', target: 3 }] }));
  await page.locator('.lf-mood [data-v="4"]').tap();
  await page.locator('.lf-wa [data-v="1"]').tap();
  await page.locator('.lf-wa [data-v="1"]').tap();
  await page.locator('[data-a="habit"][data-id="h1"]').tap();
  await page.locator('[data-a="habit"][data-id="h2"]').tap();
  await expect(page.locator('[data-a="habit"][data-id="h2"]')).toContainText('今週 1/3回');
  await page.reload();
  await expect(page.locator('.lf-mood [data-v="4"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.lf-wa')).toContainText('水 2杯');
  await expect(page.locator('[data-a="habit"][data-id="h1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#life')).not.toContainText(/連続|streak/i);
  // tapping the mood again clears it
  await page.locator('.lf-mood [data-v="4"]').tap();
  await expect(page.locator('.lf-mood [data-v="4"]')).toHaveAttribute('aria-pressed', 'false');
});

test('adding a habit from the sheet', async ({ page }) => {
  await openLife(page);
  await page.locator('[data-col="c"] [data-go="lhabits"]').tap();
  const s = sheet(page, 'lhabits');
  await s.locator('[data-n]').fill('早起き');
  await s.locator('[data-per] [data-v="week"]').tap();
  await s.locator('[data-t]').selectOption('4');
  await s.locator('[data-a="add"]').tap();
  await expect(s.locator('.it')).toContainText('週4回');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-col="c"] .lf-hab')).toContainText('今週 0/4回');
});

test('the weather: temperature, rain and one line of advice; the last forecast is kept when offline', async ({ page }) => {
  await page.clock.install({ time: WED });
  let online = true;
  await page.route(/api\.open-meteo\.com/, r => online ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(forecast()) }) : r.abort());
  await openLife(page, life({ place: { name: '東京', lat: 35.69, lon: 139.69 } }));
  const sky = page.locator('.lf-sky');
  await expect(sky).toContainText('18°');
  await expect(sky).toContainText('降水 70%');
  await expect(sky).toContainText('傘を持って出かけましょう');
  online = false;
  await page.reload();
  await expect(page.locator('.lf-sky')).toContainText('18°');
});

test('choosing a weather place in Life settings', async ({ page }) => {
  await page.clock.install({ time: WED });
  await page.route(/api\.open-meteo\.com/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(forecast({ rain: 10, max: 33, min: 24 })) }));
  await openLife(page);
  await page.locator('.lf-sky-set').tap();
  await sheet(page, 'lset').locator('[data-place]').selectOption('大阪');
  await page.keyboard.press('Escape');
  await expect(page.locator('.lf-sky')).toContainText('暑くなります');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cell:life')).place.name)).toBe('大阪');
});

test('sleep mode on the chill side is the sleep record', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-27T23:30:00+09:00') });
  await openLife(page);
  await page.locator('.lf-sw [data-type="chill"]').tap();
  await page.keyboard.press('p');
  await page.locator('.win.open [data-mode="sleep"]').tap();
  await expect(page.locator('#night')).toBeVisible();
  await page.clock.fastForward('07:15:00');
  await page.locator('#night').tap();
  await page.locator('#night [data-na="wake"]').tap();
  await reveal(page);
  await page.keyboard.press('h');
  await expect(page.locator('.lf-sl')).toContainText('7時間');
});

test('the look back: focus, sleep, mood, habits and a few observations; 7 and 30 days', async ({ page }) => {
  await page.clock.install({ time: WED });
  const days = {}, stats = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(WED.getTime() - i * 864e5), k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const good = i % 2 === 0, wake = d.getTime() - 3 * 36e5;
    days[k] = { mood: good ? 5 : 2, sleep: { bed: wake - (good ? 8 : 5) * 36e5, wake }, habits: { h1: good ? 1 : 0 }, water: 6 };
    stats[k] = { focus: 30 + i * 10, pomos: 1, tasks: 0 };
  }
  days['2026-10-26'].note = '駅まで歩いた';
  await openLife(page, Object.assign(life({ habits: [{ id: 'h1', name: 'ストレッチ', per: 'day', target: 1 }] }), { 'cell:lifeDays': days, 'cell:stats': stats }));
  await page.locator('.lf-tabs [data-tab="week"]').tap();
  const w = page.locator('[data-view="week"]');
  await expect(w.locator('.lf-card')).toHaveCount(8);
  await expect(w).toContainText('7時間以上眠った日の気分');
  await expect(w).toContainText('駅まで歩いた');
  await expect(w.locator('.lf-hrow .lf-dots i')).toHaveCount(7);
  await w.locator('[data-r="30"]').tap();
  await expect(w.locator('.lf-hrow .lf-dots i')).toHaveCount(30);
});

test('a line for today is kept, and comes back a year later', async ({ page }) => {
  await page.clock.install({ time: WED });
  await openLife(page, { 'cell:lifeDays': { '2025-10-28': { note: '引っ越した日' } } });
  await expect(page.locator('[data-ago]')).toContainText('引っ越した日');
  await page.locator('[data-note]').fill('いい天気だった');
  await page.locator('[data-note]').press('Enter');
  await page.reload();
  await expect(page.locator('[data-note]')).toHaveValue('いい天気だった');
});

test('Life in English: everything is translated; the place and user words stay as typed', async ({ page }) => {
  await openApp(page, { storage: Object.assign(life({ habits: [{ id: 'h1', name: 'ストレッチ', per: 'day', target: 1 }] }), { 'cell:prefs': { lang: 'en', autohide: false } }) });
  await page.locator('#enterLife').tap();
  await expect(page.locator('.lf-tabs [data-tab="week"]')).toHaveText('Look Back');
  await expect(page.locator('.lf-hab [data-u]')).toHaveText('ストレッチ');
  await expect(page.locator('[data-col="b"]')).toContainText('Set up your morning');
});

test('the App Store build hands garbage-day and medicine alerts to iOS while in the background', async ({ page }) => {
  await page.addInitScript(() => {
    let pending = []; window.__pending = () => pending.map(x => ({ id: x.id, at: +x.schedule.at, title: x.title, body: x.body }));
    window.__bg = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__bg });
    window.Capacitor = { isNativePlatform: () => true, Plugins: { LocalNotifications: {
      getPending: async () => ({ notifications: pending.map(x => ({ id: x.id })) }), cancel: async ({ notifications }) => { pending = pending.filter(p => !notifications.some(n => n.id === p.id)); },
      checkPermissions: async () => ({ display: 'granted' }), requestPermissions: async () => ({ display: 'granted' }), schedule: async ({ notifications }) => { pending.push(...notifications); } } } };
  });
  await page.clock.install({ time: WED });
  await openLife(page, life({ chores: [{ id: 'g3', name: '燃えるゴミ', kind: 'gomi', rule: { t: 'week', days: [4] }, eve: '20:00' }], meds: [{ id: 'm1', name: 'ビタミンD', times: ['21:00'] }] }));
  await page.evaluate(() => { window.__bg = true; document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(async () => (await page.evaluate(() => window.__pending())).length).toBeGreaterThan(0);
  const p = await page.evaluate(() => window.__pending());
  const first = p.sort((a, b) => a.at - b.at).slice(0, 2);
  expect(first.map(x => x.body)).toEqual(['燃えるゴミ', 'ビタミンD']);
  expect(first[0].title).toBe('明日のくらし');
  expect(first[0].at).toBe(new Date('2026-10-28T20:00:00+09:00').getTime());
});

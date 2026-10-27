// English UI: everything translated (chill + casual), user text untouched, exact round trip back to Japanese.
import { test, expect, openApp, enter, openWin, openModes, menuItem, pickScene } from './fixtures.mjs';

const JP = /[぀-ヿ㐀-鿿！-～]/;
async function leftovers(page) {
  return page.evaluate(src => {
    const JP = new RegExp(src), out = new Set();
    const scan = doc => {
      const w = doc.createTreeWalker(doc.body, 5);
      for (let n = w.currentNode; n; n = w.nextNode()) {
        const el = n.nodeType === 3 ? n.parentElement : n;
        if (!el || el.closest('[data-u],[data-noi18n],#clock,script,style,textarea,[hidden]')) continue;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (n.nodeType === 3) { if (JP.test(n.data)) out.add(n.data.trim()); }
        else for (const a of ['aria-label', 'title', 'placeholder', 'data-tip']) { const v = n.getAttribute(a); if (v && JP.test(v)) out.add(`@${a}: ${v}`); }
      }
    };
    scan(document);
    const f = document.querySelector('#casual'); if (f && !f.hidden) scan(f.contentDocument);
    return [...out];
  }, JP.source);
}

test('English: every screen is translated and user text stays as typed', async ({ page }) => {
  await openApp(page, { storage: { 'cell:prefs': { lang: 'en' } } });
  expect(await leftovers(page)).toEqual([]);
  await enter(page);
  const win = await openWin(page, 'tasks');
  await win.locator('[data-in]').fill('メールを返す');
  await win.locator('[data-a="add"]').tap();
  await expect(win.locator('.task [data-u]')).toHaveText('メールを返す');
  expect(await leftovers(page)).toEqual([]);
  for (const id of ['timer', 'calendar', 'reminders', 'mixer', 'memo', 'log']) {
    await openWin(page, id);
    expect(await leftovers(page), id).toEqual([]);
  }
  await page.keyboard.press('Escape');
  await openModes(page);
  expect(await leftovers(page), 'modes').toEqual([]);
  await page.keyboard.press(',');
  expect(await leftovers(page), 'settings').toEqual([]);
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  expect(await leftovers(page), 'help').toEqual([]);
  await page.keyboard.press('Escape');
  await menuItem(page, 'btnType');
  await expect(page.locator('#casual')).toBeVisible();
  await page.waitForTimeout(400);
  expect(await leftovers(page), 'casual').toEqual([]);
  await expect(page.frameLocator('#casual').locator('#tList [data-u]')).toHaveText('メールを返す');
});

test('switching English → Japanese restores the original text exactly', async ({ page }) => {
  await openApp(page);
  await enter(page);
  const before = await page.locator('#ui').innerText();
  await page.keyboard.press(',');
  await page.locator('[data-set="lang"] [data-v="en"]').tap();
  await expect(page.locator('#sceneName')).toHaveText('Night Drive');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('[data-set="lang"] [data-v="ja"]').tap();
  await expect(page.locator('#sceneName')).toHaveText('夜ドライブ');
  await page.keyboard.press('Escape');
  const after = await page.locator('#ui').innerText();
  // the clock ticks; compare everything else
  const strip = t => t.replace(/\d/g, '');
  expect(strip(after)).toBe(strip(before));
});

test('English: Life, its look back and its sheets are translated; names typed by the user are not', async ({ page }) => {
  await openApp(page, { storage: { 'cell:prefs': { lang: 'en' }, 'cell:life': { place: { name: '東京', lat: 35.69, lon: 139.69 },
    routines: [{ id: 'r1', name: '朝のルーティン', time: '07:00', days: [], steps: [{ id: 's1', text: '水を一杯', min: 1, act: 'water' }, { id: 's2', text: '着替え', min: 0, act: '' }] }],
    habits: [{ id: 'h1', name: 'ストレッチ', per: 'week', target: 3 }], meds: [{ id: 'm1', name: 'ビタミンD', times: ['08:00', '20:00'] }],
    chores: [{ id: 'c1', name: '資源ゴミ', kind: 'gomi', rule: { t: 'nth', n: [2, 4], wd: 3 }, eve: '20:00' }, { id: 'c2', name: 'シーツ', kind: 'home', rule: { t: 'every', n: 7, from: '2026-01-01' }, last: '2026-01-01' }] } } });
  // a forecast for today, so the weather words are checked too
  await page.route(/open-meteo/, async r => {
    const k = await page.evaluate(() => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; });
    const hours = Array.from({ length: 24 }, (_, i) => `${k}T${String(i).padStart(2, '0')}:00`);
    r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ current: { temperature_2m: 20, weather_code: 2 },
      hourly: { time: hours, temperature_2m: hours.map(() => 20), precipitation_probability: hours.map(() => 60), weather_code: hours.map(() => 61) },
      daily: { time: [k], weather_code: [61], temperature_2m_max: [24], temperature_2m_min: [12], precipitation_probability_max: [60], uv_index_max: [3] } }) });
  });
  await page.locator('#enterLife').tap();
  await expect(page.locator('.lf-wx')).toBeVisible();
  expect(await leftovers(page), 'life').toEqual([]);
  await expect(page.locator('[data-ch="c2"] [data-u]')).toHaveText('シーツ');
  const go = async (sel, name) => { await page.locator(sel).first().tap(); await page.waitForTimeout(300); expect(await leftovers(page), name).toEqual([]); };
  await go('[data-go="lchores"]', 'home list'); await go('.win.open .lf-li', 'home item');
  for (const v of ['nth', 'mday', 'every', 'year']) { await page.locator('.win.open [data-f="rt"]').selectOption(v); expect(await leftovers(page), v).toEqual([]); }
  await page.keyboard.press('Escape');
  await go('[data-go="lroutines"]', 'routines'); await go('.win.open .lf-li', 'routine'); await page.keyboard.press('Escape');
  await go('[data-go="lhabits"]', 'habits'); await page.keyboard.press('Escape');
  await go('[data-go="lsleep"]', 'sleep'); await page.keyboard.press('Escape');
  await go('[data-la="set"]', 'life settings'); await page.keyboard.press('Escape');
  await go('[data-a="run"]', 'routine run'); await page.keyboard.press('Escape');
  await go('.lf-tabs [data-tab="week"]', 'look back'); await go('[data-r="30"]', 'look back 30');
});

test.describe('auto language follows the device', () => {
  test.use({ locale: 'en-US' });
  test('an English device gets English, a stored choice wins', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#enter')).toHaveText('Enter');
    await page.evaluate(() => { localStorage.setItem('cell:prefs', JSON.stringify({ lang: 'ja' })); });
    await page.reload();
    await expect(page.locator('#enter')).toHaveText('入室する');
  });
});

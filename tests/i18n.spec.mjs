// English UI: everything translated (chill + casual), user text untouched, exact round trip back to Japanese.
import { test, expect, openApp, enter, openWin } from './fixtures.mjs';

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
  await page.locator('#brand').tap();
  expect(await leftovers(page), 'modes').toEqual([]);
  await page.keyboard.press(',');
  expect(await leftovers(page), 'settings').toEqual([]);
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  expect(await leftovers(page), 'help').toEqual([]);
  await page.keyboard.press('Escape');
  await page.locator('#btnType').tap();
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

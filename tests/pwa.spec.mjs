// PWA behaviour: manifest, sub-path, offline start, cache versioning.
import { test, expect, openApp, enter } from './fixtures.mjs';

test('manifest is valid, landscape, relative to the /CELL/ sub-path', async ({ page, request }) => {
  await openApp(page);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href.startsWith('/')).toBe(false);
  const res = await request.get(new URL(href, page.url()).href);
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.orientation).toBe('landscape');
  expect(['fullscreen', 'standalone']).toContain(m.display);
  expect(m.start_url).toBe('./');
  expect(m.scope).toBe('./');
  expect(new URL(m.start_url, res.url()).pathname).toBe('/CELL/');
  for (const ic of m.icons) {
    expect(ic.src.startsWith('/')).toBe(false);
    const r = await request.get(new URL(ic.src, res.url()).href);
    expect(r.ok(), ic.src).toBe(true);
  }
  for (const sel of ['link[rel="apple-touch-icon"]', 'meta[name="apple-mobile-web-app-capable"]', 'meta[name="apple-mobile-web-app-status-bar-style"]']) await expect(page.locator(sel)).toHaveCount(1);
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('viewport-fit=cover');
});

test('no absolute URLs that would break under /CELL/', async ({ request }) => {
  const html = await (await request.get('./index.html')).text();
  expect(html).not.toMatch(/(?:href|src)="\/(?!\/)/);
  const sw = await (await request.get('./sw.js')).text();
  expect(sw).not.toMatch(/'\/(?:icons|index|manifest)/);
});

test.describe('service worker', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'WebKit in Playwright does not run service workers on http://localhost reliably');

  test('starts offline after the first visit', async ({ page, context }) => {
    await openApp(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#enter')).toBeVisible();
    await enter(page);
    await expect(page.locator('#clock')).not.toBeEmpty();
    await page.goto('./?from=homescreen');
    await expect(page.locator('#enter')).toBeVisible();
    await context.setOffline(false);
  });

  test('a new version deletes the old caches', async ({ page, context }) => {
    await openApp(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    const before = await page.evaluate(() => caches.keys());
    expect(before.some(k => k.startsWith('cell-shell-'))).toBe(true);
    await context.addCookies([{ name: 'swv', value: 'v999-test', url: 'http://localhost:4173/' }]);
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 15000 }).toEqual(['cell-shell-v999-test']);
  });
});

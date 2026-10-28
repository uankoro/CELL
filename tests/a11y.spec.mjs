// Accessibility: axe-core (WCAG 2.x A/AA rules) on every screen. Serious and critical violations fail the test.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, openApp, enter, openWin, openModes } from './fixtures.mjs';

async function audit(page, name) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // the animated scene canvas sits behind translucent glass, which axe cannot measure; contrast is checked on solid backgrounds below
    .disableRules(['color-contrast'])
    .analyze();
  const bad = r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${name}: ${v.id} — ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
  expect(bad, name).toEqual([]);
}

test('boot, main screen, every window, modes, settings, help', async ({ page }) => {
  test.slow();
  await openApp(page);
  await audit(page, 'boot');
  await enter(page);
  await audit(page, 'main');
  for (const id of ['timer', 'calendar', 'reminders', 'tasks', 'mixer', 'memo', 'log']) { await openWin(page, id); await audit(page, id); }
  await page.keyboard.press('Escape');
  await openModes(page);
  await audit(page, 'modes');
  await page.keyboard.press(',');
  await audit(page, 'settings');
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  await audit(page, 'help');
});

test('first-run tour and sleep screen', async ({ page }) => {
  await openApp(page, { tour: true });
  await enter(page);
  await expect(page.locator('#tour')).toBeVisible();
  await audit(page, 'tour');
  await page.locator('#tour [data-t="skip"]').tap();
  await openModes(page);
  await page.locator('.mode-c[data-mode="sleep"]').tap();
  await expect(page.locator('#night')).toBeVisible();
  await audit(page, 'night');
});

test('text contrast with reduced transparency (solid panels) meets AA', async ({ page }) => {
  await openApp(page, { storage: { 'cell:prefs': { solid: true } } });
  await enter(page);
  for (const id of ['tasks', 'log', 'settings']) {
    if (id === 'settings') await page.keyboard.press(','); else await openWin(page, id);
    const r = await new AxeBuilder({ page }).include(`.win.open[data-win="${id}"]`).withRules(['color-contrast']).analyze();
    expect(r.violations.flatMap(v => v.nodes.map(n => `${id}: ${n.target.join(' ')} ${n.any[0]?.message || ''}`)), id).toEqual([]);
  }
});

test('Life: today, the look back, its sheets and a routine in progress', async ({ page }) => {
  test.slow();
  await openApp(page, { storage: { 'cell:life': { routines: [{ id: 'r1', name: '朝', time: '07:00', days: [], steps: [{ id: 's1', text: '水を一杯', min: 1, act: 'water' }] }],
    habits: [{ id: 'h1', name: 'ストレッチ', per: 'day', target: 1 }], chores: [{ id: 'c1', name: '燃えるゴミ', kind: 'gomi', rule: { t: 'week', days: [0, 1, 2, 3, 4, 5, 6] } }],
    meds: [{ id: 'm1', name: 'ビタミンD', times: ['08:00'] }] } } });
  await page.locator('#enterLife').tap();
  await expect(page.locator('#life')).toBeVisible();
  await audit(page, 'life');
  // text over the blurred room is solid enough to read
  const c = await new AxeBuilder({ page }).include('#life').withRules(['color-contrast']).analyze();
  expect(c.violations.flatMap(v => v.nodes.map(n => `${n.target.join(' ')} ${n.any[0]?.message || ''}`)), 'life contrast').toEqual([]);
  for (const id of ['lroutines', 'lhabits', 'lchores', 'lsleep']) {
    await page.locator(`#life [data-go="${id}"]`).first().tap();
    await expect(page.locator(`.win.open[data-win="${id}"]`)).toBeVisible();
    await audit(page, id);
    await page.keyboard.press('Escape');
  }
  await page.locator('[data-la="set"]').tap();
  await audit(page, 'lset');
  await page.keyboard.press('Escape');
  await page.locator('[data-a="run"]').tap();
  await expect(page.locator('#lfRun')).toBeVisible();
  await audit(page, 'routine');
  await page.keyboard.press('Escape');
  await page.locator('.lf-tabs [data-tab="week"]').tap();
  await audit(page, 'look back');
});

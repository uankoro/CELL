// Accessibility: axe-core (WCAG 2.x A/AA rules) on every screen. Serious and critical violations fail the test.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, openApp, enter, openWin } from './fixtures.mjs';

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
  await page.locator('#brand').tap();
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
  await page.locator('#brand').tap();
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

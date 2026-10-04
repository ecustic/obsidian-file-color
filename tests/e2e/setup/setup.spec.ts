import { test, expect } from '../helpers'

test('Obsidian setup opens and enables the plugin in a disposable vault', async ({ page }) => {
  expect(await page.evaluate(() => Boolean((window as any).app?.plugins?.plugins?.['obsidian-file-color']))).toBe(true)
})

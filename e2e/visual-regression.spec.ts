import { test, expect } from '@playwright/test'
import { DEFAULT_APP_TITLE } from '@bmad-studio/shared'

const pages = [
  { name: 'overview', path: '/' },
  { name: 'agents', path: '/agents' },
  { name: 'teams', path: '/teams' },
  { name: 'skills', path: '/skills' },
  { name: 'workflows', path: '/workflows' },
  { name: 'modules', path: '/modules' },
  { name: 'files', path: '/files' },
  { name: 'outputs', path: '/outputs' },
  { name: 'connections', path: '/connections' },
  { name: 'settings', path: '/settings' },
] as const

test.beforeEach(async ({ page }) => {
  // Mock /api/settings to ensure visual tests are deterministic regardless of
  // the dev machine's actual .bmad-studio/settings.json contents (e.g. a local
  // appTitle override would otherwise change the sidebar header pixels).
  //
  // NOTE: this beforeEach mocks /api/settings for EVERY test in this file. If you
  // add a test that exercises a real settings round-trip (PUT/GET), call
  // `page.unroute('**/api/settings')` at the start of that test before adding
  // your own route handler.
  await page.route('**/api/settings', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ port: 4040, theme: 'dark' }),
      })
    } else {
      await route.continue()
    }
  })
})

for (const { name, path } of pages) {
  test(`${name} page visual regression`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveTitle(DEFAULT_APP_TITLE)

    // The app uses a fixed h-screen layout with internal overflow-y-auto scrolling.
    // Measure the actual content height and resize the viewport so everything is visible.
    const contentHeight = await page.evaluate(() => {
      const main = document.querySelector('main')
      return main ? main.scrollHeight : document.documentElement.scrollHeight
    })
    const viewportSize = page.viewportSize()!
    await page.setViewportSize({ width: viewportSize.width, height: contentHeight })

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
  })
}

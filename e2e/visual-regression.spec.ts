import { test, expect, type Page } from '@playwright/test'
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

// ─────────────────────────────────────────────────────────────────────────────
// Story 15.10 — Install + Remove dialog visual regression
// ─────────────────────────────────────────────────────────────────────────────

const FIXTURE_MODULES = [
  {
    name: 'dept-aem',
    version: '1.2.0',
    source: 'github',
    npmPackage: null,
    repoUrl: 'https://github.com/bmad-method/dept-aem',
    agentCount: 3,
    skillCount: 5,
    workflowCount: 2,
    agents: [
      { id: 'sm', name: 'sm', title: 'Scrum Master' },
      { id: 'dev', name: 'dev', title: 'Developer' },
      { id: 'po', name: 'po', title: 'Product Owner' },
    ],
    skills: [],
    workflows: [],
  },
]

const FIXTURE_PREVIEW_SOURCE = {
  ok: true,
  moduleYaml: {
    code: 'dept-aem',
    name: 'AEM Department Module',
    version: '1.2.0',
    description: 'Adobe Experience Manager integration for BMAD',
    variables: {
      output_folder: { prompt: 'Output folder path', default: 'output/aem' },
    },
  },
  counts: { agents: 3, workflows: 2, tasks: 1 },
  willReplace: false,
}

const FIXTURE_REMOVE_PREVIEW = {
  module: { name: 'dept-aem', version: '1.2.0', source: 'github' },
  moduleFiles: { count: 42, totalBytes: 185340 },
  ideSkills: { 'claude-code': ['bmad-agent-dept-aem-sm', 'bmad-agent-dept-aem-dev', 'bmad-dept-aem-sprint-planning'] },
  manifestEntries: { 'manifest.yaml': true },
  preservedDirectories: [],
  crossReferences: [],
  crossReferenceScopeNotice: 'Cross-reference scanning covers teams and workflow steps.',
  removalBlocked: null,
  externalInstallerWarning: null,
}

const FIXTURE_REMOVE_PREVIEW_WARNINGS = {
  ...FIXTURE_REMOVE_PREVIEW,
  preservedDirectories: [{ path: '/project/output/aem', declared: true }],
  crossReferences: [
    {
      sourceModule: 'team-alpha',
      sourceEntity: 'alpha-team',
      entityType: 'team',
      fieldPath: 'modules[0]',
    },
    {
      sourceModule: 'team-alpha',
      sourceEntity: 'sprint-workflow',
      entityType: 'workflow_step',
      fieldPath: 'steps[2].agent',
    },
  ],
}

/** Set up the deterministic API mocks used by all dialog tests. */
async function mockModulesApi(page: Page) {
  await page.route('**/api/modules', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_MODULES),
      })
    } else {
      await route.continue()
    }
  })
  await page.route('**/api/teams', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
}

// ─── Install dialog tab screenshots ───────────────────────────────────────────

test('packages-install-dialog-npm', async ({ page }) => {
  await mockModulesApi(page)
  await page.goto('/modules')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Install Module' }).click()
  await page.waitForSelector('[role="dialog"], .fixed.inset-0 .max-w-lg', { state: 'visible' }).catch(() => {})
  // Give the dialog time to fully render
  await page.waitForTimeout(150)

  await expect(page).toHaveScreenshot('packages-install-dialog-npm.png')
})

test('packages-install-dialog-github', async ({ page }) => {
  await mockModulesApi(page)
  await page.route('**/api/modules/preview-source', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_PREVIEW_SOURCE),
    })
  })
  await page.goto('/modules')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Install Module' }).click()
  await page.waitForTimeout(150)
  await page.getByRole('button', { name: 'GitHub', exact: true }).click()

  await expect(page).toHaveScreenshot('packages-install-dialog-github.png')
})

test('packages-install-dialog-local', async ({ page }) => {
  await mockModulesApi(page)
  await page.goto('/modules')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Install Module' }).click()
  await page.waitForTimeout(150)
  await page.getByRole('button', { name: 'Local path' }).click()

  await expect(page).toHaveScreenshot('packages-install-dialog-local.png')
})

test('packages-install-dialog-zip', async ({ page }) => {
  await mockModulesApi(page)
  await page.goto('/modules')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Install Module' }).click()
  await page.waitForTimeout(150)
  await page.getByRole('button', { name: 'Upload zip' }).click()

  await expect(page).toHaveScreenshot('packages-install-dialog-zip.png')
})

// ─── Remove dialog screenshots ────────────────────────────────────────────────

test('packages-remove-dialog', async ({ page }) => {
  await mockModulesApi(page)
  await page.route('**/api/modules/dept-aem/remove-preview', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_REMOVE_PREVIEW),
    })
  })

  await page.goto('/modules')
  await page.waitForLoadState('networkidle')

  // Select the module by clicking its row
  await page.getByText('dept-aem').first().click()
  await page.waitForTimeout(200)

  // Click Remove Module in the detail panel
  await page.getByRole('button', { name: 'Remove Module' }).click()
  // Wait for preview to load
  await page.waitForTimeout(400)

  await expect(page).toHaveScreenshot('packages-remove-dialog.png')
})

test('packages-remove-dialog-with-warnings', async ({ page }) => {
  await mockModulesApi(page)
  await page.route('**/api/modules/dept-aem/remove-preview', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_REMOVE_PREVIEW_WARNINGS),
    })
  })

  await page.goto('/modules')
  await page.waitForLoadState('networkidle')

  await page.getByText('dept-aem').first().click()
  await page.waitForTimeout(200)

  await page.getByRole('button', { name: 'Remove Module' }).click()
  await page.waitForTimeout(400)

  await expect(page).toHaveScreenshot('packages-remove-dialog-with-warnings.png')
})

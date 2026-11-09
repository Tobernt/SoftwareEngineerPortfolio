const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const { inflateRawSync } = require('node:zlib');
let model;
test.beforeAll(async () => {
  model = await import('../../studio/lib/model.mjs');
});
test.beforeEach(async ({ request }) => {
  const state = await (await request.get('/api/library')).json();
  const result = await request.post('/api/library', {
    headers: { 'X-Style-Studio': 'local' },
    data: { revision: state.revision, library: model.seedLibrary() },
  });
  expect(result.ok()).toBe(true);
});
async function ready(page) {
  await page.goto('/');
  await expect(page.frameLocator('#preview').locator('h1')).toContainText('Software engineering');
}
async function saved(page) {
  await expect(page.locator('#save-status')).toHaveText('Saved on this PC');
}

test('offline preview, shared recipes, page overrides, and persistent local storage', async ({
  page,
}) => {
  const external = [],
    errors = [];
  await page.route('**/*', (route) => {
    if (!route.request().url().startsWith('http://127.0.0.1:4388')) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await page.getByRole('button', { name: 'Apply Harbor style', exact: true }).click();
  await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
    'data-hero',
    'reverse',
  );
  await page.locator('#page-select').selectOption('gallery');
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('UI gallery');
  await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
    'data-hero',
    'reverse',
  );
  await page.locator('#scope-select').selectOption('page');
  await page.getByRole('button', { name: 'Apply Kiln style', exact: true }).click();
  await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
    'data-hero',
    'center',
  );
  await page.locator('#page-select').selectOption('home');
  await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
    'data-hero',
    'reverse',
  );
  await saved(page);
  await page.reload();
  await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
    'data-hero',
    'reverse',
  );
  await page.locator('#page-select').selectOption('gallery');
  await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
    'data-hero',
    'center',
  );
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('undo and redo restore component settings and show real contrast feedback', async ({
  page,
}) => {
  await ready(page);
  await page.locator('.advanced-controls > summary').click();
  await page.locator('[data-hex=canvas]').fill('#ffffff');
  await page.locator('[data-hex=canvas]').press('Tab');
  await expect(page.locator('#contrast-checks')).toContainText('Review');
  await page.locator('#undo').click();
  await expect(page.locator('[data-hex=canvas]')).toHaveValue('#0c0d11');
  await page.locator('#redo').click();
  await expect(page.locator('[data-hex=canvas]')).toHaveValue('#ffffff');
  await page.locator('#undo').click();
  await page.locator('details[data-group=components] summary').click();
  await page.locator('[data-token=corner]').focus();
  await page.locator('[data-token=corner]').press('End');
  await expect(page.frameLocator('#preview').locator('.card-panel').first()).toHaveCSS(
    'border-radius',
    '40px',
  );
});

test('new template sites support content editing, section order, additional pages, and saved styles', async ({
  page,
}) => {
  await ready(page);
  await page.getByRole('button', { name: 'Create a project', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Create a project', exact: true })).toBeVisible();
  await page.locator('#modal [name=name]').fill('Engineering notes');
  await page.locator('#modal input[value=services]').check();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('button', { name: 'Page content', exact: true }).click();
  await page.getByLabel('Section heading', { exact: true }).fill('Systems built with care.');
  await expect(page.frameLocator('#preview').locator('h1')).toHaveText('Systems built with care.');
  await page.getByRole('button', { name: 'Move about earlier', exact: true }).click();
  await expect(page.locator('.section-select').nth(1)).toContainText('The thinking');
  await page.locator('#block-type').selectOption('projects');
  await page.locator('.section-add button').click();
  await page
    .getByLabel('Section heading', { exact: true })
    .fill('<script>plain text only</script>');
  await expect(
    page
      .frameLocator('#preview')
      .locator('h2')
      .filter({ hasText: '<script>plain text only</script>' }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: '+ Page', exact: true }).click();
  await page.locator('#modal [name=name]').fill('About the work');
  await page.getByRole('button', { name: 'Add page', exact: true }).click();
  await expect(page.locator('#page-select')).toHaveValue(/page_/);
  await page.getByRole('button', { name: 'Style', exact: true }).click();
  await page.getByRole('button', { name: 'Apply Field Notes style', exact: true }).click();
  await page.getByRole('button', { name: '+ Save current style', exact: true }).click();
  await page.locator('#modal [name=name]').fill('My considered style');
  await page.getByRole('button', { name: 'Save recipe', exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'Apply My considered style style',
      exact: true,
    }),
  ).toBeVisible();
  await saved(page);
  await page.reload();
  await expect(page.locator('#project-select')).toContainText('Engineering notes');
  await expect(
    page.getByRole('button', {
      name: 'Apply My considered style style',
      exact: true,
    }),
  ).toBeVisible();
});

test('backup import creates copies and malformed imports leave the library intact', async ({
  page,
}) => {
  await ready(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Backup library', exact: true }).click(),
  ]);
  const bytes = fs.readFileSync(await download.path());
  expect(JSON.parse(bytes).projects).toHaveLength(2);
  await page.locator('#import-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: bytes,
  });
  await page.getByRole('button', { name: 'Import copies', exact: true }).click();
  await expect(page.locator('#project-select option')).toHaveCount(4);
  await page.locator('#import-file').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.locator('#notice')).toContainText('version 1');
  await expect(page.locator('#project-select option')).toHaveCount(4);
});

function unzip(buffer) {
  const files = new Map();
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const size = buffer.readUInt32LE(offset + 18),
      nameLength = buffer.readUInt16LE(offset + 26),
      extra = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString();
    const start = offset + 30 + nameLength + extra;
    files.set(name, inflateRawSync(buffer.subarray(start, start + size)));
    offset = start + size;
  }
  return files;
}
test('website ZIP contains actual pages, chosen styles, local assets, and a runnable preview', async ({
  page,
}) => {
  await ready(page);
  await page.getByRole('button', { name: 'Apply Harbor style', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export website', exact: true }).click(),
  ]);
  const files = unzip(fs.readFileSync(await download.path()));
  expect(files.has('assets/tobias-berntsson.png')).toBe(true);
  expect(files.has('assets/design.css')).toBe(true);
  expect(files.has('Start Website.cmd')).toBe(true);
  expect(files.get('index.html').toString()).toContain('data-hero="reverse"');
  expect(files.get('gallery.html').toString()).toContain('data-design="custom"');
  expect(files.get('index.html').toString()).not.toContain('/studio/preview.mjs');
  expect(JSON.parse(files.get('design-recipe.json')).project.theme.canvas).toBe('#f1f6fb');
});

test('editor remains usable on a phone and exposes the library', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apply Harbor style', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Library', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('new sites export their own content without portfolio photos or contact code', async ({
  request,
}) => {
  const project = model.createProject('Independent project', 'case-study');
  const response = await request.post('/api/export', {
    headers: { 'X-Style-Studio': 'local' },
    data: { project, fonts: [] },
  });
  expect(response.ok()).toBe(true);
  const files = unzip(await response.body());
  expect(files.has('assets/tobias-berntsson.png')).toBe(false);
  expect(files.has('assets/contact.js')).toBe(false);
  expect(files.get('index.html').toString()).toContain('Independent project');
  expect(files.get('index.html').toString()).not.toContain('tobias_berntsson');
});

test('exported websites serve the typography module and fit whole words without the editor', async ({
  page,
  request,
}, testInfo) => {
  const path = require('node:path');
  const { spawn } = require('node:child_process');
  const project = model.createProject('Exported typography', 'services');
  project.theme.headingFont = 'mono';
  project.pages[0].sections[0].title = 'Systemutveckling för användbara lösningar.';
  const response = await request.post('/api/export', {
    headers: { 'X-Style-Studio': 'local' },
    data: { project, fonts: [] },
  });
  const folder = testInfo.outputPath('exported-site');
  for (const [name, contents] of unzip(await response.body())) {
    const destination = path.resolve(folder, name);
    expect(destination.startsWith(folder + path.sep)).toBe(true);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents);
  }
  const server = spawn(
    process.execPath,
    [path.join(folder, 'preview.cjs'), '--port=4394', '--no-open'],
    { windowsHide: true, stdio: 'ignore' },
  );
  try {
    await expect
      .poll(async () => {
        try {
          return (await request.get('http://127.0.0.1:4394/')).status();
        } catch {
          return 0;
        }
      })
      .toBe(200);
    const errors = [],
      external = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', (route) => {
      if (!route.request().url().startsWith('http://127.0.0.1:4394')) {
        external.push(route.request().url());
        return route.abort();
      }
      return route.continue();
    });
    await page.setViewportSize({ width: 320, height: 850 });
    const [moduleResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith('/assets/design-typography.mjs')),
      page.goto('http://127.0.0.1:4394/'),
    ]);
    expect(moduleResponse.headers()['content-type']).toContain('text/javascript');
    await expect
      .poll(() =>
        page.locator('h1').evaluate((heading) => parseFloat(getComputedStyle(heading).fontSize)),
      )
      .toBeLessThan(35.2);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(320);
    const rects = await page.locator('h1').evaluate((heading) => {
      const range = document.createRange();
      range.setStart(heading.firstChild, 0);
      range.setEnd(heading.firstChild, 'Systemutveckling'.length);
      return range.getClientRects().length;
    });
    expect(rects).toBe(1);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    const stopped = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await stopped;
  }
});

test('local font files work in previews, export with styles, and can be removed or restored', async ({
  page,
}) => {
  await ready(page);
  const fontPath =
    process.env.STUDIO_TEST_FONT ||
    (process.platform === 'win32'
      ? 'C:/Windows/Fonts/segoeui.ttf'
      : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
  test.skip(
    !fs.existsSync(fontPath),
    'Set STUDIO_TEST_FONT to a local TTF file to verify font import.',
  );
  await page.locator('#font-file').setInputFiles(fontPath);
  await expect(page.locator('#notice')).toContainText('Font added');
  await page.locator('.advanced-controls > summary').click();
  const fontKey = await page.locator('[data-token=bodyFont] option').last().getAttribute('value');
  await page.locator('[data-token=bodyFont]').selectOption(fontKey);
  await expect(page.frameLocator('#preview').locator('body')).toHaveCSS(
    'font-family',
    /StudioFont_/,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export style JSON', exact: true }).click(),
  ]);
  const style = JSON.parse(fs.readFileSync(await download.path()));
  expect(style.fonts[0].data).toMatch(/^data:font\/ttf;base64,/);
  expect(style.theme.bodyFont).toBe(fontKey);
  await page.getByRole('button', { name: 'Manage local fonts', exact: true }).click();
  await page.getByRole('button', { name: 'Remove font', exact: true }).click();
  await expect(page.locator('[data-token=bodyFont]')).toHaveValue('system');
  await page.locator('#undo').click();
  await expect(page.locator('[data-token=bodyFont]')).toHaveValue(fontKey);
  await saved(page);
});

test('version checks protect local data and invalid style input is rejected', async ({
  request,
}) => {
  const state = await (await request.get('/api/library')).json();
  const modified = structuredClone(state.library);
  modified.projects[0].name = 'A deliberate change';
  const first = await request.post('/api/library', {
    headers: { 'X-Style-Studio': 'local' },
    data: { revision: state.revision, library: modified },
  });
  expect(first.ok()).toBe(true);
  const conflict = await request.post('/api/library', {
    headers: { 'X-Style-Studio': 'local' },
    data: { revision: state.revision, library: state.library },
  });
  expect(conflict.status()).toBe(409);
  const current = await (await request.get('/api/library')).json();
  expect(current.library.projects[0].name).toBe('A deliberate change');
  const invalid = structuredClone(current.library);
  invalid.projects[0].theme.headingFont = 'constructor';
  const result = await request.post('/api/library', {
    headers: { 'X-Style-Studio': 'local' },
    data: { revision: current.revision, library: invalid },
  });
  expect(result.status()).toBe(400);
  expect((await (await request.get('/api/library')).json()).revision).toBe(current.revision);
});

for (const recipe of ['Graphite', 'Harbor', 'Kiln', 'Field Notes']) {
  test(`${recipe} is readable and responsive across existing and template pages`, async ({
    page,
  }) => {
    await ready(page);
    await page.getByRole('button', { name: `Apply ${recipe} style`, exact: true }).click();
    for (const projectLabel of ['Tobias · Portfolio', 'New site · Example']) {
      await page.locator('#project-select').selectOption({ label: projectLabel });
      await page.getByRole('button', { name: `Apply ${recipe} style`, exact: true }).click();
      const pageIds = await page
        .locator('#page-select option')
        .evaluateAll((options) => options.map((option) => option.value));
      for (const id of pageIds) {
        await page.locator('#page-select').selectOption(id);
        for (const width of ['1200', '320']) {
          if (width === '320') {
            await page.locator('#preview-width').fill('320');
            await page.locator('#preview-width').press('Tab');
          } else await page.locator(`[data-width="${width}"]`).click();
          await expect(page.locator('#loading')).toBeHidden();
          const frame = page.frameLocator('#preview');
          await frame
            .locator('html')
            .evaluate(() =>
              document.fonts.ready.then(
                () =>
                  new Promise((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve)),
                  ),
              ),
            );
          const overflow = await frame.locator('html').evaluate((element) => ({
            scroll: element.scrollWidth,
            client: element.clientWidth,
          }));
          expect(overflow.scroll, `${recipe} ${projectLabel} ${id} ${width}`).toBeLessThanOrEqual(
            overflow.client,
          );
          const audit = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          expect(
            audit.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
          ).toEqual([]);
        }
      }
    }
  });
}

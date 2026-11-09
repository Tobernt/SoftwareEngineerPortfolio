const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
let model;
test.beforeAll(async () => {
  model = await import('../../studio/lib/model.mjs');
});
test.beforeEach(async ({ request }) => {
  const state = await (await request.get('/api/library')).json();
  expect(
    (
      await request.post('/api/library', {
        headers: { 'X-Style-Studio': 'local' },
        data: { revision: state.revision, library: model.seedLibrary() },
      })
    ).ok(),
  ).toBe(true);
});
async function ready(page) {
  await page.goto('/');
  await expect(page.frameLocator('#preview').locator('h1')).toContainText('Software engineering');
}
async function settled(frame) {
  await frame
    .locator('html')
    .evaluate(() =>
      document.fonts.ready.then(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      ),
    );
}
async function readability(frame, message) {
  await settled(frame);
  const read = async () =>
    frame.locator('html').evaluate((root) => {
      const broken = [];
      for (const heading of document.querySelectorAll('main :is(h1,h2,h3,h4)')) {
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (const match of node.textContent.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const rects = [...range.getClientRects()];
            if (rects.length > 1 || rects.some((rect) => rect.right > innerWidth + 1))
              broken.push(match[0]);
          }
        }
      }
      return { overflow: root.scrollWidth > root.clientWidth, broken };
    });
  await expect.poll(read, { message }).toEqual({ overflow: false, broken: [] });
}

test('three independent libraries offer 50 options, wrap with arrows, and preserve keyboard focus', async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator('[data-browser-select=style] option:not([disabled])')).toHaveCount(50);
  await expect(page.locator('[data-browser-select=palette] option:not([disabled])')).toHaveCount(
    50,
  );
  const next = page.getByRole('button', { name: 'Next style', exact: true });
  await next.click();
  await expect(page.locator('[data-browser-title=style]')).toHaveText('Harbor');
  await expect(next).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-browser-title=style]')).toHaveText('Graphite');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-browser-count=style]')).toHaveText('50 / 50');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-browser-count=style]')).toHaveText('1 / 50');
  await page.locator('#style-target').selectOption('buttons');
  await expect(page.locator('[data-browser-select=style] option:not([disabled])')).toHaveCount(50);
  await page.getByRole('button', { name: 'Previous style', exact: true }).click();
  await expect(page.locator('[data-browser-count=style]')).toHaveText('50 / 50');
  await page.getByRole('button', { name: 'Next style', exact: true }).click();
  await expect(page.locator('[data-browser-title=style]')).toHaveText('Essential');
  await expect(page.frameLocator('#preview').locator('.cta-button-primary').first()).toHaveCSS(
    'border-radius',
    '8px',
  );
  await page.locator('#undo').click();
  await expect(page.locator('[data-browser-title=style]')).toHaveText('Signature');
});

test('all 50 palettes produce distinct colors and readable default text and actions', async ({
  page,
}) => {
  await ready(page);
  expect(new Set(model.PALETTES.map((p) => JSON.stringify(p.colors))).size).toBe(50);
  for (const palette of model.PALETTES) {
    const t = palette.colors;
    for (const [a, b] of [
      [t.text, t.canvas],
      [t.text, t.surface],
      [t.muted, t.canvas],
      [t.muted, t.surface],
      [t.accent, t.canvas],
      [t.accent, t.surface],
      [t.onAccent, t.accent],
    ])
      expect(model.contrast(a, b), palette.name).toBeGreaterThanOrEqual(4.5);
    await page.locator('[data-browser-select=palette]').selectOption(palette.id);
    await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
      'data-canvas-pattern',
      t.canvasPattern,
    );
    const canvas = await page
      .frameLocator('#preview')
      .locator('html')
      .evaluate((root) => root.style.getPropertyValue('--ds-canvas'));
    expect(canvas).toBe(t.canvas);
  }
  // Preserve a preferred palette while comparing complete page layouts.
  await page.locator('#keep-colors').check();
  await page.locator('[data-browser-select=style]').selectOption('kiln');
  await expect(page.locator('[data-browser-title=palette]')).toHaveText('Observatory');
  await expect(page.frameLocator('#preview').locator('html')).toHaveAttribute(
    'data-hero',
    'center',
  );
});

test('component groups and picked elements retain independent styles through save, reload, and export', async ({
  page,
  request,
}) => {
  await ready(page);
  const frame = page.frameLocator('#preview');
  await page.locator('#style-target').selectOption('headings');
  await page.locator('[data-browser-select=style]').selectOption('component-14');
  await expect(frame.locator('.section-title').first()).toHaveCSS('border-left-width', '4px');
  await page
    .getByRole('button', {
      name: 'Pick an element in the preview',
      exact: true,
    })
    .click();
  await frame.locator('h1').click();
  await expect(page.locator('.element-selection')).toContainText('h1');
  await page.locator('[data-browser-select=style]').selectOption('component-9');
  await page.locator('[data-browser-select=palette]').selectOption('palette-5');
  await expect(frame.locator('h1')).toHaveCSS('border-bottom-width', '1px');
  await expect(frame.locator('h1')).toHaveCSS('border-left-width', '0px');
  await expect(frame.locator('.section-title').first()).toHaveCSS('border-left-width', '4px');
  await expect(page.locator('#save-status')).toHaveText('Saved on this PC');
  const stored = (await (await request.get('/api/library')).json()).library;
  const portfolio = stored.projects[0];
  expect(portfolio.pages[0].elementStyles).toHaveLength(1);
  const html = await (
    await request.post('/api/preview', {
      headers: { 'X-Style-Studio': 'local' },
      data: { project: portfolio, pageId: 'home', fonts: [] },
    })
  ).text();
  expect(html).toContain(portfolio.pages[0].elementStyles[0].selector);
  await page.reload();
  await expect(frame.locator('h1')).toHaveCSS('border-bottom-width', '1px');
  await expect(frame.locator('.section-title').first()).toHaveCSS('border-left-width', '4px');
  const { decorateHTML } = await import('../../studio/lib/render.mjs');
  const exported = decorateHTML(
    '<html><head></head><body></body></html>',
    portfolio,
    portfolio.pages[0],
    [],
  );
  expect(exported).toContain(portfolio.pages[0].elementStyles[0].selector);
  expect(exported).toContain('assets/design-typography.mjs');
  expect(exported).not.toContain('studio-selected');
  // Imported backups cannot introduce arbitrary selectors, declarations, or style tags.
  const invalid = structuredClone(stored);
  invalid.projects[0].pages[0].elementStyles[0].selector = 'h1{color:red}</style><script>';
  expect(() => model.normalizeLibrary(invalid)).toThrow('Invalid selected element path');
});

for (const type of ['portfolio', 'gallery', 'template']) {
  test(`all 50 page designs keep whole heading words and fit phone and desktop on ${type}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await ready(page);
    if (type === 'template')
      await page.locator('#project-select').selectOption({ label: 'New site · Example' });
    if (type === 'gallery') await page.locator('#page-select').selectOption('gallery');
    await expect(page.locator('#loading')).toBeHidden();
    const frame = page.frameLocator('#preview');
    for (const recipe of model.RECIPES) {
      await page.locator('[data-browser-select=style]').selectOption(recipe.id);
      await expect(frame.locator('html')).toHaveAttribute('data-hero', recipe.theme.hero);
      for (const width of [320, 1200]) {
        await page.locator('#preview-width').fill(String(width));
        await page.locator('#preview-width').press('Tab');
        await readability(frame, `${recipe.name}, ${type}, ${width}px, English`);
        if (type === 'portfolio') {
          await frame.locator('[data-lang-toggle]').evaluate((button) => button.click());
          await expect(frame.locator('html')).toHaveAttribute('lang', 'sv');
          await readability(frame, `${recipe.name}, ${width}px, Swedish`);
          await frame.locator('[data-lang-toggle]').evaluate((button) => button.click());
        }
      }
    }
  });
}

test('preset browsers remain accessible and usable on desktop and phone', async ({ page }) => {
  await ready(page);
  for (const width of [1600, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#style-target').selectOption('cards');
    await page.getByRole('button', { name: 'Next style', exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

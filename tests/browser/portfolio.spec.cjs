const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('contact draft validates, retains data across languages, and never sends a request', async ({
  page,
}) => {
  const outgoing = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') outgoing.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Software engineering');
  await page.locator('#contact-name').fill('Test Visitor');
  await page.locator('#contact-email').fill('visitor@example.com');
  await page.locator('#contact-topic').selectOption('Engineering role');
  await page.locator('#contact-message').fill('Discuss C# & Python, including åäö.');
  await page.locator('#contact-form button[type=submit]').click();
  await expect(page.locator('#contact-draft')).toBeHidden();
  await page.locator('#contact-permission').check();
  await page.locator('#contact-form button[type=submit]').click();
  await expect(page.locator('#contact-draft')).toBeVisible();
  const href = await page.locator('#contact-draft').getAttribute('href');
  expect(decodeURIComponent(href)).toContain('Discuss C# & Python, including åäö.');
  await page.locator('[data-lang-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'sv');
  await expect(page.locator('#contact-name')).toHaveValue('Test Visitor');
  await expect(page.locator('#contact-message')).toHaveValue('Discuss C# & Python, including åäö.');
  await expect(page.locator('#contact-draft')).toHaveAttribute('href', /F%C3%B6rfr%C3%A5gan/);
  await page.locator('#contact-message').fill('An updated message');
  await expect(page.locator('#contact-draft')).toBeHidden();
  expect(outgoing).toEqual([]);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`homepage and gallery fit ${width}px and have no automated accessibility violations`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ['/', '/gallery.html']) {
      await page.goto(url);
      for (const language of ['en', 'sv']) {
        if ((await page.locator('html').getAttribute('lang')) !== language) {
          if (width < 1024) await page.locator('[data-menu-toggle]').click();
          await page.locator('[data-lang-toggle]').click();
          if (width < 1024) await page.locator('[data-menu-toggle]').click();
        }
        const overflow = await page.evaluate(() => ({
          viewport: innerWidth,
          document: document.documentElement.scrollWidth,
          elements: [...document.querySelectorAll('body *')]
            .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
            .map((element) => ({ tag: element.tagName, class: element.className })),
        }));
        expect(
          overflow.document,
          JSON.stringify({ url, language, ...overflow }),
        ).toBeLessThanOrEqual(width);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      }
    }
  });
}

test('mobile navigation supports disclosure, keyboard dismissal, and cross-page links', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/gallery.html');
  const menu = page.locator('[data-menu-toggle]');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.locator('[data-nav-key=projects]').click();
  await expect(page).toHaveURL(/index.html#projects$/);
});

test('gallery controls and entered data survive language changes', async ({ page }) => {
  await page.goto('/gallery.html');
  await page.locator('#email-demo').fill('visitor@example.com');
  await page.locator('#role').selectOption('developer');
  await page.locator('[data-lang-toggle]').click();
  await expect(page.locator('#email-demo')).toHaveValue('visitor@example.com');
  await expect(page.locator('#role')).toHaveValue('developer');
  await page.locator('[data-toggle]').click();
  await expect(page.locator('[data-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-open-modal]').click();
  await expect(page.locator('[data-modal-dialog]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-open-modal]')).toBeFocused();
});

test('gallery tabs wrap when a wider fallback font is used', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/gallery.html');
  await page.addStyleTag({ content: 'body { font-family: Verdana, sans-serif !important; }' });
  for (const language of ['en', 'sv']) {
    if (language === 'sv') {
      await page.locator('[data-menu-toggle]').click();
      await page.locator('[data-lang-toggle]').click();
      await page.locator('[data-menu-toggle]').click();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  }
});

test('content and navigation remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173');
  await expect(page.locator('nav a[href="#projects"]')).toBeVisible();
  await expect(page.locator('aside img')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('#contact-form')).toBeVisible();
  await context.close();
});

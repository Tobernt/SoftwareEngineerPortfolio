const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const browser = await chromium.launch();
  const directory = path.resolve(__dirname, '../docs/evidence');
  const errors = [];
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['tablet', 768, 1024],
    ['mobile', 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('.profile-portrait').evaluate(image => image.decode());
    await page.screenshot({ path: path.join(directory, `home-${name}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('[data-lang-toggle]').click();
  await page.screenshot({ path: path.join(directory, 'home-swedish.png') });
  await page.locator('#contact-form').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(directory, 'contact-swedish.png') });
  for (const name of ['w3c-index', 'w3c-gallery', 'lighthouse-home.report']) {
    await page.goto(pathToFileURL(path.join(directory, `${name}.html`)).href);
    await page.screenshot({ path: path.join(directory, `${name}.png`) });
  }
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Saved desktop, tablet, mobile, Swedish, contact, and audit screenshots.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

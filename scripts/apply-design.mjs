import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeLibrary } from '../studio/lib/model.mjs';
import { decorateHTML } from '../studio/lib/render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recipe = JSON.parse(
  fs.readFileSync(path.join(root, 'design-system/portfolio-project.json'), 'utf8'),
);
const library = normalizeLibrary({
  version: 1,
  projects: [recipe.project],
  fonts: recipe.fonts,
  recipes: [],
});
const project = library.projects[0];
for (const [file, source] of [
  ['index.html', 'portfolio'],
  ['gallery.html', 'gallery'],
]) {
  const page = project.pages.find((page) => page.source === source);
  if (!page) throw new Error(`The saved design needs a ${source} page.`);
  let html = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  html = decorateHTML(html, project, page, library.fonts);
  html = html.replace(
    /(<meta name="theme-color" content=")[^"]*(">)/,
    `$1${(page.theme ?? project.theme).canvas}$2`,
  );
  // Keep source formatting stable across repeated builds.
  html = html.replace(/\n\s*\n\s*(<link rel="stylesheet" href="assets\/design\.css")/, '\n    $1');
  fs.writeFileSync(path.join(root, file), html);
}
fs.copyFileSync(path.join(root, 'studio/theme.css'), path.join(root, 'assets/design.css'));
fs.copyFileSync(
  path.join(root, 'studio/typography.mjs'),
  path.join(root, 'assets/design-typography.mjs'),
);
console.log('Applied the saved portfolio design to the homepage and gallery.');

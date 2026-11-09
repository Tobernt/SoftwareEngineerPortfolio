import { escapeHTML as e, pageFilename, themeAttributes, themeStyle } from './model.mjs';

export function pageLinks(project, current) {
  return project.pages
    .map(
      (page, index) =>
        `<li><a href="${pageFilename(page, index)}"${page.id === current.id ? ' aria-current="page"' : ''}>${e(page.title)}</a></li>`,
    )
    .join('');
}

export function renderBuilder(project, page) {
  const contact = page.sections.find((section) => section.type === 'contact');
  const next = page.sections[1] || page.sections[0];
  const sections = page.sections
    .map((section) => {
      const title = e(section.title),
        body = e(section.body).replaceAll('\n', '<br>');
      if (section.type === 'hero')
        return `<section class="hero-section" data-section-id="${section.id}">
      <div class="hero-copy"><p class="eyebrow">${e(project.name)}</p><h1 class="hero-title">${title}</h1><p class="hero-lead">${body}</p><div class="hero-actions"><a class="cta-button-primary" href="#section-${(contact || next).id}">${contact ? 'Get in touch' : 'Learn more'}</a><a class="cta-button-ghost" href="#section-${next.id}">Explore this page</a></div></div>
      <aside class="profile-aside"><div class="profile-facts"><p class="eyebrow">At a glance</p><h2>Made with purpose.</h2><p>A clear story, useful details, and a considered next step.</p><p>Edit the sections to make this page your own.</p></div></aside></section>`;
      if (section.type === 'projects' || section.type === 'features')
        return `<section id="section-${section.id}" class="section-shell" data-section-id="${section.id}"><div class="section-heading"><h2 class="section-title">${title}</h2><p>${body}</p></div><div class="project-grid">${section.items.map((item) => `<article class="card-panel project-card"><h3>${e(item.title)}</h3><p>${e(item.body).replaceAll('\n', '<br>')}</p></article>`).join('')}</div></section>`;
      return `<section id="section-${section.id}" class="section-shell about-section" data-section-id="${section.id}"><h2 class="section-title">${title}</h2><div><p>${body}</p>${section.type === 'contact' ? '<a class="text-link" href="#main-content">Back to the top ↑</a>' : ''}</div></section>`;
    })
    .join('\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(page.title)} | ${e(project.name)}</title><meta name="description" content="${e(page.sections[0].body.slice(0, 160))}"><link rel="stylesheet" href="assets/styles.css"></head><body data-page="builder"><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-nav" aria-label="Main navigation"><a class="site-brand" href="index.html">${e(project.name)}</a><div class="site-menu"><ul>${pageLinks(project, page)}</ul></div></nav></header><main id="main-content" tabindex="-1">${sections}</main><footer class="site-footer"><div class="footer-inner"><p>${e(project.name)}</p><a class="text-link" href="#main-content">Back to top</a></div></footer></body></html>`;
}

export function decorateHTML(
  html,
  project,
  page,
  fonts,
  { preview = false, base = '', stylesheet = 'assets/design.css', bridge = '' } = {},
) {
  const theme = page.theme ?? project.theme;
  const attributes = Object.entries(themeAttributes(theme))
    .map(([key, value]) => `${key}="${e(value)}"`)
    .join(' ');
  let result = html.replace(/<html\b([^>]*)>/i, `<html$1 ${attributes}>`);
  if (base) result = result.replace(/<head>/i, `<head><base href="${e(base)}">`);
  const injected = `<link rel="stylesheet" href="${e(stylesheet)}"><style id="site-design-tokens">${themeStyle(theme, fonts)}</style>${preview ? `<script type="module" src="${e(bridge)}"></script>` : ''}`;
  result = result.replace(/<\/head>/i, injected + '</head>');
  // Include additional template pages in the original site's navigation too.
  if (page.source !== 'builder' && project.pages.some((p) => p.source === 'builder')) {
    result = result.replace(
      /(<div\b[^>]*class="site-menu"[^>]*>[\s\S]*?<ul>)[\s\S]*?<\/ul>/,
      `$1${pageLinks(project, page)}</ul>`,
    );
  }
  return result;
}

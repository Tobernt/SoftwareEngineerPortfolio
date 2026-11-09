import {
  RECIPES,
  PALETTES,
  COMPONENT_STYLES,
  COMPONENT_TARGETS,
  FONT_OPTIONS,
  COLOR_KEYS,
  DEFAULT_THEME,
  createProject,
  createPage,
  createBlock,
  normalizeLibrary,
  normalizeTheme,
  themeVariables,
  contrast,
  pageFilename,
  uid,
  escapeHTML as e,
} from './lib/model.mjs';

const $ = (selector) => document.querySelector(selector);
let library,
  revision = 0,
  projectId,
  pageId,
  scope = 'site',
  tab = 'style',
  sectionId;
let previewWidth = 1200,
  previewRequest = 0,
  previewTimer,
  saveTimer,
  noticeTimer;
let dirty = false,
  saving = null,
  saveBlocked = false,
  historyBefore = null;
const undoStack = [],
  redoStack = [];
const previewFonts = new Set();
let styleTarget = 'page',
  selectedElement = null,
  picking = false,
  keepColors = false;
const project = () => library.projects.find((p) => p.id === projectId) || library.projects[0];
const page = () => project().pages.find((p) => p.id === pageId) || project().pages[0];
const theme = () => (scope === 'page' && page().theme ? page().theme : project().theme);
const activeTheme = () => page().theme ?? project().theme;
const snapshot = () => ({
  library: structuredClone(library),
  projectId,
  pageId,
});

function notice(message) {
  $('#notice').textContent = message;
  $('#notice').hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => ($('#notice').hidden = true), 5500);
}
async function request(url, data, mode = 'json') {
  const response = await fetch(
    url,
    data == null
      ? {}
      : {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Style-Studio': 'local',
          },
          body: JSON.stringify(data),
        },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'The local server could not complete this action.');
  }
  return mode === 'text' ? response.text() : mode === 'blob' ? response.blob() : response.json();
}
function updateSaveLabel(label) {
  $('#save-status').textContent = label;
}
function queueSave() {
  dirty = true;
  updateSaveLabel('Unsaved changes');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist().catch((error) => notice(error.message)), 700);
}
async function persist() {
  clearTimeout(saveTimer);
  if (saveBlocked)
    throw new Error(
      'Export your current draft as a backup, then reload to resolve the other window’s changes.',
    );
  if (saving) {
    await saving;
    if (dirty) return persist();
    return;
  }
  if (!dirty) return;
  const payload = { library: structuredClone(library), revision };
  dirty = false;
  updateSaveLabel('Saving locally…');
  saving = request('/api/library', payload)
    .then((result) => {
      revision = result.revision;
      updateSaveLabel(dirty ? 'Unsaved changes' : 'Saved on this PC');
    })
    .catch((error) => {
      dirty = true;
      saveBlocked = true;
      updateSaveLabel('Save needs attention');
      throw error;
    });
  try {
    await saving;
  } finally {
    saving = null;
  }
  if (dirty) queueSave();
}
function pushHistory(before) {
  undoStack.push(before);
  if (undoStack.length > 40) undoStack.shift();
  redoStack.length = 0;
  updateHistory();
}
function commitInput() {
  if (historyBefore) {
    pushHistory(historyBefore);
    historyBefore = null;
  }
}
function updateHistory() {
  $('#undo').disabled = !undoStack.length;
  $('#redo').disabled = !redoStack.length;
}
function transaction(callback, { rerender = true, preview = true } = {}) {
  commitInput();
  const before = snapshot();
  try {
    callback();
    library = normalizeLibrary(library);
  } catch (error) {
    library = before.library;
    projectId = before.projectId;
    pageId = before.pageId;
    throw error;
  }
  pushHistory(before);
  queueSave();
  if (rerender) render();
  if (preview) renderPreview();
}
function restore(state) {
  library = state.library;
  projectId = state.projectId;
  pageId = state.pageId;
  sectionId = null;
  render();
  renderPreview();
  queueSave();
}
function download(value, filename, type = 'application/json') {
  const blob =
    value instanceof Blob
      ? value
      : new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], { type });
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function selectProject(id) {
  $('#notice').hidden = true;
  commitInput();
  projectId = id;
  pageId = project().pages[0].id;
  sectionId = null;
  selectedElement = null;
  picking = false;
  scope = page().theme ? 'page' : 'site';
  render();
  renderPreview();
}
function selectPage(id) {
  $('#notice').hidden = true;
  commitInput();
  pageId = id;
  sectionId = null;
  selectedElement = null;
  picking = false;
  scope = page().theme ? 'page' : 'site';
  render();
  renderPreview();
}
function updateThemePreview() {
  const selected = activeTheme();
  const fonts = library.fonts.filter(
    (font) =>
      [selected.headingFont, selected.bodyFont].includes(`custom:${font.id}`) &&
      !previewFonts.has(font.id),
  );
  fonts.forEach((font) => previewFonts.add(font.id));
  $('#preview').contentWindow?.postMessage(
    {
      type: 'studio-theme',
      theme: selected,
      elementStyles: page().elementStyles,
      picking,
      pickTarget: styleTarget,
      selectedSelector: selectedElement?.selector,
      fonts,
      fontCatalog: library.fonts.map(({ id, name }) => ({ id, name })),
    },
    location.origin,
  );
  updateChecks();
  updateRecipeSelection();
  updateStyleBrowsers();
}
function updateRecipeSelection() {
  for (const button of document.querySelectorAll('[data-recipe]')) {
    const recipe = [...RECIPES, ...library.recipes].find((r) => r.id === button.dataset.recipe);
    button.setAttribute(
      'aria-pressed',
      String(
        Object.keys(DEFAULT_THEME).every(
          (key) => JSON.stringify(recipe.theme[key]) === JSON.stringify(theme()[key]),
        ),
      ),
    );
  }
}
async function renderPreview(keepScroll = false) {
  const sequence = ++previewRequest,
    scroll = keepScroll ? $('#preview').contentWindow?.scrollY || 0 : 0;
  try {
    const html = await request(
      '/api/preview',
      { project: project(), pageId: page().id, fonts: library.fonts },
      'text',
    );
    if (sequence !== previewRequest) return;
    $('#loading').hidden = false;
    $('#preview').onload = () => {
      $('#loading').hidden = true;
      updateThemePreview();
      fitPreview();
      if (scroll) $('#preview').contentWindow.scrollTo(0, scroll);
    };
    previewFonts.clear();
    $('#preview').srcdoc = html;
  } catch (error) {
    $('#loading').textContent = error.message;
    notice(error.message);
  }
}
function fitPreview() {
  const stage = $('#preview-stage'),
    scale = Math.min(1, (stage.clientWidth - 32) / previewWidth),
    height = Math.max(340, (stage.clientHeight - 32) / scale);
  $('#preview').style.cssText =
    `width:${previewWidth}px;height:${height}px;transform:scale(${scale})`;
  $('#frame-fit').style.cssText = `width:${previewWidth * scale}px;height:${height * scale}px`;
  $('#preview-description').textContent =
    `${library ? page().title : 'Preview'} · ${previewWidth}px · ${Math.round(scale * 100)}%`;
}

function render() {
  projectId = project().id;
  pageId = page().id;
  $('#project-select').innerHTML = library.projects
    .map(
      (p) =>
        `<option value="${p.id}" ${p.id === projectId ? 'selected' : ''}>${e(p.name)}</option>`,
    )
    .join('');
  $('#project-list').innerHTML = library.projects
    .map(
      (p) =>
        `<button type="button" data-project="${p.id}" aria-current="${p.id === projectId}">${e(p.name)}</button>`,
    )
    .join('');
  $('#page-select').innerHTML = project()
    .pages.map(
      (p) => `<option value="${p.id}" ${p.id === pageId ? 'selected' : ''}>${e(p.title)}</option>`,
    )
    .join('');
  $('#recipe-list').innerHTML = [...RECIPES, ...library.recipes]
    .map(
      (recipe) =>
        `<button type="button" class="recipe-card" data-recipe="${recipe.id}" aria-label="Apply ${e(recipe.name)} style"><span class="recipe-swatches" aria-hidden="true">${['canvas', 'surface', 'text', 'accent'].map((key) => `<i style="background:${recipe.theme[key]}"></i>`).join('')}</span><strong>${e(recipe.name)}</strong><small>${e(recipe.description)}</small></button>`,
    )
    .join('');
  filterRecipes();
  $('#font-summary').textContent = library.fonts.length
    ? `${library.fonts.length} imported font${library.fonts.length === 1 ? '' : 's'} available.`
    : 'System fonts are available immediately.';
  document
    .querySelectorAll('[data-tab]')
    .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
  renderControls();
  updateRecipeSelection();
  updateHistory();
  fitPreview();
  try {
    localStorage.setItem('style-studio-project', projectId);
  } catch {}
}
function options(choices, current) {
  return choices
    .map((choice) => {
      const [value, label] = Array.isArray(choice) ? choice : [choice, choice];
      return `<option value="${e(value)}" ${String(value) === String(current) ? 'selected' : ''}>${e(label)}</option>`;
    })
    .join('');
}
function filterRecipes() {
  const search = $('#recipe-search').value.toLowerCase().trim();
  for (const card of document.querySelectorAll('[data-recipe]'))
    card.hidden = !card.textContent.toLowerCase().includes(search);
}
function selectField(key, label, choices) {
  return `<label class="field">${label}<select data-token="${key}">${options(choices, theme()[key])}</select></label>`;
}
function rangeField(key, label, min, max, step = 1, unit = '') {
  return `<label class="field"><span class="field-heading">${label}<output data-output="${key}">${theme()[key]}${unit}</output></span><input data-token="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${theme()[key]}" data-unit="${unit}"></label>`;
}
function group(id, title, content, open = false) {
  return `<details class="control-group" data-group="${id}" ${open ? 'open' : ''}><summary>${title}</summary>${content}</details>`;
}
function browserCatalog(kind) {
  return kind === 'palette' ? PALETTES : styleTarget === 'page' ? RECIPES : COMPONENT_STYLES;
}
function browserIndex(kind) {
  const t = theme();
  const element =
    selectedElement &&
    page().elementStyles?.find((item) => item.selector === selectedElement.selector);
  if (kind === 'palette') {
    if (styleTarget === 'page')
      return PALETTES.findIndex((item) =>
        [...COLOR_KEYS, 'canvasPattern'].every((key) => item.colors[key] === t[key]),
      );
    return PALETTES.findIndex(
      (item) => item.id === (element?.paletteId ?? t.componentPalettes[styleTarget]),
    );
  }
  if (styleTarget === 'page')
    return RECIPES.findIndex((item) =>
      Object.keys(DEFAULT_THEME).every(
        (key) => JSON.stringify(item.theme[key]) === JSON.stringify(t[key]),
      ),
    );
  return COMPONENT_STYLES.findIndex(
    (item) => item.id === (element?.styleId ?? t.componentStyles[styleTarget]),
  );
}
function carousel(kind, label) {
  return `<section class="style-carousel" data-carousel="${kind}" aria-label="${label}" tabindex="0"><div class="carousel-heading"><h3>${label}</h3><span data-browser-count="${kind}"></span></div><div class="carousel-navigation"><button type="button" data-cycle="${kind}" data-step="-1" aria-label="Previous ${kind === 'palette' ? 'color palette' : 'style'}">←</button><div class="carousel-title" data-browser-title="${kind}" aria-live="polite"></div><button type="button" data-cycle="${kind}" data-step="1" aria-label="Next ${kind === 'palette' ? 'color palette' : 'style'}">→</button></div><div class="browser-swatches" data-browser-swatches="${kind}" aria-hidden="true"></div><p class="control-help" data-browser-description="${kind}"></p><label class="browser-jump">Jump to a ${kind === 'palette' ? 'palette' : 'style'}<select data-browser-select="${kind}"></select></label></section>`;
}
function styleBrowsers() {
  const targets = [
    ['page', 'Entire page design'],
    ...Object.entries(COMPONENT_TARGETS).map(([key, item]) => [key, item.name]),
  ];
  const selection = selectedElement
    ? `<p class="element-selection">Selected: <strong>${e(selectedElement.label)}</strong><small>This element on this page only.</small></p><button type="button" data-action="clear-selection">Style all ${e(COMPONENT_TARGETS[styleTarget].name.toLowerCase())} instead</button>`
    : styleTarget !== 'page'
      ? `<p class="control-help">All ${e(COMPONENT_TARGETS[styleTarget].name.toLowerCase())} in the chosen scope.</p>`
      : '';
  const lock =
    styleTarget === 'page'
      ? `<label class="keep-colors"><input id="keep-colors" type="checkbox" ${keepColors ? 'checked' : ''}>Keep my colors when browsing designs</label>`
      : '';
  return `<div class="preset-browser"><div class="browser-intro"><p class="eyebrow">50 designs · 50 palettes · 50 treatments</p><h2>Browse styles.</h2><p>Use the arrows to try complete looks, then mix and match.</p></div>
    <label>Style target<select id="style-target">${options(targets, styleTarget)}</select></label>
    <div class="selection-tools"><button type="button" data-action="pick-element" aria-pressed="${picking}">${picking ? 'Cancel picking' : 'Pick an element in the preview'}</button>${selection}</div>
    ${carousel('style', styleTarget === 'page' ? 'Page designs' : 'Component styles')}${lock}${carousel('palette', 'Colors & backgrounds')}
    ${styleTarget !== 'page' ? '<button type="button" class="wide-button" data-action="reset-component">Use page defaults for this target</button>' : ''}
    <p class="browser-key-hint">Focus a browser and use the keyboard’s ← / → keys. Undo is always available.</p></div>`;
}
function updateStyleBrowsers() {
  for (const kind of ['style', 'palette']) {
    const title = $(`[data-browser-title="${kind}"]`);
    if (!title) continue;
    const catalog = browserCatalog(kind),
      index = browserIndex(kind),
      item = catalog[index];
    title.textContent =
      item?.name ?? (kind === 'palette' ? 'Current colors' : 'Page defaults / custom');
    $(`[data-browser-count="${kind}"]`).textContent =
      `${index < 0 ? '—' : index + 1} / ${catalog.length}`;
    $(`[data-browser-description="${kind}"]`).textContent =
      item?.description ?? 'Click an arrow to start exploring the library.';
    const colors = item?.colors || item?.theme || activeTheme();
    $(`[data-browser-swatches="${kind}"]`).innerHTML =
      styleTarget !== 'page' && kind === 'style'
        ? `<span class="component-sample" style="border-radius:${Math.min(item?.corner ?? 8, 30)}px;font-family:${item ? FONT_OPTIONS[item.font].family.replaceAll('"', '&quot;') : 'inherit'}">Aa <span>Preview</span></span>`
        : ['canvas', 'surface', 'text', 'accent']
            .map((key) => `<i style="background:${colors[key]}"></i>`)
            .join('');
    const select = $(`[data-browser-select="${kind}"]`);
    select.innerHTML =
      `<option value="" disabled ${index < 0 ? 'selected' : ''}>Choose from ${catalog.length} options</option>` +
      options(
        catalog.map((r, i) => [r.id, `${i + 1}. ${r.name}`]),
        item?.id,
      );
  }
  const pickButton = $('[data-action="pick-element"]');
  if (pickButton) {
    pickButton.setAttribute('aria-pressed', String(picking));
    pickButton.textContent = picking ? 'Cancel picking' : 'Pick an element in the preview';
  }
}
function applyBrowser(kind, index) {
  const catalog = browserCatalog(kind),
    item = catalog[(index + catalog.length) % catalog.length];
  transaction(
    () => {
      if (styleTarget === 'page') {
        let updated;
        if (kind === 'palette') updated = { ...theme(), ...item.colors };
        else {
          updated = structuredClone(item.theme);
          if (keepColors)
            for (const key of [...COLOR_KEYS, 'canvasPattern']) updated[key] = theme()[key];
        }
        if (scope === 'page') page().theme = updated;
        else project().theme = updated;
      } else if (selectedElement) {
        page().elementStyles ??= [];
        let entry = page().elementStyles.find(
          (entry) => entry.selector === selectedElement.selector,
        );
        if (!entry) {
          if (page().elementStyles.length >= 100)
            throw new Error('This page already has 100 individual styles.');
          entry = { selector: selectedElement.selector, target: styleTarget };
          page().elementStyles.push(entry);
        }
        entry[kind === 'palette' ? 'paletteId' : 'styleId'] = item.id;
      } else {
        const updated = structuredClone(theme());
        updated[kind === 'palette' ? 'componentPalettes' : 'componentStyles'][styleTarget] =
          item.id;
        if (scope === 'page') page().theme = updated;
        else project().theme = updated;
      }
    },
    { rerender: false, preview: false },
  );
  updateThemePreview();
}
function cycleBrowser(kind, step) {
  const index = browserIndex(kind);
  applyBrowser(kind, (index < 0 ? (step < 0 ? 0 : -1) : index) + step);
}
function renderControls() {
  if (tab === 'content') return renderContent();
  const open = new Set(
    [...document.querySelectorAll('details[open]')].map((element) => element.dataset.group),
  );
  const first = !$('#control-content').querySelector('details.control-group');
  const fontChoices = [
    ...Object.entries(FONT_OPTIONS).map(([id, font]) => [id, font.label]),
    ...library.fonts.map((font) => [`custom:${font.id}`, `${font.name} · local`]),
  ];
  const labels = {
    canvas: 'Page background',
    surface: 'Cards and panels',
    text: 'Main text',
    muted: 'Secondary text',
    accent: 'Accent and links',
    onAccent: 'Text on accent',
    border: 'Borders',
  };
  const colors = COLOR_KEYS.map(
    (key) =>
      `<div class="color-field"><label for="color-${key}">${labels[key]}</label><input id="color-${key}" type="color" value="${theme()[key]}" data-token="${key}" aria-label="${labels[key]} color"><input type="text" data-hex="${key}" value="${theme()[key]}" pattern="#[a-fA-F0-9]{6}" maxlength="7" aria-label="${labels[key]} hex value" spellcheck="false"></div>`,
  ).join('');
  const sections = [
    ['colors', 'Colors', colors, true],
    [
      'type',
      'Typography',
      selectField('headingFont', 'Heading font', fontChoices) +
        selectField('bodyFont', 'Body font', fontChoices) +
        rangeField('fontSize', 'Body size', 14, 20, 1, 'px') +
        rangeField('headingScale', 'Heading scale', 0.8, 1.25, 0.05, '×') +
        rangeField('lineHeight', 'Line height', 1.4, 1.9, 0.05, '×'),
      true,
    ],
    [
      'layout',
      'Page composition',
      selectField('hero', 'Introduction', [
        ['split', 'Text and profile'],
        ['reverse', 'Profile first'],
        ['center', 'Centered'],
        ['banner', 'Wide banner'],
        ['portrait-led', 'Portrait led'],
        ['compact', 'Compact studio'],
        ['magazine', 'Magazine'],
        ['split-panel', 'Split panel'],
      ]) +
        selectField('projects', 'Project layout', [
          ['grid', 'Card grid'],
          ['list', 'One-column list'],
        ]) +
        selectField('columns', 'Grid columns', [
          [1, 'One'],
          [2, 'Two'],
          [3, 'Three'],
        ]) +
        selectField('sections', 'Section treatment', [
          ['rules', 'Dividing rules'],
          ['blocks', 'Separate panels'],
          ['plain', 'Open space'],
        ]) +
        rangeField('contentWidth', 'Maximum page width', 860, 1440, 20, 'px') +
        rangeField('density', 'Section spacing', 0.7, 1.4, 0.05, '×') +
        rangeField('gap', 'Grid spacing', 12, 40, 2, 'px'),
      false,
    ],
    [
      'components',
      'Components',
      rangeField('corner', 'Card corners', 0, 40, 1, 'px') +
        selectField('shadow', 'Card shadows', [
          ['none', 'None'],
          ['soft', 'Soft'],
          ['lifted', 'Lifted'],
        ]) +
        rangeField('borderWidth', 'Border width', 0, 3, 1, 'px') +
        selectField('buttonStyle', 'Primary buttons', [
          ['solid', 'Solid'],
          ['outline', 'Outline'],
        ]) +
        selectField('buttonCorner', 'Button shape', [
          [0, 'Square'],
          [6, 'Subtle corners'],
          [12, 'Rounded'],
          [24, 'Soft'],
          [999, 'Pill'],
        ]) +
        rangeField('fieldCorner', 'Form field corners', 0, 24, 1, 'px') +
        selectField('portrait', 'Portrait frame', [
          ['circle', 'Circular'],
          ['rounded', 'Rounded square'],
          ['square', 'Square'],
        ]) +
        selectField('navStyle', 'Navigation style', [
          ['line', 'Simple line'],
          ['pill', 'Individual pills'],
          ['panel', 'Surface panel'],
        ]),
      false,
    ],
    [
      'checks',
      'Readability checks',
      '<div id="contrast-checks"></div><p class="control-help">Aim for at least 4.5:1 for normal text. These checks cover color pairs; also review focus, content order, and the real page at each preview size.</p>',
      true,
    ],
  ];
  $('#control-content').innerHTML =
    `<div class="scope-control"><label>Apply changes to<select id="scope-select">${options(
      [
        ['site', 'Whole site'],
        ['page', 'This page only'],
      ],
      scope,
    )}</select></label>${scope === 'page' ? '<p>Overrides for this page.</p>' : page().theme ? '<p>This page has its own style. Use site style below to preview shared changes here.</p>' : ''}${page().theme ? '<button type="button" data-action="clear-page-style">Use site style on this page</button>' : ''}</div>` +
    styleBrowsers() +
    `<details class="advanced-controls" data-group="advanced" ${open.has('advanced') ? 'open' : ''}><summary>Advanced adjustments</summary><p class="control-help">Fine-tune the design after finding a starting point.</p>` +
    sections
      .map(([id, title, content, defaultOpen]) =>
        group(id, title, content, first ? defaultOpen : open.has(id)),
      )
      .join('') +
    '</details>';
  updateChecks();
  updateStyleBrowsers();
}
function updateChecks() {
  if (!$('#contrast-checks')) return;
  const t = theme(),
    pairs = [
      ['Body text', t.text, t.canvas],
      ['Secondary text', t.muted, t.canvas],
      ['Card text', t.text, t.surface],
      ['Links', t.accent, t.canvas],
      [
        'Button text',
        t.buttonStyle === 'solid' ? t.onAccent : t.accent,
        t.buttonStyle === 'solid' ? t.accent : t.canvas,
      ],
    ];
  $('#contrast-checks').innerHTML = pairs
    .map(([label, a, b]) => {
      const ratio = contrast(a, b);
      return `<div class="check-row"><span>${label}</span><strong class="${ratio >= 4.5 ? 'pass' : 'review'}">${ratio.toFixed(1)}:1 · ${ratio >= 4.5 ? 'Pass' : 'Review'}</strong></div>`;
    })
    .join('');
}
function renderContent() {
  const current = page();
  if (current.source !== 'builder') {
    $('#control-content').innerHTML =
      `<div class="content-panel"><h2>Your existing ${current.source === 'gallery' ? 'gallery' : 'portfolio'}</h2><p class="control-help" style="margin-top:12px">The original HTML, personal content, and language switch remain part of this page. Use Style to customize its appearance. Add a template page to edit content and rearrange sections here.</p><button type="button" class="wide-button" data-action="new-page">+ Add an editable page</button></div>`;
    return;
  }
  const section = current.sections.find((s) => s.id === sectionId) || current.sections[0];
  sectionId = section.id;
  $('#control-content').innerHTML =
    `<div class="content-panel"><label>Page name<input data-content="page-title" value="${e(current.title)}" maxlength="80"></label><h2 style="margin-top:22px">Sections</h2><div class="section-list">${current.sections.map((s, index) => `<div class="section-row"><button type="button" class="section-select" data-section="${s.id}" aria-pressed="${s.id === sectionId}">${e(s.title || s.type)}</button><button type="button" class="section-move" data-move="-1" data-section-id="${s.id}" aria-label="Move ${e(s.type)} earlier" ${index <= 1 ? 'disabled' : ''}>↑</button><button type="button" class="section-move" data-move="1" data-section-id="${s.id}" aria-label="Move ${e(s.type)} later" ${index === 0 || index === current.sections.length - 1 ? 'disabled' : ''}>↓</button></div>`).join('')}</div><div class="section-add"><select id="block-type" aria-label="New section type">${options(
      [
        ['about', 'Text section'],
        ['features', 'Feature cards'],
        ['projects', 'Project cards'],
        ['contact', 'Contact section'],
      ],
      'about',
    )}</select><button type="button" data-action="add-section">Add</button></div><label>Section heading<input data-content="title" value="${e(section.title)}" maxlength="160"></label><label>Section text<textarea data-content="body" rows="4" maxlength="6000">${e(section.body)}</textarea></label>${section.items.map((item, index) => `<div class="item-editor"><label>Card ${index + 1} title<input data-item="${index}" data-item-field="title" maxlength="120" value="${e(item.title)}"></label><label>Card text<textarea data-item="${index}" data-item-field="body" maxlength="1500">${e(item.body)}</textarea></label><button type="button" data-remove-item="${index}">Remove card</button></div>`).join('')}${['projects', 'features'].includes(section.type) ? `<button type="button" class="wide-button" data-action="add-item" ${section.items.length >= 8 ? 'disabled' : ''}>+ Add card</button>` : ''}<button type="button" class="wide-button danger-link" data-action="delete-section" ${section.type === 'hero' ? 'disabled' : ''}>Remove this section</button>${project().pages.indexOf(current) > 0 ? '<button type="button" class="wide-button danger-link" data-action="delete-page">Delete this page</button>' : ''}</div>`;
}

let dialogCallback;
function showDialog(title, body, buttonLabel, callback) {
  $('#modal-content').innerHTML = `<h2 id="modal-title">${title}</h2>${body}`;
  $('#modal-submit').textContent = buttonLabel;
  dialogCallback = callback;
  $('#modal').showModal();
}
function templateChoices() {
  return `<div class="template-options">${[
    ['profile', 'Personal portfolio', 'Selected work, approach, and a contact section.'],
    ['services', 'Product or services', 'A clear introduction, benefits, and next steps.'],
    ['case-study', 'Project story', 'Problem, approach, features, and selected examples.'],
  ]
    .map(
      ([value, label, description], index) =>
        `<label><input type="radio" name="template" value="${value}" ${index === 0 ? 'checked' : ''}><span>${label}<small>${description}</small></span></label>`,
    )
    .join('')}</div>`;
}
function setToken(key, value) {
  if (!historyBefore) historyBefore = snapshot();
  const updated = normalizeTheme({ ...theme(), [key]: value }, library.fonts);
  if (scope === 'page') page().theme = updated;
  else project().theme = updated;
  updateThemePreview();
  queueSave();
}

const actions = {
  'pick-element'() {
    picking = !picking;
    if (picking)
      notice('Click a heading, action, card, field, portrait, section, or text in the preview.');
    updateThemePreview();
  },
  'clear-selection'() {
    selectedElement = null;
    renderControls();
    updateThemePreview();
  },
  'reset-component'() {
    transaction(
      () => {
        if (selectedElement)
          page().elementStyles = page().elementStyles.filter(
            (entry) => entry.selector !== selectedElement.selector,
          );
        else {
          const updated = structuredClone(theme());
          delete updated.componentStyles[styleTarget];
          delete updated.componentPalettes[styleTarget];
          if (scope === 'page') page().theme = updated;
          else project().theme = updated;
        }
      },
      { rerender: false, preview: false },
    );
    updateThemePreview();
  },
  'manage-recipes'() {
    if (!library.recipes.length)
      return notice('Save a custom style first. Built-in recipes are always available.');
    showDialog(
      'Manage saved styles',
      `<p>Remove a saved recipe from the library. Projects already using its settings keep their appearance.</p><label>Saved style<select name="recipe">${options(
        library.recipes.map((r) => [r.id, r.name]),
        library.recipes[0].id,
      )}</select></label>`,
      'Remove recipe',
      (data) =>
        transaction(
          () => {
            library.recipes = library.recipes.filter((r) => r.id !== data.get('recipe'));
          },
          { preview: false },
        ),
    );
  },
  'manage-fonts'() {
    if (!library.fonts.length)
      return notice('No font files have been imported. System fonts stay available.');
    showDialog(
      'Manage local fonts',
      `<p>Remove a font file from this library. Any style using it will switch to the system sans font. Undo is available during this session.</p><label>Local font<select name="font">${options(
        library.fonts.map((f) => [f.id, f.name]),
        library.fonts[0].id,
      )}</select></label>`,
      'Remove font',
      (data) =>
        transaction(() => {
          const key = `custom:${data.get('font')}`;
          const reset = (theme) => {
            for (const role of ['headingFont', 'bodyFont'])
              if (theme[role] === key) theme[role] = 'system';
          };
          library.projects.forEach((project) => {
            reset(project.theme);
            project.pages.forEach((page) => page.theme && reset(page.theme));
          });
          library.recipes.forEach((recipe) => reset(recipe.theme));
          library.fonts = library.fonts.filter((font) => font.id !== data.get('font'));
        }),
    );
  },
  undo() {
    commitInput();
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  },
  redo() {
    commitInput();
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
  },
  library() {
    const open = $('#library-pane').classList.toggle('is-open');
    $('[data-action="library"]').setAttribute('aria-expanded', String(open));
  },
  backup() {
    download({ kind: 'style-studio-library', ...library }, 'style-studio-library.json');
    notice('Library backup downloaded. It includes your projects, recipes, and local fonts.');
  },
  import() {
    $('#import-file').click();
  },
  font() {
    $('#font-file').click();
  },
  'cancel-dialog'() {
    $('#modal').close();
  },
  'new-project'() {
    showDialog(
      'Create a project',
      `<p>Choose a starting structure. Every section can be edited, and styles can be swapped independently.</p><label>Project name<input name="name" required maxlength="80" value="My new website"></label>${templateChoices()}`,
      'Create project',
      (data) =>
        transaction(() => {
          const p = createProject(
            data.get('name').trim() || 'Untitled project',
            data.get('template'),
          );
          library.projects.push(p);
          projectId = p.id;
          pageId = p.pages[0].id;
          scope = 'site';
          sectionId = null;
        }),
    );
  },
  'new-page'() {
    showDialog(
      'Add an editable page',
      `<label>Page name<input name="name" required maxlength="80" value="New page"></label>${templateChoices()}`,
      'Add page',
      (data) =>
        transaction(() => {
          const p = createPage(data.get('template'), data.get('name').trim() || 'New page');
          project().pages.push(p);
          pageId = p.id;
          sectionId = null;
          tab = 'content';
        }),
    );
  },
  'rename-project'() {
    showDialog(
      'Rename project',
      `<label>Project name<input name="name" required maxlength="80" value="${e(project().name)}"></label>`,
      'Rename',
      (data) => transaction(() => (project().name = data.get('name').trim() || 'Untitled project')),
    );
  },
  'duplicate-project'() {
    transaction(() => {
      const copy = structuredClone(project());
      copy.id = uid('project');
      copy.name = (copy.name + ' · Copy').slice(0, 80);
      library.projects.push(copy);
      projectId = copy.id;
      pageId = copy.pages[0].id;
    });
  },
  'delete-project'() {
    if (library.projects.length === 1) return notice('Keep at least one project in the library.');
    showDialog(
      'Delete this project?',
      `<p>${e(project().name)} will be removed from this library. You can undo this during the current session.</p>`,
      'Delete project',
      () =>
        transaction(() => {
          library.projects = library.projects.filter((p) => p.id !== projectId);
          projectId = library.projects[0].id;
          pageId = project().pages[0].id;
        }),
    );
  },
  'save-recipe'() {
    showDialog(
      'Save a style recipe',
      '<p>Save the current colors, type, layouts, and component settings for another page or project.</p><label>Recipe name<input name="name" required maxlength="80" value="My custom style"></label>',
      'Save recipe',
      (data) =>
        transaction(
          () =>
            library.recipes.push({
              id: uid('recipe'),
              name: data.get('name').trim() || 'Custom style',
              description: 'Your saved style recipe.',
              theme: structuredClone(theme()),
            }),
          { preview: false },
        ),
    );
  },
  'export-style'() {
    download(
      {
        kind: 'style-studio-recipe',
        version: 1,
        name: 'Custom style',
        theme: theme(),
        fonts: library.fonts.filter((font) =>
          [theme().headingFont, theme().bodyFont].includes(`custom:${font.id}`),
        ),
      },
      'website-style.json',
    );
  },
  async export() {
    await persist();
    notice('Preparing your website ZIP…');
    const blob = await request('/api/export', { project: project(), fonts: library.fonts }, 'blob');
    download(blob, 'website.zip');
    notice('Website exported. Unzip it and use Start Website.cmd to preview it locally.');
  },
  'clear-page-style'() {
    transaction(() => {
      page().theme = null;
      scope = 'site';
    });
  },
  'add-section'() {
    if (page().sections.length >= 16) return notice('A page can contain up to 16 sections.');
    transaction(() => {
      const block = createBlock($('#block-type').value);
      page().sections.push(block);
      sectionId = block.id;
    });
  },
  'delete-section'() {
    transaction(() => {
      page().sections = page().sections.filter((s) => s.id !== sectionId || s.type === 'hero');
      sectionId = null;
    });
  },
  'add-item'() {
    transaction(() =>
      page()
        .sections.find((s) => s.id === sectionId)
        .items.push({ title: 'New card', body: 'Describe one clear point.' }),
    );
  },
  'delete-page'() {
    transaction(() => {
      project().pages = project().pages.filter((p) => p.id !== pageId);
      pageId = project().pages[0].id;
      sectionId = null;
    });
  },
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  try {
    if (button.dataset.action)
      Promise.resolve(actions[button.dataset.action]?.()).catch((error) => notice(error.message));
    if (button.dataset.project) selectProject(button.dataset.project);
    if (button.dataset.cycle) cycleBrowser(button.dataset.cycle, Number(button.dataset.step));
    if (button.dataset.recipe) {
      const recipe = [...RECIPES, ...library.recipes].find((r) => r.id === button.dataset.recipe);
      transaction(() => {
        if (scope === 'page') page().theme = structuredClone(recipe.theme);
        else project().theme = structuredClone(recipe.theme);
      });
      notice(`${recipe.name} applied to ${scope === 'page' ? 'this page' : 'the site'}.`);
    }
    if (button.dataset.width) {
      previewWidth = Number(button.dataset.width);
      $('#preview-width').value = previewWidth;
      document
        .querySelectorAll('[data-width]')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      fitPreview();
    }
    if (button.dataset.tab) {
      tab = button.dataset.tab;
      render();
    }
    if (button.dataset.section) {
      sectionId = button.dataset.section;
      renderContent();
      $('#preview')
        .contentDocument?.querySelector(`[data-section-id="${sectionId}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    if (button.dataset.move)
      transaction(() => {
        const list = page().sections,
          index = list.findIndex((s) => s.id === button.dataset.sectionId),
          target = index + Number(button.dataset.move);
        if (index > 0 && target > 0 && target < list.length)
          [list[index], list[target]] = [list[target], list[index]];
      });
    if (button.dataset.removeItem != null)
      transaction(() =>
        page()
          .sections.find((s) => s.id === sectionId)
          .items.splice(Number(button.dataset.removeItem), 1),
      );
  } catch (error) {
    notice(error.message);
  }
});
document.addEventListener('input', (event) => {
  const field = event.target;
  try {
    if (field.id === 'recipe-search') {
      filterRecipes();
    }
    if (field.dataset.token || field.dataset.hex) {
      const key = field.dataset.token || field.dataset.hex;
      const value =
        key in DEFAULT_THEME && typeof DEFAULT_THEME[key] === 'number'
          ? Number(field.value)
          : field.value;
      if (field.dataset.hex && !/^#[a-f\d]{6}$/i.test(value)) return;
      setToken(key, value);
      const output = document.querySelector(`[data-output="${key}"]`);
      if (output) output.textContent = value + (field.dataset.unit || '');
      if (COLOR_KEYS.includes(key)) {
        document.querySelector(`[data-token="${key}"]`).value = value;
        document.querySelector(`[data-hex="${key}"]`).value = value;
      }
    }
    if (field.dataset.content || field.dataset.item != null) {
      if (!historyBefore) historyBefore = snapshot();
      if (field.dataset.content === 'page-title') {
        page().title = field.value;
        $('#page-select').selectedOptions[0].textContent = field.value;
      } else {
        const section = page().sections.find((s) => s.id === sectionId);
        if (field.dataset.item != null)
          section.items[Number(field.dataset.item)][field.dataset.itemField] = field.value;
        else section[field.dataset.content] = field.value;
        if (field.dataset.content === 'title')
          document.querySelector(`[data-section="${sectionId}"]`).textContent =
            field.value || section.type;
      }
      queueSave();
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => renderPreview(true), 300);
    }
  } catch (error) {
    notice(error.message);
  }
});
document.addEventListener('change', (event) => {
  const field = event.target;
  if (field.dataset.browserSelect && field.value) {
    const kind = field.dataset.browserSelect;
    applyBrowser(
      kind,
      browserCatalog(kind).findIndex((item) => item.id === field.value),
    );
  } else if (field.id === 'style-target') {
    styleTarget = field.value;
    selectedElement = null;
    picking = false;
    renderControls();
    updateThemePreview();
  } else if (field.id === 'keep-colors') keepColors = field.checked;
  else if (field.id === 'project-select') selectProject(field.value);
  else if (field.id === 'page-select') selectPage(field.value);
  else if (field.id === 'scope-select') {
    scope = field.value;
    renderControls();
  } else if (field.id === 'preview-width') {
    previewWidth = Math.max(320, Math.min(1800, Number(field.value) || 1200));
    field.value = previewWidth;
    document
      .querySelectorAll('[data-width]')
      .forEach((b) =>
        b.setAttribute('aria-pressed', String(Number(b.dataset.width) === previewWidth)),
      );
    fitPreview();
  } else commitInput();
});
$('#modal-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    dialogCallback?.(new FormData(event.target));
    $('#modal').close();
  } catch (error) {
    notice(error.message);
  }
});
document.addEventListener('keydown', (event) => {
  if (
    ['ArrowLeft', 'ArrowRight'].includes(event.key) &&
    !event.target.matches('input,textarea,select')
  ) {
    const browser = event.target.closest('[data-carousel]');
    if (browser) {
      event.preventDefault();
      cycleBrowser(browser.dataset.carousel, event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
  if (event.key === 'Escape' && picking) {
    picking = false;
    updateThemePreview();
  }
  if (
    event.key === 'Escape' &&
    !$('#modal').open &&
    $('#library-pane').classList.contains('is-open')
  ) {
    $('#library-pane').classList.remove('is-open');
    $('[data-action="library"]').setAttribute('aria-expanded', 'false');
    $('[data-action="library"]').focus();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    persist()
      .then(() => notice('Saved on this PC.'))
      .catch((error) => notice(error.message));
  }
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === 'z' &&
    !event.target.matches('input,textarea,select')
  ) {
    event.preventDefault();
    event.shiftKey ? actions.redo() : actions.undo();
  }
});
window.addEventListener('beforeunload', (event) => {
  if (dirty || saving) {
    event.preventDefault();
    event.returnValue = '';
  }
});
window.addEventListener('message', (event) => {
  if (event.source !== $('#preview').contentWindow || event.origin !== location.origin) return;
  if (event.data?.type === 'studio-ready') updateThemePreview();
  if (event.data?.type === 'studio-select' && Object.hasOwn(COMPONENT_TARGETS, event.data.target)) {
    styleTarget = event.data.target;
    selectedElement = {
      selector: event.data.selector,
      label: String(event.data.label).slice(0, 60),
    };
    picking = false;
    tab = 'style';
    render();
    updateThemePreview();
  }
  if (event.data?.type === 'studio-link') {
    const target = project().pages.find(
      (p, index) => pageFilename(p, index) === event.data.href?.split('#')[0],
    );
    if (target) selectPage(target.id);
    else notice('External links are available when you open the exported website.');
  }
});
$('#import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 24000000) throw new Error('Choose a backup smaller than 24 MB.');
    const raw = JSON.parse(await file.text());
    const imported =
      raw.kind === 'style-studio-recipe'
        ? normalizeLibrary({
            version: 1,
            fonts: raw.fonts || [],
            projects: [{ ...createProject('Imported style'), theme: raw.theme }],
            recipes: [],
          })
        : raw.kind === 'style-studio-project'
          ? normalizeLibrary({
              version: 1,
              fonts: raw.fonts || [],
              projects: [raw.project],
              recipes: [],
            })
          : normalizeLibrary(raw);
    showDialog(
      'Import into your library',
      `<p>${raw.kind === 'style-studio-recipe' ? 'One style recipe' : `${imported.projects.length} project(s)`} will be imported as new copies. Existing projects are kept.</p>`,
      'Import copies',
      () =>
        transaction(() => {
          const fontMap = new Map();
          for (const font of imported.fonts) {
            const existing = library.fonts.find((f) => f.id === font.id);
            if (!existing) library.fonts.push(font);
            else if (existing.data !== font.data) {
              const replacement = { ...font, id: uid('font') };
              fontMap.set(`custom:${font.id}`, `custom:${replacement.id}`);
              library.fonts.push(replacement);
            }
          }
          const remap = (t) => {
            for (const key of ['headingFont', 'bodyFont'])
              if (fontMap.has(t[key])) t[key] = fontMap.get(t[key]);
          };
          if (raw.kind === 'style-studio-recipe') {
            const t = structuredClone(imported.projects[0].theme);
            remap(t);
            library.recipes.push({
              id: uid('recipe'),
              name: String(raw.name || 'Imported style').slice(0, 80),
              description: 'Imported style recipe.',
              theme: t,
            });
          } else
            for (const p of imported.projects) {
              const copy = structuredClone(p);
              copy.id = uid('project');
              copy.name = (copy.name + ' · Imported').slice(0, 80);
              remap(copy.theme);
              copy.pages.forEach((page) => page.theme && remap(page.theme));
              library.projects.push(copy);
            }
          for (const recipe of imported.recipes) {
            const copy = structuredClone(recipe);
            copy.id = uid('recipe');
            remap(copy.theme);
            library.recipes.push(copy);
          }
        }),
    );
  } catch (error) {
    notice(error.message);
  } finally {
    event.target.value = '';
  }
});
$('#font-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2000000 || !file.size)
      throw new Error('Choose a font file between 1 byte and 2 MB.');
    const extension = file.name.split('.').at(-1).toLowerCase();
    if (!['woff2', 'woff', 'ttf', 'otf'].includes(extension))
      throw new Error('Use a WOFF2, WOFF, TTF, or OTF file.');
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(`data:font/${extension};base64,${reader.result.split(',')[1]}`);
      reader.onerror = () => reject(new Error('Could not read the font.'));
      reader.readAsDataURL(file);
    });
    const font = {
      id: uid('font'),
      name: file.name.replace(/\.[^.]+$/, '').slice(0, 80),
      data,
    };
    const face = new FontFace(`StudioFont_${font.id}`, `url("${data}")`);
    await face.load();
    transaction(() => library.fonts.push(font), { preview: false });
    notice('Font added. Choose it under Typography.');
  } catch (error) {
    notice(error.message);
  } finally {
    event.target.value = '';
  }
});

new ResizeObserver(fitPreview).observe($('#preview-stage'));
try {
  const state = await request('/api/library');
  library = normalizeLibrary(state.library);
  revision = state.revision;
  try {
    projectId = localStorage.getItem('style-studio-project');
  } catch {}
  projectId = project().id;
  pageId = project().pages[0].id;
  scope = page().theme ? 'page' : 'site';
  render();
  renderPreview();
  updateSaveLabel('Saved on this PC');
} catch (error) {
  $('#loading').textContent = 'Could not open the local library.';
  notice(error.message);
  updateSaveLabel('Connection needs attention');
}

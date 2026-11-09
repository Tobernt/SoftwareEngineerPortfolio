import { themeVariables, themeAttributes } from './lib/model.mjs';
import { COMPONENT_TARGETS } from './lib/catalog.mjs';
import { componentCSS } from './lib/style-rules.mjs';
import { fitHeadings } from './typography.mjs';

const parentOrigin = new URL(document.baseURI).origin;
const loadedFonts = new Set();
let picking = false,
  pickTarget = 'page',
  hovered = null,
  selected = null;
const pickerStyle = document.createElement('style');
pickerStyle.textContent =
  '[data-studio-hover]{outline:3px dashed #3b82f6!important;outline-offset:4px;cursor:crosshair!important}[data-studio-selected]{outline:3px solid #3b82f6!important;outline-offset:4px}';
document.head.append(pickerStyle);
async function apply(theme, fonts = [], fontCatalog = fonts, elementStyles = []) {
  for (const [key, value] of Object.entries(themeVariables(theme, fontCatalog)))
    document.documentElement.style.setProperty(key, value);
  for (const [key, value] of Object.entries(themeAttributes(theme)))
    document.documentElement.setAttribute(key, value);
  document.querySelector('#site-component-styles').textContent = componentCSS(theme, elementStyles);
  for (const font of fonts) {
    if (loadedFonts.has(font.id)) continue;
    const face = new FontFace(`StudioFont_${font.id}`, `url("${font.data}")`);
    await face.load();
    document.fonts.add(face);
    loadedFonts.add(font.id);
  }
  fitHeadings();
}
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.origin !== parentOrigin) return;
  if (event.data?.type === 'studio-theme') {
    picking = !!event.data.picking;
    pickTarget = event.data.pickTarget;
    if (!picking) {
      hovered?.removeAttribute('data-studio-hover');
      hovered = null;
    }
    selected?.removeAttribute('data-studio-selected');
    selected = event.data.selectedSelector
      ? document.querySelector(event.data.selectedSelector)
      : null;
    selected?.setAttribute('data-studio-selected', '');
    apply(
      event.data.theme,
      event.data.fonts,
      event.data.fontCatalog,
      event.data.elementStyles,
    ).catch(() => {});
  }
});
function identify(element) {
  if (Object.hasOwn(COMPONENT_TARGETS, pickTarget)) {
    const match = element.closest(COMPONENT_TARGETS[pickTarget].selector);
    if (match) return { element: match, target: pickTarget };
  }
  // Prefer the smallest semantic component under the pointer.
  for (const target of [
    'buttons',
    'fields',
    'headings',
    'portrait',
    'text',
    'cards',
    'navigation',
    'sections',
  ]) {
    const match = element.closest(COMPONENT_TARGETS[target].selector);
    if (match) return { element: match, target };
  }
}
function selectorFor(element) {
  const path = [];
  while (element && element !== document.body) {
    const tag = element.tagName.toLowerCase();
    const siblings = [...element.parentElement.children].filter(
      (child) => child.tagName === element.tagName,
    );
    path.unshift(`${tag}:nth-of-type(${siblings.indexOf(element) + 1})`);
    element = element.parentElement;
  }
  return `body > ${path.join(' > ')}`;
}
document.addEventListener('pointerover', (event) => {
  if (!picking) return;
  hovered?.removeAttribute('data-studio-hover');
  hovered = identify(event.target)?.element;
  hovered?.setAttribute('data-studio-hover', '');
});
document.addEventListener(
  'click',
  (event) => {
    if (!picking) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const match = identify(event.target);
    if (!match) return;
    parent.postMessage(
      {
        type: 'studio-select',
        target: match.target,
        selector: selectorFor(match.element),
        label: `${match.element.tagName.toLowerCase()} · ${(match.element.textContent.trim() || match.target).replace(/\s+/g, ' ').slice(0, 45)}`,
      },
      parentOrigin,
    );
  },
  true,
);
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || link.getAttribute('href').startsWith('#')) return;
  event.preventDefault();
  parent.postMessage({ type: 'studio-link', href: link.getAttribute('href') }, parentOrigin);
});
document.addEventListener('submit', (event) => {
  // The original form can build its email draft; preview never sends a message.
  event.preventDefault();
});
parent.postMessage({ type: 'studio-ready' }, parentOrigin);

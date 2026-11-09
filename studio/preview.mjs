import { themeVariables, themeAttributes } from './lib/model.mjs';

const parentOrigin = new URL(document.baseURI).origin;
const loadedFonts = new Set();
async function apply(theme, fonts = [], fontCatalog = fonts) {
  for (const [key, value] of Object.entries(themeVariables(theme, fontCatalog)))
    document.documentElement.style.setProperty(key, value);
  for (const [key, value] of Object.entries(themeAttributes(theme)))
    document.documentElement.setAttribute(key, value);
  for (const font of fonts) {
    if (loadedFonts.has(font.id)) continue;
    const face = new FontFace(`StudioFont_${font.id}`, `url("${font.data}")`);
    await face.load();
    document.fonts.add(face);
    loadedFonts.add(font.id);
  }
}
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.origin !== parentOrigin) return;
  if (event.data?.type === 'studio-theme')
    apply(event.data.theme, event.data.fonts, event.data.fontCatalog).catch(() => {});
});
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

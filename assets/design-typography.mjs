// Fit only the longest unbreakable word. Normal wrapping keeps the rest of each headline fluid.
const fitted = new Map();
const measure = document.createElement('span');
measure.setAttribute('aria-hidden', 'true');
measure.style.cssText =
  'position:fixed;left:-100000px;top:0;width:max-content;visibility:hidden;pointer-events:none;white-space:pre;text-wrap:nowrap;padding:0;border:0;margin:0';
document.body.append(measure);
measure.style.setProperty('transition', 'none', 'important');
export function fitHeadings() {
  const headings = [...document.querySelectorAll('main :is(h1,h2,h3,h4)')];
  for (const heading of headings) {
    if (fitted.has(heading)) heading.style.fontSize = fitted.get(heading);
    else fitted.set(heading, heading.style.fontSize);
  }
  for (const heading of headings) {
    const style = getComputedStyle(heading);
    const available =
      heading.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 2;
    if (available <= 0) continue;
    const baseSize = parseFloat(style.fontSize);
    measure.style.font = style.font;
    measure.style.letterSpacing = style.letterSpacing;
    measure.style.fontVariationSettings = style.fontVariationSettings;
    measure.style.fontFeatureSettings = style.fontFeatureSettings;
    let longest = 0;
    for (const word of heading.textContent.trim().split(/\s+/)) {
      measure.textContent = word;
      longest = Math.max(longest, measure.getBoundingClientRect().width);
    }
    if (longest > available) heading.style.fontSize = `${(baseSize * available) / longest}px`;
  }
  for (const heading of fitted.keys()) if (!heading.isConnected) fitted.delete(heading);
}
let lastWidth = 0;
new ResizeObserver(([entry]) => {
  if (entry.contentRect.width !== lastWidth) {
    lastWidth = entry.contentRect.width;
    fitHeadings();
  }
}).observe(document.documentElement);
new MutationObserver(fitHeadings).observe(document.querySelector('main') || document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});
document.fonts.ready.then(fitHeadings);
document.fonts.addEventListener('loadingdone', fitHeadings);
document.addEventListener('i18n:languagechange', fitHeadings);
window.addEventListener('resize', fitHeadings);
fitHeadings();

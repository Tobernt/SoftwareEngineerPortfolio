import { COMPONENT_TARGETS, COMPONENT_STYLES, PALETTES } from './catalog.mjs';

const families = {
  humanist: '"Segoe UI",system-ui,sans-serif',
  technical: 'Bahnschrift,"Arial Narrow",sans-serif',
  grotesk: 'Arial,Helvetica,sans-serif',
  serif: 'Georgia,serif',
  book: '"Palatino Linotype",Palatino,Georgia,serif',
  classic: 'Tahoma,Verdana,sans-serif',
  mono: 'Consolas,"Courier New",monospace',
};
function rules(target, style, palette) {
  const colors = palette
    ? Object.entries(palette.colors)
        .filter(([key]) => key !== 'canvasPattern')
        .map(([key, value]) => `--ds-${key}:${value}`)
        .join(';') + ';'
    : '';
  const color = palette ? 'color:var(--ds-text);background-color:var(--ds-surface);' : '';
  if (!style) return colors + color;
  const { finish: f, spacing: s, weight, font } = style;
  // Oversized pill radii suit actions and portraits; panels keep usable rectangular content areas.
  const radius =
    style.corner === 999 && !['buttons', 'portrait', 'fields'].includes(target) ? 32 : style.corner;
  let css = `${colors}color:var(--ds-text);font-family:${families[font]};font-weight:${weight};border-radius:${radius}px;`;
  if (target === 'headings' || target === 'text') {
    css += `background:${palette ? 'var(--ds-surface)' : 'none'};letter-spacing:${font === 'mono' ? '-.025em' : weight >= 700 ? '-.035em' : '.005em'};`;
    if (target === 'headings') css += `line-height:${s < 1 ? 1.12 : 1.22};`;
    else css += `line-height:${(1.5 + s * 0.15).toFixed(2)};`;
    css += 'border:0;padding:0;box-shadow:none;';
    if (['rule', 'double', 'heavy'].includes(f))
      css += `border-bottom:${f === 'double' ? '4px double' : `${f === 'heavy' ? 3 : 1}px solid`} var(--ds-accent);padding-bottom:.2em;`;
    if (f === 'rail') css += 'border-left:4px solid var(--ds-accent);padding-left:.35em;';
    if (['solid', 'soft', 'inset'].includes(f))
      css += 'background:var(--ds-surface);padding:.18em .3em;';
    if (f === 'offset')
      css += 'text-shadow:2px 2px 0 color-mix(in srgb,var(--ds-accent) 25%,transparent);';
    if (f === 'raised') css += 'border-bottom:3px solid var(--ds-border);padding-bottom:.15em;';
    if (f === 'outline') css += 'color:var(--ds-accent);';
    return css;
  }
  css +=
    'box-sizing:border-box;background:var(--ds-surface);border:1px solid var(--ds-border);box-shadow:none;';
  if (target === 'buttons')
    css += `display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:${Math.round(10 * s)}px ${Math.round(20 * s)}px;line-height:1.4;text-align:center;white-space:normal;`;
  if (['cards', 'navigation', 'sections'].includes(target))
    css += `padding:${Math.round((target === 'sections' ? 32 : 20) * s)}px;`;
  if (target === 'fields')
    css += `padding:${Math.round(10 * s)}px ${Math.round(12 * s)}px;min-width:0;max-width:100%;`;
  if (target === 'portrait') css += 'padding:5px;overflow:hidden;';
  if (f === 'solid' || (f === 'clean' && target === 'buttons'))
    css += 'background:var(--ds-accent);color:var(--ds-onAccent);border-color:var(--ds-accent);';
  if (f === 'outline')
    css += 'background:var(--ds-canvas);color:var(--ds-accent);border-color:var(--ds-accent);';
  if (f === 'ghost') css += 'background:transparent;border-color:transparent;';
  if (f === 'soft')
    css +=
      'background:color-mix(in srgb,var(--ds-surface) 92%,var(--ds-accent));border-color:transparent;';
  if (f === 'raised') css += 'box-shadow:0 9px 20px rgb(0 0 0 / .18);';
  if (f === 'offset') css += 'box-shadow:4px 4px 0 var(--ds-border);border-color:var(--ds-text);';
  if (f === 'inset') css += 'box-shadow:inset 0 2px 5px rgb(0 0 0 / .2);';
  if (f === 'double') css += 'border:4px double var(--ds-accent);';
  if (f === 'heavy') css += 'border:3px solid var(--ds-text);';
  if (f === 'rail') css += 'border-left:5px solid var(--ds-accent);';
  if (f === 'rule') css += 'border:0;border-bottom:2px solid var(--ds-accent);border-radius:0;';
  return css;
}
export function componentCSS(theme, elementStyles = []) {
  const entries = Object.entries(COMPONENT_TARGETS)
    .map(([target, { selector }]) => ({
      selector,
      target,
      styleId: theme.componentStyles?.[target],
      paletteId: theme.componentPalettes?.[target],
    }))
    .concat(elementStyles);
  return entries
    .filter((entry) => entry.styleId || entry.paletteId)
    .map((entry) => {
      const selector = `html[data-design][data-design] body :is(${entry.selector})`;
      const style = COMPONENT_STYLES.find((item) => item.id === entry.styleId);
      const palette = PALETTES.find((item) => item.id === entry.paletteId);
      let css = `${selector}{${rules(entry.target, style, palette)}}`;
      // Keep nested text legible when a whole panel gets a light or dark palette/solid finish.
      if (['cards', 'sections', 'navigation'].includes(entry.target)) {
        const solid = style?.finish === 'solid';
        css += `${selector} :is(h1,h2,h3,h4,p,li,label,legend,dt,dd){color:var(--ds-${solid ? 'onAccent' : 'text'})}`;
        css += `${selector} :is(.cta-button-primary,.cta-button-ghost,button) span{color:inherit}`;
        if (solid)
          css += `${selector} :is(.eyebrow,.text-link,.project-category,.project-stack){color:var(--ds-onAccent)}`;
      }
      if (entry.target === 'portrait')
        css += `${selector} img{border-radius:inherit;object-fit:cover}`;
      if (entry.target === 'buttons') css += `${selector} :is(span,strong){color:inherit}`;
      return css;
    })
    .join('\n');
}

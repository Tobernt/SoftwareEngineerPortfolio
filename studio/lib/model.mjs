export const VERSION = 1;
export const FONT_OPTIONS = {
  system: { label: 'System sans', family: 'system-ui, sans-serif' },
  humanist: { label: 'Humanist · Segoe UI', family: '"Segoe UI", system-ui, sans-serif' },
  technical: {
    label: 'Technical · Bahnschrift',
    family: 'Bahnschrift, "Arial Narrow", sans-serif',
  },
  grotesk: { label: 'Clean · Arial', family: 'Arial, Helvetica, sans-serif' },
  serif: { label: 'Serif · Georgia', family: 'Georgia, "Times New Roman", serif' },
  book: { label: 'Book · Palatino', family: '"Palatino Linotype", Palatino, Georgia, serif' },
  classic: { label: 'Compact · Tahoma', family: 'Tahoma, Verdana, sans-serif' },
  mono: { label: 'Monospace · Consolas', family: 'Consolas, "Courier New", monospace' },
};

export const DEFAULT_THEME = {
  canvas: '#0c0d11',
  surface: '#111827',
  text: '#f1f5f9',
  muted: '#b6c4d6',
  accent: '#6ee7b7',
  onAccent: '#10251d',
  border: '#46566b',
  headingFont: 'humanist',
  bodyFont: 'humanist',
  fontSize: 16,
  headingScale: 1,
  lineHeight: 1.65,
  contentWidth: 1120,
  density: 1,
  gap: 24,
  corner: 16,
  buttonCorner: 999,
  fieldCorner: 8,
  borderWidth: 1,
  hero: 'split',
  projects: 'grid',
  columns: 2,
  sections: 'rules',
  shadow: 'soft',
  buttonStyle: 'solid',
  portrait: 'circle',
  navStyle: 'line',
};

export const RECIPES = [
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Dark engineering portfolio. Humanist type, clear rules, soft surfaces.',
    theme: { ...DEFAULT_THEME },
  },
  {
    id: 'harbor',
    name: 'Harbor',
    description: 'Cool daylight. Technical headings, reversed introduction, compact project rows.',
    theme: {
      ...DEFAULT_THEME,
      canvas: '#f1f6fb',
      surface: '#ffffff',
      text: '#142b45',
      muted: '#425973',
      accent: '#155e75',
      onAccent: '#ffffff',
      border: '#aebfd0',
      headingFont: 'technical',
      bodyFont: 'grotesk',
      hero: 'reverse',
      projects: 'list',
      corner: 6,
      buttonCorner: 6,
      fieldCorner: 4,
      shadow: 'none',
      density: 0.9,
      navStyle: 'pill',
    },
  },
  {
    id: 'kiln',
    name: 'Kiln',
    description: 'Rose and burgundy. Serif headlines, a centered introduction, generous corners.',
    theme: {
      ...DEFAULT_THEME,
      canvas: '#f6eeee',
      surface: '#fffaf8',
      text: '#382c32',
      muted: '#66545b',
      accent: '#8e334b',
      onAccent: '#ffffff',
      border: '#c5adb5',
      headingFont: 'serif',
      bodyFont: 'grotesk',
      hero: 'center',
      corner: 26,
      buttonCorner: 12,
      fieldCorner: 12,
      shadow: 'none',
      columns: 3,
      density: 1.15,
      navStyle: 'panel',
    },
  },
  {
    id: 'field-notes',
    name: 'Field Notes',
    description:
      'Pale green and forest ink. Book typography, quiet borders, distinct section panels.',
    theme: {
      ...DEFAULT_THEME,
      canvas: '#edf2eb',
      surface: '#fafcf8',
      text: '#263a31',
      muted: '#4e6257',
      accent: '#2b614a',
      onAccent: '#ffffff',
      border: '#a4b6a9',
      headingFont: 'book',
      bodyFont: 'classic',
      corner: 2,
      buttonCorner: 2,
      fieldCorner: 2,
      shadow: 'none',
      sections: 'blocks',
      density: 0.85,
      navStyle: 'line',
    },
  },
];

export const COLOR_KEYS = ['canvas', 'surface', 'text', 'muted', 'accent', 'onAccent', 'border'];
export const NUMBERS = {
  fontSize: [14, 20],
  headingScale: [0.8, 1.25],
  lineHeight: [1.4, 1.9],
  contentWidth: [860, 1440],
  density: [0.7, 1.4],
  gap: [12, 40],
  corner: [0, 40],
  buttonCorner: [0, 999],
  fieldCorner: [0, 24],
  borderWidth: [0, 3],
  columns: [1, 3],
};
export const ENUMS = {
  hero: ['split', 'reverse', 'center'],
  projects: ['grid', 'list'],
  sections: ['rules', 'blocks', 'plain'],
  shadow: ['none', 'soft', 'lifted'],
  buttonStyle: ['solid', 'outline'],
  portrait: ['circle', 'rounded', 'square'],
  navStyle: ['line', 'pill', 'panel'],
};
export const BLOCK_TYPES = ['hero', 'about', 'features', 'projects', 'contact'];
export const uid = (prefix) =>
  `${prefix}_${globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
export const escapeHTML = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

function string(value, fallback = '', max = 6000) {
  if (value == null) return fallback;
  if (typeof value !== 'string' || value.length > max)
    throw new Error('A text field is too long or has the wrong format.');
  return value;
}
function id(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value))
    throw new Error('Invalid project or page identifier.');
  return value;
}
function array(value, max, label) {
  if (!Array.isArray(value) || value.length > max) throw new Error(`Invalid ${label} list.`);
  return value;
}
export function normalizeTheme(input = {}, fonts = []) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid style recipe.');
  const result = { ...DEFAULT_THEME };
  for (const key of COLOR_KEYS) {
    if (input[key] != null) {
      if (!/^#[a-f\d]{6}$/i.test(input[key]))
        throw new Error(`Use a six-digit hex color for ${key}.`);
      result[key] = input[key].toLowerCase();
    }
  }
  for (const [key, [min, max]] of Object.entries(NUMBERS)) {
    if (input[key] != null) {
      if (
        typeof input[key] !== 'number' ||
        !Number.isFinite(input[key]) ||
        input[key] < min ||
        input[key] > max
      )
        throw new Error(`Invalid ${key} value.`);
      result[key] = key === 'columns' ? Math.round(input[key]) : input[key];
    }
  }
  for (const [key, choices] of Object.entries(ENUMS)) {
    if (input[key] != null) {
      if (!choices.includes(input[key])) throw new Error(`Invalid ${key} option.`);
      result[key] = input[key];
    }
  }
  for (const key of ['headingFont', 'bodyFont']) {
    if (input[key] != null) {
      if (
        !Object.hasOwn(FONT_OPTIONS, input[key]) &&
        !fonts.some((font) => `custom:${font.id}` === input[key])
      )
        throw new Error('This style uses a font that is not in the library.');
      result[key] = input[key];
    }
  }
  return result;
}

export function normalizeLibrary(raw) {
  if (!raw || raw.version !== VERSION) throw new Error('Choose a Style Studio version 1 backup.');
  const fonts = array(raw.fonts ?? [], 8, 'font').map((font) => {
    const data = string(font.data, '', 3000000);
    if (
      !/^data:(?:font\/(?:woff2?|ttf|otf)|application\/(?:font-woff|octet-stream|x-font-ttf));base64,[a-zA-Z0-9+/=]+$/.test(
        data,
      )
    )
      throw new Error('Unsupported font data. Use WOFF2, WOFF, or TTF.');
    return { id: id(font.id), name: string(font.name, 'Local font', 80), data };
  });
  const projects = array(raw.projects, 30, 'project').map((project) => ({
    id: id(project.id),
    name: string(project.name, 'Untitled project', 80),
    theme: normalizeTheme(project.theme, fonts),
    pages: array(project.pages, 16, 'page').map((page) => {
      if (!['portfolio', 'gallery', 'builder'].includes(page.source))
        throw new Error('Unknown page template.');
      const sections = array(page.sections ?? [], 16, 'section').map((section) => {
        if (!BLOCK_TYPES.includes(section.type)) throw new Error('Unknown section type.');
        return {
          id: id(section.id),
          type: section.type,
          title: string(section.title, '', 160),
          body: string(section.body),
          items: array(section.items ?? [], 8, 'item').map((item) => ({
            title: string(item.title, '', 120),
            body: string(item.body, '', 1500),
          })),
        };
      });
      if (
        page.source === 'builder' &&
        (sections[0]?.type !== 'hero' || sections.filter((s) => s.type === 'hero').length !== 1)
      )
        throw new Error('Template pages need one introduction at the start.');
      return {
        id: id(page.id),
        title: string(page.title, 'Untitled page', 80),
        source: page.source,
        theme: page.theme ? normalizeTheme(page.theme, fonts) : null,
        sections,
      };
    }),
  }));
  if (!projects.length || projects.some((p) => !p.pages.length))
    throw new Error('Keep at least one project and one page.');
  const recipes = array(raw.recipes ?? [], 30, 'recipe').map((recipe) => ({
    id: id(recipe.id),
    name: string(recipe.name, 'Custom recipe', 80),
    description: string(recipe.description, 'Saved locally.', 200),
    theme: normalizeTheme(recipe.theme, fonts),
  }));
  if (
    new Set(projects.map((p) => p.id)).size !== projects.length ||
    projects.some((p) => new Set(p.pages.map((page) => page.id)).size !== p.pages.length)
  )
    throw new Error('Project and page identifiers must be unique.');
  return { version: VERSION, projects, recipes, fonts };
}

export function createBlock(type) {
  const blocks = {
    hero: {
      title: 'Your work, in one clear sentence.',
      body: 'Introduce what you do, who it helps, and why it matters. Replace this text with your own story.',
      items: [],
    },
    about: {
      title: 'The thinking behind the work.',
      body: 'Describe your approach, experience, or the problem you are solving. Keep this focused on what your audience needs to know.',
      items: [],
    },
    features: {
      title: 'What makes it useful.',
      body: 'Choose the qualities that matter most to your audience.',
      items: [
        {
          title: 'A clear starting point',
          body: 'Explain the first practical benefit in plain language.',
        },
        {
          title: 'Thoughtful details',
          body: 'Describe how the experience supports the people using it.',
        },
        {
          title: 'Built to keep working',
          body: 'Show how your approach supports reliable, maintainable results.',
        },
      ],
    },
    projects: {
      title: 'Selected work.',
      body: 'Present the problem, your contribution, and what you learned.',
      items: [
        {
          title: 'Project title',
          body: 'Describe the problem, what you built, and your role in the work.',
        },
        {
          title: 'Another project',
          body: 'Add a concrete example that shows a different part of your experience.',
        },
      ],
    },
    contact: {
      title: 'Start a conversation.',
      body: 'Tell visitors how to take the next step. Add your preferred contact details here.',
      items: [],
    },
  };
  return { id: uid('section'), type, ...structuredClone(blocks[type] ?? blocks.about) };
}

export function createPage(template = 'profile', title = 'Home') {
  const types =
    template === 'services'
      ? ['hero', 'features', 'about', 'contact']
      : template === 'case-study'
        ? ['hero', 'about', 'features', 'projects', 'contact']
        : ['hero', 'projects', 'about', 'contact'];
  const page = {
    id: uid('page'),
    title,
    source: 'builder',
    theme: null,
    sections: types.map(createBlock),
  };
  if (template === 'services') page.sections[0].title = 'A useful service, clearly explained.';
  if (template === 'case-study') page.sections[0].title = 'The problem. The process. The result.';
  return page;
}
export function createProject(name, template = 'profile') {
  return { id: uid('project'), name, theme: { ...DEFAULT_THEME }, pages: [createPage(template)] };
}
export function seedLibrary() {
  return {
    version: VERSION,
    fonts: [],
    recipes: [],
    projects: [
      {
        id: 'portfolio',
        name: 'Tobias · Portfolio',
        theme: { ...DEFAULT_THEME },
        pages: [
          { id: 'home', title: 'Portfolio', source: 'portfolio', theme: null, sections: [] },
          { id: 'gallery', title: 'UI gallery', source: 'gallery', theme: null, sections: [] },
        ],
      },
      { ...createProject('New site · Example', 'services'), theme: { ...RECIPES[1].theme } },
    ],
  };
}

export function fontFamily(key, fonts = []) {
  if (Object.hasOwn(FONT_OPTIONS, key)) return FONT_OPTIONS[key].family;
  return fonts.some((font) => `custom:${font.id}` === key)
    ? `"StudioFont_${key.slice(7)}", sans-serif`
    : FONT_OPTIONS.system.family;
}
export function themeVariables(theme, fonts = []) {
  const vars = Object.fromEntries(COLOR_KEYS.map((key) => [`--ds-${key}`, theme[key]]));
  return {
    ...vars,
    '--ds-body-font': fontFamily(theme.bodyFont, fonts),
    '--ds-heading-font': fontFamily(theme.headingFont, fonts),
    '--ds-font-size': `${theme.fontSize}px`,
    '--ds-heading-scale': theme.headingScale,
    '--ds-line-height': theme.lineHeight,
    '--ds-width': `${theme.contentWidth}px`,
    '--ds-section-space': `${64 * theme.density}px`,
    '--ds-gap': `${theme.gap}px`,
    '--ds-corner': `${theme.corner}px`,
    '--ds-button-corner': `${theme.buttonCorner}px`,
    '--ds-field-corner': `${theme.fieldCorner}px`,
    '--ds-border-width': `${theme.borderWidth}px`,
    '--ds-columns': theme.columns,
    '--ds-shadow': {
      none: 'none',
      soft: '0 8px 24px rgb(15 23 42 / .10)',
      lifted: '0 18px 42px rgb(15 23 42 / .19)',
    }[theme.shadow],
  };
}
export function themeAttributes(theme) {
  return {
    'data-design': 'custom',
    'data-hero': theme.hero,
    'data-projects': theme.projects,
    'data-sections': theme.sections,
    'data-button-style': theme.buttonStyle,
    'data-portrait': theme.portrait,
    'data-nav-style': theme.navStyle,
  };
}
export function themeStyle(theme, fonts = []) {
  const rules = Object.entries(themeVariables(theme, fonts))
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
  const faces = fonts
    .filter((font) => [theme.headingFont, theme.bodyFont].includes(`custom:${font.id}`))
    .map(
      (font) =>
        `@font-face{font-family:"StudioFont_${font.id}";src:url("${font.data}");font-display:swap}`,
    )
    .join('\n');
  return `${faces}\n:root{${rules}}`;
}
export function contrast(a, b) {
  const luminance = (hex) => {
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function pageFilename(page, index) {
  return index === 0
    ? 'index.html'
    : page.source === 'gallery'
      ? 'gallery.html'
      : `page-${page.id}.html`;
}

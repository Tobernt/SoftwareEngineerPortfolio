# Offline Style Studio

## Purpose

A local design workbench for Tobias's portfolio and gallery, plus new sites assembled from editable page templates. The primary task is to compare and customize a coherent visual system, then export a working website. All runtime code, images, fonts, and project storage are local.

## Interface direction

The editor uses an instrument-panel layout: project library at left, an actual website preview in the center, and grouped controls at right. The preview is the main visual object. The editor's own controls stay consistent while the website changes.

Tokens for the editor: canvas `#eef2f8`, surface `#ffffff`, ink `#162439`, secondary ink `#42536b`, border `#bdcadb`, and selection blue `#2856b6`. Bahnschrift/Segoe UI display text, Segoe UI body text, and Consolas measurements use local font fallbacks.

```text
Desktop
+--------------------------------------------------------------+
| Style Studio    Project     Undo / Redo      Backup / Export   |
+------------+----------------------------------+----------------+
| Projects   | Page + desktop/tablet/mobile     | Site/page scope|
| Pages      |                                  | Styles / Page  |
|            |      Actual website preview      | Colors         |
| Recipes    |                                  | Typography     |
| Custom     |                                  | Layout / shape |
+------------+----------------------------------+----------------+

Narrow screen
+-------------------------+
| Project / actions       |
| Page / preview size     |
| Website preview         |
+-------------------------+
| Styles / content        |
| Grouped controls        |
+-------------------------+
```

## Design principles applied

- **Hierarchy:** separate page content from presentation; keep one primary page heading and use ordered type sizes.
- **Consistency:** shared site tokens style every page; explicit page overrides are available for deliberate exceptions.
- **Progressive disclosure:** make complete style and palette browsing the default task, and keep individual token controls inside collapsed Advanced adjustments.
- **Feedback and recovery:** visible local save state, undo/redo, reset to site style, named recipes, and JSON backups.
- **Readability:** restrained line lengths, a spacing scale, system font choices, and contrast ratios for text and buttons.
- **Keyboard access:** native controls, labeled inputs, clear focus, accessible dialogs, and move-up/down section controls.
- **Responsive design:** inspect real desktop, tablet, and phone viewport widths; layouts collapse without changing the underlying content hierarchy.
- **Deliberate variation:** recipes differ in typography, density, page composition, component shape, and palette. Customization is deterministic and reviewable.

## Preset libraries

The catalog contains 50 authored page compositions, 50 color/background palettes, and 50 reusable component treatments. Complete designs vary introduction layout, serif/sans/monospace typography, navigation, grids or rows, spacing, and surface shapes. Eight introduction layouts include split, reverse, centered, banner, portrait-led, compact, magazine, and split panel. Graphite, Harbor, Kiln, and Field Notes keep their original identifiers for existing projects.

Numbered previous/next browsers wrap at either end, retain keyboard focus, and support Left/Right keys. Direct selection and library search complement the browsing workflow. Palettes are independent of designs, with an optional color lock. Component treatments combine typography, spacing, shape, and clean, outline, soft, raised, rule, double-frame, offset, inset, solid, heavy, rail, or open treatments. Each treatment works on eight semantic target groups or an individual picked element. Structural selectors are validated and stored with the page. Shared group styles and individual overrides render through the same CSS generator in preview and export.

Whole-word heading wrapping replaces automatic hyphenation. The local typography module measures words without wrapping and reduces type only when a word exceeds the available line width; it responds to font, language, and width changes. Heading size changes settle immediately, including with reduced motion enabled. The same module is packaged with exported websites.

## Local operation and boundaries

The local Node server uses built-in modules, binds to the loopback interface, and saves a versioned project library atomically on disk. A portable Windows package includes its own Node runtime. Rebuilding the app preserves its data folder. Existing portfolio content and translation remain available; new template pages have editable sections and content. Website ZIP exports contain browser assets and a local launch script. No publication or third-party form service is required.

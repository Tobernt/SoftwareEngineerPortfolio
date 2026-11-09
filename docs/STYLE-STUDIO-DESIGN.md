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
- **Progressive disclosure:** group colors, type, layouts, components, and design checks in labeled sections.
- **Feedback and recovery:** visible local save state, undo/redo, reset to site style, named recipes, and JSON backups.
- **Readability:** restrained line lengths, a spacing scale, system font choices, and contrast ratios for text and buttons.
- **Keyboard access:** native controls, labeled inputs, clear focus, accessible dialogs, and move-up/down section controls.
- **Responsive design:** inspect real desktop, tablet, and phone viewport widths; layouts collapse without changing the underlying content hierarchy.
- **Deliberate variation:** recipes differ in typography, density, page composition, component shape, and palette. Customization is deterministic and reviewable.

## Recipes

Graphite retains the portfolio's dark engineering character. Harbor uses a cool light palette and a reversed introduction. Kiln uses rose-toned surfaces, serif headings, generous corners, and a centered composition. Field Notes combines pale green surfaces, traditional display type, restrained borders, and compact sections. These are starting points; individual tokens and component styles remain editable.

## Local operation and boundaries

The local Node server uses built-in modules, binds to the loopback interface, and saves a versioned project library atomically on disk. A portable Windows package includes its own Node runtime. Rebuilding the app preserves its data folder. Existing portfolio content and translation remain available; new template pages have editable sections and content. Website ZIP exports contain browser assets and a local launch script. No publication or third-party form service is required.

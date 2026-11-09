# Style Studio — local website workbench

Double-click [Open Style Studio.cmd](../Open%20Style%20Studio.cmd) in the project folder. The editor opens at **http://127.0.0.1:4387**. Leave the launch window running while you work; close it or press Ctrl+C to stop the local server.

The ready-to-run Windows folder is `OfflineStyleStudio/`. It contains its own Node runtime, browser files, and runtime license. It needs no npm install or internet connection. The portable archive is `dist/StyleStudio-Windows-offline.zip`; unzip it before launching `Start Style Studio.cmd`.

![Preset browsers and portfolio preview](style-studio/studio-browsers.png)

## A useful first workflow

1. Select **Tobias · Portfolio** and choose the Portfolio or UI gallery page.
2. Use the **← / →** buttons under **Page designs** to browse 50 complete looks. You can also jump to a numbered style or search the left library. Designs coordinate typography, introduction layout, grids, spacing, navigation, surfaces, and shapes.
3. Choose **Whole site** for shared design decisions, or **This page only** for a page-specific variation.
4. Browse **Colors & backgrounds** independently: 50 light/dark palettes with plain, grid, dot, diagonal, band, or crosshatch backgrounds. Enable **Keep my colors** to hold a preferred palette while browsing layouts.
5. Preview at desktop, tablet, or phone size. You can also enter an exact width from 320 to 1800 pixels. The percentage below the preview is its display scale; the website is rendered at the selected width.
6. Save a named recipe, or export its JSON to reuse in another project. **Undo** and **Redo** are available throughout the session.
7. Use **Export website** to download the project as a ZIP. Unzip it, then use `Start Website.cmd` to preview it locally with the Node installation already on this PC, or upload the browser files to a static host.

Changes save automatically to this PC. **Ctrl+S** saves immediately. **Ctrl+Z** and **Ctrl+Shift+Z** undo and redo when you are outside a text field. Text fields keep their normal editing shortcuts.

## Component and individual element styles

**Style target** switches between a complete page and headings, buttons/actions, cards/panels, navigation, form fields, portraits, sections, and body text. Each component target can use any of 50 treatments and any of the 50 palettes, independently of the page design. Focus a browser or an arrow button and press the keyboard's **Left / Right** keys to cycle; both ends wrap around. The number, name, and live website show the current choice. A custom/default state shows a dash until you choose a preset.

**Pick an element in the preview** lets you restyle one instance. If you choose a component target first, clicking inside that kind of component selects its container; otherwise the picker chooses the smallest semantic component under the pointer. The selected element gets an outline, its controls say **This element on this page only**, and other instances keep their appearance. **Style all… instead** returns to group styling. **Use page defaults for this target** removes that target's overrides. Escape cancels picking. Individual styles survive reloads, backups, project imports, and website exports.

**Advanced adjustments** is collapsed initially. Open it to edit individual colors, fonts, sizes, spacing, layout, corners, shadows, borders, and contrast checks. Page designs replace the chosen site's/page's shared theme settings; explicit page and individual element overrides remain in place. Individual overrides use structural paths within their page, so select the element again if you later change its source HTML structure.

Headings wrap between whole words. Automatic hyphenation is disabled, and the preview/export presentation script reduces a heading only when its longest word cannot fit. This also runs after language, font, and viewport changes.

## Projects, pages, and templates

Use **+** beside Projects to start a personal portfolio, product/services page, or project story. Use **+ Page** to add a page to any project. The **Page content** panel edits headings, paragraphs, and cards, and lets you add, remove, and reorder sections. The introduction stays first so the page keeps one clear primary heading.

The existing portfolio and gallery retain their HTML, personal copy, language switch, and interactive controls. Their appearance is editable in the studio; their original text remains in `index.html`, `gallery.html`, and the translation files. New template pages have editable content and sections in the studio.

A page override starts as a copy of the shared site style. **Use site style on this page** removes that override. A site-wide edit leaves explicit page overrides intact; the editor explains when the current preview has one.

## Fonts and the style library

System fonts work immediately. **Add a font file** imports a local WOFF2, WOFF, TTF, or OTF file, up to 2 MB. Choose it separately for headings or body text. Imported fonts are stored with the project library and embedded in style/site exports. Font rendering can differ between operating systems unless you include a font file.

**Save current style** creates a reusable recipe. **Manage saved styles** removes recipes without changing sites already using those settings. **Manage local fonts** removes a font and switches styles using it to system sans; undo can restore it during the current session.

## Saving, backups, and moving computers

The library lives in `OfflineStyleStudio/data/library.json`. Rebuilding the app preserves this folder. An automatic `library.previous.json` records the preceding saved state. Keep the server stopped before restoring either file manually.

**Backup library** downloads projects, pages, custom recipes, and fonts as JSON. **Import** accepts a library backup, an exported project, or a style recipe. Imports create copies and preserve existing projects. If another editor window saves first, the app protects that state and asks you to back up your draft before reloading.

The application ZIP excludes your working data. To move your work, copy the entire `OfflineStyleStudio` folder including `data`, or import your JSON backup into a fresh app copy.

## Design checks and sensible limits

The editor uses shared tokens, explicit page overrides, clear labels, native dialogs, visible focus, undo, and responsive previews. Its contrast panel checks normal text, secondary text, cards, links, and button labels against a 4.5:1 target. The target follows [W3C's text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Modal naming and keyboard behavior follow the [WAI dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Custom colors remain available even if a pair needs review. A contrast result is one part of accessibility, so review the actual content, keyboard behavior, focus, and page order before publishing. All 50 palettes meet the normal-text contrast target for default foreground/background pairs. The contrast panel reports the page theme; it does not audit every combination of component overrides.

This is a focused visual system and section-based site builder. It does not import arbitrary HTML projects or expose unrestricted CSS editing. The JSON recipe and exported CSS provide a reusable starting point for other projects.

The library supports 30 projects, 16 pages per project, 100 individual element styles per page, 16 sections per page, 8 cards per section, 30 custom recipes, and 8 imported fonts. The server binds to the local loopback interface. Core editing, previews, saving, and export make no external network requests. Social links and email actions become available in exported sites and use the relevant app or connection.

## Source and verification

```sh
npm run build:offline
npm run start:studio
npm run test:studio
npm run package:offline
```

The source lives in `studio/`: the editor, reusable theme layer, schema and presets, HTML renderer, archive writer, and local server. `scripts/package-offline.cjs` creates the runnable package. Local app and data folders are excluded from Git. Public-site packaging remains separate.

The browser suite covers disconnected external networking, project persistence, site/page and individual element overrides, arrow wraparound and keyboard focus, independent palettes, history, section editing, safe text rendering, library imports, website exports, mobile controls, real font import/export/removal, and concurrent-save protection. It uses a separate test data folder and server port so it does not modify your working library.

See [STYLE-STUDIO-DESIGN.md](STYLE-STUDIO-DESIGN.md) for the interface plan and design principles.

## Verification of this version

- 21 browser and integration tests passed on this PC.
- All 50 page designs were checked for overflow and whole heading words at 1200 and 320 pixels on the portfolio, gallery, and a template site, including both English and Swedish portfolio headings.
- All 50 palettes passed the default text, secondary text, link, and action-label color-pair checks at 4.5:1 or higher.
- The original four recipes passed automated WCAG A/AA checks on the existing pages and a template site at 1200- and 320-pixel preview widths. Preset browsers were also audited on desktop, phone, and a 320-pixel editor viewport.
- The editor itself was checked at 320, 390, 768, 1024, and 1440 pixels without horizontal overflow.
- A fresh application ZIP was extracted and launched with its bundled runtime. Fifty-option browsing, element picking, styles, local saves, and exports worked while external network requests were blocked. Rebuilding preserved the working library's SHA-256 hash.
- The exported website ZIP passed an independent archive integrity check.
- A website export was separately extracted and launched with its own preview server. Its JavaScript module content type, whole-word fitting, and absence of external requests were verified at 320 pixels.

Current previews: [individual heading style](style-studio/studio-element-styles.png) and [whole words at phone width](style-studio/studio-whole-words.png). Earlier views of the original four designs and builder remain in `docs/style-studio/`.

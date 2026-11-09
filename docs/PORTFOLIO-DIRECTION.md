# Portfolio direction

This independent continuation of Tobernt/TailwindSite presents Tobias Berntsson to software engineering teams and satisfies the BCU26D portfolio checklist. The supplied Swedish and English CVs are the basis for employment dates, technologies, education, and project descriptions.

The selected design from the user's Style Studio export uses espresso backgrounds and a tan accent. The profile sits to the left of the engineering introduction on desktop; project cards follow in one column. The export's rectangular portrait frame, profile-facts, and project-section treatments are retained. The header uses one full-width surface with plain navigation links so it has no nested card frame or row of outlined pills. Employment titles and dates remain factual. No senior title, five-year software engineering claim, speculative performance metric, or unsupported technology is added.

## Visual tokens

- Canvas: `#211b17`; panels: `#322821`; borders: `#6d7c8e`.
- Main text: `#f0f3f8`; secondary text: `#b9c4d2`.
- Accent: tan `#e2bc9b`, with `#14212b` for labels on filled actions.
- Display: Bahnschrift / Arial Narrow; body and navigation: Arial / Helvetica. Local font fallbacks keep the site independent of font services.
- Shapes: 12-pixel panels, pill actions, 18-pixel fields, and the selected rectangular portrait. Saved overrides provide square profile facts and an 8-pixel project section. The full-width header has a single bottom divider and an unframed navigation container.
- Desktop: a profile-first introduction, stacked project cards, and distinct section panels within a 1280-pixel content width.
- Mobile: one column with a compact disclosure menu and full-width form controls.

## Structure

```text
Desktop                              Mobile
+----------------------------------+ +--------------------+
| Name      Navigation / language  | | Name          Menu |
+-----------+----------------------+ +--------------------+
| Portrait  | Engineering headline | | Engineering intro  |
| Facts     | Summary and actions  | | Links              |
+-----------+----------------------+ | Portrait and facts |
| Project                          | +--------------------+
| Project                          | | Projects (stacked) |
| Project / project                | | About / experience |
+----------------------------------+ | Education          |
| About / experience / education   | | Contact form       |
| Contact details and form         | +--------------------+
| Footer                           | | Footer             |
+----------------------------------+ +--------------------+
```

## Behavior and privacy

The owner's phone number and original CV PDFs are not published. The optional telephone input asks for the visitor's number, as required by the assignment. Contact form submission prepares an email link locally; the visitor opens and sends the draft in their own email app. No backend or contact-data storage is introduced. English and Swedish copy must retain form state and controls when switching languages.

The original repository's history and demonstration code are retained. The new repository receives explanatory commits for the profile, assignment requirements, publication setup, and verification evidence.

## Reproducing the selected design

`design-system/portfolio-project.json` records the selected colors, layouts, fonts, and two individual element overrides. `npm run apply:design` applies that saved recipe to the canonical homepage and gallery and copies the reusable presentation layer. The production build runs this step automatically. Applying another recipe in the local editor replaces the published presentation layer in previews and exports, so styles do not accumulate.

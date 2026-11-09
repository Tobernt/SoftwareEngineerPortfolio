# Portfolio direction

This independent continuation of Tobernt/TailwindSite presents Tobias Berntsson to software engineering teams and satisfies the BCU26D portfolio checklist. The supplied Swedish and English CVs are the basis for employment dates, technologies, education, and project descriptions.

The existing dark blue and emerald identity is retained. A large circular portrait and a concise engineering summary replace the generic UI gallery pitch in the first view. Projects describe the problem, implementation, and engineering focus; employment titles and dates remain factual. No senior title, five-year software engineering claim, speculative performance metric, or unsupported technology is added.

## Visual tokens

- Canvas: `#0c0d11`; panels: `#111827`; borders: `#334155`.
- Main text: `#f8fafc`; secondary text: `#cbd5e1`.
- Accents: blue `#93c5fd` and emerald `#6ee7b7`, used for links, focus, and the portrait frame.
- Display: Segoe UI Variable Display / Segoe UI; body: Segoe UI / system sans; technical labels: Consolas / system monospace. Local fonts keep the site independent of font services.
- Desktop: a two-column introduction, project grid, and aligned content sections.
- Mobile: one column with a compact disclosure menu and full-width form controls.

## Structure

```text
Desktop                                  Mobile
+------------------------------------+   +--------------------+
| Name      Projects Experience ... |   | Name          Menu |
+----------------------+-------------+   +--------------------+
| Software engineering |   Portrait  |   | Engineering intro  |
| Introduction + links |   (circle)  |   | Links              |
|                      | Aside facts|   | Portrait (circle)  |
+----------------------+-------------+   | Aside facts        |
| Project             | Project     |   +--------------------+
| Project             | Project     |   | Projects (stacked) |
+----------------------+-------------+   | About / experience |
| About / experience / education    |   | Education          |
+------------------------------------+   | Contact form       |
| Contact details | Contact form    |   +--------------------+
+------------------------------------+   | Footer             |
| Footer                             |   +--------------------+
+------------------------------------+
```

## Behavior and privacy

The owner's phone number and original CV PDFs are not published. The optional telephone input asks for the visitor's number, as required by the assignment. Contact form submission prepares an email link locally; the visitor opens and sends the draft in their own email app. No backend or contact-data storage is introduced. English and Swedish copy must retain form state and controls when switching languages.

The original repository's history and demonstration code are retained. The new repository receives explanatory commits for the profile, assignment requirements, publication setup, and verification evidence.

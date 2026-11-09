# Inlämningsuppgift 1 — Portfolio

Kurs: BCU26D, HTML & CSS. [Uppgiftsbeskrivning och kravlista](https://postmodernistx.github.io/bcu26d-musical-octo-disco/examination/02-inl-1.html).

Uppgiften tillåter både Tailwind och att återanvända en befintlig portfolio. Den här versionen utgår från TailwindSite och har anpassats till kravlistan och en tydligare profil inom systemutveckling.

Den valda designen från `website.zip` är applicerad på startsidan och galleriet. Kraven kontrollerades på produktionsbygget den 9 november 2026; [checklistans resultat](evidence/assignment-checklist.json) och aktuella granskningsbilder finns i repot. Startsidan har Lighthouse 100/100/100/100, båda sidorna har godkänd HTML-validering och startsidan har inga Firefox-fynd. Samtliga 10 portfoliotester och 21 editortester passerar.

## Krav och implementation

| Krav | Var det finns |
| --- | --- |
| Bild med alt-text, höjd och bredd | Porträttet i introduktionen; ramen följer den valda designen från Style Studio |
| Navigation/meny | Gemensam navigation på startsidan och i galleriet; mobilmeny med tangentbordsstöd |
| Huvudinnehåll i `main` | Båda HTML-sidorna |
| Minst tre projekt | Fyra projekt på startsidan, med beskrivning och teknik |
| Informativt `aside` | Porträtt, tekniskt fokus, ort och språk i introduktionen |
| Rubriker på tre nivåer | `h1` för introduktionen, `h2` för sektionerna och `h3` för projekt och roller |
| Extern länk | GitHub och LinkedIn |
| Mobil, tablet och desktop | Responsiva layouter; kontrollerade vid fem bredder och i båda språken |
| Fullständigt kontaktformulär | Namn, e-post, webbplats, telefon, dropdown, checkbox, textarea och submit-knapp |
| Egna kontaktuppgifter | E-postadress och LinkedIn |
| Sidfot | Statisk sidfot på båda sidorna |

Telefonfältet är besökarens valfria telefonnummer. Tobias personliga telefonnummer publiceras inte. Formuläret förbereder ett mejlutkast och kräver inget formulärsystem eller betalt abonnemang.

## Granskning och dokumentation

README innehåller faktiska granskningsresultat och skärmdumpar från Lighthouse, W3C Nu HTML Checker och Firefox Accessibility Inspector. Startsidan har inga Firefox-fynd. Galleriets kontroll av ett inbyggt range-fält ger ett dokumenterat Firefox-fynd; tangentbordsfunktionen har verifierats och resultatet finns med i underlaget. axe-kontrollerna passerar i engelska och svenska.

Mobil- och desktopskisser samt designbeslut finns i [PORTFOLIO-DIRECTION.md](PORTFOLIO-DIRECTION.md). HTML, JavaScript och CSS är indenterade; CSS byggs till en minifierad fil för publicering. GitHub Actions validerar, bygger, kör webbläsartester och publicerar till GitHub Pages.

## Lämna in på itslearning

Deadline enligt uppgiftssidan: **fredag 13 november 2026 kl. 16.00**.

- Kod: https://github.com/Tobernt/SoftwareEngineerPortfolio
- Live-sida: https://tobernt.github.io/SoftwareEngineerPortfolio/

Klistra in båda länkarna i inlämningsboxen. Repot är publikt. Själva inlämningen på itslearning görs separat.

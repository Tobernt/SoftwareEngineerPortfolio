import { portfolioCopy } from './portfolio-copy.js';

const translations = {
  en: {
    'nav.menu.button': 'Menu',
    'nav.menu.open': 'Open navigation menu',
    'nav.menu.close': 'Close navigation menu',
    'lang.toggle': 'Svenska',
    'lang.toggle.active': 'English',
    'toggle.on': 'On',
    'toggle.off': 'Off',
    'toggle.label.on': 'Enabled',
    'toggle.label.off': 'Disabled',
    'slider.value': '{value}%',
    'slider.aria': '{value} percent',
    'form.invalid': 'Check email and role before continuing.',
    'form.valid': 'All set! The form is ready to submit.',
    'copy.success': 'Copied to clipboard.',
    'copy.unsupported': 'Copying is not supported in this environment.',
    'contact.invalid': 'Fill in all fields to send.',
    'contact.success': 'Thanks! I will reply within 24h with a proposal.',
    'gradient.activate': 'Activate gradient',
    'gradient.deactivate': 'Close gradient',
  },
  sv: {
    'nav.menu.button': 'Meny',
    'nav.menu.open': 'Öppna menyn',
    'nav.menu.close': 'Stäng menyn',
    'lang.toggle': 'Svenska',
    'lang.toggle.active': 'English',
    'gallery.hero.eyebrow': 'Komponenter',
    'gallery.hero.title': 'UI-galleri',
    'gallery.hero.subtitle':
      'Responsiv grid med demos och kodexempel. Byggd för att enkelt hoppa tillbaka till startsidan.',
    'gallery.hero.cta': 'Tillbaka till projekt',
    'gallery.section.eyebrow': 'Designsystem',
    'gallery.section.title': 'Interaktiva komponenter',
    'gallery.section.subtitle':
      'Gridad översikt över återanvändbara UI-mönster med kort kodförklaring.',
    'gallery.section.cta': 'Tillbaka till projekt',
    'gallery.toggle.title': 'Smooth toggle',
    'gallery.toggle.tag': 'Interaktiv',
    'gallery.toggle.summary':
      'Animerad toggle med tydlig fokussignal, röstade etiketter och ARIA-stöd.',
    'gallery.toggle.hidden': 'Växla notiser',
    'gallery.toggle.note':
      'Använder <code class="text-emerald-300">aria-pressed</code> för att signalera läge.',
    'gallery.slider.title': 'Slider med live-värde',
    'gallery.slider.tag': 'Feedback',
    'gallery.slider.summary':
      'Reglaget uppdaterar värdet i realtid med <code class="text-emerald-300">aria-valuetext</code> och <code class="text-emerald-300">aria-live</code>.',
    'gallery.slider.label': 'Välj nivå',
    'gallery.gradient.title': 'Gradient CTA',
    'gallery.gradient.tag': 'Visuell',
    'gallery.gradient.summary':
      'Kallar fram en animerad gradient-bakgrund med tydlig kontrast och text som förklarar mönstret.',
    'gallery.gradient.body':
      'Gradienten är WCAG AA-testad mot text och aktiveras med knappen nedan.',
    'gallery.gradient.button': 'Aktivera gradient',
    'gallery.accordion.title': 'Accordion',
    'gallery.accordion.tag': 'Struktur',
    'gallery.accordion.summary':
      'Expanderbar panel som växlar höjd och uppdaterar <code class="text-emerald-300">aria-expanded</code>.',
    'gallery.accordion.button': 'Hur fungerar komponenten?',
    'gallery.accordion.copy':
      'Innehållet kollapsas via CSS-grid radhöjd och får automatiskt rätt semantik för skärmläsare.',
    'gallery.modal.title': 'Modal / lightbox',
    'gallery.modal.tag': 'Overlay',
    'gallery.modal.summary':
      'Öppnas via knapp, stängs med overlay, Escape eller knapp. Fokus låses i dialogen.',
    'gallery.modal.button': 'Visa modal',
    'gallery.modal.note':
      'Backdropen har <code class="text-emerald-300">role="dialog"</code> och <code class="text-emerald-300">aria-modal="true"</code>.',
    'gallery.modal.header': 'Lightbox',
    'gallery.modal.body': 'Här kan du lägga valfritt innehåll, t.ex. en bild eller en bekräftelse.',
    'gallery.modal.close': 'Stäng',
    'gallery.tabs.title': 'Tabs med tangentbord',
    'gallery.tabs.tag': 'Navigation',
    'gallery.tabs.summary':
      'Piltangenterna flyttar fokus mellan flikar; panelerna styrs med <code class="text-emerald-300">aria-controls</code>.',
    'gallery.tabs.result': 'Resultat',
    'gallery.tabs.code': 'Kod',
    'gallery.tabs.process': 'Process',
    'gallery.tabs.resultCopy':
      'Automatiserade regressionstester gav 12% fler features utan buggreports.',
    'gallery.tabs.codeCopy':
      'Komponenten använder <code class="text-emerald-300">dataset.tab</code> och enklare klasser från Tailwind.',
    'gallery.tabs.processCopy': 'Pairing-sessioner och lätta RFC:er höll intressenter i synk.',
    'gallery.form.title': 'Formulär med validering',
    'gallery.form.tag': 'Form',
    'gallery.form.summary':
      'Formuläret visar valideringsfeedback och stoppar skickning tills fälten är rätt.',
    'gallery.form.email': 'Arbets-e-post',
    'gallery.form.role': 'Roll',
    'gallery.form.placeholder': 'Välj roll',
    'gallery.form.developer': 'Utvecklare',
    'gallery.form.designer': 'Designer',
    'gallery.form.manager': 'Produkt/Projekt',
    'gallery.form.submit': 'Validera',
    'gallery.copy.title': 'Kopiera kodblock',
    'gallery.copy.tag': 'Produktivitet',
    'gallery.copy.summary': 'Kopieringsknappen hämtar kodinnehåll och bekräftar för användaren.',
    'gallery.copy.label': 'API-klient',
    'gallery.copy.button': 'Kopiera kod',
    'gallery.contact.title': 'Kontaktkort',
    'gallery.contact.tag': 'CTA',
    'gallery.contact.summary':
      'Interaktivt kontaktkort som speglar sajtens formulär utan att spara data.',
    'gallery.contact.name': 'Tobias Berntsson',
    'gallery.contact.role': 'Fullstackutvecklare & lärare',
    'gallery.contact.badge': 'Svar inom 24h',
    'gallery.contact.email': 'E-post',
    'gallery.contact.topic': 'Ämne',
    'gallery.contact.placeholder': 'Välj',
    'gallery.contact.workshop': 'Workshop',
    'gallery.contact.proposal': 'Förslag',
    'gallery.contact.support': 'Support',
    'gallery.contact.submit': 'Skicka förfrågan',
    'footer.title': 'Tobias Berntsson Portfolio',
    'footer.subtitle':
      'Tailwind Portfolio. Byggd med fokus på tydlighet, responsivitet och tillgänglighet.',
    'slider.value': '{value}%',
    'slider.aria': '{value} procent',
    'form.invalid': 'Kontrollera e-post och roll innan du fortsätter.',
    'form.valid': 'Allt ser bra ut! Formuläret är redo att skickas.',
    'copy.success': 'Kopierat till urklipp.',
    'copy.unsupported': 'Kopiering stöds inte i denna miljö.',
    'contact.invalid': 'Fyll i alla fält för att skicka.',
    'contact.success': 'Tack! Jag återkommer inom 24h med ett förslag.',
    'gradient.activate': 'Aktivera gradient',
    'gradient.deactivate': 'Stäng gradient',
    'toggle.on': 'På',
    'toggle.off': 'Av',
    'toggle.label.on': 'Aktiverad',
    'toggle.label.off': 'Inaktiverad',
  },
};

for (const language of ['en', 'sv']) {
  Object.assign(translations[language], portfolioCopy[language]);
}

let currentLanguage = 'en';

function translate(key, lang = currentLanguage) {
  return translations[lang]?.[key] ?? translations.en[key];
}

function format(key, replacements = {}, lang = currentLanguage) {
  const template = translate(key, lang);
  if (!template) return template;
  return template.replace(/\{(\w+)\}/g, (_, token) => replacements[token] ?? `{${token}}`);
}

function setContent(element, content) {
  if (content == null) return;
  element.innerHTML = content;
}

function applyLanguage(lang = 'en') {
  currentLanguage = lang === 'sv' ? 'sv' : 'en';
  document.documentElement.lang = currentLanguage === 'sv' ? 'sv' : 'en';

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    if (!element.dataset.i18nOriginal) {
      element.dataset.i18nOriginal = element.innerHTML;
    }

    const key = element.dataset.i18n;
    const translated = currentLanguage === 'sv' ? translate(key) : null;
    setContent(element, translated ?? element.dataset.i18nOriginal);
  });

  document.querySelectorAll('[data-i18n-alt], [data-i18n-aria]').forEach((element) => {
    if (element.dataset.i18nAlt) element.alt = translate(element.dataset.i18nAlt);
    if (element.dataset.i18nAria)
      element.setAttribute('aria-label', translate(element.dataset.i18nAria));
  });

  updateLanguageToggles();
  try {
    localStorage.setItem('preferred-lang', currentLanguage);
  } catch (error) {
    console.warn('Unable to store language preference', error);
  }

  document.dispatchEvent(
    new CustomEvent('i18n:languagechange', {
      detail: { lang: currentLanguage },
    }),
  );
}

function updateLanguageToggles() {
  const activeKey = currentLanguage === 'sv' ? 'lang.toggle.active' : 'lang.toggle';
  const label =
    translate(activeKey, currentLanguage) ?? (currentLanguage === 'sv' ? 'English' : 'Svenska');

  document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
    button.textContent = label;
    button.setAttribute('aria-pressed', currentLanguage === 'sv' ? 'true' : 'false');
  });
}

function initLanguage() {
  const stored = (() => {
    try {
      return localStorage.getItem('preferred-lang');
    } catch (error) {
      console.warn('Unable to read language preference', error);
      return null;
    }
  })();

  applyLanguage(stored === 'sv' ? 'sv' : 'en');
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-lang-toggle]');
    if (!toggle) return;
    applyLanguage(currentLanguage === 'sv' ? 'en' : 'sv');
  });
}

document.addEventListener('DOMContentLoaded', initLanguage);

export { applyLanguage, format, getCurrentLanguage, translate };

function getCurrentLanguage() {
  return currentLanguage;
}

if (!window.i18n) {
  window.i18n = { applyLanguage, format, getCurrentLanguage, translate };
}

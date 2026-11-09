import { getCurrentLanguage, translate } from './i18n.js';

function initNavigation() {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('[data-menu-toggle]');
  const panel = header?.querySelector('[data-menu-panel]');
  if (!header || !toggle || !panel) return;
  const desktop = window.matchMedia('(min-width: 1024px)');
  header.classList.add('is-enhanced');
  toggle.hidden = false;
  const setOpen = (open, returnFocus = false) => {
    const expanded = open && !desktop.matches;
    panel.classList.toggle('is-open', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', translate(expanded ? 'nav.menu.close' : 'nav.menu.open'));
    if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true')
      setOpen(false, true);
  });
  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setOpen(false);
      const target = link.hash && document.querySelector(link.hash);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });
  desktop.addEventListener('change', () => setOpen(false));
  document.addEventListener('i18n:languagechange', () =>
    setOpen(toggle.getAttribute('aria-expanded') === 'true'),
  );
  document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
    button.hidden = false;
    button.setAttribute('aria-pressed', String(getCurrentLanguage() === 'sv'));
  });
  setOpen(false);
}

document.addEventListener('DOMContentLoaded', initNavigation);

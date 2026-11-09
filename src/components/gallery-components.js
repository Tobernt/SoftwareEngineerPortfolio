function getTranslator() {
  const translate = (key) => window.i18n?.translate(key) ?? key;
  const format = (key, replacements = {}) =>
    window.i18n?.format(key, replacements) ?? translate(key);
  return { format, translate };
}

function initToggle() {
  const toggle = document.querySelector('[data-toggle]');
  if (!toggle) return;

  const knob = toggle.querySelector('[data-toggle-knob]');
  const offLabel = document.querySelector('[data-toggle-label-off]');
  const onLabel = document.querySelector('[data-toggle-label-on]');
  const { translate } = getTranslator();

  const updateState = (isOn) => {
    toggle.setAttribute('aria-pressed', String(isOn));
    toggle.classList.toggle('bg-emerald-500/20', isOn);
    toggle.classList.toggle('border-emerald-300', isOn);
    knob?.classList.toggle('translate-x-[4.5rem]', isOn);
    knob?.classList.toggle('bg-emerald-300', isOn);
    knob?.classList.toggle('text-neutral-900', isOn);
    if (knob) {
      knob.textContent = translate(isOn ? 'toggle.on' : 'toggle.off');
    }
    onLabel?.classList.toggle('text-emerald-300', isOn);
    onLabel?.classList.toggle('text-neutral-500', !isOn);
    offLabel?.classList.toggle('text-emerald-300', !isOn);
    offLabel?.classList.toggle('text-neutral-500', isOn);
    if (onLabel) {
      onLabel.textContent = translate('toggle.label.on');
    }
    if (offLabel) {
      offLabel.textContent = translate('toggle.label.off');
    }
  };

  updateState(toggle.getAttribute('aria-pressed') === 'true');

  toggle.addEventListener('click', () => {
    const isOn = toggle.getAttribute('aria-pressed') === 'true';
    updateState(!isOn);
  });

  document.addEventListener('i18n:languagechange', () => {
    const isOn = toggle.getAttribute('aria-pressed') === 'true';
    updateState(isOn);
  });
}

function initSlider() {
  // The native range provides Arrow/Home/End keyboard handling. Firefox 159's
  // inspector flags its empty accessibility action list; the recorded Firefox
  // keyboard check confirms ArrowRight changes 45 to 50. Keep native semantics.
  const slider = document.querySelector('[data-slider]');
  const output = document.querySelector('[data-slider-value]');
  if (!slider || !output) return;

  const { format, translate } = getTranslator();

  const sync = () => {
    const value = slider.value;
    output.textContent = format('slider.value', { value });
    slider.setAttribute('aria-valuetext', format('slider.aria', { value }));
    slider.setAttribute(
      'aria-label',
      translate('gallery.slider.label') ?? slider.getAttribute('aria-label'),
    );
  };

  slider.addEventListener('input', sync);
  sync();

  document.addEventListener('i18n:languagechange', sync);
}

function initAccordion() {
  const button = document.querySelector('[data-accordion-button]');
  const panel = document.querySelector('[data-accordion-panel]');
  if (!button || !panel) return;

  const toggleAccordion = () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    const next = !expanded;
    button.setAttribute('aria-expanded', String(next));
    panel.classList.toggle('grid-rows-[0fr]', !next);
    panel.classList.toggle('grid-rows-[1fr]', next);
    panel.setAttribute('aria-hidden', String(!next));
  };

  button.addEventListener('click', toggleAccordion);
}

function initGradient() {
  const toggle = document.querySelector('[data-gradient-toggle]');
  const card = document.querySelector('[data-gradient-card]');
  if (!toggle || !card) return;

  const { translate } = getTranslator();

  const gradientClasses = [
    'bg-gradient-to-r',
    'from-emerald-500/15',
    'via-blue-500/15',
    'to-purple-500/15',
    'border-emerald-400/60',
    'shadow-glow-blue',
    'animate-shimmer',
  ];

  const updateState = (isActive) => {
    toggle.setAttribute('aria-pressed', String(isActive));
    toggle.textContent = translate(isActive ? 'gradient.deactivate' : 'gradient.activate');
    card.classList.toggle('bg-neutral-900/70', !isActive);
    gradientClasses.forEach((cls) => card.classList.toggle(cls, isActive));
  };

  toggle.addEventListener('click', () => {
    const active = toggle.getAttribute('aria-pressed') === 'true';
    updateState(!active);
  });

  updateState(false);

  document.addEventListener('i18n:languagechange', () => {
    const active = toggle.getAttribute('aria-pressed') === 'true';
    updateState(active);
  });
}

function initModal() {
  const openBtn = document.querySelector('[data-open-modal]');
  const closeBtn = document.querySelector('[data-close-modal]');
  const overlay = document.querySelector('[data-modal-overlay]');
  const dialog = document.querySelector('[data-modal-dialog]');
  if (!openBtn || !closeBtn || !overlay || !dialog) return;

  let lastFocused = null;
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dialogStart = { x: 0, y: 0 };
  let scrollPosition = 0;
  const body = document.body;
  const dragHandle = dialog.querySelector('[data-modal-drag-handle]') || dialog;

  const focusableSelectors = ['a[href]', 'button:not([disabled])', 'textarea', 'input', 'select'];

  const getFocusable = () => Array.from(dialog.querySelectorAll(focusableSelectors.join(',')));

  const setInitialPosition = () => {
    const overlayRect = overlay.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    dialog.style.position = 'absolute';
    dialog.style.left = `${Math.max((overlayRect.width - dialogRect.width) / 2, 0)}px`;
    dialog.style.top = `${Math.max((overlayRect.height - dialogRect.height) / 2, 0)}px`;
  };

  const trapFocus = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const closeModal = () => {
    overlay.classList.add('hidden');
    dialog.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleKeydown);
    stopDragging();
    body.style.overflow = '';
    body.style.position = '';
    body.style.width = '';
    body.style.top = '';
    body.style.touchAction = '';
    window.scrollTo(0, scrollPosition);
    lastFocused?.focus();
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    } else {
      trapFocus(event);
    }
  };

  const openModal = () => {
    lastFocused = document.activeElement;
    scrollPosition = window.scrollY;
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.top = `-${scrollPosition}px`;
    body.style.touchAction = 'none';
    overlay.classList.remove('hidden');
    dialog.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
    requestAnimationFrame(setInitialPosition);
    document.addEventListener('keydown', handleKeydown);
  };

  const stopDragging = () => {
    isDragging = false;
    document.removeEventListener('pointermove', handleDrag);
    document.removeEventListener('pointerup', stopDragging);
  };

  const handleDrag = (event) => {
    if (!isDragging) return;
    const overlayRect = overlay.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const nextLeft = Math.min(
      Math.max(dialogStart.x + (event.clientX - dragStart.x), 0),
      overlayRect.width - dialogRect.width,
    );
    const nextTop = Math.min(
      Math.max(dialogStart.y + (event.clientY - dragStart.y), 0),
      overlayRect.height - dialogRect.height,
    );
    dialog.style.left = `${nextLeft}px`;
    dialog.style.top = `${nextTop}px`;
  };

  const startDragging = (event) => {
    isDragging = true;
    dragStart = { x: event.clientX, y: event.clientY };
    const dialogRect = dialog.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    dialogStart = {
      x: dialogRect.left - overlayRect.left,
      y: dialogRect.top - overlayRect.top,
    };
    document.addEventListener('pointermove', handleDrag);
    document.addEventListener('pointerup', stopDragging);
    event.preventDefault();
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  dragHandle.addEventListener('pointerdown', startDragging, { passive: false });
  overlay.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
}

function initTabs() {
  const tabList = document.querySelector('[data-tab-list]');
  if (!tabList) return;

  const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[data-tab-panel]'));

  const setActive = (id) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      tab.classList.toggle('bg-neutral-800/70', isActive);
      tab.classList.toggle('border-emerald-400/60', isActive);
    });

    panels.forEach((panel) => {
      const shouldShow = panel.id === `tab-${id}`;
      panel.classList.toggle('hidden', !shouldShow);
      panel.setAttribute('aria-hidden', String(!shouldShow));
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActive(tab.dataset.tab));
  });

  tabList.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    if (event.key === 'Home') {
      tabs[0].focus();
      setActive(tabs[0].dataset.tab);
      return;
    }

    if (event.key === 'End') {
      const last = tabs[tabs.length - 1];
      last.focus();
      setActive(last.dataset.tab);
      return;
    }

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    setActive(tabs[nextIndex].dataset.tab);
  });

  setActive('one');
}

function validateField(field) {
  const isValid = field.checkValidity();
  field.classList.toggle('border-red-500', !isValid);
  field.classList.toggle('border-neutral-700', isValid);
  return isValid;
}

function initDemoForm() {
  const form = document.querySelector('[data-demo-form]');
  const feedback = form?.querySelector('[data-form-feedback]');
  if (!form || !feedback) return;

  const { translate } = getTranslator();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Array.from(form.querySelectorAll('input, select'));
    const allValid = fields.every((field) => validateField(field));

    if (!allValid) {
      feedback.textContent = translate('form.invalid');
      feedback.classList.add('text-amber-300');
      feedback.classList.remove('text-emerald-200');
      fields.find((f) => !f.checkValidity())?.focus();
      return;
    }

    feedback.textContent = translate('form.valid');
    feedback.classList.add('text-emerald-200');
    feedback.classList.remove('text-amber-300');
  });

  document.addEventListener('i18n:languagechange', () => {
    const invalidField = form.querySelector('.border-red-500');
    if (invalidField) {
      feedback.textContent = translate('form.invalid');
      feedback.classList.add('text-amber-300');
      feedback.classList.remove('text-emerald-200');
    }
  });
}

function initCopyCode() {
  const copyButtons = document.querySelectorAll('[data-copy-code]');
  if (!copyButtons.length) return;

  const { translate } = getTranslator();

  copyButtons.forEach((button) => {
    const targetId = button.dataset.codeTarget;
    const status = document.querySelector('[data-copy-status]');
    const target = document.getElementById(targetId);
    if (!target || !status) return;

    button.addEventListener('click', async () => {
      const text = target.textContent || '';
      if (!text.trim()) return;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        status.textContent = translate('copy.success');
      } else {
        status.textContent = translate('copy.unsupported');
      }
    });
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.querySelector('[data-form-status]');
  if (!form || !status) return;

  const { translate } = getTranslator();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Array.from(form.querySelectorAll('input, textarea'));
    const allValid = fields.every((field) => validateField(field));

    if (!allValid) {
      status.textContent = translate('contact.invalid');
      status.classList.add('text-amber-300');
      status.classList.remove('text-emerald-200');
      fields.find((f) => !f.checkValidity())?.focus();
      return;
    }

    status.textContent = translate('contact.success');
    status.classList.add('text-emerald-200');
    status.classList.remove('text-amber-300');
  });

  document.addEventListener('i18n:languagechange', () => {
    status.textContent = '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initToggle();
  initSlider();
  initAccordion();
  initGradient();
  initModal();
  initTabs();
  initDemoForm();
  initCopyCode();
  initContactForm();
});

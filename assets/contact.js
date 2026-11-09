import { translate } from './i18n.js';

function initContactForm() {
  const form = document.getElementById('contact-form');
  const draft = document.getElementById('contact-draft');
  const status = document.getElementById('contact-status');
  if (!form || !draft || !status) return;
  const resetDraft = () => {
    draft.hidden = true;
    draft.removeAttribute('href');
    status.textContent = '';
  };
  const prepareDraft = () => {
    const data = new FormData(form);
    const value = (key) => String(data.get(key) || '').trim();
    const topic = form.elements.topic.selectedOptions[0].textContent;
    const lines = [
      `${translate('contact.draftName')}: ${value('name')}`,
      `${translate('contact.draftEmail')}: ${value('email')}`,
      `${translate('contact.draftTopic')}: ${topic}`,
    ];
    if (value('website')) lines.push(`${translate('contact.draftWebsite')}: ${value('website')}`);
    if (value('phone')) lines.push(`${translate('contact.draftPhone')}: ${value('phone')}`);
    lines.push(translate('contact.draftPermission'), '', value('message'));
    const subject = `${translate('contact.subject')}: ${topic}`;
    draft.href = `mailto:tobias_berntsson@hotmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    draft.hidden = false;
    status.textContent = translate('contact.ready');
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Native validation keeps this independent of external form services.
    if (form.reportValidity()) prepareDraft();
  });
  form.addEventListener('input', resetDraft);
  form.addEventListener('change', resetDraft);
  document.addEventListener('i18n:languagechange', () => {
    if (!draft.hidden) prepareDraft();
  });
}

document.addEventListener('DOMContentLoaded', initContactForm);

// Static pages only need the shared language switcher and header, plus copy buttons.
import { t } from './i18n.js';
for (const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click', async () => {
  const status = button.closest('div').nextElementSibling;
  try {await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).value);status.textContent = button.dataset.copied;}
  catch {status.textContent = t('copyBlocked');}
});

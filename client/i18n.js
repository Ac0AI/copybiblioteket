import { message, pagePath } from './messages.js';
export let language = document.documentElement.lang === 'en' ? 'en' : 'sv';
export const t = (key, values) => message(key, language, values);
export const route = path => pagePath(path, language);
export const apiPath = (path, locale = language) => path + (path.includes('?') ? '&' : '?') + 'lang=' + locale;
const listeners = [];
export const onLanguageChange = callback => listeners.push(callback);
export function applyLanguage() {
  document.documentElement.lang = language;
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const attr of ['placeholder','aria-label','content']) {
    for (const node of document.querySelectorAll(`[data-i18n-${attr}]`)) node.setAttribute(attr, t(node.getAttribute(`data-i18n-${attr}`)));
  }
  for (const node of document.querySelectorAll('[data-route]')) node.href = route(node.dataset.route);
  const path = location.pathname.replace(/^\/en(?=\/|$)/,'') || '/';
  const canonical = document.querySelector('[rel="canonical"]');
  if (canonical) canonical.href = 'https://sigge.si' + route(path);
  const ogUrl=document.querySelector('[property="og:url"]');if(ogUrl)ogUrl.content='https://sigge.si'+route(path);
  for (const node of document.querySelectorAll('[data-language]')) {
    const active = node.dataset.language === language;
    node.setAttribute('aria-current', active ? 'true' : 'false');
    node.href = pagePath(path,node.dataset.language) + location.search + location.hash;
  }
}
function changeLanguage(next, updateUrl = true) {
  if (next === language) return;
  const previous = language;
  language = next;
  if (updateUrl) {
    const path = location.pathname.replace(/^\/en(?=\/|$)/,'') || '/';
    history.pushState(null,'',pagePath(path,language) + location.search + location.hash);
  }
  applyLanguage();
  for (const listener of listeners) listener(previous);
}
for (const link of document.querySelectorAll('[data-language]')) link.addEventListener('click',event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  changeLanguage(link.dataset.language);
});
window.addEventListener('popstate',() => changeLanguage(/^\/en(?:\/|$)/.test(location.pathname) ? 'en' : 'sv',false));
applyLanguage();
// The sticky header gets a hairline once the page scrolls under it.
const topbar = document.querySelector('.topbar');
if (topbar) {const mark = () => topbar.classList.toggle('is-scrolled', scrollY > 8);addEventListener('scroll', mark, {passive:true});mark();}
// On narrow screens the navigation scrolls sideways; keep the current page in view.
const currentLink = document.querySelector('.topbar nav [aria-current]');
if (currentLink) {const nav = currentLink.parentElement;nav.scrollLeft = Math.max(0, currentLink.offsetLeft - nav.clientWidth / 2 + currentLink.clientWidth / 2);}

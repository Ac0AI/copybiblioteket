// Server-rendered pages for every person and framework, so each can be found, shared and indexed.
import { message, pagePath } from '../client/messages.js';

const SITE = 'https://sigge.si';
export const esc = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const t = (key, language, values) => message(key, language, values);
const url = (path, language) => SITE + pagePath(path, language);
// Swedish genitive: no extra s after s, x or z ("Ross Jenkins perspektiv").
export const genitive = (name, language) => language === 'en' ? name + '’s' : /[sxz]$/i.test(name) ? name : name + 's';
export function clip(text, max = 158) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(' ', max - 1)).replace(/[,;:–—-]$/, '') + '…';
}
const sentence = text => /[.!?…]$/.test(text.trim()) ? text.trim() : text.trim() + '.';
const list = items => `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
const external = (title, href) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>`;
const jsonLd = data => JSON.stringify(data).replaceAll('<', '\\u003c');
const alternates = path => ['sv','en'].map(l => `<link rel="alternate" hreflang="${l}" href="${url(path, l)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${url(path, 'sv')}">`;
function crumbs(items, language) {
  const html = items.map(([label, path], i) => i === items.length - 1 ? `<span aria-current="page">${esc(label)}</span>` : `<a href="${pagePath(path, language)}">${esc(label)}</a>`).join('<span aria-hidden="true">/</span>');
  const ld = {'@type':'BreadcrumbList', itemListElement: items.map(([label, path], i) => ({'@type':'ListItem', position: i + 1, name: label, item: url(path, language)}))};
  return {html: `<nav class="crumbs" aria-label="${esc(t('breadcrumbs', language))}">${html}</nav>`, ld};
}
const profileHosts = /(^|\.)(x\.com|twitter\.com|linkedin\.com|youtube\.com|instagram\.com|wikipedia\.org)$/;

export function personPage(person, language, {library, portraits, frameworkFor}) {
  const path = '/people/' + person.id, photo = portraits[person.id], category = t(person.category, language);
  const image = photo && photo.kind !== 'avatar' ? SITE + photo.src : null;
  const title = `${person.name} – ${person.summary.replace(/\.$/, '')} | Sigge`;
  const description = clip(`${sentence(person.summary)} ${t('personMeta', language, {name: genitive(person.name, language)})}`);
  const trail = crumbs([[t('home', language).split(',')[0], '/'], [t('people', language), '/people'], [person.name, path]], language);
  const related = library.people.filter(p => p.category === person.category && p.id !== person.id).slice(0, 6);
  const frameworks = frameworkFor(person, language);
  const portrait = photo ? `<img src="${esc(photo.src)}" width="${photo.width}" height="${photo.height}" alt="${esc(t('portraitAlt', language, {name: person.name}))}" fetchpriority="high">` : '';
  const credit = photo ? `<p class="entry-credit">${external(t('portraitSource', language), photo.sourceUrl)}${photo.license ? ` · ${esc(photo.credit)} · ${external(photo.license, photo.licenseUrl)}` : ` · ${esc(t('portraitVia', language))} The Brains`}</p>` : '';
  const content = `${trail.html}
<header class="entry-head person-head"><div class="entry-portrait${photo?.kind === 'avatar' ? ' is-avatar' : ''}">${portrait}</div><div>
<p class="eyebrow">${esc(t('perspectiveLabel', language))} · ${esc(category)}</p><h1 class="display">${esc(person.name)}</h1><p class="lead">${esc(sentence(person.summary))}</p>
<ul class="entry-topics" aria-label="${esc(t('topicsLabel', language))}">${person.topics.map(topic => `<li>${esc(topic)}</li>`).join('')}</ul>
<div class="entry-actions"><a class="button primary" href="${pagePath('/', language)}?perspective=${encodeURIComponent(person.id)}#workshop">${esc(t('usePerson', language))}</a><button class="button outlined" type="button" data-copy="perspective-text" data-copied="${esc(t('personCopied', language))}">${esc(t('copyPerson', language))}</button></div><p class="entry-status" role="status" aria-live="polite"></p><textarea id="perspective-text" hidden>${esc([person.name + ' — ' + person.summary, t('sourceNote', language), ...person.principles, t('questions', language) + ':', ...person.questions, t('inheritedSources', language) + ':', ...person.sources.map(s => s.title + '\n' + s.url), t('personPrompt', language)].join('\n\n'))}</textarea>${credit}</div></header>
<section class="entry-section"><h2>${esc(t('howToUse', language, {name: genitive(person.name, language)}))}</h2>${list(person.principles)}<p class="entry-note">${esc(t('ownApplicationsNote', language))}</p></section>
<section class="entry-section"><h2>${esc(t('questions', language))}</h2>${list(person.questions)}</section>
<section class="entry-section"><h2>${esc(t('inheritedSources', language))}</h2><ul class="entry-sources">${person.sources.map(s => `<li>${external(s.title, s.url)}</li>`).join('')}</ul><p class="entry-note">${esc(t('sourceNote', language))}</p></section>
${frameworks.length ? `<section class="entry-section"><h2>${esc(t('pairsWith', language))}</h2><div class="entry-cards">${frameworks.map(f => `<a class="entry-card" href="${pagePath('/library/' + f.id, language)}"><small>${esc(f.author)} · ${esc(t(f.category, language))}</small><strong>${esc(f.title)}</strong><span>${esc(clip(f.summary, 120))}</span></a>`).join('')}</div></section>` : ''}
<section class="entry-section"><h2>${esc(t('morePerspectives', language, {category}))}</h2><p class="entry-intro">${esc(t('categoryIntro' + person.category, language))}</p><div class="entry-people">${related.map(p => `<a class="entry-person" href="${pagePath('/people/' + p.id, language)}">${portraits[p.id] && portraits[p.id].kind !== 'avatar' ? `<img src="${esc(portraits[p.id].src)}" alt="" width="48" height="48" loading="lazy">` : '<span aria-hidden="true"></span>'}<strong>${esc(p.name)}</strong><small>${esc(p.summary)}</small></a>`).join('')}</div></section>
<aside class="entry-aside"><p>${esc(t('profileNotice', language))}</p></aside>`;
  const sameAs = photo && profileHosts.test(new URL(photo.sourceUrl).hostname) ? [photo.sourceUrl] : [];
  const ld = {'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':url(path, language),url:url(path, language),name:title,description,inLanguage:language,isPartOf:{'@type':'WebSite',name:'Sigge',url:SITE + '/'},
      about:{'@type':'Person',name:person.name,...(image ? {image} : {}),...(sameAs.length ? {sameAs} : {})},...(image ? {primaryImageOfPage:image} : {})},
    trail.ld]};
  return {path, nav:'/people', title, description, image, type:'profile', content, jsonld:jsonLd(ld)};
}

export function frameworkPage(framework, language, {library, people}) {
  const path = '/library/' + framework.id, category = t(framework.category, language);
  const title = `${framework.title} – ${framework.author} | Sigge`;
  const description = clip(framework.summary);
  const trail = crumbs([[t('home', language).split(',')[0], '/'], [t('frameworks', language), '/library'], [framework.title, path]], language);
  const person = people.find(p => framework.author.includes(p.name));
  const others = library.frameworks.filter(f => f.id !== framework.id);
  const e = framework.example;
  const content = `${trail.html}
<header class="entry-head"><div><p class="eyebrow">${esc(framework.author)} · ${esc(category)}</p><h1 class="display">${esc(framework.title)}</h1><p class="lead">${esc(framework.summary)}</p>
<div class="entry-actions"><a class="button primary" href="${pagePath('/', language)}#workshop">${esc(t('useInWorkshop', language))}</a><a class="button outlined" href="${pagePath('/library', language)}#${framework.id}">${esc(t('openInLibrary', language))}</a>${person ? `<a class="button subtle" href="${pagePath('/people/' + person.id, language)}">${esc(t('authorAsPerspective', language, {name: person.name}))}</a>` : ''}</div></div></header>
<div class="entry-context"><section><h2>${esc(t('useWhen', language))}</h2><p>${esc(framework.useWhen)}</p></section><section><h2>${esc(t('avoidWhen', language))}</h2><p>${esc(framework.avoidWhen)}</p></section></div>
<section class="entry-section"><h2>${esc(t('apply', language))}</h2>${list(framework.principles)}</section>
<section class="entry-section"><h2>${esc(t('questions', language))}</h2>${list(framework.questions)}</section>
<section class="entry-example"><h2>${esc(t('exampleHeading', language))}</h2><p class="entry-note">${esc(e.context)}</p><div class="entry-rewrite"><div><p class="example-label">${esc(t('draftLabel', language))}</p><blockquote class="is-before">${esc(e.before)}</blockquote></div><div><p class="example-label">${esc(t('revised', language))}</p><blockquote>${esc(e.after)}</blockquote></div></div><p class="entry-note">${esc(e.explanation)}</p></section>
<section class="entry-section"><h2>${esc(t('sources', language))}</h2><ul class="entry-sources">${framework.sources.map(s => `<li>${external(s.title, s.url)}</li>`).join('')}</ul><p class="entry-note">${esc(t('exampleNotice', language))}</p></section>
<section class="entry-section"><h2>${esc(t('moreFrameworks', language))}</h2><div class="entry-cards">${others.map(f => `<a class="entry-card" href="${pagePath('/library/' + f.id, language)}"><small>${esc(f.author)}</small><strong>${esc(f.title)}</strong></a>`).join('')}</div></section>`;
  const ld = {'@context':'https://schema.org','@graph':[
    {'@type':'Article','@id':url(path, language),url:url(path, language),headline:framework.title,description,inLanguage:language,
      author:{'@type':'Organization',name:'Sigge',url:SITE + '/'},publisher:{'@type':'Organization',name:'AC0 AI SLU'},
      about:{'@type':'Person',name:framework.author},isPartOf:{'@type':'WebSite',name:'Sigge',url:SITE + '/'},
      citation:framework.sources.map(s => s.url),dateModified:framework.sources.map(s => s.checked).sort().at(-1)},
    trail.ld]};
  return {path, nav:'/library', title, description, image:null, type:'article', content, jsonld:jsonLd(ld)};
}

export function sitemap(paths) {
  const entries = paths.map(path => `<url><loc>${url(path, 'sv')}</loc>${['sv','en'].map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${url(path, l)}"/>`).join('')}</url>` +
    `<url><loc>${url(path, 'en')}</loc>${['sv','en'].map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${url(path, l)}"/>`).join('')}</url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`;
}
export { alternates };

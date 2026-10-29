import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { message, pagePath } from '../client/messages.js';
import { loadCopyLibrary } from '../copy/library.ts';
import { personPage, frameworkPage, sitemap, alternates, esc } from './seo-pages.mjs';
const header = await readFile('client/pages/_header.html','utf8');
const footer = await readFile('client/pages/_footer.html','utf8');
const mascot = (await readFile('client/pages/_mascot.html','utf8')).trim();
const filmConnect = (await readFile('client/pages/_film-connect.html','utf8')).trim();
const entryTemplate = await readFile('client/pages/entry.html','utf8');
const portraits = JSON.parse(await readFile('data/portraits.json','utf8'));
const escape = esc;

// Shared header, footer and localisation for every generated page.
function render(html, language, path, nav) {
  html = html.replace('{{header}}',()=>header.replace(`data-nav="${nav}"`,`data-nav="${nav}" aria-current="page"`)).replace('{{footer}}',()=>footer).replace('{{filmConnect}}',()=>filmConnect).replaceAll('{{mascot}}',()=>mascot);
  html = html.replaceAll('{{language}}',language).replaceAll('{{canonical}}','https://sigge.si'+pagePath(path,language));
  // Only empty, explicitly marked text nodes and attributes are localised.
  html = html.replace(/(<([a-z][a-z0-9]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)\s*(<\/\2>)/g, (_,open,_tag,key,close) => open + escape(message(key,language)) + close);
  html = html.replace(/<[^>]+data-i18n-(?:placeholder|aria-label|content)="[^"]+"[^>]*>/g, tag => {
    for (const [,attribute,key] of tag.matchAll(/data-i18n-(placeholder|aria-label|content)="([^"]+)"/g)) {
      const value = escape(message(key,language));
      const existing = new RegExp(`(?<![\\w-])${attribute}="[^"]*"`);
      tag = existing.test(tag) ? tag.replace(existing,`${attribute}="${value}"`) : tag.replace(/>$/,` ${attribute}="${value}">`);
    }
    return tag;
  });
  html = html.replace(/<a\b([^>]*\bdata-route="([^"]+)"[^>]*)>/g, (_,attrs,route) => `<a${attrs} href="${pagePath(route,language)}">`);
  html = html.replace(/<a\b([^>]*\bdata-language="(sv|en)"[^>]*)>/g, (_,attrs,locale) => `<a${attrs} href="${pagePath(path,locale)}" aria-current="${language === locale}">`);
  if (/\{\{/.test(html)) throw new Error('Unresolved page token: '+path);
  return html;
}

for (const language of ['sv','en']) {
  const directory = 'public' + (language === 'en' ? '/en' : '');
  await mkdir(directory,{recursive:true});
  for (const page of ['index','library','people','connect','consent','privacy']) {
    const path = page === 'index' ? '/' : '/' + page;
    await writeFile(`${directory}/${page}.html`,render(await readFile(`client/pages/${page}.html`,'utf8'),language,path,page === 'consent' ? '/connect' : path));
  }
}

// One indexable page per person and framework, in both languages. Output folders are named
// differently from the routes (/people/:id, /library/:id) so static hosting never shadows /people.
const sv = await loadCopyLibrary(undefined,false);
const paths = ['/','/connect','/library','/people','/privacy'];
for (const language of ['sv','en']) {
  const library = sv.forLanguage(language), base = 'public' + (language === 'en' ? '/en' : '');
  for (const dir of ['profiles','frameworks']) {await rm(`${base}/${dir}`,{recursive:true,force:true});await mkdir(`${base}/${dir}`,{recursive:true});}
  const frameworkFor = (person) => library.search([person.summary,...person.topics].join(' '),3).results.map(r => library.get(r.id)).filter(Boolean);
  const entries = [
    ...library.people.map(person => ['profiles',person.id,personPage(person,language,{library,portraits,frameworkFor})]),
    ...library.frameworks.map(framework => ['frameworks',framework.id,frameworkPage(framework,language,{library,people:library.people})]),
  ];
  for (const [dir,id,page] of entries) {
    const html = entryTemplate.replace('{{content}}',()=>page.content).replace('{{jsonld}}',()=>page.jsonld).replace('{{alternates}}',()=>alternates(page.path))
      .replaceAll('{{title}}',()=>escape(page.title)).replaceAll('{{description}}',()=>escape(page.description))
      .replace('{{ogtype}}',page.type).replace('{{ogimage}}',page.image ?? 'https://sigge.si/og.png').replace('{{twittercard}}',page.image ? 'summary' : 'summary_large_image')
      .replace('{{oglocale}}',language === 'en' ? 'en_GB' : 'sv_SE');
    await writeFile(`${base}/${dir}/${id}.html`,render(html,language,page.path,page.nav));
    if (language === 'sv') paths.push(page.path);
  }
}
await writeFile('public/sitemap.xml',sitemap(paths));

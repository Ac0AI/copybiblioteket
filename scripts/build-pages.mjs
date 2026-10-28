import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { message, pagePath } from '../client/messages.js';
const escape = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for (const language of ['sv','en']) {
  const directory = 'public' + (language === 'en' ? '/en' : '');
  await mkdir(directory,{recursive:true});
  for (const page of ['index','library','people','connect','consent']) {
    const path = page === 'index' ? '/' : '/' + page;
    let html = await readFile(`client/pages/${page}.html`,'utf8');
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
    if (/\{\{/.test(html)) throw new Error('Unresolved page token: '+page);
    await writeFile(`${directory}/${page}.html`,html);
  }
}

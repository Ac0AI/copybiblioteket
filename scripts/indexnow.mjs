// Tell IndexNow search engines (Bing, Yandex, Seznam, Naver, Yep) about every URL in the live sitemap.
// Run after a production deploy: node scripts/indexnow.mjs
const SITE = 'https://sigge.si';
const KEY = 'fb483bc462b2594b46dd9c2ad6414e4c'; // public/<KEY>.txt proves we own the host
const keyFile = await fetch(`${SITE}/${KEY}.txt`);
if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) throw new Error('Key file is not live yet');
const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs, HTTP ${response.status}`);
if (!response.ok) throw new Error(await response.text());

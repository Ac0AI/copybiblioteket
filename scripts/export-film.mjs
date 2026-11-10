// Exports the explainer film on /connect as the frames of an MP4, so the shared video matches the film on the site.
// Every animation is paused and moved to each frame's time, which makes the export exact and repeatable.
//
// Needs Playwright and ffmpeg, which are not project dependencies, and the site running locally (npm start).
//
//   node scripts/export-film.mjs sv /tmp/film-sv
//   ffmpeg -framerate 30 -i /tmp/film-sv/f%04d.png -vf scale=1360:1074,format=yuv420p -c:v libx264 -crf 22 -movflags +faststart film.mp4
//
// The end card with the mascot is not part of the page. Append it from the previous export:
//   ffmpeg -ss 15 -i public/media/sigge-anslut-din-ai.mp4 -an end.mp4
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const [, , language = 'sv', out = 'film-frames', base = 'http://127.0.0.1:8813'] = process.argv;
const FPS = 30, SCENE_SECONDS = 5;
const { chromium } = createRequire(import.meta.url)('playwright');

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
await page.goto(base + (language === 'en' ? '/en' : '') + '/connect', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const film = page.locator('[data-film]').first();
// The film fills the frame: 680 CSS pixels wide at double density gives 1360 pixels.
await page.evaluate(() => {
  Object.assign(document.querySelector('[data-film]').style, { position: 'fixed', left: '0', top: '0', width: '680px', zIndex: '9999', borderRadius: '0', boxShadow: 'none' });
  document.querySelector('.topbar').style.display = 'none';
});
const chapters = film.locator('[data-chapter]');
let frame = 0;
for (let scene = 0; scene < await chapters.count(); scene++) {
  await chapters.nth(scene).evaluate((node) => node.click());
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  // Stop one frame short of the scene's end, so the progress bar never finishes and starts the next scene by itself.
  for (let step = 0; step < FPS * SCENE_SECONDS; step++) {
    await page.evaluate((time) => { for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = time; } }, step * 1000 / FPS);
    await film.screenshot({ path: `${out}/f${String(frame++).padStart(4, '0')}.png` });
  }
}
console.log(`${frame} frames in ${out}`);
await browser.close();

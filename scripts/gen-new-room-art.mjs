// Rasterize the SVG sprite sources in new-room-art.html to transparent PNGs
// in public/assets/sprites/, one per <svg data-out="name"> element, at the
// exact pixel size declared on the SVG (which must match the sprite's
// physics footprint in the game).
//
// Dev-only tool; needs playwright + a chromium it can launch:
//   npx playwright install chromium   (or set CHROMIUM to an executable)
// Usage: node scripts/gen-new-room-art.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'public', 'assets', 'sprites');

const browser = await chromium.launch(
    process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}
);
const page = await browser.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 1 });
// NOTE: the html must not paint a page background -- element screenshots
// with omitBackground only stay transparent over an unpainted page.
await page.goto('file://' + join(here, 'new-room-art.html'));

for (const el of await page.locator('svg[data-out]').all()) {
    const name = await el.getAttribute('data-out');
    await el.screenshot({ path: join(OUT, `${name}.png`), omitBackground: true });
    console.log('wrote', `${name}.png`);
}

await browser.close();

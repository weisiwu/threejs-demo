import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const specs = JSON.parse(await readFile('src/catalog.json', 'utf8'));
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const rows = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  for (const spec of specs) {
    const errors = [];
    const receive = (e) => errors.push(e.message);
    page.on('pageerror', receive);
    await page.goto('http://127.0.0.1:44173/threejs-demo/#/demo/' + spec.slug);
    await page.locator('canvas[data-frames]').waitFor();
    await page.waitForFunction(() => Number(document.querySelector('canvas')?.dataset.frames) > 3);
    await page.locator('#pause').click();
    await page.locator('#step').click();
    const png = await page.locator('#viewport').screenshot();
    const path = 'public/previews/' + spec.slug + '.png';
    await writeFile(path, png);
    rows.push({
      slug: spec.slug,
      path,
      sha256: createHash('sha256').update(png).digest('hex'),
      bytes: png.length,
      viewport: [1440, 1080],
      stage: await page.locator('#viewport').boundingBox(),
      errors,
    });
    page.off('pageerror', receive);
    console.log(spec.slug, errors.length ? errors : 'OK');
  }
  await writeFile(
    'research/appearance-captures.json',
    JSON.stringify({ capturedAt: new Date().toISOString(), rows }, null, 2) + '\n',
  );
} finally {
  await browser.close();
}

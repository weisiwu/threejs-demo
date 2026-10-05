import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:44173/threejs-demo/scripts/export-models.html');
  await page.waitForFunction(() => window.exportOne);
  const ids = await page.evaluate(() => window.ids),
    models = [];
  await mkdir('public/models', { recursive: true });
  for (const id of ids) {
    const { bytes, row } = await page.evaluate((id) => window.exportOne(id), id);
    const buffer = Buffer.from(bytes);
    await writeFile('public/models/' + row.file, buffer);
    models.push({
      ...row,
      bytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'),
    });
    console.log(id, row.meshCount, row.triangles, buffer.length);
  }
  await writeFile(
    'public/models/manifest.json',
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        generator: 'scripts/export-models.mjs',
        runtime: 'same createModel factory as the demos',
        axes: 'Y up; scene-unit scale (not physical dimensions)',
        models,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser.close();
}

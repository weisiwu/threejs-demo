import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sceneModels } from '../../src/models/entries';
for (const [slug, ids] of Object.entries(sceneModels)) {
  test(slug + '：简版模型与 GLB 下载入口', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('#/demo/' + slug);
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('data-model-ids', ids.join(','));
    await expect
      .poll(async () => Number(await canvas.getAttribute('data-calls')))
      .toBeGreaterThan(1);
    await expect(page.locator('.model-downloads a')).toHaveCount(ids.length);
    await expect(canvas).toHaveAttribute(
      'data-active-models',
      slug === 'world-environment' ? 'industrial-robot,industrial-hangar' : ids[0],
    );
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
test('14 份 GLB 原件可独立加载，面数、动画与哈希对账', async ({ request }) => {
  const manifest = await (await request.get('models/manifest.json')).json();
  expect(manifest.models).toHaveLength(14);
  for (const model of manifest.models) {
    const response = await request.get('models/' + model.file);
    expect(response.ok()).toBe(true);
    const bytes = await response.body();
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(model.sha256);
    expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
    const loaded = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
      '',
    );
    let meshes = 0,
      triangles = 0;
    loaded.scene.traverse((o) => {
      const m = o as any;
      if (m.isMesh) {
        meshes++;
        triangles +=
          (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
      }
    });
    expect(meshes).toBe(model.meshCount);
    expect(triangles).toBe(model.triangles);
    expect(loaded.animations.map((a) => a.name)).toEqual(model.animations);
    expect(loaded.scene.children.length).toBeGreaterThan(0);
  }
});
test('角色、机器人和飞船切换独立模型，推进器开关保持各自记录', async ({ page }) => {
  for (const [slug, ids, keys] of [
    ['character-selection', sceneModels['character-selection'], ['scout', 'engineer', 'guardian']],
    ['robot-roster', sceneModels['robot-roster'], ['scout', 'engineer', 'guardian']],
    ['ship-selection', sceneModels['ship-selection'], ['arrow', 'freighter', 'drifter']],
  ] as const) {
    await page.goto('#/demo/' + slug);
    await page.locator('#pause').click();
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-select="' + keys[i] + '"]').click();
      await expect(page.locator('canvas')).toHaveAttribute('data-active-models', ids[i]);
    }
  }
  await page.locator('[data-select="arrow"]').click();
  await page.locator('#action').click();
  await expect(page.locator('[data-metric="推进器"]')).toHaveText('卸下');
  await page.locator('[data-select="freighter"]').click();
  await expect(page.locator('[data-metric="推进器"]')).toHaveText('装备');
  await page.locator('[data-select="arrow"]').click();
  await expect(page.locator('[data-metric="推进器"]')).toHaveText('卸下');
});
test('新骨架可隔离颅骨，植物细胞可选择叶绿体并拆解', async ({ page }) => {
  await page.goto('#/demo/skeleton-explorer');
  await page.locator('[data-select="skull"]').click();
  await page.locator('#action').click();
  await expect(page.locator('[data-metric="模式"]')).toHaveText('仅选中');
  await expect(page.locator('[data-metric="部件数"]')).toHaveText('9');
  await page.goto('#/demo/biological-structure');
  await page.locator('[data-select="organelle-1"]').click();
  await expect(page.locator('[data-metric="结构"]')).toHaveText('叶绿体');
  await page.locator('#action').click();
  await expect(page.locator('[data-metric="外膜"]')).toHaveText('隐藏');
  await page.locator('#parameter').fill('0.8');
  await page.locator('#parameter').dispatchEvent('input');
  await expect(page.locator('[data-metric="拆解比例"]')).toHaveText('0.8');
});

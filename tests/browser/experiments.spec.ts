import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { DemoSpec } from '../../src/types';
const catalog: DemoSpec[] = JSON.parse(
  readFileSync(new URL('../../src/catalog.json', import.meta.url), 'utf8'),
);
import { mkdir } from 'node:fs/promises';
const metric = (page: any, key: string) => page.locator(`[data-metric="${key}"]`);
for (const spec of catalog) {
  test(`${spec.slug}：场景、操作、暂停、重置`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`#/demo/${spec.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(spec.title);
    const canvas = page.getByRole('img', { name: spec.title + ' 三维场景' });
    await expect(canvas).toBeVisible();
    await expect
      .poll(async () => Number(await canvas.getAttribute('data-calls')))
      .toBeGreaterThan(1);
    if (spec.slug === 'network-management')
      await page.getByLabel('device-1', { exact: true }).check();
    await page.locator('#action').click();
    await expect(page.locator('#status')).toHaveAttribute('data-operations', '1');
    await expect(page.locator('#status')).not.toHaveText('就绪');
    await page.locator('#parameter').focus();
    await page
      .locator('#parameter')
      .press(spec.parameter.value === spec.parameter.max ? 'ArrowLeft' : 'ArrowRight');
    await expect(page.locator('#parameter')).not.toHaveValue(String(spec.parameter.value));
    await page.locator('#pause').click();
    await expect(page.locator('#pause')).toHaveText('继续');
    const time = Number(await page.locator('#clock').getAttribute('data-time'));
    await page.locator('#step').click();
    await expect
      .poll(async () => Number(await page.locator('#clock').getAttribute('data-time')))
      .toBeCloseTo(time + 1, 5);
    await mkdir('test-results/screenshots', { recursive: true });
    await page
      .locator('#viewport')
      .screenshot({ path: `test-results/screenshots/${spec.slug}.png` });
    await page.locator('#reset').click();
    await expect(page.locator('#status')).toHaveAttribute('data-operations', '0');
    await expect(page.locator('#parameter')).toHaveValue(String(spec.parameter.value));
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
  test(`${spec.slug}：390px 操作与布局`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`#/demo/${spec.slug}`);
    await expect(page.locator('canvas')).toBeVisible();
    await expect
      .poll(async () => Number(await page.locator('canvas').getAttribute('data-calls')))
      .toBeGreaterThan(1);
    await page.locator('#action').click();
    await expect(page.locator('#status')).toHaveAttribute('data-operations', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
test('网表错误保留上一组电压，修改电阻后重新求解', async ({ page }) => {
  await page.goto('#/demo/circuit-builder');
  await expect(metric(page, '节点 out（V）')).toHaveText('6.0000');
  const editor = page.getByRole('textbox', { name: '电路网表', exact: true });
  const data = JSON.parse(await editor.inputValue());
  data.parts[2].value = 2000;
  await editor.fill(JSON.stringify(data));
  await page.locator('#action').click();
  await expect(metric(page, '节点 out（V）')).toHaveText('8.0000');
  data.parts[2].pins = ['missing', '0'];
  await editor.fill(JSON.stringify(data));
  await page.locator('#action').click();
  await expect(page.locator('#status')).toContainText('无效');
  await expect(metric(page, '节点 out（V）')).toHaveText('8.0000');
});
test('无效场景指令不会丢失已添加物体，清空命令可执行', async ({ page }) => {
  await page.goto('#/demo/scene-builder');
  await page.locator('#action').click();
  await expect(metric(page, '物体数量')).toHaveText('1');
  await page
    .getByRole('textbox', { name: '场景指令', exact: true })
    .fill('{"op":"add","objects":[{"id":"evil","type":"script"}]}');
  await page.locator('#action').click();
  await expect(metric(page, '物体数量')).toHaveText('1');
  await expect(page.locator('#status')).toContainText('未知');
  await page.getByRole('button', { name: '准备清空指令' }).click();
  await page.locator('#action').click();
  await expect(metric(page, '物体数量')).toHaveText('0');
});
test('仓库重复派单不重复结算，货物到达后库存增加', async ({ page }) => {
  await page.goto('#/demo/warehouse-strategy');
  await page.locator('#action').click();
  await page.locator('#action').click();
  await expect(page.locator('#status')).toContainText('重复');
  await page.locator('#pause').click();
  for (let i = 0; i < 15; i++) await page.locator('#step').click();
  await expect(metric(page, '送达库存')).toHaveText('1');
  await expect(metric(page, '完成任务 ID 数')).toHaveText('1');
  for (let i = 0; i < 3; i++) await page.locator('#step').click();
  await expect(metric(page, '送达库存')).toHaveText('1');
});
test('保存后的面板顺序在重新载入后保持', async ({ page }) => {
  await page.goto('#/demo/customizable-dashboard');
  await page.getByRole('button', { name: '上移 orders', exact: true }).click();
  await page.locator('#action').click();
  await page.reload();
  await expect(metric(page, '顺序')).toHaveText('orders → revenue → traffic');
});
test('无关父级更新不重绘 memo 与 Context；选元素会改变实体状态', async ({ page }) => {
  await page.goto('#/demo/state-management');
  await expect(metric(page, '有效订阅数')).toHaveText('1');
  const before = Number(await metric(page, 'memo 渲染').textContent()),
    context = Number(await metric(page, 'Context 渲染').textContent());
  await page.getByRole('button', { name: '无关父级更新' }).click();
  await expect(metric(page, '普通组件渲染')).toHaveText('2');
  await expect(metric(page, 'memo 渲染')).toHaveText(String(before));
  await expect(metric(page, 'Context 渲染')).toHaveText(String(context));
  await page.locator('#action').click();
  await expect(metric(page, '计数值')).toHaveText('1');
  await page.goto('#/demo/atomic-explorer');
  await page.locator('[data-select="element-8"]').click();
  await expect(metric(page, '元素')).toHaveText('O');
  await expect(page.locator('#parameter')).toHaveValue('8');
});
test('连续切换时保持单画布，资源数量不累积', async ({ page }) => {
  await page.goto('#/demo/hexapod-robot');
  await expect
    .poll(async () => Number(await page.locator('canvas').getAttribute('data-geometries')))
    .toBeGreaterThan(5);
  const initial = Number(await page.locator('canvas').getAttribute('data-geometries'));
  for (let i = 0; i < 6; i++) {
    await page.goto('#/demo/protein-folding');
    await expect(metric(page, '残基数')).toHaveText('46');
    await page.goto('#/demo/hexapod-robot');
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect
      .poll(async () => Number(await page.locator('canvas').getAttribute('data-geometries')))
      .toBe(initial);
  }
});
test('目录筛选与手机布局', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.locator('.demo-card')).toHaveCount(43);
  await page.getByRole('button', { name: '机械机构', exact: true }).click();
  await expect(page.locator('.demo-card')).toHaveCount(12);
  await page.getByPlaceholder('例如：连杆、电路、蛋白质').fill('水母');
  await expect(page.getByRole('searchbox')).toHaveValue('水母');
  await expect(page.locator('.demo-card')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('目标恢复和新网表不显示上一快照的残留字段', async ({ page }) => {
  await page.goto('#/demo/industrial-arm');
  const parameter = page.locator('#parameter');
  await parameter.focus();
  await parameter.press('End');
  await expect(metric(page, '求解状态')).toHaveText('不可达');
  await parameter.press('Home');
  await expect(page.locator('#status')).toHaveText('目标求解成功');
  await expect(metric(page, '求解状态')).toHaveCount(0);
  await page.goto('#/demo/circuit-builder');
  await page.getByRole('textbox', { name: '电路网表', exact: true }).fill(
    JSON.stringify({
      nodes: ['0', 'new'],
      parts: [{ id: 'V', type: 'voltage-source', pins: ['new', '0'], value: 3 }],
    }),
  );
  await page.locator('#action').click();
  await expect(metric(page, '节点 new（V）')).toHaveText('3.0000');
  await expect(metric(page, '节点 out（V）')).toHaveCount(0);
});
test('隐藏设备清除勾选，空布局保存后仍为空', async ({ page }) => {
  await page.goto('#/demo/network-management');
  await page.getByLabel('device-8', { exact: true }).check();
  await page.locator('#parameter').focus();
  await page.locator('#parameter').press('Home');
  await expect(page.getByLabel('device-8', { exact: true })).toBeHidden();
  await expect(metric(page, '已选设备')).toHaveText('0');
  await page.locator('#parameter').press('End');
  await expect(page.getByLabel('device-8', { exact: true })).not.toBeChecked();
  await page.goto('#/demo/customizable-dashboard');
  for (const id of ['revenue', 'orders', 'traffic'])
    await page.getByRole('button', { name: '删除 ' + id, exact: true }).click();
  await page.locator('#action').click();
  await page.reload();
  await expect(metric(page, '图表数量')).toHaveText('0');
});
test('采样门隐藏后停止计数，移动角色从同源地形采样高度', async ({ page }) => {
  await page.goto('#/demo/visibility-dashboard');
  await page.locator('#pause').click();
  await page.locator('#step').click();
  const samples = await metric(page, '样本数').textContent();
  await page.locator('#action').click();
  await page.locator('#step').click();
  await expect(metric(page, '样本数')).toHaveText(samples!);
  await page.goto('#/demo/world-environment');
  await page.locator('#pause').click();
  await page.keyboard.down('d');
  await page.locator('#step').click();
  await page.keyboard.up('d');
  await expect(metric(page, '角色 X')).toHaveText('2.00');
  await expect(metric(page, '地面高度')).toHaveText((Math.sin(2 * 0.55) * 0.6).toFixed(2));
});
test('保存桌面与手机阅读截图，目录预览均加载', async ({ page }) => {
  await mkdir('test-results/visuals', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('./');
  await expect(page.locator('.demo-card')).toHaveCount(43);
  await expect
    .poll(() =>
      page
        .locator('.card-image img')
        .evaluateAll(
          (images) =>
            images.filter(
              (i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0,
            ).length,
        ),
    )
    .toBeGreaterThan(2);
  await page.screenshot({ path: 'test-results/visuals/gallery-desktop.png' });
  await page.goto('#/demo/circuit-builder');
  await expect(metric(page, '节点 out（V）')).toHaveText('6.0000');
  await page.locator('#pause').click();
  await page.screenshot({ path: 'test-results/visuals/circuit-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/visuals/circuit-mobile.png', fullPage: true });
});

test('周期表包含完整 118 项，选中 Og 后读数和控件保持一致', async ({ page }) => {
  await page.goto('#/demo/atomic-explorer');
  await expect(page.locator('.element-grid button')).toHaveCount(118);
  await page.locator('[data-select="element-118"]').click();
  await expect(metric(page, '元素')).toHaveText('Og');
  await expect(page.locator('#parameter')).toHaveValue('118');
});
test('复杂初始图仍能继续重写，节点预算与重置一致', async ({ page }) => {
  await page.goto('#/demo/rule-universe');
  await expect(metric(page, '节点数')).toHaveText('160');
  await page.locator('#action').click();
  await expect(metric(page, '节点数')).toHaveText('161');
  await page.locator('#reset').click();
  await expect(metric(page, '节点数')).toHaveText('160');
  await expect(page.locator('#parameter')).toHaveValue('512');
});
test('咖啡因使用 24 个真实坐标原子，切换后显示当前分子', async ({ page }) => {
  await page.goto('#/demo/molecular-structure');
  await expect(metric(page, '分子')).toContainText('CID 2519');
  await expect(metric(page, '原子数')).toHaveText('24');
  await page.locator('#action').click();
  await expect(metric(page, '分子')).toHaveText('水 H₂O');
  await expect(metric(page, '原子数')).toHaveText('3');
});

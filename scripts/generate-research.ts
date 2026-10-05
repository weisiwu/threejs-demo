import { readFile, writeFile, mkdir } from 'node:fs/promises';
import catalog from '../src/catalog.json';
import research from '../src/research.json';
import appearance from '../research/appearance-review.json';
import { mechanicsIds } from '../src/scenes/mechanics';
import { scienceIds } from '../src/scenes/science';
import { interfaceIds } from '../src/scenes/interfaces';
const base = 'https://weisiwu.github.io/threejs-demo/';
await mkdir('docs', { recursive: true });
const links: string[] = [];
for (const d of catalog) {
  const paragraphs = research[d.slug as keyof typeof research];
  const visual = appearance.demos.find((v) => v.slug === d.slug)!;
  const module = mechanicsIds.has(d.slug)
    ? 'mechanics.ts'
    : scienceIds.has(d.slug)
      ? 'science.ts'
      : interfaceIds.has(d.slug)
        ? 'interfaces.tsx'
        : 'spaces.ts';
  const sourceNote = d.sources[0].url.includes('x.com')
    ? '原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。本轮查看了视频封面并按画面重建。视频播放器未成功加载，完整动作与资产仍未核验。'
    : '来源包括文章或固定提交源码。复现保留可讨论的机制，界面与几何由本仓库重新实现；原工程依赖、全部资产和部署配置没有直接迁移。';
  const content = `---\ntitle: "${d.title}：外观复现与运行记录"\ntype: reproduction-research\ncreated: 2026-10-05\nupdated: 2026-10-05\ntags: [threejs, reproduction, research]\n---\n\n# ${d.title}：外观复现与运行记录\n\n[打开交互实验](${base}#/demo/${d.slug})${d.article ? ` · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/${d.article})` : ''}\n\n## 对照原画面\n\n参考画面：${visual.observed}\n\n${visual.implemented}\n\n![本仓库实际运行截图](../public/previews/${d.slug}.png)\n\n${visual.remaining}\n\n[逐项对照记录](../research/appearance-review.json) · [外观代码](../src/visuals/)\n\n## 先看机制\n\n${paragraphs[0]}\n\n${paragraphs[1]}\n\n## 如何核对\n\n${paragraphs[3]}\n\n通用控件可以暂停、推进一秒和重置。推进一秒分为二十次 0.05 秒更新，机构约束与任务状态继续经过同一更新流程。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。自动绘制上限为每秒 30 次；暂停后，参数、选择、镜头或加载完成才触发新画面。\n\n## 源码入口\n\n- [场景实现](../src/scenes/${module})：按 slug 分支建立部件、处理输入与输出读数。\n- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。\n- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。\n- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。\n\n${d.slug === 'protein-folding' ? '结构坐标见 [crambin.json](../src/data/crambin.json)，单位与原始 PDB 哈希保留在数据中。\n\n' : ''}页面读数来自当前场景计算。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。\n\n## 原资料与复现范围\n\n${paragraphs[2]}\n\n${d.limit}\n\n${sourceNote}\n\n${d.sources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`).join('\n')}\n`;
  await writeFile(`docs/${d.slug}.md`, content);
  links.push(
    `| [${d.title}](${base}#/demo/${d.slug}) | ${d.category} | [研究与源码](docs/${d.slug}.md) |`,
  );
}
const readme = `---\ntitle: Three.js 实验室\ntype: project-readme\nupdated: 2026-10-05\ntags: [threejs, demos, research]\n---\n\n# Three.js 实验室\n\n43 个可以操作的图形实验，覆盖机构运动、科学形态、状态界面与空间交互。每个例子有独立路由、控件、运行读数和研究文档。\n\n[打开实验目录](${base}) · [阅读网站专题](https://imgen.baoganai.com/knowledge/read/dilum-sanjaya-analysis-index)\n\n![连杆实验运行截图](public/previews/strandbeest.png)\n\n实现使用 TypeScript、Three.js 和 Vite。状态管理实验单独使用 React；大部分场景直接维护 Three.js 对象。场景按原画面重建；太阳系使用 MIT 原仓库纹理，极光保留原 SVG，其他模型主要由代码生成。蛋白质目标态使用 RCSB 1CRN 的 Cα 坐标，咖啡因使用 PubChem 三维坐标。没有 API 密钥、付费模型调用或原帖媒体。\n\n本轮按用户反馈恢复原例子的外观与构图。Strandbeest 回到平面绿色细杆；起落架、便携显微镜、莲花建筑、彩色发动机和蓝色仓库分别重建专属造型。机甲、细胞和飞船仍缺原始模型，细节差异见 [逐项对照](research/appearance-review.json)。\n\n## 本地运行\n\n\`\`\`bash\nnpm ci\nnpm run dev\n\`\`\`\n\n浏览器打开终端给出的 /threejs-demo/ 地址。构建用 \`npm run build\`，机制检查用 \`npm test\`，目录检查用 \`npm run check:catalog\`。\n\n端到端检查：\n\n\`\`\`bash\nnpm run test:e2e\n\`\`\`\n\n本机配置使用 Chrome；CI 安装 Chromium。若在无 Chrome 的本机运行，可用 \`CI=1 npx playwright install chromium\` 后执行 \`CI=1 npm run test:e2e\`。\n\n## 实验目录\n\n| 实验 | 方向 | 实现记录 |\n| --- | --- | --- |\n${links.join('\n')}\n\n## 工程与来源\n\n一个活跃场景使用一个渲染循环，场景退出释放几何、材质、纹理、事件、观察器与 React 根。暂停自动时间后，静止画面停止重复绘制，镜头与参数操作仍会更新。\n\n[验证范围](docs/validation.md) · [来源与许可](NOTICE.md) · [固定提交来源清单](research/provenance.json)\n\n代码采用 MIT 许可；原作者仓库、文章、模型包与数据来源保留各自权利。原帖视频与生成资产没有镜像。\n`;
await writeFile('README.md', readme);
console.log('已生成 43 篇外观与机制研究及目录。');

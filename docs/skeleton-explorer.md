---
title: '骨骼结构浏览器：外观复现与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 骨骼结构浏览器：外观复现与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/skeleton-explorer) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-trellis-skeleton)

## 对照原画面

参考画面：黑底、带翼和长尾的兽类骨架。

翼兽骨架已补成九个可选部件：颅骨、颈椎、脊柱、肋笼、尾椎、双翼和双侧腿骨。颅骨有眼眶、弯角和上下颌，翼指与尾椎沿关节连接；拆解滑块移动这些实际部件，隔离按钮也作用于同一模型。

![本仓库实际运行截图](../public/previews/skeleton-explorer.png)

骨形与参考画面仍有差异，当前为重建的简版翼兽骨架；没有把它当成 TRELLIS 原始输出或医学结构。

## 新增简版模型

模型由本仓库按参考画面重建，demo 与 GLB 使用同一份源模型工厂。GLB 包含几何、材质；人形模型另附清单列出的肩部待机动画。文件没有外部贴图依赖。轴向为 Y 向上，尺寸为场景单位。

| 模型     | GLB                                                                       | 三角形 | 动画片段 |
| -------- | ------------------------------------------------------------------------- | -----: | -------: |
| 翼兽骨架 | [下载](https://weisiwu.github.io/threejs-demo/models/winged-skeleton.glb) |  48464 |        0 |

[模型源码](../src/models/model-kit.ts) · [部件与型号映射](../src/models/entries.ts) · [原件哈希和部件范围](../public/models/manifest.json) · [MIT 许可](../public/models/LICENSE)

[逐项对照记录](../research/appearance-review.json) · [外观代码](../src/visuals/)

## 先看机制

骨架展示现在绑定到一份完整简版翼兽模型。颅骨、颈椎、脊柱、肋笼、尾椎、双翼与双侧腿骨使用九个稳定部件 ID，选择和隔离直接控制这些节点。

拆解位移使用各部件初始位置加 offset×参数。原位姿保留，重置不靠当前坐标倒推；尾椎、翼指、眼眶与颌骨是本仓库重建的几何。

## 如何核对

选择 skull 再切换隔离，应只显示颅骨；返回整体并调拆解比例，九组部件从各自基准位姿展开。

通用控件可以暂停、推进一秒和重置。推进一秒分为二十次 0.05 秒更新，机构约束与任务状态继续经过同一更新流程。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。自动绘制上限为每秒 30 次；暂停后，参数、选择、镜头或加载完成才触发新画面。

## 源码入口

- [场景实现](../src/scenes/spaces.ts)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

页面读数来自当前场景计算。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

GLB 与 demo 从同一个 createModel 工厂导出，模型文件包含几何和材质，不依赖外部贴图。它不是 TRELLIS 原件，也没有医学解剖校准。

未运行 TRELLIS.2；骨架为程序化形态示意，非解剖资料。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。本轮查看了视频封面并按画面重建。视频播放器未成功加载，完整动作与资产仍未核验。

1. [作者 X 原帖 · 2001697511850021167](https://x.com/DilumSanjaya/status/2001697511850021167)
2. [Microsoft TRELLIS.2 官方仓库](https://github.com/microsoft/TRELLIS.2)

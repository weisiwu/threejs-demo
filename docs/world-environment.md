---
title: '工业舱室探索：外观复现与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 工业舱室探索：外观复现与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/world-environment) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-world-environment)

## 对照原画面

参考画面：工业舱室中的银色机器人，橙色灯、管线和金属墙。

新增可独立导出的工业舱室和银色机器人。舱室包括重复结构肋、管路、工作台、屏幕、后舱门、顶棚和圆形展示台；机器人仍可用 WASD 移动。角色高度取自展示台或地板，工作台区域限制通行，照明滑块与昼夜按钮改变同一盏灯。

![本仓库实际运行截图](../public/previews/world-environment.png)

舱室没有原环境的高分辨率纹理，碰撞采用简化边界，未调用 World Labs 或 Hunyuan3D。新增 GLB 由本仓库重建。

## 新增简版模型

模型由本仓库按参考画面重建，demo 与 GLB 使用同一份源模型工厂。GLB 包含几何、材质；人形模型另附清单列出的肩部待机动画。文件没有外部贴图依赖。轴向为 Y 向上，尺寸为场景单位。

| 模型           | GLB                                                                         | 三角形 | 动画片段 |
| -------------- | --------------------------------------------------------------------------- | -----: | -------: |
| 工业舱室机器人 | [下载](https://weisiwu.github.io/threejs-demo/models/industrial-robot.glb)  |   5860 |        2 |
| 工业舱室       | [下载](https://weisiwu.github.io/threejs-demo/models/industrial-hangar.glb) |   6864 |        0 |

[模型源码](../src/models/model-kit.ts) · [部件与型号映射](../src/models/entries.ts) · [原件哈希和部件范围](../public/models/manifest.json) · [MIT 许可](../public/models/LICENSE)

[逐项对照记录](../research/appearance-review.json) · [外观代码](../src/visuals/)

## 先看机制

工业舱室与机器人采用两份可导出简版模型。环境包括管路、工作台、屏幕、门、顶棚和圆形展示台，机器人根节点保存自己的位置。

WASD 每秒移动两个场景单位；范围限制在舱室内部，并禁止进入两侧工作台区域。展示台半径 1.8、高度 0.16，离开展示台后脚底落到地板。灯光强度由当前滑块和昼夜状态共同计算。

## 如何核对

暂停后按住 D 推进一秒，X 应到 2.00，地面高度为 0.00；调整光强应更新画面，返回重置后角色位于展示台。

通用控件可以暂停、推进一秒和重置。推进一秒分为二十次 0.05 秒更新，机构约束与任务状态继续经过同一更新流程。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。自动绘制上限为每秒 30 次；暂停后，参数、选择、镜头或加载完成才触发新画面。

## 源码入口

- [场景实现](../src/scenes/spaces.ts)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

页面读数来自当前场景计算。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

环境与机器人由本仓库重建，GLB 不依赖原作贴图或模型服务。碰撞是简化通行边界，不是细网格物理；材质和灯光没有真实照度单位。

未调用 World Labs 或 Hunyuan3D；环境是确定性程序化场景。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。本轮查看了视频封面并按画面重建。视频播放器未成功加载，完整动作与资产仍未核验。

1. [作者 X 原帖 · 2028877095968117240](https://x.com/DilumSanjaya/status/2028877095968117240)
2. [aisdk-threejs-starter](https://github.com/dilums/aisdk-threejs-starter/tree/8b182dc5314fc622e61f262fc6bc0301bc31e2c3)

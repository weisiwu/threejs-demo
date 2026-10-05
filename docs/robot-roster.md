---
title: '机器人图鉴：外观复现与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 机器人图鉴：外观复现与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/robot-roster) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-robot-roster)

## 对照原画面

参考画面：浅紫机库中的红白武装机器人和左侧型号列表。

新增双炮突击、重装哨兵和三臂悬浮维修三款机器人。两款人形模型保留肩肘层级与待机动作，维修型采用悬浮球体和三个工具臂；三者的轮廓、武器与结构各不相同。

![本仓库实际运行截图](../public/previews/robot-roster.png)

当前只有预览与选择交互，未实现战斗、武器射击或原作完整动画。简版模型由本仓库重建。

## 新增简版模型

模型由本仓库按参考画面重建，demo 与 GLB 使用同一份源模型工厂。GLB 包含几何、材质；人形模型另附清单列出的肩部待机动画。文件没有外部贴图依赖。轴向为 Y 向上，尺寸为场景单位。

| 模型               | GLB                                                                      | 三角形 | 动画片段 |
| ------------------ | ------------------------------------------------------------------------ | -----: | -------: |
| 双炮突击机器人     | [下载](https://weisiwu.github.io/threejs-demo/models/robot-assault.glb)  |   7900 |        2 |
| 重装哨兵机器人     | [下载](https://weisiwu.github.io/threejs-demo/models/robot-sentry.glb)   |   7116 |        2 |
| 三臂悬浮维修机器人 | [下载](https://weisiwu.github.io/threejs-demo/models/robot-engineer.glb) |   1936 |        0 |

[模型源码](../src/models/model-kit.ts) · [部件与型号映射](../src/models/entries.ts) · [原件哈希和部件范围](../public/models/manifest.json) · [MIT 许可](../public/models/LICENSE)

[逐项对照记录](../research/appearance-review.json) · [外观代码](../src/visuals/)

## 先看机制

机器人图鉴现在包含双炮突击、重装哨兵和三臂悬浮维修三种轮廓。业务 ID 保持 scout、engineer、guardian，模型清单分别映射 robot-assault、robot-sentry、robot-engineer。

选择切换实际主模型；粗糙度滑块遍历当前模型材质，不改变身份。人形机的肩肘是独立节点，双炮与重装轮廓各自保留，维修机采用三臂悬浮构型。

## 如何核对

先确认工程型，再切守卫型预览，确认态保持；拖粗糙度比较反光，检查模型数量不随操作增加。

通用控件可以暂停、推进一秒和重置。推进一秒分为二十次 0.05 秒更新，机构约束与任务状态继续经过同一更新流程。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。自动绘制上限为每秒 30 次；暂停后，参数、选择、镜头或加载完成才触发新画面。

## 源码入口

- [场景实现](../src/scenes/spaces.ts)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

页面读数来自当前场景计算。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

三份 GLB 由本仓库简版模型导出，没有外部贴图。当前武器为展示部件，不具备射击或战斗行为，完整原角色动画未移植。

本仓库参考画面重建的简版模型；保留选择与状态，未实现原作完整动画或玩法。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。本轮查看了视频封面并按画面重建。视频播放器未成功加载，完整动作与资产仍未核验。

1. [作者 X 原帖 · 2049169897029042176](https://x.com/DilumSanjaya/status/2049169897029042176)
2. [aisdk-threejs-starter](https://github.com/dilums/aisdk-threejs-starter/tree/8b182dc5314fc622e61f262fc6bc0301bc31e2c3)

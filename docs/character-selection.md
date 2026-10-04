---
title: '角色选择大厅：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 角色选择大厅：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/character-selection) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-character-selection)

## 先看机制

角色选择包含预览态与确认态。鼠标换预览不能立即覆盖已确认的角色，否则用户尚未提交选择就会进入另一条业务状态。

侦察型、工程型、守卫型由三组程序化 humanoid 构成，持有 scout、engineer、guardian ID。选中模型放大，确认按钮才写入 confirmed；旋转速度只控制预览运动。

## 如何核对

确认侦察型，再预览工程型，读数中预览 ID 改变、已确认 ID 保持；重置后确认记录回到无。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/spaces.ts)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

三个模型同时留在场景中，切换没有重复创建资源。没有角色生成调用、骨骼绑定、行走或战斗系统。引入生成资产后，应让资产清单映射到 characterId，而不是把文件名作为角色身份。

未调用图像与三维生成工具，角色无战斗或骨骼动画系统。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。原帖视频未在这一轮逐帧观看，原型对应的资产和执行参数也未完整取得。

1. [作者 X 原帖 · 2008584593222652057](https://x.com/DilumSanjaya/status/2008584593222652057)
2. [aisdk-threejs-starter](https://github.com/dilums/aisdk-threejs-starter/tree/8b182dc5314fc622e61f262fc6bc0301bc31e2c3)

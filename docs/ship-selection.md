---
title: '飞船整备舱：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 飞船整备舱：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/ship-selection) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-ship-selection)

## 先看机制

选船与装备是两份状态：selection 决定当前操作目标，每艘船自己的 Map 项记录推进器是否装备。换船不应把上一艘的装备复制过来。

三个程序化机体在统一展示中心运行，推进器通过显隐表达槽位状态。操作切换当前 shipId 的装备，预览转速控制旋转；模型身份保持不变。

## 如何核对

在箭形艇卸下推进器，切换货运艇再切回来；箭形艇仍应为卸下，而货运艇保持原状态。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/spaces.ts)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

这是一组选择与配置交互，没有生成模型导入、推进性能或可飞行控制器。后续装入真实资产时，需要核对资源轴向、包围盒中心和挂点 transform；灯光统一只能改善展示，无法修正挂点。

程序化模型；未完成飞行、碰撞或生成资产验收。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。原帖视频未在这一轮逐帧观看，原型对应的资产和执行参数也未完整取得。

1. [作者 X 原帖 · 2016193959408836932](https://x.com/DilumSanjaya/status/2016193959408836932)
2. [aisdk-threejs-starter](https://github.com/dilums/aisdk-threejs-starter/tree/8b182dc5314fc622e61f262fc6bc0301bc31e2c3)

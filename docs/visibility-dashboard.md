---
title: "可见性仪表盘：机制与运行记录"
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 可见性仪表盘：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/visibility-dashboard)

## 先看机制

性能优化要决定何时可以停止工作。IntersectionObserver 的相交结果、卡片是否被手动隐藏、document.visibilityState 三项共同决定采样门。

卡片隐藏时保留尺寸，避免周围布局跳动；采样间隔由累计模拟时间与周期参数比较。采样门关闭期间不产生新样本，恢复后采一次，并清掉积压时间，不把离开页面的时间补成大量轮询。

## 如何核对

暂停自动时间后用推进一秒观察样本数；隐藏卡片后继续推进，计数应保持。恢复显示后再推进，采样重新开始。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/interfaces.tsx)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

场景中的十二根柱体只在采样发生时更新。样本数可以观察采样门是否有效；整个 WebGL 场景仍需渲染以响应镜头，因此本例不会声称完全停止了 GPU 工作。离开场景会断开 observer。

数据来自本地确定性采样器；没有 LogicVein 私有代码或生产性能数据。

来源包括文章或固定提交源码。复现保留可讨论的机制，界面与几何由本仓库重新实现；原工程依赖、全部资产和部署配置没有直接迁移。

1. [Boosting Dashboard Performance](https://logicvein.com/blog-and-news/boosting-dashboard-performance/)
2. [customizable-react-dashboard-with-charts](https://github.com/dilums/customizable-react-dashboard-with-charts/tree/eac83918b76fe38b931a76a3e9882399663fbc0a)
3. [MDN IntersectionObserver 文档](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

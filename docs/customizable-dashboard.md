---
title: '可定制仪表盘：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 可定制仪表盘：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/customizable-dashboard)

## 先看机制

面板定制先解决身份和顺序。布局保存的是 revenue、orders、traffic 这样的业务 ID；柱体只是这些记录的一种画法。若保存 mesh 的索引，删除前面的卡片后，旧配置就会指向另一张图。

复现把顺序放进 ids 数组，上移时交换相邻 ID，删除时按 ID 过滤；添加图表寻找尚未占用的 metric-N。保存入口写入 threejs-demo.dashboard.v1，重新打开时校验数量、类型与唯一性。柱高倍率会重建几何，旧几何与材质先释放。

## 如何核对

上移 orders，然后保存并刷新；添加到六张图后继续添加不会突破预算。删除一张后重新添加，ID 不与仍在场的图表冲突。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/interfaces.tsx)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

初始三张图的高度按 (i+1)×倍率计算，数值是演示数据。保存布局后刷新，orders → revenue → traffic 应保持原顺序。这检验了存储与视图是否从同一份配置重建；没有接入真实业务接口，也没有照搬原仓库的图表组件。

图表使用固定种子生成的示例数据；不接入真实监控。

来源包括文章或固定提交源码。复现保留可讨论的机制，界面与几何由本仓库重新实现；原工程依赖、全部资产和部署配置没有直接迁移。

1. [可定制仪表盘原文](https://javascript.plainenglish.io/tired-of-boring-static-dashboards-lets-build-a-fully-customizable-dashboard-in-react-88cb5369cfe1)
2. [customizable-react-dashboard-with-charts](https://github.com/dilums/customizable-react-dashboard-with-charts/tree/eac83918b76fe38b931a76a3e9882399663fbc0a)

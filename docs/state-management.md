---
title: "状态订阅实验：机制与运行记录"
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 状态订阅实验：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/state-management)

## 先看机制

状态管理的比较必须先定义更新来源。本例把计数变更与无关父级更新分开，分别记录普通组件、memo、Context 消费者和 useSyncExternalStore 订阅者的实际渲染次数。

四个组件在同一个 React 根中运行。memo 收到稳定的数值 prop；Context 的子元素引用保持稳定，因此父级噪声不会因新建 element 而重绘消费者。外部 store 返回数值快照，subscribe 返回清理函数，离开场景后卸载 React 根。

## 如何核对

先触发一次无关父级更新，检查普通组件增加一次、memo 与 Context 保持；再增加计数，观察值与订阅数。渲染计数不能直接换算为运行时间或内存消耗。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/interfaces.tsx)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

增加计数会通知 store 并更新 Context；无关父级更新只改父级噪声。观察 memo 计数不变，才有理由讨论它在这一更新路径上的作用。这里没有重装已归档的 Recoil，也没有以四根柱子的动画冒充四种状态库性能测量。

实验比较更新传播范围，不输出性能排名；开发模式调用次数不能当作生产耗时。

来源包括文章或固定提交源码。复现保留可讨论的机制，界面与几何由本仓库重新实现；原工程依赖、全部资产和部署配置没有直接迁移。

1. [React 状态管理原文](https://javascript.plainenglish.io/mastering-react-state-management-a-comprehensive-guide-5b21359ec76a)
2. [react-state-management](https://github.com/dilums/react-state-management/tree/6c20abe678537dc168a2587412f920e9162213a1)
3. [React memo 官方文档](https://react.dev/reference/react/memo)
4. [React useContext 官方文档](https://react.dev/reference/react/useContext)
5. [Recoil 官方仓库归档状态](https://github.com/facebookexperimental/Recoil)

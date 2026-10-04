---
title: '反应堆诊断台：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 反应堆诊断台：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/reactor-diagnostics) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-arc-reactor-diagnostics)

## 先看机制

诊断面板使用一个确定性快照：温度=40+35×负载+故障偏移。故障偏移为 55，按钮切换冷却失效并增加事件版本。

三维核心颜色由同一温度阈值驱动，高于 100 时变红；面板同步显示负载、温度、故障与版本，避免图形与文字读取不同帧的数据。

## 如何核对

提高负载后注入故障，对照颜色、温度与事件版本；清除故障后同一快照同步恢复。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/interfaces.tsx)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

温度是示例值，规则阈值不是安全工程判据。没有真实反应堆、传感器、控制系统或模型推理；原帖界面只适合讨论告警组织与状态一致性。

虚构设备诊断，不是实物工程或真实传感器。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。原帖视频未在这一轮逐帧观看，原型对应的资产和执行参数也未完整取得。

1. [作者 X 原帖 · 2074537139329785891](https://x.com/DilumSanjaya/status/2074537139329785891)
2. [customizable-react-dashboard-with-charts](https://github.com/dilums/customizable-react-dashboard-with-charts/tree/eac83918b76fe38b931a76a3e9882399663fbc0a)

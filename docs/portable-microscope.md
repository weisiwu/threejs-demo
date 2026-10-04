---
title: '便携显微镜机构：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 便携显微镜机构：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/portable-microscope) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-portable-microscope)

## 先看机制

机械剖视先明确运动件。本例分为基座、立柱、镜筒滑台、物镜与样品台，参数只改镜筒滑台高度。

镜筒位置按 3+进度计算，剖面操作改变外罩显隐，其余部件保持。滑台与镜头属于同一 group，所以调焦位移不会只移动外罩。

## 如何核对

在外罩显示与隐藏两种状态下拖动镜筒位置，确认镜头与滑台一起运动，样品台保持不动。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/mechanics.ts)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

这是一份程序化结构示意，未核对 CAD 尺寸、打印公差、导向间隙或光学焦距。看上去能滑动不代表实体可装配；原项目若提供 STEP/STL，应另外测包围盒、单位和运动间隙。

显示模型不是可制造 CAD；没有真实光学、标定或 Raspberry Pi 控制。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。原帖视频未在这一轮逐帧观看，原型对应的资产和执行参数也未完整取得。

1. [作者 X 原帖 · 2087583466301059567](https://x.com/DilumSanjaya/status/2087583466301059567)
2. [responsive-strandbeest](https://github.com/dilums/responsive-strandbeest/tree/4eb0e454bb4d089de4c40da21f51c4efacad4e24)

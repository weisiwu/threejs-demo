---
title: '骨骼结构浏览器：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 骨骼结构浏览器：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/skeleton-explorer) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-trellis-skeleton)

## 先看机制

结构查看器首先处理部件身份。本例有头部、八个椎体、六根肋环与四根长骨，共十九个程序化部件；每个部件都有稳定 ID。

列表按钮与场景拾取都写入 selection。拆解参数只移动各部件的 transform，不重新分配 ID；隔离按钮显示当前部件，再次操作恢复整体。高亮与运行读数读取同一选择。

## 如何核对

从列表选 skull，再拖拆解间距并隔离；确认选中 ID 没变。场景点击只选可拾取的可见部件。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/spaces.ts)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

没有生成或加载 TRELLIS.2 网格，也没有医学解剖校准。外观刻意简化，目的是把“看得到结构”推进到“能选中、命名、隔离和回位”。若换成生成骨架，需要先检查连通性、部件分割与命名。

未运行 TRELLIS.2；骨架为程序化形态示意，非解剖资料。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。原帖视频未在这一轮逐帧观看，原型对应的资产和执行参数也未完整取得。

1. [作者 X 原帖 · 2001697511850021167](https://x.com/DilumSanjaya/status/2001697511850021167)
2. [Microsoft TRELLIS.2 官方仓库](https://github.com/microsoft/TRELLIS.2)

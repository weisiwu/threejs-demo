---
title: '未来控制界面：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 未来控制界面：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/futuristic-interface) · [阅读相关文章](https://imgen.baoganai.com/knowledge/read/dilum-x-futuristic-interface)

## 先看机制

科幻界面中的按钮需要明确任务阶段。复现以待命、扫描中、完成构成有限状态，进度由累计模拟时间除以扫描时长得到。

扫描中再次点击不会重开任务。完成后可启动下一次，任务计数增加；圆环与扫描杆读取同一 elapsed，因此不会出现进度完成而画面仍在另跑计时器的情况。

## 如何核对

启动后暂停，再推进指定秒数，进度应抵达 100%；暂停不会使后台墙钟偷偷完成任务。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/interfaces.tsx)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

圈形 HUD 是程序化几何，没有后端扫描、传感器或模型请求。当前结果只证明状态流程有终点。真实任务需要区分发起、排队、失败、超时和取消，并以服务端完成回执驱动结束。

扫描对象和结果为本地模拟，未接入传感器或生成服务。

原帖文字说明了作者公开展示的方向。后面的仓库用于研究相近机制，除非正文另有说明，不能把它当成该条原帖的完整源码。原帖视频未在这一轮逐帧观看，原型对应的资产和执行参数也未完整取得。

1. [作者 X 原帖 · 2045545685899153440](https://x.com/DilumSanjaya/status/2045545685899153440)
2. [customizable-react-dashboard-with-charts](https://github.com/dilums/customizable-react-dashboard-with-charts/tree/eac83918b76fe38b931a76a3e9882399663fbc0a)

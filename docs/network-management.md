---
title: '网络运维控制台：机制与运行记录'
type: reproduction-research
created: 2026-10-05
updated: 2026-10-05
tags: [threejs, reproduction, research]
---

# 网络运维控制台：机制与运行记录

[打开交互实验](https://weisiwu.github.io/threejs-demo/#/demo/network-management)

## 先看机制

批量操作不能只给出一个成功提示。复现将设备选择、设备锁定和单设备结果分开，批次同时返回成功与失败数量。

16 个设备各有 ID、enabled、revision 与 locked。显示数量控制可见设备及其选择范围；device-3 被设为锁定。操作只改变已选且未锁定的记录，并增加各自修订号，批次 ID 保存在 seen 集合。

## 如何核对

同时选择 device-1 与 device-3，应得到一条成功与一条锁定失败。缩小显示范围后，隐藏设备退出选择集合，避免界面看不到的对象继续被操作。

通用控件可以暂停、推进一秒和重置。推进一秒实际调用二十次 0.05 秒更新，因此机构约束与任务状态仍经过正常更新流程；它不是只把时间显示改大一秒。浏览器页签隐藏时不积累缺席时间，自动单步长上限为 0.05 秒。

## 源码入口

- [场景实现](../src/scenes/interfaces.tsx)：按 slug 分支建立部件、处理输入与输出读数。
- [数学与校验](../src/math.ts)：圆交点、逆运动学、FABRIK、网表求解、A*、指令白名单与图重写。
- [运行时](../src/runtime.ts)：单个渲染器、镜头、暂停、拾取、resize 和资源回收。
- [浏览器检查](../tests/browser/experiments.spec.ts)：桌面与 390px 手机加载、操作、参数、暂停和重置；另有网表失败、库存去重、布局持久化与资源切换用例。

读数随当前场景计算，不是写在页面里的预设成功结果。测试范围见 [验证说明](validation.md)；浏览器检查通过不能代替真实设备、科学精度或外部模型调用验收。

## 原资料与复现范围

按钮执行的是模拟状态切换。原文谈及备份等管理任务，但这里没有路由器、备份文件或远端 RPC。显示一个设备卡片并不足以证明配置已经保存；要进入真实管理系统，还需要服务器回执和任务重试语义。

网络设备和回执为本地模拟，不访问实物或公司网络。

来源包括文章或固定提交源码。复现保留可讨论的机制，界面与几何由本仓库重新实现；原工程依赖、全部资产和部署配置没有直接迁移。

1. [网络管理 UI 原文](https://logicvein.com/blog-and-news/streamlining-network-management-with-a-thoughtfully-designed-ui/)

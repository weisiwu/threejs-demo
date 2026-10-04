---
title: Three.js 实验验证范围
type: validation-record
updated: 2026-10-05
tags: [threejs, validation]
---

# 实验验证范围

验证分成数值约束和浏览器行为。每次部署前由 GitHub Actions 运行测试与构建，失败时不会发布新的 Pages 版本。

11 项机制测试覆盖两圆相交与无解、Jansen 一整圈和镜像杆长、IK 两个肘分支和不可达目标、FABRIK 根部与段长、倾斜气缸连杆距离、MNA 分压和非法网表、A* 绕障碍与封闭目标、场景指令失败保留、图重写预算、1CRN 坐标完整性。测试见 [mechanisms.test.ts](../tests/mechanisms.test.ts)。

浏览器检查对 43 个路由分别验证桌面操作与 390px 手机布局，检查画布可见且有实际 draw call。桌面流程执行主操作、调整参数、暂停、推进一秒和重置；每个路由保存一张运行画布截图。另有网表错误保留、非法场景命令、仓库重复派单与库存去重、布局持久化、React 更新路径、连续场景切换资源数量和目录筛选。

运行截图在目录卡片中使用，来自浏览器里的本仓库场景。截图只能证明捕获时的画面；运行读数和测试断言用于检查行为。GPU 计时、真实手机帧率、科学模型误差与原作像素一致性没有在本轮测量。

本机检查使用 macOS Chrome；CI 使用 Linux Chromium 与软件 WebGL。自动化检查不会调用外部 AI 模型、联网设备、图像生成或科学模拟服务。

最新完整日志与失败时的 trace 见 [GitHub Actions](https://github.com/weisiwu/threejs-demo/actions)。站点发布后还会针对实际公开 URL 检查所有路由，部署成功与公开访问结果分别记录。

---
title: 来源与许可说明
type: provenance-notice
updated: 2026-10-05
tags: [license, provenance, threejs]
---

# 来源与许可说明

这些实验根据公开文章、帖子和源码研究机制，由 weisiwu 名下的 threejs-demo 仓库独立实现。路由与 demo 名称按例子主题命名；原作者署名仅保留在来源中。

公开原资料来自 Dilum Sanjaya 的文章、X 帖子及 dilums 的 GitHub 仓库。具体链接、固定提交与文件哈希见 [来源清单](research/provenance.json)。同作者的相近机制仓库不能自动证明是某条新帖子所用的完整工程；各研究文档保留这个区别。

Jansen 杆长数值参考 responsive-strandbeest 的固定提交配置；这是一组机构参数。本仓库重新实现圆交点求解和显示，未复制原工程的组件与素材。

1CRN 结构来自 [RCSB PDB](https://www.rcsb.org/structure/1CRN)，原件下载地址与 SHA-256 见 [crambin.json](src/data/crambin.json)。只保存链 A 的 46 个 Cα 坐标；人为过渡路径不是该数据库提供的动力学过程。数据库数据使用说明见 [RCSB 网站政策](https://www.rcsb.org/pages/policies)。

依赖 Three.js、React、Vite、Playwright、TypeScript 与 tsx 由 package-lock.json 固定，保留其安装包内的许可。原仓库是否有许可记录在来源清单中；hexapod-robot-simulator 与 aisdk-threejs-starter 的根许可未取得，未镜像它们的源码。

公开仓库不包含原帖视频、会员文件、生成角色、生成环境、商业系统数据、账户会话或模型密钥。

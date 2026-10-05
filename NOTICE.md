---
title: 来源与许可说明
type: provenance-notice
updated: 2026-10-05
tags: [license, provenance, threejs]
---

# 来源与许可说明

这些实验根据公开文章、帖子、预览画面和源码重建外观与机制，由 weisiwu 名下的 threejs-demo 仓库独立实现。路由与 demo 名称按例子主题命名；原作者署名仅保留在来源中。

公开原资料来自 Dilum Sanjaya 的文章、X 帖子及 dilums 的 GitHub 仓库。具体链接、固定提交与文件哈希见 [来源清单](research/provenance.json)。同作者的相近机制仓库不能自动证明是某条新帖子所用的完整工程；各研究文档保留这个区别。

Strandbeest 参考 responsive-strandbeest 的杆长、平面构图和配色，以 Three.js 重新实现圆交点求解和显示。原仓库采用 MIT 许可，副本见 [strandbeest-LICENSE](public/assets/strandbeest-LICENSE)。

太阳系的七张纹理来自固定提交的 animated-solar-system-with-react-three-fiber；极光使用 van-allen-belts-auroras 的原 SVG，动画控制另写。素材分别保留 [太阳系 MIT 许可](public/assets/solar/LICENSE) 和 [极光 MIT 许可](public/assets/aurora-LICENSE)。来源版本、原字节哈希和发布路径见 [外观资料清单](research/appearance-provenance.json)。

世界地图使用 Natural Earth 的 110m land 多边形数据。Natural Earth 说明该数据属于公共领域，原许可说明保存在 [natural-earth-LICENSE](public/assets/natural-earth-LICENSE)。咖啡因坐标取自 PubChem CID 2519 的三维记录；只做球棍显示与缩放，不计算分子动力学。

1CRN 结构来自 [RCSB PDB](https://www.rcsb.org/structure/1CRN)，原件下载地址与 SHA-256 见 [crambin.json](src/data/crambin.json)。只保存链 A 的 46 个 Cα 坐标；人为过渡路径不是该数据库提供的动力学过程。数据库数据使用说明见 [RCSB 网站政策](https://www.rcsb.org/pages/policies)。

依赖 Three.js、React、Vite、Playwright、TypeScript 与 tsx 由 package-lock.json 固定，保留其安装包内的许可。原仓库是否有许可记录在来源清单中；hexapod-robot-simulator 与 aisdk-threejs-starter 的根许可未取得，未镜像它们的源码。

公开仓库不包含原帖视频、会员文件、生成角色、生成环境、商业系统数据、账户会话或模型密钥。

本仓库新增的 14 份简版 GLB 由 `src/models/model-kit.ts` 按参考画面重建，采用本仓库 MIT 许可。它们不是原作者的 TRELLIS、Hunyuan3D 或 World Labs 输出。几何、材质、动画、轴向与哈希见 `public/models/manifest.json`。

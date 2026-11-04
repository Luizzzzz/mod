# Cheat Bridge

为 Mindustry 添加强化版生产、运输、供电、防御方块及基地辅助建筑。内容以高速生产与强化数值为设计方向，方块默认无需研究即可使用。

## 兼容性

- 目标版本：Mindustry v9 Dev，Build 161 及更新版本；不兼容 Build 160。
- 内容定义与建设局 AI 使用 Mindustry Rhino JavaScript 脚本；模组不再包含 Java/DEX。
- 模组内部 ID `cheatBrige` 暂时保留，以避免影响已有安装和存档中的内容引用。

## 内容

- 生产：强化钻头、等离子钻头、峭壁粉碎机和多产物工厂。
- 运输：强化传送带与管道。
- 电力：消耗物品发电的反应堆与热能涡轮冷凝器。
- 防御：强化物品炮塔与电磁炮。
- 辅助：建设局管理最近己方核心周围 300 世界单位内、当前可见区域的 10 架维修/施工无人机。
- 简体中文名称和介绍：`bundles/bundle_zh_CN.properties`。

v9 Dev 的物品炮塔使用 `itemCapacity` 表示可存放的弹药物品数，使用子弹的 `ammoUsed` 表示每次射击消耗量；本模组已按该机制调整超级炮塔。

## 安装与验证

模组不需要 Java、Gradle 或 DEX 构建。将仓库内容打包成 ZIP（`mod.hjson` 放在压缩包根目录），即可导入 Mindustry；推送 `v*` 标签会自动打包并发布 ZIP。要在游戏模组浏览器中列出模组，GitHub 仓库还需添加 `mindustry-mod` topic。JS 内容和建设局脚本使用 Rhino API；在目标桌面版及 Android 版本中验证模组加载、方块内容、无人机数量、存档恢复、维修与施工行为。

脚本使用 Rhino JavaScript 语法，并通过 Mindustry 的 `extend` API 注册内容；精灵图应为 32-bit RGBA PNG，尺寸需与对应方块大小匹配。

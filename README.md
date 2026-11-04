# Cheat Bridge

为 Mindustry 添加强化版生产、运输、供电、防御方块及基地辅助建筑。内容以高速生产与强化数值为设计方向，方块默认无需研究即可使用。

## 兼容性

- 目标版本：Mindustry v9 Dev，Build 161 及更新版本；不兼容 Build 160。
- 方块数据使用 HJSON；建设局使用 Java 内容类与无人机 AI，构建会同时打包 Android 所需的 DEX。
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

使用 JDK 17 和 Gradle 执行 `gradle build`。生成的 `build/libs/CheatBridge-1.0.3.jar` 可直接放入 Mindustry 的 `mods` 目录；Android 版需安装包含该 JAR（内含 `classes.dex`）的 GitHub Release。推送 `v*` 标签会自动构建并发布以 Build 161 为目标的 Release。要在游戏模组浏览器中列出模组，GitHub 仓库还需添加 `mindustry-mod` topic。重新启动游戏后检查模组加载日志，并确认既有方块内容以及建设局无人机的维修、建造、拆除和战争迷雾限制。

模组 HJSON 可使用 VS Code 的 Mindustry HJSON 扩展检查字段名称和格式；精灵图应为 32-bit RGBA PNG，尺寸需与对应方块大小匹配。

# AuraKit

AuraKit 是一个用于解析、编辑、预览和生成 ASUS Aura Creator 灯光工程 XML 的 TypeScript 工具包。

[English documentation](README.md)

AuraKit 的目标不是假设 Aura Creator XML 格式已经完全公开，而是从真实导出的工程出发：解析 XML，提取设备和图层摘要，只修改已知字段，并尽量保留原始文档结构，最后生成可手动导入 Aura Creator 的 XML。

这个项目适合 RGB 灯效实验、AI 辅助主题生成，以及围绕 Aura Creator 导出文件构建可重复的预设工作流。

## 项目状态

AuraKit 仍处于早期阶段。解析器、XML 编辑工具、本地预览和示例生成脚本已经可以使用，但 Aura Creator XML 格式只完成了部分映射。

- 主要基于仓库内 fixture 和少量真实导出工程测试。
- 会尽量保留未知 XML 节点。
- 生成的 XML 用于手动导入 Aura Creator，不会直接控制硬件。
- 灯效 type 映射仍在验证中，目前已从用户提供的 `all.xml` 样例确认常规时间轴类型 `0` 到 `7`，以及 `11` 到 `13` 的信号同步类型。
- Aura Creator 的设备绑定和颜色模式规则都视为基于 fixture 的研究数据；真实导出的 XML 仍然是最高优先级来源。

## 功能

- 将 Aura Creator XML 解析为文档对象，并提取设备、图层摘要。
- 在保留导出 XML 结构的前提下修改已知标量字段。
- 保留 Aura Creator 的设备选择状态，包括 `index=-1` 整设备选中和键盘具体按键索引。
- 通过 TypeScript API 应用柔和的 Ocean 预设。
- 通过内置脚本生成 Ocean、Galaxy、Aurora 主题 XML。
- 在浏览器中用动态 LED 灯带预览主题效果。
- 通过同一份共享主题配方保持预览和 XML 生成一致。
- 提供 Agent Skill，支持 AI 辅助生成和迭代 Aura Creator XML。

## 环境要求

- Node.js 24
- pnpm 11

仓库包含 `mise.toml`，方便使用 mise 的贡献者切换运行环境。

## 安装

```bash
pnpm install
```

构建并验证项目：

```bash
pnpm build
pnpm test
pnpm typecheck
```

## 生成 XML

使用 Aura Creator 导出的 XML 作为输入，运行内置生成脚本：

```bash
pnpm skill:generate fixtures/minimal-aura-project.xml Ocean.xml --theme ocean --keyboard off
```

支持选项：

| 选项 | 可选值 | 默认值 |
| --- | --- | --- |
| `--theme` | `ocean`, `galaxy`, `aurora` | `ocean` |
| `--keyboard` | `off`, `on` | `off` |
| `--speed` | 数字 | 主题默认值 |
| `--brightness` | 数字 | 主题默认值 |

生成后需要手动导入 Aura Creator。如果导入成功但效果需要调整，可以根据亮度、速度、缺失设备、键盘是否参与等反馈重新生成。

主题颜色、XML 效果选择和预览行为定义在 [shared/aura-theme-recipes.json](shared/aura-theme-recipes.json)，因此本地预览和 XML 生成使用同一份来源。

## SDK 用法

```ts
import {
  applyOceanPreset,
  parseAuraProject,
  serializeAuraProject
} from "aurakit";

const project = parseAuraProject(xml);

const result = applyOceanPreset(project, {
  disableKeyboard: true,
  baseColor: "#24384f",
  flowColor: "#8eefff",
  speed: 1,
  brightness: 2,
  durationMs: 12000
});

const nextXml = serializeAuraProject(result.project);
```

常用导出：

- `parseAuraProject(xml)`：解析 XML 并提取工程摘要。
- `serializeAuraProject(project)`：将编辑后的文档重新序列化为 XML。
- `withoutLayerDevices(project, matcher)`：从图层中移除匹配设备引用。
- `deviceNameIncludes(...)` 和 `isLikelyKeyboard`：常用设备匹配工具。
- `applyOceanPreset(project, options)`：内置 Ocean 预设。
- `applyThemePreset(project, themeId, options)`：基于共享主题配方应用 XML 预设。
- `createPreviewTheme(themeId, options)`：基于共享主题配方创建预览主题。
- `renderThemeFrame(theme, timeMs)`：本地预览渲染。

## 本地预览

```bash
pnpm dev
```

打开：

```text
http://127.0.0.1:5173/
```

预览器会把设备抽象为 LED 灯带，便于在导入 Aura Creator 前观察主题效果。它是视觉近似，不是完全等同于 Aura Creator 的硬件渲染器。

## 灯效 Type

Aura Creator 会把内置灯效存为 XML 数字值。AuraKit 目前把这张表视为研究数据，而不是完整稳定的协议。

| XML type | 中文 UI | 英文名 | 状态 |
| ---: | --- | --- | --- |
| 0 | 恒亮 | Static | 已在 `all.xml` 图层 6 验证 |
| 1 | 呼吸 | Breathing | 已在 `all.xml` 图层 6 验证两段；其中包含随机和渐变，双色模式另行验证 |
| 2 | 彩色循环 | Color Cycle | 已在 `all.xml` 图层 6 验证 |
| 3 | 彩虹 | Rainbow | 已在 `all.xml` 图层 6 验证 |
| 4 | 闪烁 | Flash | 已在 `all.xml` 图层 6 验证；已验证双色模式 |
| 5 | 彗星 | Comet | 已在 `all.xml` 图层 6 验证 |
| 6 | 繁星 | Starry Night | 已在 `all.xml` 图层 6 验证 |
| 7 | 潮汐 | Tide | 已在 `all.xml` 图层 6 验证 |
| 11 | 音乐 | Music signal sync | 已在 `all.xml` 信号同步图层中验证 |
| 12 | 智能 | Smart signal sync | 已在 `all.xml` 信号同步图层中验证 |
| 13 | 同步变色 | Synchronized color change | 已在 `all.xml` 信号同步图层中验证 |

验证记录见 [docs/effect-types.md](docs/effect-types.md)。

## XML 绑定和颜色说明

Aura Creator 图层里的设备绑定表示选择状态。顶层 `<space>` 设备列表必须保留，每个图层也尽量保留完整 `<devices>` 列表：

- `<index>-1</index>` 表示整台非键盘设备在该图层被选中。
- 没有 `index` 的设备节点表示存在但未选中。
- 键盘局部区域使用具体按键索引。

已观察到的颜色模式包括：`1` 普通/固定颜色、`2` 随机颜色、`4` 呼吸/闪烁双色、`6` 渐变。双色呼吸/闪烁使用 `d1r/d1g/d1b` 和 `d2r/d2g/d2b`，主 `r/g/b` 保持为第一色。Agent 规则见 [skills/aura-creator/references/effect-patterns.md](skills/aura-creator/references/effect-patterns.md)。

## Agent Skill

本地 Agent Skill 位于 [skills/aura-creator](skills/aura-creator/SKILL.md)。它记录了安全 XML 工作流，并提供 AI Agent 生成主题变体时使用的脚本。

仓库也通过软链接把同一份 Skill 暴露给支持的 Agent 工具：

```text
.claude/skills -> ../skills
.agents/skills -> ../skills
```

## 项目结构

```text
src/
  parse.ts            XML 解析和工程摘要提取
  serialize.ts        XML 序列化
  devices.ts          设备匹配和图层设备过滤
  effects.ts          Aura Creator 灯效 type 映射
  preview/            主题模型和动画帧渲染
  presets/ocean.ts    内置 Ocean 预设
shared/
  aura-theme-recipes.json 预览和 XML 共用的主题配方
skills/
  aura-creator/        Agent Skill 和 XML 生成脚本
docs/
  aura-creator-xml.md  XML 编辑说明
  effect-types.md      灯效 type 映射说明
fixtures/
  minimal-aura-project.xml
```

## 路线图

- 增加更多 Aura Creator 导出 fixture。
- 增加更多单图层 fixture，用于验证参数语义和设备兼容性。
- 扩展 Ocean 之外的 TypeScript 预设。
- 在 XML 兼容性更明确后提供稳定 CLI。
- 提升预览器与 Aura Creator 时间轴和设备布局的匹配度。

## 贡献

欢迎贡献真实导出 fixture、灯效 type 验证、预设改进和兼容性记录。请保持 XML 编辑策略保守：保留未知字段，并优先提交能从真实 Aura Creator 导出文件验证的改动。

提交改动前建议运行：

```bash
pnpm test
pnpm typecheck
```

## 许可证

MIT。见 [LICENSE](LICENSE)。

AuraKit 是独立开源项目，与 ASUS 没有关联，也不代表 ASUS 官方认可或赞助。

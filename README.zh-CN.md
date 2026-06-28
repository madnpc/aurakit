# AuraKit

AuraKit 是一个用于 AI 辅助生成、预览和导出 ASUS Aura Creator 灯光工程 XML 的 TypeScript 项目。

英文文档: [README.md](README.md)

Aura Creator 功能很强，但实际做一个好看的灯效很麻烦：效果藏在面板里，时间轴调起来费劲，每改一次都要手动试。AuraKit 的目标就是把这件事变简单。

推荐工作流：

1. 从 Aura Creator 导出真实 XML 工程。
2. 让 AI 生成 Ocean、Galaxy、Aurora 之类的主题。
3. 先在本地浏览器里预览动态灯效。
4. 导出可导入 Aura Creator 的 XML。
5. 用户手动导入 Aura Creator。
6. 把反馈告诉 AI：太亮、太快、设备没亮、键盘被影响、导入失败。
7. AI 继续生成更好的版本。

AuraKit 不会一开始就凭空猜 Aura Creator 的私有结构。它会保留真实导出 XML 的结构，只修改已经知道的字段。

## 解决的问题

- Aura Creator 直接操作复杂，不适合反复调主题。
- AI 可以把自然语言转换成灯效意图和 XML 修改。
- 本地预览可以在导入 Aura Creator 前先看效果。
- 用户手动导入和反馈，让 XML 规则还没完全摸透时也能安全迭代。

## 当前能力

- 解析 Aura Creator XML，提取设备和图层摘要。
- 根据 Aura Creator 截图中的内置效果顺序建立初步 type 映射。
- 从图层设备绑定里移除键盘，但保留顶层设备列表。
- 给真实导出的 XML 应用柔和主题预设。
- 在浏览器里预览动态 LED 灯带。
- 提供本地 Codex/Agent Skill，让 AI 辅助生成 Aura Creator XML。
- 序列化修改后的 XML，供用户手动导入。

## 灯效 Type 映射

根据你给的 Aura Creator 截图，内置灯效顺序是：

| XML type | 中文 UI | 英文名 | 可信度 |
| ---: | --- | --- | --- |
| 0 | 恒亮 | Static | 根据 UI 顺序推断 |
| 1 | 呼吸 | Breathing | 根据 UI 顺序推断 |
| 2 | 彩色循环 | Color Cycle | 根据 UI 顺序推断 |
| 3 | 彩虹 | Rainbow | 根据 UI 顺序推断 |
| 4 | 闪烁 | Flash | 根据 UI 顺序推断 |
| 5 | 彗星 | Comet | 已通过导出 XML 验证 |
| 6 | 繁星 | Starry Night | 根据 UI 顺序推断 |
| 7 | 潮汐 | Tide | 已通过导出 XML 验证 |

目前 `5 = 彗星 / Comet`、`7 = 潮汐 / Tide` 已经从导出 XML 确认；其它类型先按截图顺序推断，后面用单图层导出逐个验证。

## 安装

```bash
pnpm install
```

## 本地预览

```bash
pnpm dev
```

打开：

```text
http://127.0.0.1:5173/
```

第一版预览器会把设备抽象成灯带：

- Motherboard
- ARGB Header 1/2/3
- Memory A2/B2
- Keyboard

默认键盘关闭。

## 生成 XML

使用内置 Skill 脚本：

```bash
pnpm skill:generate fixtures/minimal-aura-project.xml Ocean.xml --theme ocean --keyboard off
```

支持主题：

- `ocean`
- `galaxy`
- `aurora`

生成后，把 XML 手动导入 Aura Creator。如果效果不对，告诉 AI 具体反馈，例如：

- 太亮
- 太快
- 键盘还是变了
- ARGB 2 没亮
- 导入失败

然后让 AI 继续生成下一版。

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

## Skills

本地 Skill 位于：

[skills/aura-creator/SKILL.md](skills/aura-creator/SKILL.md)

仓库也通过软链接把同一份 Skill 暴露给不同 Agent 工具：

```text
.claude/skills -> ../skills
.agents/skills -> ../skills
```

Skill 工作流：

1. 用户提供 Aura Creator 导出的 XML。
2. AI 读取 Skill 的 XML 规则和主题配方。
3. AI 调用 Node 脚本生成新的 XML。
4. 用户手动导入 Aura Creator。
5. AI 根据反馈继续调整。

## 项目结构

```text
src/
  parse.ts            XML 解析和工程摘要
  serialize.ts        XML 序列化
  devices.ts          设备匹配和图层设备过滤
  effects.ts          Aura Creator 灯效类型映射
  preview/            主题模型和动画帧渲染
  presets/ocean.ts    Ocean 预设
skills/
  aura-creator/        AI 生成 Aura Creator XML 的 Agent Skill
.claude/skills         指向 ./skills 的软链接
.agents/skills         指向 ./skills 的软链接
docs/
  aura-creator-xml.md  XML 工作流笔记
  effect-types.md      灯效类型映射表
fixtures/
  minimal-aura-project.xml
```

## 愿景

AuraKit 希望成为 RGB 灯效自动化的开源基础设施。Aura Creator 是第一个 backend；未来可以继续扩展预设主题、CLI、主题 DSL、可视化编辑器，以及 Codex / Claude Code / Cursor 等 AI 工作流。

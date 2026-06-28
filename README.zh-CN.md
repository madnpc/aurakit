# AuraKit

AuraKit 是一个用于解析、编辑、预览和生成 ASUS Aura Creator 灯光工程 XML 的 TypeScript 项目。

英文文档: [README.md](README.md)

这个项目的核心思路不是凭空猜 Aura Creator 的私有格式，而是：

1. 用户先从 Aura Creator 导出真实 XML 工程。
2. AuraKit 保留原始 XML 结构，只修改已知字段。
3. 生成新的 XML。
4. 用户手动导入 Aura Creator 验证。
5. AI 根据用户反馈继续调整。

## 项目定位

本地项目主要负责两件事：

- **预览器**：在浏览器里预览主题效果，比如 Ocean 水流、Galaxy 银河、Aurora 极光。
- **XML 工具链**：给 SDK、CLI 和 Skill 复用，用来解析、修改、生成 Aura Creator XML。

Skill 更偏产品核心：让 AI 根据自然语言生成好看的灯效 XML，然后通过用户手动导入反馈不断完善。

## 当前能力

- 解析 Aura Creator XML，提取设备和图层摘要。
- 识别已验证灯效类型：`5 = 彗星 / Comet`，`7 = 潮汐 / Tide`。
- 从图层设备绑定里移除键盘，但保留顶层设备列表。
- 应用柔和 Ocean 预设。
- 在浏览器里预览动态 LED 灯带。
- 提供本地 Codex Skill，让 AI 辅助生成 Aura Creator XML。

## 安装

```bash
pnpm install
```

## 浏览器预览

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
node skills/aura-creator/scripts/generate-aura-xml.mjs \
  fixtures/minimal-aura-project.xml \
  Ocean.xml \
  --theme ocean \
  --keyboard off
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

## Codex Skill

Skill 位于：

[skills/aura-creator/SKILL.md](skills/aura-creator/SKILL.md)

使用方式：

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
  aura-creator/        AI 生成 Aura Creator XML 的 Codex Skill
docs/
  aura-creator-xml.md  XML 工作流笔记
  effect-types.md      灯效类型映射表
fixtures/
  minimal-aura-project.xml
```

## 愿景

AuraKit 希望成为 RGB 灯效自动化的开源基础设施。Aura Creator 是第一个 backend；未来可以继续扩展预设主题、CLI、主题 DSL、可视化编辑器，以及 Codex / Claude Code / Cursor 等 AI 工作流。

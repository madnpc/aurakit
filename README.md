# AuraKit

TypeScript toolkit and local preview app for AI-assisted ASUS Aura Creator lighting projects.

中文文档: [README.zh-CN.md](README.zh-CN.md)

Aura Creator is powerful, but building a polished lighting project in it is slow: effects are hidden behind UI panels, timelines are tedious to adjust, and every change usually requires manual trial and error. AuraKit exists to make that workflow simpler.

The intended loop is:

1. Export a real Aura Creator XML project.
2. Ask AI for a theme such as Ocean, Galaxy, or Aurora.
3. Preview the effect locally as animated LED strips.
4. Generate an importable Aura Creator XML file.
5. Import it manually into Aura Creator.
6. Tell the AI what felt wrong: too bright, too fast, missing device, keyboard changed, import failed.
7. Generate a better version.

AuraKit is deliberately conservative with XML. It preserves the exported project shape, edits known fields, and avoids inventing unsupported Aura Creator structures.

## What This Solves

- Aura Creator is hard to operate directly for repeated theme design.
- AI can translate natural language into lighting intent and XML edits.
- Local preview makes the result visible before importing into Aura Creator.
- Manual import feedback keeps the workflow safe while the XML rules are still being mapped.

## Current Capabilities

- Parse Aura Creator XML into a document plus typed summaries for devices and layers.
- Map the built-in effect order from the Aura Creator UI screenshot.
- Remove keyboard references from layer device bindings while keeping the device catalog.
- Apply soft preset themes to existing exported projects.
- Preview a theme as animated LED strips in the browser.
- Provide a local Codex/agent skill for AI-assisted Aura Creator XML generation.
- Serialize the edited XML back to an importable file.

## Effect Type Map

The Aura Creator UI shows the built-in effects in this order:

| XML type | Chinese UI | English name | Confidence |
| ---: | --- | --- | --- |
| 0 | 恒亮 | Static | Inferred from UI order |
| 1 | 呼吸 | Breathing | Inferred from UI order |
| 2 | 彩色循环 | Color Cycle | Inferred from UI order |
| 3 | 彩虹 | Rainbow | Inferred from UI order |
| 4 | 闪烁 | Flash | Inferred from UI order |
| 5 | 彗星 | Comet | Verified from exported timeline |
| 6 | 繁星 | Starry Night | Inferred from UI order |
| 7 | 潮汐 | Tide | Verified from exported timeline |

`5 = Comet` and `7 = Tide` have already been confirmed from exported XML. The other values are inferred from the screenshot order and should be verified with one-layer exports.

## Install

```bash
pnpm install
```

## Local Preview

```bash
pnpm dev
```

Open:

```text
http://127.0.0.1:5173/
```

The first preview models devices as LED strips:

- Motherboard
- ARGB Header 1/2/3
- Memory A2/B2
- Keyboard

Keyboard lighting is off by default.

## Generate XML

Use the bundled skill script:

```bash
pnpm skill:generate fixtures/minimal-aura-project.xml Ocean.xml --theme ocean --keyboard off
```

Supported script themes:

- `ocean`
- `galaxy`
- `aurora`

The generated XML should be manually imported into Aura Creator. If it imports but looks wrong, give the AI feedback such as "too bright", "too fast", "ARGB 2 missing", or "keyboard still changed", then generate another version.

## SDK Usage

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

The local skill lives in [skills/aura-creator](skills/aura-creator/SKILL.md). The repository also exposes the same skill through symlinks for agent tools:

```text
.claude/skills -> ../skills
.agents/skills -> ../skills
```

Skill workflow:

1. User exports a real Aura Creator XML project.
2. AI uses the skill rules and Node script to generate a themed XML.
3. User manually imports the XML into Aura Creator.
4. AI refines the file from user feedback.

## Project Layout

```text
src/
  parse.ts            XML parser and project summary extraction
  serialize.ts        XML serialization
  devices.ts          Device matching and layer device filtering
  effects.ts          Aura Creator effect type mapping
  preview/            Theme model and animation frame renderer
  presets/ocean.ts    First soft Ocean preset
skills/
  aura-creator/        Agent skill for AI-assisted XML generation
.claude/skills         Symlink to ./skills
.agents/skills         Symlink to ./skills
docs/
  aura-creator-xml.md  Notes about the XML workflow
  effect-types.md      Effect mapping table
fixtures/
  minimal-aura-project.xml
```

## Vision

AuraKit aims to become the open-source foundation for RGB lighting automation. Aura Creator is the first backend; the long-term shape can include reusable presets, a CLI, a theme DSL, a visual editor, and integrations for Codex, Claude Code, Cursor, or other AI agents.

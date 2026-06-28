# AuraKit

TypeScript toolkit for parsing, editing and generating ASUS Aura Creator lighting projects.

中文文档: [README.zh-CN.md](README.zh-CN.md)

AuraKit is intentionally starting as a conservative XML editor: export a real Aura Creator project, let AuraKit parse and adjust it, then import the result back into Aura Creator. That gives the project a stable path toward presets, a CLI, a DSL, and AI-assisted lighting generation without guessing unsupported XML.

The local project has two jobs:

- Preview and tune RGB themes before exporting.
- Provide reusable XML tooling for the bundled Codex skill.

The skill has the more important product role: let AI generate good lighting effects from natural language, write an importable XML file, then improve it from the user's manual Aura Creator import feedback.

## Status

Early experimental SDK. The current code can:

- Parse Aura Creator XML into a document plus typed summaries for devices and layers.
- Identify verified effect types: `5 = Comet`, `7 = Tide`.
- Remove keyboard references from layer device bindings while keeping the device catalog.
- Apply a soft Ocean preset to existing layers.
- Preview a theme as animated LED strips in the browser.
- Provide a local Codex skill for AI-assisted Aura Creator XML generation.
- Serialize the edited XML back to a file.

## Install

```bash
pnpm install
```

## Usage

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

Run the example against the included fixture:

```bash
pnpm build
node dist/examples/ocean.js fixtures/minimal-aura-project.xml Ocean.xml
```

Run the browser preview:

```bash
pnpm dev
```

Generate XML with the bundled skill script:

```bash
node skills/aura-creator/scripts/generate-aura-xml.mjs \
  fixtures/minimal-aura-project.xml \
  Ocean.xml \
  --theme ocean \
  --keyboard off
```

The generated XML should be manually imported into Aura Creator. If it imports but looks wrong, give the AI feedback such as "too bright", "too fast", "ARGB 2 missing", or "keyboard still changed", then generate another version.

## Skill

The local skill lives in [skills/aura-creator](skills/aura-creator/SKILL.md). It is designed for Codex/agent workflows:

1. User exports a real Aura Creator XML project.
2. AI uses the skill rules and Node script to generate a themed XML.
3. User manually imports the XML into Aura Creator.
4. AI refines the file from user feedback.

Supported script themes:

- `ocean`
- `galaxy`
- `aurora`

## Project Layout

```text
src/
  parse.ts            XML parser and project summary extraction
  serialize.ts        XML serialization
  devices.ts          Device matching and layer device filtering
  effects.ts          Verified Aura Creator effect type mapping
  preview/            Theme model and animation frame renderer
  presets/ocean.ts    First soft Ocean preset
docs/
  aura-creator-xml.md Notes about the XML workflow
  effect-types.md     Verified effect mapping table
fixtures/
  minimal-aura-project.xml
skills/
  aura-creator/        Codex skill for AI-assisted XML generation
```

## Vision

AuraKit aims to become the open-source foundation for RGB lighting automation. Aura Creator is the first backend; the long-term shape can include reusable presets, a CLI, a simple theme DSL, and integrations for Codex, Claude Code, Cursor, or other coding agents.

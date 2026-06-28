# AuraKit

TypeScript toolkit for parsing, editing, previewing, and generating ASUS Aura Creator lighting project XML.

[中文文档](README.zh-CN.md)

AuraKit helps automate Aura Creator workflows without treating the XML format as fully known. It starts from a real exported project, builds a typed summary of the devices and layers, applies conservative edits to known fields, and serializes the original document shape back to XML for manual import.

The project is intended for RGB lighting experiments, AI-assisted theme generation, and repeatable preset development around Aura Creator exports.

## Status

AuraKit is an early-stage project. The parser, XML editing helpers, preview renderer, and example generator are usable, but the Aura Creator XML format is only partially mapped.

- Tested primarily against the included fixture and limited exported projects.
- Unknown XML nodes are preserved wherever possible.
- XML is generated for manual import into Aura Creator, not direct device control.
- Effect type mapping is partially verified from exports, including `5 = Comet`, `7 = Tide`, and signal-sync types `11` through `13`.
- Aura Creator binding and color-mode rules are treated as fixture-backed research data; exported XML remains the source of truth.

## Features

- Parse Aura Creator XML into a document plus typed summaries for devices and layers.
- Preserve the exported XML structure while mutating known scalar fields.
- Preserve Aura Creator device selection state, including `index=-1` whole-device bindings and explicit keyboard key indexes.
- Apply a soft Ocean preset through the TypeScript API.
- Generate Ocean, Galaxy, and Aurora themed XML through the bundled helper script.
- Preview theme behavior locally as animated LED strips in the browser.
- Keep preview behavior and XML generation aligned through one shared theme recipe file.
- Provide an agent skill for AI-assisted Aura Creator XML generation and refinement.

## Requirements

- Node.js 24
- pnpm 11

The repository includes `mise.toml` for contributors who use mise.

## Installation

```bash
pnpm install
```

Build and verify the package:

```bash
pnpm build
pnpm test
pnpm typecheck
```

## Generate XML

Use the bundled generator with an Aura Creator XML export:

```bash
pnpm skill:generate fixtures/minimal-aura-project.xml Ocean.xml --theme ocean --keyboard off
```

Supported options:

| Option | Values | Default |
| --- | --- | --- |
| `--theme` | `ocean`, `galaxy`, `aurora` | `ocean` |
| `--keyboard` | `off`, `on` | `off` |
| `--speed` | number | theme default |
| `--brightness` | number | theme default |

Import the generated XML manually in Aura Creator. If the import succeeds but the result needs tuning, adjust the options or regenerate from feedback such as brightness, speed, missing devices, or keyboard participation.

Theme colors, XML effect choices, and preview behavior are defined in [shared/aura-theme-recipes.json](shared/aura-theme-recipes.json), so preview and XML generation use the same source.

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

Useful exports include:

- `parseAuraProject(xml)` for XML parsing and summary extraction.
- `serializeAuraProject(project)` for writing the edited document back to XML.
- `withoutLayerDevices(project, matcher)` for removing device references from layers.
- `deviceNameIncludes(...)` and `isLikelyKeyboard` for common device matching.
- `applyOceanPreset(project, options)` for the built-in Ocean preset.
- `applyThemePreset(project, themeId, options)` for shared-recipe XML presets.
- `createPreviewTheme(themeId, options)` for shared-recipe preview themes.
- `renderThemeFrame(theme, timeMs)` for local preview rendering.

## Local Preview

```bash
pnpm dev
```

Open:

```text
http://127.0.0.1:5173/
```

The preview models devices as LED strips so presets can be evaluated before importing XML into Aura Creator. It is a visual approximation, not a hardware-accurate Aura Creator renderer.

## Effect Types

Aura Creator stores built-in effects as numeric XML values. AuraKit currently treats the map as research data rather than a complete contract.

| XML type | Chinese UI | Effect | Status |
| ---: | --- | --- | --- |
| 0 | 恒亮 | Static | Inferred from UI order |
| 1 | 呼吸 | Breathing | Inferred from UI order; dual-color mode verified |
| 2 | 彩色循环 | Color Cycle | Inferred from UI order |
| 3 | 彩虹 | Rainbow | Inferred from UI order |
| 4 | 闪烁 | Flash | Inferred from UI order; dual-color mode verified |
| 5 | 彗星 | Comet | Verified from exported timeline |
| 6 | 繁星 | Starry Night | Inferred from UI order |
| 7 | 潮汐 | Tide | Verified from exported timeline |
| 11 | 音乐 | Music signal sync | Verified from exported fixture |
| 12 | 智能 | Smart signal sync | Verified from exported fixture |
| 13 | 同步变色 | Synchronized color change | Verified from exported fixture |

See [docs/effect-types.md](docs/effect-types.md) for verification notes.

## XML Binding And Color Notes

Aura Creator layer device bindings are selection state. Keep the top-level `<space>` catalog intact, and prefer preserving each layer's full `<devices>` list:

- `<index>-1</index>` selects a whole non-keyboard device for that layer.
- A device node with no `index` is present but not selected.
- Keyboard regions use explicit key indexes.

Observed color modes include `1` for normal/fixed color, `2` for random color, `4` for dual-color Breathing/Flash, and `6` for gradient. Dual-color Breathing and Flash use `d1r/d1g/d1b` and `d2r/d2g/d2b`; keep primary `r/g/b` aligned with the first color. See [skills/aura-creator/references/effect-patterns.md](skills/aura-creator/references/effect-patterns.md) for the agent-facing rules.

## Agent Skill

The local agent skill lives in [skills/aura-creator](skills/aura-creator/SKILL.md). It documents the safe XML workflow and provides the helper script used by AI agents to generate theme variants.

The repository also exposes the same skill through symlinks for supported agent tools:

```text
.claude/skills -> ../skills
.agents/skills -> ../skills
```

## Project Layout

```text
src/
  parse.ts            XML parser and project summary extraction
  serialize.ts        XML serialization
  devices.ts          Device matching and layer device filtering
  effects.ts          Aura Creator effect type mapping
  preview/            Theme model and animation frame renderer
  presets/ocean.ts    Built-in Ocean preset
shared/
  aura-theme-recipes.json Shared theme source for preview and XML
skills/
  aura-creator/        Agent skill and XML generator script
docs/
  aura-creator-xml.md  XML editing notes
  effect-types.md      Effect type mapping notes
fixtures/
  minimal-aura-project.xml
```

## Roadmap

- Add fixtures from more Aura Creator exports.
- Verify the remaining effect type values with one-layer projects.
- Expand preset coverage beyond Ocean.
- Introduce a stable CLI once XML compatibility is better understood.
- Improve preview parity with Aura Creator timing and device layouts.

## Contributing

Contributions are welcome, especially exported fixtures, effect type verification, preset improvements, and compatibility notes. Please keep XML edits conservative: preserve unknown fields and prefer changes that can be verified from real Aura Creator exports.

Before opening a change, run:

```bash
pnpm test
pnpm typecheck
```

## License

MIT. See [LICENSE](LICENSE).

AuraKit is an independent open-source project and is not affiliated with, endorsed by, or sponsored by ASUS.

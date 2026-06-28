# Aura Creator XML Rules

Use exported XML as the source of truth.

## Known Effect Types

| type | Effect | Confidence |
| ---: | --- | --- |
| 0 | Static | Inferred from UI order |
| 1 | Breathing | Inferred from UI order |
| 2 | Color Cycle | Inferred from UI order |
| 3 | Rainbow | Inferred from UI order |
| 4 | Flash | Inferred from UI order |
| 5 | Comet | Verified |
| 6 | Starry Night | Inferred from UI order |
| 7 | Tide | Verified |

## Editing Principles

- Keep XML declaration, root element, unknown fields, and top-level device catalog.
- Modify existing scalar fields such as `type`, `color`, `speed`, `brightness`, `duration`, `start`, and `angle` only when present.
- Remove keyboard participation from layer-level `<devices>`, not from the project-level `<devices>` list.
- If there are no layers, ask the user to export a project with at least one official effect layer.
- If import fails, revert to fewer edits: first only remove keyboard, then only adjust colors, then effect type/speed.

## Device Matching Hints

Likely keyboard names include:

- `keyboard`
- `falchion`
- `azoth`
- `strix scope`

Common desired device groups:

- motherboard
- addressable header / ARGB
- memory / DIMM
- GPU
- cooler / AIO

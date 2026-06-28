---
name: aura-creator
description: Generate, edit, and refine ASUS Aura Creator XML lighting project files from natural-language theme requests. Use when the user wants an importable Aura Creator XML/profile, wants to exclude devices such as keyboards, asks for RGB lighting themes like Ocean/Galaxy/Aurora, provides exported Aura Creator XML, or wants AI-assisted iteration after manually importing and testing an XML file.
---

# Aura Creator

Create importable Aura Creator XML by editing a real exported project. Prefer generated XML that the user manually imports into Aura Creator, then refine from their feedback.

## Never do this

- **Never hand-author Aura Creator XML or invent a schema from memory.** The real format is `<root>` → `<space>` (device catalog) → `<layers>` → `<effect>` (~60 fields per effect). Anything you write from scratch will be missing fields and will fail to import. The output must be a copy of the user's exported file with only scalar edits and device removals — produced by the script in step 4, not typed by hand.
- If the user has not provided an exported XML, **stop and ask for one.** Do not fabricate a starting file.

## Workflow

1. Ask for an exported Aura Creator XML/project file if the user has not provided one.
2. Read `references/xml-rules.md` before editing XML structure or effect types.
3. Read `references/effect-patterns.md` when working with signal-sync effects, gradients, random colors, color cycle, or multi-segment timelines.
4. Read `references/theme-recipes.md` when designing a named theme or interpreting vague style words.
5. Prefer the Node script:

   ```bash
   node skills/aura-creator/scripts/generate-aura-xml.mjs <input.xml> <output.xml> --theme ocean --keyboard off
   ```

6. Verify the output before delivering it (see "Verify before delivering"). Never hand the user a file you have not checked against the source.
7. Give the user the output XML path and ask them to import it manually into Aura Creator.
8. When the user reports the result, adjust the XML conservatively and generate a new version.

## Verify before delivering

The generator edits a parsed tree, so a wrong field selector can silently corrupt the file (a past bug overwrote each device binding's `type="Keyboard"` attribute with the effect-type number, and `--keyboard off` failed to remove the keyboard because device names live in the `@_name` attribute). Always confirm against the source export:

- **Root + catalog intact:** output still starts with `<root>` and the `<space>` device catalog has the same devices (with `folder`/`csv`/`png`/`type` attributes) as the input.
- **Device `type` attributes uncorrupted:** `grep -o 'name="[^"]*" type="[0-9]'` returns nothing — device bindings keep `type="Keyboard|Motherboard|AddressableStrip|DIMM"`, never a bare number.
- **Keyboard removal worked:** with `--keyboard off`, keyboard layer bindings either are absent or remain unselected with no `<index>` values; intentional keyboard layers may keep explicit key indexes.
- **Structure preserved:** `colorPoint`/`gradientPoint` counts match the input; layer count matches unless deliberately removing no-effect placeholder layers; only intended scalar edits changed, such as layer names, `type`, `speed`, `brightness`, `start`, `duration`, and `r`/`g`/`b`.
- **Base layer is truly constant:** when generating a constant-base version, the Base layer is `type=0`, starts at `0`, spans the whole visible timeline, and is bound to every intended non-keyboard device.
- **Special effects preserved:** signal-sync layers keep exactly one effect per layer, and multi-segment layers preserve intended effect count, `start`, and `duration` ordering.

If any check fails, fix the script rather than shipping the file.

## Generation Rules

- Preserve the exported XML shape. Do not invent unknown Aura Creator nodes when an existing exported project can be edited.
- Keep the top-level device catalog intact. Remove unwanted devices only from layer bindings.
- Default to `--keyboard off` unless the user explicitly wants keyboard lighting.
- For soft themes, prefer low brightness, slow speed, and layered effects instead of rainbow-heavy output.
- Prefer a readable layer layout: name effect layers after the device or device group they target, and keep a `Base - 常亮底色` / `Base - Constant` static layer at the bottom for the always-on color.
- Preserve each layer's complete device binding list when possible. For whole-device selection, keep the device node and set `<index>-1</index>`; for unselected devices, keep the device node with no `index`; for keyboard key regions, preserve the explicit key indexes.
- A constant Base layer must begin at timeline `0` and run through the full project duration; do not leave inherited starts such as `3000` unless the user explicitly asks for delayed base lighting.
- Treat these effect types as known:
  - `0` Static, inferred from UI order
  - `1` Breathing, inferred from UI order
  - `2` Color Cycle, inferred from UI order
  - `3` Rainbow, inferred from UI order
  - `4` Flash, inferred from UI order
  - `5` Comet, verified
  - `6` Starry Night, inferred from UI order
  - `7` Tide, verified
  - `11` Music signal sync, observed in `fixtures/all.xml`
  - `12` Smart signal sync, observed in `fixtures/all.xml`
  - `13` Synchronized color change, observed in `fixtures/all.xml`

## Script Usage

```bash
node skills/aura-creator/scripts/generate-aura-xml.mjs input.xml output.xml \
  --theme ocean \
  --keyboard off \
  --speed 1 \
  --brightness 2 \
  --layout device-base-bottom
```

Themes currently supported by the script:

- `ocean`: deep blue base, ice-blue Tide, soft Comet crest.
- `galaxy`: dark violet base, blue-violet Tide, pale star crest.
- `aurora`: dark green base, cyan-green Tide, soft moving highlight.

If the script cannot find editable layer/effect fields, explain that the user should export a project with at least one real Aura Creator layer/effect and try again.

## Output Style

Return concise instructions:

- Output file path.
- Theme and device choices applied.
- What the user should verify after importing.
- The next feedback to provide, such as speed too fast, color too bright, device missing, or import failed.

---
name: aura-creator
description: Generate, edit, and refine ASUS Aura Creator XML lighting project files from natural-language theme requests. Use when the user wants an importable Aura Creator XML/profile, wants to exclude devices such as keyboards, asks for RGB lighting themes like Ocean/Galaxy/Aurora, provides exported Aura Creator XML, or wants AI-assisted iteration after manually importing and testing an XML file.
---

# Aura Creator

Create importable Aura Creator XML by editing a real exported project. Prefer generated XML that the user manually imports into Aura Creator, then refine from their feedback.

## Workflow

1. Ask for an exported Aura Creator XML/project file if the user has not provided one.
2. Read `references/xml-rules.md` before editing XML structure or effect types.
3. Read `references/theme-recipes.md` when designing a named theme or interpreting vague style words.
4. Prefer the Node script:

   ```bash
   node skills/aura-creator/scripts/generate-aura-xml.mjs <input.xml> <output.xml> --theme ocean --keyboard off
   ```

5. Give the user the output XML path and ask them to import it manually into Aura Creator.
6. When the user reports the result, adjust the XML conservatively and generate a new version.

## Generation Rules

- Preserve the exported XML shape. Do not invent unknown Aura Creator nodes when an existing exported project can be edited.
- Keep the top-level device catalog intact. Remove unwanted devices only from layer bindings.
- Default to `--keyboard off` unless the user explicitly wants keyboard lighting.
- For soft themes, prefer low brightness, slow speed, and layered effects instead of rainbow-heavy output.
- Treat these effect types as known:
  - `0` Static, inferred from UI order
  - `1` Breathing, inferred from UI order
  - `2` Color Cycle, inferred from UI order
  - `3` Rainbow, inferred from UI order
  - `4` Flash, inferred from UI order
  - `5` Comet, verified
  - `6` Starry Night, inferred from UI order
  - `7` Tide, verified

## Script Usage

```bash
node skills/aura-creator/scripts/generate-aura-xml.mjs input.xml output.xml \
  --theme ocean \
  --keyboard off \
  --speed 1 \
  --brightness 2
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

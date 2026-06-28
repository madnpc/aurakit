# Aura Creator XML Rules

Use exported XML as the source of truth. Never reconstruct this format from memory — copy a real export and edit it.

## Document Structure

A real exported project looks like:

```
<root>
  <version>4.5.4.0</version>
  <space>                         <!-- device catalog; keep intact -->
    <device name="..." folder="..." csv="..." png="..." type="Keyboard"><x>0</x><y>3</y></device>
    ... one per physical device ...
  </space>
  <layers>
    <layer name="..." trigger="OneClick" Eye="True">
      <devices>                   <!-- per-layer bindings; remove devices here -->
        <device name="..." type="Keyboard" />
        <device name="..." type="DIMM"><index>-1</index></device>   <!-- index -1 = whole device selected -->
      </devices>
      <effects>
        <effect>                  <!-- ~60 fields; only edit scalars listed below -->
          <type>7</type> <a>255</a> <r>0</r> <g>235</g> <b>255</b> ...
          <speed>2</speed> <brightness>3</brightness> <angle>90</angle>
          <colorPointList>...</colorPointList>
          <gradientPointList>...</gradientPointList>
          <start>3000</start> <duration>2000</duration>
        </effect>
      </effects>
    </layer>
  </layers>
</root>
```

There is no `<?xml?>` declaration and no `<AuraCreatorProject>` / `<kind>` / `<color>` nodes — if you see those, the file was fabricated and will not import.

## Parser Pitfall (fast-xml-parser)

The generator parses with `attributeNamePrefix: "@_"`, so attributes become keys like `@_name` and `@_type`, while child elements are plain keys (`name`, `type`, ...).

- Read a device's name via `@_name`, not `name` (the latter is undefined → keyboard filtering silently fails).
- When setting an effect scalar named `type`, skip `@_`-prefixed keys, or you will overwrite a device binding's `@_type` attribute instead of the effect's `<type>` element.

## Known Effect Types

| type | Effect | Confidence |
| ---: | --- | --- |
| 0 | Static | Verified in `all.xml` layer 6 |
| 1 | Breathing | Verified twice in `all.xml` layer 6 |
| 2 | Color Cycle | Verified in `all.xml` layer 6 |
| 3 | Rainbow | Verified in `all.xml` layer 6 |
| 4 | Flash | Verified in `all.xml` layer 6 |
| 5 | Comet | Verified in `all.xml` layer 6 |
| 6 | Starry Night | Verified in `all.xml` layer 6 |
| 7 | Tide | Verified in `all.xml` layer 6 |
| 11 | Music signal sync | Observed + user-confirmed |
| 12 | Smart signal sync | Observed + user-confirmed |
| 13 | Synchronized color change | Observed + user-confirmed |

## Editing Principles

- Keep XML declaration, root element, unknown fields, and top-level device catalog.
- Modify existing scalar fields such as `type`, `color`, `speed`, `brightness`, `duration`, `start`, and `angle` only when present.
- Prefer preserving the full layer-level `<devices>` list and editing selection state instead of deleting non-target device nodes. Aura Creator uses these nodes as selection state, not just membership.
- Treat `<index>-1</index>` inside a non-keyboard layer device binding as "the whole device is selected". A device binding with no `index` is present but not selected for that layer. Keyboard partial selections use many explicit key indexes.
- Remove keyboard participation by clearing keyboard `index` values or omitting keyboard bindings from non-keyboard layers, not by touching the project-level `<space>` catalog.
- When naming layers after devices, name them after devices with selected indexes (`-1` for whole-device selection, explicit key indexes for keyboards), not after unselected device nodes or inherited export names.
- Prefer device/group layer names over generic or stale names such as `Layer 6` or `键盘` after keyboard removal. Examples: `主板 - 潮汐`, `ARGB 灯带 - 彗星`, `内存 A2 - 彗星`.
- When a project uses a constant base color, keep a bottom `Base - 常亮底色` / `Base - Constant` layer bound to every intended non-keyboard device. Its effect should be `type=0`, `start=0`, and `duration` long enough to span the whole visible timeline.
- Keep signal-sync effects (`type=11`, `12`, `13`) as single-effect layers. They are not normal multi-segment timeline layers.
- Treat the user-provided `all.xml` as a reference catalog, not as a profile base. Its layer 6 intentionally includes Static, two Breathing samples, Color Cycle, Rainbow, Flash, Comet, Starry Night, and Tide.
- Multi-segment normal layers may contain multiple `<effect>` nodes. Preserve their order and `start`/`duration` sequence unless intentionally editing the timeline.
- Preserve `colorPointList` and `gradientPointList` node counts. For gradient mode, prefer editing existing point colors over adding/removing points.
- For dual-color Breathing/Flash, use `colormodeselection=4`, set `d1*` and `d2*` to the two colors, and keep primary `r/g/b` aligned with the first color.
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

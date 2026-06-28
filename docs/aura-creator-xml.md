# Aura Creator XML Notes

AuraKit starts from the safest workflow:

1. Export a real Aura Creator project.
2. Parse the XML into a document object.
3. Extract a small typed summary for devices and layers.
4. Mutate only known fields.
5. Serialize the document back to XML.

This keeps the original project shape as the source of truth. The library should avoid inventing unsupported Aura Creator XML structures until those structures are verified from exported files.

## Known Shape

The fixture in `fixtures/minimal-aura-project.xml` uses the shape AuraKit currently understands:

```xml
<devices>
  <device>
    <name>ROG FALCHION ACE 75 HE</name>
  </device>
</devices>

<layers>
  <layer>
    <effect>
      <type>7</type>
      <color>#8eefff</color>
      <speed>1</speed>
      <brightness>2</brightness>
      <duration>12000</duration>
    </effect>
    <devices>
      <device>
        <name>TUF GAMING B650M-PLUS WIFI</name>
      </device>
    </devices>
  </layer>
</layers>
```

Real Aura Creator exports may include additional fields. Keep those fields intact unless a fixture proves how they should be edited.

## Current Editing Rules

- `withoutLayerDevices` removes device references from layers, but keeps the top-level device catalog.
- `applyOceanPreset` changes existing layer fields where matching scalar keys already exist.
- The preset sets `type=7` for Tide, slows speed, lowers brightness, and removes likely keyboard refs by default.
- In real Aura Creator exports, layer-level device nodes represent selection state. Prefer preserving the full `<devices>` list and editing `index` values instead of deleting non-target devices.
- `<index>-1</index>` selects a whole non-keyboard device. A device node with no `index` is present but not selected. Keyboard regions use explicit key indexes.
- Signal-sync effects (`type=11`, `12`, `13`) should remain single-effect layers. Normal timeline layers may contain multiple ordered `<effect>` nodes.
- The user-provided `all.xml` sample is a reference catalog, not a theme-generation base. Its layer 6 verifies the normal effect sequence `0` Static, `1` Breathing random, `1` Breathing gradient, `2` Color Cycle, `3` Rainbow, `4` Flash, `5` Comet, `6` Starry Night, and `7` Tide.
- `colormodeselection=4` is dual-color mode for Breathing (`type=1`) and Flash (`type=4`): set primary `r/g/b` and `d1*` to the first color, and `d2*` to the second color.
- `colormodeselection=6` is gradient mode in observed exports. Preserve `gradientPointList` count and coordinates unless the export under edit proves a different structure.

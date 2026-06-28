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

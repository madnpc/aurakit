# Aura Effect Patterns

Use this reference after reading a real Aura Creator export. It records observed effect semantics from the user-provided `all.xml` sample and user-confirmed behavior.

`all.xml` is a reference catalog for learning Aura Creator rules, not a theme-generation base unless the user explicitly asks to reuse it.

## Effect Types

Known base effects:

| type | Effect | Notes |
| ---: | --- | --- |
| 0 | Static | Can be fixed color or gradient depending on `colormodeselection`. |
| 1 | Breathing | Can be random color or gradient depending on `colormodeselection`. |
| 2 | Color Cycle | Observed as a normal timeline segment. |
| 3 | Rainbow | Observed as a normal timeline segment. |
| 4 | Flash | Can be random color or dual color depending on `colormodeselection`. |
| 5 | Comet | Verified earlier; observed as a normal timeline segment. |
| 6 | Starry Night | Observed as a normal timeline segment. |
| 7 | Tide | Verified earlier; observed as a normal timeline segment. |
| 11 | Music signal sync | Keep as a single-effect layer. |
| 12 | Smart signal sync | Keep as a single-effect layer. |
| 13 | Synchronized color change | Keep as a single-effect layer. |

Signal-sync effects (`11`, `12`, `13`) are special: keep one effect per layer. Do not combine them with other sequential effects in the same layer unless a user provides an Aura export proving that layout imports correctly.

## Color Modes

Observed `colormodeselection` values:

| value | Meaning | Editing guidance |
| ---: | --- | --- |
| 1 | Fixed / normal color mode | Primary `r/g/b` drives simple static and motion effects. Keep `colorPointList` and `gradientPointList` shape intact unless editing those modes intentionally. |
| 2 | Random color mode | Observed on Breathing and Flash segments. Preserve this value for random-color behavior. |
| 4 | Dual color mode | Observed on Breathing (`type=1`) and Flash (`type=4`) in `/Users/liam/Downloads/SaveFile.xml`. Use `d1r/d1g/d1b` for the first color and `d2r/d2g/d2b` for the second color. Keep primary `r/g/b` aligned with the first color for UI consistency. |
| 6 | Gradient mode | Observed on Static gradient and Breathing gradient segments. Edit `gradientPointList` colors to change the gradient; preserve point count and coordinates unless intentionally changing the spatial spread. |

`colorPointList` and `gradientPointList` are present on every observed effect, even when a mode does not visibly use both. Treat absent visual use as inactive defaults, not permission to delete the lists.

## Multi-Segment Timeline Layers

`all.xml` layer 6 shows a single normal layer containing multiple sequential effects. Preserve each effect node and its ordering:

| segment | type | observed mode | start | duration |
| ---: | ---: | --- | ---: | ---: |
| 1 | 0 | Static gradient (`colormodeselection=6`) | 0 | 5000 |
| 2 | 1 | Breathing random (`colormodeselection=2`) | 5000 | 4000 |
| 3 | 1 | Breathing gradient (`colormodeselection=6`) | 9000 | 3000 |
| 4 | 2 | Color Cycle | 12000 | 3000 |
| 5 | 3 | Rainbow | 15000 | 3000 |
| 6 | 4 | Flash random (`colormodeselection=2`) | 18000 | 3000 |
| 7 | 5 | Comet | 21000 | 3000 |
| 8 | 6 | Starry Night | 24000 | 3000 |
| 9 | 7 | Tide | 27000 | 2540 |

The two Breathing segments are intentional. The first verifies random-color Breathing (`colormodeselection=2`), and the second verifies gradient Breathing (`colormodeselection=6`).

When generating variants from a multi-segment template, prefer scalar edits to existing effect nodes:

- Change colors by editing `r/g/b`, `d1r/d1g/d1b`, `d2r/d2g/d2b`, `colorPointList`, or `gradientPointList`.
- Change tempo by editing `speed`, `start`, and `duration` only when the requested timeline requires it.
- Do not delete or merge segments unless the user explicitly asks for a shorter timeline.

## Gradient Editing

For gradient effects:

- Keep `colormodeselection=6`.
- Preserve `gradientPointList` element count.
- Prefer editing `r/g/b` inside each `gradientPoint`; leave `x/y` coordinates intact unless the user asks to move the gradient.
- Keep `gradientDegreeOfDiffusion`, `patternSelect`, `rotationMode`, and `rainbowRotation` unchanged unless testing proves a different value imports correctly.

## Dual Color Editing

For dual-color Breathing or Flash:

- Use `type=1` for Breathing or `type=4` for Flash.
- Set `colormodeselection=4`.
- Set primary `r/g/b` to the first color.
- Set `d1r/d1g/d1b` to the first color.
- Set `d2r/d2g/d2b` to the second color.
- Preserve `colorPointList` and `gradientPointList`; they remain present in exported XML even when dual-color mode is active.

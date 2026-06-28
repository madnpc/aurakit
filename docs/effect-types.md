# Aura Creator Effect Types

Aura Creator stores effect choices as numeric XML values. The current map combines verified exports with user-confirmed sample intent.

| XML type | Chinese UI | Effect | Status |
| ---: | --- | --- | --- |
| 0 | 恒亮 | Static | Verified in `all.xml` layer 6 |
| 1 | 呼吸 | Breathing | Verified twice in `all.xml` layer 6; random and gradient modes there, dual-color mode verified separately |
| 2 | 彩色循环 | Color Cycle | Verified in `all.xml` layer 6 |
| 3 | 彩虹 | Rainbow | Verified in `all.xml` layer 6 |
| 4 | 闪烁 | Flash | Verified in `all.xml` layer 6; dual-color mode verified |
| 5 | 彗星 | Comet | Verified in `all.xml` layer 6 |
| 6 | 繁星 | Starry Night | Verified in `all.xml` layer 6 |
| 7 | 潮汐 | Tide | Verified in `all.xml` layer 6 |
| 11 | 音乐 | Music signal sync | Verified in `all.xml` signal-sync layers |
| 12 | 智能 | Smart signal sync | Verified in `all.xml` signal-sync layers |
| 13 | 同步变色 | Synchronized color change | Verified in `all.xml` signal-sync layers |

## Verification Notes

The user-provided `all.xml` sample is a research fixture, not a generation base. Its layer 6 was deliberately built as an all-effects normal timeline:

- Static
- Breathing random color
- Breathing gradient
- Color Cycle
- Rainbow
- Flash
- Comet
- Starry Night
- Tide

The two Breathing segments are intentional separate samples, not accidental duplicates. They confirm that `type=1` can appear with different `colormodeselection` values in one normal timeline layer.

## Observed Color Modes

| `colormodeselection` | Meaning | Notes |
| ---: | --- | --- |
| 1 | Normal / fixed color | Primary `r/g/b` drives simple static and motion effects. |
| 2 | Random color | Observed on Breathing and Flash timeline segments. |
| 4 | Dual color | Verified for Breathing (`type=1`) and Flash (`type=4`); use `d1*` and `d2*` for the two colors. |
| 6 | Gradient | Observed on Static and Breathing gradient segments; edit `gradientPointList` colors conservatively. |

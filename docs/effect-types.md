# Aura Creator Effect Types

Aura Creator stores effect choices as numeric XML values. The current map combines verified exports with the built-in effect order shown in the Aura Creator UI.

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

## Verification Needed

`5 = Comet`, `7 = Tide`, and `11` through `13` have been confirmed from exported XML. The remaining built-in values should continue to be verified with one-layer exported fixtures:

- Static
- Breathing
- Color Cycle
- Rainbow
- Flash
- Starry Night

## Observed Color Modes

| `colormodeselection` | Meaning | Notes |
| ---: | --- | --- |
| 1 | Normal / fixed color | Primary `r/g/b` drives simple static and motion effects. |
| 2 | Random color | Observed on Breathing and Flash timeline segments. |
| 4 | Dual color | Verified for Breathing (`type=1`) and Flash (`type=4`); use `d1*` and `d2*` for the two colors. |
| 6 | Gradient | Observed on Static and Breathing gradient segments; edit `gradientPointList` colors conservatively. |

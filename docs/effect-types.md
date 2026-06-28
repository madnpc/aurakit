# Aura Creator Effect Types

Aura Creator stores effect choices as numeric XML values. The current map combines verified exports with the built-in effect order shown in the Aura Creator UI.

| XML type | Chinese UI | Effect | Status |
| ---: | --- | --- | --- |
| 0 | 恒亮 | Static | Inferred from UI order |
| 1 | 呼吸 | Breathing | Inferred from UI order |
| 2 | 彩色循环 | Color Cycle | Inferred from UI order |
| 3 | 彩虹 | Rainbow | Inferred from UI order |
| 4 | 闪烁 | Flash | Inferred from UI order |
| 5 | 彗星 | Comet | Verified from exported timeline |
| 6 | 繁星 | Starry Night | Inferred from UI order |
| 7 | 潮汐 | Tide | Verified from exported timeline |

## Verification Needed

Only `5 = Comet` and `7 = Tide` have been confirmed from exported XML so far. The other values should be verified with one-layer exported fixtures:

- Static
- Breathing
- Color Cycle
- Rainbow
- Flash
- Starry Night

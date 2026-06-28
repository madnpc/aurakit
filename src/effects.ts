export const AURA_EFFECT_TYPES = {
  0: "Static",
  1: "Breathing",
  2: "Color Cycle",
  3: "Rainbow",
  4: "Flash",
  5: "Comet",
  6: "Starry Night",
  7: "Tide"
} as const;

export type KnownAuraEffectType = keyof typeof AURA_EFFECT_TYPES;
export type KnownAuraEffectName = (typeof AURA_EFFECT_TYPES)[KnownAuraEffectType];

export function auraEffectName(type: number | undefined): string | undefined {
  if (type === undefined) {
    return undefined;
  }
  return AURA_EFFECT_TYPES[type as KnownAuraEffectType];
}

export function isTideEffect(type: number | undefined): boolean {
  return type === 7;
}

export function isCometEffect(type: number | undefined): boolean {
  return type === 5;
}

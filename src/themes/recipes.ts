import recipesJson from "../../shared/aura-theme-recipes.json" with { type: "json" };
import type { PreviewEffect } from "../preview/types.js";

export interface AuraThemeRecipeFile {
  effects: Record<PreviewEffect, number>;
  themes: Record<string, AuraThemeRecipe>;
}

export interface AuraThemeRecipe {
  id: string;
  name: string;
  backgroundColor: string;
  previewDefaults: {
    speed: number;
    brightness: number;
  };
  layers: AuraThemeLayerRecipe[];
}

export interface AuraThemeLayerRecipe {
  id: string;
  label: string;
  effect: PreviewEffect;
  xml: {
    type: number;
    color: string;
    speed: number;
    brightness: number;
    duration: number;
  };
  preview: {
    secondaryColor?: string;
    opacity: number;
    speedMultiplier: number;
    width: number;
    phase: number;
  };
}

export const AURA_THEME_RECIPES = recipesJson as AuraThemeRecipeFile;

export function listAuraThemeIds(): string[] {
  return Object.keys(AURA_THEME_RECIPES.themes);
}

export function getAuraThemeRecipe(themeId: string): AuraThemeRecipe | undefined {
  return AURA_THEME_RECIPES.themes[themeId];
}

export function getRequiredAuraThemeRecipe(themeId: string): AuraThemeRecipe {
  const recipe = getAuraThemeRecipe(themeId);
  if (!recipe) {
    throw new Error(`Unknown Aura theme "${themeId}". Use: ${listAuraThemeIds().join(", ")}`);
  }
  return recipe;
}

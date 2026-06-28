import { isLikelyKeyboard, withoutLayerDevices } from "../devices.js";
import { setFirstExistingScalar } from "../internal/xml.js";
import { projectFromDocument } from "../parse.js";
import { getRequiredAuraThemeRecipe } from "../themes/recipes.js";
import type { AuraProject, MutationResult } from "../types.js";

export interface ThemePresetOptions {
  disableKeyboard?: boolean;
  colors?: Array<string | undefined>;
  speed?: number;
  brightness?: number;
  durationMs?: number;
}

export function applyThemePreset(
  project: AuraProject,
  themeId: string,
  options: ThemePresetOptions = {}
): MutationResult {
  const recipe = getRequiredAuraThemeRecipe(themeId);
  const disableKeyboard = options.disableKeyboard ?? true;
  const withoutKeyboard = disableKeyboard
    ? withoutLayerDevices(project, isLikelyKeyboard)
    : { project, changed: 0 };

  let changed = withoutKeyboard.changed;
  const nextProject = projectFromDocument(withoutKeyboard.project.xml, withoutKeyboard.project.document);

  nextProject.layers.forEach((layer, index) => {
    const recipeLayer = recipe.layers[Math.min(index, recipe.layers.length - 1)];
    if (!recipeLayer) {
      return;
    }

    const color = options.colors?.[index] ?? recipeLayer.xml.color;
    if (setFirstExistingScalar(layer.raw, ["type", "effectType"], recipeLayer.xml.type)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["color", "primaryColor", "hex"], color)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["speed"], options.speed ?? recipeLayer.xml.speed)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["brightness"], options.brightness ?? recipeLayer.xml.brightness)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["duration", "durationMs"], options.durationMs ?? recipeLayer.xml.duration)) {
      changed += 1;
    }
  });

  return {
    project: projectFromDocument(nextProject.xml, nextProject.document),
    changed
  };
}

import { isLikelyKeyboard, withoutLayerDevices } from "../devices.js";
import { setFirstExistingScalar } from "../internal/xml.js";
import { projectFromDocument } from "../parse.js";
import type { AuraProject, MutationResult } from "../types.js";

export interface OceanPresetOptions {
  disableKeyboard?: boolean;
  baseColor?: string;
  flowColor?: string;
  speed?: number;
  brightness?: number;
  durationMs?: number;
}

const DEFAULT_OCEAN_OPTIONS = {
  disableKeyboard: true,
  baseColor: "#24384f",
  flowColor: "#8eefff",
  speed: 1,
  brightness: 2,
  durationMs: 12000
} satisfies Required<OceanPresetOptions>;

export function applyOceanPreset(
  project: AuraProject,
  options: OceanPresetOptions = {}
): MutationResult {
  const resolved = { ...DEFAULT_OCEAN_OPTIONS, ...options };
  const withoutKeyboard = resolved.disableKeyboard
    ? withoutLayerDevices(project, isLikelyKeyboard)
    : { project, changed: 0 };

  let changed = withoutKeyboard.changed;
  const nextProject = projectFromDocument(withoutKeyboard.project.xml, withoutKeyboard.project.document);

  nextProject.layers.forEach((layer, index) => {
    const color = index === 0 ? resolved.baseColor : resolved.flowColor;
    if (setFirstExistingScalar(layer.raw, ["type", "effectType"], 7)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["color", "primaryColor", "hex"], color)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["speed"], resolved.speed)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["brightness"], resolved.brightness)) {
      changed += 1;
    }
    if (setFirstExistingScalar(layer.raw, ["duration", "durationMs"], resolved.durationMs)) {
      changed += 1;
    }
  });

  return {
    project: projectFromDocument(nextProject.xml, nextProject.document),
    changed
  };
}

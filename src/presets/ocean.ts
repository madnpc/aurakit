import { applyThemePreset } from "./theme.js";
import type { AuraProject, MutationResult } from "../types.js";

export interface OceanPresetOptions {
  disableKeyboard?: boolean;
  baseColor?: string;
  flowColor?: string;
  speed?: number;
  brightness?: number;
  durationMs?: number;
}

export function applyOceanPreset(
  project: AuraProject,
  options: OceanPresetOptions = {}
): MutationResult {
  return applyThemePreset(project, "ocean", {
    ...(options.disableKeyboard === undefined ? {} : { disableKeyboard: options.disableKeyboard }),
    ...(options.baseColor === undefined && options.flowColor === undefined
      ? {}
      : { colors: [options.baseColor, options.flowColor] }),
    ...(options.speed === undefined ? {} : { speed: options.speed }),
    ...(options.brightness === undefined ? {} : { brightness: options.brightness }),
    ...(options.durationMs === undefined ? {} : { durationMs: options.durationMs })
  });
}

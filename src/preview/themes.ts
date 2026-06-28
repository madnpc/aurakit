import { getRequiredAuraThemeRecipe } from "../themes/recipes.js";
import type { PreviewTheme } from "./types.js";

export interface ThemePreviewOptions {
  speed?: number;
  brightness?: number;
  includeKeyboard?: boolean;
}

export type OceanPreviewOptions = ThemePreviewOptions;

const DEFAULT_DEVICES = [
  { id: "motherboard", label: "Motherboard", kind: "motherboard", leds: 36 },
  { id: "argb-1", label: "ARGB Header 1", kind: "argb", leds: 48 },
  { id: "argb-2", label: "ARGB Header 2", kind: "argb", leds: 48 },
  { id: "argb-3", label: "ARGB Header 3", kind: "argb", leds: 48 },
  { id: "memory-a2", label: "Memory A2", kind: "memory", leds: 18 },
  { id: "memory-b2", label: "Memory B2", kind: "memory", leds: 18 },
  { id: "keyboard", label: "Keyboard", kind: "keyboard", leds: 64 }
] as const;

export function createPreviewTheme(themeId: string, options: ThemePreviewOptions = {}): PreviewTheme {
  const recipe = getRequiredAuraThemeRecipe(themeId);
  const speed = options.speed ?? recipe.previewDefaults.speed;
  const brightness = options.brightness ?? recipe.previewDefaults.brightness;
  const includeKeyboard = options.includeKeyboard ?? false;
  const activeDeviceIds = DEFAULT_DEVICES.filter((device) => includeKeyboard || device.id !== "keyboard").map(
    (device) => device.id
  );

  return {
    id: recipe.id,
    name: recipe.name,
    backgroundColor: recipe.backgroundColor,
    devices: DEFAULT_DEVICES.map((device) => ({
      ...device,
      enabled: includeKeyboard || device.id !== "keyboard",
      startOffsetMs: 0
    })),
    layers: recipe.layers.map((layer) => ({
      id: `${recipe.id}-${layer.id}`,
      label: layer.label,
      effect: layer.effect,
      color: layer.xml.color,
      ...(layer.preview.secondaryColor === undefined ? {} : { secondaryColor: layer.preview.secondaryColor }),
      opacity: layer.preview.opacity * brightness,
      speed: speed * layer.preview.speedMultiplier,
      width: layer.preview.width,
      phase: layer.preview.phase,
      deviceIds: activeDeviceIds
    }))
  };
}

export function createOceanPreviewTheme(options: OceanPreviewOptions = {}): PreviewTheme {
  return createPreviewTheme("ocean", options);
}

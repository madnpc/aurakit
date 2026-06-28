import type { PreviewTheme } from "./types.js";

export interface OceanPreviewOptions {
  speed?: number;
  brightness?: number;
  includeKeyboard?: boolean;
}

const DEFAULT_DEVICES = [
  { id: "motherboard", label: "Motherboard", kind: "motherboard", leds: 36 },
  { id: "argb-1", label: "ARGB Header 1", kind: "argb", leds: 48 },
  { id: "argb-2", label: "ARGB Header 2", kind: "argb", leds: 48 },
  { id: "argb-3", label: "ARGB Header 3", kind: "argb", leds: 48 },
  { id: "memory-a2", label: "Memory A2", kind: "memory", leds: 18 },
  { id: "memory-b2", label: "Memory B2", kind: "memory", leds: 18 },
  { id: "keyboard", label: "Keyboard", kind: "keyboard", leds: 64 }
] as const;

export function createOceanPreviewTheme(options: OceanPreviewOptions = {}): PreviewTheme {
  const speed = options.speed ?? 0.08;
  const brightness = options.brightness ?? 0.82;
  const includeKeyboard = options.includeKeyboard ?? false;
  const activeDeviceIds = DEFAULT_DEVICES.filter((device) => includeKeyboard || device.id !== "keyboard").map(
    (device) => device.id
  );

  return {
    id: "ocean-soft",
    name: "Ocean",
    backgroundColor: "#101417",
    devices: DEFAULT_DEVICES.map((device) => ({
      ...device,
      enabled: includeKeyboard || device.id !== "keyboard"
    })),
    layers: [
      {
        id: "ocean-base",
        label: "Deep base",
        effect: "static",
        color: "#24384f",
        opacity: 0.42 * brightness,
        speed: 0,
        width: 1,
        phase: 0,
        deviceIds: activeDeviceIds
      },
      {
        id: "ocean-tide",
        label: "Ice tide",
        effect: "tide",
        color: "#8eefff",
        secondaryColor: "#2d5f78",
        opacity: 0.72 * brightness,
        speed,
        width: 0.28,
        phase: 0.08,
        deviceIds: activeDeviceIds
      },
      {
        id: "ocean-comet",
        label: "Soft crest",
        effect: "comet",
        color: "#d7fbff",
        opacity: 0.22 * brightness,
        speed: speed * 0.72,
        width: 0.12,
        phase: 0.64,
        deviceIds: activeDeviceIds
      }
    ]
  };
}

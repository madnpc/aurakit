import {
  clamp01,
  composite,
  hslToRgb,
  mixColor,
  parseHexColor,
  positiveModulo,
  rgbToHex,
  withAlpha
} from "./color.js";
import type { PreviewDevice, PreviewFrame, PreviewLayer, PreviewTheme, RgbColor } from "./types.js";

export function renderThemeFrame(theme: PreviewTheme, timeMs: number): PreviewFrame {
  const background = parseHexColor(theme.backgroundColor);

  return {
    timeMs,
    devices: theme.devices.map((device) => renderDeviceFrame(theme, device, background, timeMs))
  };
}

function renderDeviceFrame(
  theme: PreviewTheme,
  device: PreviewDevice,
  background: RgbColor,
  timeMs: number
) {
  const activeLayers = theme.layers.filter((layer) => layerTargetsDevice(layer, device.id));
  const deviceTime = timeMs - device.startOffsetMs;
  const leds = Array.from({ length: device.leds }, (_, index) => {
    const position = device.leds <= 1 ? 0 : index / (device.leds - 1);
    const rgb = device.enabled
      ? activeLayers.reduce(
          (destination, layer) =>
            composite(sampleLayer(layer, position, index, device.id, deviceTime), destination),
          background
        )
      : { r: 6, g: 7, b: 8, a: 1 };

    return {
      index,
      rgb,
      color: rgbToHex(rgb)
    };
  });

  return {
    deviceId: device.id,
    label: device.label,
    kind: device.kind,
    enabled: device.enabled,
    leds
  };
}

function sampleLayer(
  layer: PreviewLayer,
  position: number,
  index: number,
  deviceId: string,
  timeMs: number
): RgbColor {
  const color = parseHexColor(layer.color);
  const secondary = parseHexColor(layer.secondaryColor ?? layer.color);
  const progress = positiveModulo((timeMs / 1000) * layer.speed + layer.phase, 1);
  const opacity = clamp01(layer.opacity);

  switch (layer.effect) {
    case "static":
      return withAlpha(color, opacity);
    case "breathing": {
      const pulse = 0.28 + 0.72 * sine(progress);
      return withAlpha(color, opacity * pulse);
    }
    case "colorCycle":
      return withAlpha(hslToRgb(progress * 360, 0.76, 0.56), opacity);
    case "rainbow":
      return withAlpha(hslToRgb((position + progress) * 360, 0.82, 0.58), opacity);
    case "flash":
      return withAlpha(color, progress < 0.48 ? opacity : 0);
    case "comet": {
      const distance = circularDistance(position, progress);
      const trail = smoothstep(layer.width, 0, distance);
      return withAlpha(color, opacity * trail);
    }
    case "starry": {
      const bucket = Math.floor(timeMs / Math.max(120, 850 / Math.max(layer.speed, 0.1)));
      const sparkle = hash(`${deviceId}:${index}:${bucket}`) > 0.78 ? 1 : 0;
      const afterglow = hash(`${deviceId}:${index}:${bucket - 1}`) > 0.78 ? 0.3 : 0;
      return withAlpha(color, opacity * Math.max(sparkle, afterglow));
    }
    case "tide": {
      const distance = circularDistance(position, progress);
      const wave = smoothstep(layer.width, 0, distance);
      const shimmer = 0.18 * sine(position * 2 + progress);
      return withAlpha(mixColor(secondary, color, clamp01(wave + shimmer)), opacity * (0.2 + wave * 0.8));
    }
  }
}

function layerTargetsDevice(layer: PreviewLayer, deviceId: string): boolean {
  return layer.deviceIds === undefined || layer.deviceIds.includes(deviceId);
}

function circularDistance(a: number, b: number): number {
  const distance = Math.abs(a - b);
  return Math.min(distance, 1 - distance);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function sine(progress: number): number {
  return 0.5 + 0.5 * Math.sin(progress * Math.PI * 2 - Math.PI / 2);
}

function hash(input: string): number {
  let h = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    h ^= input.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

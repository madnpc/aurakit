import type { RgbColor } from "./types.js";

export function parseHexColor(hex: string): RgbColor {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
    a: 1
  };
}

export function rgbToHex(color: RgbColor): string {
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

export function withAlpha(color: RgbColor, alpha: number): RgbColor {
  return {
    r: color.r,
    g: color.g,
    b: color.b,
    a: clamp01(alpha)
  };
}

export function composite(source: RgbColor, destination: RgbColor): RgbColor {
  const alpha = clamp01(source.a);
  const inverse = 1 - alpha;
  return {
    r: source.r * alpha + destination.r * inverse,
    g: source.g * alpha + destination.g * inverse,
    b: source.b * alpha + destination.b * inverse,
    a: 1
  };
}

export function mixColor(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  const t = clamp01(amount);
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
    a: from.a + (to.a - from.a) * t
  };
}

export function hslToRgb(hue: number, saturation: number, lightness: number): RgbColor {
  const h = positiveModulo(hue, 360) / 360;
  const s = clamp01(saturation);
  const l = clamp01(lightness);

  if (s === 0) {
    const value = l * 255;
    return { r: value, g: value, b: value, a: 1 };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hueToChannel(p, q, h + 1 / 3) * 255,
    g: hueToChannel(p, q, h) * 255,
    b: hueToChannel(p, q, h - 1 / 3) * 255,
    a: 1
  };
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function hueToChannel(p: number, q: number, t: number): number {
  let next = t;
  if (next < 0) next += 1;
  if (next > 1) next -= 1;
  if (next < 1 / 6) return p + (q - p) * 6 * next;
  if (next < 1 / 2) return q;
  if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
  return p;
}

function toHex(value: number): string {
  return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0");
}

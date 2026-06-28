import { describe, expect, it } from "vitest";
import {
  createOceanPreviewTheme,
  renderThemeFrame,
  reorderPreviewDevices,
  setPreviewDeviceStartOffset,
  staggerPreviewDevices
} from "../src/index.js";

function deviceColors(
  frame: ReturnType<typeof renderThemeFrame>,
  deviceId: string
): string | undefined {
  return frame.devices
    .find((device) => device.deviceId === deviceId)
    ?.leds.map((led) => led.color)
    .join(",");
}

describe("preview engine", () => {
  it("renders enabled devices and keeps the keyboard off by default", () => {
    const theme = createOceanPreviewTheme();
    const frame = renderThemeFrame(theme, 0);
    const keyboard = frame.devices.find((device) => device.deviceId === "keyboard");
    const motherboard = frame.devices.find((device) => device.deviceId === "motherboard");

    expect(keyboard?.enabled).toBe(false);
    expect(new Set(keyboard?.leds.map((led) => led.color))).toEqual(new Set(["#060708"]));
    expect(motherboard?.enabled).toBe(true);
    expect(new Set(motherboard?.leds.map((led) => led.color)).size).toBeGreaterThan(1);
  });

  it("changes the tide frame over time", () => {
    const theme = createOceanPreviewTheme({ speed: 0.16 });
    const first = renderThemeFrame(theme, 0);
    const second = renderThemeFrame(theme, 2600);

    const firstColors = first.devices[0]?.leds.map((led) => led.color).join(",");
    const secondColors = second.devices[0]?.leds.map((led) => led.color).join(",");

    expect(firstColors).toBeDefined();
    expect(firstColors).not.toBe(secondColors);
  });
});

describe("device timeline ordering", () => {
  it("delays a device's animation by its start offset", () => {
    const base = createOceanPreviewTheme({ speed: 0.16 });
    const offset = setPreviewDeviceStartOffset(base, "motherboard", 1000);

    const baseAtZero = renderThemeFrame(base, 0);
    const offsetAt1000 = renderThemeFrame(offset, 1000);

    // The offset device at t=1000ms shows the state the baseline shows at t=0.
    expect(deviceColors(offsetAt1000, "motherboard")).toBe(deviceColors(baseAtZero, "motherboard"));
    // A device with no offset has advanced 1000ms, so it differs.
    expect(deviceColors(offsetAt1000, "argb-1")).not.toBe(deviceColors(baseAtZero, "argb-1"));
  });

  it("staggers enabled devices by step and skips disabled ones", () => {
    const staggered = staggerPreviewDevices(createOceanPreviewTheme(), 500);
    const offsetById = new Map(staggered.devices.map((device) => [device.id, device.startOffsetMs]));

    expect(offsetById.get("motherboard")).toBe(0);
    expect(offsetById.get("argb-1")).toBe(500);
    expect(offsetById.get("argb-2")).toBe(1000);
    // Keyboard is disabled by default: reset to 0 and consumes no step.
    expect(offsetById.get("keyboard")).toBe(0);
  });

  it("reorders devices without mutating the input theme", () => {
    const theme = createOceanPreviewTheme();
    const moved = reorderPreviewDevices(theme, "memory-a2", 0);

    expect(moved.devices[0]?.id).toBe("memory-a2");
    expect(moved.devices.length).toBe(theme.devices.length);
    expect(theme.devices[0]?.id).toBe("motherboard");
  });
});

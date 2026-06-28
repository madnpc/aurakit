import { describe, expect, it } from "vitest";
import { createOceanPreviewTheme, renderThemeFrame } from "../src/index.js";

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

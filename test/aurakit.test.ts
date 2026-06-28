import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  applyOceanPreset,
  isLikelyKeyboard,
  parseAuraProject,
  serializeAuraProject,
  withoutLayerDevices
} from "../src/index.js";

const fixtureUrl = new URL("../fixtures/minimal-aura-project.xml", import.meta.url);

describe("AuraKit XML editing", () => {
  it("extracts devices, layers, and known effect names", async () => {
    const xml = await readFile(fixtureUrl, "utf8");
    const project = parseAuraProject(xml);

    expect(project.version).toBe("4.5.4.0");
    expect(project.devices.map((device) => device.name)).toContain("TUF GAMING B650M-PLUS WIFI");
    expect(project.layers).toHaveLength(2);
    expect(project.layers[0]?.effectType).toBe(7);
    expect(project.layers[0]?.effectName).toBe("Tide");
    expect(project.layers[1]?.effectName).toBe("Comet");
  });

  it("removes keyboard refs from layers without removing the device catalog entry", async () => {
    const xml = await readFile(fixtureUrl, "utf8");
    const project = parseAuraProject(xml);
    const result = withoutLayerDevices(project, isLikelyKeyboard);

    expect(result.changed).toBe(2);
    expect(result.project.devices.some((device) => device.name.includes("FALCHION"))).toBe(true);
    expect(
      result.project.layers.flatMap((layer) => layer.devices).some((device) => device.name.includes("FALCHION"))
    ).toBe(false);
  });

  it("applies a soft Ocean preset and serializes the result", async () => {
    const xml = await readFile(fixtureUrl, "utf8");
    const project = parseAuraProject(xml);
    const result = applyOceanPreset(project);
    const nextXml = serializeAuraProject(result.project);
    const reparsed = parseAuraProject(nextXml);

    expect(result.changed).toBeGreaterThan(0);
    expect(nextXml).toContain("#24384f");
    expect(nextXml).toContain("#8eefff");
    expect(reparsed.devices.some((device) => device.name.includes("FALCHION"))).toBe(true);
    expect(
      reparsed.layers.flatMap((layer) => layer.devices).some((device) => device.name.includes("FALCHION"))
    ).toBe(false);
  });
});

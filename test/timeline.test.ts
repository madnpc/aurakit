import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getLayerTimeline,
  parseAuraProject,
  serializeAuraProject,
  setLayerDuration,
  setLayerStart
} from "../src/index.js";

const realXml = readFileSync(new URL("../fixtures/real-aura-export.xml", import.meta.url), "utf8");

describe("real Aura export timeline", () => {
  it("parses the catalog and per-layer effect start/duration/type", () => {
    const project = parseAuraProject(realXml);

    // Device catalog lives under <space> in real exports.
    expect(project.devices.map((device) => device.name)).toContain("TUF GAMING B650M-PLUS WIFI");
    expect(project.layers.length).toBe(7);

    const timeline = getLayerTimeline(project);
    const starts = timeline.map((entry) => entry.startMs);
    expect(starts).toContain(0);
    expect(starts).toContain(3000);
    // 5 of the 7 layers carry an effect; the other 2 are placeholders with none.
    const withTimeline = timeline.filter((entry) => entry.startMs !== undefined);
    expect(withTimeline.length).toBe(5);
    expect(withTimeline.every((entry) => entry.durationMs !== undefined)).toBe(true);
    expect(timeline.some((entry) => entry.effectType === 7)).toBe(true);
  });

  it("sets a layer start and rebuilds importable XML losslessly", () => {
    const project = parseAuraProject(realXml);
    const before = getLayerTimeline(project);

    const result = setLayerStart(project, 0, 4567);
    expect(result.changed).toBe(1);

    const reparsed = parseAuraProject(serializeAuraProject(result.project));
    const after = getLayerTimeline(reparsed);

    expect(after[0]?.startMs).toBe(4567);
    // Every other layer's start is untouched.
    for (let index = 1; index < before.length; index += 1) {
      expect(after[index]?.startMs).toBe(before[index]?.startMs);
    }
  });

  it("sets a layer duration independently of start", () => {
    const project = parseAuraProject(realXml);
    const before = getLayerTimeline(project);

    const result = setLayerDuration(project, 1, 9000);
    const after = getLayerTimeline(parseAuraProject(serializeAuraProject(result.project)));

    expect(after[1]?.durationMs).toBe(9000);
    expect(after[1]?.startMs).toBe(before[1]?.startMs);
  });

  it("round-trips device catalog and layer count without loss", () => {
    const project = parseAuraProject(realXml);
    const reparsed = parseAuraProject(serializeAuraProject(project));

    expect(reparsed.devices.map((device) => device.name)).toEqual(project.devices.map((device) => device.name));
    expect(reparsed.layers.length).toBe(project.layers.length);
    expect(getLayerTimeline(reparsed)).toEqual(getLayerTimeline(project));
  });
});

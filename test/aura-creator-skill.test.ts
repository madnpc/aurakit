import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { parseAuraProject } from "../src/index.js";

const execFileAsync = promisify(execFile);

describe("aura-creator skill script", () => {
  it("generates an import-oriented Ocean XML and removes keyboard layer bindings", async () => {
    const output = join(tmpdir(), `aurakit-skill-${Date.now()}.xml`);

    const result = await execFileAsync("node", [
      "skills/aura-creator/scripts/generate-aura-xml.mjs",
      "fixtures/minimal-aura-project.xml",
      output,
      "--theme",
      "ocean",
      "--keyboard",
      "off"
    ]);

    expect(result.stdout).toContain("\"theme\": \"ocean\"");

    const xml = await readFile(output, "utf8");
    const project = parseAuraProject(xml);

    expect(xml).toContain("#24384f");
    expect(xml).toContain("#8eefff");
    expect(project.devices.some((device) => device.name.includes("FALCHION"))).toBe(true);
    expect(
      project.layers.flatMap((layer) => layer.devices).some((device) => device.name.includes("FALCHION"))
    ).toBe(false);
  });
});

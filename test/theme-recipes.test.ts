import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { createPreviewTheme, getRequiredAuraThemeRecipe } from "../src/index.js";

const execFileAsync = promisify(execFile);

describe("shared Aura theme recipes", () => {
  it("drives the preview model from the shared Ocean recipe", () => {
    const recipe = getRequiredAuraThemeRecipe("ocean");
    const preview = createPreviewTheme("ocean");

    expect(preview.name).toBe(recipe.name);
    expect(preview.backgroundColor).toBe(recipe.backgroundColor);
    expect(preview.layers.map((layer) => layer.color)).toEqual(recipe.layers.map((layer) => layer.xml.color));
  });

  it("drives the skill XML generator from the shared Galaxy recipe", async () => {
    const recipe = getRequiredAuraThemeRecipe("galaxy");
    const output = join(tmpdir(), `aurakit-galaxy-${Date.now()}.xml`);

    await execFileAsync("node", [
      "skills/aura-creator/scripts/generate-aura-xml.mjs",
      "fixtures/minimal-aura-project.xml",
      output,
      "--theme",
      "galaxy",
      "--keyboard",
      "off"
    ]);

    const xml = await readFile(output, "utf8");

    expect(xml).toContain(recipe.layers[0]?.xml.color);
    expect(xml).toContain(recipe.layers[1]?.xml.color);
  });
});

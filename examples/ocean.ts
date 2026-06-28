import { readFile, writeFile } from "node:fs/promises";
import { applyOceanPreset, parseAuraProject, serializeAuraProject } from "../src/index.js";

const inputPath = process.argv[2] ?? "fixtures/minimal-aura-project.xml";
const outputPath = process.argv[3] ?? "Ocean.xml";

const xml = await readFile(inputPath, "utf8");
const project = parseAuraProject(xml);
const result = applyOceanPreset(project);

await writeFile(outputPath, serializeAuraProject(result.project));

console.log(`Wrote ${outputPath} with ${result.changed} XML edits.`);

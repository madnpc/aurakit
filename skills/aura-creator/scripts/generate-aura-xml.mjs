#!/usr/bin/env node

// @ts-nocheck

import { readFile, writeFile } from "node:fs/promises";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

const recipeFileUrl = new URL("../../../shared/aura-theme-recipes.json", import.meta.url);
const recipeFile = JSON.parse(await readFile(recipeFileUrl, "utf8"));
const THEMES = recipeFile.themes;

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  ignoreDeclaration: false,
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true
});

const builder = new XMLBuilder({
  attributeNamePrefix: "@_",
  format: true,
  ignoreAttributes: false,
  suppressEmptyNode: false
});

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  const { input, output, options } = parseArgs(process.argv.slice(2));
  if (!input || !output) {
    printHelp();
    process.exit(2);
  }

  const themeName = options.theme ?? "ocean";
  const theme = THEMES[themeName];
  if (!theme) {
    throw new Error(`Unknown theme "${themeName}". Use: ${Object.keys(THEMES).join(", ")}`);
  }

  const xml = await readFile(input, "utf8");
  const document = parser.parse(xml);
  const layers = collectElements(document, "layer");
  if (layers.length === 0) {
    throw new Error("No <layer> elements found. Export an Aura Creator project with at least one effect layer.");
  }

  let edits = 0;
  layers.forEach((layer, index) => {
    const recipeLayer = theme.layers[Math.min(index, theme.layers.length - 1)];
    const recipe = recipeLayer.xml;
    edits += applyRecipe(layer, {
      ...recipe,
      speed: numberOption(options.speed, recipe.speed),
      brightness: numberOption(options.brightness, recipe.brightness)
    });
  });

  if ((options.keyboard ?? "off") === "off") {
    edits += removeMatchingDevicesFromLayers(layers, isKeyboardName);
  }

  await writeFile(output, builder.build(document));
  console.log(JSON.stringify({ output, theme: themeName, edits }, null, 2));
}

function applyRecipe(layer, recipe) {
  let edits = 0;
  edits += setFirstScalar(layer, ["type", "effectType"], recipe.type);
  edits += setFirstScalar(layer, ["color", "primaryColor", "hex"], recipe.color);
  edits += setFirstScalar(layer, ["speed"], recipe.speed);
  edits += setFirstScalar(layer, ["brightness"], recipe.brightness);
  edits += setFirstScalar(layer, ["duration", "durationMs"], recipe.duration);
  return edits;
}

function removeMatchingDevicesFromLayers(layers, matcher) {
  let edits = 0;
  for (const layer of layers) {
    edits += removeDeviceNodes(layer, matcher);
  }
  return edits;
}

function removeDeviceNodes(node, matcher) {
  if (!isRecord(node)) return 0;
  let edits = 0;

  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      const next = value.filter((item) => {
        if (normalizeKey(key) === "device" && isRecord(item) && matcher(readName(item))) {
          edits += 1;
          return false;
        }
        edits += removeDeviceNodes(item, matcher);
        return true;
      });
      node[key] = next;
    } else if (normalizeKey(key) === "device" && isRecord(value) && matcher(readName(value))) {
      delete node[key];
      edits += 1;
    } else {
      edits += removeDeviceNodes(value, matcher);
    }
  }

  return edits;
}

function collectElements(root, elementName) {
  const matches = [];
  walk(root, (value, key) => {
    if (normalizeKey(key) === elementName && isRecord(value)) {
      matches.push(value);
    }
  });
  return matches;
}

function walk(value, visitor, key = "") {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visitor, key));
    return;
  }
  if (!isRecord(value)) return;
  visitor(value, key);
  for (const [childKey, childValue] of Object.entries(value)) {
    walk(childValue, visitor, childKey);
  }
}

function setFirstScalar(node, keys, nextValue) {
  if (Array.isArray(node)) {
    return node.some((item) => setFirstScalar(item, keys, nextValue)) ? 1 : 0;
  }
  if (!isRecord(node)) return 0;

  const wanted = new Set(keys.map(normalizeKey));
  for (const key of Object.keys(node)) {
    if (wanted.has(normalizeKey(key)) && isScalar(node[key])) {
      node[key] = nextValue;
      return 1;
    }
  }
  for (const value of Object.values(node)) {
    if (setFirstScalar(value, keys, nextValue)) {
      return 1;
    }
  }
  return 0;
}

function readName(record) {
  const direct = record.name ?? record.deviceName ?? record.displayName ?? record.model;
  if (isScalar(direct)) return String(direct);
  let found = "";
  walk(record, (value) => {
    if (!found) {
      const nested = value.name ?? value.deviceName ?? value.displayName ?? value.model;
      if (isScalar(nested)) found = String(nested);
    }
  });
  return found;
}

function isKeyboardName(name) {
  const normalized = name.toLowerCase();
  return (
    normalized.includes("keyboard") ||
    normalized.includes("falchion") ||
    normalized.includes("azoth") ||
    normalized.includes("strix scope")
  );
}

function parseArgs(args) {
  const positional = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg?.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        options[key] = "true";
      } else {
        options[key] = value;
        index += 1;
      }
    } else if (arg) {
      positional.push(arg);
    }
  }
  return { input: positional[0], output: positional[1], options };
}

function numberOption(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function printHelp() {
  console.error(`Usage:
  node skills/aura-creator/scripts/generate-aura-xml.mjs <input.xml> <output.xml> [options]

Options:
  --theme ${Object.keys(THEMES).join("|")}
  --keyboard off|on
  --speed <number>
  --brightness <number>`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScalar(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function normalizeKey(key) {
  return key.replace(/^@_/, "").toLowerCase();
}

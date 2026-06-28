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
    const resolvedRecipe = {
      ...recipe,
      speed: numberOption(options.speed, recipe.speed),
      brightness: numberOption(options.brightness, recipe.brightness)
    };
    if (index === 0) {
      edits += setLayerName(layer, options["base-layer-name"]);
      resolvedRecipe.color = colorOption(options["base-color"], resolvedRecipe.color);
      resolvedRecipe.brightness = numberOption(options["base-brightness"], resolvedRecipe.brightness);
      resolvedRecipe.start = numberOption(options["base-start"], resolvedRecipe.start);
      resolvedRecipe.duration = numberOption(options["base-duration"], resolvedRecipe.duration);
    }
    edits += applyRecipe(layer, {
      ...resolvedRecipe
    });
  });

  if ((options.keyboard ?? "off") === "off") {
    edits += removeMatchingDevicesFromLayers(layers, isKeyboardName);
  }

  if (options.layout === "device-base-bottom") {
    edits += applyDeviceBaseBottomLayout(document, layers);
  }

  await writeFile(output, builder.build(document));
  console.log(JSON.stringify({ output, theme: themeName, edits }, null, 2));
}

function applyRecipe(layer, recipe) {
  // Only edit fields inside <effect> elements. Searching the whole layer
  // matches the device-binding `@_type` attribute first and corrupts it.
  const effects = collectElements(layer, "effect");
  let edits = 0;
  for (const effect of effects) {
    edits += setFirstScalar(effect, ["type", "effectType"], recipe.type);
    edits += setFirstScalar(effect, ["color", "primaryColor", "hex"], recipe.color);
    edits += setRgb(effect, recipe.color);
    edits += setFirstScalar(effect, ["speed"], recipe.speed);
    edits += setFirstScalar(effect, ["brightness"], recipe.brightness);
    if (recipe.start !== undefined) {
      edits += setFirstScalar(effect, ["start", "startMs"], recipe.start);
    }
    edits += setFirstScalar(effect, ["duration", "durationMs"], recipe.duration);
  }
  return edits;
}

// Recolor the effect's primary r/g/b channels from a #rrggbb recipe color.
// Only touches the first r/g/b trio (the effect's base color), leaving
// colorPointList/gradientPointList intact.
function setRgb(effect, color) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  let edits = 0;
  edits += setFirstScalar(effect, ["r"], rgb.r);
  edits += setFirstScalar(effect, ["g"], rgb.g);
  edits += setFirstScalar(effect, ["b"], rgb.b);
  return edits;
}

function applyDeviceBaseBottomLayout(document, layers) {
  const assignments = [
    { index: 0, name: "Base - 常亮底色", matcher: (name) => !isKeyboardName(name) },
    { index: 1, name: "主板 - 潮汐", matcher: isMotherboardName },
    { index: 2, name: "ARGB 灯带 - 彗星", matcher: isAddressableHeaderName },
    { index: 3, name: "内存 A2 - 彗星", matcher: (name) => name === "Memory" },
    { index: 4, name: "内存 B2 - 彗星", matcher: (name) => name === "Memory_1" }
  ];
  let edits = 0;
  for (const assignment of assignments) {
    const layer = layers[assignment.index];
    if (!layer) continue;
    edits += setLayerName(layer, assignment.name);
    edits += keepLayerDevices(layer, assignment.matcher);
  }
  if (layers[5]) {
    edits += setLayerName(layers[5], "空层 - 保留");
  }
  if (layers[6]) {
    edits += setLayerName(layers[6], "空层 - 保留");
  }
  edits += moveLayerToEnd(document, layers[0]);
  return edits;
}

function keepLayerDevices(node, matcher) {
  if (!isRecord(node)) return 0;
  let edits = 0;

  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      const next = value.filter((item) => {
        if (normalizeKey(key) === "device" && isRecord(item)) {
          const keep = matcher(readName(item));
          if (keep) {
            edits += activateDeviceNode(item);
          } else {
            edits += 1;
          }
          return keep;
        }
        edits += keepLayerDevices(item, matcher);
        return true;
      });
      node[key] = next;
    } else if (normalizeKey(key) === "device" && isRecord(value)) {
      if (matcher(readName(value))) {
        edits += activateDeviceNode(value);
      } else {
        delete node[key];
        edits += 1;
      }
    } else if (normalizeKey(key) !== "effect" && normalizeKey(key) !== "effects") {
      edits += keepLayerDevices(value, matcher);
    }
  }

  return edits;
}

function activateDeviceNode(device) {
  if (String(device.index ?? "") !== "-1") return 0;
  delete device.index;
  return 1;
}

function setLayerName(layer, name) {
  if (name === undefined) return 0;
  if (isScalar(layer["@_name"])) {
    layer["@_name"] = name;
    return 1;
  }
  if (isScalar(layer.name)) {
    layer.name = name;
    return 1;
  }
  return 0;
}

function moveLayerToEnd(node, target) {
  if (!isRecord(node)) return 0;
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      if (normalizeKey(key) === "layer") {
        const index = value.indexOf(target);
        if (index >= 0 && index < value.length - 1) {
          value.splice(index, 1);
          value.push(target);
          return 1;
        }
      }
      for (const item of value) {
        const edits = moveLayerToEnd(item, target);
        if (edits) return edits;
      }
    } else {
      const edits = moveLayerToEnd(value, target);
      if (edits) return edits;
    }
  }
  return 0;
}

function hexToRgb(value) {
  if (typeof value !== "string") return null;
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const int = Number.parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
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
    // Skip attribute keys (e.g. @_type on a device binding); only match elements.
    if (key.startsWith("@_")) continue;
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
  // Device names live in attributes (@_name) in exported Aura XML.
  const direct =
    record["@_name"] ?? record.name ?? record["@_deviceName"] ?? record.deviceName ?? record.displayName ?? record.model;
  if (isScalar(direct)) return String(direct);
  let found = "";
  walk(record, (value) => {
    if (!found) {
      const nested = value["@_name"] ?? value.name ?? value.deviceName ?? value.displayName ?? value.model;
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

function isMotherboardName(name) {
  const normalized = name.toLowerCase();
  return normalized.includes("gaming b650") || normalized.includes("motherboard");
}

function isAddressableHeaderName(name) {
  return name.toLowerCase().includes("addressableheader");
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

function colorOption(value, fallback) {
  if (value === undefined) return fallback;
  if (!hexToRgb(value)) {
    throw new Error(`Invalid color "${value}". Use #rrggbb.`);
  }
  return value;
}

function printHelp() {
  console.error(`Usage:
  node skills/aura-creator/scripts/generate-aura-xml.mjs <input.xml> <output.xml> [options]

Options:
  --theme ${Object.keys(THEMES).join("|")}
  --keyboard off|on
  --speed <number>
  --brightness <number>
  --base-color <#rrggbb>
  --base-brightness <number>
  --base-layer-name <name>
  --base-start <number>
  --base-duration <number>
  --layout device-base-bottom`);
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

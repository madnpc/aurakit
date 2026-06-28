import { auraEffectName } from "./effects.js";
import {
  findFirstScalar,
  isRecord,
  normalizeKey,
  parseXml,
  scalarToNumber,
  scalarToString,
  toArray,
  walkRecords
} from "./internal/xml.js";
import type { AuraDevice, AuraLayer, AuraLayerDeviceRef, AuraProject, XmlRecord, XmlValue } from "./types.js";

const DEVICE_NAME_KEYS = ["name", "deviceName", "displayName", "model"];
const DEVICE_KIND_KEYS = ["kind", "type", "category"];
const LAYER_NAME_KEYS = ["name", "layerName", "displayName"];
const EFFECT_TYPE_KEYS = ["type", "effectType"];
const VERSION_KEYS = ["version", "creatorVersion", "auraCreatorVersion"];

export function parseAuraProject(xml: string): AuraProject {
  const document = parseXml(xml);
  return projectFromDocument(xml, document);
}

export function projectFromDocument(xml: string, document: XmlRecord): AuraProject {
  const layers = extractLayers(document);
  const version = scalarToString(findFirstScalar(document, VERSION_KEYS));
  const base = {
    xml,
    document,
    devices: extractDevices(document),
    layers
  };

  return version === undefined ? base : { ...base, version };
}

function extractDevices(document: XmlRecord): AuraDevice[] {
  const devices: AuraDevice[] = [];

  walkRecords(document, (record, path) => {
    const location = xmlLocation(path);
    if (location.elementKey !== "device" || location.parentKey !== "devices") {
      return;
    }
    if (path.some((segment) => normalizeKey(segment) === "layers")) {
      return;
    }

    const name = readDeviceName(record);
    if (!name) {
      return;
    }

    const kind = scalarToString(findFirstScalar(record, DEVICE_KIND_KEYS));
    const model = scalarToString(findFirstScalar(record, ["model", "productName"]));
    devices.push({
      name,
      ...(kind === undefined ? {} : { kind }),
      ...(model === undefined ? {} : { model }),
      raw: record,
      path
    });
  });

  return dedupeByPath(devices);
}

function extractLayers(document: XmlRecord): AuraLayer[] {
  const layers: AuraLayer[] = [];

  walkRecords(document, (record, path) => {
    const location = xmlLocation(path);
    if (location.elementKey !== "layer" || location.parentKey !== "layers") {
      return;
    }

    const name = scalarToString(findFirstScalar(record, LAYER_NAME_KEYS));
    const effectType = scalarToNumber(findFirstScalar(record, EFFECT_TYPE_KEYS));
    const effectName = auraEffectName(effectType);
    layers.push({
      ...(name === undefined ? {} : { name }),
      ...(effectType === undefined ? {} : { effectType }),
      ...(effectName === undefined ? {} : { effectName }),
      devices: extractLayerDeviceRefs(record, path),
      raw: record,
      path
    });
  });

  return layers;
}

function extractLayerDeviceRefs(layer: XmlRecord, layerPath: string[]): AuraLayerDeviceRef[] {
  const devices: AuraLayerDeviceRef[] = [];

  walkRecords(layer, (record, path) => {
    const location = xmlLocation(path);
    if (location.elementKey !== "device" || location.parentKey !== "devices") {
      return;
    }

    const name = readDeviceName(record);
    if (!name) {
      return;
    }

    devices.push({
      name,
      raw: record,
      path: [...layerPath, ...path]
    });
  });

  return dedupeByPath(devices);
}

function readDeviceName(record: XmlRecord): string | undefined {
  const direct = firstDirectScalar(record, DEVICE_NAME_KEYS);
  if (direct !== undefined) {
    return direct;
  }
  return scalarToString(findFirstScalar(record, DEVICE_NAME_KEYS));
}

function xmlLocation(path: string[]): { elementKey: string; parentKey: string } {
  const last = path.at(-1);
  if (last === undefined) {
    return { elementKey: "", parentKey: "" };
  }

  if (/^\d+$/.test(last)) {
    return {
      elementKey: normalizeKey(path.at(-2) ?? ""),
      parentKey: normalizeKey(path.at(-3) ?? "")
    };
  }

  return {
    elementKey: normalizeKey(last),
    parentKey: normalizeKey(path.at(-2) ?? "")
  };
}

function firstDirectScalar(record: XmlRecord, keys: readonly string[]): string | undefined {
  const wanted = new Set(keys.map(normalizeKey));
  for (const [key, value] of Object.entries(record)) {
    if (!wanted.has(normalizeKey(key))) {
      continue;
    }
    const scalar = scalarToString(value);
    if (scalar !== undefined) {
      return scalar;
    }
  }
  return undefined;
}

function dedupeByPath<T extends { path: string[] }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.path.join("/");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getRootElementName(project: AuraProject): string {
  return Object.keys(project.document)[0] ?? "";
}

export function getRootElement(project: AuraProject): XmlValue | undefined {
  const rootName = getRootElementName(project);
  return rootName === "" ? undefined : project.document[rootName];
}

export function assertAuraProjectHasLayers(project: AuraProject): void {
  if (project.layers.length === 0) {
    throw new Error("Aura project does not contain any layers to edit.");
  }
}

export function assertXmlRecord(value: XmlValue | undefined, message: string): asserts value is XmlRecord {
  if (!isRecord(value)) {
    throw new Error(message);
  }
}

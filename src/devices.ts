import { cloneXmlRecord, findFirstScalar, isRecord, normalizeKey } from "./internal/xml.js";
import { projectFromDocument } from "./parse.js";
import type { AuraProject, DeviceMatcher, MutationResult, XmlRecord, XmlValue } from "./types.js";

export function deviceNameIncludes(...needles: string[]): DeviceMatcher {
  const normalizedNeedles = needles.map((needle) => needle.toLowerCase());
  return (device) => {
    const name = device.name.toLowerCase();
    return normalizedNeedles.some((needle) => name.includes(needle));
  };
}

export const isLikelyKeyboard: DeviceMatcher = (device) => {
  const name = device.name.toLowerCase();
  return name.includes("keyboard") || name.includes("falchion") || name.includes("rog azoth");
};

export function withoutLayerDevices(
  project: AuraProject,
  matcher: DeviceMatcher
): MutationResult {
  const document = cloneXmlRecord(project.document);
  let changed = 0;

  const next = projectFromDocument(project.xml, document);
  for (const layer of next.layers) {
    changed += removeMatchingDeviceNodes(layer.raw, matcher);
  }

  return {
    project: projectFromDocument(project.xml, document),
    changed
  };
}

function removeMatchingDeviceNodes(node: XmlRecord, matcher: DeviceMatcher): number {
  let changed = 0;

  for (const [key, value] of Object.entries(node)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      const nextValue = value.filter((child) => {
        if (isDeviceNode(key, child) && deviceMatches(child, matcher)) {
          changed += 1;
          return false;
        }
        if (isRecord(child)) {
          changed += removeMatchingDeviceNodes(child, matcher);
        }
        return true;
      });
      node[key] = nextValue;
      continue;
    }

    if (isDeviceNode(key, value) && deviceMatches(value, matcher)) {
      delete node[key];
      changed += 1;
      continue;
    }

    if (isRecord(value)) {
      changed += removeMatchingDeviceNodes(value, matcher);
    }
  }

  return changed;
}

function isDeviceNode(key: string, value: XmlValue): value is XmlRecord {
  return normalizeKey(key) === "device" && isRecord(value);
}

function deviceMatches(record: XmlRecord, matcher: DeviceMatcher): boolean {
  const name = findFirstScalar(record, ["name", "deviceName", "displayName", "model"]);
  if (typeof name !== "string" && typeof name !== "number") {
    return false;
  }
  return matcher({ name: String(name), raw: record });
}

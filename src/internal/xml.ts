import { XMLBuilder, XMLParser } from "fast-xml-parser";
import type { XmlRecord, XmlValue } from "../types.js";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreDeclaration: true,
  ignoreAttributes: false,
  parseAttributeValue: true,
  parseTagValue: true,
  preserveOrder: false,
  textNodeName: "#text",
  trimValues: false
});

const builder = new XMLBuilder({
  attributeNamePrefix: "@_",
  format: true,
  ignoreAttributes: false,
  preserveOrder: false,
  suppressEmptyNode: false,
  textNodeName: "#text"
});

export function parseXml(xml: string): XmlRecord {
  const parsed = parser.parse(xml);
  if (!isRecord(parsed)) {
    throw new Error("Aura project XML did not parse into an object document.");
  }
  return parsed;
}

export function buildXml(document: XmlRecord): string {
  return builder.build(document);
}

export function cloneXmlRecord<T extends XmlRecord>(record: T): T {
  return structuredClone(record) as T;
}

export function isRecord(value: unknown): value is XmlRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toArray(value: XmlValue | undefined): XmlValue[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function normalizeKey(key: string): string {
  return key.replace(/^@_/, "").toLowerCase();
}

export function scalarToString(value: XmlValue | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

export function scalarToNumber(value: XmlValue | undefined): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function findFirstScalar(
  node: XmlValue | undefined,
  keys: readonly string[]
): string | number | boolean | undefined {
  if (node === undefined || node === null) {
    return undefined;
  }
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    return undefined;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findFirstScalar(child, keys);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }

  const wanted = new Set(keys.map(normalizeKey));
  for (const [key, value] of Object.entries(node)) {
    if (wanted.has(normalizeKey(key))) {
      const scalar = scalarToString(value) ?? scalarToNumber(value);
      if (scalar !== undefined) {
        return scalar;
      }
    }
  }

  for (const value of Object.values(node)) {
    const found = findFirstScalar(value, keys);
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
}

export function setFirstExistingScalar(
  node: XmlValue | undefined,
  keys: readonly string[],
  nextValue: string | number | boolean
): boolean {
  if (!isRecord(node)) {
    if (Array.isArray(node)) {
      return node.some((child) => setFirstExistingScalar(child, keys, nextValue));
    }
    return false;
  }

  const wanted = new Set(keys.map(normalizeKey));
  for (const key of Object.keys(node)) {
    if (wanted.has(normalizeKey(key))) {
      const current = node[key];
      if (
        typeof current === "string" ||
        typeof current === "number" ||
        typeof current === "boolean"
      ) {
        node[key] = nextValue;
        return true;
      }
    }
  }

  for (const value of Object.values(node)) {
    if (setFirstExistingScalar(value, keys, nextValue)) {
      return true;
    }
  }

  return false;
}

export function walkRecords(
  node: XmlValue | undefined,
  visitor: (record: XmlRecord, path: string[]) => void,
  path: string[] = []
): void {
  if (Array.isArray(node)) {
    node.forEach((child, index) => walkRecords(child, visitor, [...path, String(index)]));
    return;
  }
  if (!isRecord(node)) {
    return;
  }

  visitor(node, path);

  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      value.forEach((child, index) => walkRecords(child, visitor, [...path, key, String(index)]));
    } else {
      walkRecords(value, visitor, [...path, key]);
    }
  }
}

export function getRecordAtPath(root: XmlRecord, path: string[]): XmlRecord | undefined {
  let current: XmlValue | undefined = root;
  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current[Number(segment)];
      continue;
    }
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return isRecord(current) ? current : undefined;
}

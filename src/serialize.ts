import { buildXml } from "./internal/xml.js";
import type { AuraProject } from "./types.js";

export function serializeAuraProject(project: AuraProject): string {
  return buildXml(project.document);
}

export type XmlPrimitive = string | number | boolean | null;
export type XmlValue = XmlPrimitive | XmlRecord | XmlValue[];

export interface XmlRecord {
  [key: string]: XmlValue | undefined;
}

export interface AuraDevice {
  name: string;
  kind?: string;
  model?: string;
  raw: XmlRecord;
  path: string[];
}

export interface AuraLayerDeviceRef {
  name: string;
  raw: XmlRecord;
  path: string[];
}

export interface AuraRgba {
  a: number;
  r: number;
  g: number;
  b: number;
}

export interface AuraEffect {
  /** Effect type id (e.g. 5 Comet, 7 Tide). */
  type?: number;
  /** Timeline start offset in milliseconds — when this effect begins playing. */
  start?: number;
  /** Timeline duration in milliseconds. */
  duration?: number;
  /** Primary color, read from the effect's direct a/r/g/b channels. */
  color?: AuraRgba;
  raw: XmlRecord;
  path: string[];
}

export interface AuraLayer {
  name?: string;
  effectType?: number;
  effectName?: string;
  devices: AuraLayerDeviceRef[];
  effects: AuraEffect[];
  raw: XmlRecord;
  path: string[];
}

export interface AuraProject {
  xml: string;
  document: XmlRecord;
  version?: string;
  devices: AuraDevice[];
  layers: AuraLayer[];
}

export interface DeviceMatcher {
  (device: Pick<AuraDevice | AuraLayerDeviceRef, "name" | "raw">): boolean;
}

export interface MutationResult<TProject extends AuraProject = AuraProject> {
  project: TProject;
  changed: number;
}

import { cloneXmlRecord, setFirstExistingScalar } from "./internal/xml.js";
import { projectFromDocument } from "./parse.js";
import type { AuraProject, MutationResult } from "./types.js";

/**
 * Timeline editing for real Aura Creator projects. The timeline lever is each
 * layer's effect `<start>` (ms) and `<duration>` (ms): a layer's effect begins
 * at `start` and plays for `duration`. Reordering the timeline = changing these
 * start values. Mutations clone the document and edit the effect's existing
 * scalar nodes, so unrelated fields and formatting round-trip unchanged.
 */

export interface LayerTimelineEntry {
  /** Index of the layer in document order. */
  index: number;
  name?: string;
  effectType?: number;
  startMs?: number;
  durationMs?: number;
}

/** Read the per-layer timeline (first effect of each layer) for inspection/UI. */
export function getLayerTimeline(project: AuraProject): LayerTimelineEntry[] {
  return project.layers.map((layer, index) => {
    const effect = layer.effects[0];
    return {
      index,
      ...(layer.name === undefined ? {} : { name: layer.name }),
      ...(effect?.type === undefined ? {} : { effectType: effect.type }),
      ...(effect?.start === undefined ? {} : { startMs: effect.start }),
      ...(effect?.duration === undefined ? {} : { durationMs: effect.duration })
    };
  });
}

/** Set the timeline start (ms) of a layer's effect. */
export function setLayerStart(project: AuraProject, layerIndex: number, startMs: number): MutationResult {
  return editLayerEffectScalar(project, layerIndex, ["start"], Math.max(0, Math.round(startMs)));
}

/** Set the timeline duration (ms) of a layer's effect. */
export function setLayerDuration(project: AuraProject, layerIndex: number, durationMs: number): MutationResult {
  return editLayerEffectScalar(project, layerIndex, ["duration", "durationMs"], Math.max(0, Math.round(durationMs)));
}

function editLayerEffectScalar(
  project: AuraProject,
  layerIndex: number,
  keys: readonly string[],
  nextValue: number
): MutationResult {
  const document = cloneXmlRecord(project.document);
  const next = projectFromDocument(project.xml, document);

  let changed = 0;
  const layer = next.layers[layerIndex];
  const effect = layer?.effects[0];
  if (effect && setFirstExistingScalar(effect.raw, keys, nextValue)) {
    changed = 1;
  }

  return { project: projectFromDocument(next.xml, document), changed };
}

import "./styles.css";
import templateXml from "../fixtures/real-aura-export.xml?raw";
import {
  getLayerTimeline,
  parseAuraProject,
  renderThemeFrame,
  rgbToHex,
  serializeAuraProject,
  setLayerDuration,
  setLayerStart,
  type AuraEffect,
  type AuraLayer,
  type AuraProject,
  type LayerTimelineEntry,
  type PreviewEffect,
  type PreviewTheme,
  type RgbColor
} from "./index.js";

const LABEL_PX = 148;
const TAIL_PAD_MS = 2000;
const MIN_TOTAL_MS = 6000;
const MIN_DURATION_MS = 500;
const SNAP_MS = 100;
const EDGE_GRAB_PX = 10;
const STRIP_LEDS = 96;

const exportButton = requiredElement<HTMLButtonElement>("export-xml");
const exportStatus = requiredElement<HTMLDivElement>("export-status");
const selectedInfo = requiredElement<HTMLDivElement>("selected-info");
const playToggle = requiredElement<HTMLButtonElement>("play-toggle");
const readout = requiredElement<HTMLDivElement>("readout");
const timelineEl = requiredElement<HTMLDivElement>("timeline");
const rulerEl = requiredElement<HTMLDivElement>("ruler");
const tracksEl = requiredElement<HTMLDivElement>("tracks");
const playheadEl = requiredElement<HTMLDivElement>("playhead");
const stripCanvas = requiredElement<HTMLCanvasElement>("strip-canvas");
const stripContext = requiredCanvasContext(stripCanvas);

timelineEl.style.setProperty("--label-col", `${LABEL_PX}px`);

let project = parseAuraProject(templateXml);
let entries = timelineEntries();
let selectedIndex: number | null = null;
let playheadMs = 0;
let isPlaying = true;
let lastFrameMs = performance.now();

renderRuler();
renderTracks();
new ResizeObserver(() => {
  resizeStripCanvas();
}).observe(stripCanvas);
resizeStripCanvas();

playToggle.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playToggle.textContent = isPlaying ? "Pause" : "Play";
});
exportButton.addEventListener("click", handleExport);
rulerEl.addEventListener("pointerdown", scrubFromEvent);

requestAnimationFrame(tick);

/** Layers that actually carry an effect get a timeline track. */
function timelineEntries(): LayerTimelineEntry[] {
  return getLayerTimeline(project).filter((entry) => entry.startMs !== undefined);
}

function totalMs(): number {
  const end = entries.reduce((max, entry) => {
    const finish = (entry.startMs ?? 0) + (entry.durationMs ?? 0);
    return Math.max(max, finish);
  }, 0);
  return Math.max(MIN_TOTAL_MS, end + TAIL_PAD_MS);
}

function fraction(ms: number): number {
  return clamp01(ms / totalMs());
}

/** CSS position inside the lane column, accounting for the label gutter. */
function lanePosition(ms: number): string {
  return `calc(${LABEL_PX}px + (100% - ${LABEL_PX}px) * ${fraction(ms)})`;
}

function tick(now: number): void {
  const delta = now - lastFrameMs;
  lastFrameMs = now;

  if (isPlaying) {
    playheadMs = (playheadMs + delta) % totalMs();
  }

  updatePlayhead();
  drawStrip(playheadMs);
  readout.textContent = `${(playheadMs / 1000).toFixed(2)}s`;
  requestAnimationFrame(tick);
}

function updatePlayhead(): void {
  playheadEl.style.left = lanePosition(playheadMs);
}

function renderRuler(): void {
  const total = totalMs();
  const step = total <= 8000 ? 1000 : 2000;
  const lane = document.createElement("div");
  lane.className = "ruler-lane";

  for (let ms = 0; ms <= total; ms += step) {
    const tickEl = document.createElement("span");
    tickEl.className = "tick";
    tickEl.style.left = `${fraction(ms) * 100}%`;
    tickEl.textContent = `${ms / 1000}s`;
    lane.append(tickEl);
  }

  rulerEl.replaceChildren(spacer(), lane);
}

function renderTracks(): void {
  tracksEl.replaceChildren(
    ...entries.map((entry) => {
      const track = document.createElement("div");
      track.className = "track";

      const label = document.createElement("div");
      label.className = "track-label";
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = entry.name ?? `Layer ${entry.index}`;
      const effect = document.createElement("span");
      effect.className = "effect";
      effect.textContent = effectLabel(entry.effectType);
      label.append(name, effect);

      const lane = document.createElement("div");
      lane.className = "lane";
      lane.append(createBar(entry, lane));

      track.append(label, lane);
      return track;
    })
  );
}

function createBar(entry: LayerTimelineEntry, lane: HTMLDivElement): HTMLDivElement {
  const bar = document.createElement("div");
  bar.className = "bar";
  if (entry.index === selectedIndex) {
    bar.classList.add("selected");
  }
  positionBar(bar, entry.startMs ?? 0, entry.durationMs ?? 0);

  const text = document.createElement("span");
  text.className = "bar-text";
  text.textContent = barCaption(entry.startMs ?? 0, entry.durationMs ?? 0);

  const leftHandle = document.createElement("span");
  leftHandle.className = "handle left";
  const rightHandle = document.createElement("span");
  rightHandle.className = "handle right";

  bar.append(leftHandle, rightHandle, text);
  attachDrag(bar, lane, entry);
  return bar;
}

function positionBar(bar: HTMLDivElement, startMs: number, durationMs: number): void {
  const total = totalMs();
  bar.style.left = `${(startMs / total) * 100}%`;
  bar.style.width = `${Math.max(0.5, (durationMs / total) * 100)}%`;
}

type DragMode = "move" | "resize-left" | "resize-right";

function attachDrag(bar: HTMLDivElement, lane: HTMLDivElement, entry: LayerTimelineEntry): void {
  bar.addEventListener("pointerdown", (event: PointerEvent) => {
    event.preventDefault();
    select(entry.index);

    const laneWidth = lane.getBoundingClientRect().width;
    const total = totalMs();
    const msPerPx = total / Math.max(1, laneWidth);
    const offsetX = event.offsetX;
    const barWidth = bar.getBoundingClientRect().width;
    const mode: DragMode =
      offsetX <= EDGE_GRAB_PX ? "resize-left" : offsetX >= barWidth - EDGE_GRAB_PX ? "resize-right" : "move";

    const startX = event.clientX;
    const origStart = entry.startMs ?? 0;
    const origDuration = entry.durationMs ?? 0;
    let nextStart = origStart;
    let nextDuration = origDuration;

    bar.classList.add("dragging");
    bar.setPointerCapture(event.pointerId);
    const text = bar.querySelector<HTMLSpanElement>(".bar-text");

    const onMove = (move: PointerEvent): void => {
      const deltaMs = (move.clientX - startX) * msPerPx;
      if (mode === "move") {
        nextStart = snap(Math.max(0, origStart + deltaMs));
        nextDuration = origDuration;
      } else if (mode === "resize-right") {
        nextDuration = snap(Math.max(MIN_DURATION_MS, origDuration + deltaMs));
        nextStart = origStart;
      } else {
        const limited = Math.min(origStart + origDuration - MIN_DURATION_MS, Math.max(0, origStart + deltaMs));
        nextStart = snap(limited);
        nextDuration = origStart + origDuration - nextStart;
      }
      positionBar(bar, nextStart, nextDuration);
      if (text) {
        text.textContent = barCaption(nextStart, nextDuration);
      }
      showSelected(entry.name, entry.effectType, nextStart, nextDuration);
    };

    const onUp = (): void => {
      bar.classList.remove("dragging");
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      commit(entry.index, nextStart, nextDuration);
    };

    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
  });
}

function commit(layerIndex: number, startMs: number, durationMs: number): void {
  let next: AuraProject = setLayerStart(project, layerIndex, startMs).project;
  next = setLayerDuration(next, layerIndex, durationMs).project;
  project = next;
  entries = timelineEntries();
  renderRuler();
  renderTracks();
  const entry = entries.find((candidate) => candidate.index === layerIndex);
  if (entry) {
    showSelected(entry.name, entry.effectType, entry.startMs ?? 0, entry.durationMs ?? 0);
  }
}

function select(index: number): void {
  selectedIndex = index;
  for (const bar of tracksEl.querySelectorAll<HTMLDivElement>(".bar")) {
    bar.classList.remove("selected");
  }
  const entry = entries.find((candidate) => candidate.index === index);
  if (entry) {
    showSelected(entry.name, entry.effectType, entry.startMs ?? 0, entry.durationMs ?? 0);
  }
}

function showSelected(name: string | undefined, effectType: number | undefined, startMs: number, durationMs: number): void {
  selectedInfo.innerHTML = `<strong>${escapeHtml(name ?? "Layer")}</strong> · ${escapeHtml(
    effectLabel(effectType)
  )}<br />start ${Math.round(startMs)} ms · duration ${Math.round(durationMs)} ms · end ${Math.round(
    startMs + durationMs
  )} ms`;
}

function scrubFromEvent(event: PointerEvent): void {
  const lane = rulerEl.querySelector<HTMLDivElement>(".ruler-lane");
  if (!lane) {
    return;
  }
  const rect = lane.getBoundingClientRect();
  const fractionAcross = clamp01((event.clientX - rect.left) / Math.max(1, rect.width));
  playheadMs = fractionAcross * totalMs();
  isPlaying = false;
  playToggle.textContent = "Play";
}

// ── Lighting preview ──────────────────────────────────────────
// Screen-composite every layer active at the playhead onto black. Each layer
// is rendered by the existing engine at (playhead − start) so scrubbing/playing
// animates it. This is an approximate feel, not a pixel-accurate Aura sim.

function drawStrip(timeMs: number): void {
  const colors = stripColors(timeMs);
  const ratio = window.devicePixelRatio || 1;
  const width = stripCanvas.width / ratio;
  const height = stripCanvas.height / ratio;

  stripContext.save();
  stripContext.scale(ratio, ratio);
  stripContext.clearRect(0, 0, width, height);

  const gap = 1;
  const ledWidth = (width - gap * (colors.length - 1)) / colors.length;
  colors.forEach((color, index) => {
    stripContext.fillStyle = color;
    stripContext.fillRect(index * (ledWidth + gap), 0, ledWidth, height);
  });
  stripContext.restore();
}

function stripColors(timeMs: number): string[] {
  let accumulator: RgbColor[] = Array.from({ length: STRIP_LEDS }, () => ({ r: 8, g: 9, b: 11, a: 1 }));

  for (const layer of project.layers) {
    const effect = layer.effects[0];
    if (!effect || effect.start === undefined || effect.duration === undefined) {
      continue;
    }
    if (timeMs < effect.start || timeMs >= effect.start + effect.duration) {
      continue;
    }

    const frame = renderThemeFrame(singleLayerTheme(layer, effect), timeMs - effect.start);
    const leds = frame.devices[0]?.leds ?? [];
    accumulator = accumulator.map((current, index) => {
      const led = leds[index]?.rgb;
      return led ? screen(current, led) : current;
    });
  }

  return accumulator.map(rgbToHex);
}

function singleLayerTheme(layer: AuraLayer, effect: AuraEffect): PreviewTheme {
  const color = effect.color
    ? rgbToHex({ r: effect.color.r, g: effect.color.g, b: effect.color.b, a: 1 })
    : "#8eefff";

  return {
    id: "strip-theme",
    name: "",
    backgroundColor: "#000000",
    devices: [{ id: "strip", label: "strip", kind: "argb", leds: STRIP_LEDS, enabled: true, startOffsetMs: 0 }],
    layers: [
      {
        id: layer.path.join("/"),
        label: layer.name ?? "layer",
        effect: effectName(effect.type),
        color,
        opacity: clamp01((effect.color?.a ?? 255) / 255),
        speed: 0.06,
        width: 0.3,
        phase: 0,
        deviceIds: ["strip"]
      }
    ]
  };
}

function screen(a: RgbColor, b: RgbColor): RgbColor {
  return {
    r: 255 - ((255 - a.r) * (255 - b.r)) / 255,
    g: 255 - ((255 - a.g) * (255 - b.g)) / 255,
    b: 255 - ((255 - a.b) * (255 - b.b)) / 255,
    a: 1
  };
}

function handleExport(): void {
  try {
    const xml = serializeAuraProject(project);
    downloadXml("aura-timeline-edit.xml", xml);
    exportStatus.textContent = `Rebuilt ${entries.length} timeline layers → downloaded importable XML.`;
  } catch (error) {
    exportStatus.textContent = `Export failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function downloadXml(filename: string, xml: string): void {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────

const EFFECT_NAMES: Record<number, PreviewEffect> = {
  0: "static",
  1: "breathing",
  2: "colorCycle",
  3: "rainbow",
  4: "flash",
  5: "comet",
  6: "starry",
  7: "tide"
};

function effectName(type: number | undefined): PreviewEffect {
  return (type !== undefined && EFFECT_NAMES[type]) || "static";
}

function effectLabel(type: number | undefined): string {
  if (type === undefined) {
    return "no effect";
  }
  return effectName(type);
}

function barCaption(startMs: number, durationMs: number): string {
  return `${(startMs / 1000).toFixed(1)}s · ${(durationMs / 1000).toFixed(1)}s`;
}

function snap(ms: number): number {
  return Math.round(ms / SNAP_MS) * SNAP_MS;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function spacer(): HTMLSpanElement {
  const node = document.createElement("span");
  return node;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function resizeStripCanvas(): void {
  const ratio = window.devicePixelRatio || 1;
  const rect = stripCanvas.getBoundingClientRect();
  stripCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
  stripCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
}

function requiredElement<TElement extends HTMLElement>(id: string): TElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as TElement;
}

function requiredCanvasContext(element: HTMLCanvasElement): CanvasRenderingContext2D {
  const nextContext = element.getContext("2d");
  if (!nextContext) {
    throw new Error("Canvas 2D context is not available.");
  }
  return nextContext;
}

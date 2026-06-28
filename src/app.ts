import "./styles.css";
import { createOceanPreviewTheme, renderThemeFrame, type PreviewFrame, type PreviewTheme } from "./index.js";

const canvas = requiredElement<HTMLCanvasElement>("preview-canvas");
const speedInput = requiredElement<HTMLInputElement>("speed");
const brightnessInput = requiredElement<HTMLInputElement>("brightness");
const keyboardInput = requiredElement<HTMLInputElement>("keyboard");
const playToggle = requiredElement<HTMLButtonElement>("play-toggle");
const layers = requiredElement<HTMLDivElement>("layers");
const themeName = requiredElement<HTMLHeadingElement>("theme-name");
const readout = requiredElement<HTMLDivElement>("readout");
const context = requiredCanvasContext(canvas);

let isPlaying = true;
let elapsedMs = 0;
let lastFrameMs = performance.now();
let theme = readThemeFromControls();

renderLayerList(theme);
resizeCanvas();
new ResizeObserver(resizeCanvas).observe(canvas);

speedInput.addEventListener("input", updateTheme);
brightnessInput.addEventListener("input", updateTheme);
keyboardInput.addEventListener("change", updateTheme);
playToggle.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playToggle.textContent = isPlaying ? "Pause" : "Play";
});

requestAnimationFrame(tick);

function tick(now: number): void {
  const delta = now - lastFrameMs;
  lastFrameMs = now;
  if (isPlaying) {
    elapsedMs += delta;
  }

  const frame = renderThemeFrame(theme, elapsedMs);
  drawFrame(context, frame, canvas.width, canvas.height);
  readout.textContent = `${(elapsedMs / 1000).toFixed(2)}s`;

  requestAnimationFrame(tick);
}

function updateTheme(): void {
  theme = readThemeFromControls();
  renderLayerList(theme);
}

function readThemeFromControls(): PreviewTheme {
  return createOceanPreviewTheme({
    speed: Number(speedInput.value),
    brightness: Number(brightnessInput.value),
    includeKeyboard: keyboardInput.checked
  });
}

function renderLayerList(nextTheme: PreviewTheme): void {
  themeName.textContent = nextTheme.name;
  layers.replaceChildren(
    ...nextTheme.layers.map((layer) => {
      const item = document.createElement("div");
      item.className = "layer-item";

      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.backgroundColor = layer.color;

      const label = document.createElement("span");
      label.textContent = layer.label;

      const effect = document.createElement("span");
      effect.className = "layer-effect";
      effect.textContent = layer.effect;

      item.append(swatch, label, effect);
      return item;
    })
  );
}

function resizeCanvas(): void {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
}

function drawFrame(ctx: CanvasRenderingContext2D, frame: PreviewFrame, width: number, height: number): void {
  const ratio = window.devicePixelRatio || 1;
  const logicalWidth = width / ratio;
  const logicalHeight = height / ratio;

  ctx.save();
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  ctx.fillStyle = "#0d0f10";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  const marginX = logicalWidth < 620 ? 18 : 34;
  const labelWidth = logicalWidth < 620 ? 112 : 174;
  const top = 34;
  const rowGap = logicalWidth < 620 ? 18 : 22;
  const rowHeight = Math.max(34, Math.min(52, (logicalHeight - top * 2) / frame.devices.length - rowGap));
  const stripX = marginX + labelWidth;
  const stripWidth = Math.max(120, logicalWidth - stripX - marginX);

  frame.devices.forEach((device, rowIndex) => {
    const y = top + rowIndex * (rowHeight + rowGap);
    drawLabel(ctx, device.label, marginX, y, labelWidth, rowHeight, device.enabled);
    drawLedStrip(ctx, stripX, y, stripWidth, rowHeight, device.leds.map((led) => led.color), device.enabled);
  });

  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  enabled: boolean
): void {
  ctx.fillStyle = enabled ? "#d9e5e8" : "#687579";
  ctx.font = "600 14px Inter, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  const displayLabel = fitText(ctx, label, width);
  ctx.fillText(displayLabel, x, y + height / 2);
}

function drawLedStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: string[],
  enabled: boolean
): void {
  const gap = Math.max(1, Math.min(3, width / colors.length / 5));
  const ledWidth = Math.max(2, (width - gap * (colors.length - 1)) / colors.length);
  const ledHeight = Math.max(16, height);

  colors.forEach((color, index) => {
    const ledX = x + index * (ledWidth + gap);
    ctx.fillStyle = enabled ? color : "#111517";
    roundedRect(ctx, ledX, y, ledWidth, ledHeight, 4);
    ctx.fill();
  });

  ctx.strokeStyle = enabled ? "rgba(142, 239, 255, 0.16)" : "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  roundedRect(ctx, x - 1, y - 1, width + 2, ledHeight + 2, 6);
  ctx.stroke();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let next = text;
  while (next.length > 3 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}...`;
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

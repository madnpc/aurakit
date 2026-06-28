import type { PreviewDevice, PreviewTheme } from "./types.js";

/**
 * Pure editing helpers for a PreviewTheme. Each returns a new theme and never
 * mutates the input, so they compose cleanly with UI state (drag-to-reorder,
 * sliders) and are easy to test.
 *
 * Device array order is the timeline order. `startOffsetMs` controls which
 * device starts first on the timeline (see PreviewDevice.startOffsetMs).
 */

/** Move a device to a new position in the timeline order (array order). */
export function reorderPreviewDevices(theme: PreviewTheme, deviceId: string, toIndex: number): PreviewTheme {
  const from = theme.devices.findIndex((device) => device.id === deviceId);
  if (from === -1) {
    return theme;
  }

  const devices = [...theme.devices];
  const moved = devices[from];
  if (moved === undefined) {
    return theme;
  }

  const to = clampIndex(toIndex, devices.length - 1);
  if (from === to) {
    return theme;
  }

  devices.splice(from, 1);
  devices.splice(to, 0, moved);
  return { ...theme, devices };
}

/** Set one device's timeline start offset (clamped to >= 0). */
export function setPreviewDeviceStartOffset(
  theme: PreviewTheme,
  deviceId: string,
  startOffsetMs: number
): PreviewTheme {
  return mapDevice(theme, deviceId, (device) => ({
    ...device,
    startOffsetMs: Math.max(0, Math.round(startOffsetMs))
  }));
}

/** Toggle one device on/off in the preview. */
export function setPreviewDeviceEnabled(theme: PreviewTheme, deviceId: string, enabled: boolean): PreviewTheme {
  return mapDevice(theme, deviceId, (device) => ({ ...device, enabled }));
}

/**
 * Assign staggered start offsets in current timeline order: the first enabled
 * device starts at 0, the next at `stepMs`, and so on. Disabled devices are
 * reset to 0 and do not consume a step. This is the quick way to answer
 * "which device walks the timeline first" by spacing them out evenly.
 */
export function staggerPreviewDevices(theme: PreviewTheme, stepMs: number): PreviewTheme {
  const step = Math.max(0, Math.round(stepMs));
  let position = 0;
  const devices = theme.devices.map((device) => {
    if (!device.enabled) {
      return { ...device, startOffsetMs: 0 };
    }
    const next = { ...device, startOffsetMs: position * step };
    position += 1;
    return next;
  });
  return { ...theme, devices };
}

function mapDevice(
  theme: PreviewTheme,
  deviceId: string,
  update: (device: PreviewDevice) => PreviewDevice
): PreviewTheme {
  let touched = false;
  const devices = theme.devices.map((device) => {
    if (device.id !== deviceId) {
      return device;
    }
    touched = true;
    return update(device);
  });
  return touched ? { ...theme, devices } : theme;
}

function clampIndex(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(max, Math.trunc(value)));
}

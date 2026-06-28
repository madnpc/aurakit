export type PreviewEffect =
  | "static"
  | "breathing"
  | "colorCycle"
  | "rainbow"
  | "flash"
  | "comet"
  | "starry"
  | "tide";

export type PreviewDeviceKind = "motherboard" | "argb" | "memory" | "keyboard" | "gpu" | "custom";

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface PreviewDevice {
  id: string;
  label: string;
  kind: PreviewDeviceKind;
  leds: number;
  enabled: boolean;
  /**
   * Per-device timeline start offset in milliseconds. A positive value delays
   * this device's animation (it shows the state from `startOffsetMs` ago), so
   * devices stagger instead of moving in lockstep. Preview-only for now: not
   * yet serialized to Aura XML (pending verification of a per-device `start`
   * field in a real exported project).
   */
  startOffsetMs: number;
}

export interface PreviewLayer {
  id: string;
  label: string;
  effect: PreviewEffect;
  color: string;
  secondaryColor?: string;
  opacity: number;
  speed: number;
  width: number;
  phase: number;
  deviceIds?: string[];
}

export interface PreviewTheme {
  id: string;
  name: string;
  backgroundColor: string;
  devices: PreviewDevice[];
  layers: PreviewLayer[];
}

export interface PreviewLed {
  index: number;
  color: string;
  rgb: RgbColor;
}

export interface PreviewDeviceFrame {
  deviceId: string;
  label: string;
  kind: PreviewDeviceKind;
  enabled: boolean;
  leds: PreviewLed[];
}

export interface PreviewFrame {
  timeMs: number;
  devices: PreviewDeviceFrame[];
}

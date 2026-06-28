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

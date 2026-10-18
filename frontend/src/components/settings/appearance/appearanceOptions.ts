import type { ColorMode, ColorVision, TextSize } from "../../../appearance/appearanceSettings";

export type Option<Value extends string> = {
  value: Value;
  label: string;
  ariaLabel?: string;
};

export const TEXT_SIZE_OPTIONS: Option<TextSize>[] = [
  { value: "small", label: "A-", ariaLabel: "Smaller text" },
  { value: "normal", label: "A", ariaLabel: "Normal text" },
  { value: "large", label: "A+", ariaLabel: "Larger text" },
];

export const COLOR_MODE_OPTIONS: Option<ColorMode>[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const COLOR_VISION_OPTIONS: Option<ColorVision>[] = [
  { value: "standard", label: "Standard" },
  { value: "red-green", label: "Red-green", ariaLabel: "Red-green color blindness (protanopia and deuteranopia)" },
  { value: "blue-yellow", label: "Blue-yellow", ariaLabel: "Blue-yellow color blindness (tritanopia)" },
  { value: "monochrome", label: "Monochrome", ariaLabel: "No color vision (achromatopsia)" },
];

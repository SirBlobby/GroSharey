import type { ColorMode, TextSize } from "../../../appearance/appearanceSettings";

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


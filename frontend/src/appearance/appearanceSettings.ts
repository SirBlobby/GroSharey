export type TextSize = "small" | "normal" | "large";
export type ColorMode = "system" | "light" | "dark";

export type AppearanceSettings = {
  textSize: TextSize;
  colorMode: ColorMode;
  highContrast: boolean;
  reduceMotion: boolean;
};

const APPEARANCE_STORAGE_KEY = "grosharey-appearance";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";
export const APPEARANCE_CHANGE_EVENT = "grosharey-appearance-change";

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  textSize: "normal",
  colorMode: "light",
  highContrast: false,
  reduceMotion: false,
};

export function readAppearance(): AppearanceSettings {
  try {
    const storedAppearance = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return storedAppearance ? { ...DEFAULT_APPEARANCE, ...JSON.parse(storedAppearance) } : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function prefersDarkMode(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(DARK_MODE_QUERY).matches;
}

function resolveColorMode(colorMode: ColorMode): "light" | "dark" {
  if (colorMode === "system") {
    return prefersDarkMode() ? "dark" : "light";
  }
  return colorMode;
}

export function applyAppearance(appearance: AppearanceSettings): void {
  const rootDataset = document.documentElement.dataset;
  rootDataset.textSize = appearance.textSize;
  rootDataset.colorMode = resolveColorMode(appearance.colorMode);
  rootDataset.contrast = appearance.highContrast ? "high" : "normal";
  rootDataset.reduceMotion = String(appearance.reduceMotion);
  window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
}

export function saveAppearance(appearance: AppearanceSettings): void {
  applyAppearance(appearance);
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    return;
  }
}

export function followSystemColorMode(): () => void {
  if (typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const darkModeQuery = window.matchMedia(DARK_MODE_QUERY);
  const reapplyAppearance = () => applyAppearance(readAppearance());
  darkModeQuery.addEventListener("change", reapplyAppearance);
  return () => darkModeQuery.removeEventListener("change", reapplyAppearance);
}

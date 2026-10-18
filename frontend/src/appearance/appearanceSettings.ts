export type TextSize = "normal" | "large";

export type AppearanceSettings = {
  textSize: TextSize;
  reduceMotion: boolean;
};

const APPEARANCE_STORAGE_KEY = "grosharey-appearance";

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  textSize: "normal",
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

export function applyAppearance(appearance: AppearanceSettings): void {
  document.documentElement.dataset.textSize = appearance.textSize;
  document.documentElement.dataset.reduceMotion = String(appearance.reduceMotion);
}

export function saveAppearance(appearance: AppearanceSettings): void {
  applyAppearance(appearance);
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    return;
  }
}

import { useState } from "react";

import { AppearanceSettings, readAppearance, saveAppearance } from "../appearance/appearanceSettings";

export function useAppearance() {
  const [appearance, setAppearance] = useState<AppearanceSettings>(readAppearance);

  function updateAppearance(changes: Partial<AppearanceSettings>) {
    const updatedAppearance = { ...appearance, ...changes };
    setAppearance(updatedAppearance);
    saveAppearance(updatedAppearance);
  }

  return { appearance, updateAppearance };
}

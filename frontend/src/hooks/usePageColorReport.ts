import { useEffect } from "react";

import { APPEARANCE_CHANGE_EVENT } from "../appearance/appearanceSettings";

export function usePageColorReport(onPageColorChange?: (pageColor: string) => void) {
  useEffect(() => {
    if (!onPageColorChange) {
      return;
    }
    function reportPageColor() {
      onPageColorChange?.(getComputedStyle(document.body).backgroundColor);
    }
    reportPageColor();
    window.addEventListener(APPEARANCE_CHANGE_EVENT, reportPageColor);
    return () => window.removeEventListener(APPEARANCE_CHANGE_EVENT, reportPageColor);
  }, [onPageColorChange]);
}

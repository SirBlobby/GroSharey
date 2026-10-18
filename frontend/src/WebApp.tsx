"use dom";

import type { DOMProps } from "expo/dom";

import { applyAppearance, followSystemColorMode, readAppearance } from "./appearance/appearanceSettings";
import { AuthProvider } from "./context/AuthContext";
import { DeviceActions, DeviceActionsProvider } from "./context/DeviceActionsContext";
import { usePageColorReport } from "./hooks/usePageColorReport";
import RootNavigator from "./navigation/RootNavigator";
import { loadFonts } from "./styles/fonts";
import "./styles/themes.css";
import "./styles/global.css";
import "./styles/laptop.css";
import "./styles/mobile.css";

loadFonts();
applyAppearance(readAppearance());
followSystemColorMode();

type WebAppProps = DeviceActions & {
  onPageColorChange?: (pageColor: string) => void;
  dom?: DOMProps;
};

export default function WebApp({
  captureReceiptImage,
  scanQrCode,
  recordVoice,
  shareImage,
  onPageColorChange,
}: WebAppProps) {
  usePageColorReport(onPageColorChange);

  return (
    <DeviceActionsProvider deviceActions={{ captureReceiptImage, scanQrCode, recordVoice, shareImage }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </DeviceActionsProvider>
  );
}

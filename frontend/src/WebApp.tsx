"use dom";

import type { DOMProps } from "expo/dom";

import { applyAppearance, readAppearance } from "./appearance/appearanceSettings";
import { AuthProvider } from "./context/AuthContext";
import { DeviceActions, DeviceActionsProvider } from "./context/DeviceActionsContext";
import RootNavigator from "./navigation/RootNavigator";
import { loadFonts } from "./styles/fonts";
import "./styles/global.css";
import "./styles/mobile.css";

loadFonts();
applyAppearance(readAppearance());

type WebAppProps = DeviceActions & {
  dom?: DOMProps;
};

export default function WebApp({ captureReceiptImage }: WebAppProps) {
  return (
    <DeviceActionsProvider deviceActions={{ captureReceiptImage }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </DeviceActionsProvider>
  );
}

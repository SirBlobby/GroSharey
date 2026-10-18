import { createContext, ReactNode, useContext } from "react";

import type { ReceiptImage, ReceiptImageSource } from "../media/receiptImage";
import type { VoiceClip } from "../media/voiceRecording";

export type DeviceActions = {
  captureReceiptImage?: (source: ReceiptImageSource) => Promise<ReceiptImage | null>;
  scanQrCode?: () => Promise<string | null>;
  recordVoice?: () => Promise<VoiceClip | null>;
};

const DeviceActionsContext = createContext<DeviceActions>({});

type DeviceActionsProviderProps = {
  deviceActions: DeviceActions;
  children: ReactNode;
};

export function DeviceActionsProvider({ deviceActions, children }: DeviceActionsProviderProps) {
  return <DeviceActionsContext.Provider value={deviceActions}>{children}</DeviceActionsContext.Provider>;
}

export function useDeviceActions(): DeviceActions {
  return useContext(DeviceActionsContext);
}

import { createContext, ReactNode, useContext } from "react";

import type { ReceiptImage, ReceiptImageSource } from "../media/receiptImage";

export type DeviceActions = {
  captureReceiptImage?: (source: ReceiptImageSource) => Promise<ReceiptImage | null>;
  scanQrCode?: () => Promise<string | null>;
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

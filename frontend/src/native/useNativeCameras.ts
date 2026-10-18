import { useCallback, useRef, useState } from "react";

import {
  captureReceiptImageForWebView,
  prepareForWebView,
  ReceiptImage,
  ReceiptImageSource,
  shrinkReceiptPhoto,
} from "../media/receiptImage";
import type { TakenPhoto } from "./NativeReceiptCamera";

type OpenCamera = "none" | "receipt" | "qrCode";

export function useNativeCameras() {
  const [openCamera, setOpenCamera] = useState<OpenCamera>("none");
  const finishReceiptRef = useRef<((receiptImage: ReceiptImage | null) => void) | null>(null);
  const finishQrScanRef = useRef<((scannedText: string | null) => void) | null>(null);
  const receiptErrorRef = useRef<((error: unknown) => void) | null>(null);

  const captureReceiptImage = useCallback((source: ReceiptImageSource) => {
    if (source === "library") {
      return captureReceiptImageForWebView(source);
    }
    return new Promise<ReceiptImage | null>((resolve, reject) => {
      finishReceiptRef.current?.(null);
      finishReceiptRef.current = resolve;
      receiptErrorRef.current = reject;
      setOpenCamera("receipt");
    });
  }, []);

  const scanQrCode = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        finishQrScanRef.current?.(null);
        finishQrScanRef.current = resolve;
        setOpenCamera("qrCode");
      }),
    [],
  );

  function finishReceipt(receiptImage: ReceiptImage | null) {
    setOpenCamera("none");
    finishReceiptRef.current?.(receiptImage);
    finishReceiptRef.current = null;
    receiptErrorRef.current = null;
  }

  async function acceptPhoto(photo: TakenPhoto) {
    try {
      finishReceipt(prepareForWebView(await shrinkReceiptPhoto(photo.uri, photo.width, photo.height)));
    } catch (error) {
      setOpenCamera("none");
      receiptErrorRef.current?.(error);
      finishReceiptRef.current = null;
      receiptErrorRef.current = null;
    }
  }

  function finishQrScan(scannedText: string | null) {
    setOpenCamera("none");
    finishQrScanRef.current?.(scannedText);
    finishQrScanRef.current = null;
  }

  return {
    isReceiptCameraOpen: openCamera === "receipt",
    isQrScannerOpen: openCamera === "qrCode",
    captureReceiptImage,
    scanQrCode,
    acceptPhoto,
    cancelReceipt: () => finishReceipt(null),
    finishQrScan,
  };
}

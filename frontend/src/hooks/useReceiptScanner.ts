import { useState } from "react";

import { useDeviceActions } from "../context/DeviceActionsContext";
import { captureReceiptImage, ReceiptImage, ReceiptImageSource } from "../media/receiptImage";
import { parseReceipt, ScannedReceipt } from "../services/receipt";

type ScannerStatus = "idle" | "reading" | "done" | "error";

/** Take or pick a receipt photo, then read it with the backend. For the Scan Receipt screen. */
export function useReceiptScanner() {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scannedReceipt, setScannedReceipt] = useState<ScannedReceipt | null>(null);
  const deviceActions = useDeviceActions();
  const captureImage = deviceActions.captureReceiptImage ?? captureReceiptImage;

  async function scan(source: ReceiptImageSource): Promise<ScannedReceipt | null> {
    setErrorMessage(null);
    try {
      const receiptImage = await captureImage(source);
      return receiptImage ? await readImage(receiptImage) : null;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Couldn't read the receipt");
      setStatus("error");
      return null;
    }
  }

  async function readImage(receiptImage: ReceiptImage): Promise<ScannedReceipt | null> {
    setErrorMessage(null);
    try {
      setImageUri(receiptImage.uri);
      setStatus("reading");
      const receipt = await parseReceipt(receiptImage.base64);
      setScannedReceipt(receipt);
      setStatus("done");
      return receipt;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Couldn't read the receipt");
      setStatus("error");
      return null;
    }
  }

  function reset() {
    setStatus("idle");
    setErrorMessage(null);
    setImageUri(null);
    setScannedReceipt(null);
  }

  return { status, errorMessage, imageUri, scannedReceipt, scan, readImage, reset };
}

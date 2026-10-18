import { useState } from "react";

import { ScannedReceipt } from "../services/receipt";
import { EMPTY_RECEIPT_DETAILS, findItemProblem, ReceiptDetails, saveSplit } from "../services/splits";
import type { Item } from "../types";
import { readErrorMessage } from "../utils";

export type GroceryRunSource = "scan" | "manual";

export function useGroceryRun() {
  const [items, setItems] = useState<Item[]>([]);
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails>(EMPTY_RECEIPT_DETAILS);
  const [source, setSource] = useState<GroceryRunSource>("manual");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function startManualEntry() {
    setItems([]);
    setReceiptDetails(EMPTY_RECEIPT_DETAILS);
    setSource("manual");
    setErrorMessage(null);
  }

  function loadScannedReceipt(scannedReceipt: ScannedReceipt) {
    setItems(scannedReceipt.items);
    setReceiptDetails({
      storeName: scannedReceipt.storeName,
      purchaseDate: scannedReceipt.purchaseDate,
      tax: scannedReceipt.tax,
      tip: scannedReceipt.tip,
      warnings: scannedReceipt.warnings,
    });
    setSource("scan");
    setErrorMessage(null);
  }

  async function saveGroceryRun(): Promise<boolean> {
    const itemProblem = findItemProblem(items);
    if (itemProblem) {
      setErrorMessage(itemProblem);
      return false;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveSplit(items, receiptDetails);
      return true;
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't save this grocery run"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    items,
    setItems,
    receiptDetails,
    source,
    errorMessage,
    isSaving,
    startManualEntry,
    loadScannedReceipt,
    saveGroceryRun,
  };
}

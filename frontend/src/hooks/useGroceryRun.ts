import { useState } from "react";

import { ScannedReceipt } from "../services/receipt";
import {
  EMPTY_RECEIPT_DETAILS,
  EMPTY_SPLIT_PAYMENT,
  findItemProblem,
  ReceiptDetails,
  saveSplit,
  SplitPayment,
  UpfrontPayment,
} from "../services/splits";
import type { Item } from "../types";
import { readErrorMessage } from "../utils";

export type GroceryRunSource = "scan" | "manual";

export function useGroceryRun() {
  const [items, setItems] = useState<Item[]>([]);
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails>(EMPTY_RECEIPT_DETAILS);
  const [splitPayment, setSplitPayment] = useState<SplitPayment>(EMPTY_SPLIT_PAYMENT);
  const [source, setSource] = useState<GroceryRunSource>("manual");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function startManualEntry() {
    setItems([]);
    setReceiptDetails(EMPTY_RECEIPT_DETAILS);
    setSplitPayment(EMPTY_SPLIT_PAYMENT);
    setSource("manual");
    setErrorMessage(null);
  }

  function loadScannedReceipt(scannedReceipt: ScannedReceipt) {
    setItems(scannedReceipt.items);
    setReceiptDetails({
      storeName: scannedReceipt.storeName,
      storeAddress: scannedReceipt.storeAddress,
      purchaseDate: scannedReceipt.purchaseDate,
      receiptImageId: scannedReceipt.receiptImageId,
      tax: scannedReceipt.tax,
      tip: scannedReceipt.tip,
      warnings: scannedReceipt.warnings,
    });
    setSplitPayment(EMPTY_SPLIT_PAYMENT);
    setSource("scan");
    setErrorMessage(null);
  }

  function updateReceiptDetails(changes: Partial<ReceiptDetails>) {
    setReceiptDetails((currentDetails) => ({ ...currentDetails, ...changes }));
  }

  function setPayer(payerUsername: string | null) {
    setSplitPayment((currentPayment) => {
      const upfrontPayments = { ...currentPayment.upfrontPayments };
      if (payerUsername) {
        delete upfrontPayments[payerUsername];
      }
      return { payerUsername, upfrontPayments };
    });
  }

  function setUpfrontPayment(username: string, upfrontPayment: UpfrontPayment | null) {
    setSplitPayment((currentPayment) => {
      const upfrontPayments = { ...currentPayment.upfrontPayments };
      if (upfrontPayment) {
        upfrontPayments[username] = upfrontPayment;
      } else {
        delete upfrontPayments[username];
      }
      return { ...currentPayment, upfrontPayments };
    });
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
      await saveSplit(items, receiptDetails, splitPayment);
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
    splitPayment,
    source,
    errorMessage,
    isSaving,
    updateReceiptDetails,
    setPayer,
    setUpfrontPayment,
    startManualEntry,
    loadScannedReceipt,
    saveGroceryRun,
  };
}

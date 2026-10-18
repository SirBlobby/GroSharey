import { useState } from "react";

import { matchGroupItems } from "../services/groupSplit";
import { ScannedReceipt } from "../services/receipt";
import {
  EMPTY_RECEIPT_DETAILS,
  EMPTY_SPLIT_PAYMENT,
  findItemProblem,
  ReceiptDetails,
  saveSplit,
  SplitGroup,
  SplitPayment,
  UpfrontPayment,
} from "../services/splits";
import type { Item } from "../types";
import { Group } from "../types/group";
import { SavedSplit } from "../types/split";
import { readErrorMessage } from "../utils";

export function useGroceryRun() {
  const [items, setItems] = useState<Item[]>([]);
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails>(EMPTY_RECEIPT_DETAILS);
  const [splitPayment, setSplitPayment] = useState<SplitPayment>(EMPTY_SPLIT_PAYMENT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [splitGroup, setSplitGroup] = useState<SplitGroup | null>(null);
  const [isMatchingGroup, setIsMatchingGroup] = useState(false);
  const [groupErrorMessage, setGroupErrorMessage] = useState<string | null>(null);

  function resetGroup() {
    setSplitGroup(null);
    setGroupErrorMessage(null);
  }

  function startManualEntry() {
    setItems([]);
    setReceiptDetails(EMPTY_RECEIPT_DETAILS);
    setSplitPayment(EMPTY_SPLIT_PAYMENT);
    setErrorMessage(null);
    resetGroup();
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
    setErrorMessage(null);
    resetGroup();
  }

  async function chooseGroup(group: Group) {
    setIsMatchingGroup(true);
    setGroupErrorMessage(null);
    try {
      const groupMatch = await matchGroupItems(group, items);
      setItems(groupMatch.items);
      setSplitGroup(groupMatch.splitGroup);
    } catch (error) {
      setGroupErrorMessage(readErrorMessage(error, "Couldn't match items to the group's shopping list"));
    } finally {
      setIsMatchingGroup(false);
    }
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

  async function saveGroceryRun(): Promise<SavedSplit | null> {
    const itemProblem = findItemProblem(items);
    if (itemProblem) {
      setErrorMessage(itemProblem);
      return null;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      return await saveSplit(items, receiptDetails, splitPayment, splitGroup);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't save this grocery run"));
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    items,
    setItems,
    receiptDetails,
    splitPayment,
    errorMessage,
    isSaving,
    splitGroup,
    isMatchingGroup,
    groupErrorMessage,
    chooseGroup,
    clearGroup: resetGroup,
    updateReceiptDetails,
    setPayer,
    setUpfrontPayment,
    startManualEntry,
    loadScannedReceipt,
    saveGroceryRun,
  };
}

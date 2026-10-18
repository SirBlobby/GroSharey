import { useState } from "react";

import { splitsApi } from "../api/splitsApi";
import { SavedSplit } from "../types/split";
import { readErrorMessage } from "../utils";

export function useSplitDisputes(split: SavedSplit, onSplitChange: (updatedSplit: SavedSplit) => void) {
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function sendUpdate(request: () => Promise<SavedSplit>, fallbackError: string): Promise<boolean> {
    setIsSending(true);
    setErrorMessage(null);
    try {
      onSplitChange(await request());
      return true;
    } catch (error) {
      setErrorMessage(readErrorMessage(error, fallbackError));
      return false;
    } finally {
      setIsSending(false);
    }
  }

  function disputeItem(itemId: string, reason: string | null) {
    return sendUpdate(() => splitsApi.disputeItem(split.id, itemId, reason), "Couldn't send that");
  }

  function resolveDispute(disputeId: string, resolution: "dismissed" | "removed") {
    return sendUpdate(() => splitsApi.resolveDispute(split.id, disputeId, resolution), "Couldn't settle that dispute");
  }

  return { isSending, errorMessage, disputeItem, resolveDispute };
}

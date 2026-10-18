import { useState } from "react";

import { ItemDispute, ItemShare } from "../../types/split";
import { money } from "../../utils";
import { DisputeIcon } from "../icons";

type SplitPersonItemsProps = {
  items: ItemShare[];
  disputes: ItemDispute[];
  canDispute: boolean;
  isSending: boolean;
  onDispute: (itemId: string, reason: string | null) => Promise<boolean>;
};

const DISPUTE_LABELS: Record<ItemDispute["status"], string> = {
  open: "Disputed",
  dismissed: "Kept on share",
  removed: "Taken off",
};

export default function SplitPersonItems({ items, disputes, canDispute, isSending, onDispute }: SplitPersonItemsProps) {
  const [disputingItemId, setDisputingItemId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  function findLatestDispute(itemId: string): ItemDispute | undefined {
    return [...disputes].reverse().find((dispute) => dispute.item_id === itemId);
  }

  async function sendDispute(itemId: string) {
    if (await onDispute(itemId, reason.trim() || null)) {
      setDisputingItemId(null);
      setReason("");
    }
  }

  return (
    <ul className="history-items">
      {items.map((itemShare) => {
        const latestDispute = findLatestDispute(itemShare.item_id);
        const isOpen = latestDispute?.status === "open";
        return (
          <li key={itemShare.item_id} className="history-item">
            <div className="history-item-row">
              <span className="history-item-name">
                {itemShare.name}
                {latestDispute && (
                  <span className={`dispute-tag dispute-tag--${latestDispute.status}`}>
                    {DISPUTE_LABELS[latestDispute.status]}
                  </span>
                )}
              </span>
              <span>{money(itemShare.total)}</span>
            </div>
            {canDispute && !isOpen && disputingItemId !== itemShare.item_id && (
              <button type="button" className="dispute-button" onClick={() => setDisputingItemId(itemShare.item_id)}>
                <DisputeIcon /> I didn't get this
              </button>
            )}
            {disputingItemId === itemShare.item_id && (
              <div className="dispute-form">
                <input
                  value={reason}
                  maxLength={200}
                  placeholder="What happened? (optional)"
                  aria-label="Reason"
                  onChange={(event) => setReason(event.target.value)}
                />
                <button type="button" className="history-button" disabled={isSending} onClick={() => sendDispute(itemShare.item_id)}>
                  Send
                </button>
                <button type="button" className="history-button" onClick={() => setDisputingItemId(null)}>
                  Cancel
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

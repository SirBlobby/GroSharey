import { useState } from "react";

import type { ReceiptDetails } from "../services/splits";
import { estimateShares, sumItemPrices } from "../services/splitEstimate";
import type { Friend, Item } from "../types";
import { formatReceiptDate, money } from "../utils";
import Avatar from "./Avatar";
import { CalendarIcon, CheckIcon, LocationIcon, StoreIcon, ViewReceiptIcon } from "./icons";
import ReceiptViewerModal from "./ReceiptViewerModal";

type SplitSummaryProps = {
  items: Item[];
  receiptDetails: ReceiptDetails;
  friends: Friend[];
  errorMessage: string | null;
  isSaving: boolean;
  onToggleOnEveryItem: (username: string) => void;
  onConfirm: () => void;
};

function buildMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function SplitSummary({
  items,
  receiptDetails,
  friends,
  errorMessage,
  isSaving,
  onToggleOnEveryItem,
  onConfirm,
}: SplitSummaryProps) {
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const subtotal = sumItemPrices(items);
  const total = subtotal + (receiptDetails.tax ?? 0) + (receiptDetails.tip ?? 0);
  const unassignedCount = items.filter((item) => item.usernames.length === 0).length;
  const estimatedShares = estimateShares(items, receiptDetails);

  function isOnEveryItem(username: string): boolean {
    return items.length > 0 && items.every((item) => item.usernames.includes(username));
  }

  function findName(username: string): string {
    return friends.find((friend) => friend.username === username)?.name ?? `@${username}`;
  }

  return (
    <aside className="card split-summary">
      <h2>Summary</h2>
      {(receiptDetails.storeName || receiptDetails.storeAddress || receiptDetails.purchaseDate) && (
        <div className="receipt-details">
          {receiptDetails.storeName && (
            <span className="receipt-detail">
              <StoreIcon /> {receiptDetails.storeName}
            </span>
          )}
          {receiptDetails.storeAddress && (
            <a
              className="receipt-detail receipt-location"
              href={buildMapsUrl(receiptDetails.storeAddress)}
              target="_blank"
              rel="noreferrer"
            >
              <LocationIcon /> {receiptDetails.storeAddress}
            </a>
          )}
          {receiptDetails.purchaseDate && (
            <span className="receipt-detail">
              <CalendarIcon /> {formatReceiptDate(receiptDetails.purchaseDate)}
            </span>
          )}
        </div>
      )}

      {receiptDetails.receiptImageId && (
        <button type="button" className="btn view-receipt-button" onClick={() => setIsReceiptOpen(true)}>
          <ViewReceiptIcon /> View Receipt
        </button>
      )}

      <dl className="summary-totals">
        <div className="summary-row">
          <dt>Subtotal</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        {receiptDetails.tax !== null && (
          <div className="summary-row">
            <dt>Tax</dt>
            <dd>{money(receiptDetails.tax)}</dd>
          </div>
        )}
        {receiptDetails.tip !== null && (
          <div className="summary-row">
            <dt>Tip</dt>
            <dd>{money(receiptDetails.tip)}</dd>
          </div>
        )}
        <div className="summary-row summary-total">
          <dt>Total</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>

      <div className="summary-section">
        <h3>Add to every item</h3>
        <div className="quick-assign">
          {friends.map((friend) => (
            <button
              key={friend.username}
              type="button"
              className={`quick-assign-option ${isOnEveryItem(friend.username) ? "selected" : ""}`}
              aria-pressed={isOnEveryItem(friend.username)}
              onClick={() => onToggleOnEveryItem(friend.username)}
            >
              <Avatar friend={friend} />
              <span className="quick-assign-name">{friend.name}</span>
              {isOnEveryItem(friend.username) && <CheckIcon />}
            </button>
          ))}
        </div>
      </div>

      {estimatedShares.length > 0 && (
        <div className="summary-section">
          <h3>Estimated shares</h3>
          <ul className="share-list">
            {estimatedShares.map((share) => (
              <li key={share.username}>
                <span>{findName(share.username)}</span>
                <span>{money(share.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unassignedCount > 0 && (
        <p className="summary-warning">
          {unassignedCount} {unassignedCount === 1 ? "item needs" : "items need"} someone assigned
        </p>
      )}
      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <button type="button" className="btn summary-confirm" onClick={onConfirm} disabled={isSaving}>
        <CheckIcon /> {isSaving ? "Saving..." : "Confirm Split"}
      </button>

      {isReceiptOpen && receiptDetails.receiptImageId && (
        <ReceiptViewerModal
          receiptImageId={receiptDetails.receiptImageId}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </aside>
  );
}

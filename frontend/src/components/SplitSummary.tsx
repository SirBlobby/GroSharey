import { useState } from "react";

import type { ReceiptDetails, SplitPayment, UpfrontPayment } from "../services/splits";
import { estimateShares, sumItemPrices } from "../services/splitEstimate";
import type { Friend, Item } from "../types";
import { formatReceiptDate, money } from "../utils";
import { CalendarIcon, CheckIcon, LocationIcon, StoreIcon, ViewReceiptIcon } from "./icons";
import ItemPickerModal from "./manage/ItemPickerModal";
import PayerPicker from "./manage/PayerPicker";
import PersonShareRow from "./manage/PersonShareRow";
import ReceiptViewerModal from "./ReceiptViewerModal";

type SplitSummaryProps = {
  items: Item[];
  receiptDetails: ReceiptDetails;
  friends: Friend[];
  currentUsername: string;
  splitPayment: SplitPayment;
  errorMessage: string | null;
  isSaving: boolean;
  onPayerChange: (username: string) => void;
  onUpfrontPaymentChange: (username: string, upfrontPayment: UpfrontPayment | null) => void;
  onSetPersonItems: (username: string, itemIds: string[]) => void;
  onConfirm: () => void;
};

function buildMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function SplitSummary({
  items,
  receiptDetails,
  friends,
  currentUsername,
  splitPayment,
  errorMessage,
  isSaving,
  onPayerChange,
  onUpfrontPaymentChange,
  onSetPersonItems,
  onConfirm,
}: SplitSummaryProps) {
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [pickingItemsFor, setPickingItemsFor] = useState<Friend | null>(null);
  const subtotal = sumItemPrices(items);
  const total = subtotal + (receiptDetails.tax ?? 0) + (receiptDetails.tip ?? 0);
  const unassignedCount = items.filter((item) => item.usernames.length === 0).length;
  const sharesByUsername = new Map(
    estimateShares(items, receiptDetails).map((share) => [share.username, share.amount]),
  );
  const payerUsername = splitPayment.payerUsername ?? currentUsername;

  function findItemIds(username: string): string[] {
    return items.filter((item) => item.usernames.includes(username)).map((item) => item.id);
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

      <PayerPicker people={friends} payerUsername={payerUsername} onPayerChange={onPayerChange} />

      <div className="summary-section">
        <h3>People</h3>
        <p className="description">Estimated shares. Final amounts are worked out when you confirm.</p>
        <ul className="person-shares">
          {friends.map((person) => (
            <PersonShareRow
              key={person.username}
              person={person}
              share={sharesByUsername.get(person.username) ?? 0}
              itemCount={findItemIds(person.username).length}
              isPayer={person.username === payerUsername}
              upfrontPayment={splitPayment.upfrontPayments[person.username]}
              onPickItems={() => setPickingItemsFor(person)}
              onUpfrontPaymentChange={(upfrontPayment) => onUpfrontPaymentChange(person.username, upfrontPayment)}
            />
          ))}
        </ul>
      </div>

      {unassignedCount > 0 && (
        <p className="summary-warning">
          {unassignedCount} {unassignedCount === 1 ? "item needs" : "items need"} someone assigned
        </p>
      )}
      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <button type="button" className="btn summary-confirm" onClick={onConfirm} disabled={isSaving}>
        <CheckIcon /> {isSaving ? "Saving..." : "Confirm Split"}
      </button>

      {pickingItemsFor && (
        <ItemPickerModal
          personName={pickingItemsFor.name}
          items={items}
          initialSelectedIds={findItemIds(pickingItemsFor.username)}
          onDone={(itemIds) => {
            onSetPersonItems(pickingItemsFor.username, itemIds);
            setPickingItemsFor(null);
          }}
          onClose={() => setPickingItemsFor(null)}
        />
      )}

      {isReceiptOpen && receiptDetails.receiptImageId && (
        <ReceiptViewerModal
          receiptImageId={receiptDetails.receiptImageId}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </aside>
  );
}

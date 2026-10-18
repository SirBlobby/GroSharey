import { useState } from "react";

import type { ReceiptDetails } from "../../services/splits";
import { formatPrice } from "../../utils";
import { CalendarIcon, LocationIcon, StoreIcon } from "../icons";

export const STORE_NAME_INPUT_ID = "receipt-store-name";

type ReceiptDetailsFormProps = {
  receiptDetails: ReceiptDetails;
  onChange: (changes: Partial<ReceiptDetails>) => void;
};

function formatAmount(amount: number | null): string {
  return amount === null ? "" : amount.toFixed(2);
}

function parseAmount(amountText: string): number | null {
  const parsedAmount = parseFloat(amountText.replace(/[^0-9.]/g, ""));
  return isNaN(parsedAmount) ? null : parsedAmount;
}

function readTextOrNull(text: string): string | null {
  return text.trim().length > 0 ? text : null;
}

export default function ReceiptDetailsForm({ receiptDetails, onChange }: ReceiptDetailsFormProps) {
  const [taxText, setTaxText] = useState(formatAmount(receiptDetails.tax));
  const [tipText, setTipText] = useState(formatAmount(receiptDetails.tip));

  function updateTax(text: string) {
    setTaxText(text);
    onChange({ tax: parseAmount(text) });
  }

  function updateTip(text: string) {
    setTipText(text);
    onChange({ tip: parseAmount(text) });
  }

  return (
    <div className="card receipt-details-form">
      <h2>Receipt Details</h2>
      <div className="receipt-fields">
        <label className="receipt-field receipt-field--wide">
          <span>
            <StoreIcon /> Store
          </span>
          <input
            id={STORE_NAME_INPUT_ID}
            value={receiptDetails.storeName ?? ""}
            placeholder="Wegmans"
            onChange={(event) => onChange({ storeName: readTextOrNull(event.target.value) })}
          />
        </label>
        <label className="receipt-field receipt-field--wide">
          <span>
            <LocationIcon /> Location
          </span>
          <input
            value={receiptDetails.storeAddress ?? ""}
            placeholder="123 Main St, Fairfax, VA"
            onChange={(event) => onChange({ storeAddress: readTextOrNull(event.target.value) })}
          />
        </label>
        <label className="receipt-field">
          <span>
            <CalendarIcon /> Date
          </span>
          <input
            type="date"
            value={receiptDetails.purchaseDate ?? ""}
            onChange={(event) => onChange({ purchaseDate: readTextOrNull(event.target.value) })}
          />
        </label>
        <label className="receipt-field">
          <span>Tax</span>
          <div className="price-wrap receipt-amount">
            <span>$</span>
            <input
              value={taxText}
              inputMode="decimal"
              placeholder="0.00"
              onChange={(event) => updateTax(event.target.value)}
              onBlur={(event) => setTaxText(formatPrice(event.target.value))}
            />
          </div>
        </label>
        <label className="receipt-field">
          <span>Tip</span>
          <div className="price-wrap receipt-amount">
            <span>$</span>
            <input
              value={tipText}
              inputMode="decimal"
              placeholder="0.00"
              onChange={(event) => updateTip(event.target.value)}
              onBlur={(event) => setTipText(formatPrice(event.target.value))}
            />
          </div>
        </label>
      </div>
    </div>
  );
}

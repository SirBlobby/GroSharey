import { useState } from "react";

import type { UpfrontPayment } from "../../services/splits";
import type { Friend } from "../../types";
import { formatPrice, money } from "../../utils";
import Avatar from "../Avatar";
import { ListIcon } from "../icons";

type PaymentChoice = "owes" | "partial" | "full";

const PAYMENT_CHOICES: { value: PaymentChoice; label: string }[] = [
  { value: "owes", label: "Owes" },
  { value: "partial", label: "Paid some" },
  { value: "full", label: "Paid all" },
];

type PersonShareRowProps = {
  person: Friend;
  share: number;
  itemCount: number;
  isPayer: boolean;
  upfrontPayment: UpfrontPayment | undefined;
  onPickItems: () => void;
  onUpfrontPaymentChange: (upfrontPayment: UpfrontPayment | null) => void;
};

function describeRemaining(share: number, upfrontPayment: UpfrontPayment | undefined): string {
  if (!upfrontPayment) {
    return `owes ${money(share)}`;
  }
  if (upfrontPayment.kind === "full") {
    return "all paid";
  }
  const remaining = share - upfrontPayment.amount;
  if (remaining < 0) {
    return `overpaid, gets ${money(-remaining)} back`;
  }
  return `owes ${money(remaining)} more`;
}

export default function PersonShareRow({
  person,
  share,
  itemCount,
  isPayer,
  upfrontPayment,
  onPickItems,
  onUpfrontPaymentChange,
}: PersonShareRowProps) {
  const [paidText, setPaidText] = useState(
    upfrontPayment?.kind === "partial" ? upfrontPayment.amount.toFixed(2) : "",
  );
  const paymentChoice: PaymentChoice = upfrontPayment?.kind ?? "owes";

  function choosePayment(choice: PaymentChoice) {
    if (choice === "owes") {
      onUpfrontPaymentChange(null);
    } else if (choice === "full") {
      onUpfrontPaymentChange({ kind: "full" });
    } else {
      onUpfrontPaymentChange({ kind: "partial", amount: parseFloat(paidText) || 0 });
    }
  }

  function updatePaidText(text: string) {
    setPaidText(text);
    onUpfrontPaymentChange({ kind: "partial", amount: parseFloat(text.replace(/[^0-9.]/g, "")) || 0 });
  }

  return (
    <li className={`person-share ${isPayer ? "person-share--payer" : ""}`}>
      <div className="person-share-top">
        <Avatar friend={person} />
        <div className="person-share-names">
          <span className="person-share-name">{person.name}</span>
          <span className="person-share-amount">
            {money(share)} share
            {!isPayer && share > 0 && <> · {describeRemaining(share, upfrontPayment)}</>}
            {isPayer && <> · paid at the store</>}
          </span>
        </div>
        <button type="button" className="person-share-items" onClick={onPickItems}>
          <ListIcon /> Items ({itemCount})
        </button>
      </div>

      {!isPayer && share > 0 && (
        <div className="person-share-payment">
          <div className="payment-choices" role="radiogroup" aria-label={`What ${person.name} already paid`}>
            {PAYMENT_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={paymentChoice === choice.value}
                className={`payment-choice ${paymentChoice === choice.value ? "selected" : ""}`}
                onClick={() => choosePayment(choice.value)}
              >
                {choice.label}
              </button>
            ))}
          </div>
          {paymentChoice === "partial" && (
            <div className="price-wrap paid-amount">
              <span>$</span>
              <input
                value={paidText}
                inputMode="decimal"
                placeholder="0.00"
                aria-label={`Amount ${person.name} already paid`}
                onChange={(event) => updatePaidText(event.target.value)}
                onBlur={(event) => setPaidText(formatPrice(event.target.value))}
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

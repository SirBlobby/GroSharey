import { FormEvent, useState } from "react";

import type { Friend } from "../types";
import { formatPrice, money, readErrorMessage } from "../utils";

type PaymentFormProps = {
  friend: Friend;
  onRecordPayment: (friend: Friend, amount: number) => Promise<void>;
};

function describeAfterPayment(friend: Friend, amount: number): string {
  const remainingCents = Math.round(Math.abs(friend.balance) * 100) - Math.round(amount * 100);
  if (remainingCents === 0) {
    return "This settles you up.";
  }
  if (remainingCents > 0) {
    return `${money(remainingCents / 100)} will still be left.`;
  }
  const creditHolder = friend.balance < 0 ? `${friend.name} will owe you` : `You'll owe ${friend.name}`;
  return `That's more than owed. ${creditHolder} ${money(-remainingCents / 100)}.`;
}

export default function PaymentForm({ friend, onRecordPayment }: PaymentFormProps) {
  const [amountText, setAmountText] = useState(Math.abs(friend.balance).toFixed(2));
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amount = parseFloat(amountText.replace(/[^0-9.]/g, "")) || 0;
  const youOweFriend = friend.balance < 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amount <= 0) {
      return;
    }
    setIsRecording(true);
    setErrorMessage(null);
    try {
      await onRecordPayment(friend, amount);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't record the payment"));
    } finally {
      setIsRecording(false);
    }
  }

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <label className="payment-form-label" htmlFor={`payment-amount-${friend.username}`}>
        {youOweFriend ? `Amount you paid ${friend.name}` : `Amount ${friend.name} paid you`}
      </label>
      <div className="payment-form-row">
        <div className="price-wrap payment-amount">
          <span>$</span>
          <input
            id={`payment-amount-${friend.username}`}
            value={amountText}
            inputMode="decimal"
            onChange={(event) => setAmountText(event.target.value)}
            onBlur={(event) => setAmountText(formatPrice(event.target.value))}
          />
        </div>
        <button type="submit" className="btn settle" disabled={isRecording || amount <= 0}>
          {isRecording ? "Saving..." : youOweFriend ? "I paid" : "They paid"}
        </button>
      </div>
      {amount > 0 && <p className="payment-form-hint">{describeAfterPayment(friend, amount)}</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </form>
  );
}

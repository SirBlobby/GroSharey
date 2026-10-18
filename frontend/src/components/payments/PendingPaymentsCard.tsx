import { useState } from "react";

import type { Friend } from "../../types";
import { Payment } from "../../types/payment";
import { formatDateTime, money, readErrorMessage } from "../../utils";
import Avatar from "../Avatar";
import { CheckIcon } from "../icons";
import "../../styles/payments.css";

type PendingPaymentsCardProps = {
  paymentsToConfirm: Payment[];
  peopleByUsername: Map<string, Friend>;
  onConfirm: (paymentId: string) => Promise<void>;
};

export default function PendingPaymentsCard({ paymentsToConfirm, peopleByUsername, onConfirm }: PendingPaymentsCardProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (paymentsToConfirm.length === 0) {
    return null;
  }

  async function confirm(paymentId: string) {
    setConfirmingId(paymentId);
    setErrorMessage(null);
    try {
      await onConfirm(paymentId);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't confirm that payment"));
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="card pending-payments">
      <h2>Did you get paid?</h2>
      <ul className="pending-payment-list">
        {paymentsToConfirm.map((payment) => {
          const payer = peopleByUsername.get(payment.from_username);
          return (
            <li key={payment.id} className="pending-payment">
              {payer && <Avatar friend={payer} />}
              <span className="pending-payment-text">
                <strong>{payer?.name ?? `@${payment.from_username}`}</strong> says they paid you{" "}
                <strong>{money(payment.amount)}</strong>
                <span className="pending-payment-time">{formatDateTime(payment.created_at)}</span>
              </span>
              <button
                type="button"
                className="btn pending-payment-confirm"
                disabled={confirmingId === payment.id}
                onClick={() => confirm(payment.id)}
              >
                <CheckIcon /> {confirmingId === payment.id ? "Confirming..." : "Confirm"}
              </button>
            </li>
          );
        })}
      </ul>
      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  );
}

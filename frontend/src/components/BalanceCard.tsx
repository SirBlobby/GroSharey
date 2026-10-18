import { ReactNode } from "react";

import type { Friend } from "../types";
import { money } from "../utils";
import PaymentForm from "./PaymentForm";
import "../styles/payments.css";

type BalanceCardProps = {
  friend: Friend | undefined;
  onSettleUp: (friend: Friend, amount: number) => Promise<void>;
  waitingAmount?: number;
  header?: ReactNode;
};

export default function BalanceCard({ friend, onSettleUp, waitingAmount = 0, header }: BalanceCardProps) {
  const waitingNote = friend && waitingAmount > 0 && (
    <p className="payment-waiting">
      Waiting for {friend.name} to confirm {money(waitingAmount)} you paid
    </p>
  );

  if (!friend) {
    return (
      <div className="card owe">
        <h2>Add a friend to get started</h2>
      </div>
    );
  }

  if (friend.balance === 0) {
    return (
      <div className="card owe">
        {header}
        <div className="balance-summary">
          <h2>You and {friend.name}</h2>
          <div className="amt ok">are all settled up!</div>
          {waitingNote}
        </div>
      </div>
    );
  }

  const youOweFriend = friend.balance < 0;
  const hasPayLink = youOweFriend && Boolean(friend.paypalPayUrl || friend.venmoPayUrl);

  return (
    <div className="card owe">
      {header}
      <div className="balance-summary">
        <h2>{youOweFriend ? `You owe ${friend.name}` : `${friend.name} owes you`}</h2>
        <div className={`amt ${youOweFriend ? "" : "owed-to-you"}`}>{money(Math.abs(friend.balance))}</div>
        {waitingNote}
      </div>
      <div className="pay">
        {hasPayLink && "pay with"}
        {youOweFriend && friend.paypalPayUrl && (
          <a className="paypal" href={friend.paypalPayUrl} target="_blank" rel="noreferrer">
            PayPal
          </a>
        )}
        {youOweFriend && friend.venmoPayUrl && (
          <a className="venmo" href={friend.venmoPayUrl} target="_blank" rel="noreferrer">
            venmo
          </a>
        )}
        <PaymentForm key={`${friend.username}:${friend.balance}`} friend={friend} onRecordPayment={onSettleUp} />
      </div>
    </div>
  );
}

import { useState } from "react";

import type { Friend } from "../types";
import { money, readErrorMessage } from "../utils";

type BalanceCardProps = {
  friend: Friend | undefined;
  onSettleUp: (friend: Friend) => Promise<void>;
};

export default function BalanceCard({ friend, onSettleUp }: BalanceCardProps) {
  const [isSettling, setIsSettling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <div>
          <h2>You and {friend.name}</h2>
          <div className="amt ok">are all settled up!</div>
        </div>
      </div>
    );
  }

  const youOweFriend = friend.balance < 0;
  const hasPayLink = youOweFriend && Boolean(friend.paypalPayUrl || friend.venmoPayUrl);

  async function settleUp(settlingFriend: Friend) {
    setIsSettling(true);
    setErrorMessage(null);
    try {
      await onSettleUp(settlingFriend);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't record the payment"));
    } finally {
      setIsSettling(false);
    }
  }

  return (
    <div className="card owe">
      <div>
        <h2>{youOweFriend ? `You owe ${friend.name}` : `${friend.name} owes you`}</h2>
        <div className={`amt ${youOweFriend ? "" : "owed-to-you"}`}>{money(Math.abs(friend.balance))}</div>
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
        <button type="button" className="btn settle" disabled={isSettling} onClick={() => settleUp(friend)}>
          {youOweFriend ? "Mark as paid" : "Mark as received"}
        </button>
        {errorMessage && <p className="error-text">{errorMessage}</p>}
      </div>
    </div>
  );
}

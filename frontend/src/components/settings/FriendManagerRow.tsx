import { useState } from "react";

import type { Friend } from "../../types";
import { money } from "../../utils";
import Avatar from "../Avatar";
import { RemoveFriendIcon } from "../icons";

type FriendManagerRowProps = {
  friend: Friend;
  onView: () => void;
  onRemove: () => Promise<void>;
};

function describeBalance(balance: number): { label: string; className: string } {
  if (balance < 0) {
    return { label: `You owe ${money(-balance)}`, className: "balance-owe" };
  }
  if (balance > 0) {
    return { label: `Owes you ${money(balance)}`, className: "balance-owed" };
  }
  return { label: "Settled up", className: "balance-settled" };
}

export default function FriendManagerRow({ friend, onView, onRemove }: FriendManagerRowProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const balance = describeBalance(friend.balance);

  async function confirmRemove() {
    if (!window.confirm(`Remove ${friend.name} from your friends?`)) {
      return;
    }
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <li className="manager-row">
      <button type="button" className="manager-row-profile" onClick={onView}>
        <Avatar friend={friend} />
        <span className="manager-row-names">
          <span className="manager-row-name">{friend.name}</span>
          <span className="manager-row-handle">@{friend.username}</span>
        </span>
      </button>
      <span className={`manager-row-balance ${balance.className}`}>{balance.label}</span>
      <button type="button" className="manager-row-remove" disabled={isRemoving} onClick={confirmRemove}>
        <RemoveFriendIcon /> {isRemoving ? "Removing..." : "Remove"}
      </button>
    </li>
  );
}

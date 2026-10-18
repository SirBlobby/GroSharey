import { useState } from "react";

import type { Friend } from "../../types";
import { SavedSplit } from "../../types/split";
import { formatReceiptDate, money } from "../../utils";
import Avatar from "../Avatar";
import { CollapseIcon, ExpandIcon, LocationIcon, ViewReceiptIcon } from "../icons";

type SplitHistoryCardProps = {
  split: SavedSplit;
  currentUsername: string;
  peopleByUsername: Map<string, Friend>;
  onViewReceipt: (receiptImageId: string) => void;
};

function describeSplitDate(split: SavedSplit): string {
  if (split.purchase_date) {
    return formatReceiptDate(split.purchase_date);
  }
  return new Date(split.created_at).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function describeYourPart(split: SavedSplit, currentUsername: string): { label: string; className: string } {
  if (split.payer === currentUsername) {
    const owedToYou = split.people.reduce((total, person) => total + person.owes, 0);
    return { label: `You paid, owed ${money(owedToYou)}`, className: "history-owed" };
  }
  const yourOwes = split.people.find((person) => person.username === currentUsername)?.owes ?? 0;
  if (yourOwes < 0) {
    return { label: `You overpaid, owed ${money(-yourOwes)} back`, className: "history-owed" };
  }
  if (yourOwes === 0) {
    return { label: "You're all paid up", className: "history-settled" };
  }
  return { label: `You owe @${split.payer} ${money(yourOwes)}`, className: "history-owe" };
}

export default function SplitHistoryCard({
  split,
  currentUsername,
  peopleByUsername,
  onViewReceipt,
}: SplitHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const yourPart = describeYourPart(split, currentUsername);

  function findName(username: string): string {
    return peopleByUsername.get(username)?.name ?? `@${username}`;
  }

  return (
    <li className="history-card">
      <div className="history-card-top">
        <div className="history-card-title">
          <span className="history-store">{split.store_name ?? "Grocery run"}</span>
          <span className="history-date">{describeSplitDate(split)}</span>
          {split.store_address && (
            <span className="history-location">
              <LocationIcon /> {split.store_address}
            </span>
          )}
        </div>
        <span className="history-total">{money(split.total)}</span>
      </div>

      <div className="history-card-middle">
        <div className="history-people">
          {split.people.map((person) => {
            const knownPerson = peopleByUsername.get(person.username);
            return knownPerson ? (
              <Avatar key={person.username} friend={knownPerson} />
            ) : (
              <span key={person.username} className="history-unknown-person">@{person.username}</span>
            );
          })}
        </div>
        <span className={`history-your-part ${yourPart.className}`}>{yourPart.label}</span>
      </div>

      <div className="history-card-actions">
        {split.receipt_image_id && (
          <button
            type="button"
            className="history-button"
            onClick={() => split.receipt_image_id && onViewReceipt(split.receipt_image_id)}
          >
            <ViewReceiptIcon /> View Receipt
          </button>
        )}
        <button type="button" className="history-button" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
          {isExpanded ? "Hide Details" : "Details"}
        </button>
      </div>

      {isExpanded && (
        <div className="history-details">
          <p className="history-payer">Paid by {findName(split.payer)}</p>
          {split.people.map((person) => (
            <div key={person.username} className="history-person">
              <div className="history-person-header">
                <span>{findName(person.username)}</span>
                <span>{money(person.total)}</span>
              </div>
              {person.paid > 0 && (
                <p className="history-paid-upfront">
                  Paid {money(person.paid)} upfront
                  {person.owes < 0 ? `, owed ${money(-person.owes)} back` : `, ${money(person.owes)} left`}
                </p>
              )}
              <ul className="history-items">
                {person.items.map((itemShare) => (
                  <li key={itemShare.item_id}>
                    <span>{itemShare.name}</span>
                    <span>{money(itemShare.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {split.tax_note && <p className="description">{split.tax_note}</p>}
        </div>
      )}
    </li>
  );
}

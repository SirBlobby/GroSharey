import { useState } from "react";

import { useSplitDisputes } from "../../hooks/useSplitDisputes";
import { describeSplitStanding } from "../../services/splitStanding";
import type { Friend } from "../../types";
import { SavedSplit } from "../../types/split";
import { formatReceiptDate, money } from "../../utils";
import Avatar from "../Avatar";
import { CollapseIcon, DisputeIcon, ExpandIcon, LocationIcon, ViewReceiptIcon } from "../icons";
import DisputeReviewList from "./DisputeReviewList";
import SplitPersonItems from "./SplitPersonItems";

type SplitHistoryCardProps = {
  split: SavedSplit;
  currentUsername: string;
  peopleByUsername: Map<string, Friend>;
  unpaidForSplit: Map<string, number>;
  focusUsername?: string;
  onViewReceipt: (receiptImageId: string) => void;
  onSplitChange: (updatedSplit: SavedSplit) => void;
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

export default function SplitHistoryCard({
  split,
  currentUsername,
  peopleByUsername,
  unpaidForSplit,
  focusUsername,
  onViewReceipt,
  onSplitChange,
}: SplitHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const splitDisputes = useSplitDisputes(split, onSplitChange);
  const canReviewDisputes = split.payer === currentUsername || split.created_by === currentUsername;
  const openDisputeCount = split.disputes.filter((dispute) => dispute.status === "open").length;
  const yourPart = describeSplitStanding(split, currentUsername, unpaidForSplit, focusUsername);

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
        {openDisputeCount > 0 && (
          <span className="dispute-count">
            <DisputeIcon /> {openDisputeCount} disputed
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="history-details">
          <p className="history-payer">Paid by {findName(split.payer)}</p>
          {canReviewDisputes && (
            <DisputeReviewList
              disputes={split.disputes}
              isSending={splitDisputes.isSending}
              findName={findName}
              onResolve={splitDisputes.resolveDispute}
            />
          )}
          {splitDisputes.errorMessage && <p className="error-text">{splitDisputes.errorMessage}</p>}
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
              <SplitPersonItems
                items={person.items}
                disputes={split.disputes.filter((dispute) => dispute.username === person.username)}
                canDispute={person.username === currentUsername && split.payer !== currentUsername}
                isSending={splitDisputes.isSending}
                onDispute={splitDisputes.disputeItem}
              />
            </div>
          ))}
          {split.tax_note && <p className="description">{split.tax_note}</p>}
        </div>
      )}
    </li>
  );
}

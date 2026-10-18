import { useMemo, useState } from "react";

import { usePagination } from "../../hooks/usePagination";
import { useSplitHistory } from "../../hooks/useSplitHistory";
import { calculateUnpaidAmounts } from "../../services/splitStanding";
import type { Friend } from "../../types";
import SplitHistoryCard from "../history/SplitHistoryCard";
import Pagination from "../Pagination";
import ReceiptViewerModal from "../ReceiptViewerModal";
import "../../styles/history.css";

type SharedSplitsProps = {
  friendUsername: string;
  friendName: string;
  currentUsername: string;
  people: Friend[];
};

export default function SharedSplits({ friendUsername, friendName, currentUsername, people }: SharedSplitsProps) {
  const { splits, isLoading, errorMessage } = useSplitHistory();
  const [viewingReceiptImageId, setViewingReceiptImageId] = useState<string | null>(null);

  const sharedSplits = splits.filter(
    (split) =>
      split.payer === friendUsername || split.people.some((person) => person.username === friendUsername),
  );
  const peopleByUsername = new Map(people.map((person) => [person.username, person]));
  const unpaidAmounts = useMemo(
    () => calculateUnpaidAmounts(splits, currentUsername, people),
    [splits, currentUsername, people],
  );
  const sharedSplitPages = usePagination(sharedSplits, 5);

  return (
    <div className="card shared-splits">
      <div className="history-header">
        <h2>Grocery runs together</h2>
        <span className="history-count">{sharedSplits.length}</span>
      </div>
      {isLoading && <p className="description">Loading...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {!isLoading && !errorMessage && sharedSplits.length === 0 && (
        <p className="empty">No grocery runs with {friendName} yet.</p>
      )}
      {sharedSplits.length > 0 && (
        <ul className="history-list">
          {sharedSplitPages.pageItems.map((split) => (
            <SplitHistoryCard
              key={split.id}
              split={split}
              currentUsername={currentUsername}
              peopleByUsername={peopleByUsername}
              unpaidForSplit={unpaidAmounts.get(split.id) ?? new Map()}
              focusUsername={friendUsername}
              onViewReceipt={setViewingReceiptImageId}
            />
          ))}
        </ul>
      )}
      <Pagination
        page={sharedSplitPages.page}
        pageCount={sharedSplitPages.pageCount}
        totalCount={sharedSplitPages.totalCount}
        itemLabel="grocery runs"
        onPageChange={sharedSplitPages.setPage}
      />

      {viewingReceiptImageId && (
        <ReceiptViewerModal receiptImageId={viewingReceiptImageId} onClose={() => setViewingReceiptImageId(null)} />
      )}
    </div>
  );
}

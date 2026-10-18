import { useMemo, useState } from "react";

import { usePagination } from "../../hooks/usePagination";
import { useSplitHistory } from "../../hooks/useSplitHistory";
import { calculateUnpaidAmounts } from "../../services/splitStanding";
import type { Friend } from "../../types";
import { SavedSplit } from "../../types/split";
import Pagination from "../Pagination";
import ReceiptViewerModal from "../ReceiptViewerModal";
import SplitHistoryCard from "./SplitHistoryCard";
import "../../styles/history.css";

type SplitListCardProps = {
  title: string;
  emptyText: string;
  includeSplit: (split: SavedSplit) => boolean;
  focusUsername?: string;
  currentUsername: string;
  people: Friend[];
};

export default function SplitListCard({
  title,
  emptyText,
  includeSplit,
  focusUsername,
  currentUsername,
  people,
}: SplitListCardProps) {
  const { splits, isLoading, errorMessage, replaceSplit } = useSplitHistory();
  const [viewingReceiptImageId, setViewingReceiptImageId] = useState<string | null>(null);

  const includedSplits = splits.filter(includeSplit);
  const peopleByUsername = new Map(people.map((person) => [person.username, person]));
  const unpaidAmounts = useMemo(
    () => calculateUnpaidAmounts(splits, currentUsername, people),
    [splits, currentUsername, people],
  );
  const splitPages = usePagination(includedSplits, 5);

  return (
    <div className="card shared-splits">
      <div className="history-header">
        <h2>{title}</h2>
        <span className="history-count">{includedSplits.length}</span>
      </div>
      {isLoading && <p className="description">Loading...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {!isLoading && !errorMessage && includedSplits.length === 0 && <p className="empty">{emptyText}</p>}
      {includedSplits.length > 0 && (
        <ul className="history-list">
          {splitPages.pageItems.map((split) => (
            <SplitHistoryCard
              key={split.id}
              split={split}
              currentUsername={currentUsername}
              peopleByUsername={peopleByUsername}
              unpaidForSplit={unpaidAmounts.get(split.id) ?? new Map()}
              focusUsername={focusUsername}
              onViewReceipt={setViewingReceiptImageId}
              onSplitChange={replaceSplit}
            />
          ))}
        </ul>
      )}
      <Pagination
        page={splitPages.page}
        pageCount={splitPages.pageCount}
        totalCount={splitPages.totalCount}
        itemLabel="grocery runs"
        onPageChange={splitPages.setPage}
      />

      {viewingReceiptImageId && (
        <ReceiptViewerModal receiptImageId={viewingReceiptImageId} onClose={() => setViewingReceiptImageId(null)} />
      )}
    </div>
  );
}

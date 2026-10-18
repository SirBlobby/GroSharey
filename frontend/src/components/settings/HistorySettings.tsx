import { useState } from "react";

import { useAuth } from "../../hooks/useAuth";
import { usePagination } from "../../hooks/usePagination";
import { useSplitHistory } from "../../hooks/useSplitHistory";
import type { Friend } from "../../types";
import SplitHistoryCard from "../history/SplitHistoryCard";
import Pagination from "../Pagination";
import ReceiptViewerModal from "../ReceiptViewerModal";
import "../../styles/history.css";

type HistorySettingsProps = {
  people: Friend[];
};

export default function HistorySettings({ people }: HistorySettingsProps) {
  const { currentUser } = useAuth();
  const { splits, isLoading, errorMessage } = useSplitHistory();
  const [viewingReceiptImageId, setViewingReceiptImageId] = useState<string | null>(null);
  const splitPages = usePagination(splits);

  const peopleByUsername = new Map(people.map((person) => [person.username, person]));

  return (
    <div className="card settings-panel">
      <div className="history-header">
        <h2>History</h2>
        <span className="history-count">{splits.length}</span>
      </div>
      {isLoading && <p className="description">Loading...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {!isLoading && !errorMessage && splits.length === 0 && (
        <p className="empty">No grocery runs yet.<br />Scan a receipt or enter items to get started.</p>
      )}
      {currentUser && splits.length > 0 && (
        <ul className="history-list">
          {splitPages.pageItems.map((split) => (
            <SplitHistoryCard
              key={split.id}
              split={split}
              currentUsername={currentUser.username}
              peopleByUsername={peopleByUsername}
              onViewReceipt={setViewingReceiptImageId}
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

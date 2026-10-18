import { useState } from "react";

import SplitHistoryCard from "../components/history/SplitHistoryCard";
import { BackIcon } from "../components/icons";
import Pagination from "../components/Pagination";
import ReceiptViewerModal from "../components/ReceiptViewerModal";
import { useAuth } from "../hooks/useAuth";
import { usePagination } from "../hooks/usePagination";
import { useSplitHistory } from "../hooks/useSplitHistory";
import type { Friend } from "../types";
import "../styles/main.css";
import "../styles/history.css";

type SplitHistoryScreenProps = {
  people: Friend[];
  onBack: () => void;
};

export default function SplitHistoryScreen({ people, onBack }: SplitHistoryScreenProps) {
  const { currentUser } = useAuth();
  const { splits, isLoading, errorMessage } = useSplitHistory();
  const [viewingReceiptImageId, setViewingReceiptImageId] = useState<string | null>(null);
  const splitPages = usePagination(splits);

  const peopleByUsername = new Map(people.map((person) => [person.username, person]));

  return (
    <section className="screen history">
      <div className="topbar">
        <span>Split History</span>
        <button type="button" onClick={onBack}>
          <BackIcon /> <span className="topbar-label">Back to Home</span>
        </button>
      </div>

      <div className="card history-panel">
        <div className="history-header">
          <h2>Grocery Runs</h2>
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
      </div>

      {viewingReceiptImageId && (
        <ReceiptViewerModal receiptImageId={viewingReceiptImageId} onClose={() => setViewingReceiptImageId(null)} />
      )}
    </section>
  );
}

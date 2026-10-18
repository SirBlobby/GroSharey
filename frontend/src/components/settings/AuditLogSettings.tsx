import { ReactNode, useState } from "react";

import { useAuditLog } from "../../hooks/useAuditLog";
import { AuditCategory, AuditEvent } from "../../types/audit";
import { formatDateTime } from "../../utils";
import {
  AccountIcon,
  FriendsIcon,
  GroupsIcon,
  ProfileIcon,
  RefreshIcon,
  ShoppingListIcon,
  SplitsIcon,
  WalletIcon,
} from "../icons";
import Pagination from "../Pagination";

type CategoryFilter = AuditCategory | "all";

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "account", label: "Account" },
  { value: "profile", label: "Profile" },
  { value: "friends", label: "Friends" },
  { value: "groups", label: "Groups" },
  { value: "lists", label: "Lists" },
  { value: "splits", label: "Splits" },
  { value: "payments", label: "Payments" },
];

const CATEGORY_ICONS: Record<AuditCategory, ReactNode> = {
  account: <AccountIcon />,
  profile: <ProfileIcon />,
  friends: <FriendsIcon />,
  groups: <GroupsIcon />,
  lists: <ShoppingListIcon />,
  splits: <SplitsIcon />,
  payments: <WalletIcon />,
};

function isWarningEvent(auditEvent: AuditEvent): boolean {
  return auditEvent.action === "log_in_failed";
}

export default function AuditLogSettings() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);
  const { auditEvents, totalCount, pageCount, isLoading, errorMessage, refreshAuditLog } = useAuditLog(
    categoryFilter === "all" ? null : categoryFilter,
    page,
  );

  function selectCategory(category: CategoryFilter) {
    setCategoryFilter(category);
    setPage(1);
  }

  return (
    <div className="card settings-panel">
      <div className="audit-header">
        <h2>Audit Log</h2>
        <button type="button" className="audit-refresh" disabled={isLoading} onClick={refreshAuditLog}>
          <RefreshIcon /> Refresh
        </button>
      </div>
      <p className="description">Everything that happened on your account, newest first.</p>

      <div className="option-row" role="radiogroup" aria-label="Filter by category">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="radio"
            aria-checked={categoryFilter === filter.value}
            className={`option-button audit-filter ${categoryFilter === filter.value ? "selected" : ""}`}
            onClick={() => selectCategory(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="description">Loading...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {!isLoading && !errorMessage && auditEvents.length === 0 && (
        <p className="empty">Nothing here yet.</p>
      )}

      {auditEvents.length > 0 && (
        <ul className="audit-list">
          {auditEvents.map((auditEvent) => (
            <li
              key={auditEvent.id}
              className={`audit-event ${isWarningEvent(auditEvent) ? "audit-event--warning" : ""}`}
            >
              <span className="audit-event-icon">{CATEGORY_ICONS[auditEvent.category]}</span>
              <div className="audit-event-text">
                <span className="audit-event-description">{auditEvent.description}</span>
                <span className="audit-event-time">{formatDateTime(auditEvent.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        totalCount={totalCount}
        itemLabel="events"
        onPageChange={setPage}
      />
    </div>
  );
}

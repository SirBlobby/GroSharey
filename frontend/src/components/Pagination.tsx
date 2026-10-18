import { NextPageIcon, PreviousPageIcon } from "./icons";
import "../styles/pagination.css";

type PaginationProps = {
  page: number;
  pageCount: number;
  totalCount: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, pageCount, totalCount, itemLabel, onPageChange }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label={`${itemLabel} pages`}>
      <button
        type="button"
        className="pagination-button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <PreviousPageIcon /> Previous
      </button>
      <span className="pagination-status">
        Page {page} of {pageCount}
        <span className="pagination-total">
          {totalCount} {itemLabel}
        </span>
      </span>
      <button
        type="button"
        className="pagination-button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next <NextPageIcon />
      </button>
    </nav>
  );
}

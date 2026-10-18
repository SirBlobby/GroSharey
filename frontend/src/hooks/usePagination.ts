import { useState } from "react";

export const DEFAULT_PAGE_SIZE = 10;

export function usePagination<Item>(items: Item[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [requestedPage, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  return { page, pageCount, pageItems, totalCount: items.length, setPage };
}

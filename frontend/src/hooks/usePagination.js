import { useCallback, useMemo, useState } from 'react';

function usePagination(items, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, pageSize, items]);

  const nextPage = useCallback(() => setPage((prev) => Math.min(prev + 1, totalPages)), [totalPages]);
  const prevPage = useCallback(() => setPage((prev) => Math.max(prev - 1, 1)), []);
  const goToPage = useCallback((next) => setPage(Math.min(Math.max(next, 1), totalPages)), [totalPages]);

  return {
    page: currentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginated,
    nextPage,
    prevPage,
    goToPage,
  };
}

export default usePagination;

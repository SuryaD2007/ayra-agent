import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UsePaginationProps {
  totalItems: number;
  defaultPageSize?: number;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const usePagination = ({ 
  totalItems, 
  defaultPageSize = 25 
}: UsePaginationProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from URL or localStorage
  const getInitialPageSize = () => {
    const urlPageSize = searchParams.get('pageSize');
    if (urlPageSize && ['25', '50', '100'].includes(urlPageSize)) {
      return parseInt(urlPageSize);
    }
    
    const savedPageSize = localStorage.getItem('table-page-size');
    if (savedPageSize && ['25', '50', '100'].includes(savedPageSize)) {
      return parseInt(savedPageSize);
    }
    
    return defaultPageSize;
  };

  const getInitialPage = () => {
    const urlPage = searchParams.get('page');
    return urlPage ? Math.max(1, parseInt(urlPage)) : 1;
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [pageSize, setPageSize] = useState(getInitialPageSize);

  // Calculate pagination state
  const paginationState: PaginationState = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const safePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      currentPage: safePage,
      pageSize,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    };
  }, [currentPage, pageSize, totalItems]);

  // Update URL params when pagination changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    if (paginationState.currentPage > 1) {
      newParams.set('page', paginationState.currentPage.toString());
    } else {
      newParams.delete('page');
    }
    
    if (pageSize !== defaultPageSize) {
      newParams.set('pageSize', pageSize.toString());
    } else {
      newParams.delete('pageSize');
    }
    
    setSearchParams(newParams, { replace: true });
    
    // Save page size to localStorage
    localStorage.setItem('table-page-size', pageSize.toString());
  }, [paginationState.currentPage, pageSize, searchParams, setSearchParams, defaultPageSize]);

  // Reset to page 1 when total items change significantly (filters/search)
  useEffect(() => {
    if (currentPage > 1 && paginationState.totalPages > 0 && currentPage > paginationState.totalPages) {
      setCurrentPage(1);
    }
  }, [totalItems, currentPage, paginationState.totalPages]);

  const goToPage = (page: number) => {
    const safePage = Math.max(1, Math.min(page, paginationState.totalPages));
    setCurrentPage(safePage);
  };

  const goToNextPage = () => {
    if (paginationState.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (paginationState.hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const changePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  return {
    ...paginationState,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
    resetToFirstPage,
  };
};
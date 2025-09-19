import { useState, useMemo, useEffect } from 'react';
import { SavedFiltersService } from '@/utils/savedFilters';
import { AyraItem } from '@/components/manage/ayra-data';

interface FilterFunction {
  (items: AyraItem[]): AyraItem[];
}

export interface FilterState {
  types: AyraItem['type'][];
  spaces: AyraItem['space'][];
  tags: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  sortBy: 'newest' | 'oldest' | 'title-az' | 'title-za';
}

export const useFilters = (initialItems: AyraItem[] = [], spaceId?: string) => {
  const filteredItems = useMemo((): AyraItem[] => {
    let result = [...initialItems];

    // Apply filters here if needed
    return result;
  }, [initialItems]);

  const [filters, setFilters] = useState<FilterState>({
    types: [],
    spaces: [],
    tags: [],
    dateRange: {},
    sortBy: 'newest'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.ceil(totalItems / pageSize);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      spaces: [],
      tags: [],
      dateRange: {},
      sortBy: 'newest'
    });
    setCurrentPage(1);
  };

  const availableTags: string[] = [
    'AI', 'Machine Learning', 'Deep Learning', 'Cloud', 'Architecture', 
    'Patterns', 'UX', 'Research', 'Design', 'Product', 'Strategy', 
    'Management', 'JavaScript', 'Development'
  ];

  const pagination = {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    setCurrentPage,
    setTotalItems
  };

  return {
    filteredItems,
    filters,
    updateFilters,
    clearFilters,
    availableTags,
    pagination
  };
};
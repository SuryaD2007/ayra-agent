import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CortexItem } from '@/components/manage/cortex-data';
import { FilterState } from '@/components/manage/FilterDrawer';
import { SavedFiltersService } from '@/utils/savedFilters';

export const useFilters = (items: CortexItem[], currentSpace?: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from space-specific storage or URL params
  const [filters, setFilters] = useState<FilterState>(() => {
    // First check if there are saved filters for this space
    if (currentSpace) {
      const spaceFilters = SavedFiltersService.getSpaceFilters(currentSpace);
      if (spaceFilters) {
        return spaceFilters;
      }
    }
    
    // Fallback to URL params
    const types = searchParams.get('type')?.split(',').filter(Boolean) as CortexItem['type'][] || [];
    const spaces = searchParams.get('space')?.split(',').filter(Boolean) as CortexItem['space'][] || [];
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const sortBy = (searchParams.get('sort') as FilterState['sortBy']) || 'newest';
    
    const fromDate = searchParams.get('dateFrom');
    const toDate = searchParams.get('dateTo');
    
    return {
      types,
      spaces,
      tags,
      dateRange: {
        from: fromDate ? new Date(fromDate) : undefined,
        to: toDate ? new Date(toDate) : undefined,
      },
      sortBy,
    };
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.types.length > 0) {
      params.set('type', filters.types.join(','));
    }
    
    if (filters.spaces.length > 0) {
      params.set('space', filters.spaces.join(','));
    }
    
    if (filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }
    
    if (filters.dateRange.from) {
      params.set('dateFrom', filters.dateRange.from.toISOString().split('T')[0]);
    }
    
    if (filters.dateRange.to) {
      params.set('dateTo', filters.dateRange.to.toISOString().split('T')[0]);
    }
    
    if (filters.sortBy !== 'newest') {
      params.set('sort', filters.sortBy);
    }
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.types.length > 0) count++;
    if (filters.spaces.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  // Get available tags from all items
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(item => {
      item.keywords.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [items]);

  // Apply filters to items
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Filter by type
    if (filters.types.length > 0) {
      filtered = filtered.filter(item => filters.types.includes(item.type));
    }

    // Filter by space
    if (filters.spaces.length > 0) {
      filtered = filtered.filter(item => filters.spaces.includes(item.space));
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        filters.tags.some(tag => item.keywords.includes(tag))
      );
    }

    // Filter by date range
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdDate);
        if (filters.dateRange.from && itemDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && itemDate > filters.dateRange.to) return false;
        return true;
      });
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        case 'newest':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, filters]);

  return {
    filters,
    setFilters,
    filteredItems,
    activeFilterCount,
    availableTags,
  };
};
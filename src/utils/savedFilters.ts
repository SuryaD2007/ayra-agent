import { FilterState } from '@/components/manage/FilterDrawer';

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

export class SavedFiltersService {
  private static SAVED_FILTERS_KEY = 'cortex-saved-filters';
  private static SPACE_FILTERS_KEY = 'cortex-space-filters';

  // Saved filters management
  static getSavedFilters(): SavedFilter[] {
    try {
      const saved = localStorage.getItem(this.SAVED_FILTERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static saveFilter(name: string, filters: FilterState): SavedFilter {
    const savedFilters = this.getSavedFilters();
    const newFilter: SavedFilter = {
      id: `filter_${Date.now()}`,
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    
    savedFilters.push(newFilter);
    localStorage.setItem(this.SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
    return newFilter;
  }

  static deleteFilter(filterId: string): void {
    const savedFilters = this.getSavedFilters();
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    localStorage.setItem(this.SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
  }

  static renameFilter(filterId: string, newName: string): void {
    const savedFilters = this.getSavedFilters();
    const filterIndex = savedFilters.findIndex(f => f.id === filterId);
    if (filterIndex >= 0) {
      savedFilters[filterIndex].name = newName;
      localStorage.setItem(this.SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
    }
  }

  // Per-space filter persistence
  static getSpaceFilters(spaceId: string): FilterState | null {
    try {
      const spaceFilters = localStorage.getItem(this.SPACE_FILTERS_KEY);
      const filtersMap = spaceFilters ? JSON.parse(spaceFilters) : {};
      
      if (filtersMap[spaceId]) {
        // Parse dates back from ISO strings
        const filters = filtersMap[spaceId];
        return {
          ...filters,
          dateRange: {
            from: filters.dateRange?.from ? new Date(filters.dateRange.from) : undefined,
            to: filters.dateRange?.to ? new Date(filters.dateRange.to) : undefined,
          }
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  static saveSpaceFilters(spaceId: string, filters: FilterState): void {
    try {
      const spaceFilters = localStorage.getItem(this.SPACE_FILTERS_KEY);
      const filtersMap = spaceFilters ? JSON.parse(spaceFilters) : {};
      
      // Convert dates to ISO strings for storage
      const filtersToSave = {
        ...filters,
        dateRange: {
          from: filters.dateRange?.from?.toISOString(),
          to: filters.dateRange?.to?.toISOString(),
        }
      };
      
      filtersMap[spaceId] = filtersToSave;
      localStorage.setItem(this.SPACE_FILTERS_KEY, JSON.stringify(filtersMap));
    } catch (error) {
      console.error('Error saving space filters:', error);
    }
  }

  static clearSpaceFilters(spaceId: string): void {
    try {
      const spaceFilters = localStorage.getItem(this.SPACE_FILTERS_KEY);
      const filtersMap = spaceFilters ? JSON.parse(spaceFilters) : {};
      delete filtersMap[spaceId];
      localStorage.setItem(this.SPACE_FILTERS_KEY, JSON.stringify(filtersMap));
    } catch (error) {
      console.error('Error clearing space filters:', error);
    }
  }

  static getDefaultFilters(): FilterState {
    return {
      types: [],
      spaces: [],
      tags: [],
      dateRange: {},
      sortBy: 'newest'
    };
  }
}
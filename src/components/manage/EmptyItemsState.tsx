import React from 'react';
import { Plus, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyItemsStateProps {
  hasFilters: boolean;
  hasSearch: boolean;
  onAddFirstItem: () => void;
  onClearFilters: () => void;
  onClearSearch: () => void;
  spaceName?: string;
}

const EmptyItemsState: React.FC<EmptyItemsStateProps> = ({
  hasFilters,
  hasSearch,
  onAddFirstItem,
  onClearFilters,
  onClearSearch,
  spaceName
}) => {
  if (hasFilters || hasSearch) {
    // Filtered/searched but no results
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">
          <Search size={48} className="mx-auto mb-2 opacity-50" />
          <h3 className="text-lg font-semibold mb-1">No items found</h3>
          <p className="text-sm">
            {hasFilters && hasSearch 
              ? "No items match your current filters and search."
              : hasFilters
              ? "No items match your current filters."
              : "No items match your search."
            }
          </p>
        </div>
        <div className="flex gap-2">
          {hasSearch && (
            <Button variant="outline" onClick={onClearSearch}>
              Clear search
            </Button>
          )}
          {hasFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  // No items at all (no filters/search)
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
      <div className="text-6xl mb-4">
        <Package className="mx-auto text-muted-foreground/50" size={64} />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        Add your first item{spaceName ? ` to ${spaceName}` : ''}
      </h3>
      <p className="text-muted-foreground mb-6">
        Start building your knowledge base by adding notes, PDFs, links, or images{spaceName ? ' to this space' : ''}.
      </p>
      <Button onClick={onAddFirstItem} size="lg">
        <Plus className="mr-2 h-4 w-4" />
        Add First Item
      </Button>
    </div>
  );
};

export default EmptyItemsState;
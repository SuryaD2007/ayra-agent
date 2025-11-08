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
    <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-4">
        <Package className="mx-auto text-muted-foreground/50" size={64} />
      </div>
      <h3 className="text-2xl font-semibold mb-2">
        {spaceName ? `Welcome to ${spaceName}!` : 'Start Building Your Knowledge Base'}
      </h3>
      <p className="text-muted-foreground mb-6 text-base">
        {spaceName 
          ? 'Add your first item to this space. You can add notes, PDFs, links, images, or import content from various sources.'
          : 'Your personal AI engine is ready. Start by adding notes, documents, links, or images to build your knowledge base.'
        }
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 w-full max-w-lg text-left">
        <div className="p-4 rounded-lg border bg-card">
          <div className="font-semibold mb-1 text-sm">📝 Quick Note</div>
          <p className="text-xs text-muted-foreground">Capture ideas and thoughts instantly</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="font-semibold mb-1 text-sm">📄 Upload Files</div>
          <p className="text-xs text-muted-foreground">Import PDFs and documents</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="font-semibold mb-1 text-sm">🔗 Save Links</div>
          <p className="text-xs text-muted-foreground">Bookmark and organize websites</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="font-semibold mb-1 text-sm">🎨 Add Images</div>
          <p className="text-xs text-muted-foreground">Store visual references and screenshots</p>
        </div>
      </div>

      <Button onClick={onAddFirstItem} size="lg" className="mb-4">
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Item
      </Button>

      <p className="text-xs text-muted-foreground">
        💡 Tip: Use the Import Hub to bulk import from Google Drive, Canvas, or YouTube
      </p>
    </div>
  );
};

export default EmptyItemsState;
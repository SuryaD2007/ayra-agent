import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Search, Filter, Move, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TableView from './views/TableView';
import GridView from './views/GridView';
import ListView from './views/ListView';
import KanbanView from './views/KanbanView';
import FilterDrawer from './FilterDrawer';
import NewItemModal from './NewItemModal';
import PreviewDrawer from './PreviewDrawer';
import { cortexItems as initialCortexItems, CortexItem } from './cortex-data';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { toast } from '@/hooks/use-toast';
import TablePagination from './TablePagination';

interface CortexTableProps {
  viewType?: 'table' | 'grid' | 'list' | 'kanban';
  categoryId?: string;
  cortexId?: string | null;
  onFiltersChange?: (activeCount: number) => void;
}

export interface CortexTableRef {
  focusSearch: () => void;
  openFilters: () => void;
  openNewItem: () => void;
  navigateSelection: (direction: 'up' | 'down') => void;
  openPreviewForSelected: () => void;
  closePreview: () => void;
}

const CortexTable = forwardRef<CortexTableRef, CortexTableProps>(({ 
  viewType = 'table', 
  categoryId = 'private',
  cortexId = 'overview',
  onFiltersChange
}, ref) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetCortex, setTargetCortex] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<CortexItem | null>(null);
  const [deletedItems, setDeletedItems] = useState<CortexItem[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Load items from localStorage or use initial data as fallback
  const [cortexItems, setCortexItems] = useState<CortexItem[]>(() => {
    try {
      const saved = localStorage.getItem('cortex-items');
      return saved ? JSON.parse(saved) : initialCortexItems;
    } catch {
      return initialCortexItems;
    }
  });

  // Save to localStorage whenever cortexItems changes
  useEffect(() => {
    localStorage.setItem('cortex-items', JSON.stringify(cortexItems));
  }, [cortexItems]);

  // Use the filters hook
  const { 
    filters, 
    setFilters, 
    filteredItems, 
    activeFilterCount, 
    availableTags 
  } = useFilters(cortexItems, cortexId || undefined);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(activeFilterCount);
  }, [activeFilterCount, onFiltersChange]);

  const getActiveCortexName = () => {
    if (categoryId === 'private' && cortexId === 'overview') return 'All Items';
    if (categoryId === 'private' && cortexId === 'ai') return 'AI';
    if (categoryId === 'private' && cortexId === 'design') return 'Design'; 
    if (categoryId === 'private' && cortexId === 'development') return 'Development';
    if (categoryId === 'shared' && cortexId === 'team-resources') return 'Team Resources';
    if (categoryId === 'shared' && cortexId === 'projects') return 'Projects';
    return 'All Items';
  };

  // Apply search query to already filtered items
  const searchFilteredItems = () => {
    if (!searchQuery) return filteredItems;
    
    return filteredItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const finalItems = searchFilteredItems();

  // Pagination
  const pagination = usePagination({
    totalItems: finalItems.length,
    defaultPageSize: 25,
  });

  // Reset to page 1 when filters or search change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [JSON.stringify(filters), searchQuery]);

  // Get paginated items
  const paginatedItems = finalItems.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  // Use virtualization for large datasets (>100 items)
  const shouldVirtualize = finalItems.length > 100;

  // Expose methods via ref for hotkeys
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
    },
    openFilters: () => {
      setFilterDrawerOpen(true);
    },
    openNewItem: () => {
      setNewItemModalOpen(true);
    },
    navigateSelection: (direction: 'up' | 'down') => {
      if (paginatedItems.length === 0) return;
      
      setSelectedRowIndex(prevIndex => {
        let newIndex = direction === 'down' ? prevIndex + 1 : prevIndex - 1;
        
        // Handle wrap-around
        if (newIndex >= paginatedItems.length) {
          newIndex = 0;
        } else if (newIndex < 0) {
          newIndex = paginatedItems.length - 1;
        }
        
        return newIndex;
      });
    },
    openPreviewForSelected: () => {
      if (selectedRowIndex >= 0 && selectedRowIndex < paginatedItems.length) {
        const item = paginatedItems[selectedRowIndex];
        setPreviewItem(item);
        setPreviewDrawerOpen(true);
      }
    },
    closePreview: () => {
      setPreviewDrawerOpen(false);
    },
  }));

  // Reset row selection when items change
  useEffect(() => {
    setSelectedRowIndex(-1);
  }, [paginatedItems]);

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleUpdateItem = (id: string, updates: Partial<CortexItem>) => {
    setCortexItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleMoveItems = () => {
    if (selectedItems.length > 0 && targetCortex) {
      toast({
        title: "Items moved successfully",
        description: `${selectedItems.length} item(s) moved to ${targetCortex}`,
      });
      setSelectedItems([]);
      setMoveDialogOpen(false);
      setTargetCortex('');
    }
  };

  const handleItemCreated = (newItem: CortexItem) => {
    // Optimistically insert at the top
    setCortexItems(prev => [newItem, ...prev]);
    
    // Open preview drawer for the new item
    setPreviewItem(newItem);
    setPreviewDrawerOpen(true);
  };

  const handleDeleteItems = () => {
    const itemsToDelete = cortexItems.filter(item => selectedItems.includes(item.id));
    setDeletedItems(itemsToDelete);
    
    // Optimistically remove from UI
    setCortexItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    
    // Show undo toast
    const count = selectedItems.length;
    toast({
      title: `Deleted ${count} item(s)`,
      description: "Undo",
      action: (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleUndoDelete}
          className="ml-auto"
        >
          Undo
        </Button>
      ),
      duration: 6000,
    });
    
    setSelectedItems([]);
    setDeleteDialogOpen(false);
  };

  const handleUndoDelete = () => {
    if (deletedItems.length > 0) {
      setCortexItems(prev => [...deletedItems, ...prev]);
      setDeletedItems([]);
      toast({
        title: "Items restored",
        description: `${deletedItems.length} item(s) have been restored.`,
      });
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-4">
        <Search size={48} className="mx-auto mb-2 opacity-50" />
        <h3 className="text-lg font-semibold mb-1">No items found</h3>
        <p className="text-sm">
          {activeFilterCount > 0 
            ? "No items match your current filters."
            : searchQuery 
            ? "No items match your search."
            : "No items in this cortex yet."
          }
        </p>
      </div>
      {(activeFilterCount > 0 || searchQuery) && (
        <div className="flex gap-2">
          {searchQuery && (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          )}
          {activeFilterCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                types: [],
                spaces: [],
                tags: [],
                dateRange: {},
                sortBy: 'newest'
              })}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{getActiveCortexName()}</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMoveDialogOpen(true)}
              disabled={selectedItems.length === 0}
            >
              <Move size={16} className="mr-1" />
              Move ({selectedItems.length})
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDeleteDialogOpen(true)}
              disabled={selectedItems.length === 0}
            >
              <Trash2 size={16} className="mr-1" />
              Delete ({selectedItems.length})
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => setNewItemModalOpen(true)}>
              <Plus size={16} className="mr-1" />
              New Item
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            ref={searchInputRef}
            placeholder="Search items... (Press / to focus)"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {finalItems.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {viewType === 'table' && (
                <TableView 
                  items={shouldVirtualize ? finalItems : paginatedItems}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  onUpdateItem={handleUpdateItem}
                  virtualized={shouldVirtualize}
                  selectedRowIndex={selectedRowIndex}
                  onRowClick={(item, index) => {
                    setSelectedRowIndex(index);
                    setPreviewItem(item);
                    setPreviewDrawerOpen(true);
                  }}
                />
              )}
              {viewType === 'grid' && (
                <GridView 
                  items={paginatedItems}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                />
              )}
              {viewType === 'list' && (
                <ListView 
                  items={paginatedItems}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                />
              )}
              {viewType === 'kanban' && (
                <KanbanView items={paginatedItems} />
              )}
            </>
          )}
        </div>

        {/* Pagination - only show for non-virtualized tables */}
        {finalItems.length > 0 && !shouldVirtualize && (
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={finalItems.length}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.changePageSize}
            onNextPage={pagination.goToNextPage}
            onPreviousPage={pagination.goToPreviousPage}
          />
        )}
      </div>

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        activeFilterCount={activeFilterCount}
        currentSpace={cortexId || undefined}
      />

      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Selected Items</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Move {selectedItems.length} selected item(s) to:
            </p>
            <Select value={targetCortex} onValueChange={setTargetCortex}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination cortex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="team-resources">Team Resources</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveItems} disabled={!targetCortex}>
              Move Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.length === 1 ? '1 item' : `${selectedItems.length} items`}? 
              This action can be undone within 6 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItems}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Item Modal */}
      <NewItemModal
        open={newItemModalOpen}
        onOpenChange={setNewItemModalOpen}
        onItemCreated={handleItemCreated}
      />

      {/* Preview Drawer */}
      <PreviewDrawer
        open={previewDrawerOpen}
        onOpenChange={setPreviewDrawerOpen}
        item={previewItem}
        onDelete={(item) => {
          // Convert PreviewItem to CortexItem for deletion
          const cortexItem: CortexItem = {
            ...item,
            space: item.space as 'Personal' | 'Work' | 'School' | 'Team'
          };
          setDeletedItems([cortexItem]);
          setCortexItems(prev => prev.filter(i => i.id !== item.id));
          
          // Store deleted item temporarily for undo
          const deletedItems = localStorage.getItem('recently-deleted-items');
          const deleted: CortexItem[] = deletedItems ? JSON.parse(deletedItems) : [];
          localStorage.setItem('recently-deleted-items', JSON.stringify([cortexItem, ...deleted]));
          
          toast({
            title: "Deleted 1 item",
            description: "Undo",
            action: (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleUndoDelete}
                className="ml-auto"
              >
                Undo
              </Button>
            ),
            duration: 6000,
          });
          setPreviewDrawerOpen(false);
        }}
      />
    </div>
  );
});

CortexTable.displayName = 'CortexTable';

export default CortexTable;
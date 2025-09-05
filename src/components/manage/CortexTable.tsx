import React, { useState, useEffect } from 'react';
import { Search, Filter, Move, Plus, MoreHorizontal } from 'lucide-react';
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
import TableView from './views/TableView';
import GridView from './views/GridView';
import ListView from './views/ListView';
import KanbanView from './views/KanbanView';
import FilterDrawer from './FilterDrawer';
import NewItemModal from './NewItemModal';
import PreviewDrawer from './PreviewDrawer';
import { cortexItems as initialCortexItems, CortexItem } from './cortex-data';
import { useFilters } from '@/hooks/useFilters';
import { toast } from '@/hooks/use-toast';

interface CortexTableProps {
  viewType?: 'table' | 'grid' | 'list' | 'kanban';
  categoryId?: string;
  cortexId?: string | null;
}

const CortexTable = ({ 
  viewType = 'table', 
  categoryId = 'private',
  cortexId = 'overview'
}: CortexTableProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [targetCortex, setTargetCortex] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<CortexItem | null>(null);
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
  } = useFilters(cortexItems);

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
            
            <Button variant="outline" size="sm" onClick={() => setNewItemModalOpen(true)}>
              <Plus size={16} className="mr-1" />
              New Item
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto h-[calc(100vh-280px)]">
        {finalItems.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {viewType === 'table' && (
              <TableView 
                items={finalItems}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onUpdateItem={handleUpdateItem}
              />
            )}
            {viewType === 'grid' && (
              <GridView 
                items={finalItems}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
              />
            )}
            {viewType === 'list' && (
              <ListView 
                items={finalItems}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
              />
            )}
            {viewType === 'kanban' && (
              <KanbanView items={finalItems} />
            )}
          </>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        activeFilterCount={activeFilterCount}
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
      />
    </div>
  );
};

export default CortexTable;
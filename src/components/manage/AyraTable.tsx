import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Columns, 
  MoreHorizontal, 
  Move, 
  Trash2,
  Undo2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ayraItems as initialAyraItems, AyraItem } from './ayra-data';
import ViewSwitcher from './ViewSwitcher';
import TableView from './views/TableView';
import GridView from './views/GridView';
import ListView from './views/ListView';
import KanbanView from './views/KanbanView';
import FilterDrawer from './FilterDrawer';
import { itemsToAyraItems } from '@/lib/itemUtils';
import { useFilters } from '@/hooks/useFilters';
import EmptyItemsState from './EmptyItemsState';
import TablePagination from './TablePagination';
import NewItemModal from './NewItemModal';
import PreviewDrawer from './PreviewDrawer';

// Simple data layer functions for now
const getItems = async (params: any) => {
  // This would normally fetch from Supabase
  return { data: [], error: null };
};

const getSpaces = async () => {
  // This would normally fetch from Supabase  
  return { data: [], error: null };
};

const updateItem = async (id: string, updates: any) => {
  // This would normally update in Supabase
  return { error: null };
};

const moveItem = async (itemId: string, targetSpaceId: string) => {
  // This would normally move item in Supabase
  return { error: null };
};

const deleteItem = async (itemId: string) => {
  // This would normally delete from Supabase
  return { error: null };
};

// Simple DataCache implementation
const DataCache = {
  getAyraItems: () => [],
  setAyraItems: (items: AyraItem[]) => {},
  clear: () => {}
};

// Simple Item type
type Item = {
  id: string;
  title: string;
  content?: string;
  type: string;
  created_at: string;
  source?: string;
  file_path?: string;
  size_bytes?: number;
  space_id?: string;
};

interface AyraTableProps {
  viewType?: 'table' | 'grid' | 'list' | 'kanban';
  categoryId?: string;
  ayraId?: string | null;
  onFiltersChange?: (filters: any) => void;
}

export interface AyraTableRef {
  focusSearch: () => void;
  openFilters: () => void;
  openNewItem: () => void;
  navigateSelection: (direction: 'up' | 'down') => void;
  openPreviewForSelected: () => void;
  closePreview: () => void;
}

const AyraTable = forwardRef<AyraTableRef, AyraTableProps>(({ 
  viewType = 'table',
  categoryId = 'private',
  ayraId = 'overview',
  onFiltersChange
}: AyraTableProps, ref) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [targetAyra, setTargetAyra] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<AyraItem | null>(null);
  const [deletedItems, setDeletedItems] = useState<AyraItem[]>([]);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [ayraItems, setAyraItems] = useState<AyraItem[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setAyraItems([]);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      if (!session?.user) {
        setAyraItems([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    filters,
    updateFilters,
    clearFilters,
    availableTags,
    pagination
  } = useFilters([], ayraId || undefined);

  // Function to get the active ayra name for display
  const getActiveAyraName = () => {
    if (categoryId === 'private' && ayraId === 'overview') return 'All Items';
    if (categoryId === 'private' && ayraId === 'ai') return 'AI';
    if (categoryId === 'private' && ayraId === 'design') return 'Design'; 
    if (categoryId === 'private' && ayraId === 'development') return 'Development';
    if (categoryId === 'shared' && ayraId === 'team-resources') return 'Team Resources';
    if (categoryId === 'shared' && ayraId === 'projects') return 'Projects';
    
    const space = spaces.find(s => s.id === ayraId);
    return space ? space.name : 'Items';
  };

  const searchFilteredItems = () => {
    return ayraItems;
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleUpdateItem = async (id: string, updates: Partial<AyraItem>) => {
    try {
      const originalItem = ayraItems.find(item => item.id === id);
      if (!originalItem) return;

      setAyraItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      );

      const itemUpdates: any = {};
      if (updates.title !== undefined) itemUpdates.title = updates.title;
      if (updates.content !== undefined) itemUpdates.content = updates.content;

      const { error } = await updateItem(id, itemUpdates);
      
      if (error) {
        setAyraItems(prev => 
          prev.map(item => 
            item.id === id ? originalItem : item
          )
        );
        
        toast.error('Failed to update item');
        console.error('Update item error:', error);
      } else {
        toast.success('Item updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating item:', error);
      
      const originalItem = ayraItems.find(item => item.id === id);
      if (originalItem) {
        setAyraItems(prev => 
          prev.map(item => 
            item.id === id ? originalItem : item
          )
        );
      }
      
      toast.error('Failed to update item');
    }
  };

  const handleMoveItems = async () => {
    if (selectedItems.length === 0 || !targetAyra) return;

    try {
      const originalItems = ayraItems.filter(item => selectedItems.includes(item.id));

      setAyraItems(prev => 
        prev.map(item => 
          selectedItems.includes(item.id) 
            ? { ...item, space: targetAyra as AyraItem['space'] }
            : item
        )
      );

      const targetSpace = spaces.find(s => s.name.toLowerCase() === targetAyra.toLowerCase()) || 
                          spaces.find(s => s.id === targetAyra);

      if (!targetSpace) {
        throw new Error('Target space not found');
      }

      for (const itemId of selectedItems) {
        const { error } = await moveItem(itemId, targetSpace.id);
        if (error) {
          throw error;
        }
      }

      toast.success(`Moved ${selectedItems.length} item(s) to ${targetAyra}`);
      setSelectedItems([]);
      setMoveDialogOpen(false);
      setTargetAyra('');

    } catch (error: any) {
      console.error('Error moving items:', error);
      
      // Revert changes
      const originalItems = ayraItems.filter(item => selectedItems.includes(item.id));
      setAyraItems(prev => 
        prev.map(item => {
          const originalItem = originalItems.find(orig => orig.id === item.id);
          return originalItem || item;
        })
      );
      
      toast.error('Failed to move items');
    }
  };

  const handleDeleteItems = async () => {
    if (selectedItems.length === 0) return;

    try {
      const itemsToDelete = ayraItems.filter(item => selectedItems.includes(item.id));
      
      setAyraItems(prev => prev.filter(item => !selectedItems.includes(item.id)));

      for (const itemId of selectedItems) {
        const { error } = await deleteItem(itemId);
        if (error) {
          throw error;
        }
      }

      setDeletedItems(itemsToDelete);
      
      toast.success(
        `Deleted ${selectedItems.length} item(s)`,
        {
          action: {
            label: "Undo",
            onClick: () => handleUndoDelete()
          },
        }
      );

      setSelectedItems([]);
      setDeleteDialogOpen(false);

    } catch (error: any) {
      console.error('Error deleting items:', error);
      
      const itemsToDelete = ayraItems.filter(item => selectedItems.includes(item.id));
      setAyraItems(prev => [...itemsToDelete, ...prev]);
      toast.error('Failed to delete items');
    }
  };

  const handleUndoDelete = async () => {
    if (deletedItems.length === 0) return;

    try {
      setAyraItems(prev => [...deletedItems, ...prev]);
      setDeletedItems([]);
      toast.success('Items restored');
    } catch (error: any) {
      console.error('Error restoring items:', error);
      toast.error('Failed to restore items');
    }
  };

  const handleItemCreated = (newItem: AyraItem) => {
    setAyraItems(prev => [newItem, ...prev]);
    setNewItemModalOpen(false);
    toast.success('Item created successfully');
  };

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
      // Implement keyboard navigation if needed
    },
    openPreviewForSelected: () => {
      if (selectedItems.length === 1) {
        const item = ayraItems.find(item => item.id === selectedItems[0]);
        if (item) {
          setPreviewItem(item);
        }
      }
    },
    closePreview: () => {
      setPreviewItem(null);
    }
  }));

  const filteredItems = searchFilteredItems();
  const hasFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  );
  const hasSearch = searchQuery.trim().length > 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Failed to load data: {error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-2xl font-bold">{getActiveAyraName()}</h1>
          
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedItems.length} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMoveDialogOpen(true)}
              >
                <Move className="w-4 h-4 mr-2" />
                Move
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterDrawerOpen(true)}
            className={hasFilters ? 'border-primary' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
          
          <ViewSwitcher activeView={viewType} onViewChange={() => {}} />
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={searchInputRef}
            placeholder="Search items..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyItemsState
            hasFilters={hasFilters}
            hasSearch={hasSearch}
            onAddFirstItem={() => setNewItemModalOpen(true)}
            onClearFilters={clearFilters}
            onClearSearch={() => setSearchQuery('')}
            spaceName={getActiveAyraName()}
          />
        ) : (
          <>
            {viewType === 'table' && (
              <TableView
                items={filteredItems}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onUpdateItem={handleUpdateItem}
                spaces={spaces}
                onMoveItem={async (itemId, targetSpaceId) => {
                  setSelectedItems([itemId]);
                  const targetSpace = spaces.find(s => s.id === targetSpaceId);
                  if (targetSpace) {
                    setTargetAyra(targetSpace.name);
                    await handleMoveItems();
                  }
                }}
              />
            )}
            {viewType === 'grid' && (
              <GridView
                items={filteredItems}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                spaces={spaces}
                onMoveItem={async (itemId, targetSpaceId) => {
                  setSelectedItems([itemId]);
                  const targetSpace = spaces.find(s => s.id === targetSpaceId);
                  if (targetSpace) {
                    setTargetAyra(targetSpace.name);
                    await handleMoveItems();
                  }
                }}
              />
            )}
            {viewType === 'list' && (
              <ListView
                items={filteredItems}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                spaces={spaces}
                onMoveItem={async (itemId, targetSpaceId) => {
                  setSelectedItems([itemId]);
                  const targetSpace = spaces.find(s => s.id === targetSpaceId);
                  if (targetSpace) {
                    setTargetAyra(targetSpace.name);
                    await handleMoveItems();
                  }
                }}
              />
            )}
            {viewType === 'kanban' && (
              <KanbanView items={filteredItems} />
            )}
            
            <TablePagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              hasNextPage={pagination.currentPage < pagination.totalPages}
              hasPreviousPage={pagination.currentPage > 1}
              startIndex={(pagination.currentPage - 1) * pagination.pageSize}
              endIndex={Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems) - 1}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={(size) => {}}
              onNextPage={() => pagination.setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              onPreviousPage={() => pagination.setCurrentPage(prev => Math.max(prev - 1, 1))}
            />
          </>
        )}
      </div>

      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedItems.length} item(s)</DialogTitle>
            <DialogDescription>
              Select the space where you want to move the selected items.
            </DialogDescription>
          </DialogHeader>
          <Select value={targetAyra} onValueChange={setTargetAyra}>
            <SelectTrigger>
              <SelectValue placeholder="Select target space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Personal">Personal</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="School">School</SelectItem>
              <SelectItem value="Team">Team</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveItems} disabled={!targetAyra}>
              Move Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.length} item(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected items will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItems}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filter Drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        filters={filters}
        onFiltersChange={(newFilters) => {
          updateFilters(newFilters);
          onFiltersChange?.(newFilters);
        }}
        availableTags={availableTags}
        currentSpace={ayraId || undefined}
        activeFilterCount={Object.values(filters).filter(value => 
          Array.isArray(value) ? value.length > 0 : value
        ).length}
      />

      {/* New Item Modal */}
      <NewItemModal
        open={newItemModalOpen}
        onOpenChange={setNewItemModalOpen}
        onItemCreated={handleItemCreated}
        preselectedSpace={ayraId !== 'overview' ? ayraId : undefined}
      />

      {/* Preview Drawer */}
      <PreviewDrawer
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
        item={previewItem ? {
          id: previewItem.id,
          title: previewItem.title,
          type: previewItem.type,
          url: previewItem.url,
          createdDate: previewItem.createdDate,
          source: previewItem.source,
          keywords: previewItem.keywords,
          space: previewItem.space,
          content: previewItem.content,
          description: previewItem.description,
          favicon: previewItem.favicon,
          dataUrl: previewItem.dataUrl,
          file_path: previewItem.file_path
        } : null}
        onDelete={(item) => {
          const ayraItem: AyraItem = {
            id: item.id,
            title: item.title,
            type: item.type as AyraItem['type'],
            url: `/preview/${item.id}`,
            createdDate: new Date().toISOString().split('T')[0],
            source: 'Upload',
            space: 'Personal',
            keywords: []
          };
          setDeletedItems([ayraItem]);
          setAyraItems(prev => prev.filter(i => i.id !== item.id));
          setPreviewItem(null);
          
          const deleted = JSON.stringify([ayraItem, ...deletedItems]);
          localStorage.setItem('recently-deleted-items', deleted);
          
          toast.success('Item deleted', {
            action: {
              label: "Undo",
              onClick: () => handleUndoDelete()
            },
          });
        }}
      />
    </div>
  );
});

AyraTable.displayName = 'AyraTable';

export default AyraTable;
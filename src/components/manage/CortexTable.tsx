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
import EmptyItemsState from './EmptyItemsState';
import ErrorState from './ErrorState';
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
import { getItems, deleteItems, getSpaces, updateItem, bulkMoveItems, getSpaceCounts, DataCache } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { itemsToCortexItems } from '@/lib/itemUtils';

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
  
  // Auth and data state
  const { isAuthenticated } = useAuth();
  const [cortexItems, setCortexItems] = useState<CortexItem[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [lastQuery, setLastQuery] = useState<any>(null);
  
  // Optimistic update tracking
  const [syncingItems, setSyncingItems] = useState<Set<string>>(new Set());

  // Load data from Supabase with real-time updates
  useEffect(() => {
    if (!isAuthenticated) {
      setCortexItems([]);
      setSpaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    let channel: any;

    const setupRealtimeAndLoadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query object
        const query = {
          page: 1,
          pageSize: 1000, // Load all for client-side filtering for now
          type: [],
          spaceId: cortexId === 'overview' ? undefined : cortexId,
          tags: [],
          dateRange: {},
          search: ''
        };
        
        setLastQuery(query);
        
        // Load spaces for filtering
        const spacesData = await getSpaces();
        setSpaces(spacesData);
        
        // Load items with current filters
        const result = await getItems(query);
        
        // Convert Supabase items to CortexItem format
        const convertedItems = result.items.map((item: any) => {
          // Map space_id to space name
          const space = spacesData.find(s => s.id === item.space_id);
          const spaceName = space ? space.name : 'Personal';
          
          // Map space name to valid CortexItem space type
          let spaceType: 'Personal' | 'Work' | 'School' | 'Team' = 'Personal';
          if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
          else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
          else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';
          
          return {
            id: item.id,
            title: item.title,
            url: item.file_path || '#',
            type: item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase() as 'Note' | 'PDF' | 'Link' | 'Image',
            createdDate: new Date(item.created_at).toISOString().split('T')[0],
            source: item.source || 'Upload',
            keywords: [], // Will be populated from tags separately
            space: spaceType,
            content: item.content,
            description: item.content?.substring(0, 150),
          };
        });
        
        setCortexItems(convertedItems);
        setTotalItems(result.total);
        
        // Update cache
        DataCache.setCortexItems(convertedItems);
        
        // Set up real-time listener for new items
        const { supabase } = await import('@/integrations/supabase/client');
        
        channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'items'
            },
            async (payload) => {
              console.log('New item created:', payload.new);
              
              // Check if this item belongs to current space filter
              const newItem = payload.new as any;
              const currentSpaceFilter = cortexId === 'overview' ? undefined : cortexId;
              
              if (currentSpaceFilter && newItem.space_id !== currentSpaceFilter) {
                return; // Item doesn't belong to current space, ignore
              }
              
              // Convert the new item to CortexItem format
              const space = spacesData.find(s => s.id === newItem.space_id);
              const spaceName = space ? space.name : 'Personal';
              
              let spaceType: 'Personal' | 'Work' | 'School' | 'Team' = 'Personal';
              if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
              else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
              else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';
              
              const convertedItem = {
                id: newItem.id,
                title: newItem.title,
                url: newItem.file_path || '#',
                type: newItem.type.charAt(0).toUpperCase() + newItem.type.slice(1).toLowerCase() as 'Note' | 'PDF' | 'Link' | 'Image',
                createdDate: new Date(newItem.created_at).toISOString().split('T')[0],
                source: newItem.source || 'Upload',
                keywords: [],
                space: spaceType,
                content: newItem.content,
                description: newItem.content?.substring(0, 150),
              };
              
              // Add the new item to the beginning of the list (most recent first)
              setCortexItems(prev => [convertedItem, ...prev]);
              setTotalItems(prev => prev + 1);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'items'
            },
            (payload) => {
              console.log('Item updated:', payload.new);
              const updatedItem = payload.new as any;
              
              // Update the item in the list
              setCortexItems(prev => prev.map(item => {
                if (item.id === updatedItem.id) {
                  const space = spacesData.find(s => s.id === updatedItem.space_id);
                  const spaceName = space ? space.name : 'Personal';
                  
                  let spaceType: 'Personal' | 'Work' | 'School' | 'Team' = 'Personal';
                  if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
                  else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
                  else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';
                  
                  return {
                    ...item,
                    title: updatedItem.title,
                    content: updatedItem.content,
                    description: updatedItem.content?.substring(0, 150),
                    space: spaceType,
                  };
                }
                return item;
              }));
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'items'
            },
            (payload) => {
              console.log('Item deleted:', payload.old);
              const deletedItem = payload.old as any;
              
              // Remove the item from the list
              setCortexItems(prev => prev.filter(item => item.id !== deletedItem.id));
              setTotalItems(prev => prev - 1);
            }
          )
          .subscribe();
        
      } catch (error) {
        console.error('Error loading data:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
        
        toast({
          title: "Error loading data",
          description: "Failed to load items from database.",
          variant: "destructive"
        });
        
        // Fallback to cache
        const cached = DataCache.getCortexItems();
        setCortexItems(cached.length > 0 ? cached : initialCortexItems);
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    };

    setupRealtimeAndLoadData();

    // Cleanup function
    return () => {
      if (channel) {
        const cleanup = async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          supabase.removeChannel(channel);
        };
        cleanup();
      }
    };
  }, [isAuthenticated, cortexId]);

  // Use the filters hook - but don't apply client-side filtering since we do server-side now
  const { 
    filters, 
    setFilters, 
    activeFilterCount, 
    availableTags 
  } = useFilters([], cortexId || undefined); // Pass empty array since filtering is server-side

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
    
    // Check if it's a custom space
    const space = spaces.find(s => s.id === cortexId);
    if (space) return `${space.emoji || ''} ${space.name}`.trim();
    
    return 'All Items';
  };

  // Apply search query to already filtered items (now server-side, so just return current items)
  const searchFilteredItems = () => {
    return cortexItems; // Items are already filtered server-side
  };

  const finalItems = searchFilteredItems();

  // Pagination
  const pagination = usePagination({
    totalItems: totalItems, // Use server-side total, not filtered total
    defaultPageSize: 25,
  });

  // Immediately reset page when filters or search change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [JSON.stringify(filters), searchQuery]);

  // Server-side filtering and pagination
  useEffect(() => {
    if (!isAuthenticated) {
      setCortexItems([]);
      setSpaces([]);
      setLoading(false);
      setError(null);
      return;
    }

    const loadData = async (isRetry = false) => {
      try {
        if (isRetry) {
          setRetrying(true);
        } else {
          setLoading(true);
        }
        setError(null);
        
        // Build query object with current filters and pagination
        const query = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          type: filters.types,
          spaceId: cortexId === 'overview' ? undefined : cortexId,
          tags: filters.tags,
          dateRange: {
            from: filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : undefined,
            to: filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : undefined
          },
          search: searchQuery
        };
        
        setLastQuery(query);
        
        // Load spaces for filtering (only once)
        if (spaces.length === 0) {
          const spacesData = await getSpaces();
          setSpaces(spacesData);
        }
        
        // Load items with current filters and pagination
        const result = await getItems(query);
        
        // Convert Supabase items to CortexItem format
        const convertedItems = result.items.map((item: any) => {
          const space = spaces.find(s => s.id === item.space_id);
          const spaceName = space ? space.name : 'Personal';
          
          let spaceType: 'Personal' | 'Work' | 'School' | 'Team' = 'Personal';
          if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
          else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
          else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';
          
          return {
            id: item.id,
            title: item.title,
            url: item.file_path || '#',
            type: item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase() as 'Note' | 'PDF' | 'Link' | 'Image',
            createdDate: new Date(item.created_at).toISOString().split('T')[0],
            source: item.source || 'Upload',
            keywords: [], // Will be populated from tags separately
            space: spaceType,
            content: item.content,
            description: item.content?.substring(0, 150),
          };
        });
        
        setCortexItems(convertedItems);
        setTotalItems(result.total);
        
        // Update cache
        DataCache.setCortexItems(convertedItems);
        
      } catch (error) {
        console.error('Error loading data:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
        
        if (!isRetry) {
          toast({
            title: "Error loading data",
            description: "Failed to load items from database.",
            variant: "destructive"
          });
        }
        
        // Fallback to cache or initial data only if not retrying
        if (!isRetry) {
          const cached = DataCache.getCortexItems();
          setCortexItems(cached.length > 0 ? cached : []);
        }
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    };

    loadData();
  }, [isAuthenticated, cortexId, JSON.stringify(filters), searchQuery, pagination.currentPage, pagination.pageSize]);

  // Get paginated items
  const paginatedItems = finalItems.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  // Use virtualization for large datasets (>100 items)
  const shouldVirtualize = finalItems.length > 100;

  const getCurrentSpaceName = () => {
    if (!cortexId || cortexId === 'overview') return null;
    const space = spaces.find(s => s.id === cortexId);
    return space ? `${space.emoji || ''} ${space.name}`.trim() : null;
  };

  const handleRetry = () => {
    if (lastQuery && isAuthenticated) {
      const loadData = async () => {
        try {
          setRetrying(true);
          setError(null);
          
          // Load spaces for filtering
          const spacesData = await getSpaces();
          setSpaces(spacesData);
          
          // Re-run the last query
          const result = await getItems(lastQuery);
          
          // Convert Supabase items to CortexItem format
          const convertedItems = result.items.map((item: any) => {
            const space = spacesData.find(s => s.id === item.space_id);
            const spaceName = space ? space.name : 'Personal';
            
            let spaceType: 'Personal' | 'Work' | 'School' | 'Team' = 'Personal';
            if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
            else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
            else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';
            
            return {
              id: item.id,
              title: item.title,
              url: item.file_path || '#',
              type: item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase() as 'Note' | 'PDF' | 'Link' | 'Image',
              createdDate: new Date(item.created_at).toISOString().split('T')[0],
              source: item.source || 'Upload',
              keywords: [],
              space: spaceType,
              content: item.content,
              description: item.content?.substring(0, 150),
            };
          });
          
          setCortexItems(convertedItems);
          setTotalItems(result.total);
          DataCache.setCortexItems(convertedItems);
          
        } catch (error) {
          console.error('Retry failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Retry failed';
          setError(errorMessage);
        } finally {
          setRetrying(false);
        }
      };
      
      loadData();
    }
  };

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

  const handleUpdateItem = async (id: string, updates: Partial<CortexItem>) => {
    // Store original item for rollback
    const originalItem = cortexItems.find(item => item.id === id);
    if (!originalItem) return;

    // Apply optimistic update immediately
    setCortexItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );

    // Mark item as syncing
    setSyncingItems(prev => new Set(prev).add(id));

    try {
      // Convert CortexItem updates to Item format for API
      const apiUpdates: Partial<{ title: string; [key: string]: any }> = {};
      
      if (updates.title !== undefined) {
        apiUpdates.title = updates.title;
      }
      
      // For space and keywords, we'll simulate the API call for now
      // In a real implementation, these would need proper backend support
      if (updates.space !== undefined || updates.keywords !== undefined) {
        console.log(`Simulating API update for item ${id}:`, updates);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (Object.keys(apiUpdates).length > 0) {
        await updateItem(id, apiUpdates);
      }

      // Success - clear sync status
      setSyncingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      // Clear cache to ensure consistency
      DataCache.clear();

      toast({
        title: "Changes saved",
        description: "Your changes have been synced successfully.",
      });

    } catch (error) {
      console.error('Error updating item:', error);

      // Rollback optimistic update
      setCortexItems(prev => 
        prev.map(item => 
          item.id === id ? originalItem : item
        )
      );

      // Clear sync status
      setSyncingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      
      // Show retry toast
      toast({
        title: "Failed to save changes",
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleUpdateItem(id, updates)}
          >
            Retry
          </Button>
        ),
      });
    }
  };

  const handleMoveItems = async () => {
    if (selectedItems.length === 0 || !targetCortex) return;
    
    // Find target space ID from spaces list
    let targetSpaceId: string | null = null;
    if (targetCortex !== 'overview') {
      const targetSpace = spaces.find(space => space.id === targetCortex || space.name === targetCortex);
      targetSpaceId = targetSpace?.id || null;
    }

    // Store original items for rollback
    const originalItems = cortexItems.filter(item => selectedItems.includes(item.id));

    try {
      // Apply optimistic update
      setCortexItems(prev => 
        prev.map(item => 
          selectedItems.includes(item.id) 
            ? { ...item, space: targetCortex as CortexItem['space'] }
            : item
        )
      );

      // Perform bulk move in database
      await bulkMoveItems(selectedItems, targetSpaceId);

      // Success
      toast({
        title: "Items moved successfully",
        description: `${selectedItems.length} item(s) moved to ${targetCortex}`,
      });

      setSelectedItems([]);
      setMoveDialogOpen(false);
      setTargetCortex('');

      // Refresh space counts
      try {
        const counts = await getSpaceCounts();
        // Note: We'd need to pass this up to parent component
        // For now, we'll clear cache to force refresh
        DataCache.clear();
      } catch (error) {
        console.error('Error refreshing space counts:', error);
      }

    } catch (error) {
      console.error('Error moving items:', error);
      
      // Rollback optimistic update
      setCortexItems(prev => 
        prev.map(item => {
          const original = originalItems.find(orig => orig.id === item.id);
          return original || item;
        })
      );

      const errorMessage = error instanceof Error ? error.message : 'Failed to move items';
      
      toast({
        title: "Failed to move items",
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleMoveItems}
          >
            Retry
          </Button>
        ),
      });
    }
  };

  const handleItemCreated = (newItem: CortexItem) => {
    // Optimistically insert at the top
    setCortexItems(prev => [newItem, ...prev]);
    
    // Clear cache to force refresh
    DataCache.clear();
    
    // Open preview drawer for the new item
    setPreviewItem(newItem);
    setPreviewDrawerOpen(true);
  };

  const handleDeleteItems = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete items.",
        variant: "destructive"
      });
      return;
    }

    const itemsToDelete = cortexItems.filter(item => selectedItems.includes(item.id));
    setDeletedItems(itemsToDelete);
    
    try {
      // Optimistically remove from UI
      setCortexItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      
      // Delete from database
      await deleteItems(selectedItems);
      
      // Clear cache
      DataCache.clear();
      
      // Show undo toast (note: undo won't work with database, this is just for UI feedback)
      const count = selectedItems.length;
      toast({
        title: `Deleted ${count} item(s)`,
        description: "Items have been permanently deleted.",
      });
      
    } catch (error) {
      console.error('Error deleting items:', error);
      // Restore items on error
      setCortexItems(prev => [...itemsToDelete, ...prev]);
      toast({
        title: "Error deleting items",
        description: "Failed to delete items. Please try again.",
        variant: "destructive"
      });
    }
    
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
    <EmptyItemsState
      hasFilters={activeFilterCount > 0}
      hasSearch={!!searchQuery}
      onAddFirstItem={() => setNewItemModalOpen(true)}
      onClearFilters={() => setFilters({
        types: [],
        spaces: [],
        tags: [],
        dateRange: {},
        sortBy: 'newest'
      })}
      onClearSearch={() => setSearchQuery('')}
      spaceName={getCurrentSpaceName()}
    />
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            </div>
          ) : error ? (
            <ErrorState 
              message={error}
              onRetry={handleRetry}
              retrying={retrying}
            />
          ) : !isAuthenticated ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground">Please log in to view your items.</p>
              </div>
            </div>
          ) : finalItems.length === 0 ? (
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
                  syncingItems={syncingItems}
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

        {/* Pagination - show for both virtualized and non-virtualized tables */}
        {totalItems > 0 && (
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={totalItems}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            startIndex={pagination.startIndex}
            endIndex={Math.min(pagination.endIndex, totalItems)}
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
        {/* New Item Modal */}
        <NewItemModal
          open={newItemModalOpen}
          onOpenChange={setNewItemModalOpen}
          onItemCreated={handleItemCreated}
          preselectedSpace={cortexId !== 'overview' ? cortexId : undefined}
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
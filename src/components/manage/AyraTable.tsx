import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from 'sonner';
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

  // Load data when component mounts or dependencies change
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data: itemsData, error: itemsError } = await getItems({
          spaceId: ayraId === 'overview' ? undefined : ayraId,
          searchQuery,
          ...filters,
          page: pagination.currentPage,
          pageSize: pagination.pageSize
        });

        if (itemsError) {
          throw itemsError;
        }

        const { data: spacesData, error: spacesError } = await getSpaces();
        if (spacesError) {
          console.warn('Failed to load spaces:', spacesError);
        } else {
          setSpaces(spacesData || []);
        }

        // Convert Supabase items to AyraItem format
        const convertedItems = itemsData.map((item: Item): AyraItem => {
          const spaceData = spacesData?.find(s => s.id === item.space_id);
          const spaceName = spaceData?.name || 'Personal';
          
          // Map space name to valid AyraItem space type
          let spaceType: AyraItem['space'] = 'Personal';
          if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
          else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
          else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';

          return {
            id: item.id,
            title: item.title,
            url: item.file_path || `/preview/${item.id}`,
            type: item.type.charAt(0).toUpperCase() + item.type.slice(1) as AyraItem['type'],
            createdDate: new Date(item.created_at).toISOString().split('T')[0],
            source: item.source || 'Upload',
            keywords: [], // Tags would need to be fetched separately if available
            space: spaceType,
            content: item.content,
            description: item.content?.substring(0, 150),
            file_path: item.file_path,
            size_bytes: item.size_bytes || undefined
          };
        });

        setAyraItems(convertedItems);
        pagination.setTotalItems(itemsData.length);
        
        DataCache.setAyraItems(convertedItems);
        
        // Set up real-time listeners
        const channel = supabase.channel('items_changes')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'items' },
            (payload) => {
              console.log('New item inserted:', payload.new);
              
              const currentSpaceFilter = ayraId === 'overview' ? undefined : ayraId;
              
              // Only add to UI if it matches current filter
              if (!currentSpaceFilter || payload.new.space_id === currentSpaceFilter) {
                // Convert the new item to AyraItem format
                const spaceData = spaces.find(s => s.id === payload.new.space_id);
                const spaceName = spaceData?.name || 'Personal';
                
                let spaceType: AyraItem['space'] = 'Personal';
                if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
                else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
                else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';

                const convertedItem: AyraItem = {
                  id: payload.new.id,
                  title: payload.new.title,
                  url: payload.new.file_path || `/preview/${payload.new.id}`,
                  type: payload.new.type.charAt(0).toUpperCase() + payload.new.type.slice(1) as AyraItem['type'],
                  createdDate: new Date(payload.new.created_at).toISOString().split('T')[0],
                  source: payload.new.source || 'Upload',
                  keywords: [],
                  space: spaceType,
                  content: payload.new.content,
                  description: payload.new.content?.substring(0, 150),
                  file_path: payload.new.file_path,
                  size_bytes: payload.new.size_bytes || undefined
                };
                
                setAyraItems(prev => [convertedItem, ...prev]);
              }
            }
          )
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'items' },
            (payload) => {
              console.log('Item updated:', payload.new);
              
              setAyraItems(prev => prev.map(item => {
                if (item.id === payload.new.id) {
                  const spaceData = spaces.find(s => s.id === payload.new.space_id);
                  const spaceName = spaceData?.name || 'Personal';
                  
                  let spaceType: AyraItem['space'] = 'Personal';
                  if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
                  else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
                  else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';

                  return {
                    ...item,
                    title: payload.new.title,
                    content: payload.new.content,
                    description: payload.new.content?.substring(0, 150),
                    space: spaceType
                  };
                }
                return item;
              }));
            }
          )
          .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'items' },
            (payload) => {
              console.log('Item deleted:', payload.old);
              
              const deletedItem = ayraItems.find(item => item.id === payload.old.id);
              if (deletedItem) {
                setDeletedItems(prev => [deletedItem, ...prev]);
              }
              
              setAyraItems(prev => prev.filter(item => item.id !== payload.old.id));
            }
          )
          .subscribe();

        setRetryCount(0);
        return () => {
          supabase.removeChannel(channel);
        };
        
      } catch (error: any) {
        console.error('Error loading ayra data:', error);
        
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadData(), RETRY_DELAY * Math.pow(2, retryCount));
        } else {
          setError(error.message || 'Failed to load data');
          // Fallback to cached data
          const cached = DataCache.getAyraItems();
          setAyraItems(cached.length > 0 ? cached : initialAyraItems);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, ayraId]);

  const {
    filters,
    updateFilters,
    clearFilters,
    availableTags,
    pagination
  } = useFilters([], ayraId || undefined); // Pass empty array since filtering is server-side

  // Function to get the active cortex name for display
  const getActiveAyraName = () => {
    // Handle built-in categories
    if (categoryId === 'private' && ayraId === 'overview') return 'All Items';
    if (categoryId === 'private' && ayraId === 'ai') return 'AI';
    if (categoryId === 'private' && ayraId === 'design') return 'Design'; 
    if (categoryId === 'private' && ayraId === 'development') return 'Development';
    if (categoryId === 'shared' && ayraId === 'team-resources') return 'Team Resources';
    if (categoryId === 'shared' && ayraId === 'projects') return 'Projects';
    
    // Handle custom spaces
    const space = spaces.find(s => s.id === ayraId);
    return space ? space.name : 'Items';
  };

  // Function to search and filter items
  const searchFilteredItems = () => {
    return ayraItems; // Items are already filtered server-side
  };

  // Load filtered data when filters change
  useEffect(() => {
    const loadFilteredData = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (!searchQuery.trim() && Object.keys(filters).length === 0) {
          // No search or filters, show all items
          setAyraItems([]);
          return;
        }

        // Apply filters and search on server side
        const { data: itemsData, error: itemsError } = await getItems({
          spaceId: ayraId === 'overview' ? undefined : ayraId,
          searchQuery,
          types: filters.types?.length ? filters.types : undefined,
          tags: filters.tags?.length ? filters.tags : undefined,
          dateFrom: filters.dateRange?.from,
          dateTo: filters.dateRange?.to,
          sortBy: filters.sortBy,
          page: pagination.currentPage,
          pageSize: pagination.pageSize
        });

        if (itemsError) {
          throw itemsError;
        }

        const { data: spacesData, error: spacesError } = await getSpaces();
        if (spacesError) {
          console.warn('Failed to load spaces:', spacesError);
        }

        // Convert Supabase items to AyraItem format
        const convertedItems = itemsData.map((item: Item): AyraItem => {
          const spaceData = spacesData?.find(s => s.id === item.space_id);
          const spaceName = spaceData?.name || 'Personal';
          
          let spaceType: AyraItem['space'] = 'Personal';
          if (spaceName.toLowerCase().includes('work')) spaceType = 'Work';
          else if (spaceName.toLowerCase().includes('school')) spaceType = 'School';
          else if (spaceName.toLowerCase().includes('team')) spaceType = 'Team';

          return {
            id: item.id,
            title: item.title,
            url: item.file_path || `/preview/${item.id}`,
            type: item.type.charAt(0).toUpperCase() + item.type.slice(1) as AyraItem['type'],
            createdDate: new Date(item.created_at).toISOString().split('T')[0],
            source: item.source || 'Upload',
            keywords: [],
            space: spaceType,
            content: item.content,
            description: item.content?.substring(0, 150),
            file_path: item.file_path,
            size_bytes: item.size_bytes || undefined
          };
        });

        setAyraItems(convertedItems);
        pagination.setTotalItems(itemsData.length);
        
        DataCache.setAyraItems(convertedItems);
        
      } catch (error: any) {
        console.error('Error loading filtered data:', error);
        
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => loadFilteredData(), RETRY_DELAY * Math.pow(2, retryCount));
          setRetryCount(prev => prev + 1);
        } else {
          setError(error.message || 'Failed to load filtered data');
          // Fallback to cached data
          const cached = DataCache.getAyraItems();
          setAyraItems(cached.length > 0 ? cached : []);
        }
      } finally {
        setLoading(false);
      }
    };

    loadFilteredData();
  }, [isAuthenticated, ayraId, JSON.stringify(filters), searchQuery, pagination.currentPage, pagination.pageSize]);

  // Load space metadata for move operations
  const loadSpaceMetadata = async () => {
    try {
      if (!ayraId || ayraId === 'overview') return null;
      const space = spaces.find(s => s.id === ayraId);
      if (!space) return null;

      const { data: itemsData } = await getItems({
        spaceId: ayraId,
        page: 1,
        pageSize: 1000
      });

      if (itemsData) {
        const totalItems = itemsData.length;
        const totalSize = itemsData.reduce((sum, item) => sum + (item.size_bytes || 0), 0);
        
        return {
          id: space.id,
          name: space.name,
          totalItems,
          totalSize,
          visibility: space.visibility
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading space metadata:', error);
      return null;
    }
  };

  // Effect to load space metadata when ayra changes
  useEffect(() => {
    loadSpaceMetadata().then(metadata => {
      if (metadata) {
        // Convert Supabase items to AyraItem format
        const convertedItems = metadata.items?.map((item: Item): AyraItem => {
          return {
            id: item.id,
            title: item.title,
            url: item.file_path || `/preview/${item.id}`,
            type: item.type.charAt(0).toUpperCase() + item.type.slice(1) as AyraItem['type'],
            createdDate: new Date(item.created_at).toISOString().split('T')[0],
            source: item.source || 'Upload',
            keywords: [],
            space: 'Personal' as AyraItem['space'],
            content: item.content,
            description: item.content?.substring(0, 150),
            file_path: item.file_path,
            size_bytes: item.size_bytes || undefined
          };
        }) || [];
        
        setAyraItems(convertedItems);
        
        DataCache.setAyraItems(convertedItems);
      }
    });
  }, [ayraId]);

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

      // Optimistically update the UI
      setAyraItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      );

      // Convert AyraItem updates to Item format for API
      const itemUpdates: any = {};
      if (updates.title !== undefined) itemUpdates.title = updates.title;
      if (updates.content !== undefined) itemUpdates.content = updates.content;
      if (updates.keywords !== undefined) {
        // Handle tags if your backend supports them
        // itemUpdates.tags = updates.keywords;
      }

      const { error } = await updateItem(id, itemUpdates);
      
      if (error) {
        // Revert on error
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
      
      // Revert changes on error
      setAyraItems(prev => 
        prev.map(item => 
          item.id === id ? (ayraItems.find(i => i.id === id) || item) : item
        )
      );
      
      toast.error('Failed to update item');
    }
  };

  const handleMoveItems = async () => {
    if (selectedItems.length === 0 || !targetAyra) return;

    try {
      // Get the original items before moving
      const originalItems = ayraItems.filter(item => selectedItems.includes(item.id));

      // Optimistically update the UI
      setAyraItems(prev => 
        prev.map(item => 
          selectedItems.includes(item.id) 
            ? { ...item, space: targetAyra as AyraItem['space'] }
            : item
        )
      );

      // Find the target space
      const targetSpace = spaces.find(s => s.name.toLowerCase() === targetAyra.toLowerCase()) || 
                          spaces.find(s => s.id === targetAyra);

      if (!targetSpace) {
        throw new Error('Target space not found');
      }

      // Move each item
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
      
      // Revert changes on error
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
      // Store items for potential undo
      const itemsToDelete = ayraItems.filter(item => selectedItems.includes(item.id));
      
      // Optimistically remove from UI
      setAyraItems(prev => prev.filter(item => !selectedItems.includes(item.id)));

      // Delete each item
      for (const itemId of selectedItems) {
        const { error } = await deleteItem(itemId);
        if (error) {
          throw error;
        }
      }

      // Store deleted items for undo
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
      
      // Revert changes on error
      setAyraItems(prev => [...itemsToDelete, ...prev]);
      toast.error('Failed to delete items');
    }
  };

  const handleUndoDelete = async () => {
    if (deletedItems.length === 0) return;

    try {
      // Restore items to UI
      setAyraItems(prev => [...deletedItems, ...prev]);
      
      // Clear deleted items
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
          
          <ViewSwitcher />
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
            onAddItem={() => setNewItemModalOpen(true)}
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
                  // Handle individual item move
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
              onPageChange={pagination.setCurrentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.pageSize}
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
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onDelete={(item) => {
          // Convert PreviewItem to AyraItem for deletion
          const ayraItem: AyraItem = {
            ...item,
            space: 'Personal',
            keywords: []
          };
          setDeletedItems([ayraItem]);
          setAyraItems(prev => prev.filter(i => i.id !== item.id));
          setPreviewItem(null);
          
          const deleted: AyraItem[] = deletedItems ? JSON.parse(deletedItems) : [];
          localStorage.setItem('recently-deleted-items', JSON.stringify([ayraItem, ...deleted]));
          
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
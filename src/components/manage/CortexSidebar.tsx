
import React, { useState, useEffect } from 'react';
import { Folder, Share, Users, Lock, Plus, Move, Building, Globe, Trash2, MoreHorizontal, Unlock, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Space, DataCache } from '@/lib/data';
import NewSpaceModal from './NewSpaceModal';
import NewItemModal from './NewItemModal';
import NewCategoryModal from './NewCategoryModal';
import { usePrivateLock } from '@/contexts/PrivateLockContext';
import { PrivateLockDialog } from '@/components/auth/PrivateLockDialog';

type CortexCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: CortexItem[];
};

type CortexItem = {
  id: string;
  name: string;
  emoji?: string;
  isDeletable?: boolean;
};

type CustomSpace = {
  id: string;
  name: string;
  emoji: string;
  visibility: string;
  slug: string;
};

type CustomCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

interface CortexSidebarProps {
  onCortexSelect: (categoryId: string, itemId: string | null, spaceSlug?: string) => void;
  selectedCategoryId: string;
  selectedItemId: string | null;
  selectedSpace?: string | null;
  spaceCounts?: { [spaceId: string]: number };
}

const CortexSidebar = ({ 
  onCortexSelect, 
  selectedCategoryId = 'private', 
  selectedItemId = 'overview',
  selectedSpace = null,
  spaceCounts = {}
}: CortexSidebarProps) => {
  const [customSpaces, setCustomSpaces] = useState<CustomSpace[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [newSpaceModalOpen, setNewSpaceModalOpen] = useState(false);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [preselectedSpace, setPreselectedSpace] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [selectedCategoryForNewSpace, setSelectedCategoryForNewSpace] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<CustomSpace | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [privateLockDialogOpen, setPrivateLockDialogOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'space' | 'category', id: string, categoryId?: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ type: 'space' | 'category', id: string, position?: 'above' | 'below' } | null>(null);
  const [spaceOrder, setSpaceOrder] = useState<{ [categoryId: string]: string[] }>({});
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  
  const { isPrivateUnlocked, lockPrivate } = usePrivateLock();

  // Load spaces from Supabase and categories from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load real spaces from database
        const { getSpaces } = await import('@/lib/data');
        const dbSpaces = await getSpaces();
        
        // Convert database spaces to CustomSpace format with slugs
        const spacesWithSlugs = dbSpaces.map(space => ({
          ...space,
          emoji: space.emoji || '📁', // Provide default emoji if missing
          slug: space.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        }));
        
        setCustomSpaces(spacesWithSlugs);
        
        // Load custom categories from localStorage
        const savedCategories = localStorage.getItem('custom-categories');
        if (savedCategories) {
          setCustomCategories(JSON.parse(savedCategories));
        }
        
        // Load saved ordering
        const savedSpaceOrder = localStorage.getItem('space-order');
        if (savedSpaceOrder) {
          setSpaceOrder(JSON.parse(savedSpaceOrder));
        }
        
        const savedCategoryOrder = localStorage.getItem('category-order');
        if (savedCategoryOrder) {
          setCategoryOrder(JSON.parse(savedCategoryOrder));
        } else {
          // Set default category order
          setCategoryOrder(['shared', 'team', 'private']);
        }
      } catch (error) {
        console.error('Error loading spaces:', error);
        // Fallback to localStorage for custom spaces only
        try {
          const savedSpaces = localStorage.getItem('custom-spaces');
          if (savedSpaces) {
            setCustomSpaces(JSON.parse(savedSpaces));
          }
        } catch (e) {
          console.error('Error loading custom data:', e);
        }
      }
    };

    loadData();
  }, []);
  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Folder': Folder,
      'Share': Share,
      'Users': Users,
      'Lock': Lock,
      'Building': Building,
      'Globe': Globe,
    };
    return iconMap[iconName] || Folder;
  };

  // Get spaces for category from database spaces with custom ordering
  const getSpacesForCategory = (categoryId: string) => {
    const deletedSpaces = JSON.parse(localStorage.getItem('deleted-default-spaces') || '[]');
    
    // Overview is special - it's not a real space
    const items: CortexItem[] = [];
    
    if (categoryId === 'private') {
      items.push({ id: 'overview', name: 'Overview', emoji: '📊', isDeletable: false });
    }
    
    // Add real spaces from database
    const dbSpaces = customSpaces
      .filter(space => space.visibility === categoryId)
      .filter(space => !deletedSpaces.includes(space.id))
      .map(space => ({
        id: space.id,
        name: space.name,
        emoji: space.emoji,
        isDeletable: true
      }));

    const allItems = [...items, ...dbSpaces];
    
    // Apply custom ordering if available
    const order = spaceOrder[categoryId];
    if (order) {
      const orderedItems: CortexItem[] = [];
      const unorderedItems: CortexItem[] = [];
      
      // First add items in the saved order
      order.forEach(itemId => {
        const item = allItems.find(i => i.id === itemId);
        if (item) orderedItems.push(item);
      });
      
      // Then add any new items that weren't in the saved order
      allItems.forEach(item => {
        if (!order.includes(item.id)) {
          unorderedItems.push(item);
        }
      });
      
      return [...orderedItems, ...unorderedItems];
    }
    
    return allItems;
  };

  const defaultCategories: CortexCategory[] = [
    {
      id: 'shared',
      name: 'Shared',
      icon: <Share size={16} className="text-blue-500" />,
      items: getSpacesForCategory('shared')
    },
    {
      id: 'team',
      name: 'Team Space',
      icon: <Users size={16} className="text-green-500" />,
      items: getSpacesForCategory('team')
    },
    {
      id: 'private',
      name: 'Private',
      icon: <Lock size={16} className="text-amber-500" />,
      items: getSpacesForCategory('private')
    }
  ];

  const customCategoryItems: CortexCategory[] = customCategories.map(category => ({
    id: category.id,
    name: category.name,
    icon: React.createElement(getIconComponent(category.icon), {
      size: 16,
      className: category.color
    }),
    items: getSpacesForCategory(category.id)
  }));

  const allCategories: CortexCategory[] = [...defaultCategories, ...customCategoryItems];
  
  // Apply custom category ordering
  const categories: CortexCategory[] = categoryOrder.length > 0 
    ? categoryOrder.map(id => allCategories.find(cat => cat.id === id)).filter(Boolean) as CortexCategory[]
    : allCategories;

  const handleCategoryClick = (categoryId: string) => {
    // When clicking a category header, open new space modal for that category
    setSelectedCategoryForNewSpace(categoryId);
    setNewSpaceModalOpen(true);
  };

  const handleItemClick = (categoryId: string, itemId: string, spaceSlug?: string) => {
    // Check if this is a private category item and if private is locked
    if (categoryId === 'private' && itemId !== 'overview' && !isPrivateUnlocked()) {
      setPrivateLockDialogOpen(true);
      return;
    }
    
    onCortexSelect(categoryId, itemId, spaceSlug);
  };

  const handleSpaceCreated = (space: Space) => {
    // Convert Space to CustomSpace format for the UI
    const customSpace: CustomSpace = {
      id: space.id,
      name: space.name,
      emoji: space.emoji || '📁',
      visibility: space.visibility,
      slug: space.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    };
    
    setCustomSpaces(prev => [...prev, customSpace]);
    
    // Navigate to the new space
    onCortexSelect(space.visibility, space.id);
    
    // Clear cache to ensure fresh data loads
    DataCache.clear();
  };

  const handleCategoryCreated = (category: CustomCategory) => {
    setCustomCategories(prev => [...prev, category]);
  };

  const handleDeleteSpace = (item: CortexItem) => {
    // Create a space object for deletion
    const spaceToDelete: CustomSpace = {
      id: item.id,
      name: item.name,
      emoji: item.emoji || '📁',
      visibility: selectedCategoryId,
      slug: item.name.toLowerCase().replace(/\s+/g, '-')
    };
    
    setSpaceToDelete(spaceToDelete);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSpace = () => {
    if (!spaceToDelete) return;

    try {
      // All spaces are now from database, so just mark as deleted in localStorage
      const deletedSpaces = JSON.parse(localStorage.getItem('deleted-default-spaces') || '[]');
      deletedSpaces.push(spaceToDelete.id);
      localStorage.setItem('deleted-default-spaces', JSON.stringify(deletedSpaces));
      
      // If currently viewing this space, navigate to overview
      if (selectedItemId === spaceToDelete.id) {
        onCortexSelect('private', 'overview');
      }
      
      toast.success(`Space "${spaceToDelete.name}" deleted successfully`);
      
      // Force re-render by updating state
      setCustomSpaces(prev => [...prev]);
      
    } catch (error) {
      console.error('Error deleting space:', error);
      toast.error('Failed to delete space');
    } finally {
      setDeleteDialogOpen(false);
      setSpaceToDelete(null);
    }
  };

  const handleBulkDeleteSpaces = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDeleteSpaces = () => {
    try {
      // Clear all custom spaces
      setCustomSpaces([]);
      localStorage.setItem('custom-spaces', JSON.stringify([]));
      
      // Mark all default spaces as deleted (except Overview)
      const allSpaceIds = categories.flatMap(cat => 
        cat.items.filter(item => item.isDeletable !== false).map(item => item.id)
      );
      localStorage.setItem('deleted-default-spaces', JSON.stringify(allSpaceIds));
      
      // Navigate to overview if currently viewing any space that will be deleted
      const shouldNavigateToOverview = allSpaceIds.includes(selectedItemId || '');
      if (shouldNavigateToOverview) {
        onCortexSelect('private', 'overview');
      }
      
      const totalSpaces = customSpaces.length + allSpaceIds.filter(id => !id.startsWith('overview')).length;
      toast.success(`All spaces (${totalSpaces}) deleted successfully`);
      
      // Force re-render
      setCustomSpaces([]);
      
    } catch (error) {
      console.error('Error deleting all spaces:', error);
      toast.error('Failed to delete all spaces');
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const handlePlusClick = (categoryId: string, itemId?: string, isSpace?: boolean) => {
    if (isSpace && itemId) {
      // Plus next to a space - open New Item modal with space preselected
      setPreselectedSpace(itemId);
      setNewItemModalOpen(true);
    } else {
      // Plus next to category - show popover
      setActivePopover(categoryId);
    }
  };

  const handleNewSpace = (visibility: string) => {
    setSelectedCategoryForNewSpace(visibility);
    setNewSpaceModalOpen(true);
    setActivePopover(null);
  };

  const handleNewCategory = () => {
    setNewCategoryModalOpen(true);
    setActivePopover(null);
  };

  const handleNewItem = () => {
    setPreselectedSpace(null);
    setNewItemModalOpen(true);
    setActivePopover(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: 'space' | 'category', id: string, categoryId?: string) => {
    setDraggedItem({ type, id, categoryId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, type: 'space' | 'category', id: string, position?: 'above' | 'below') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ type, id, position });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire sidebar area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetType: 'space' | 'category', targetId: string, targetCategoryId?: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    if (draggedItem.type === 'space' && targetType === 'space') {
      // Reordering spaces within a category or moving between categories
      const sourceCategoryId = draggedItem.categoryId!;
      const finalTargetCategoryId = targetCategoryId || sourceCategoryId;
      
      // Update space order
      setSpaceOrder(prev => {
        const newOrder = { ...prev };
        
        // Remove from source category
        if (prev[sourceCategoryId]) {
          newOrder[sourceCategoryId] = prev[sourceCategoryId].filter(id => id !== draggedItem.id);
        }
        
        // Add to target category
        if (!newOrder[finalTargetCategoryId]) {
          const categorySpaces = getSpacesForCategory(finalTargetCategoryId);
          newOrder[finalTargetCategoryId] = categorySpaces.map(item => item.id);
        }
        
        const targetIndex = newOrder[finalTargetCategoryId].indexOf(targetId);
        const insertIndex = dragOverTarget?.position === 'above' ? targetIndex : targetIndex + 1;
        
        newOrder[finalTargetCategoryId].splice(insertIndex, 0, draggedItem.id);
        
        // If moving between categories, update the space's visibility
        if (sourceCategoryId !== finalTargetCategoryId) {
          setCustomSpaces(prevSpaces => 
            prevSpaces.map(space => 
              space.id === draggedItem.id 
                ? { ...space, visibility: finalTargetCategoryId }
                : space
            )
          );
        }
        
        localStorage.setItem('space-order', JSON.stringify(newOrder));
        return newOrder;
      });
      
    } else if (draggedItem.type === 'category' && targetType === 'category') {
      // Reordering categories
      setCategoryOrder(prev => {
        const newOrder = [...prev];
        const draggedIndex = newOrder.indexOf(draggedItem.id);
        const targetIndex = newOrder.indexOf(targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        
        // Remove dragged item
        newOrder.splice(draggedIndex, 1);
        
        // Insert at new position
        const insertIndex = dragOverTarget?.position === 'above' ? targetIndex : targetIndex + 1;
        newOrder.splice(insertIndex, 0, draggedItem.id);
        
        localStorage.setItem('category-order', JSON.stringify(newOrder));
        return newOrder;
      });
    } else if (draggedItem.type === 'space' && targetType === 'category') {
      // Moving space to a different category
      const sourceCategoryId = draggedItem.categoryId!;
      const targetCategoryId = targetId;
      
      if (sourceCategoryId !== targetCategoryId) {
        // Update space order
        setSpaceOrder(prev => {
          const newOrder = { ...prev };
          
          // Remove from source category
          if (prev[sourceCategoryId]) {
            newOrder[sourceCategoryId] = prev[sourceCategoryId].filter(id => id !== draggedItem.id);
          }
          
          // Add to target category
          if (!newOrder[targetCategoryId]) {
            const categorySpaces = getSpacesForCategory(targetCategoryId);
            newOrder[targetCategoryId] = categorySpaces.map(item => item.id);
          }
          
          newOrder[targetCategoryId].push(draggedItem.id);
          
          localStorage.setItem('space-order', JSON.stringify(newOrder));
          return newOrder;
        });
        
        // Update the space's visibility
        setCustomSpaces(prevSpaces => 
          prevSpaces.map(space => 
            space.id === draggedItem.id 
              ? { ...space, visibility: targetCategoryId }
              : space
          )
        );
        
        toast.success(`Space moved to ${targetCategoryId}`);
      }
    }
    
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  return (
    <>
      <div className="w-60 border-r border-border/50 overflow-y-auto shrink-0">
        {/* Add Category Button and Bulk Actions */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start"
              onClick={handleNewCategory}
            >
              <Plus size={14} className="mr-2" />
              Add Category
            </Button>
            
            {/* Bulk Actions Menu */}
            {(customSpaces.length > 0 || categories.some(cat => cat.items.some(item => item.isDeletable !== false))) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleBulkDeleteSpaces}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete All Spaces
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="mb-6">
            <div 
              className={cn(
                "flex items-center justify-between px-4 py-2 text-sm font-medium cursor-pointer relative",
                selectedCategoryId === category.id && !selectedItemId ? "text-primary" : "text-foreground/80",
                draggedItem?.id === category.id ? "opacity-50" : "",
                dragOverTarget?.type === 'category' && dragOverTarget.id === category.id ? "bg-primary/10" : ""
              )}
              draggable
              onDragStart={(e) => handleDragStart(e, 'category', category.id)}
              onDragOver={(e) => handleDragOver(e, 'category', category.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'category', category.id)}
              onDragEnd={handleDragEnd}
              onClick={() => handleCategoryClick(category.id)}
            >
              {/* Drop indicator lines */}
              {dragOverTarget?.type === 'category' && dragOverTarget.id === category.id && dragOverTarget.position === 'above' && (
                <div className="absolute -top-px left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
              {dragOverTarget?.type === 'category' && dragOverTarget.id === category.id && dragOverTarget.position === 'below' && (
                <div className="absolute -bottom-px left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-muted-foreground" />
                {category.icon}
                <span>{category.name}</span>
                {/* Private lock/unlock indicator */}
                {category.id === 'private' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPrivateUnlocked()) {
                        lockPrivate();
                        toast.success('Private items locked');
                      } else {
                        setPrivateLockDialogOpen(true);
                      }
                    }}
                    className="p-1 rounded hover:bg-muted"
                    title={isPrivateUnlocked() ? 'Lock private items' : 'Unlock private items'}
                  >
                    {isPrivateUnlocked() ? (
                      <Unlock size={12} className="text-green-500" />
                    ) : (
                      <Lock size={12} className="text-amber-500" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Category Plus Button with Popover */}
              <Popover 
                open={activePopover === category.id} 
                onOpenChange={(open) => setActivePopover(open ? category.id : null)}
              >
                <PopoverTrigger asChild>
                  <button 
                    className="p-1 rounded-full hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(activePopover === category.id ? null : category.id);
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-48 p-2 bg-popover border border-border shadow-lg z-50" 
                  align="start" 
                  side="right"
                >
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleNewSpace(category.id)}
                    >
                      <Plus size={14} className="mr-2" />
                      New Space
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleNewItem}
                    >
                      <Plus size={14} className="mr-2" />
                      New Item
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="mt-1">
              {category.items.map((item) => {                
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between px-6 py-2 text-sm cursor-pointer group relative",
                      selectedCategoryId === category.id && selectedItemId === item.id
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50 text-foreground/80",
                      draggedItem?.id === item.id ? "opacity-50" : "",
                      dragOverTarget?.type === 'space' && dragOverTarget.id === item.id ? "bg-primary/10" : ""
                    )}
                    draggable={item.isDeletable !== false}
                    onDragStart={(e) => item.isDeletable !== false && handleDragStart(e, 'space', item.id, category.id)}
                    onDragOver={(e) => handleDragOver(e, 'space', item.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'space', item.id, category.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleItemClick(category.id, item.id)}
                  >
                    {/* Drop indicator lines */}
                    {dragOverTarget?.type === 'space' && dragOverTarget.id === item.id && dragOverTarget.position === 'above' && (
                      <div className="absolute -top-px left-6 right-6 h-0.5 bg-primary rounded-full" />
                    )}
                    {dragOverTarget?.type === 'space' && dragOverTarget.id === item.id && dragOverTarget.position === 'below' && (
                      <div className="absolute -bottom-px left-6 right-6 h-0.5 bg-primary rounded-full" />
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      {item.isDeletable !== false && (
                        <GripVertical size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      {item.emoji && <span className="text-sm">{item.emoji}</span>}
                      <span className={cn(
                        "flex-1",
                        category.id === 'private' && item.id !== 'overview' && !isPrivateUnlocked() 
                          ? "text-muted-foreground" 
                          : ""
                      )}>
                        {item.name}
                      </span>
                      {/* Lock indicator for private items */}
                      {category.id === 'private' && item.id !== 'overview' && !isPrivateUnlocked() && (
                        <Lock size={12} className="text-amber-500" />
                      )}
                      {/* Space count badge */}
                      {spaceCounts[item.id] !== undefined && spaceCounts[item.id] > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                          {spaceCounts[item.id]}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Add Item Button */}
                      <button
                        className="p-1 rounded-full hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlusClick(category.id, item.id, true);
                        }}
                        title="Add item to space"
                      >
                        <Plus size={12} />
                      </button>
                      
                      {/* Delete Space Button - For all deletable spaces */}
                      {item.isDeletable !== false && (
                        <button
                          className="p-1 rounded-full hover:bg-destructive/20 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSpace(item);
                          }}
                          title="Delete space"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* New Space Modal */}
      <NewSpaceModal
        open={newSpaceModalOpen}
        onOpenChange={setNewSpaceModalOpen}
        onSpaceCreated={handleSpaceCreated}
        selectedCategory={selectedCategoryForNewSpace}
        onClose={() => {
          setNewSpaceModalOpen(false);
          setSelectedCategoryForNewSpace(null);
        }}
      />

      {/* New Category Modal */}
      <NewCategoryModal
        open={newCategoryModalOpen}
        onOpenChange={setNewCategoryModalOpen}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* New Item Modal */}
      <NewItemModal
        open={newItemModalOpen}
        onOpenChange={setNewItemModalOpen}
        onItemCreated={() => {
          // Handle item creation if needed
          setNewItemModalOpen(false);
        }}
        preselectedSpace={preselectedSpace}
      />

      {/* Private Lock Dialog */}
      <PrivateLockDialog
        open={privateLockDialogOpen}
        onOpenChange={setPrivateLockDialogOpen}
        onUnlocked={() => {
          // Re-trigger the item click after unlocking
          if (selectedCategoryId === 'private' && selectedItemId) {
            onCortexSelect(selectedCategoryId, selectedItemId);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Space</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{spaceToDelete?.name}"? This action cannot be undone and will remove all items in this space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSpace}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Space
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Spaces</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all spaces? This action cannot be undone and will remove all items in these spaces. The Overview space will be preserved.    
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDeleteSpaces}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Spaces
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Private Lock Dialog */}
      <PrivateLockDialog
        open={privateLockDialogOpen}
        onOpenChange={setPrivateLockDialogOpen}
        onUnlocked={() => {
          // Re-trigger the item click after unlocking
          if (selectedCategoryId === 'private' && selectedItemId) {
            onCortexSelect(selectedCategoryId, selectedItemId);
          }
        }}
      />
    </>
  );
};

export default CortexSidebar;

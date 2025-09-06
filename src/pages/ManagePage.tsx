
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useLibraryTitle } from '@/hooks/useLibraryTitle';
import { useHotkeys } from '@/hooks/useHotkeys';
import CortexTable from '@/components/manage/CortexTable';
import type { CortexTableRef } from '@/components/manage/CortexTable';
import CortexSidebar from '@/components/manage/CortexSidebar';
import ViewSwitcher from '@/components/manage/ViewSwitcher';
import HotkeysSheet from '@/components/manage/HotkeysSheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Edit2, X, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Toaster } from 'sonner';
import NewItemModal from '@/components/manage/NewItemModal';

const ManagePage = () => {
  const showContent = useAnimateIn(false, 300);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'table' | 'grid' | 'list' | 'kanban'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('private');
  const [selectedItem, setSelectedItem] = useState<string | null>('overview');
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [customSpaces, setCustomSpaces] = useState<any[]>([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // Refs for hotkey access
  const cortexTableRef = useRef<CortexTableRef>(null);
  
  // Use the enhanced title editing hook
  const {
    libraryTitle,
    isEditing,
    tempTitle,
    isSaving,
    showSuccess,
    setTempTitle,
    handleBlur,
    handleKeyDown,
    handleDoubleClick,
    cancelEdit,
  } = useLibraryTitle();

  // Load custom spaces and handle URL params
  useEffect(() => {
    // Load custom spaces
    try {
      const saved = localStorage.getItem('custom-spaces');
      if (saved) {
        setCustomSpaces(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading custom spaces:', error);
    }

    // Handle URL params
    const spaceParam = searchParams.get('space');
    const itemParam = searchParams.get('itemId');
    
    if (spaceParam) {
      setSelectedSpace(spaceParam);
      // Find the space and set appropriate category
      const saved = localStorage.getItem('custom-spaces');
      if (saved) {
        const spaces = JSON.parse(saved);
        const space = spaces.find((s: any) => s.slug === spaceParam);
        if (space) {
          setSelectedCategory(space.visibility === 'Private' ? 'private' : 'team');
          setSelectedItem(space.id);
        }
      }
    }
  }, [searchParams]);

  const handleDialogSave = () => {
    if (tempTitle.trim()) {
      setDialogOpen(false);
    }
  };

  const handleCortexSelect = (categoryId: string, itemId: string | null, spaceSlug?: string) => {
    setSelectedCategory(categoryId);
    setSelectedItem(itemId);
    setSelectedSpace(spaceSlug || null);
    
    // Update URL if it's a custom space
    if (spaceSlug) {
      navigate(`/manage?space=${spaceSlug}`, { replace: true });
    } else {
      navigate('/manage', { replace: true });
    }
  };


  // Check if current selection is a custom space with no items
  const isEmptyCustomSpace = () => {
    if (!selectedSpace || !selectedItem) return false;
    
    const space = customSpaces.find(s => s.id === selectedItem);
    if (!space) return false;
    
    // Check if space has any items (this would be from cortex-items localStorage)
    try {
      const items = JSON.parse(localStorage.getItem('cortex-items') || '[]');
      const spaceItems = items.filter((item: any) => item.spaceId === space.id);
      return spaceItems.length === 0;
    } catch {
      return true;
    }
  };

  const getCurrentSpaceName = () => {
    if (!selectedSpace || !selectedItem) return null;
    const space = customSpaces.find(s => s.id === selectedItem);
    return space ? `${space.emoji} ${space.name}` : null;
  };

  // Setup hotkeys
  useHotkeys([
    {
      key: '/',
      action: () => cortexTableRef.current?.focusSearch(),
    },
    {
      key: 'f',
      action: () => cortexTableRef.current?.openFilters(),
    },
    {
      key: 'n', 
      action: () => cortexTableRef.current?.openNewItem(),
    },
    {
      key: 'j',
      action: () => cortexTableRef.current?.navigateSelection('down'),
      condition: () => viewType === 'table',
    },
    {
      key: 'k',
      action: () => cortexTableRef.current?.navigateSelection('up'),
      condition: () => viewType === 'table',
    },
    {
      key: 'Enter',
      action: () => cortexTableRef.current?.openPreviewForSelected(),
      condition: () => viewType === 'table',
    },
    {
      key: 'Escape',
      action: () => cortexTableRef.current?.closePreview(),
    },
  ]);

  return (
    <div className="max-w-full mx-auto h-screen pt-24 pb-6">
      <Toaster position="top-right" />
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="flex h-[calc(100vh-130px)]">
          <CortexSidebar 
            onCortexSelect={handleCortexSelect}
            selectedCategoryId={selectedCategory}
            selectedItemId={selectedItem}
            selectedSpace={selectedSpace}
          />
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className="h-8 text-xl font-semibold w-64"
                    autoFocus
                  />
                  {isSaving && (
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  )}
                  {showSuccess && (
                    <Check size={16} className="text-green-500" />
                  )}
                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                    <X size={18} className="text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 
                    className="text-xl font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                    onDoubleClick={handleDoubleClick}
                    title="Double-click to edit"
                  >
                    {libraryTitle}
                  </h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-1">
                      Filtered
                    </Badge>
                  )}
                  {showSuccess && (
                    <Check size={16} className="text-green-500" />
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <ViewSwitcher activeView={viewType} onViewChange={setViewType} />
                </TooltipProvider>
                <HotkeysSheet />
              </div>
            </div>
            {isEmptyCustomSpace() ? (
              // Empty state for custom spaces
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold mb-2">
                    Add your first item to {getCurrentSpaceName()}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start building your knowledge base by adding notes, PDFs, links, or images to this space.
                  </p>
                  <Button onClick={() => setNewItemModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add First Item
                  </Button>
                </div>
              </div>
            ) : (
              <CortexTable 
                ref={cortexTableRef}
                viewType={viewType} 
                categoryId={selectedCategory}
                cortexId={selectedItem}
                onFiltersChange={(count) => setActiveFilterCount(count)}
              />
            )}
          </div>
        </div>
      </AnimatedTransition>

      {/* Alternative: Dialog for editing title */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Library Title</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="w-full"
              placeholder="Enter a title for your library"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDialogSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Item Modal for empty state */}
      <NewItemModal
        open={newItemModalOpen}
        onOpenChange={setNewItemModalOpen}
        onItemCreated={() => {
          setNewItemModalOpen(false);
          // Refresh the view
          window.location.reload();
        }}
        preselectedSpace={selectedItem}
      />
    </div>
  );
};

export default ManagePage;

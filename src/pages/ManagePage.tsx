
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import CortexTable from '@/components/manage/CortexTable';
import CortexSidebar from '@/components/manage/CortexSidebar';
import ViewSwitcher from '@/components/manage/ViewSwitcher';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Edit2, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Toaster } from 'sonner';
import NewItemModal from '@/components/manage/NewItemModal';

const ManagePage = () => {
  const showContent = useAnimateIn(false, 300);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'table' | 'grid' | 'list' | 'kanban'>('table');
  const [libraryTitle, setLibraryTitle] = useState('Cortex Library');
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('private');
  const [selectedItem, setSelectedItem] = useState<string | null>('overview');
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [customSpaces, setCustomSpaces] = useState<any[]>([]);

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

  const handleEditClick = () => {
    setTempTitle(libraryTitle);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (tempTitle.trim()) {
      setLibraryTitle(tempTitle);
      setIsEditing(false);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleDialogOpen = () => {
    setTempTitle(libraryTitle);
    setDialogOpen(true);
  };

  const handleDialogSave = () => {
    if (tempTitle.trim()) {
      setLibraryTitle(tempTitle);
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

  // Handle keyboard events for inline editing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClick();
    } else if (e.key === 'Escape') {
      handleCancelClick();
    }
  };

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
                    className="h-8 text-xl font-semibold w-64"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveClick}>
                    <Check size={18} className="text-green-500" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancelClick}>
                    <X size={18} className="text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{libraryTitle}</h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEditClick}
                    className="h-8 w-8"
                  >
                    <Edit2 size={14} />
                  </Button>
                </div>
              )}
              <TooltipProvider>
                <ViewSwitcher activeView={viewType} onViewChange={setViewType} />
              </TooltipProvider>
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
                viewType={viewType} 
                categoryId={selectedCategory}
                cortexId={selectedItem}
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

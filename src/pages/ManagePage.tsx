import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useLibraryTitle } from '@/hooks/useLibraryTitle';
import { useHotkeys } from '@/hooks/useHotkeys';
import AyraTable, { AyraTableRef } from '@/components/manage/AyraTable';
import AyraSidebar from '@/components/manage/AyraSidebar';
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
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import InlineError from '@/components/auth/InlineError';
import AuthModal from '@/components/AuthModal';

const ManagePage = () => {
  const showContent = useAnimateIn(false, 300);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<'table' | 'grid' | 'list' | 'kanban' | 'neural' | 'timeline'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('private');
  const [selectedItem, setSelectedItem] = useState<string | null>('overview');
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [customSpaces, setCustomSpaces] = useState<any[]>([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [isEmptySpace, setIsEmptySpace] = useState(false);
  const [spaceCounts, setSpaceCounts] = useState<{ [spaceId: string]: number }>({});
  const [checkingEmptyState, setCheckingEmptyState] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Auth state
  const { isAuthenticated } = useAuth();
  
  // Refs for hotkey access
  const ayraTableRef = useRef<AyraTableRef>(null);
  
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
    if (!isAuthenticated) {
      setCustomSpaces([]);
      return;
    }

    // Handle URL params
    const spaceParam = searchParams.get('space');
    const itemParam = searchParams.get('itemId');
    
    if (spaceParam) {
      setSelectedSpace(spaceParam);
      // Find the space and set appropriate category
      const space = customSpaces.find((s: any) => s.name === spaceParam);
      if (space) {
        setSelectedCategory(space.visibility === 'private' ? 'private' : 'team');
        setSelectedItem(space.id);
      }
    }
  }, [searchParams, isAuthenticated]);

  const handleDialogSave = () => {
    if (tempTitle.trim()) {
      setDialogOpen(false);
    }
  };

  const handleAyraSelect = (categoryId: string, itemId: string | null, spaceSlug?: string) => {
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

  const getCurrentSpaceName = () => {
    if (!selectedSpace || !selectedItem) return null;
    const space = customSpaces.find(s => s.id === selectedItem);
    return space ? `${space.emoji} ${space.name}` : null;
  };

  // Setup hotkeys
  useHotkeys([
    {
      key: '/',
      action: () => ayraTableRef.current?.focusSearch(),
    },
    {
      key: 'f',
      action: () => ayraTableRef.current?.openFilters(),
    },
    {
      key: 'n', 
      action: () => ayraTableRef.current?.openNewItem(),
    },
    {
      key: 'j',
      action: () => ayraTableRef.current?.navigateSelection('down'),
      condition: () => viewType === 'table',
    },
    {
      key: 'k',
      action: () => ayraTableRef.current?.navigateSelection('up'),
      condition: () => viewType === 'table',
    },
    {
      key: 'Enter',
      action: () => ayraTableRef.current?.openPreviewForSelected(),
      condition: () => viewType === 'table',
    },
    {
      key: 'Escape',
      action: () => ayraTableRef.current?.closePreview(),
    },
  ]);

  return (
    <AuthGuard 
      title="Access your library"
      description="Sign in to manage your notes, documents, and saved links."
    >
      <div className="max-w-full mx-auto h-screen pt-24 pb-6">
        <Toaster position="top-right" />
        
        {authError && (
          <div className="mb-4 mx-4">
            <InlineError 
              message={authError}
              onSignIn={() => setAuthModalOpen(true)}
            />
          </div>
        )}
        
        <AnimatedTransition show={showContent} animation="slide-up">
          <div className="flex h-[calc(100vh-130px)]">
            <AyraSidebar 
              onAyraSelect={handleAyraSelect}
              selectedCategoryId={selectedCategory}
              selectedItemId={selectedItem}
              selectedSpace={selectedSpace}
              spaceCounts={spaceCounts}
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
              {isEmptySpace ? (
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
                <AyraTable 
                  ref={ayraTableRef}
                  viewType={viewType} 
                  categoryId={selectedCategory}
                  ayraId={selectedItem}
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
          onItemCreated={(item) => {
            setNewItemModalOpen(false);
          }}
          preselectedSpace={selectedItem === 'overview' ? undefined : selectedItem}
        />

        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
};

export default ManagePage;
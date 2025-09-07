
import React, { useState, useEffect } from 'react';
import { Folder, Share, Users, Lock, Plus, Move, Building, Globe, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import NewSpaceModal from './NewSpaceModal';
import NewItemModal from './NewItemModal';
import NewCategoryModal from './NewCategoryModal';

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

  // Load custom spaces and categories from localStorage
  useEffect(() => {
    try {
      const savedSpaces = localStorage.getItem('custom-spaces');
      if (savedSpaces) {
        setCustomSpaces(JSON.parse(savedSpaces));
      }
      
      const savedCategories = localStorage.getItem('custom-categories');
      if (savedCategories) {
        setCustomCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error('Error loading custom data:', error);
    }
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

  // Combine default spaces with custom spaces
  const getSpacesForCategory = (categoryId: string) => {
    const defaultSpaces = {
      'shared': [
        { id: 'shared-1', name: 'Second Brain', emoji: '🧠' },
        { id: 'shared-2', name: 'OSS', emoji: '⚡' },
        { id: 'shared-3', name: 'Artificial Intelligence', emoji: '🤖' },
      ],
      'team': [
        { id: 'team-1', name: 'Brainboard Competitors', emoji: '🎯' },
        { id: 'team-2', name: 'Visualize Terraform', emoji: '🏗️' },
        { id: 'team-3', name: 'CI/CD Engine', emoji: '⚙️' },
      ],
      'private': [
        { id: 'overview', name: 'Overview', emoji: '📊' },
        { id: 'private-1', name: 'UXUI', emoji: '🎨' },
        { id: 'private-2', name: 'Space', emoji: '🚀' },
        { id: 'private-3', name: 'Cloud Computing', emoji: '☁️' },
      ]
    };

    const defaultItems = defaultSpaces[categoryId as keyof typeof defaultSpaces] || [];
    const customItems = customSpaces
      .filter(space => space.visibility === categoryId)
      .map(space => ({
        id: space.id,
        name: space.name,
        emoji: space.emoji
      }));

    return [...defaultItems, ...customItems];
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

  const categories: CortexCategory[] = [...defaultCategories, ...customCategoryItems];

  const handleCategoryClick = (categoryId: string) => {
    // When clicking a category header, open new space modal for that category
    setSelectedCategoryForNewSpace(categoryId);
    setNewSpaceModalOpen(true);
  };

  const handleItemClick = (categoryId: string, itemId: string, spaceSlug?: string) => {
    onCortexSelect(categoryId, itemId, spaceSlug);
  };

  const handleSpaceCreated = (space: CustomSpace) => {
    setCustomSpaces(prev => [...prev, space]);
    // Route to the new space
    onCortexSelect(space.visibility, space.id, space.slug);
  };

  const handleCategoryCreated = (category: CustomCategory) => {
    setCustomCategories(prev => [...prev, category]);
  };

  const handleDeleteSpace = (space: CustomSpace) => {
    setSpaceToDelete(space);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSpace = () => {
    if (!spaceToDelete) return;

    try {
      // Remove from custom spaces
      const updatedSpaces = customSpaces.filter(space => space.id !== spaceToDelete.id);
      setCustomSpaces(updatedSpaces);
      
      // Update localStorage
      localStorage.setItem('custom-spaces', JSON.stringify(updatedSpaces));
      
      // If currently viewing this space, navigate to overview
      if (selectedItemId === spaceToDelete.id) {
        onCortexSelect('private', 'overview');
      }
      
      toast.success(`Space "${spaceToDelete.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting space:', error);
      toast.error('Failed to delete space');
    } finally {
      setDeleteDialogOpen(false);
      setSpaceToDelete(null);
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

  return (
    <>
      <div className="w-60 border-r border-border/50 overflow-y-auto shrink-0">
        {/* Add Category Button */}
        <div className="p-4 border-b border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleNewCategory}
          >
            <Plus size={14} className="mr-2" />
            Add Category
          </Button>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="mb-6">
            <div 
              className={cn(
                "flex items-center justify-between px-4 py-2 text-sm font-medium cursor-pointer",
                selectedCategoryId === category.id && !selectedItemId ? "text-primary" : "text-foreground/80"
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="flex items-center gap-2">
                {category.icon}
                <span>{category.name}</span>
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
                const isCustomSpace = customSpaces.find(space => space.id === item.id);
                
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between px-6 py-2 text-sm cursor-pointer group",
                      selectedCategoryId === category.id && selectedItemId === item.id
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50 text-foreground/80"
                    )}
                    onClick={() => handleItemClick(category.id, item.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {item.emoji && <span className="text-sm">{item.emoji}</span>}
                      <span className="flex-1">{item.name}</span>
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
                      
                      {/* Delete Space Button - Only for custom spaces */}
                      {isCustomSpace && (
                        <button
                          className="p-1 rounded-full hover:bg-destructive/20 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSpace(isCustomSpace);
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
    </>
  );
};

export default CortexSidebar;

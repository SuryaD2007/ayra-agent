
import React, { useState, useEffect } from 'react';
import { Folder, Share, Users, Lock, Plus, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import NewSpaceModal from './NewSpaceModal';
import NewItemModal from './NewItemModal';

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
  visibility: 'Private' | 'Team';
  slug: string;
};

interface CortexSidebarProps {
  onCortexSelect: (categoryId: string, itemId: string | null, spaceSlug?: string) => void;
  selectedCategoryId: string;
  selectedItemId: string | null;
  selectedSpace?: string | null;
}

const CortexSidebar = ({ 
  onCortexSelect, 
  selectedCategoryId = 'private', 
  selectedItemId = 'overview',
  selectedSpace = null
}: CortexSidebarProps) => {
  const [customSpaces, setCustomSpaces] = useState<CustomSpace[]>([]);
  const [newSpaceModalOpen, setNewSpaceModalOpen] = useState(false);
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [preselectedSpace, setPreselectedSpace] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);

  // Load custom spaces from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom-spaces');
      if (saved) {
        setCustomSpaces(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading custom spaces:', error);
    }
  }, []);
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
      .filter(space => 
        (categoryId === 'private' && space.visibility === 'Private') ||
        (categoryId === 'team' && space.visibility === 'Team')
      )
      .map(space => ({
        id: space.id,
        name: space.name,
        emoji: space.emoji
      }));

    return [...defaultItems, ...customItems];
  };

  const categories: CortexCategory[] = [
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

  const handleCategoryClick = (categoryId: string) => {
    onCortexSelect(categoryId, null);
  };

  const handleItemClick = (categoryId: string, itemId: string, spaceSlug?: string) => {
    onCortexSelect(categoryId, itemId, spaceSlug);
  };

  const handleSpaceCreated = (space: CustomSpace) => {
    setCustomSpaces(prev => [...prev, space]);
    // Route to the new space
    const categoryId = space.visibility === 'Private' ? 'private' : 'team';
    onCortexSelect(categoryId, space.id, space.slug);
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

  const handleNewSpace = (visibility: 'Private' | 'Team') => {
    setNewSpaceModalOpen(true);
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
                      onClick={() => handleNewSpace(category.id === 'private' ? 'Private' : 'Team')}
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
              {category.items.map((item) => (
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
                  <div className="flex items-center gap-2">
                    {item.emoji && <span className="text-sm">{item.emoji}</span>}
                    <span>{item.name}</span>
                  </div>
                  
                  {/* Space Plus Button */}
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlusClick(category.id, item.id, true);
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Space Modal */}
      <NewSpaceModal
        open={newSpaceModalOpen}
        onOpenChange={setNewSpaceModalOpen}
        onSpaceCreated={handleSpaceCreated}
        defaultVisibility={activePopover === 'private' ? 'Private' : 'Team'}
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
    </>
  );
};

export default CortexSidebar;

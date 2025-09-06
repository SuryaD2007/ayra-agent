import React, { useState, useEffect } from 'react';
import { X, Filter, Save, Settings, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { CortexItem } from './cortex-data';
import { SavedFiltersService, SavedFilter } from '@/utils/savedFilters';
import { toast } from '@/hooks/use-toast';

export interface FilterState {
  types: CortexItem['type'][];
  spaces: CortexItem['space'][];
  tags: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  sortBy: 'newest' | 'oldest' | 'title-az' | 'title-za';
}

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableTags: string[];
  activeFilterCount: number;
  currentSpace?: string;
}

const FilterDrawer = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  availableTags,
  activeFilterCount,
  currentSpace = 'overview'
}: FilterDrawerProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [newTag, setNewTag] = useState('');
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [editName, setEditName] = useState('');

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Load saved filters
  useEffect(() => {
    setSavedFilters(SavedFiltersService.getSavedFilters());
  }, [open]);

  // Filter available tags based on input
  useEffect(() => {
    const filtered = availableTags.filter(tag => 
      tag.toLowerCase().includes(newTag.toLowerCase()) &&
      !localFilters.tags.includes(tag)
    );
    setFilteredTags(filtered);
  }, [newTag, availableTags, localFilters.tags]);

  const handleTypeToggle = (type: CortexItem['type']) => {
    const newTypes = localFilters.types.includes(type)
      ? localFilters.types.filter(t => t !== type)
      : [...localFilters.types, type];
    
    setLocalFilters(prev => ({ ...prev, types: newTypes }));
  };

  const handleSpaceToggle = (space: CortexItem['space']) => {
    const newSpaces = localFilters.spaces.includes(space)
      ? localFilters.spaces.filter(s => s !== space)
      : [...localFilters.spaces, space];
    
    setLocalFilters(prev => ({ ...prev, spaces: newSpaces }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !localFilters.tags.includes(tag)) {
      setLocalFilters(prev => ({ 
        ...prev, 
        tags: [...prev.tags, tag] 
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    // Save filters for current space
    SavedFiltersService.saveSpaceFilters(currentSpace, localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      types: [],
      spaces: [],
      tags: [],
      dateRange: {},
      sortBy: 'newest'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    SavedFiltersService.clearSpaceFilters(currentSpace);
  };

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      try {
        SavedFiltersService.saveFilter(filterName.trim(), localFilters);
        setSavedFilters(SavedFiltersService.getSavedFilters());
        setSaveDialogOpen(false);
        setFilterName('');
        toast({
          title: "Filter saved",
          description: `"${filterName.trim()}" has been saved successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save filter. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleLoadSavedFilter = (savedFilter: SavedFilter) => {
    setLocalFilters(savedFilter.filters);
    toast({
      title: "Filter applied",
      description: `"${savedFilter.name}" has been applied.`,
    });
  };

  const handleDeleteFilter = (filterId: string) => {
    try {
      SavedFiltersService.deleteFilter(filterId);
      setSavedFilters(SavedFiltersService.getSavedFilters());
      toast({
        title: "Filter deleted",
        description: "Filter has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete filter. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRenameFilter = () => {
    if (editingFilter && editName.trim()) {
      try {
        SavedFiltersService.renameFilter(editingFilter.id, editName.trim());
        setSavedFilters(SavedFiltersService.getSavedFilters());
        setEditingFilter(null);
        setEditName('');
        toast({
          title: "Filter renamed",
          description: "Filter has been renamed successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to rename filter. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const typeOptions: CortexItem['type'][] = ['Note', 'PDF', 'Link', 'Image'];
  const spaceOptions: CortexItem['space'][] = ['Personal', 'Work', 'School', 'Team'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Filter size={20} />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            
            {/* Saved Filters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Save size={14} />
                  Saved
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                  <Save size={14} className="mr-2" />
                  Save Current
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setManageDialogOpen(true)}>
                  <Settings size={14} className="mr-2" />
                  Manage Saved
                </DropdownMenuItem>
                
                {savedFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {savedFilters.map((savedFilter) => (
                      <DropdownMenuItem
                        key={savedFilter.id}
                        onClick={() => handleLoadSavedFilter(savedFilter)}
                        className="flex items-center justify-between"
                      >
                        <span className="truncate">{savedFilter.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Type Filters */}
          <div>
            <Label className="text-sm font-medium">Type</Label>
            <div className="mt-2 space-y-2">
              {typeOptions.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={localFilters.types.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm font-normal">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Space Filters */}
          <div>
            <Label className="text-sm font-medium">Space</Label>
            <div className="mt-2 space-y-2">
              {spaceOptions.map(space => (
                <div key={space} className="flex items-center space-x-2">
                  <Checkbox
                    id={`space-${space}`}
                    checked={localFilters.spaces.includes(space)}
                    onCheckedChange={() => handleSpaceToggle(space)}
                  />
                  <Label htmlFor={`space-${space}`} className="text-sm font-normal">
                    {space}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium">Tags</Label>
            <div className="mt-2">
              <div className="relative">
                <Input
                  placeholder="Search and add tags..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredTags.length > 0) {
                        handleAddTag(filteredTags[0]);
                      } else if (newTag.trim()) {
                        handleAddTag(newTag.trim());
                      }
                    }
                  }}
                />
                {newTag && filteredTags.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border border-border rounded-md shadow-md max-h-32 overflow-auto">
                    {filteredTags.map(tag => (
                      <button
                        key={tag}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {localFilters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div>
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={localFilters.dateRange.from ? format(localFilters.dateRange.from, "yyyy-MM-dd") : ""}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: e.target.value ? new Date(e.target.value) : undefined }
                  }))}
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date" 
                  value={localFilters.dateRange.to ? format(localFilters.dateRange.to, "yyyy-MM-dd") : ""}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: e.target.value ? new Date(e.target.value) : undefined }
                  }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sort */}
          <div>
            <Label className="text-sm font-medium">Sort by</Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value: FilterState['sortBy']) =>
                setLocalFilters(prev => ({ ...prev, sortBy: value }))
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title-az">Title A–Z</SelectItem>
                <SelectItem value="title-za">Title Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
          <div className="flex gap-2">
            <Button onClick={handleClearFilters} variant="outline" className="flex-1">
              Clear
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
      
      {/* Save Filter Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="filter-name">Filter Name</Label>
            <Input
              id="filter-name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Filters Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Saved Filters</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-80 overflow-auto">
            {savedFilters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No saved filters yet. Save your current filter to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {savedFilters.map((savedFilter) => (
                  <div key={savedFilter.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    {editingFilter?.id === savedFilter.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleRenameFilter}>
                          <X size={14} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingFilter(null);
                          setEditName('');
                        }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium">{savedFilter.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(savedFilter.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingFilter(savedFilter);
                              setEditName(savedFilter.name);
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteFilter(savedFilter.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

export default FilterDrawer;
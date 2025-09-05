import React, { useState, useEffect } from 'react';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CortexItem } from './cortex-data';

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
}

const FilterDrawer = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  availableTags,
  activeFilterCount
}: FilterDrawerProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [newTag, setNewTag] = useState('');
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
  };

  const typeOptions: CortexItem['type'][] = ['Note', 'PDF', 'Link', 'Image'];
  const spaceOptions: CortexItem['space'][] = ['Personal', 'Work', 'School', 'Team'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.from ? (
                        format(localFilters.dateRange.from, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.from}
                      onSelect={(date) => setLocalFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: date }
                      }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.to ? (
                        format(localFilters.dateRange.to, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.to}
                      onSelect={(date) => setLocalFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: date }
                      }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
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
    </Sheet>
  );
};

export default FilterDrawer;
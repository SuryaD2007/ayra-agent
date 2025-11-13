
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AyraItem } from '../ayra-data';
import { Check, Square, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridViewProps {
  items: AyraItem[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
  spaces?: any[];
  onMoveItem?: (itemId: string, targetSpaceId: string | null) => void;
}

const GridView = ({ 
  items, 
  selectedItems = [], 
  onSelectItem = () => {},
  spaces = [],
  onMoveItem = () => {}
}: GridViewProps) => {
  
  const handleSpaceChange = (itemId: string, newSpaceId: string) => {
    onMoveItem(itemId, newSpaceId === 'overview' ? null : newSpaceId);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        
        return (
          <Card 
            key={item.id} 
            className={cn(
              "overflow-hidden hover:shadow-md transition-shadow relative",
              isSelected && "ring-2 ring-primary"
            )}
          >
            <div 
              className="absolute right-2 top-2 cursor-pointer"
              onClick={() => onSelectItem(item.id)}
            >
              {isSelected ? (
                <div className="rounded-md bg-primary text-white p-0.5">
                  <Check size={16} />
                </div>
              ) : (
                <div className="rounded-md border border-border p-0.5 bg-background">
                  <Square size={16} />
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <div className="mb-2">
                <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
                  {item.type?.toUpperCase()}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">{item.source}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{item.space}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {item.keywords.map((keyword, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 rounded-full bg-secondary/20 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Move size={14} className="text-muted-foreground" />
                <Select 
                  value={
                    spaces.find(s => {
                      const spaceName = s.name.toLowerCase();
                      if (item.space === 'Work' && spaceName.includes('work')) return true;
                      if (item.space === 'School' && spaceName.includes('school')) return true;
                      if (item.space === 'Team' && spaceName.includes('team')) return true;
                      if (item.space === 'Personal' && !spaceName.includes('work') && !spaceName.includes('school') && !spaceName.includes('team')) return true;
                      return false;
                    })?.id || 'overview'
                  } 
                  onValueChange={(value: string) => handleSpaceChange(item.id, value)}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border">
                    <SelectItem value="overview">Personal (No Space)</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.emoji ? `${space.emoji} ${space.name}` : space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <a href={item.url} className="text-sm text-blue-500 hover:underline truncate block">{item.url}</a>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default GridView;

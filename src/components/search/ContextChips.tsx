import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ContextItem {
  id: string;
  title: string;
  type: string;
  isPdf?: boolean;
  hasExtractedText?: boolean;
}

interface ContextChipsProps {
  items: ContextItem[];
  onRemoveItem: (itemId: string) => void;
  onBackToLibrary: (itemId: string) => void;
}

export const ContextChips: React.FC<ContextChipsProps> = ({
  items,
  onRemoveItem,
  onBackToLibrary
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Context Chips */}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex gap-2">
            {/* Main Item Chip */}
            <Badge 
              variant="outline" 
              className="flex items-center gap-2 pr-1 max-w-xs bg-background"
            >
              <span className="truncate font-medium">
                {item.title} • {item.type}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                onClick={() => onRemoveItem(item.id)}
                title="Remove context"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
            
            {/* PDF Context Chip (if PDF without extracted text) */}
            {item.isPdf && !item.hasExtractedText && (
              <Badge 
                variant="outline" 
                className="flex items-center gap-2 pr-1 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
              >
                <span className="text-orange-700 dark:text-orange-300 font-medium">
                  PDF context
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  onClick={() => onRemoveItem(item.id)}
                  title="Remove PDF context"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
          </div>
        ))}
      </div>
      
      {/* Back to Library Link */}
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 text-primary hover:text-primary/80 font-normal"
        onClick={() => onBackToLibrary(items[0].id)}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Library
      </Button>
    </div>
  );
};
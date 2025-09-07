import React from 'react';
import { Info, Upload, User, Settings, Palette, Share, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  chatTitle: string;
  contextItems?: Array<{
    id: string;
    title: string;
    type: string;
    isPdf?: boolean;
    hasExtractedText?: boolean;
  }>;
  onRemoveContext?: (itemId: string) => void;
  onToggleRightPane?: () => void;
  isRightPaneOpen?: boolean;
  onBackToLibrary?: (itemId: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatTitle,
  contextItems = [],
  onRemoveContext,
  onToggleRightPane,
  isRightPaneOpen = false,
  onBackToLibrary
}) => {
  return (
    <div className="border-b border-border/50">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          {/* App Launcher */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">A</span>
            </div>
            <span className="font-semibold text-sm">Ayra</span>
          </div>
          
          {/* Search Pill */}
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <Search className="w-3 h-3" />
            Search
          </Badge>
        </div>

        {/* Toolbar Icons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Upload className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <User className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Palette className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Share className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 w-8 p-0", isRightPaneOpen && "bg-muted")}
            onClick={onToggleRightPane}
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Title & Context */}
      <div className="px-6 pb-4">
        <h1 className="text-lg font-semibold mb-3">{chatTitle}</h1>
        
        {/* Context Chips */}
        {contextItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {contextItems.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1 pr-1 max-w-xs"
                  >
                    <span className="truncate">{item.title} • {item.type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => onRemoveContext?.(item.id)}
                    >
                      ×
                    </Button>
                  </Badge>
                  
                  {/* Extra PDF context chip if needed */}
                  {item.isPdf && !item.hasExtractedText && (
                    <Badge variant="outline" className="flex items-center gap-1 pr-1">
                      <span>PDF context</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => onRemoveContext?.(item.id)}
                      >
                        ×
                      </Button>
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {/* Back to Library Link */}
            {contextItems.length > 0 && (
              <button
                onClick={() => onBackToLibrary?.(contextItems[0].id)}
                className="text-sm text-primary hover:underline"
              >
                ← Back to Library
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
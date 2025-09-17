import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Download, 
  RefreshCw, 
  Square, 
  Share2,
  X,
  FileText,
  Link,
  Tag,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContextChip, StreamingState } from '@/types/chat';

interface ChatHeaderProps {
  activeTitle?: string;
  contextChips: ContextChip[];
  streamingState: StreamingState;
  onRemoveChip: (chipId: string) => void;
  onRegenerateResponse: () => void;
  onStopGeneration: () => void;
  onExport: () => void;
  onShare: () => void;
  className?: string;
}

export function ChatHeader({
  activeTitle,
  contextChips,
  streamingState,
  onRemoveChip,
  onRegenerateResponse,
  onStopGeneration,
  onExport,
  onShare,
  className
}: ChatHeaderProps) {
  const getChipIcon = (type: ContextChip['type']) => {
    switch (type) {
      case 'item':
        return <FileText size={12} />;
      case 'url':
        return <Link size={12} />;
      case 'pdf':
        return <FileText size={12} />;
      case 'space':
        return <FolderOpen size={12} />;
      case 'tag':
        return <Tag size={12} />;
      default:
        return <FileText size={12} />;
    }
  };

  const getChipColor = (type: ContextChip['type']) => {
    switch (type) {
      case 'item':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'url':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pdf':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'space':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'tag':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={cn("sticky top-0 z-10 bg-background border-b", className)}>
      <div className="flex items-center justify-between p-4">
        {/* Left side - Title and switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Search</h1>
            {activeTitle && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {activeTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {streamingState.isStreaming ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStopGeneration}
              className="gap-2"
            >
              <Square size={14} />
              Stop
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerateResponse}
              className="gap-2"
            >
              <RefreshCw size={14} />
              Regenerate
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
            <Download size={14} />
            Export
          </Button>
          
          <Button variant="outline" size="sm" onClick={onShare} className="gap-2">
            <Share2 size={14} />
            Share
          </Button>

          <Button variant="ghost" size="sm">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      {/* Context Chips */}
      {contextChips.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {contextChips.map(chip => (
              <Badge
                key={chip.id}
                variant="secondary"
                className={cn(
                  "flex items-center gap-2 py-1 px-2 text-xs border",
                  getChipColor(chip.type)
                )}
              >
                {getChipIcon(chip.type)}
                <span>{chip.label}</span>
                {chip.removable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onRemoveChip(chip.id)}
                  >
                    <X size={10} />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
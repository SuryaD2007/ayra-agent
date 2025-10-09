import React from 'react';
import { Search, MoreHorizontal, Download, RotateCcw, Square, Share, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextChip } from '@/types/chat';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ChatHeaderProps {
  contextChips: ContextChip[];
  onRemoveChip: (chipId: string) => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  isStreaming?: boolean;
  chatId?: string;
}

export function ChatHeader({
  contextChips,
  onRemoveChip,
  onRegenerate,
  onStop,
  onShare,
  onExport,
  isStreaming = false,
  chatId
}: ChatHeaderProps) {
  const { trackShareAction } = useAnalytics();

  const handleShare = async () => {
    try {
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'Ayra Chat',
          text: 'Check out my chat on Ayra',
          url: window.location.href,
        });
        if (chatId) trackShareAction('web_share', chatId);
        toast.success('Chat shared successfully!');
      } else {
        // Fallback to clipboard copy
        const shareUrl = window.location.href;
        await navigator.clipboard.writeText(shareUrl);
        if (chatId) trackShareAction('clipboard', chatId);
        toast.success('Chat link copied to clipboard!', {
          icon: <Check className="h-4 w-4" />,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share chat');
    }
  };
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Ayra branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Search size={16} className="text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Ayra</span>
          </div>
          <div className="text-muted-foreground">•</div>
          <span className="text-muted-foreground">Search</span>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {isStreaming && onStop && (
            <Button
              size="sm"
              variant="outline"
              onClick={onStop}
              className="gap-2"
            >
              <Square size={14} />
              Stop
            </Button>
          )}
          
          {!isStreaming && onRegenerate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRegenerate}
              className="gap-2"
            >
              <RotateCcw size={14} />
              Regenerate
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download size={14} className="mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleShare}>
                <Share size={14} className="mr-2" />
                Share Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Context Chips */}
      {contextChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {contextChips.map((chip) => (
            <Badge
              key={chip.id}
              variant="secondary"
              className="gap-2 pr-1"
            >
              <span className="text-xs">
                {chip.type === 'item' && '📄'}
                {chip.type === 'space' && '📁'}
                {chip.type === 'tag' && '🏷️'}
                {chip.type === 'url' && '🔗'}
                {chip.type === 'pdf' && '📋'}
              </span>
              <span className="truncate max-w-32">{chip.label}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 rounded-full hover:bg-background/50"
                onClick={() => onRemoveChip(chip.id)}
              >
                <X size={10} />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
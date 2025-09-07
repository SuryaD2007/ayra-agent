import React from 'react';
import { ExternalLink, Plus, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Source {
  id: string;
  title: string;
  domain: string;
  url: string;
  favicon?: string;
  messageId: string;
}

interface RightPaneProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  onAddToLibrary?: (source: Source) => void;
  onOpenPreview?: (source: Source) => void;
  className?: string;
}

export const RightPane: React.FC<RightPaneProps> = ({
  isOpen,
  onClose,
  sources,
  onAddToLibrary,
  onOpenPreview,
  className
}) => {
  if (!isOpen) return null;

  return (
    <div className={cn(
      "w-80 border-l border-border/50 bg-background flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Sources & Actions</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Sources Section */}
        <div>
          <h4 className="text-sm font-medium mb-3">Sources</h4>
          {sources.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No sources available. Sources will appear here when the AI references them in responses.
            </p>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {source.favicon && (
                      <img 
                        src={source.favicon} 
                        alt="" 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium leading-tight truncate">
                        {source.title}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {source.domain}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs flex-1"
                      onClick={() => onOpenPreview?.(source)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(source.url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Actions Section */}
        <div>
          <h4 className="text-sm font-medium mb-3">Actions</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => {
                // Handle add current conversation to library
                console.log('Add conversation to library');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Conversation to Library
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => {
                // Handle export conversation
                console.log('Export conversation');
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Export Conversation
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Sources:</span>
              <span>{sources.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Messages:</span>
              <span>{new Set(sources.map(s => s.messageId)).size}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
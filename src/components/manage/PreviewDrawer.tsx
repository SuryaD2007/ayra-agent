import React from 'react';
import { X, ExternalLink, Calendar, Tag, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { format } from 'date-fns';

interface PreviewItem {
  id: string;
  title: string;
  type: 'Note' | 'PDF' | 'Link' | 'Image';
  url: string;
  createdDate: string;
  source: string;
  keywords: string[];
  space: string;
  content?: string;
  description?: string;
  favicon?: string;
}

interface PreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PreviewItem | null;
}

const PreviewDrawer = ({ open, onOpenChange, item }: PreviewDrawerProps) => {
  if (!item) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Note':
        return '📝';
      case 'PDF':
        return '📄';
      case 'Link':
        return '🔗';
      case 'Image':
        return '🖼️';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Note':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PDF':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Link':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Image':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
                <Badge className={getTypeColor(item.type)}>
                  {item.type}
                </Badge>
              </div>
              <SheetTitle className="text-xl leading-tight pr-8">
                {item.title}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Added:</span>
              <span>{format(new Date(item.createdDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Space:</span>
              <Badge variant="outline">{item.space}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm col-span-2">
              <ExternalLink size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Source:</span>
              <span className="truncate">{item.source}</span>
            </div>
          </div>

          {/* Tags */}
          {item.keywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.keywords.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Description</h3>
              <p className="text-sm leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Content */}
          {item.content && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Content</h3>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {item.type === 'Link' && (
              <Button asChild>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink size={16} />
                  Open Link
                </a>
              </Button>
            )}
            {item.type === 'PDF' && (
              <Button asChild variant="outline">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink size={16} />
                  View PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PreviewDrawer;
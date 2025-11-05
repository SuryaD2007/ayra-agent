import React from 'react';
import { AyraItem } from '../ayra-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Link as LinkIcon, Image as ImageIcon, FileType } from 'lucide-react';

interface TimelineViewProps {
  items: AyraItem[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
}

const TimelineView = ({ items, selectedItems, onSelectItem }: TimelineViewProps) => {
  // Group items by date range
  const groupItemsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as AyraItem[],
      thisWeek: [] as AyraItem[],
      thisMonth: [] as AyraItem[],
      older: [] as AyraItem[]
    };

    items.forEach(item => {
      const itemDate = new Date(item.createdDate);
      if (itemDate >= today) {
        groups.today.push(item);
      } else if (itemDate >= weekAgo) {
        groups.thisWeek.push(item);
      } else if (itemDate >= monthAgo) {
        groups.thisMonth.push(item);
      } else {
        groups.older.push(item);
      }
    });

    return groups;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Note':
        return <FileText className="w-5 h-5" />;
      case 'PDF':
        return <FileType className="w-5 h-5" />;
      case 'Link':
        return <LinkIcon className="w-5 h-5" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Note':
        return 'text-primary';
      case 'PDF':
        return 'text-destructive';
      case 'Link':
        return 'text-accent-foreground';
      case 'Image':
        return 'text-secondary-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const renderTimelineGroup = (title: string, items: AyraItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-3 mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="text-xs">
              {items.length}
            </Badge>
          </h3>
        </div>

        <div className="space-y-4 relative pl-8">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

          {items.map((item, idx) => {
            const isSelected = selectedItems.includes(item.id);
            
            return (
              <div
                key={item.id}
                className="relative animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-5 top-6 w-3 h-3 rounded-full border-2 border-background ${
                    isSelected ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted'
                  }`}
                />

                <Card
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
                  onClick={() => onSelectItem(item.id)}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectItem(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className={`mt-0.5 ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-foreground truncate">
                          {item.title}
                        </h4>
                        <Badge variant="outline" className="shrink-0">
                          {item.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span>{new Date(item.createdDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                        <span>•</span>
                        <span>{item.source}</span>
                        <span>•</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.space}
                        </Badge>
                      </div>

                      {item.keywords.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {item.keywords.map(keyword => (
                            <Badge
                              key={keyword}
                              variant="secondary"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const groupedItems = groupItemsByDate();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {renderTimelineGroup('Today', groupedItems.today)}
        {renderTimelineGroup('This Week', groupedItems.thisWeek)}
        {renderTimelineGroup('This Month', groupedItems.thisMonth)}
        {renderTimelineGroup('Older', groupedItems.older)}

        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No items to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;

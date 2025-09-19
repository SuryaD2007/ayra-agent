import React, { useState, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  File, 
  Link, 
  Image as ImageIcon, 
  Edit2, 
  Eye,
  ExternalLink 
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AyraItem, columns } from '../ayra-data';
import { cn } from '@/lib/utils';

interface TableViewProps {
  items: AyraItem[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
  onUpdateItem?: (id: string, updates: Partial<AyraItem>) => void;
  virtualized?: boolean;
  selectedRowIndex?: number;
  onRowClick?: (item: AyraItem, index: number) => void;
  syncingItems?: Set<string>;
  spaces?: any[];
  onMoveItem?: (itemId: string, targetSpaceId: string | null) => void;
}

const TableView = ({ 
  items, 
  selectedItems = [], 
  onSelectItem = () => {},
  onUpdateItem = () => {},
  virtualized = false,
  selectedRowIndex = -1,
  onRowClick = () => {},
  syncingItems = new Set(),
  spaces = [],
  onMoveItem = () => {}
}: TableViewProps) => {
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [previewItem, setPreviewItem] = useState<AyraItem | null>(null);
  const [newTag, setNewTag] = useState<{ [key: string]: string }>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Sort items based on current sort configuration
  const sortedItems = useMemo(() => {
    if (!sortColumn) return items;
    
    return [...items].sort((a, b) => {
      let aVal = a[sortColumn as keyof AyraItem];
      let bVal = b[sortColumn as keyof AyraItem];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [items, sortColumn, sortDirection]);
  
  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5,
  });

  const getTypeIcon = (type: AyraItem['type']) => {
    switch (type) {
      case 'Note':
        return <FileText size={16} className="text-blue-500" />;
      case 'PDF':
        return <File size={16} className="text-red-500" />;
      case 'Link':
        return <Link size={16} className="text-green-500" />;
      case 'Image':
        return <ImageIcon size={16} className="text-purple-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const handleTitleEdit = (item: AyraItem) => {
    setEditingTitle(item.id);
    setTempTitle(item.title);
  };

  const handleTitleSave = (item: AyraItem) => {
    if (tempTitle.trim() && tempTitle !== item.title) {
      onUpdateItem(item.id, { title: tempTitle.trim() });
    }
    setEditingTitle(null);
    setTempTitle('');
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTempTitle('');
  };

  const handleAddTag = (itemId: string) => {
    const tagText = newTag[itemId]?.trim();
    if (tagText) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const updatedKeywords = [...item.keywords, tagText];
        onUpdateItem(itemId, { keywords: updatedKeywords });
      }
      setNewTag(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  const handleRemoveTag = (itemId: string, tagToRemove: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const updatedKeywords = item.keywords.filter(tag => tag !== tagToRemove);
      onUpdateItem(itemId, { keywords: updatedKeywords });
    }
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const getSourceDisplay = (source: string, type: AyraItem['type']) => {
    if (source === 'Upload') {
      return 'Upload';
    }
    // Extract domain from URL-like sources
    try {
      const url = new URL(`https://${source}`);
      return url.hostname;
    } catch {
      return source;
    }
  };

  // Render table row component
  const renderTableRow = (item: AyraItem, index: number, virtualRow?: any) => {
    const isSelected = selectedItems.includes(item.id);
    const isHighlighted = selectedRowIndex === index;
    
    return (
      <TableRow 
        key={item.id}
        className={cn(
          "hover:bg-muted/30 cursor-pointer",
          isSelected && "bg-primary/5",
          isHighlighted && "bg-muted/50"
        )}
        onClick={() => {
          onSelectItem(item.id);
          onRowClick(item, index);
        }}
        style={virtualRow ? {
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        } : undefined}
      >
        <TableCell className="w-12">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectItem(item.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
        
        <TableCell className="max-w-0 w-1/3">
          <div className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            {editingTitle === item.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave(item);
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                  onBlur={() => handleTitleSave(item)}
                  className="h-8 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="truncate font-medium">{item.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTitleEdit(item);
                  }}
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                >
                  <Edit2 size={12} />
                </Button>
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          <Badge variant="outline">
            {item.type}
          </Badge>
        </TableCell>

        <TableCell className="max-w-xs">
          <div className="flex flex-wrap gap-1">
            {item.keywords.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(item.id, tag);
                  }}
                  className="ml-1 text-xs opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </Badge>
            ))}
            <div className="flex items-center gap-1">
              <Input
                placeholder="Add tag..."
                value={newTag[item.id] || ''}
                onChange={(e) => setNewTag(prev => ({ ...prev, [item.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    handleAddTag(item.id);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-6 text-xs w-20"
              />
            </div>
          </div>
        </TableCell>

        <TableCell className="text-sm text-muted-foreground">
          {item.createdDate}
        </TableCell>

        <TableCell className="text-sm">
          {getSourceDisplay(item.source, item.type)}
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewItem(item);
              }}
              className="h-8 w-8 p-0"
            >
              <Eye size={14} />
            </Button>
            {item.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.url, '_blank');
                }}
                className="h-8 w-8 p-0"
              >
                <ExternalLink size={14} />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto" ref={parentRef}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              {columns.map((column) => (
                <TableHead key={column.id}>
                  <div className="flex items-center gap-2">
                    <span>{column.name}</span>
                    {column.sortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.id)}
                        className="h-6 w-6 p-0"
                      >
                        {sortColumn === column.id ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronUp size={14} className="opacity-30" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {virtualized ? (
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                  renderTableRow(sortedItems[virtualRow.index], virtualRow.index, virtualRow)
                ))}
              </div>
            ) : (
              sortedItems.map((item, index) => renderTableRow(item, index))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview Sheet */}
      <Sheet open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{previewItem?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              {previewItem?.description || 'No description available.'}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TableView;
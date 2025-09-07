import React, { useState, useMemo, useRef } from 'react';
import { ArrowUpDown, Check, Square, Edit2, FileText, File, Link, Image as ImageIcon, Plus, X, Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CortexItem, columns } from '../cortex-data';
import { cn } from '@/lib/utils';

interface TableViewProps {
  items: CortexItem[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
  onUpdateItem?: (id: string, updates: Partial<CortexItem>) => void;
  virtualized?: boolean;
  selectedRowIndex?: number;
  onRowClick?: (item: CortexItem, index: number) => void;
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
  const [previewItem, setPreviewItem] = useState<CortexItem | null>(null);
  const [newTag, setNewTag] = useState<{ [key: string]: string }>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Sort items based on current sort configuration
  const sortedItems = useMemo(() => {
    if (!sortColumn) return items;
    
    return [...items].sort((a, b) => {
      let aValue: string;
      let bValue: string;
      
      if (sortColumn === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else {
        return 0;
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortColumn, sortDirection]);
  
  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5,
  });

  const getTypeIcon = (type: CortexItem['type']) => {
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

  const handleTitleEdit = (id: string, title: string) => {
    setEditingTitle(id);
    setTempTitle(title);
  };

  const handleTitleSave = (id: string) => {
    if (tempTitle.trim()) {
      onUpdateItem(id, { title: tempTitle.trim() });
      setEditingTitle(null);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTempTitle('');
  };

  const handleSpaceChange = (itemId: string, newSpaceId: string) => {
    onMoveItem(itemId, newSpaceId === 'overview' ? null : newSpaceId);
  };

  const handleAddTag = (itemId: string) => {
    const tagValue = newTag[itemId];
    if (tagValue?.trim()) {
      const item = items.find(i => i.id === itemId);
      if (item && !item.keywords.includes(tagValue.trim())) {
        onUpdateItem(itemId, { 
          keywords: [...item.keywords, tagValue.trim()] 
        });
      }
      setNewTag({ ...newTag, [itemId]: '' });
    }
  };

  const handleRemoveTag = (itemId: string, tagToRemove: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      onUpdateItem(itemId, { 
        keywords: item.keywords.filter(tag => tag !== tagToRemove) 
      });
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

  const getSourceDisplay = (source: string, type: CortexItem['type']) => {
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
  const renderTableRow = (item: CortexItem, index: number, virtualRow?: any) => {
    const isSelected = selectedItems.includes(item.id);
    const isHighlighted = selectedRowIndex === index;
    
    return (
      <TableRow 
        key={item.id}
        className={cn(
          "hover:bg-muted/30 cursor-pointer",
          isSelected && "bg-primary/5",
          isHighlighted && "bg-accent/50 ring-2 ring-primary/20"
        )}
        onClick={() => onRowClick(item, index)}
        style={virtualRow ? {
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        } : undefined}
      >
        {/* Selection checkbox */}
        <TableCell className="w-10">
          <div 
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelectItem(item.id);
            }}
          >
            {isSelected ? (
              <div className="rounded-md bg-primary text-white p-0.5">
                <Check size={16} />
              </div>
            ) : (
              <div className="rounded-md border border-border p-0.5">
                <Square size={16} />
              </div>
            )}
          </div>
        </TableCell>

        {/* Title - Editable with Preview */}
        <TableCell className="font-medium">
          {editingTitle === item.id ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave(item.id);
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={() => handleTitleSave(item.id)} className="h-6 w-6">
                <Check size={14} className="text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleTitleCancel} className="h-6 w-6">
                <X size={14} className="text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <button
                className="text-left hover:text-primary cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewItem(item);
                }}
              >
                {item.title}
              </button>
              {syncingItems.has(item.id) && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-xs">Syncing...</span>
                </div>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTitleEdit(item.id, item.title);
                }}
              >
                <Edit2 size={12} />
              </Button>
            </div>
          )}
        </TableCell>

        {/* Type with Icon */}
        <TableCell>
          <div className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            <span className="text-sm">{item.type}</span>
          </div>
        </TableCell>

        {/* Tags - Chips with Add/Remove */}
        <TableCell>
          <div className="flex flex-wrap gap-1 items-center">
            {item.keywords.map((keyword, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/20 text-xs group"
              >
                <span>{keyword}</span>
                <button
                  onClick={() => handleRemoveTag(item.id, keyword)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <Input
                placeholder="Add tag"
                value={newTag[item.id] || ''}
                onChange={(e) => setNewTag({ ...newTag, [item.id]: e.target.value })}
                className="h-6 w-20 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag(item.id);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleAddTag(item.id)}
                className="h-6 w-6"
              >
                <Plus size={12} />
              </Button>
              {syncingItems.has(item.id) && (
                <Loader2 size={12} className="animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </TableCell>

        {/* Date Added */}
        <TableCell>{item.createdDate}</TableCell>

        {/* Source */}
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {getSourceDisplay(item.source, item.type)}
          </span>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      {virtualized ? (
        <div
          ref={parentRef}
          className="h-full overflow-auto"
          style={{ contain: 'strict' }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                {columns.map((column) => (
                  <TableHead key={column.id} className="py-2">
                    <div className="flex items-center">
                      {column.name}
                      {column.sortable && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-1 h-6 w-6 p-0"
                          onClick={() => handleSort(column.id)}
                        >
                          <ArrowUpDown size={14} />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = sortedItems[virtualRow.index];
                  return renderTableRow(item, virtualRow.index, virtualRow);
                })}
              </div>
            </TableBody>
          </Table>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              {columns.map((column) => (
                <TableHead key={column.id} className="py-2">
                  <div className="flex items-center">
                    {column.name}
                    {column.sortable && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 h-6 w-6 p-0"
                        onClick={() => handleSort(column.id)}
                      >
                        <ArrowUpDown size={14} />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item, index) => renderTableRow(item, index))}
          </TableBody>
        </Table>
      )}

      {/* Preview Drawer */}
      <Sheet open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{previewItem?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="flex items-center gap-2 mt-1">
                {previewItem && getTypeIcon(previewItem.type)}
                <span>{previewItem?.type}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Space</label>
              <p className="mt-1">{previewItem?.space}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Source</label>
              <p className="mt-1">{previewItem && getSourceDisplay(previewItem.source, previewItem.type)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tags</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {previewItem?.keywords.map((keyword, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 rounded-full bg-secondary/20 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date Added</label>
              <p className="mt-1">{previewItem?.createdDate}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">URL</label>
              <p className="mt-1 text-blue-500 hover:underline">
                <a href={previewItem?.url} target="_blank" rel="noopener noreferrer">
                  {previewItem?.url}
                </a>
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TableView;
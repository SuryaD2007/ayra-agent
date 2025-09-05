import React, { useState } from 'react';
import { ArrowUpDown, Check, Square, Edit2, FileText, File, Link, Image as ImageIcon, Plus, X } from 'lucide-react';
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
}

const TableView = ({ 
  items, 
  selectedItems = [], 
  onSelectItem = () => {} 
}: TableViewProps) => {
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [previewItem, setPreviewItem] = useState<CortexItem | null>(null);
  const [newTag, setNewTag] = useState<{ [key: string]: string }>({});

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
    // In a real app, this would update the item
    console.log('Updating title for item', id, 'to:', tempTitle);
    setEditingTitle(null);
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTempTitle('');
  };

  const handleSpaceChange = (itemId: string, newSpace: CortexItem['space']) => {
    // In a real app, this would update the item
    console.log('Updating space for item', itemId, 'to:', newSpace);
  };

  const handleAddTag = (itemId: string) => {
    const tagValue = newTag[itemId];
    if (tagValue?.trim()) {
      // In a real app, this would update the item's keywords array
      console.log('Adding tag', tagValue, 'to item', itemId);
      setNewTag({ ...newTag, [itemId]: '' });
    }
  };

  const handleRemoveTag = (itemId: string, tagToRemove: string) => {
    // In a real app, this would remove the tag from the item's keywords array
    console.log('Removing tag', tagToRemove, 'from item', itemId);
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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            {columns.map((column) => (
              <TableHead key={column.id} className="py-2">
                <div className="flex items-center">
                  {column.name}
                  {column.sortable && (
                    <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0">
                      <ArrowUpDown size={14} />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            
            return (
              <TableRow 
                key={item.id} 
                className={cn(
                  "hover:bg-muted/30",
                  isSelected && "bg-primary/5"
                )}
              >
                {/* Selection checkbox */}
                <TableCell className="w-10">
                  <div 
                    className="cursor-pointer"
                    onClick={() => onSelectItem(item.id)}
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
                        onClick={() => setPreviewItem(item)}
                      >
                        {item.title}
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => handleTitleEdit(item.id, item.title)}
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

                {/* Space - Editable Dropdown */}
                <TableCell>
                  <Select value={item.space} onValueChange={(value: CortexItem['space']) => handleSpaceChange(item.id, value)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="School">School</SelectItem>
                    </SelectContent>
                  </Select>
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
          })}
        </TableBody>
      </Table>

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
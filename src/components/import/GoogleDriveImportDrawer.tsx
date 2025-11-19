import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileIcon, RefreshCw, Search, FileText, Image as ImageIcon, File } from 'lucide-react';
import { format } from 'date-fns';

interface GoogleDriveItem {
  id: string;
  drive_id: string;
  name: string;
  mime_type: string | null;
  file_size: number | null;
  web_view_link: string | null;
  modified_time: string | null;
  thumbnail_link: string | null;
  synced_at: string;
}

interface GoogleDriveImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: () => void;
}

export const GoogleDriveImportDrawer = ({ open, onOpenChange, onImport }: GoogleDriveImportDrawerProps) => {
  const [items, setItems] = useState<GoogleDriveItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadItems();
    }
  }, [open]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('google_drive_items')
        .select('*')
        .order('modified_time', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error loading items:', error);
      toast({
        title: 'Failed to Load',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleImport = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one item to import.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const itemsToImport = items.filter(item => selectedItems.has(item.id));
      
      const newItems = itemsToImport.map(item => ({
        user_id: user.id,
        title: item.name,
        type: getMimeTypeCategory(item.mime_type),
        source: 'google_drive',
        content: item.web_view_link || '',
        mime_type: item.mime_type,
        size_bytes: item.file_size,
      }));

      const { error } = await supabase.from('items').insert(newItems);

      if (error) throw error;

      toast({
        title: 'Import Successful',
        description: `Imported ${selectedItems.size} items from Google Drive`,
      });

      setSelectedItems(new Set());
      onImport?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const getMimeTypeCategory = (mimeType: string | null): string => {
    if (!mimeType) return 'file';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('text')) return 'text';
    if (mimeType.includes('spreadsheet')) return 'text';
    if (mimeType.includes('presentation')) return 'text';
    return 'file';
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-5 w-5" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            Import from Google Drive
          </SheetTitle>
          <SheetDescription>
            Select files from your synced Google Drive to import into your library
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={loadItems} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedItems.size} of {filteredItems.length} selected
              </span>
            </div>
            <Button
              onClick={handleImport}
              disabled={selectedItems.size === 0 || importing}
              size="sm"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import Selected`
              )}
            </Button>
          </div>

          {/* Items List */}
          <ScrollArea className="h-[calc(100vh-300px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No files found</p>
                <p className="text-sm">
                  {items.length === 0
                    ? 'Sync your Google Drive to see files here'
                    : 'Try a different search query'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${
                      selectedItems.has(item.id) ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-shrink-0 mt-1">
                      {getFileIcon(item.mime_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{formatFileSize(item.file_size)}</span>
                        {item.modified_time && (
                          <>
                            <span>•</span>
                            <span>
                              Modified {format(new Date(item.modified_time), 'MMM d, yyyy')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {item.web_view_link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.web_view_link!, '_blank');
                        }}
                      >
                        Open
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

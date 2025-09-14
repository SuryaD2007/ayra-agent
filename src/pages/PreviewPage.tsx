import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, ExternalLinkIcon, ArrowLeft, Upload, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CortexItem } from '@/components/manage/cortex-data';
import { toast } from '@/hooks/use-toast';
import { EnhancedPdfViewer } from '@/components/manage/EnhancedPdfViewer';
import { restoreItem } from '@/lib/data';
import { itemToCortexItem } from '@/lib/itemUtils';
import { supabase } from '@/integrations/supabase/client';

const PreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [item, setItem] = useState<CortexItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        setNotFound(true);
        return;
      }

      try {
        // Fetch item from database by ID (including deleted items)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // If not authenticated, fall back to localStorage
          checkLocalStorage();
          return;
        }

        const { data: dbItem, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (!error && dbItem) {
          const cortexItem = itemToCortexItem(dbItem as any);
          setItem(cortexItem);
          setIsDeleted(!!dbItem.deleted_at);
          return;
        }

        // Fallback to localStorage for legacy items
        checkLocalStorage();
      } catch (error) {
        console.error('Error loading item:', error);
        checkLocalStorage();
      }
    };

    const checkLocalStorage = () => {
      try {
        // Check active items in localStorage
        const saved = localStorage.getItem('cortex-items');
        if (saved) {
          const items: CortexItem[] = JSON.parse(saved);
          const foundItem = items.find(item => item.id === id);
          if (foundItem) {
            setItem(foundItem);
            setIsDeleted(false);
            return;
          }
        }

        // Check recently deleted in localStorage
        const deletedItems = localStorage.getItem('recently-deleted-items');
        if (deletedItems) {
          const deleted: CortexItem[] = JSON.parse(deletedItems);
          const deletedItem = deleted.find(item => item.id === id);
          if (deletedItem) {
            setItem(deletedItem);
            setIsDeleted(true);
            return;
          }
        }

        setNotFound(true);
      } catch (error) {
        console.error('Error checking localStorage:', error);
        setNotFound(true);
      }
    };

    fetchItem();
  }, [id]);

  const handleOpenInNewTab = () => {
    if (item?.dataUrl) {
      const newWindow = window.open(item.dataUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to open PDFs in a new tab.",
          variant: "destructive",
        });
      }
    }
  };

  const isPdfTooLarge = (dataUrl: string) => {
    try {
      // Rough estimation: base64 is ~33% larger than binary data
      const sizeInBytes = (dataUrl.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      return sizeInMB > 25;
    } catch {
      return false;
    }
  };

  const canShowPdfPreview = (item: CortexItem) => {
    // For database items, check if file_path exists
    if (item.file_path) {
      return true;
    }
    // For legacy localStorage items, check dataUrl
    return item.dataUrl && !isPdfTooLarge(item.dataUrl);
  };

  const handleDownload = () => {
    if (item?.dataUrl) {
      const link = document.createElement('a');
      link.href = item.dataUrl;
      link.download = `${item.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRestoreItem = async () => {
    if (!item) return;
    
    try {
      await restoreItem(item.id);
      
      // Remove from localStorage deleted items
      const deletedItems = localStorage.getItem('recently-deleted-items');
      if (deletedItems) {
        const deleted: CortexItem[] = JSON.parse(deletedItems);
        const filtered = deleted.filter(i => i.id !== item.id);
        localStorage.setItem('recently-deleted-items', JSON.stringify(filtered));
      }
      
      setIsDeleted(false);
      toast({
        title: "Item restored",
        description: "The item has been restored to your library.",
      });
      
      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: "Error",
        description: "Failed to restore the item. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold mb-2">Item Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The item you're looking for doesn't exist or may have been removed.
            </p>
            <Button asChild>
              <Link to="/manage" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to Library
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Deleted Item Banner */}
      {isDeleted && (
        <Alert className="mx-4 mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              This item was deleted
            </span>
            <Button size="sm" variant="outline" onClick={handleRestoreItem}>
              <RotateCcw size={14} className="mr-1" />
              Restore
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/manage" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Library
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon(item.type)}</span>
            <Badge className={getTypeColor(item.type)}>
              {item.type}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
        </div>

        {/* PDF Viewer */}
        {item.type === 'PDF' && (
          <div className="space-y-4">
            {canShowPdfPreview(item) ? (
              <>
                {/* PDF Toolbar */}
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1"
                  >
                    <ExternalLinkIcon size={14} />
                    Open in New Tab
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleDownload}
                    className="flex items-center gap-1"
                  >
                    <Download size={14} />
                    Download
                  </Button>
                  <div className="flex-1" />
                  <Button size="sm" variant="ghost" className="flex items-center gap-1">
                    <ChevronLeft size={14} />
                    Prev
                  </Button>
                  <Button size="sm" variant="ghost" className="flex items-center gap-1">
                    Next
                    <ChevronRight size={14} />
                  </Button>
                </div>

                {/* PDF Viewer */}
                <EnhancedPdfViewer 
                  filePath={item.file_path || null}
                  title={item.title}
                  className="h-[80vh] w-full"
                />
              </>
            ) : (
              /* Preview Unavailable */
              <div className="border rounded-md p-8 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Preview unavailable</h3>
                <p className="text-muted-foreground mb-6">
                  {!item.dataUrl && !item.file_path
                    ? "No PDF data available for preview."
                    : "PDF is too large to preview (>25MB)."}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {(item.dataUrl || item.file_path) && (
                    <Button onClick={handleDownload} variant="outline">
                      <Download size={16} className="mr-2" />
                      Download
                    </Button>
                  )}
                  <Button variant="outline">
                    <Upload size={16} className="mr-2" />
                    Re-upload
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content for other types */}
        {item.type !== 'PDF' && (
          <div className="max-w-4xl">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {item.content && (
                <div dangerouslySetInnerHTML={{ __html: item.content }} />
              )}
              {item.description && (
                <p>{item.description}</p>
              )}
              {item.type === 'Link' && (
                <div className="mt-6">
                  <Button asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <ExternalLinkIcon size={16} />
                      Open Link
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPage;
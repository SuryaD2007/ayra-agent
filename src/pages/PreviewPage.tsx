import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, ExternalLinkIcon, ArrowLeft, Upload, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AyraItem } from '@/components/manage/ayra-data';
import { toast } from '@/hooks/use-toast';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { restoreItem } from '@/lib/data';
import { itemToAyraItem } from '@/lib/itemUtils';
import { supabase } from '@/integrations/supabase/client';

const PreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [item, setItem] = useState<CortexItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Always call useSignedUrl hook (fixes hook ordering issue)
  const { url: pdfUrl, loading: isPdfLoading, error: pdfUrlError, refresh: refreshPdfUrl } = useSignedUrl(
    item?.type === 'PDF' && item?.file_path ? item.file_path : null,
    3600
  );

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

        // Try to fetch both active and deleted items
        const { data: dbItem, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (dbItem) {
          const cortexItem = itemToCortexItem(dbItem as any);
          setItem(cortexItem);
          setIsDeleted(!!dbItem.deleted_at);
          return;
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error loading item:', error);
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


  const handleDownloadCurrent = () => {
    if (pdfUrl && item) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${item.title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (item?.dataUrl) {
      // Fallback for legacy items
      const link = document.createElement('a');
      link.href = item.dataUrl;
      link.download = `${item.title || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFrameError = async () => {
    console.error('PDF iframe failed to load, attempting refresh...');
    try {
      await refreshPdfUrl();
    } catch (error) {
      console.error('Failed to refresh PDF URL:', error);
      toast({
        title: "Couldn't load PDF preview",
        description: "Try again or download the file.",
        variant: "destructive",
      });
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
          <div className="rounded-md border bg-card">
            <div className="flex items-center justify-between p-2 gap-2">
              <div className="text-sm text-muted-foreground">
                  'PDF Document'
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
                  disabled={!pdfUrl || isPdfLoading}
                >
                  <ExternalLinkIcon className="w-4 h-4 mr-1" />
                  Open in New Tab
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadCurrent}
                  disabled={!pdfUrl && !item.dataUrl}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            
            {item.file_path ? (
              <>
                {pdfUrl ? (
                  <iframe 
                    key={pdfUrl}
                    src={pdfUrl} 
                    className="w-full h-[70vh] rounded-b-md border-0" 
                    onError={handleFrameError}
                    title={`PDF Preview: ${item.title}`}
                  />
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Generating secure preview…
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Preview unavailable</h3>
                <p className="text-muted-foreground mb-4">
                  No PDF file available for preview.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-1" />
                    Re-upload
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/manage">
                      Back to Library
                    </Link>
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
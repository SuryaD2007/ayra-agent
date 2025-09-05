import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ChevronLeft, ChevronRight, ExternalLinkIcon, ArrowLeft, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CortexItem } from '@/components/manage/cortex-data';
import { toast } from '@/hooks/use-toast';

const PreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<CortexItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }

    try {
      const saved = localStorage.getItem('cortex-items');
      const items: CortexItem[] = saved ? JSON.parse(saved) : [];
      const foundItem = items.find(item => item.id === id);
      
      if (foundItem) {
        setItem(foundItem);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
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
                <div className="border rounded-md overflow-hidden bg-white">
                  {!pdfError ? (
                    <iframe 
                      src={item.dataUrl} 
                      className="h-[80vh] w-full"
                      onError={() => setPdfError(true)}
                      title={`PDF: ${item.title}`}
                    />
                  ) : (
                    <embed 
                      src={item.dataUrl} 
                      type="application/pdf" 
                      className="h-[80vh] w-full"
                      title={`PDF: ${item.title}`}
                    />
                  )}
                </div>
              </>
            ) : (
              /* Preview Unavailable */
              <div className="border rounded-md p-8 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Preview unavailable</h3>
                <p className="text-muted-foreground mb-6">
                  {!item.dataUrl 
                    ? "No PDF data available for preview."
                    : "PDF is too large to preview (>25MB)."}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {item.dataUrl && (
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
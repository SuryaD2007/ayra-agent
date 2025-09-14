import { useState, useRef, useCallback } from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface EnhancedPdfViewerProps {
  filePath: string | null;
  title: string;
  className?: string;
}

export function EnhancedPdfViewer({ filePath, title, className = "h-[70vh] w-full" }: EnhancedPdfViewerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { url, loading, error, refresh } = useSignedUrl(filePath, 3600);

  const handleIframeError = useCallback(async () => {
    console.log('PDF iframe error detected, attempting to refresh URL');
    setIframeError(true);
    
    try {
      await refresh();
      setIframeError(false);
      setRetryCount(prev => prev + 1);
      
      // Force iframe reload by updating src
      if (iframeRef.current && url) {
        iframeRef.current.src = url;
      }
    } catch (err) {
      console.error('Failed to refresh PDF URL after iframe error:', err);
    }
  }, [refresh, url]);

  const handleManualRefresh = async () => {
    setIframeError(false);
    await refresh();
  };

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-32 bg-muted/30 rounded-md">
        <p className="text-muted-foreground">No PDF file available</p>
      </div>
    );
  }

  if (loading && !url) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className={className} />
      </div>
    );
  }

  if (error || (!url && !loading)) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-muted/30 rounded-md space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground text-center">
          {error || 'Failed to load PDF'}
        </p>
        <Button size="sm" variant="outline" onClick={handleManualRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (iframeError) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-muted/30 rounded-md space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground text-center">
          PDF preview temporarily unavailable
        </p>
        <Button size="sm" variant="outline" onClick={handleManualRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <iframe
        ref={iframeRef}
        src={url || ''}
        className={className}
        onError={handleIframeError}
        title={`PDF: ${title}`}
        onLoad={() => setIframeError(false)}
      />
      {retryCount > 0 && (
        <div className="px-3 py-2 bg-muted/30 text-xs text-muted-foreground">
          Auto-refreshed {retryCount} time{retryCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { X, ExternalLink, Calendar, Tag, MapPin, Download, ChevronLeft, ChevronRight, ExternalLinkIcon } from 'lucide-react';
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
  dataUrl?: string; // For PDF base64 data
}

interface PreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PreviewItem | null;
}

const PreviewDrawer = ({ open, onOpenChange, item }: PreviewDrawerProps) => {
  const [pdfError, setPdfError] = useState(false);

  if (!item) return null;

  const handleOpenInNewTab = () => {
    if (item.dataUrl) {
      window.open(item.dataUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (item.dataUrl) {
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

          {/* PDF Viewer */}
          {item.type === 'PDF' && item.dataUrl && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">PDF Preview</h3>
              
              {/* PDF Toolbar */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-muted/30 rounded-md">
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
              <div className="border rounded-md overflow-hidden">
                {!pdfError ? (
                  <iframe 
                    src={item.dataUrl} 
                    className="h-[70vh] w-full"
                    onError={() => setPdfError(true)}
                    title={`PDF: ${item.title}`}
                  />
                ) : (
                  <embed 
                    src={item.dataUrl} 
                    type="application/pdf" 
                    className="h-[70vh] w-full"
                    title={`PDF: ${item.title}`}
                  />
                )}
              </div>
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
            {item.type === 'PDF' && !item.dataUrl && (
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
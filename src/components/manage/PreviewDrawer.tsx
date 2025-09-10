import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Calendar, Tag, MapPin, Download, ChevronLeft, ChevronRight, 
  ExternalLinkIcon, Upload, AlertTriangle, MessageCircle, Trash2, Edit3, 
  Check, X as XIcon, Plus, FileText, Link as LinkIcon, Image as ImageIcon,
  ArrowLeft, Clock, HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { EnhancedPdfViewer } from './EnhancedPdfViewer';

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
  file_path?: string; // For Supabase storage path
}

interface PreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PreviewItem | null;
  onDelete?: (item: PreviewItem) => void;
}

const PreviewDrawer = ({ open, onOpenChange, item, onDelete }: PreviewDrawerProps) => {
  const [pdfError, setPdfError] = useState(false);
  const [libraryTitle, setLibraryTitle] = useState('Cortex Library');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingSpace, setIsEditingSpace] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Listen for library title changes
  useEffect(() => {
    const handleTitleChange = (event: CustomEvent) => {
      setLibraryTitle(event.detail.title);
    };

    // Load initial title
    try {
      const savedTitle = localStorage.getItem('cortex-library-title');
      if (savedTitle) {
        setLibraryTitle(savedTitle);
      }
    } catch (error) {
      console.error('Error loading library title:', error);
    }

    window.addEventListener('libraryTitleChanged', handleTitleChange as EventListener);
    return () => {
      window.removeEventListener('libraryTitleChanged', handleTitleChange as EventListener);
    };
  }, []);

  // Initialize edited title when item changes
  useEffect(() => {
    if (item) {
      setEditedTitle(item.title);
    }
  }, [item]);

  if (!item) return null;

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setEditedTitle(item.title);
  };

  const handleSaveTitle = () => {
    // Here you would typically call an API to update the title
    console.log('Save title:', editedTitle);
    setIsEditingTitle(false);
    toast({
      title: "Title updated",
      description: "Item title has been saved successfully."
    });
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle(item.title);
  };

  const handleSpaceChange = (spaceId: string) => {
    // Here you would typically call an API to update the space
    console.log('Change space to:', spaceId);
    toast({
      title: "Space updated",
      description: "Item moved to new space successfully."
    });
  };

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      // Here you would typically call an API to add the tag
      console.log('Add tag:', newTagInput);
      setNewTagInput('');
      setIsAddingTag(false);
      toast({
        title: "Tag added",
        description: "New tag has been added successfully."
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    // Here you would typically call an API to remove the tag
    console.log('Remove tag:', tagToRemove);
    toast({
      title: "Tag removed",
      description: "Tag has been removed successfully."
    });
  };

  const handleOpenInNewTab = () => {
    if (item.dataUrl) {
      window.open(item.dataUrl, '_blank');
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

  const canShowPdfPreview = (item: PreviewItem) => {
    return item.dataUrl && !isPdfTooLarge(item.dataUrl);
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
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'Link':
        return <LinkIcon className="w-5 h-5 text-green-500" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Note':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'PDF':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      case 'Link':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
      case 'Image':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-[700px] overflow-y-auto p-0">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b p-6">
          <div className="flex items-start justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
          </div>

          <Card className="bg-background/80 backdrop-blur-sm border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {getTypeIcon(item.type)}
                  <div className="flex-1">
                    <Badge variant="outline" className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                    
                    {/* Inline Editable Title */}
                    <div className="mt-2">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="text-xl font-semibold"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEditTitle}>
                            <XIcon className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <h2 className="text-xl font-semibold leading-tight">{item.title}</h2>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={handleStartEditTitle}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button asChild>
                    <Link to={`/search?itemId=${item.id}`} className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Open in Chat
                    </Link>
                  </Button>
                  {onDelete && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {/* Space and Tags Row */}
              <div className="mt-4 space-y-3">
                {/* Space Selector */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Space:</span>
                  <Select value={item.space} onValueChange={handleSpaceChange}>
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="School">School</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tags:</span>
                  {item.keywords.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="rounded-full pl-3 pr-1 flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-4 h-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <XIcon className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                  
                  {/* Add Tag */}
                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Tag name"
                        className="w-24 h-6 text-xs"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={handleAddTag} className="w-4 h-4 p-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => setIsAddingTag(false)} 
                        className="w-4 h-4 p-0"
                      >
                        <XIcon className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingTag(true)}
                      className="rounded-full h-6 px-2 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Tag
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Metadata Pills */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-background/60 rounded-full px-3 py-1 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {format(new Date(item.createdDate), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-2 bg-background/60 rounded-full px-3 py-1 text-sm">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              {item.source}
            </div>
            {item.type === 'PDF' && (
              <div className="flex items-center gap-2 bg-background/60 rounded-full px-3 py-1 text-sm">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                Size info
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">

          {/* Content based on type */}
          {item.type === 'PDF' && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                  PDF Preview
                </h3>
                
                {canShowPdfPreview(item) ? (
                  <div className="space-y-4">
                    {/* PDF Toolbar */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleOpenInNewTab}
                        className="flex items-center gap-2"
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                        Open in New Tab
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleDownload}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <div className="flex-1" />
                      <div className="text-sm text-muted-foreground">Page 1</div>
                    </div>

                    {/* PDF Viewer */}
                    <div className="rounded-xl overflow-hidden border">
                      <EnhancedPdfViewer 
                        filePath={item.file_path || null}
                        title={item.title}
                        className="h-[60vh] w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h4 className="text-lg font-semibold mb-2">Preview unavailable</h4>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {!item.dataUrl 
                        ? "No PDF data available for preview."
                        : "This PDF is too large to preview (over 25MB)."}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {item.dataUrl && (
                        <Button onClick={handleDownload} variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                      <Button variant="outline" asChild>
                        <Link to={`/preview/${item.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Full Viewer
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Note Content */}
          {item.content && item.type === 'Note' && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                  Content
                </h3>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </CardContent>
            </Card>
          )}

          {/* Link Preview */}
          {item.type === 'Link' && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                  Link Preview
                </h3>
                <div className="border rounded-xl p-6 bg-muted/30">
                  <div className="flex items-start gap-4">
                    {item.favicon && (
                      <img src={item.favicon} alt="" className="w-8 h-8 rounded" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      )}
                      <Button asChild>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Link
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Preview */}
          {item.type === 'Image' && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                  Image Preview
                </h3>
                <div className="rounded-xl overflow-hidden border">
                  <img 
                    src={item.url} 
                    alt={item.title}
                    className="w-full h-auto max-h-96 object-contain bg-muted/30"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Content State */}
          {!item.content && !item.description && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No content available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PreviewDrawer;
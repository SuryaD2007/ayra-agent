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
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { updateItem, upsertTag, setItemTags, getSpaces } from '@/lib/data';

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
  const [spaces, setSpaces] = useState<any[]>([]);
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  // MUST call all hooks before any early returns or conditional logic
  const { url: pdfUrl, loading: isPdfLoading, error: pdfUrlError, refresh: refreshPdfUrl } = useSignedUrl(
    item?.type === 'PDF' && item?.file_path ? item.file_path : null,
    3600
  );

  // Load spaces
  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const spacesData = await getSpaces();
        setSpaces(spacesData);
      } catch (error) {
        console.error('Error loading spaces:', error);
      }
    };
    loadSpaces();
  }, []);

  // Initialize tags when item changes
  useEffect(() => {
    if (item) {
      setCurrentTags(item.keywords || []);
    }
  }, [item]);

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

  // NOW it's safe to have conditional logic and early returns
  if (!item) return null;

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setEditedTitle(item.title);
  };

  const handleSaveTitle = async () => {
    if (!item || !editedTitle.trim()) return;
    
    try {
      await updateItem(item.id, { title: editedTitle.trim() });
      item.title = editedTitle.trim(); // Update local state
      setIsEditingTitle(false);
      toast({
        title: "Title updated",
        description: "Item title has been saved successfully."
      });
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Error",
        description: "Failed to update title. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle(item.title);
  };

  const handleSpaceChange = async (spaceId: string) => {
    if (!item) return;
    
    try {
      await updateItem(item.id, { space_id: spaceId });
      const space = spaces.find(s => s.id === spaceId);
      if (space) {
        item.space = space.name;
      }
      toast({
        title: "Space updated",
        description: "Item moved to new space successfully."
      });
    } catch (error) {
      console.error('Error updating space:', error);
      toast({
        title: "Error",
        description: "Failed to move item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddTag = async () => {
    if (!newTagInput.trim() || !item) return;
    
    try {
      // Upsert tag (creates if doesn't exist)
      await upsertTag(newTagInput.trim());
      
      // Add to current tags
      const updatedTags = [...currentTags, newTagInput.trim()];
      setCurrentTags(updatedTags);
      
      // Update item tags
      await setItemTags(item.id, updatedTags);
      
      // Update local item
      item.keywords = updatedTags;
      
      setNewTagInput('');
      setIsAddingTag(false);
      toast({
        title: "Tag added",
        description: "New tag has been added successfully."
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: "Failed to add tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!item) return;
    
    try {
      // Remove from current tags
      const updatedTags = currentTags.filter(t => t !== tagToRemove);
      setCurrentTags(updatedTags);
      
      // Update item tags
      await setItemTags(item.id, updatedTags);
      
      // Update local item
      item.keywords = updatedTags;
      
      toast({
        title: "Tag removed",
        description: "Tag has been removed successfully."
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Error",
        description: "Failed to remove tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleOpenInNewTab = () => {
    if (item.dataUrl) {
      window.open(item.dataUrl, '_blank');
    }
  };

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
                  <Select 
                    value={spaces.find(s => s.name === item.space)?.id || ''} 
                    onValueChange={handleSpaceChange}
                  >
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue placeholder="Select space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.emoji} {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tags:</span>
                  {currentTags.map((tag) => (
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
            {item.type === 'PDF' && item.file_path && (
              <div className="flex items-center gap-2 bg-background/60 rounded-full px-3 py-1 text-sm">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                PDF File
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">

          {/* Content based on type */}
          {item.type === 'PDF' && (
            <div className="rounded-md border bg-card">
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  PDF Document
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
                  {isPdfLoading ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Generating secure preview…
                    </div>
                  ) : pdfUrl ? (
                    <iframe 
                      src={pdfUrl} 
                      className="w-full h-[70vh] rounded-b-md border-0" 
                      onError={handleFrameError}
                      title={`PDF Preview: ${item.title}`}
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h4 className="text-lg font-semibold mb-2">Preview unavailable</h4>
                      <p className="text-muted-foreground mb-4">
                        Could not load PDF preview. Try refreshing or download the file.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Button onClick={refreshPdfUrl} variant="outline" size="sm">
                          Try Again
                        </Button>
                        <Button onClick={handleDownloadCurrent} variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center">
                  <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h4 className="text-lg font-semibold mb-2">Preview unavailable</h4>
                  <p className="text-muted-foreground mb-4">
                    No PDF file available for preview.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm">
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
import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, FileText, X, Globe } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { AuthError, FileUploadError, createItem } from '@/lib/data';

interface NewItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemCreated: (item: any) => void;
  preselectedSpace?: string | null;
}

interface FormData {
  title: string;
  space: string;
  tags: string[];
  content?: string;
  url?: string;
  description?: string;
  favicon?: string;
  file?: File;
  pdfDataUrl?: string;
  metadataFailed?: boolean;
}

const NewItemModal = ({ open, onOpenChange, onItemCreated, preselectedSpace }: NewItemModalProps) => {
  // Load last used tab from localStorage, default to 'note'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('new-item-modal-last-tab') || 'note';
    } catch {
      return 'note';
    }
  });
  const [formData, setFormData] = useState<FormData>({
    title: '',
    space: 'Personal',
    tags: [],
    metadataFailed: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [customSpaces, setCustomSpaces] = useState<any[]>([]);

  // Load custom spaces from Supabase and handle preselected space
  useEffect(() => {
    const loadSpaces = async () => {
      try {
        // Load spaces from database
        const { getSpaces } = await import('@/lib/data');
        const dbSpaces = await getSpaces();
        setCustomSpaces(dbSpaces);
      } catch (error) {
        console.error('Error loading spaces:', error);
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('custom-spaces');
          if (saved) {
            setCustomSpaces(JSON.parse(saved));
          }
        } catch (e) {
          console.error('Error loading custom spaces:', e);
        }
      }
    };

    loadSpaces();

    // Set preselected space if provided
    if (preselectedSpace) {
      setFormData(prev => ({ ...prev, space: preselectedSpace }));
    }
  }, [preselectedSpace]);

  // Persist tab selection to localStorage
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('new-item-modal-last-tab', tab);
    } catch (error) {
      console.error('Error saving tab to localStorage:', error);
    }
  };

  // Rich text editor for notes
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[160px] p-0',
      },
    },
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // Dropzone for PDF uploads with enhanced validation
  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 25 * 1024 * 1024, // 25MB hard cap
    maxFiles: 1,
    onDrop: async (files) => {
      if (files.length > 0) {
        const file = files[0];
        
        // Validate file size explicitly
        if (file.size > 25 * 1024 * 1024) {
          setErrors(prev => ({ 
            ...prev, 
            file: 'PDF file must be smaller than 25MB. Please compress your file or split it into smaller parts.' 
          }));
          return;
        }

        try {
          // Convert to base64 for preview storage
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setFormData(prev => ({
              ...prev,
              file,
              pdfDataUrl: dataUrl,
              title: prev.title || file.name.replace('.pdf', ''),
            }));
          };
          reader.readAsDataURL(file);
          
          setErrors(prev => ({ ...prev, file: '' }));
        } catch (error) {
          setErrors(prev => ({ 
            ...prev, 
            file: 'Failed to process PDF file. Please try again.' 
          }));
        }
      }
    },
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setErrors(prev => ({ 
          ...prev, 
          file: 'PDF file exceeds 25MB limit. Please compress your file or use a smaller PDF.' 
        }));
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setErrors(prev => ({ 
          ...prev, 
          file: 'Only PDF files are accepted. Please select a valid PDF file.' 
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          file: 'Invalid file. Please ensure your PDF is under 25MB and not corrupted.' 
        }));
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (activeTab === 'pdf' && !formData.file) {
      newErrors.file = 'PDF file is required';
    }

    if (activeTab === 'link' && !formData.url?.trim()) {
      newErrors.url = 'URL is required';
    } else if (activeTab === 'link' && formData.url) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.url)) {
        newErrors.url = 'Please enter a valid URL starting with http:// or https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check form validity without side effects
  const isFormValid = () => {
    if (!formData.title.trim()) return false;
    if (activeTab === 'pdf' && !formData.file) return false;
    if (activeTab === 'link' && !formData.url?.trim()) return false;
    if (activeTab === 'link' && formData.url) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.url)) return false;
    }
    return true;
  };

  const fetchMetadata = async (url: string) => {
    setIsFetchingMetadata(true);
    
    // Create AbortController for 3-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      // Simulate API call with timeout
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500)), // 0.5-2.5s random delay
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Request timeout'));
          });
        })
      ]);
      
      clearTimeout(timeoutId);
      
      // Mock successful metadata fetch
      const domain = new URL(url).hostname;
      const mockMetadata = {
        title: `Page Title from ${domain}`,
        description: 'This is a sample description fetched from the webpage.',
        favicon: '/placeholder.svg',
      };

      setFormData(prev => ({
        ...prev,
        title: mockMetadata.title,
        description: mockMetadata.description,
        favicon: mockMetadata.favicon,
        metadataFailed: false,
      }));
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Fallback: create item with basic info and metadata failed flag
      const domain = new URL(url).hostname;
      setFormData(prev => ({
        ...prev,
        title: url,
        description: '',
        favicon: '',
        metadataFailed: true,
      }));
      
      toast({
        title: 'Metadata fetch timed out',
        description: `Created item with URL as title. You can edit the title manually.`,
        variant: 'default',
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ 
      ...prev, 
      url, 
      metadataFailed: false,  // Reset flag when URL changes
      title: '',              // Clear title when URL changes
      description: '',
      favicon: ''
    }));
    
    if (url && /^https?:\/\/.+/.test(url)) {
      fetchMetadata(url);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Determine the space_id based on the selected space
      let spaceId: string | undefined = undefined;
      
      if (preselectedSpace) {
        // Use the preselected space ID directly (it's now a real UUID from database)
        if (preselectedSpace !== 'overview') {
          spaceId = preselectedSpace;
        }
      } else if (formData.space !== 'Personal') {
        // Use the selected space ID directly (it's now a real UUID from database)
        spaceId = formData.space;
      }

      const payload = {
        title: formData.title,
        type: activeTab as 'note' | 'pdf' | 'link' | 'image',
        content: activeTab === 'note' ? editor?.getHTML() || '' : formData.content,
        source: activeTab === 'link' ? formData.url : 'Upload',
        space_id: spaceId,
        file: activeTab === 'pdf' ? formData.file : undefined
      };

      // Create the item using our data layer
      const createdItem = await createItem(payload);
      
      // Convert to CortexItem format for compatibility
      const newItem = {
        id: createdItem.id,
        title: createdItem.title,
        type: createdItem.type.charAt(0).toUpperCase() + createdItem.type.slice(1).toLowerCase() as 'Note' | 'PDF' | 'Link' | 'Image',
        url: createdItem.file_path || `/preview/${createdItem.id}`,
        createdDate: new Date(createdItem.created_at).toISOString().split('T')[0],
        source: createdItem.source || 'Upload',
        keywords: formData.tags,
        space: formData.space,
        content: createdItem.content,
        description: createdItem.content?.substring(0, 150),
      };

      onItemCreated(newItem);
      
      toast({
        title: 'Item created successfully',
        description: `${formData.title} has been added to your library.`,
      });

      // Reset form
      setFormData({
        title: '',
        space: 'Personal',
        tags: [],
        metadataFailed: false,
      });
      setTagInput('');
      editor?.commands.clearContent();
      setErrors({});
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating item:', error);
      
      if (error instanceof FileUploadError) {
        toast({
          title: "File upload failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (error instanceof AuthError) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create items.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error creating item",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = isFormValid();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="note" className="flex items-center gap-2">
              <FileText size={16} />
              Note
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <Upload size={16} />
              PDF
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <LinkIcon size={16} />
              Link
            </TabsTrigger>
          </TabsList>

          {/* Note Tab */}
          <TabsContent value="note" className="space-y-4">
            <div>
              <Label htmlFor="note-title">Title *</Label>
              <Input
                id="note-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter note title..."
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>
            
            <div>
              <Label>Content</Label>
              <div 
                className="border rounded-md p-3 min-h-[200px] prose prose-sm max-w-none cursor-text"
                onClick={() => editor?.commands.focus()}
              >
                <EditorContent editor={editor} />
                {(!editor?.getHTML() || editor?.getHTML() === '<p></p>') && (
                  <p className="text-muted-foreground pointer-events-none absolute mt-0">
                    Click here to start writing your note...
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* PDF Tab */}
          <TabsContent value="pdf" className="space-y-4">
            <div>
              <Label>Upload PDF * (Max 25MB)</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                } ${errors.file ? 'border-destructive bg-destructive/5' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {formData.file ? (
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-2">✓ {formData.file.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB of 25MB limit
                    </p>
                    {formData.pdfDataUrl ? (
                      <div className="mt-4 p-2 bg-muted/30 rounded border">
                        <p className="text-xs text-green-600 mb-2">✓ Preview ready</p>
                        <iframe 
                          src={formData.pdfDataUrl}
                          className="w-full h-32 border rounded"
                          title="PDF Preview"
                        />
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">⚠️ Preview unavailable</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                          File too large or couldn't generate preview
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const url = URL.createObjectURL(formData.file!);
                              window.open(url, '_blank');
                            }}
                          >
                            Download & View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ 
                                ...prev, 
                                file: undefined, 
                                pdfDataUrl: undefined,
                                title: ''
                              }));
                            }}
                          >
                            Re-upload
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file here'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">or click to select</p>
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-1 inline-block">
                      Maximum file size: 25MB
                    </div>
                  </div>
                )}
              </div>
              {errors.file && (
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-sm text-destructive font-medium">❌ {errors.file}</p>
                  <div className="text-xs text-destructive/70 mt-1">
                    <p>• PDF files only</p>
                    <p>• Maximum size: 25MB</p>
                    <p>• Try compressing your PDF online</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="pdf-title">Title *</Label>
              <Input
                id="pdf-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Auto-filled from filename..."
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
            </div>
          </TabsContent>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div>
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                type="url"
                value={formData.url || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com"
                className={errors.url ? 'border-destructive' : ''}
              />
              {errors.url && <p className="text-sm text-destructive mt-1">{errors.url}</p>}
              {isFetchingMetadata && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Globe size={14} className="animate-spin" />
                  Fetching metadata...
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="link-title">Title *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="link-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Auto-filled from webpage..."
                  className={errors.title ? 'border-destructive' : ''}
                />
                {formData.metadataFailed && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 text-xs px-2 py-1 whitespace-nowrap">
                    Metadata failed
                  </Badge>
                )}
              </div>
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
              {formData.metadataFailed && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Metadata fetch timed out. Please edit the title manually.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="link-description">Description</Label>
              <Textarea
                id="link-description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Auto-filled from webpage..."
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Common Fields */}
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label htmlFor="space">Space</Label>
            <Select value={formData.space} onValueChange={(value) => setFormData(prev => ({ ...prev, space: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="School">School</SelectItem>
                <SelectItem value="Team">Team</SelectItem>
                {customSpaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.emoji} {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X size={12} className="cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewItemModal;
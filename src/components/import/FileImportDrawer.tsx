import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface FileWithPreview extends File {
  id: string;
  title: string;
  tags: string;
}

interface FileImportDrawerProps {
  onClose: () => void;
  preselectedSpace: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const FileImportDrawer = ({ onClose, preselectedSpace }: FileImportDrawerProps) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [space, setSpace] = useState(preselectedSpace);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 25MB limit`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    const filesWithPreview: FileWithPreview[] = validFiles.map(file => ({
      ...file,
      id: uuidv4(),
      title: file.name.split('.').slice(0, -1).join('.') || file.name,
      tags: ''
    }));

    setFiles(prev => [...prev, ...filesWithPreview]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/*': ['.txt', '.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: MAX_FILE_SIZE
  });

  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const updateFileTitle = (id: string, title: string) => {
    setFiles(files.map(file => file.id === id ? { ...file, title } : file));
  };

  const updateFileTags = (id: string, tags: string) => {
    setFiles(files.map(file => file.id === id ? { ...file, tags } : file));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          // Upload file to storage
          const fileName = `${uuidv4()}-${file.name}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('ayra-files')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('ayra-files')
            .getPublicUrl(filePath);

          // Create item in database
          const { error: insertError } = await supabase
            .from('items')
            .insert({
              title: file.title,
              content: `File: ${file.name}`,
              type: file.type.startsWith('image/') ? 'image' : 'document',
              space: space,
              tags: file.tags ? file.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
              source: 'file-upload',
              file_url: publicUrl,
              user_id: user.id
            });

          if (insertError) throw insertError;
          successCount++;
        } catch (error) {
          console.error('Error uploading file:', error);
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Files uploaded successfully",
          description: `Imported ${successCount} file${successCount > 1 ? 's' : ''}`,
          action: (
            <Button variant="outline" size="sm" onClick={() => window.location.href = `/manage?space=${encodeURIComponent(space)}`}>
              View in Library
            </Button>
          )
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Some uploads failed",
          description: errors.join(', '),
          variant: "destructive"
        });
      }

      if (successCount > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2">
          <Upload size={20} />
          Upload Documents
        </DrawerTitle>
        <DrawerClose className="absolute right-4 top-4">
          <X size={20} />
        </DrawerClose>
      </DrawerHeader>

      <div className="px-6 space-y-6">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={40} className="mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary">Drop files here...</p>
          ) : (
            <div>
              <p className="text-foreground mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, images, documents • Max 25MB per file
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Files to import ({files.length})</Label>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <File size={16} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={file.title}
                        onChange={(e) => updateFileTitle(file.id, e.target.value)}
                        className="flex-1"
                        placeholder="File title"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.type}</span>
                    </div>
                    <Input
                      value={file.tags}
                      onChange={(e) => updateFileTags(file.id, e.target.value)}
                      placeholder="Tags (comma-separated)"
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Space Selection */}
        <div className="space-y-2">
          <Label htmlFor="space">Space</Label>
          <Select value={space} onValueChange={setSpace}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Personal">Personal</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Projects">Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DrawerFooter className="flex flex-row gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
};
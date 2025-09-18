import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, FileText, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'other';
}

interface FileAttachmentProps {
  onFilesAdded: (files: AttachedFile[]) => void;
  onFileRemoved: (id: string) => void;
  attachedFiles: AttachedFile[];
  disabled?: boolean;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 5;

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  onFilesAdded,
  onFileRemoved,
  attachedFiles,
  disabled = false
}) => {
  const { toast } = useToast();

  const generateFileId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const createAttachedFile = (file: File): AttachedFile => {
    const fileType = file.type.startsWith('image/') 
      ? 'image' 
      : file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')
      ? 'document'
      : 'other';

    const attachedFile: AttachedFile = {
      id: generateFileId(),
      file,
      type: fileType
    };

    // Create preview for images
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        attachedFile.preview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    return attachedFile;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return;

    const totalFiles = attachedFiles.length + acceptedFiles.length;
    if (totalFiles > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `Maximum ${MAX_FILES} files allowed`,
        variant: "destructive"
      });
      return;
    }

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

    if (validFiles.length > 0) {
      const newAttachedFiles = validFiles.map(createAttachedFile);
      onFilesAdded(newAttachedFiles);
    }
  }, [onFilesAdded, attachedFiles.length, disabled, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.csv', '.json'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: MAX_FILE_SIZE,
    disabled,
    noClick: true // We'll use a separate button for click
  });

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDrop(files);
    }
    e.target.value = ''; // Reset input
  };

  const getFileIcon = (file: AttachedFile) => {
    switch (file.type) {
      case 'image':
        return <Image size={16} className="text-blue-500" />;
      case 'document':
        return <FileText size={16} className="text-red-500" />;
      default:
        return <File size={16} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* File Upload Button */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 transition-all duration-200",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"
          )}
          disabled={disabled}
          onClick={() => {
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            fileInput?.click();
          }}
        >
          <Paperclip size={16} />
        </Button>
        
        {attachedFiles.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {attachedFiles.length}/{MAX_FILES} files
          </span>
        )}
      </div>

      {/* Drag and Drop Zone (only shows when dragging) */}
      {isDragActive && (
        <div
          {...getRootProps()}
          className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 rounded-lg flex items-center justify-center z-10"
        >
          <div className="text-center">
            <Upload size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-sm text-primary font-medium">Drop files here</p>
          </div>
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-2 py-1 bg-background border rounded-md text-xs"
            >
              {getFileIcon(file)}
              <span className="max-w-[100px] truncate" title={file.file.name}>
                {file.file.name}
              </span>
              <span className="text-muted-foreground">
                ({formatFileSize(file.file.size)})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => onFileRemoved(file.id)}
                disabled={disabled}
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { X, File, Image, FileText, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  onFilesAdded,
  onFileRemoved,
  attachedFiles,
  disabled = false
}) => {

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
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              const newAttachedFiles = files.map(file => {
                const fileType = file.type.startsWith('image/') 
                  ? 'image' 
                  : file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')
                  ? 'document'
                  : 'other';

                const attachedFile: AttachedFile = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
              });
              onFilesAdded(newAttachedFiles);
            }
            e.target.value = ''; // Reset input
          }}
          className="hidden"
          id="file-upload"
          disabled={disabled}
          accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx"
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
            {attachedFiles.length}/5 files
          </span>
        )}
      </div>

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
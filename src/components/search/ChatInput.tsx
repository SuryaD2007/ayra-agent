import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileAttachment, AttachedFile } from './FileAttachment';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSubmit: (e: React.FormEvent, attachedFiles?: AttachedFile[]) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  onFocus?: () => void;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 5;

const ChatInput: React.FC<ChatInputProps> = ({
  searchQuery,
  setSearchQuery,
  handleSubmit,
  isFocused,
  setIsFocused,
  onFocus,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const { toast } = useToast();

  // Handle file drop on the entire input area
  const onDrop = useCallback((acceptedFiles: File[]) => {
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
      const newAttachedFiles = validFiles.map(file => {
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
      
      handleFilesAdded(newAttachedFiles);
    }
  }, [attachedFiles.length, toast]);

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
    noClick: true,
    noKeyboard: true
  });

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (searchQuery.trim() || attachedFiles.length > 0) {
        handleSubmit(e, attachedFiles);
        // Clear files after sending
        setAttachedFiles([]);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || attachedFiles.length > 0) {
      handleSubmit(e, attachedFiles);
      // Clear files after sending
      setAttachedFiles([]);
    }
  };

  const handleFilesAdded = (newFiles: AttachedFile[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="p-4 border-t border-border/20 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-xl">
      <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto">
        <div 
          {...getRootProps()}
          className={cn(
            "relative flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-300 ease-out",
            isFocused 
              ? "border-primary/40 bg-background/90 shadow-lg shadow-primary/10 ring-1 ring-primary/20" 
              : "border-border/40 bg-background/60 hover:border-border/60 hover:bg-background/80",
            isDragActive && "border-primary bg-primary/5 ring-2 ring-primary/30"
          )}
        >
          <input {...getInputProps()} />
          
          {/* Drag overlay */}
          {isDragActive && (
            <div className="absolute inset-0 bg-primary/10 rounded-2xl flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-background/95 p-4 rounded-lg shadow-lg border border-primary">
                <Upload size={32} className="mx-auto mb-2 text-primary animate-bounce" />
                <p className="text-sm font-medium text-primary">Drop your files here</p>
              </div>
            </div>
          )}
          {/* File Attachments */}
          <FileAttachment
            onFilesAdded={handleFilesAdded}
            onFileRemoved={handleFileRemoved}
            attachedFiles={attachedFiles}
            disabled={false}
          />
          
          {/* Input Area */}
          <div className="flex items-end gap-3">
            <Search 
              size={20}
              className={cn(
                "transition-all duration-300 ease-out mt-3 flex-shrink-0",
                isFocused || searchQuery 
                  ? "text-primary scale-110" 
                  : "text-muted-foreground"
              )}
            />
            
            <textarea
              ref={textareaRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground min-h-[24px] max-h-[120px] py-2 leading-6"
              rows={1}
            />
            
            <Button
              type="submit"
              size="sm"
              disabled={!searchQuery.trim() && attachedFiles.length === 0}
              className={cn(
                "flex-shrink-0 h-8 w-8 p-0 rounded-xl transition-all duration-300 ease-out",
                searchQuery.trim() || attachedFiles.length > 0
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg scale-100" 
                  : "bg-muted text-muted-foreground scale-95 cursor-not-allowed"
              )}
            >
              <Send size={16} className={searchQuery.trim() || attachedFiles.length > 0 ? "animate-pulse" : ""} />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
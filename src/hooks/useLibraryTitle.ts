import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseLibraryTitleReturn {
  libraryTitle: string;
  isEditing: boolean;
  tempTitle: string;
  isSaving: boolean;
  showSuccess: boolean;
  startEditing: () => void;
  setTempTitle: (title: string) => void;
  saveTitle: () => void;
  cancelEdit: () => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleDoubleClick: () => void;
}

const LIBRARY_TITLE_KEY = 'cortex-library-title';
const DEBOUNCE_DELAY = 400;

export const useLibraryTitle = (): UseLibraryTitleReturn => {
  const [libraryTitle, setLibraryTitle] = useState(() => {
    try {
      return localStorage.getItem(LIBRARY_TITLE_KEY) || 'Cortex Library';
    } catch {
      return 'Cortex Library';
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const hasUnsavedChanges = useRef(false);
  const originalTitle = useRef('');

  // Block navigation when editing
  useEffect(() => {
    if (!isEditing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  // Save to localStorage and broadcast change
  const persistTitle = useCallback(async (title: string) => {
    setIsSaving(true);
    
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      
      localStorage.setItem(LIBRARY_TITLE_KEY, title);
      setLibraryTitle(title);
      hasUnsavedChanges.current = false;
      
      // Broadcast the change for live updates
      window.dispatchEvent(new CustomEvent('libraryTitleChanged', { 
        detail: { title } 
      }));
      
      setIsSaving(false);
      setShowSuccess(true);
      
      // Hide success after 1.5s
      setTimeout(() => setShowSuccess(false), 1500);
      
    } catch (error) {
      setIsSaving(false);
      toast({
        title: "Error",
        description: "Failed to save title. Please try again.",
        variant: "destructive",
      });
    }
  }, []);

  const startEditing = useCallback(() => {
    originalTitle.current = libraryTitle;
    setTempTitle(libraryTitle);
    setIsEditing(true);
    hasUnsavedChanges.current = false;
  }, [libraryTitle]);

  const saveTitle = useCallback(() => {
    if (!tempTitle.trim()) {
      setTempTitle(originalTitle.current);
      setIsEditing(false);
      return;
    }
    
    if (tempTitle.trim() !== libraryTitle) {
      persistTitle(tempTitle.trim());
    }
    
    setIsEditing(false);
    hasUnsavedChanges.current = false;
  }, [tempTitle, libraryTitle, persistTitle]);

  const cancelEdit = useCallback(() => {
    setTempTitle(originalTitle.current);
    setIsEditing(false);
    hasUnsavedChanges.current = false;
    
    // Clear any pending debounced save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const handleBlur = useCallback(() => {
    if (!isEditing) return;
    
    // Debounced autosave on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (tempTitle.trim() && tempTitle.trim() !== libraryTitle) {
        persistTitle(tempTitle.trim());
      }
      setIsEditing(false);
      hasUnsavedChanges.current = false;
    }, DEBOUNCE_DELAY);
  }, [isEditing, tempTitle, libraryTitle, persistTitle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }, [saveTitle, cancelEdit]);

  const handleDoubleClick = useCallback(() => {
    if (!isEditing) {
      startEditing();
    }
  }, [isEditing, startEditing]);

  // Track changes for navigation warning
  useEffect(() => {
    if (isEditing && tempTitle !== originalTitle.current) {
      hasUnsavedChanges.current = true;
    }
  }, [tempTitle, isEditing]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    libraryTitle,
    isEditing,
    tempTitle,
    isSaving,
    showSuccess,
    startEditing,
    setTempTitle,
    saveTitle,
    cancelEdit,
    handleBlur,
    handleKeyDown,
    handleDoubleClick,
  };
};
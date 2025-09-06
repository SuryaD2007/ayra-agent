import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UseSignedUrlOptions {
  bucket: string;
  path: string | null;
  expiresIn?: number; // seconds
  refreshThreshold?: number; // percentage (0-1)
}

export interface UseSignedUrlResult {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSignedUrl({
  bucket,
  path,
  expiresIn = 3600, // 1 hour
  refreshThreshold = 0.8 // refresh at 80%
}: UseSignedUrlOptions): UseSignedUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const createdAtRef = useRef<number | null>(null);

  const generateSignedUrl = async (): Promise<string | null> => {
    if (!path) return null;
    
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error) {
        console.error('Error generating signed URL:', error);
        throw error;
      }
      
      return data.signedUrl;
    } catch (err) {
      console.error('Failed to generate signed URL:', err);
      throw err;
    }
  };

  const refresh = async () => {
    if (!path) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newUrl = await generateSignedUrl();
      setUrl(newUrl);
      createdAtRef.current = Date.now();
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for refresh
      const refreshTime = (expiresIn * 1000) * refreshThreshold;
      timeoutRef.current = setTimeout(() => {
        refresh();
      }, refreshTime);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh signed URL';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and path changes
  useEffect(() => {
    if (path) {
      refresh();
    } else {
      setUrl(null);
      setError(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [path, bucket, expiresIn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    url,
    isLoading,
    error,
    refresh
  };
}
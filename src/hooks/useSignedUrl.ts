import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UseSignedUrlResult {
  url: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  expiresAt: Date | null;
}

export function useSignedUrl(path: string | null, ttlSec = 3600): UseSignedUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateSignedUrl = async (): Promise<string | null> => {
    if (!path) return null;
    
    try {
      const { data, error } = await supabase.storage
        .from('ayra-files')
        .createSignedUrl(path, ttlSec);
      
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

  const refresh = useCallback(async () => {
    if (!path) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.storage
        .from('ayra-files')
        .createSignedUrl(path, ttlSec);
      
      if (error) {
        console.error('Error generating signed URL:', error);
        throw error;
      }
      
      const newUrl = data.signedUrl;
      const newExpiresAt = new Date(Date.now() + ttlSec * 1000);
      
      setUrl(newUrl);
      setExpiresAt(newExpiresAt);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for refresh at 80% of TTL
      const refreshTime = ttlSec * 1000 * 0.8;
      timeoutRef.current = setTimeout(() => {
        refresh();
      }, refreshTime);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh signed URL';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [path, ttlSec]);

  // Initial load and path changes
  useEffect(() => {
    if (path) {
      refresh();
    } else {
      setUrl(null);
      setError(null);
      setExpiresAt(null);
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
  }, [path, refresh]);

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
    loading,
    error,
    refresh,
    expiresAt
  };
}
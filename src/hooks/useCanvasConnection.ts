import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCanvasConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      setLoading(false);
      return;
    }

    checkConnection();
  }, [isAuthenticated]);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('canvas_integrations')
        .select('id')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Canvas connection:', error);
      }

      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking Canvas connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return { isConnected, loading };
};

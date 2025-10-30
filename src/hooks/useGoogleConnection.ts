import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GoogleConnectionStatus {
  isConnected: boolean;
  driveEnabled: boolean;
  calendarEnabled: boolean;
  loading: boolean;
}

export const useGoogleConnection = (): GoogleConnectionStatus => {
  const [isConnected, setIsConnected] = useState(false);
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      setDriveEnabled(false);
      setCalendarEnabled(false);
      setLoading(false);
      return;
    }

    checkConnection();
  }, [isAuthenticated]);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('google_integrations')
        .select('drive_enabled, calendar_enabled')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Google connection:', error);
      }

      if (data) {
        setIsConnected(true);
        setDriveEnabled(data.drive_enabled || false);
        setCalendarEnabled(data.calendar_enabled || false);
      } else {
        setIsConnected(false);
        setDriveEnabled(false);
        setCalendarEnabled(false);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setIsConnected(false);
      setDriveEnabled(false);
      setCalendarEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return { isConnected, driveEnabled, calendarEnabled, loading };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSettings {
  autoSave: boolean;
  notifications: boolean;
  aiSuggestions: boolean;
  autoLock: boolean;
  secureDelete: boolean;
  darkMode: boolean;
  animations: boolean;
  compactView: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  autoSave: true,
  notifications: true,
  aiSuggestions: true,
  autoLock: true,
  secureDelete: false,
  darkMode: true,
  animations: true,
  compactView: false,
};

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...(data.settings as Partial<UserSettings>) });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Update a single setting
  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (!user) {
      toast.error('Please sign in to save settings');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Setting updated');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to save setting');
      // Revert on error
      setSettings(settings);
    }
  };

  return {
    settings,
    updateSetting,
    loading,
  };
};

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventType: string,
    eventData?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_data: eventData || {},
        });

      if (error) {
        console.error('Error tracking event:', error);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }, [user]);

  // Specific event trackers
  const trackPageView = useCallback((pageName: string) => {
    trackEvent('page_view', { page: pageName });
  }, [trackEvent]);

  const trackItemCreated = useCallback((itemType: string) => {
    trackEvent('item_created', { item_type: itemType });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string) => {
    trackEvent('search', { query });
  }, [trackEvent]);

  const trackChatMessage = useCallback((chatId: string) => {
    trackEvent('chat_message', { chat_id: chatId });
  }, [trackEvent]);

  const trackFileUpload = useCallback((fileType: string, fileSize: number) => {
    trackEvent('file_upload', { file_type: fileType, file_size: fileSize });
  }, [trackEvent]);

  const trackShareAction = useCallback((shareType: string, itemId?: string) => {
    trackEvent('share_action', { share_type: shareType, item_id: itemId });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackItemCreated,
    trackSearch,
    trackChatMessage,
    trackFileUpload,
    trackShareAction,
  };
};

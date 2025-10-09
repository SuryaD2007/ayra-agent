import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useIPTracking = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const trackIP = async () => {
      try {
        // Get user's IP address from a public API
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        // Get user agent
        const userAgent = navigator.userAgent;

        // Record login with IP
        await supabase.from('user_login_history').insert({
          user_id: userId,
          ip_address: ip,
          user_agent: userAgent,
        });
      } catch (error) {
        console.error('Error tracking IP:', error);
      }
    };

    trackIP();
  }, [userId]);
};

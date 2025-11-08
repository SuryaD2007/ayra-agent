import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  event_id: string;
  summary: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  calendar_id: string;
  html_link: string;
  is_assignment: boolean;
  is_all_day: boolean;
  is_recurring: boolean;
  status: string;
  metadata: any;
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchEvents = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('google_calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;
      setEvents(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Set up realtime subscription
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'google_calendar_events'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const getUpcomingEvents = (limit: number = 5) => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start_time) >= now)
      .slice(0, limit);
  };

  const getAssignments = () => {
    return events.filter(event => event.is_assignment);
  };

  const getTodayEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate >= today && eventDate < tomorrow;
    });
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    getUpcomingEvents,
    getAssignments,
    getTodayEvents
  };
};

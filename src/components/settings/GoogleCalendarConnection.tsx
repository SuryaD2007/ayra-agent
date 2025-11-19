import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, RefreshCw, Unlink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GoogleCalendarConnection = () => {
  const { isAuthenticated } = useAuth();
  const { calendarEnabled, loading: connectionLoading } = useGoogleConnection();
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ 
    events: 0, 
    assignments: 0, 
    lastSync: null as string | null 
  });
  const { toast } = useToast();

  useEffect(() => {
    if (calendarEnabled) {
      loadStats();
    }
  }, [calendarEnabled]);

  const loadStats = async () => {
    try {
      const { data: events } = await supabase
        .from('google_calendar_events')
        .select('id, is_assignment');

      const { data: integration } = await supabase
        .from('google_integrations')
        .select('calendar_last_sync')
        .single();

      setStats({
        events: events?.length || 0,
        assignments: events?.filter(e => e.is_assignment).length || 0,
        lastSync: integration?.calendar_last_sync || null,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleConnect = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to connect Google Calendar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      console.log('Initiating Google Calendar connection...');
      
      const response = await supabase.functions.invoke('google-oauth-init', {
        body: { service: 'calendar' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Response:', response);

      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error.message || 'Unknown error';
        
        if (errorMsg.includes('Google Client ID not configured')) {
          throw new Error('Google Calendar integration is not configured yet. Please contact the administrator to set up Google OAuth credentials.');
        }
        
        // Check if it's a scope issue
        if (errorMsg.includes('insufficient') || errorMsg.includes('scope')) {
          toast({
            title: 'Insufficient Permissions',
            description: 'Please disconnect and reconnect to grant calendar access.',
            variant: 'destructive',
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            ),
          });
          return;
        }
        
        throw new Error(errorMsg);
      }

      if (!response.data?.authUrl) {
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('Redirecting to Google OAuth...');
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Google Calendar. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('sync-google-calendar', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error.message || 'Unknown error';
        
        // Check if it's an authentication error
        if (errorMsg.includes('reconnect') || errorMsg.includes('authentication failed')) {
          toast({
            title: 'Authentication Error',
            description: 'Your Google Calendar connection needs to be refreshed. Please disconnect and reconnect.',
            variant: 'destructive',
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
                className="ml-2"
              >
                Disconnect
              </Button>
            ),
          });
          return;
        }
        
        throw new Error(errorMsg);
      }

      toast({
        title: 'Sync Complete',
        description: `Synced ${response.data.synced} events, detected ${response.data.assignments_detected} assignments`,
      });

      loadStats();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync Google Calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('google_integrations')
        .update({ calendar_enabled: false })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected',
      });

      window.location.reload();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google Calendar',
        variant: 'destructive',
      });
    }
  };

  if (connectionLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            <div>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>Sync events and assignments from your calendar</CardDescription>
            </div>
          </div>
          <Badge variant={calendarEnabled ? 'default' : 'secondary'}>
            {calendarEnabled ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to connect Google Calendar.
            </AlertDescription>
          </Alert>
        )}
        {calendarEnabled ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold">{stats.events}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Assignments</p>
                <p className="text-2xl font-bold">{stats.assignments}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">
                  {stats.lastSync
                    ? new Date(stats.lastSync).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSync} disabled={isSyncing} className="flex-1">
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
              <Button onClick={handleDisconnect} variant="outline">
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button 
            onClick={handleConnect} 
            className="w-full"
            disabled={!isAuthenticated}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

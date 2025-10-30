import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, HardDrive, RefreshCw, Unlink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GoogleDriveConnection = () => {
  const { isAuthenticated } = useAuth();
  const { driveEnabled, loading: connectionLoading } = useGoogleConnection();
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ files: 0, lastSync: null as string | null });
  const { toast } = useToast();

  useEffect(() => {
    if (driveEnabled) {
      loadStats();
    }
  }, [driveEnabled]);

  const loadStats = async () => {
    try {
      const { data: driveItems } = await supabase
        .from('google_drive_items')
        .select('id');

      const { data: integration } = await supabase
        .from('google_integrations')
        .select('drive_last_sync')
        .single();

      setStats({
        files: driveItems?.length || 0,
        lastSync: integration?.drive_last_sync || null,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleConnect = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to connect Google Drive.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found');
      }

      console.log('Initiating Google Drive connection...');
      
      const response = await supabase.functions.invoke('google-oauth-init', {
        body: { service: 'drive' },
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
          throw new Error('Google Drive integration is not configured yet. Please contact the administrator to set up Google OAuth credentials.');
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
        description: error.message || 'Failed to connect to Google Drive. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('sync-google-drive', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: 'Sync Complete',
        description: `Synced ${response.data.synced} files from Google Drive`,
      });

      loadStats();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync Google Drive. Please try again.',
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
        .update({ drive_enabled: false })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: 'Disconnected',
        description: 'Google Drive has been disconnected',
      });

      window.location.reload();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google Drive',
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
            <HardDrive className="h-6 w-6" />
            <div>
              <CardTitle>Google Drive</CardTitle>
              <CardDescription>Sync files from your Google Drive</CardDescription>
            </div>
          </div>
          <Badge variant={driveEnabled ? 'default' : 'secondary'}>
            {driveEnabled ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to connect Google Drive.
            </AlertDescription>
          </Alert>
        )}
        {driveEnabled ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Files Synced</p>
                <p className="text-2xl font-bold">{stats.files}</p>
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
            <HardDrive className="h-4 w-4 mr-2" />
            Connect Google Drive
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

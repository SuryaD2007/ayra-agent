import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Cloud, CheckCircle2, XCircle } from 'lucide-react';

export const GoogleDriveConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'google_drive')
        .maybeSingle();

      if (data) {
        setIsConnected(data.is_connected);
        setLastSync(data.last_sync_at);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    
    // OAuth URL (you'll need to set up Google OAuth credentials)
    const clientId = 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = `${window.location.origin}/settings`;
    const scope = 'https://www.googleapis.com/auth/drive.readonly';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline`;

    window.location.href = authUrl;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-drive');
      
      if (error) throw error;

      toast.success(`Synced ${data.itemsSynced} items from Google Drive`);
      await checkConnection();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync Google Drive');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('integration_settings')
        .update({ is_connected: false, access_token: null, refresh_token: null })
        .eq('integration_type', 'google_drive');

      if (error) throw error;

      setIsConnected(false);
      toast.success('Disconnected from Google Drive');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Google Drive</CardTitle>
              <CardDescription>Import files from your Google Drive</CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            {lastSync && (
              <p className="text-sm text-muted-foreground">
                Last synced: {new Date(lastSync).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSync} disabled={syncing} className="flex-1">
                {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sync Now
              </Button>
              <Button onClick={handleDisconnect} variant="outline">
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Google Drive
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

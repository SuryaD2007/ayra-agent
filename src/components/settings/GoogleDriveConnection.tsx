import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { HardDrive, Loader2 } from 'lucide-react';

export const GoogleDriveConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'google_drive')
        .eq('is_connected', true)
        .maybeSingle();

      if (error) throw error;
      
      setIsConnected(!!data);
      if (data?.last_sync_at) {
        setLastSync(new Date(data.last_sync_at));
      }
    } catch (error) {
      console.error('Error checking Google Drive connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-google-oauth-url', {
        body: { type: 'drive' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to Google Drive',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('integration_settings')
        .delete()
        .eq('integration_type', 'google_drive');

      if (error) throw error;

      setIsConnected(false);
      toast({
        title: 'Disconnected',
        description: 'Google Drive has been disconnected'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const { error } = await supabase.functions.invoke('sync-google-drive');

      if (error) throw error;

      setLastSync(new Date());
      toast({
        title: 'Sync complete',
        description: 'Your Google Drive files have been synced'
      });
    } catch (error: any) {
      toast({
        title: 'Sync failed',
        description: error.message || 'Failed to sync Google Drive',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
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
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            <CardTitle>Google Drive</CardTitle>
          </div>
          {isConnected && <Badge variant="default">Connected</Badge>}
        </div>
        <CardDescription>
          Sync your Google Docs, Sheets, Slides, and PDFs to Ayra
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            {lastSync && (
              <p className="text-sm text-muted-foreground">
                Last synced: {lastSync.toLocaleString()}
              </p>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={handleSync} 
                disabled={isSyncing}
                variant="outline"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </Button>
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleConnect}>
            Connect Google Drive
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
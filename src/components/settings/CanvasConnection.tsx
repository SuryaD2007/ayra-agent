import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2 } from 'lucide-react';

export const CanvasConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [institutionUrl, setInstitutionUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('canvas_integrations')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setIsConnected(!!data);
      if (data) {
        setInstitutionUrl(data.institution_url);
        if (data.updated_at) {
          setLastSync(new Date(data.updated_at));
        }
      }
    } catch (error) {
      console.error('Error checking Canvas connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!institutionUrl.trim()) {
      toast({
        title: 'Missing URL',
        description: 'Please enter your Canvas institution URL',
        variant: 'destructive'
      });
      return;
    }

    if (!accessToken.trim()) {
      toast({
        title: 'Missing Token',
        description: 'Please enter your Canvas personal access token',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('canvas_integrations')
        .upsert({
          user_id: user.id,
          institution_url: institutionUrl.trim(),
          access_token: accessToken.trim(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setIsConnected(true);
      setAccessToken(''); // Clear the token from state for security
      toast({
        title: 'Connected',
        description: 'Canvas has been connected successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect to Canvas',
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
        .from('canvas_integrations')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      // Also delete synced items
      await supabase
        .from('canvas_items')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      setIsConnected(false);
      setInstitutionUrl('');
      toast({
        title: 'Disconnected',
        description: 'Canvas has been disconnected'
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
      const { error } = await supabase.functions.invoke('sync-canvas-data');

      if (error) throw error;

      setLastSync(new Date());
      toast({
        title: 'Sync complete',
        description: 'Your Canvas assignments and materials have been synced'
      });
    } catch (error: any) {
      toast({
        title: 'Sync failed',
        description: error.message || 'Failed to sync Canvas data',
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
            <GraduationCap className="h-5 w-5" />
            <CardTitle>Canvas LMS</CardTitle>
          </div>
          {isConnected && <Badge variant="default">Connected</Badge>}
        </div>
        <CardDescription>
          Sync your assignments, course materials, and due dates from Canvas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Institution: {institutionUrl}
              </p>
              {lastSync && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {lastSync.toLocaleString()}
                </p>
              )}
            </div>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canvas-url">Institution Canvas URL</Label>
              <Input
                id="canvas-url"
                placeholder="e.g., canvas.gatech.edu"
                value={institutionUrl}
                onChange={(e) => setInstitutionUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter your school's Canvas domain (without https://)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="canvas-token">Personal Access Token</Label>
              <Input
                id="canvas-token"
                type="password"
                placeholder="Your Canvas personal access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  To generate a token in Canvas:
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                  <li>Click on "Account" in the left sidebar</li>
                  <li>Click "Settings"</li>
                  <li>Scroll down to "Approved Integrations"</li>
                  <li>Click "+ New Access Token"</li>
                  <li>Give it a name (e.g., "Ayra") and click "Generate Token"</li>
                </ol>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ If you don't see "Approved Integrations", your institution may have disabled this feature. Contact your Canvas administrator.
                </p>
              </div>
            </div>
            <Button onClick={handleConnect}>
              Connect Canvas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
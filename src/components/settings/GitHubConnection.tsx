import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Github, CheckCircle2, XCircle } from 'lucide-react';

export const GitHubConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'github')
        .maybeSingle();

      if (data) {
        setIsConnected(data.is_connected);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const redirectUri = `${window.location.origin}/settings`;
      
      const { data, error } = await supabase.functions.invoke('get-github-oauth-url', {
        body: { redirectUri }
      });

      if (error) throw error;

      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Connect error:', error);
      toast.error('Failed to initiate GitHub connection');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('integration_settings')
        .update({ is_connected: false, access_token: null })
        .eq('integration_type', 'github');

      if (error) throw error;

      setIsConnected(false);
      toast.success('Disconnected from GitHub');
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
            <Github className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>GitHub</CardTitle>
              <CardDescription>Import repositories and documentation</CardDescription>
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
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect GitHub
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

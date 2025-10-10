import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, BookOpen, CheckCircle2, XCircle } from 'lucide-react';

export const NotionConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'notion')
        .maybeSingle();

      if (data) {
        setIsConnected(data.is_connected);
        const settings = data.settings as { workspace_name?: string };
        setWorkspaceName(settings?.workspace_name || null);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    
    const redirectUri = `${window.location.origin}/settings`;
    
    // Note: Set NOTION_CLIENT_ID in Supabase Edge Function secrets
    toast.info('Redirecting to Notion OAuth...');
    
    // The OAuth flow will be completed by the notion-oauth edge function
    // For now, this is a placeholder - you'll need to implement the full OAuth flow
    setLoading(false);
    toast.error('OAuth flow not yet fully configured. Please add your Notion Client ID to the edge function.');
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('integration_settings')
        .update({ is_connected: false, access_token: null })
        .eq('integration_type', 'notion');

      if (error) throw error;

      setIsConnected(false);
      toast.success('Disconnected from Notion');
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
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Notion</CardTitle>
              <CardDescription>Import pages and databases from Notion</CardDescription>
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
            {workspaceName && (
              <p className="text-sm text-muted-foreground">
                Workspace: {workspaceName}
              </p>
            )}
            <Button onClick={handleDisconnect} variant="outline" className="w-full">
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Notion
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

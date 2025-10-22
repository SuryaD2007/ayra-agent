import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useAnimateIn } from '@/lib/animations';
import { GraduationCap, Loader2, Link as LinkIcon, Key, CheckCircle2, Clock, RefreshCw, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CanvasConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [institutionUrl, setInstitutionUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [stats, setStats] = useState({ courses: 0, assignments: 0 });
  const { toast } = useToast();
  const isVisible = useAnimateIn(false, 100);

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
        
        // Fetch stats
        const { data: items } = await supabase
          .from('canvas_items')
          .select('type, course_name');
        
        if (items) {
          const courses = new Set(items.map(item => item.course_name)).size;
          const assignments = items.filter(item => item.type === 'assignment').length;
          setStats({ courses, assignments });
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

      // Normalize URL: remove protocol and trailing slashes
      const normalizedUrl = institutionUrl.trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '');

      const { error } = await supabase
        .from('canvas_integrations')
        .upsert({
          user_id: user.id,
          institution_url: normalizedUrl,
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
      <Card className="border-border/50 backdrop-blur-sm bg-card/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className={cn(
      "border-border/50 backdrop-blur-sm bg-card/50 shadow-lg hover:shadow-xl transition-all duration-500",
      isVisible && "animate-fade-in"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-500",
              isConnected 
                ? "bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/20" 
                : "bg-muted"
            )}>
              <GraduationCap className={cn(
                "h-6 w-6 transition-colors duration-500",
                isConnected && "text-primary"
              )} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Canvas LMS
                {isConnected && (
                  <Badge variant="default" className="animate-scale-in gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {isConnected 
                  ? 'Your Canvas data is synced with Ayra' 
                  : 'Connect to sync assignments, materials, and deadlines'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isConnected ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ animationDelay: '100ms' }}>
              <div className="group flex flex-col items-center p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50">
                <BookOpen className="h-5 w-5 text-primary mb-2 transition-transform duration-500 group-hover:scale-110" />
                <div className="text-2xl font-bold">{stats.courses}</div>
                <div className="text-xs text-muted-foreground">Courses</div>
              </div>
              
              <div className="group flex flex-col items-center p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50">
                <Calendar className="h-5 w-5 text-primary mb-2 transition-transform duration-500 group-hover:scale-110" />
                <div className="text-2xl font-bold">{stats.assignments}</div>
                <div className="text-xs text-muted-foreground">Assignments</div>
              </div>
              
              <div className="group flex flex-col items-center p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50">
                <Clock className="h-5 w-5 text-primary mb-2 transition-transform duration-500 group-hover:scale-110" />
                <div className="text-2xl font-bold">{lastSync ? getTimeSince(lastSync) : 'Never'}</div>
                <div className="text-xs text-muted-foreground">Last Sync</div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-2" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Institution:</span>
                <span className="font-medium">{institutionUrl}</span>
              </div>
              {lastSync && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last synced:</span>
                  <span className="font-medium">{lastSync.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3" style={{ animationDelay: '300ms' }}>
              <Button 
                onClick={handleSync} 
                disabled={isSyncing}
                className="flex-1 transition-all duration-300 hover:scale-[1.02]"
                variant="default"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                className="transition-all duration-300 hover:scale-[1.02] hover:border-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Introduction */}
            <div className="text-center space-y-3 py-4">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Connect Your Canvas</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Automatically sync your assignments, track deadlines, and keep all your course materials organized in one place
              </p>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="canvas-url" className="text-sm font-medium">
                  Institution Canvas URL
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="canvas-url"
                    placeholder="canvas.gatech.edu"
                    value={institutionUrl}
                    onChange={(e) => setInstitutionUrl(e.target.value)}
                    className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50 hover:border-primary/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Enter your school's Canvas domain (without https://)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canvas-token" className="text-sm font-medium">
                  Personal Access Token
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="canvas-token"
                    type="password"
                    placeholder="Your Canvas personal access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/50 hover:border-primary/50"
                  />
                </div>
              </div>

              {/* Instructions Accordion */}
              <Accordion type="single" collapsible className="border border-border/50 rounded-lg">
                <AccordionItem value="instructions" className="border-none">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-sm font-medium">How to generate a Canvas token</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
                        <span>Click on "Account" in the Canvas left sidebar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
                        <span>Click "Settings"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">3</span>
                        <span>Scroll down to "Approved Integrations"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">4</span>
                        <span>Click "+ New Access Token"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">5</span>
                        <span>Give it a name (e.g., "Ayra") and click "Generate Token"</span>
                      </li>
                    </ol>
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>If you don't see "Approved Integrations", your institution may have disabled this feature. Contact your Canvas administrator.</span>
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Connect Button */}
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="w-full transition-all duration-300 hover:scale-[1.02]"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Connect Canvas
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
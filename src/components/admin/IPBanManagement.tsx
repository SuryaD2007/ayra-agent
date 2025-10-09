import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Trash2, History } from 'lucide-react';

interface BannedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  banned_at: string;
  expires_at: string | null;
}

interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string | null;
  logged_in_at: string;
}

export default function IPBanManagement() {
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState('');
  const [banReason, setBanReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load banned IPs
      const { data: ips } = await supabase
        .from('banned_ips')
        .select('*')
        .order('banned_at', { ascending: false });
      
      if (ips) setBannedIPs(ips);

      // Load recent login history
      const { data: history } = await supabase
        .from('user_login_history')
        .select('*')
        .order('logged_in_at', { ascending: false })
        .limit(50);
      
      if (history) setLoginHistory(history);
    } catch (error) {
      console.error('Error loading IP data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load IP data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const banIP = async () => {
    if (!newIP.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an IP address',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('banned_ips')
        .insert({
          ip_address: newIP.trim(),
          reason: banReason.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'IP Banned',
        description: `IP address ${newIP} has been banned`,
      });

      setNewIP('');
      setBanReason('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const unbanIP = async (ipAddress: string) => {
    try {
      const { error } = await supabase
        .from('banned_ips')
        .delete()
        .eq('ip_address', ipAddress);

      if (error) throw error;

      toast({
        title: 'IP Unbanned',
        description: `IP address ${ipAddress} has been unbanned`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel border-border/50">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-border/50 animate-fade-in">
      <CardHeader className="border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">IP Ban Management</CardTitle>
            <CardDescription>
              Monitor and manage IP-based access restrictions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="banned" className="space-y-4">
          <TabsList className="glass-panel p-1.5">
            <TabsTrigger value="banned" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4" />
              Banned IPs ({bannedIPs.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4" />
              Login History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banned" className="space-y-4">
            <div className="glass-panel border-border/50 p-4 space-y-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Manually Ban IP Address</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter IP address (e.g., 192.168.1.1)"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Reason (optional)"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={banIP} className="whitespace-nowrap">
                    Ban IP
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden glass-panel border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">IP Address</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Banned At</TableHead>
                    <TableHead className="font-semibold">Expires</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedIPs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 animate-fade-in">
                          <div className="text-4xl">🛡️</div>
                          <p className="text-muted-foreground">No banned IPs</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    bannedIPs.map((ip) => (
                      <TableRow key={ip.id} className="hover:bg-muted/50 transition-all duration-200">
                        <TableCell className="font-mono font-medium">{ip.ip_address}</TableCell>
                        <TableCell className="text-sm">
                          {ip.reason || <span className="text-muted-foreground">No reason provided</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(ip.banned_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {ip.expires_at ? (
                            <Badge variant="secondary" className="text-xs">
                              {new Date(ip.expires_at).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">Permanent</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unbanIP(ip.ip_address)}
                            className="smooth-bounce text-green-500 hover:text-green-600"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Unban
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="border rounded-lg overflow-hidden glass-panel border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">IP Address</TableHead>
                    <TableHead className="font-semibold">User Agent</TableHead>
                    <TableHead className="font-semibold">Login Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 animate-fade-in">
                          <div className="text-4xl">📝</div>
                          <p className="text-muted-foreground">No login history</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginHistory.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/50 transition-all duration-200">
                        <TableCell className="font-mono font-medium">{entry.ip_address}</TableCell>
                        <TableCell className="text-sm max-w-md truncate text-muted-foreground">
                          {entry.user_agent || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(entry.logged_in_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

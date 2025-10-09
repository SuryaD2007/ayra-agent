import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const IPBanGuard = ({ children }: { children: React.ReactNode }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkIPAndUserStatus = async () => {
      try {
        // Get user's current IP
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();

        // Check if IP is banned
        const { data: ipBanned } = await supabase.rpc('is_ip_banned', {
          _ip_address: ip,
        });

        if (ipBanned) {
          setIsBanned(true);
          setIsChecking(false);
          // Sign out the user
          await supabase.auth.signOut();
          return;
        }

        // If user is logged in, check their account status
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('status')
            .eq('user_id', user.id)
            .single();

          if (profile && profile.status === 'banned') {
            setUserStatus('banned');
            setIsBanned(true);
            // Sign out the user
            await supabase.auth.signOut();
            setIsChecking(false);
            return;
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Error checking IP/user status:', error);
        setIsChecking(false);
      }
    };

    checkIPAndUserStatus();
  }, [user]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted">
        <Card className="max-w-md w-full glass-panel border-destructive/50 animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-base">
              {userStatus === 'banned'
                ? 'Your account has been banned from accessing this platform.'
                : 'Access from your network has been restricted.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact support for assistance.
            </p>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Reason: {userStatus === 'banned' ? 'Account violation' : 'IP address banned'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

import React, { useState, useEffect } from 'react';
import { usePrivateLock } from '@/contexts/PrivateLockContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PreLaunchGuardProps {
  children: React.ReactNode;
}

const PRESET_PASSWORD = 'Ayra!!@3639';

const PreLaunchGuard = ({ children }: PreLaunchGuardProps) => {
  const { hasPassword, isPrivateUnlocked, unlockPrivate, setPrivatePassword } = usePrivateLock();
  const [password, setPassword] = useState('');

  // Set up the preset password if none exists
  useEffect(() => {
    if (!hasPassword) {
      setPrivatePassword(PRESET_PASSWORD);
    }
  }, [hasPassword, setPrivatePassword]);

  // If already unlocked, show the protected content
  if (isPrivateUnlocked()) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    if (unlockPrivate(password)) {
      toast.success('Access granted! Welcome to Ayra.');
      setPassword('');
    } else {
      toast.error('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/15 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-accent/10 animate-[pulse_3s_ease-in-out_infinite]"></div>
      
      <div className="text-center max-w-md w-full px-4 relative z-10">
        <div className="animate-scale-in">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-lg" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-4 animate-[fade-in_0.8s_ease-out_0.2s_both] bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-x_3s_ease-in-out_infinite] bg-clip-text text-transparent">
          Still building...
        </h2>
        
        <div className="animate-[slide-in-right_0.6s_ease-out_0.4s_both] transform">
          <p className="text-muted-foreground mb-8 bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20 bg-[length:200%_100%] animate-[gradient-x_4s_ease-in-out_infinite] px-6 py-3 rounded-xl border border-primary/30 backdrop-blur-sm shadow-lg">
            Launching October 17, 2025
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 animate-[fade-in_0.8s_ease-out_0.6s_both]">
          <div className="animate-[slide-in-right_0.6s_ease-out_0.8s_both]">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hover-scale transition-all duration-500 focus:shadow-xl focus:shadow-primary/30 bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 focus:border-primary/60"
            />
          </div>
          
          <div className="animate-[slide-in-right_0.6s_ease-out_1s_both]">
            <Button 
              type="submit"
              size="lg"
              className="w-full hover-scale bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-x_3s_ease-in-out_infinite] hover:shadow-2xl hover:shadow-primary/40 transition-all duration-500 text-white font-semibold py-3"
              disabled={!password.trim()}
            >
              <Lock className="mr-2 h-4 w-4 animate-[pulse_2s_ease-in-out_infinite]" />
              Access App
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreLaunchGuard;
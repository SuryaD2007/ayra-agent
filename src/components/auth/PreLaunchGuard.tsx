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
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-md w-full px-4">
        <div className="animate-scale-in">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-semibold mb-4 animate-fade-in bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" style={{ animationDelay: "200ms" }}>Still building...</h2>
        <p className="text-muted-foreground mb-8 animate-fade-in bg-gradient-to-r from-primary/20 to-accent/20 px-4 py-2 rounded-lg border border-primary/30" style={{ animationDelay: "400ms" }}>
          Launching October 17, 2025
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hover-scale transition-all duration-300 focus:shadow-lg focus:shadow-primary/20"
          />
          
          <Button 
            type="submit"
            size="lg"
            className="w-full hover-scale bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={!password.trim()}
          >
            <Lock className="mr-2 h-4 w-4" />
            Access App
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PreLaunchGuard;
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md w-full px-4">
        <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-semibold mb-4">Still building...</h2>
        <p className="text-muted-foreground mb-8">
          Launching October 17, 2025. Enter password for early access.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Button 
            type="submit"
            size="lg"
            className="w-full"
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
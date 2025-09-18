import React, { useState } from 'react';
import { usePrivateLock } from '@/contexts/PrivateLockContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface PreLaunchGuardProps {
  children: React.ReactNode;
}

const PreLaunchGuard = ({ children }: PreLaunchGuardProps) => {
  const { hasPassword, isPrivateUnlocked, unlockPrivate, setPrivatePassword } = usePrivateLock();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingPassword, setIsCreatingPassword] = useState(!hasPassword);

  // If already unlocked, show the protected content
  if (isPrivateUnlocked()) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    if (isCreatingPassword) {
      // Creating new password
      setPrivatePassword(password);
      toast.success('Pre-launch password set successfully!');
      setIsCreatingPassword(false);
    } else {
      // Attempting to unlock
      if (unlockPrivate(password)) {
        toast.success('Access granted! Welcome to Ayra.');
        setPassword('');
      } else {
        toast.error('Incorrect password. Please try again.');
        setPassword('');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md w-full px-4">
        <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-semibold mb-4">
          {isCreatingPassword ? 'Set Pre-Launch Password' : 'Pre-Launch Access'}
        </h2>
        <p className="text-muted-foreground mb-8">
          {isCreatingPassword 
            ? 'Set a password to protect access to the app before launch.'
            : 'Enter the pre-launch password to access Ayra.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={isCreatingPassword ? 'Create password' : 'Enter password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          <Button 
            type="submit"
            size="lg"
            className="w-full"
            disabled={!password.trim()}
          >
            <Lock className="mr-2 h-4 w-4" />
            {isCreatingPassword ? 'Set Password' : 'Access App'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PreLaunchGuard;
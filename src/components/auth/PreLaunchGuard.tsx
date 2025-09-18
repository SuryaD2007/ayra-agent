import React, { useState, useEffect } from 'react';
import { usePrivateLock } from '@/contexts/PrivateLockContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PreLaunchGuardProps {
  children: React.ReactNode;
}

const PRESET_PASSWORD = 'Ayra!!@3639';

const PreLaunchGuard = ({ children }: PreLaunchGuardProps) => {
  const { hasPassword, isPrivateUnlocked, unlockPrivate, setPrivatePassword } = usePrivateLock();
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

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

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(PRESET_PASSWORD);
      setCopied(true);
      toast.success('Password copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md w-full px-4">
        <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-semibold mb-4">Pre-Launch Access</h2>
        <p className="text-muted-foreground mb-6">
          Enter the password to access Ayra's full features
        </p>
        
        {/* Show the password */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 border">
          <p className="text-sm text-muted-foreground mb-2">Pre-Launch Password:</p>
          <div className="flex items-center justify-between bg-background rounded px-3 py-2 border">
            <code className="text-sm font-mono">{PRESET_PASSWORD}</code>
            <button
              onClick={copyPassword}
              className="ml-2 p-1 hover:bg-accent rounded transition-colors"
              title="Copy password"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter the password above"
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
        
        <p className="text-xs text-muted-foreground mt-4">
          Copy the password above and paste it to get access
        </p>
      </div>
    </div>
  );
};

export default PreLaunchGuard;
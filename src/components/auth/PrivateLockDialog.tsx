import React, { useState } from 'react';
import { Lock, Unlock, Timer, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { usePrivateLock } from '@/contexts/PrivateLockContext';
import { PasswordSetupDialog } from './PasswordSetupDialog';

interface PrivateLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void;
}

export function PrivateLockDialog({ open, onOpenChange, onUnlocked }: PrivateLockDialogProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const { unlockPrivate, isPrivateUnlocked, unlockedUntil, hasPassword, setPrivatePassword } = usePrivateLock();

  const handleUnlock = async () => {
    if (!password.trim()) {
      toast({
        title: 'Password required',
        description: 'Please enter a password to unlock private items.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate a small delay for security feel
    setTimeout(() => {
      const success = unlockPrivate(password);
      
      if (success) {
        toast({
          title: 'Private items unlocked',
          description: 'You now have access to private items for 30 minutes.',
        });
        setPassword('');
        onUnlocked?.();
        onOpenChange(false);
      } else {
        toast({
          title: 'Incorrect password',
          description: 'The password you entered is incorrect. Please try again.',
          variant: 'destructive',
        });
        setPassword('');
      }
      
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (hasPassword) {
        handleUnlock();
      } else {
        setShowPasswordSetup(true);
      }
    }
  };

  const handlePasswordSet = (newPassword: string) => {
    setPrivatePassword(newPassword);
    setShowPasswordSetup(false);
    // Auto-unlock after setting password
    setTimeout(() => {
      const success = unlockPrivate(newPassword);
      if (success) {
        toast({
          title: 'Password set and unlocked',
          description: 'Your private password has been set and items are now unlocked.',
        });
        onUnlocked?.();
        onOpenChange(false);
      }
    }, 500);
  };

  const getRemainingTime = () => {
    if (!unlockedUntil) return null;
    const remaining = Math.max(0, unlockedUntil - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Private Items Locked
            </DialogTitle>
            <DialogDescription>
              {isPrivateUnlocked() ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Unlock className="h-4 w-4" />
                  Private items are currently unlocked
                  {unlockedUntil && (
                    <span className="flex items-center gap-1 text-sm">
                      <Timer className="h-3 w-3" />
                      {getRemainingTime()} remaining
                    </span>
                  )}
                </div>
              ) : hasPassword ? (
                "Enter your password to access private items. They will remain unlocked for 30 minutes."
              ) : (
                "Set up a password to protect your private items. You'll need this password to unlock private content."
              )}
            </DialogDescription>
          </DialogHeader>

          {!isPrivateUnlocked() && (
            <>
              {hasPassword ? (
                <div className="space-y-2">
                  <Label htmlFor="private-password">Password</Label>
                  <Input
                    id="private-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter password..."
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    No password has been set yet. Create one to secure your private items.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                {hasPassword ? (
                  <Button
                    onClick={handleUnlock}
                    disabled={isLoading || !password.trim()}
                    className="min-w-[100px]"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Unlocking...
                      </div>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Unlock
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowPasswordSetup(true)}
                    disabled={isLoading}
                    className="min-w-[120px]"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Set Password
                  </Button>
                )}
              </DialogFooter>
            </>
          )}

          {isPrivateUnlocked() && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <PasswordSetupDialog
        open={showPasswordSetup}
        onOpenChange={setShowPasswordSetup}
        onPasswordSet={handlePasswordSet}
      />
    </>
  );
}
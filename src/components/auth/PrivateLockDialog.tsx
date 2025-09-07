import React, { useState } from 'react';
import { Lock, Unlock, Timer } from 'lucide-react';
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

interface PrivateLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void;
}

export function PrivateLockDialog({ open, onOpenChange, onUnlocked }: PrivateLockDialogProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { unlockPrivate, isPrivateUnlocked, unlockedUntil } = usePrivateLock();

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
      handleUnlock();
    }
  };

  const getRemainingTime = () => {
    if (!unlockedUntil) return null;
    const remaining = Math.max(0, unlockedUntil - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
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
            ) : (
              "Enter your password to access private items. They will remain unlocked for 30 minutes."
            )}
          </DialogDescription>
        </DialogHeader>

        {!isPrivateUnlocked() && (
          <>
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

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
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
  );
}
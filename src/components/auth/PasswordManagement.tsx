import React, { useState } from 'react';
import { Shield, Key, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { usePrivateLock } from '@/contexts/PrivateLockContext';
import { PasswordSetupDialog } from './PasswordSetupDialog';

export function PasswordManagement() {
  const { hasPassword, changePassword, resetPassword, lockPrivate } = usePrivateLock();
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: 'All fields required',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        title: 'Password too short',
        description: 'New password must be at least 4 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both new passwords are identical.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const success = changePassword(oldPassword, newPassword);
      if (success) {
        toast({
          title: 'Password changed',
          description: 'Your private password has been updated successfully.',
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowChangeDialog(false);
        lockPrivate(); // Lock again after password change for security
      } else {
        toast({
          title: 'Incorrect password',
          description: 'The current password you entered is incorrect.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 500);
  };

  const handleResetPassword = () => {
    resetPassword();
    setShowResetDialog(false);
    toast({
      title: 'Password reset',
      description: 'Your private password has been removed. Private items are now locked.',
    });
  };

  const handleSetPassword = (password: string) => {
    setShowSetupDialog(false);
    toast({
      title: 'Password set',
      description: 'Your private password has been configured successfully.',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Private Password
          </CardTitle>
          <CardDescription>
            Manage the password used to protect your private items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPassword ? (
            <>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Password is set</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangeDialog(true)}
                  >
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your private items are protected with a password. You'll need to enter it to access them.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border rounded-lg border-dashed">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">No password set</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowSetupDialog(true)}
                >
                  Set Password
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Set up a password to protect your private items from unauthorized access.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password..."
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  disabled={isLoading}
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeDialog(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isLoading || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your current password and lock all private items. 
              You'll need to set a new password to access them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Setup Password Dialog */}
      <PasswordSetupDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        onPasswordSet={handleSetPassword}
      />
    </>
  );
}
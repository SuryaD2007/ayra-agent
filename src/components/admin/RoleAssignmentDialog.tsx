import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/hooks/useRoles';

interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  currentRoles: string[];
  onAssignRole: (role: UserRole) => Promise<void>;
}

const RoleAssignmentDialog = ({
  open,
  onOpenChange,
  userName,
  currentRoles,
  onAssignRole,
}: RoleAssignmentDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(false);

  const availableRoles: UserRole[] = ['admin', 'moderator', 'user'];
  const rolesNotAssigned = availableRoles.filter(
    role => !currentRoles.includes(role)
  );

  const handleAssign = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    try {
      await onAssignRole(selectedRole);
      onOpenChange(false);
      setSelectedRole('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Role to {userName}</DialogTitle>
          <DialogDescription>
            Select a role to assign to this user. This will grant them additional permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {rolesNotAssigned.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Current roles:</p>
            <p>{currentRoles.length > 0 ? currentRoles.join(', ') : 'None'}</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedRole || loading}>
            {loading ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleAssignmentDialog;

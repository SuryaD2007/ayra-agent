import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Search, UserPlus, X, Ban, UserX, ShieldAlert } from 'lucide-react';
import RoleBadge from './RoleBadge';
import RoleAssignmentDialog from './RoleAssignmentDialog';
import { UserWithRoles } from '@/hooks/useAdminData';
import { UserRole } from '@/hooks/useRoles';

interface UserManagementProps {
  users: UserWithRoles[];
  onAssignRole: (userId: string, role: UserRole) => Promise<void>;
  onRemoveRole: (userId: string, role: UserRole) => Promise<void>;
  onBanUser: (userId: string, reason?: string) => Promise<void>;
  onUnbanUser: (userId: string) => Promise<void>;
  onDeleteUser: (userId: string, reason?: string) => Promise<void>;
}

const UserManagement = ({ users, onAssignRole, onRemoveRole, onBanUser, onUnbanUser, onDeleteUser }: UserManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<UserRole | null>(null);
  const [banReason, setBanReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveRole = (user: UserWithRoles, role: UserRole) => {
    setSelectedUser(user);
    setRoleToRemove(role);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveRole = async () => {
    if (selectedUser && roleToRemove) {
      await onRemoveRole(selectedUser.user_id, roleToRemove);
      setRemoveDialogOpen(false);
      setSelectedUser(null);
      setRoleToRemove(null);
    }
  };

  const handleBanUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const confirmBanUser = async () => {
    if (selectedUser) {
      await onBanUser(selectedUser.user_id, banReason || undefined);
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
    }
  };

  const handleUnbanUser = async (user: UserWithRoles) => {
    await onUnbanUser(user.user_id);
  };

  const handleDeleteUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (selectedUser) {
      await onDeleteUser(selectedUser.user_id, deleteReason || undefined);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      setDeleteReason('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'banned':
        return <Badge variant="destructive" className="animate-fade-in">Banned</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="animate-fade-in">Suspended</Badge>;
      default:
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 animate-fade-in">Active</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden glass-panel border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Joined</TableHead>
              <TableHead className="font-semibold">Roles</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <div className="flex flex-col items-center gap-2 animate-fade-in">
                    <div className="text-4xl">👥</div>
                    <p>No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id} className="hover:bg-muted/50 transition-all duration-200">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <div key={role} className="flex items-center gap-1">
                            <RoleBadge role={role as UserRole} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:text-destructive transition-colors"
                              onClick={() => handleRemoveRole(user, role as UserRole)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setAssignDialogOpen(true);
                        }}
                        className="smooth-bounce"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Role
                      </Button>
                      {user.status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user)}
                          className="smooth-bounce bg-green-500/10 hover:bg-green-500/20"
                        >
                          <ShieldAlert className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBanUser(user)}
                            className="smooth-bounce text-orange-500 hover:text-orange-600"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="smooth-bounce text-destructive hover:text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <>
          <RoleAssignmentDialog
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            userName={selectedUser.name}
            currentRoles={selectedUser.roles}
            onAssignRole={(role) => onAssignRole(selectedUser.user_id, role)}
          />

          <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
            <AlertDialogContent className="glass-panel">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Role</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove the "{roleToRemove}" role from {selectedUser.name}?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRemoveRole}>
                  Remove Role
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
            <DialogContent className="glass-panel">
              <DialogHeader>
                <DialogTitle>Ban User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to ban {selectedUser.name}? They will not be able to access the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ban-reason">Reason (Optional)</Label>
                  <Textarea
                    id="ban-reason"
                    placeholder="Enter the reason for banning this user..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmBanUser}>
                  Ban User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="glass-panel">
              <DialogHeader>
                <DialogTitle>Delete User Account</DialogTitle>
                <DialogDescription>
                  This will permanently delete {selectedUser.name}'s account and all associated data. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-reason">Reason (Optional)</Label>
                  <Textarea
                    id="delete-reason"
                    placeholder="Enter the reason for deleting this user..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteUser}>
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default UserManagement;

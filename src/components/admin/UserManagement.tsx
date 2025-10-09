import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, UserPlus, X } from 'lucide-react';
import RoleBadge from './RoleBadge';
import RoleAssignmentDialog from './RoleAssignmentDialog';
import { UserWithRoles } from '@/hooks/useAdminData';
import { UserRole } from '@/hooks/useRoles';

interface UserManagementProps {
  users: UserWithRoles[];
  onAssignRole: (userId: string, role: UserRole) => Promise<void>;
  onRemoveRole: (userId: string, role: UserRole) => Promise<void>;
}

const UserManagement = ({ users, onAssignRole, onRemoveRole }: UserManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<UserRole | null>(null);

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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
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
                              className="h-5 w-5"
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setAssignDialogOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Role
                    </Button>
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
            <AlertDialogContent>
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
        </>
      )}
    </div>
  );
};

export default UserManagement;

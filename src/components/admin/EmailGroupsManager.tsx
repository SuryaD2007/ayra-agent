import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, Mail, Trash2 } from 'lucide-react';

interface EmailGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  email: string;
  name: string;
}

export default function EmailGroupsManager() {
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadMembers(selectedGroup);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    const { data } = await supabase
      .from('email_groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setGroups(data);
  };

  const loadMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('email_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) setMembers(data);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('email_groups')
      .insert({
        name: newGroupName,
        description: newGroupDesc,
        user_id: user.id,
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Group created',
        description: `${newGroupName} has been created`,
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setIsNewGroupOpen(false);
      loadGroups();
    }
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase
      .from('email_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Group deleted',
      });
      if (selectedGroup === groupId) {
        setSelectedGroup(null);
        setMembers([]);
      }
      loadGroups();
    }
  };

  const addMember = async () => {
    if (!selectedGroup || !newMemberEmail.trim()) return;

    const { error } = await supabase
      .from('email_group_members')
      .insert({
        group_id: selectedGroup,
        email: newMemberEmail,
        name: newMemberName || null,
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Member added',
        description: `${newMemberEmail} has been added to the group`,
      });
      setNewMemberEmail('');
      setNewMemberName('');
      setIsAddMemberOpen(false);
      loadMembers(selectedGroup);
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('email_group_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Member removed',
      });
      if (selectedGroup) loadMembers(selectedGroup);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Groups</CardTitle>
              <CardDescription>Manage recipient groups</CardDescription>
            </div>
            <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Email Group</DialogTitle>
                  <DialogDescription>
                    Create a new group to organize your email recipients
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., Newsletter Subscribers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-desc">Description (Optional)</Label>
                    <Textarea
                      id="group-desc"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="What is this group for?"
                    />
                  </div>
                  <Button onClick={createGroup} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                  selectedGroup === group.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedGroup(group.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <h4 className="font-medium">{group.name}</h4>
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGroup(group.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No groups yet. Create your first group to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Group Members</CardTitle>
              <CardDescription>
                {selectedGroup ? 'Manage members in this group' : 'Select a group to view members'}
              </CardDescription>
            </div>
            {selectedGroup && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                    <DialogDescription>Add a new member to this group</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-email">Email Address</Label>
                      <Input
                        id="member-email"
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="member@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-name">Name (Optional)</Label>
                      <Input
                        id="member-name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <Button onClick={addMember} className="w-full">
                      Add Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {selectedGroup ? (
              members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-lg border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{member.name || member.email}</p>
                        {member.name && (
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members in this group yet.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a group to view its members
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

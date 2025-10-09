import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send } from 'lucide-react';

interface EmailGroup {
  id: string;
  name: string;
  description: string;
}

export default function BulkEmailComposer() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'group'>('all');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const { toast } = useToast();

  // Load groups when component mounts
  useState(() => {
    const loadGroups = async () => {
      const { data } = await supabase
        .from('email_groups')
        .select('*')
        .order('name');
      if (data) setGroups(data);
    };
    loadGroups();
  });

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both subject and body',
        variant: 'destructive',
      });
      return;
    }

    if (recipientType === 'group' && !selectedGroup) {
      toast({
        title: 'No group selected',
        description: 'Please select a group to send to',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let recipients: Array<{ email: string; name: string }> = [];

      if (recipientType === 'all') {
        // Get all users from profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, name');
        recipients = profiles || [];
      } else {
        // Get group members
        const { data: members } = await supabase
          .from('email_group_members')
          .select('email, name')
          .eq('group_id', selectedGroup);
        recipients = members || [];
      }

      if (recipients.length === 0) {
        toast({
          title: 'No recipients',
          description: 'No recipients found to send to',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Send emails to all recipients
      const promises = recipients.map((recipient) =>
        supabase.functions.invoke('send-notification', {
          body: {
            userId: 'bulk-send',
            email: recipient.email,
            notificationType: 'bulk',
            subject,
            body: body.replace(/\n/g, '<br>'),
          },
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Emails sent!',
        description: `Successfully sent ${recipients.length} email(s)`,
      });

      // Clear form
      setSubject('');
      setBody('');
      setSelectedGroup('');
    } catch (error: any) {
      console.error('Error sending bulk emails:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send emails',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Bulk Email</CardTitle>
        <CardDescription>
          Send custom emails to all users or specific groups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient-type">Send To</Label>
          <Select value={recipientType} onValueChange={(value: 'all' | 'group') => setRecipientType(value)}>
            <SelectTrigger id="recipient-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="group">Specific Group</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recipientType === 'group' && (
          <div className="space-y-2">
            <Label htmlFor="group">Select Group</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            placeholder="Write your email message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="resize-none"
          />
        </div>

        <Button onClick={handleSend} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

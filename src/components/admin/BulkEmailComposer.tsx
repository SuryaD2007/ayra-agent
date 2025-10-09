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
  const [recipientType, setRecipientType] = useState<'all' | 'group' | 'individual'>('all');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [individualEmail, setIndividualEmail] = useState('');
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

    if (recipientType === 'individual' && !individualEmail.trim()) {
      toast({
        title: 'No email provided',
        description: 'Please enter an email address',
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
      } else if (recipientType === 'group') {
        // Get group members
        const { data: members } = await supabase
          .from('email_group_members')
          .select('email, name')
          .eq('group_id', selectedGroup);
        recipients = members || [];
      } else {
        // Individual recipient
        recipients = [{ email: individualEmail, name: 'User' }];
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
      setIndividualEmail('');
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
    <Card className="glass-panel border-border/50 animate-fade-in">
      <CardHeader className="border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Compose Email</CardTitle>
            <CardDescription>
              Send custom emails to users, groups, or individuals
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="recipient-type" className="text-sm font-medium">Send To</Label>
          <Select value={recipientType} onValueChange={(value: 'all' | 'group' | 'individual') => setRecipientType(value)}>
            <SelectTrigger id="recipient-type" className="transition-all duration-300 hover:border-primary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/50 z-50">
              <SelectItem value="all" className="cursor-pointer transition-colors">
                📢 All Users
              </SelectItem>
              <SelectItem value="group" className="cursor-pointer transition-colors">
                👥 Specific Group
              </SelectItem>
              <SelectItem value="individual" className="cursor-pointer transition-colors">
                👤 Individual
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recipientType === 'group' && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="group" className="text-sm font-medium">Select Group</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger id="group" className="transition-all duration-300 hover:border-primary/50">
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-border/50 z-50">
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id} className="cursor-pointer transition-colors">
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {recipientType === 'individual' && (
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="individual-email" className="text-sm font-medium">Email Address</Label>
            <Input
              id="individual-email"
              type="email"
              placeholder="user@example.com"
              value={individualEmail}
              onChange={(e) => setIndividualEmail(e.target.value)}
              className="transition-all duration-300 hover:border-primary/50 focus:border-primary"
            />
          </div>
        )}

        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="transition-all duration-300 hover:border-primary/50 focus:border-primary"
          />
        </div>

        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="body" className="text-sm font-medium">Message</Label>
          <Textarea
            id="body"
            placeholder="Write your email message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="resize-none transition-all duration-300 hover:border-primary/50 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">Tip: Use HTML tags for formatting</p>
        </div>

        <Button 
          onClick={handleSend} 
          disabled={isLoading} 
          className="w-full transition-all duration-300 hover-glow hover:scale-[1.02] active:scale-[0.98]"
        >
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

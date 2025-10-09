import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send } from 'lucide-react';
import { sendEmailNotification } from '@/utils/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const EmailTester = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSendTest = async () => {
    if (!email || !user) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sendEmailNotification({
        userId: user.id,
        email: email,
        notificationType: 'test',
        subject: '🎉 Test Email from Ayra',
        body: `
          <h1>Success! Your email system is working</h1>
          <p>This is a test email from your Ayra application.</p>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ What's working:</h3>
            <ul>
              <li>Edge function is running correctly</li>
              <li>Resend API key is configured</li>
              <li>Email delivery is successful</li>
              <li>Database logging is active</li>
            </ul>
          </div>
          <p>You can now send emails to your users!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Sent from your Ayra Admin Dashboard
          </p>
        `,
      });

      if (result.success) {
        toast({
          title: 'Email Sent! 📧',
          description: `Test email sent to ${email}. Check your inbox!`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send email',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email System Tester
        </CardTitle>
        <CardDescription>
          Send a test email to verify your Resend integration is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Send test email to:</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="your-email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Note: With the test domain, you can only send to the email address you used to sign up for Resend
          </p>
        </div>

        <Button 
          onClick={handleSendTest} 
          disabled={loading || !email}
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>

        <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
          <p className="font-medium mb-2">📝 What happens when you click send:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Calls the send-notification edge function</li>
            <li>Sends email via Resend API</li>
            <li>Records the email in your database</li>
            <li>You'll see it in the Notifications tab above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTester;

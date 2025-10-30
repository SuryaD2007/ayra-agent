import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, ExternalLink, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const googleOAuthSchema = z.object({
  clientId: z.string()
    .trim()
    .min(1, { message: "Client ID is required" })
    .regex(/^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/, {
      message: "Invalid Client ID format. Should end with .apps.googleusercontent.com"
    }),
  clientSecret: z.string()
    .trim()
    .min(1, { message: "Client Secret is required" })
    .min(20, { message: "Client Secret seems too short" })
    .max(100, { message: "Client Secret is too long" })
});

export const GoogleOAuthSettings = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<{ clientId?: string; clientSecret?: string }>({});
  const { toast } = useToast();

  const projectId = 'plfhckjnpaehmlicazyx';
  const redirectUri = `https://${projectId}.supabase.co/functions/v1/google-oauth-callback`;

  const handleValidate = () => {
    try {
      googleOAuthSchema.parse({ clientId, clientSecret });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { clientId?: string; clientSecret?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'clientId') newErrors.clientId = err.message;
          if (err.path[0] === 'clientSecret') newErrors.clientSecret = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const copyRedirectUri = () => {
    copyToClipboard(redirectUri, 'Redirect URI');
  };

  const handleCopyForSupabase = () => {
    if (!handleValidate()) {
      toast({
        title: 'Validation Failed',
        description: 'Please fix the errors before copying',
        variant: 'destructive',
      });
      return;
    }

    const instructions = `Add these secrets in Supabase Dashboard:

Secret Name: GOOGLE_CLIENT_ID
Value: ${clientId}

Secret Name: GOOGLE_CLIENT_SECRET
Value: ${clientSecret}

Then click "Connect Google Drive" or "Connect Google Calendar" to test!`;

    copyToClipboard(instructions, 'Setup instructions');
    
    toast({
      title: 'Instructions Copied!',
      description: 'Now paste them in your Supabase Edge Functions Secrets page',
      duration: 5000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google OAuth Configuration</CardTitle>
        <CardDescription>
          Set up Google OAuth credentials for Drive and Calendar integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Create OAuth Credentials */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </div>
            <h3 className="font-semibold">Create OAuth 2.0 Credentials</h3>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to Google Cloud Console</li>
                <li>Create or select a project</li>
                <li>Enable Google Drive API and Google Calendar API</li>
                <li>Go to Credentials → Create OAuth 2.0 Client ID</li>
                <li>Application type: Web application</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Google Cloud Console
          </Button>
        </div>

        {/* Step 2: Configure Redirect URI */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </div>
            <h3 className="font-semibold">Add Authorized Redirect URI</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirect-uri">Use this Redirect URI in Google Cloud Console:</Label>
            <div className="flex gap-2">
              <Input
                id="redirect-uri"
                value={redirectUri}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyRedirectUri} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3: Enter Credentials */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </div>
            <h3 className="font-semibold">Enter Your Credentials</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                placeholder="123456789-abc123.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  if (errors.clientId) setErrors({ ...errors, clientId: undefined });
                }}
                className={errors.clientId ? 'border-destructive' : ''}
              />
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-secret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="client-secret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="GOCSPX-..."
                  value={clientSecret}
                  onChange={(e) => {
                    setClientSecret(e.target.value);
                    if (errors.clientSecret) setErrors({ ...errors, clientSecret: undefined });
                  }}
                  className={errors.clientSecret ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.clientSecret && (
                <p className="text-sm text-destructive">{errors.clientSecret}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Add to Supabase */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              4
            </div>
            <h3 className="font-semibold">Add to Supabase Secrets</h3>
          </div>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Click the button below to copy setup instructions, then paste them in your Supabase Edge Functions Secrets page.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyForSupabase}
              className="flex-1"
              disabled={!clientId || !clientSecret}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy for Supabase
            </Button>
            <Button
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/settings/functions`, '_blank')}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase Secrets
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Note:</strong> Your credentials are never stored in this app. You must manually add them to Supabase Edge Functions Secrets for security.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
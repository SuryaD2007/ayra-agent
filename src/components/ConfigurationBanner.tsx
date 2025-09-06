import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ConfigurationBannerProps {
  missingKeys: string[];
  onDismiss?: () => void;
}

const ConfigurationBanner: React.FC<ConfigurationBannerProps> = ({ missingKeys, onDismiss }) => {
  if (missingKeys.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/90 backdrop-blur-sm">
      <Alert variant="destructive" className="rounded-none border-0 bg-transparent">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="flex items-center justify-between w-full">
          <div className="flex-1">
            <strong>Configuration Error:</strong> Missing required Supabase configuration: {missingKeys.join(', ')}
            <br />
            <span className="text-sm opacity-90">
              Please check your Supabase client configuration in src/integrations/supabase/client.ts
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-background/10 border-background/20 text-foreground hover:bg-background/20"
              asChild
            >
              <a 
                href="https://docs.lovable.dev/tips-tricks/troubleshooting" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Help
              </a>
            </Button>
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDismiss}
                className="text-foreground hover:bg-background/20"
              >
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ConfigurationBanner;
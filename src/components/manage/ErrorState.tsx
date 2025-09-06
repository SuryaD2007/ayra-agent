import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  message, 
  onRetry, 
  retrying = false 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-left">
          <strong className="font-semibold">Failed to load items</strong>
          <br />
          <span className="text-sm opacity-90">{message}</span>
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col items-center gap-4">
        <div className="text-muted-foreground">
          <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            There was a problem loading your items. Please check your connection and try again.
          </p>
        </div>
        
        <Button 
          onClick={onRetry}
          disabled={retrying}
          variant="outline"
          className="min-w-[120px]"
        >
          {retrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message: string;
  onSignIn: () => void;
}

const InlineError = ({ message, onSignIn }: InlineErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 rounded-lg bg-destructive/5">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-destructive mb-2">Authentication Required</h3>
      <p className="text-muted-foreground text-center mb-4">{message}</p>
      <Button onClick={onSignIn} variant="default">
        Sign in
      </Button>
    </div>
  );
};

export default InlineError;
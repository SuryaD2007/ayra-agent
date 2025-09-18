import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface PreLaunchGuardProps {
  children: React.ReactNode;
}

const PreLaunchGuard = ({ children }: PreLaunchGuardProps) => {
  // For now, always redirect to landing page
  // You can later add logic to check if user has special access
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <Rocket className="h-16 w-16 text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
        <p className="text-muted-foreground mb-8">
          We're preparing something amazing for you. Join our waitlist to be the first to know when we launch!
        </p>
        <Button 
          onClick={() => window.location.href = '/'}
          size="lg"
          className="min-w-[120px]"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Join Waitlist
        </Button>
      </div>
    </div>
  );
};

export default PreLaunchGuard;
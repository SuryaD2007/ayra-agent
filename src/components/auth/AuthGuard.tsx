import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

interface AuthGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const AuthGuard = ({ 
  children, 
  title = "Sign in required",
  description = "Please sign in to access this page."
}: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <LogIn className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>
            <p className="text-muted-foreground mb-8">{description}</p>
            <Button 
              onClick={() => setAuthModalOpen(true)}
              size="lg"
              className="min-w-[120px]"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Button>
          </div>
        </div>
        
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
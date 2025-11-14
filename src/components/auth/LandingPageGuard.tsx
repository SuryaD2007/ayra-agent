import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isElectron } from '@/utils/isElectron';

interface LandingPageGuardProps {
  children: React.ReactNode;
}

const LandingPageGuard = ({ children }: LandingPageGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to /manage if user is authenticated or in Electron app
  if (user || isElectron()) {
    return <Navigate to="/manage" replace />;
  }

  return <>{children}</>;
};

export default LandingPageGuard;

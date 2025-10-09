import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles, UserRole } from '@/hooks/useRoles';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

const RoleGuard = ({ children, allowedRoles, redirectTo = '/' }: RoleGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, hasRole } = useRoles();

  if (authLoading || rolesLoading) {
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
    return <Navigate to={redirectTo} replace />;
  }

  const hasRequiredRole = allowedRoles.some(role => hasRole(role));

  if (!hasRequiredRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-8">
            You don't have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
          <p className="text-sm text-muted-foreground">
            Your current roles: {roles.length > 0 ? roles.join(', ') : 'none'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, User } from 'lucide-react';
import { UserRole } from '@/hooks/useRoles';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

const RoleBadge = ({ role, size = 'md' }: RoleBadgeProps) => {
  const getIcon = () => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-3 w-3" />;
      case 'moderator':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant()} className="gap-1">
      {getIcon()}
      <span className="capitalize">{role}</span>
    </Badge>
  );
};

export default RoleBadge;

// src/components/ProtectedActions.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { ReactNode } from 'react';

interface ProtectedActionProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRoles?: ('Student' | 'Admin' | 'Moderator')[];
  fallback?: ReactNode;
  className?: string;
}

export const ProtectedAction: React.FC<ProtectedActionProps> = ({
  children,
  requireAuth = true,
  requiredRoles = [],
  fallback = null,
  className
}) => {
  const { user, userProfile, loading } = useAuth();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Check authentication
  if (requireAuth && !user) {
    return fallback;
  }

  // Check role-based permissions
  if (requiredRoles.length > 0 && userProfile) {
    const hasRequiredRole = requiredRoles.includes(userProfile.role);
    
    if (!hasRequiredRole) {
      return fallback;
    }
  }

  return <div className={className}>{children}</div>;
};

interface ProtectedButtonProps {
  onClick: () => void;
  children: ReactNode;
  requireAuth?: boolean;
  requiredRoles?: ('Student' | 'Admin' | 'Moderator')[];
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  onClick,
  children,
  requireAuth = true,
  requiredRoles = [],
  variant = 'default',
  size = 'default',
  className,
  disabled = false
}) => {
  const { user, userProfile, loading } = useAuth();

  // Don't render while loading
  if (loading) {
    return null;
  }

  // Check authentication
  if (requireAuth && !user) {
    return (
      <Button 
        variant="outline" 
        size={size} 
        className={className}
        disabled
        title="Authentication required"
      >
        <Shield className="w-4 h-4 mr-2" />
        Sign In Required
      </Button>
    );
  }

  // Check role-based permissions
  if (requiredRoles.length > 0 && userProfile) {
    const hasRequiredRole = requiredRoles.includes(userProfile.role);
    
    if (!hasRequiredRole) {
      return (
        <Button 
          variant="outline" 
          size={size} 
          className={className}
          disabled
          title={`Required role: ${requiredRoles.join(' or ')}`}
        >
          <Shield className="w-4 h-4 mr-2" />
          Insufficient Permissions
        </Button>
      );
    }
  }

  return (
    <Button 
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

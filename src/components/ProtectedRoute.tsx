// src/components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: ('Student' | 'Admin' | 'Moderator')[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRoles = [],
  fallback
}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push('/login');
    }
  }, [user, loading, requireAuth, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be logged in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based permissions
  if (requiredRoles.length > 0 && userProfile) {
    const hasRequiredRole = requiredRoles.includes(userProfile.role);
    
    if (!hasRequiredRole) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-96">
            <CardHeader className="text-center">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have the required permissions to access this page.
                Required role(s): {requiredRoles.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Your current role: {userProfile.role}
              </p>
              <Button onClick={() => router.back()} variant="outline" className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Higher-order component for easier usage
export const withAuth = (
  WrappedComponent: React.ComponentType<any>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  return function WithAuthComponent(props: any) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

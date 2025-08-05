import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthWithRole, UserRole } from '@/hooks/useAuthWithRole';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function RoleBasedRedirect({ 
  children, 
  allowedRoles = [], 
  redirectTo 
}: RoleBasedRedirectProps) {
  const { user, role, loading } = useAuthWithRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to auth page
    if (!user) {
      navigate('/auth', { 
        state: { returnTo: location.pathname } 
      });
      return;
    }

    // If user has role and it's not allowed for this component
    if (role && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      // Redirect based on user role
      const defaultRedirect = role === 'cliente' ? '/painel-cliente' : '/painel-delivery';
      console.log(`🔄 [RoleBasedRedirect] Redirecting ${role} to ${defaultRedirect}`);
      navigate(redirectTo || defaultRedirect, { replace: true });
      return;
    }

    // If user has role but no specific redirect rules, redirect to appropriate dashboard
    if (role && location.pathname === '/dashboard') {
      const dashboardPath = role === 'cliente' ? '/painel-cliente' : '/painel-delivery';
      navigate(dashboardPath);
      return;
    }
  }, [user, role, loading, navigate, location.pathname, allowedRoles, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If user is not authenticated, don't render children
  if (!user) {
    return null;
  }

  // If role is required but not loaded yet, show loading
  if (allowedRoles.length > 0 && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If role is not allowed, don't render children
  if (role && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}